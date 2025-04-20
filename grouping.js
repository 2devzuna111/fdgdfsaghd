// Direct group joining functionality that bypasses the popup.js complexity
document.addEventListener('DOMContentLoaded', function() {
    console.log('grouping.js loaded');
    
    // Get direct references to group elements
    const joinGroupBtn = document.getElementById('joinGroup');
    const groupIdInput = document.getElementById('groupIdInput');
    const groupStatus = document.getElementById('groupStatus');
    const groupDisplay = document.getElementById('groupDisplay');
    
    // Simple status message function
    function showStatus(element, message, type) {
        if (!element) return;
        
        element.textContent = message;
        element.className = 'status ' + (type || '');
        element.style.display = 'block';
        
        console.log('Status:', message, type);
        
        if (type !== 'pending') {
            setTimeout(() => {
                element.style.display = 'none';
            }, 3000);
        }
    }
    
    // Update group display
    function updateGroupDisplay() {
        if (!groupDisplay) return;
        
        chrome.storage.local.get(['groupId'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error getting group ID:', chrome.runtime.lastError);
                return;
            }
            
            const groupId = result.groupId;
            groupDisplay.textContent = groupId ? `Group: ${groupId}` : 'No Group';
        });
    }
    
    // Join group functionality
    if (joinGroupBtn) {
        joinGroupBtn.addEventListener('click', function() {
            if (!groupIdInput) return;
            
            const groupId = groupIdInput.value.trim();
            
            if (!groupId) {
                showStatus(groupStatus, 'Please enter a group ID', 'error');
                return;
            }
            
            showStatus(groupStatus, 'Joining group...', 'pending');
            
            // First check if we have a username
            chrome.storage.local.get(['username'], function(result) {
                if (chrome.runtime.lastError) {
                    showStatus(groupStatus, 'Error: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }
                
                if (!result.username) {
                    showStatus(groupStatus, 'Please set a username in the User Profile section first', 'error');
                    return;
                }
                
                // Save group ID to storage
                chrome.storage.local.set({ groupId: groupId }, function() {
                    if (chrome.runtime.lastError) {
                        showStatus(groupStatus, 'Error saving group ID: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    // Try to notify background script
                    try {
                        chrome.runtime.sendMessage({
                            action: 'joinGroup',
                            groupId: groupId
                        }, function(response) {
                            // We don't need to check the response, the storage update is the important part
                            console.log('Background script response:', response);
                        });
                    } catch (e) {
                        console.warn('Error sending message to background script:', e);
                        // Continue anyway since we've updated storage
                    }
                    
                    // Update group display
                    updateGroupDisplay();
                    
                    // Update user profile section
                    const profileGroupIdInput = document.getElementById('groupId');
                    if (profileGroupIdInput) {
                        profileGroupIdInput.value = groupId;
                    }
                    
                    // Clear input and show success
                    groupIdInput.value = '';
                    showStatus(groupStatus, 'Successfully joined group!', 'success');
                });
            });
        });
    }
    
    // Update group display on load
    updateGroupDisplay();
}); 