// Initialize user data from storage
async function initializeUserData() {
    try {
        const userData = await chrome.storage.local.get(['username', 'userAvatar']);
        
        if (userData.username) {
            document.getElementById('userStatus').textContent = userData.username;
        }
        
        if (userData.userAvatar && userData.userAvatar.length > 0) {
            const avatarElement = document.getElementById('userAvatar');
            avatarElement.textContent = userData.username ? userData.username.charAt(0).toUpperCase() : '?';
        }
    } catch (error) {
        console.error('Error initializing user data:', error);
    }
}

// Fetch tracker data from storage or API
async function fetchTrackerData() {
    try {
        // In a real implementation, this would fetch data from an API or storage
        // For now, we'll use the example data that's already in the HTML
        
        // Example of how to fetch from storage:
        // const trackerData = await chrome.storage.local.get(['caTrackers', 'streamflowLocks', 'truthTrackers']);
        
        // If we wanted to update the UI with this data:
        // updateTrackersUI(trackerData);
    } catch (error) {
        console.error('Error fetching tracker data:', error);
    }
}

// Handle copy button clicks
function setupCopyButtons() {
    const copyButtons = document.querySelectorAll('.copy-btn');
    
    copyButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Find the address text in the parent element
            const addressElement = button.parentElement.querySelector('.address');
            
            if (addressElement) {
                const addressText = addressElement.textContent.trim();
                
                // Create a hidden textarea element to copy from
                const textarea = document.createElement('textarea');
                textarea.value = addressText;
                textarea.style.position = 'absolute';
                textarea.style.left = '-9999px';
                document.body.appendChild(textarea);
                
                // Select and copy the text
                textarea.select();
                document.execCommand('copy');
                
                // Remove the textarea
                document.body.removeChild(textarea);
                
                // Show feedback
                const originalHTML = button.innerHTML;
                button.innerHTML = `
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                    </svg>
                `;
                
                setTimeout(() => {
                    button.innerHTML = originalHTML;
                }, 1500);
            }
        });
    });
}

// Setup action buttons
function setupActionButtons() {
    const addNewButton = document.querySelector('.action-button:nth-child(2)');
    if (addNewButton) {
        addNewButton.addEventListener('click', () => {
            showAddTrackerDialog();
        });
    }
}

// Show dialog to add a new tracker
function showAddTrackerDialog() {
    // Create dialog element
    const dialog = document.createElement('div');
    dialog.className = 'tracker-dialog';
    dialog.innerHTML = `
        <div class="dialog-content">
            <div class="dialog-header">
                <h3>Add New Tracker</h3>
                <button class="close-button">×</button>
            </div>
            <div class="dialog-body">
                <div class="form-group">
                    <label for="tokenName">Token Name</label>
                    <input type="text" id="tokenName" placeholder="Enter token name">
                </div>
                <div class="form-group">
                    <label for="contractAddress">Contract Address</label>
                    <input type="text" id="contractAddress" placeholder="Enter contract address">
                </div>
                <div class="form-group">
                    <label for="trackerType">Tracker Type</label>
                    <select id="trackerType">
                        <option value="ca">CA Tracker</option>
                        <option value="streamflow">Streamflow Lock</option>
                        <option value="truth">Truth Tracker</option>
                    </select>
                </div>
            </div>
            <div class="dialog-footer">
                <button class="cancel-button">Cancel</button>
                <button class="save-button">Add Tracker</button>
            </div>
        </div>
    `;
    
    // Add styles for the dialog
    const style = document.createElement('style');
    style.textContent = `
        .tracker-dialog {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
        }
        
        .dialog-content {
            background-color: var(--bg-secondary);
            border-radius: var(--radius-lg);
            width: 400px;
            max-width: 90%;
            box-shadow: var(--shadow-lg);
            overflow: hidden;
        }
        
        .dialog-header {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 16px 20px;
            background-color: var(--bg-tertiary);
            border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .dialog-header h3 {
            margin: 0;
            font-size: 16px;
            font-weight: 600;
        }
        
        .close-button {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 20px;
            cursor: pointer;
        }
        
        .close-button:hover {
            color: var(--text-primary);
        }
        
        .dialog-body {
            padding: 20px;
        }
        
        .form-group {
            margin-bottom: 16px;
        }
        
        .form-group label {
            display: block;
            margin-bottom: 8px;
            font-size: 14px;
            color: var(--text-secondary);
        }
        
        .form-group input,
        .form-group select {
            width: 100%;
            padding: 10px 12px;
            background-color: var(--bg-primary);
            border: 1px solid var(--bg-tertiary);
            border-radius: var(--radius-md);
            color: var(--text-primary);
            font-size: 14px;
        }
        
        .form-group input:focus,
        .form-group select:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .dialog-footer {
            display: flex;
            justify-content: flex-end;
            padding: 16px 20px;
            background-color: var(--bg-tertiary);
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            gap: 12px;
        }
        
        .cancel-button,
        .save-button {
            padding: 8px 16px;
            border-radius: var(--radius-md);
            font-size: 14px;
            cursor: pointer;
            transition: var(--transition);
        }
        
        .cancel-button {
            background-color: transparent;
            border: 1px solid var(--bg-hover);
            color: var(--text-secondary);
        }
        
        .cancel-button:hover {
            background-color: var(--bg-hover);
            color: var(--text-primary);
        }
        
        .save-button {
            background-color: var(--accent);
            border: none;
            color: #000;
            font-weight: 500;
        }
        
        .save-button:hover {
            background-color: var(--accent-hover);
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(dialog);
    
    // Add event listeners
    const closeButton = dialog.querySelector('.close-button');
    const cancelButton = dialog.querySelector('.cancel-button');
    const saveButton = dialog.querySelector('.save-button');
    
    function closeDialog() {
        document.body.removeChild(dialog);
    }
    
    closeButton.addEventListener('click', closeDialog);
    cancelButton.addEventListener('click', closeDialog);
    
    saveButton.addEventListener('click', () => {
        const tokenName = document.getElementById('tokenName').value;
        const contractAddress = document.getElementById('contractAddress').value;
        const trackerType = document.getElementById('trackerType').value;
        
        if (tokenName && contractAddress) {
            // Save the tracker data
            saveNewTracker(tokenName, contractAddress, trackerType);
            closeDialog();
        }
    });
}

// Save a new tracker
async function saveNewTracker(name, address, type) {
    try {
        // In a real implementation, this would save the data to storage or API
        console.log('Saving new tracker:', { name, address, type });
        
        // Example of how to save to storage:
        // await chrome.storage.local.get([type + 'Trackers'], (result) => {
        //     const trackers = result[type + 'Trackers'] || [];
        //     trackers.push({ name, address, addedAt: new Date().toISOString() });
        //     chrome.storage.local.set({ [type + 'Trackers']: trackers });
        // });
        
        // For demo purposes, we'll just reload the page to simulate refreshing the data
        // In a real implementation, you would update the UI directly
        // location.reload();
        
        // Show a success message
        showNotification('Tracker added successfully!', 'success');
    } catch (error) {
        console.error('Error saving tracker:', error);
        showNotification('Failed to add tracker.', 'error');
    }
}

// Show a notification
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Add styles for the notification
    const style = document.createElement('style');
    style.textContent = `
        .notification {
            position: fixed;
            bottom: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: var(--radius-md);
            color: white;
            font-size: 14px;
            box-shadow: var(--shadow-md);
            z-index: 1000;
            opacity: 0;
            transform: translateY(10px);
            animation: notification-appear 0.3s forwards, notification-disappear 0.3s 2.7s forwards;
        }
        
        .notification-success {
            background-color: var(--success);
        }
        
        .notification-error {
            background-color: var(--error);
        }
        
        .notification-info {
            background-color: #3b82f6;
        }
        
        @keyframes notification-appear {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        @keyframes notification-disappear {
            to {
                opacity: 0;
                transform: translateY(10px);
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(notification);
    
    // Remove the notification after animation completes
    setTimeout(() => {
        document.body.removeChild(notification);
    }, 3000);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeUserData();
    fetchTrackerData();
    setupCopyButtons();
    setupActionButtons();
    
    // Setup navigation
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.getAttribute('href') === 'popup.html') {
                e.preventDefault();
                chrome.runtime.sendMessage({ action: 'openPopup' });
            }
        });
    });
});

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'refreshTrackers') {
        fetchTrackerData();
    }
}); 