// Direct webhook management functionality that bypasses the popup.js complexity
document.addEventListener('DOMContentLoaded', function() {
    console.log('webhook.js loaded');
    
    // Get direct references to webhook elements
    const testWebhookBtn = document.getElementById('testWebhook');
    const addWebhookBtn = document.getElementById('addWebhook');
    const webhookNameInput = document.getElementById('webhookName');
    const webhookUrlInput = document.getElementById('webhookUrl');
    const webhookStatus = document.getElementById('webhookStatus');
    const webhooksList = document.getElementById('webhooksList');
    
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
    
    // Load webhooks from storage and display them
    function loadWebhooks() {
        if (!webhooksList) return;
        
        chrome.storage.local.get(['webhooks'], function(result) {
            if (chrome.runtime.lastError) {
                console.error('Error loading webhooks:', chrome.runtime.lastError);
                return;
            }
            
            webhooksList.innerHTML = '';
            
            const webhooks = result.webhooks || {};
            
            if (Object.keys(webhooks).length === 0) {
                const noWebhooksMsg = document.createElement('div');
                noWebhooksMsg.className = 'no-webhooks';
                noWebhooksMsg.textContent = 'No webhooks added yet.';
                webhooksList.appendChild(noWebhooksMsg);
                return;
            }
            
            for (const [name, url] of Object.entries(webhooks)) {
                const webhookItem = document.createElement('div');
                webhookItem.className = 'webhook-item';
                
                const nameEl = document.createElement('div');
                nameEl.className = 'webhook-name';
                nameEl.textContent = name;
                
                const urlEl = document.createElement('div');
                urlEl.className = 'webhook-url';
                urlEl.textContent = url;
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'delete-webhook';
                deleteBtn.textContent = 'Delete';
                deleteBtn.addEventListener('click', function() {
                    if (confirm(`Delete webhook "${name}"?`)) {
                        delete webhooks[name];
                        
                        chrome.storage.local.set({ webhooks }, function() {
                            if (chrome.runtime.lastError) {
                                showStatus(webhookStatus, 'Error deleting webhook: ' + chrome.runtime.lastError.message, 'error');
                                return;
                            }
                            
                            loadWebhooks();
                            showStatus(webhookStatus, 'Webhook deleted!', 'success');
                        });
                    }
                });
                
                webhookItem.appendChild(nameEl);
                webhookItem.appendChild(urlEl);
                webhookItem.appendChild(deleteBtn);
                
                webhooksList.appendChild(webhookItem);
            }
        });
    }
    
    // Add webhook functionality
    if (addWebhookBtn) {
        addWebhookBtn.addEventListener('click', function() {
            if (!webhookNameInput || !webhookUrlInput) return;
            
            const name = webhookNameInput.value.trim();
            const url = webhookUrlInput.value.trim();
            
            if (!name) {
                showStatus(webhookStatus, 'Please enter a webhook name', 'error');
                return;
            }
            
            if (!url) {
                showStatus(webhookStatus, 'Please enter a webhook URL', 'error');
                return;
            }
            
            if (!url.startsWith('https://discord.com/api/webhooks/')) {
                showStatus(webhookStatus, 'Please enter a valid Discord webhook URL', 'error');
                return;
            }
            
            showStatus(webhookStatus, 'Adding webhook...', 'pending');
            
            // Get current webhooks
            chrome.storage.local.get(['webhooks'], function(result) {
                if (chrome.runtime.lastError) {
                    showStatus(webhookStatus, 'Error: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }
                
                const webhooks = result.webhooks || {};
                
                // Check if webhook with same name already exists
                if (webhooks[name] && !confirm(`Webhook "${name}" already exists. Update it?`)) {
                    showStatus(webhookStatus, 'Webhook not added.', 'error');
                    return;
                }
                
                // Add/update webhook
                webhooks[name] = url;
                
                // Save to storage
                chrome.storage.local.set({ webhooks }, function() {
                    if (chrome.runtime.lastError) {
                        showStatus(webhookStatus, 'Error saving webhook: ' + chrome.runtime.lastError.message, 'error');
                        return;
                    }
                    
                    // Clear inputs and show success
                    webhookNameInput.value = '';
                    webhookUrlInput.value = '';
                    showStatus(webhookStatus, 'Webhook added!', 'success');
                    
                    // Reload webhooks list
                    loadWebhooks();
                });
            });
        });
    }
    
    // Test webhook functionality
    if (testWebhookBtn) {
        testWebhookBtn.addEventListener('click', function() {
            if (!webhookUrlInput) return;
            
            const url = webhookUrlInput.value.trim();
            
            if (!url) {
                showStatus(webhookStatus, 'Please enter a webhook URL to test', 'error');
                return;
            }
            
            if (!url.startsWith('https://discord.com/api/webhooks/')) {
                showStatus(webhookStatus, 'Please enter a valid Discord webhook URL', 'error');
                return;
            }
            
            showStatus(webhookStatus, 'Testing webhook...', 'pending');
            
            // Send test message to webhook
            chrome.runtime.sendMessage({
                action: 'testWebhook',
                url: url
            }, function(response) {
                if (chrome.runtime.lastError) {
                    showStatus(webhookStatus, 'Error: ' + chrome.runtime.lastError.message, 'error');
                    return;
                }
                
                if (response && response.success) {
                    showStatus(webhookStatus, 'Webhook test successful!', 'success');
                } else {
                    showStatus(webhookStatus, response ? response.error : 'Webhook test failed', 'error');
                }
            });
        });
    }
    
    // Load webhooks on initial load
    loadWebhooks();
}); 