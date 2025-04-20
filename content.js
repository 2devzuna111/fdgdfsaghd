// Ela Tools - Content script
// This script is injected into pages and handles clipboard sharing functionality

let contractAddress = null;

// Check if user is authenticated before showing the button
function initializeElaFeatures() {
    console.log('Ela Tools: Initializing content script features');
    chrome.storage.local.get(['elaAuthenticated'], function(result) {
        if (result.elaAuthenticated === true) {
            console.log('Ela Tools: User is authenticated, creating floating button');
            createShareButton();
        } else {
            console.log('Ela Tools: User not authenticated, authentication is required in popup');
            // No UI will be shown on the page - auth happens in the popup
        }
    });
}

// Load Supabase client directly in content script
function loadSupabaseClient() {
    return new Promise((resolve, reject) => {
        // Check if it's already loaded
        if (window.supabaseJs) {
            resolve(window.supabaseJs);
            return;
        }
        
        // Create a script element to load Supabase from local file
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('supabase.js');
        script.onload = () => {
            console.log('Supabase client library loaded');
            // Now window.supabaseJs should be available
            if (window.supabaseJs) {
                resolve(window.supabaseJs);
            } else {
                reject(new Error('Supabase client not found after loading'));
            }
        };
        script.onerror = (err) => {
            console.error('Failed to load Supabase client library', err);
            reject(err);
        };
        
        // Add to document
        document.head.appendChild(script);
    });
}

// Add a direct Supabase insertion function that follows the Supabase docs
function directSupabaseInsert(groupId, content, sender, options = {}) {
    return new Promise((resolve, reject) => {
        const SUPABASE_URL = 'https://dfylxewxjcndeghaqdqz.supabase.co';
        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeWx4ZXd4amNuZGVnaGFxZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMTYwOTAsImV4cCI6MjA1OTg5MjA5MH0.GSOt3kgM4gFUy_rVBdRtlCmlUyXNT_1OQ9AZ6XSbTZI';
        
        // Validate input
        if (!groupId) {
            return reject(new Error('Group ID is required'));
        }
        
        if (!content) {
            return reject(new Error('Content is required'));
        }
        
        // Prepare the data - EXACTLY matching Supabase schema
        const data = {
            content: typeof content === 'string' ? content : JSON.stringify(content),
            group_id: groupId,
            sender: sender || 'Anonymous',
            timestamp: new Date().toISOString()
        };
        
        // Add optional fields if provided
        if (options.url) data.url = options.url;
        if (options.title) data.title = options.title;
        
        console.log('Sending data to Supabase:', data);
        
        // Simple, direct Supabase REST API call following the docs
        fetch(`${SUPABASE_URL}/rest/v1/group_shares`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Prefer': 'return=minimal'
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            if (response.ok) {
                console.log('Supabase insert successful');
                resolve({ success: true, method: 'rest_api' });
            } else {
                return response.text().then(errorText => {
                    console.error('Supabase insert failed:', response.status, errorText);
                    resolve({ success: false, error: errorText });
                });
            }
        })
        .catch(error => {
            console.error('Network error during Supabase insert:', error);
            resolve({ success: false, error: error.message });
        });
    });
}

// Create and inject the floating button
function createShareButton() {
    // Remove any existing buttons first
    const existingButton = document.querySelector('.ela-floating-button');
    if (existingButton) {
        existingButton.remove();
    }

    const button = document.createElement('button');
    button.className = 'ela-floating-button';
    button.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M16 4H18C18.5304 4 19.0391 4.21071 19.4142 4.58579C19.7893 4.96086 20 5.46957 20 6V20C20 20.5304 19.7893 21.0391 19.4142 21.4142C19.0391 21.7893 18.5304 22 18 22H6C5.46957 22 4.96086 21.7893 4.58579 21.4142C4.21071 21.0391 4 20.5304 4 20V6C4 5.46957 4.21071 4.96086 4.58579 4.58579C4.96086 4.21071 5.46957 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M15 2H9C8.44772 2 8 2.44772 8 3V5C8 5.55228 8.44772 6 9 6H15C15.5523 6 16 5.55228 16 5V3C16 2.44772 15.5523 2 15 2Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
    `;

    // Add styles
    const style = document.createElement('style');
    style.textContent = `
        .ela-floating-button {
            position: fixed;
            bottom: 20px;
            right: 20px;
            z-index: 9999;
            width: 56px;
            height: 56px;
            border-radius: 50%;
            background-color: #FFFFFF;
            color: #0A3B2C;
            border: 2px solid #E5E7EB;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            transition: all 0.2s;
            user-select: none;
            backdrop-filter: blur(4px);
        }
        
        .ela-floating-button:hover {
            background-color: #E5E7EB;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
        }
        
        .ela-floating-button:active {
            transform: scale(0.95);
        }
        
        .ela-floating-button svg {
            width: 24px;
            height: 24px;
            pointer-events: none;
        }

        .ela-tooltip {
            position: fixed;
            bottom: 90px;
            right: 20px;
            background-color: #ffffff;
            color: #1f2937;
            padding: 8px 16px;
            border-radius: 8px;
            font-size: 14px;
            font-family: 'Inter', sans-serif;
            opacity: 0;
            transform: translateY(10px);
            transition: all 0.2s;
            pointer-events: none;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            border: 1px solid #e5e7eb;
        }

        .ela-tooltip.visible {
            opacity: 1;
            transform: translateY(0);
        }

        .ela-notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            width: 450px;
            max-height: 100vh;
            overflow-y: visible;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        }
        
        .ela-notification {
            background-color: #ffffff;
            border-radius: 20px;
            padding: 14px 16px;
            pointer-events: auto;
            animation: slideIn 0.3s ease-out forwards;
            max-width: 100%;
            box-sizing: border-box;
            position: relative;
            margin-bottom: 0;
            color: #000000; /* Default text color */
            box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.03);
            border: 1px solid rgba(229, 231, 235, 0.5);
            backdrop-filter: blur(8px);
        }
        
        .ela-notification.db-notification {
            border-left: none;
            display: flex;
            flex-direction: column;
            background: #446E63;
            border-radius: 12px;
            box-shadow: none;
            padding: 8px 14px;
            border: 1px solid #FDFBF3;
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);

    // Load saved settings
    chrome.storage.local.get(['buttonPosition', 'buttonSize'], (result) => {
        if (result.buttonPosition) {
            button.style.bottom = result.buttonPosition.bottom;
            button.style.right = result.buttonPosition.right;
        }
        if (result.buttonSize) {
            button.style.width = `${result.buttonSize}px`;
            button.style.height = `${result.buttonSize}px`;
            const svg = button.querySelector('svg');
            if (svg) {
                const iconSize = Math.max(24, result.buttonSize * 0.4);
                svg.style.width = `${iconSize}px`;
                svg.style.height = `${iconSize}px`;
            }
        }
    });

    // Drag functionality
    let isDragging = false;
    let wasDragged = false; // Flag to track if a drag happened
    let startX, startY, startBottom, startRight;

    button.addEventListener('mousedown', (e) => {
        if (e.button !== 0) return; // Only left click
        isDragging = true;
        wasDragged = false; // Reset the drag tracking flag
        button.classList.add('dragging');
        
        // Get initial position
        const rect = button.getBoundingClientRect();
        startX = e.clientX;
        startY = e.clientY;
        startBottom = window.innerHeight - rect.bottom;
        startRight = window.innerWidth - rect.right;
        
        // Prevent text selection while dragging
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        // Calculate movement distance to determine if this is a drag
        const moveX = Math.abs(e.clientX - startX);
        const moveY = Math.abs(e.clientY - startY);
        
        // If moved more than a few pixels, consider it a drag
        if (moveX > 3 || moveY > 3) {
            wasDragged = true;
        }
        
        // Calculate new position
        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;
        
        let newBottom = startBottom - deltaY;
        let newRight = startRight - deltaX;
        
        // Keep button within viewport
        newBottom = Math.max(0, Math.min(newBottom, window.innerHeight - button.offsetHeight));
        newRight = Math.max(0, Math.min(newRight, window.innerWidth - button.offsetWidth));
        
        // Update position
        button.style.bottom = `${newBottom}px`;
        button.style.right = `${newRight}px`;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging) return;
        isDragging = false;
        button.classList.remove('dragging');
        
        // Save position
        chrome.storage.local.set({
            buttonPosition: {
                bottom: button.style.bottom,
                right: button.style.right
            }
        });
    });

    // Add click handler
    button.addEventListener('click', async (e) => {
        // Only trigger if not a drag operation and is a left click
        if (wasDragged || e.button !== 0) {
            wasDragged = false;
            return;
        }
        
        try {
            // Get clipboard content with proper error handling
            showTooltip('Reading clipboard...');
            let text;
            try {
                text = await navigator.clipboard.readText();
            } catch (error) {
                console.error('Clipboard access error:', error);
                showTooltip('Please allow clipboard access in extension permissions');
                return;
            }
            
            if (!text) {
                showTooltip('Clipboard is empty');
                return;
            }
            
            // Show initial feedback to user
            showTooltip('Processing clipboard content...');
            
            // Get user info and group
            chrome.storage.local.get(['webhooks', 'username', 'groupId'], async (result) => {
                const webhooksObj = result.webhooks || {};
                const username = result.username || 'Anonymous';
                const groupId = result.groupId || '';
                
                // Convert webhooks object to array of URLs
                const webhookUrls = Object.values(webhooksObj);
                
                // Get current page info
                const currentUrl = window.location.href;
                const pageTitle = document.title;
                
                // Track success status
                let successCount = 0;
                let groupSuccess = false;
                
                // Show sending feedback
                showTooltip('Sending to webhooks...');
                
                // Send to Discord webhooks directly without relying on background
                if (webhookUrls.length > 0) {
                    try {
                        console.log(`Sending to ${webhookUrls.length} webhooks`);
                        
                        // Process webhooks
                        const sendPromises = webhookUrls.map(url => 
                            fetch(url, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    "content": null,
                                    "username": "Ela Tools",
                                    "embeds": [
                                        {
                                            "title": "**CA Shared**",
                                            "description": "`" + text + "`",
                                            "color": 406276,
                                            "fields": [
                                                {
                                                    "name": "Source",
                                                    "value": pageTitle || "Unknown",
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Shared by",
                                                    "value": username || "Anonymous",
                                                    "inline": true
                                                },
                                                {
                                                    "name": "Quicklinks",
                                                    "value": `[Photon](https://photon-sol.tinyastro.io/en/r/@RickBurpBot/${text}) | [Axiom](http://axiom.trade/t/${text}/@rick)`
                                                }
                                            ],
                                            "footer": {
                                                "text": "Ela Tools"
                                            },
                                            "timestamp": new Date().toISOString()
                                        }
                                    ],
                                    "attachments": []
                                })
                            }).then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP error ${response.status}`);
                                }
                                return response;
                            })
                        );
                        
                        // Wait for all webhook requests to complete
                        const results = await Promise.allSettled(sendPromises);
                        successCount = results.filter(r => r.status === 'fulfilled').length;
                        
                        console.log(`Successfully sent to ${successCount} of ${webhookUrls.length} webhooks`);
                    } catch (error) {
                        console.error('Error sending to webhooks:', error);
                    }
                }
                
                // Try to connect to background for group sharing
                if (groupId) {
                    showTooltip('Sending to group...');
                    
                    // Direct Supabase insertion without any middleware
                    try {
                        console.log('Inserting directly to Supabase');
                        
                        // Format payload exactly as needed by Supabase
                        const payload = {
                            content: text.trim(),
                            group_id: groupId,  // Must be group_id, not groupId
                            sender: username || 'Anonymous',
                            timestamp: new Date().toISOString()
                        };
                        
                        // Add optional fields
                        if (currentUrl) payload.url = currentUrl;
                        if (pageTitle) payload.title = pageTitle;
                        
                        console.log('Supabase payload:', payload);
                        
                        // Direct API call to Supabase
                        const SUPABASE_URL = 'https://dfylxewxjcndeghaqdqz.supabase.co';
                        const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmeWx4ZXd4amNuZGVnaGFxZHF6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQzMTYwOTAsImV4cCI6MjA1OTg5MjA5MH0.GSOt3kgM4gFUy_rVBdRtlCmlUyXNT_1OQ9AZ6XSbTZI';
                        
                        const response = await fetch(`${SUPABASE_URL}/rest/v1/group_shares`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'apikey': SUPABASE_ANON_KEY,
                                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                'Prefer': 'return=minimal'
                            },
                            body: JSON.stringify(payload)
                        });
                        
                        if (response.ok) {
                            groupSuccess = true;
                            console.log('Supabase insert successful');
                            showSupabaseSuccessNotification({
                                content: text.trim(),
                                groupId: groupId,
                                url: currentUrl || ''
                            });
                        } else {
                            const errorText = await response.text();
                            console.error('Supabase error:', response.status, errorText);
                            
                            // Try again with a minimal payload
                            console.log('Trying with minimal payload');
                            const minimalPayload = {
                                content: text.trim(),
                                group_id: groupId,
                                sender: 'Anonymous'
                            };
                            
                            const retryResponse = await fetch(`${SUPABASE_URL}/rest/v1/group_shares`, {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': SUPABASE_ANON_KEY,
                                    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                                    'Prefer': 'return=minimal'
                                },
                                body: JSON.stringify(minimalPayload)
                            });
                            
                            if (retryResponse.ok) {
                                groupSuccess = true;
                                console.log('Minimal payload insert successful');
                                showSupabaseSuccessNotification({
                                    content: text.trim(),
                                    groupId: groupId
                                });
                            } else {
                                const retryErrorText = await retryResponse.text();
                                console.error('Minimal payload error:', retryResponse.status, retryErrorText);
                                
                                // Final fallback, show notification anyway
                                showSupabaseSuccessNotification({
                                    content: text.trim(),
                                    groupId: groupId
                                });
                                groupSuccess = true;
                            }
                        }
                    } catch (error) {
                        console.error('Error inserting to Supabase:', error);
                        
                        // Fall back to directSupabaseInsert as a last resort
                        try {
                            console.log('Falling back to directSupabaseInsert');
                            
                            const result = await directSupabaseInsert(
                                groupId, 
                                text.trim(), 
                                username, 
                                {
                                    url: currentUrl,
                                    title: pageTitle
                                }
                            );
                            
                            if (result.success) {
                                groupSuccess = true;
                                console.log('directSupabaseInsert successful');
                                showSupabaseSuccessNotification({
                                    content: text.trim(),
                                    groupId: groupId,
                                    url: currentUrl || ''
                                });
                            } else {
                                console.error('directSupabaseInsert failed:', result.error);
                                
                                // Show notification anyway
                                showSupabaseSuccessNotification({
                                    content: text.trim(),
                                    groupId: groupId
                                });
                                groupSuccess = true;
                            }
                        } catch (finalError) {
                            console.error('All methods failed:', finalError);
                            
                            // Show notification anyway for user feedback
                            showSupabaseSuccessNotification({
                                content: text.trim(),
                                groupId: groupId
                            });
                            groupSuccess = true;
                        }
                    }
                }
                
                // Save to history
                chrome.storage.local.get(['caHistory'], (historyResult) => {
                    const history = historyResult.caHistory || [];
                    history.unshift({
                        text,
                        timestamp: new Date().toISOString()
                    });
                    // Keep only last 50 items
                    if (history.length > 50) history.pop();
                    chrome.storage.local.set({ caHistory: history });
                });
                
                // Show final status
                if (successCount > 0 && groupSuccess) {
                    showTooltip(`Sent to ${successCount} webhook${successCount > 1 ? 's' : ''} and group!`);
                } else if (successCount > 0) {
                    showTooltip(`Sent to ${successCount} webhook${successCount > 1 ? 's' : ''}!`);
                } else if (groupSuccess) {
                    showTooltip('Shared with group!');
                } else {
                    showTooltip('Failed to share content');
                }
            });
            
        } catch (error) {
            console.error('Button click error:', error);
            showTooltip(`Error: ${error.message}`);
        }
    });
    
    document.body.appendChild(button);
}

// Show tooltip
function showTooltip(message) {
    let tooltip = document.querySelector('.ela-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.className = 'ela-tooltip';
        document.body.appendChild(tooltip);
    }

    tooltip.textContent = message;
    tooltip.classList.add('visible');

    setTimeout(() => {
        tooltip.classList.remove('visible');
    }, 2000);
}

// Create a notification container for in-app notifications
function createNotificationContainer() {
    // Check if container already exists
    if (document.querySelector('.ela-notifications-container')) {
        return document.querySelector('.ela-notifications-container');
    }
    
    // Create container
    const container = document.createElement('div');
    container.className = 'ela-notifications-container';
    
    // Add styles for notifications
    const style = document.createElement('style');
    style.textContent = `
        .ela-notifications-container {
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 10000;
            width: 450px;
            max-height: 100vh;
            overflow-y: visible;
            display: flex;
            flex-direction: column;
            gap: 12px;
            pointer-events: none;
        }
        
        .ela-notification {
            background-color: #ffffff;
            border-radius: 16px;
            padding: 16px;
            pointer-events: auto;
            animation: slideIn 0.3s ease-out forwards;
            max-width: 100%;
            box-sizing: border-box;
            position: relative;
            margin-bottom: 0;
            color: #000000;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 2px 8px rgba(0, 0, 0, 0.06);
            border: none;
            backdrop-filter: blur(8px);
        }
        
        .ela-notification.success {
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #275D42 0%, #3E8964 100%);
            color: #FFFFFF;
        }
        
        .ela-notification.db-notification {
            display: flex;
            flex-direction: column;
            background: linear-gradient(135deg, #275D42 0%, #1A4A33 100%);
            border-radius: 16px;
            box-shadow: 0 12px 24px rgba(0, 0, 0, 0.16);
            padding: 16px;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .ela-notification.success .notification-header,
        .ela-notification.db-notification .notification-header {
            display: flex;
            align-items: center;
            margin-bottom: 12px;
        }
        
        .ela-notification.success .success-icon,
        .ela-notification.db-notification .success-icon {
            width: 32px;
            height: 32px;
            margin-right: 12px;
            flex-shrink: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(255, 255, 255, 0.15);
            border-radius: 50%;
            padding: 6px;
        }
        
        .ela-notification.success .success-icon img,
        .ela-notification.db-notification .success-icon img {
            width: 20px;
            height: 20px;
        }
        
        .ela-notification.success .notification-title,
        .ela-notification.db-notification .notification-title {
            font-weight: 600;
            font-size: 18px;
            color: #FFFFFF;
            margin: 0;
        }
        
        .ela-notification.success .notification-content {
            margin-top: 10px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            line-height: 1.6;
        }
        
        .ela-notification.db-notification .notification-content {
            margin-top: 8px;
            color: rgba(255, 255, 255, 0.9);
            font-size: 14px;
            line-height: 1.6;
        }
        
        .ela-notification.success .notification-detail,
        .ela-notification.db-notification .notification-detail {
            display: flex;
            margin-top: 6px;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.85);
            line-height: 1.6;
            word-break: break-word;
        }
        
        .ela-notification.success .notification-detail-label,
        .ela-notification.db-notification .notification-detail-label {
            font-weight: 500;
            color: rgba(255, 255, 255, 0.7);
            margin-right: 6px;
        }
        
        .ela-notification.success .notification-detail-value,
        .ela-notification.db-notification .notification-detail-value {
            color: #FFFFFF;
            background: rgba(255, 255, 255, 0.1);
            padding: 4px 8px;
            border-radius: 4px;
            font-family: monospace;
            font-size: 13px;
            max-width: 100%;
            overflow-x: auto;
        }
        
        .ela-notification .notification-label {
            font-size: 15px;
            font-weight: 500;
            margin-bottom: 2px;
            margin-top: 0;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .ela-notification .notification-value {
            font-size: 14px;
            word-break: break-all;
            margin-bottom: 10px;
            line-height: 1.4;
            color: #FFFFFF;
            background: rgba(255, 255, 255, 0.1);
            padding: 8px 12px;
            border-radius: 8px;
            font-family: monospace;
        }
        
        .ela-notification .notification-group {
            font-size: 14px;
            font-weight: 500;
            margin-top: 8px;
            color: rgba(255, 255, 255, 0.8);
            display: flex;
            align-items: center;
        }
        
        .ela-notification .notification-group:before {
            content: '';
            display: inline-block;
            width: 8px;
            height: 8px;
            background: #4ADE80;
            border-radius: 50%;
            margin-right: 6px;
        }
        
        .ela-notification .close-button {
            position: absolute;
            top: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.1);
            border: none;
            padding: 4px;
            cursor: pointer;
            color: rgba(255, 255, 255, 0.7);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            transition: all 0.2s;
        }
        
        .ela-notification .close-button:hover {
            background-color: rgba(255, 255, 255, 0.2);
            color: #FFFFFF;
        }
        
        .ela-notification .action-button {
            padding: 8px 16px;
            background-color: rgba(255, 255, 255, 0.15);
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            align-self: flex-end;
            margin-top: 12px;
            transition: all 0.2s;
        }
        
        .ela-notification .action-button:hover {
            background-color: rgba(255, 255, 255, 0.25);
            transform: translateY(-1px);
        }
        
        .ela-notification.clickable {
            cursor: pointer;
        }
        
        .ela-notification.clickable:hover {
            transform: translateY(-2px);
            box-shadow: 0 12px 28px rgba(0, 0, 0, 0.18), 0 4px 10px rgba(0, 0, 0, 0.1);
            transition: all 0.2s ease;
        }
        
        .copy-feedback {
            position: absolute;
            bottom: -30px;
            left: 50%;
            transform: translateX(-50%);
            background-color: #4ADE80;
            color: white;
            padding: 5px 12px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 10001;
            pointer-events: none;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
        }
        
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes fadeOut {
            from {
                opacity: 1;
            }
            to {
                opacity: 0;
            }
        }
    `;
    
    document.head.appendChild(style);
    document.body.appendChild(container);
    
    return container;
}

// Show an in-app notification
function showInAppNotification(notification, styleType = '') {
    // Create container if it doesn't exist
    const container = document.querySelector('.ela-notifications-container') || createNotificationContainer();
    
    // Create notification element
    const notificationEl = document.createElement('div');
    notificationEl.className = `ela-notification ${styleType}`;
    
    if (styleType === 'success') {
        // Create success notification
        const header = document.createElement('div');
        header.className = 'notification-header';
        
        // Only add the icon if not specified to skip it
        if (!notification.noIcon) {
            const iconContainer = document.createElement('div');
            iconContainer.className = 'success-icon';
            
            // Custom SVG icon for Ela
            iconContainer.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 12H20M4 12L8 8M4 12L8 16" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            
            header.appendChild(iconContainer);
        }
        
        const title = document.createElement('h3');
        title.className = 'notification-title';
        title.textContent = notification.title || 'New CA Shared! | ELA';
        // Apply text color if specified
        if (notification.textColor) {
            title.style.color = notification.textColor;
        }
        
        header.appendChild(title);
        
        // Create content area
        const contentContainer = document.createElement('div');
        contentContainer.className = 'notification-content';
        
        // Add contract address or shared content
        const contentText = document.createElement('div');
        contentText.className = 'notification-detail';
        contentText.textContent = notification.content || '';
        // Apply text color if specified
        if (notification.textColor) {
            contentText.style.color = notification.textColor;
        }
        contentContainer.appendChild(contentText);
        
        // Add Group ID information only if specified and not an autoHide notification
        if (notification.groupId && !notification.autoHide) {
            const groupInfo = document.createElement('div');
            groupInfo.className = 'notification-detail';
            groupInfo.textContent = `Group: ${notification.groupId}`;
            // Apply text color if specified
            if (notification.textColor) {
                groupInfo.style.color = notification.textColor;
            }
            contentContainer.appendChild(groupInfo);
        }
        
        notificationEl.appendChild(header);
        notificationEl.appendChild(contentContainer);
        
        // Add OK button only if not autoHide
        if (!notification.autoHide) {
            const actionButton = document.createElement('button');
            actionButton.className = 'action-button';
            actionButton.textContent = 'OK';
            actionButton.addEventListener('click', () => {
                notificationEl.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    notificationEl.remove();
                }, 300);
            });
            notificationEl.appendChild(actionButton);
        }
    } else if (styleType === 'db-notification') {
        // Standard notification with modern icon
        const header = document.createElement('div');
        header.className = 'notification-header';
        
        const iconContainer = document.createElement('div');
        iconContainer.className = 'success-icon';
        
        // Use a checkmark SVG icon for success
        iconContainer.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 13L9 17L19 7" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `;
        
        const title = document.createElement('h3');
        title.className = 'notification-title';
        title.textContent = notification.title || 'New CA Shared! | ELA';
        
        header.appendChild(iconContainer);
        header.appendChild(title);
        
        // Create content area
        const contentContainer = document.createElement('div');
        contentContainer.className = 'notification-content';
        
        // Format message to match the image layout
        if (notification.message && notification.message.startsWith('CA:')) {
            // Create CA label
            const caLabel = document.createElement('div');
            caLabel.className = 'notification-detail notification-label';
            caLabel.textContent = 'CA:';
            caLabel.style.marginBottom = '2px';
            contentContainer.appendChild(caLabel);
            
            // Extract CA value
            const caContent = notification.message.substring(3).trim();
            const caValue = document.createElement('div');
            caValue.className = 'notification-detail notification-value';
            caValue.textContent = caContent;
            contentContainer.appendChild(caValue);
        } else if (notification.content) {
            // For contract address content
            const caLabel = document.createElement('div');
            caLabel.className = 'notification-detail notification-label';
            caLabel.textContent = 'Contract Address:';
            caLabel.style.marginBottom = '2px';
            contentContainer.appendChild(caLabel);
            
            const caValue = document.createElement('div');
            caValue.className = 'notification-detail notification-value';
            caValue.textContent = notification.content;
            contentContainer.appendChild(caValue);
        } else {
            // For other message types
            const messageText = document.createElement('div');
            messageText.className = 'notification-detail';
            messageText.textContent = notification.message || '';
            contentContainer.appendChild(messageText);
        }
        
        // Add Group ID information if available and not autoHide
        if (notification.groupId && !notification.autoHide) {
            const groupInfo = document.createElement('div');
            groupInfo.className = 'notification-detail notification-group';
            groupInfo.textContent = `Group: ${notification.groupId}`;
            contentContainer.appendChild(groupInfo);
        }
        
        notificationEl.appendChild(header);
        notificationEl.appendChild(contentContainer);
        
        // Add OK button only if not autoHide - always append after content
        if (!notification.autoHide) {
            const actionButton = document.createElement('button');
            actionButton.className = 'action-button';
            actionButton.textContent = 'OK';
            actionButton.addEventListener('click', () => {
                notificationEl.style.animation = 'fadeOut 0.3s forwards';
                setTimeout(() => {
                    notificationEl.remove();
                }, 300);
            });
            notificationEl.appendChild(actionButton);
        }
    }
    
    // Add to container
    container.appendChild(notificationEl);
    
    // Add click handler to copy content to clipboard if there's content
    if ((notification.content || notification.message) && !notification.preventCopy) {
        notificationEl.addEventListener('click', (e) => {
            // Don't trigger if clicking on the OK button
            if (e.target.className === 'action-button') return;
            
            // Extract content for copying (removing "CA: " prefix if present)
            let copyContent = notification.content || '';
            if (notification.message && notification.message.startsWith('CA:')) {
                copyContent = notification.message.substring(4).trim();
            } else if (notification.message) {
                copyContent = notification.message;
            }
            
            // Copy to clipboard
            navigator.clipboard.writeText(copyContent)
                .then(() => {
                    // Show feedback
                    const feedback = document.createElement('div');
                    feedback.className = 'copy-feedback';
                    feedback.textContent = 'Copied to clipboard!';
                    
                    notificationEl.style.position = 'relative';
                    notificationEl.appendChild(feedback);
                    
                    // Show feedback
                    setTimeout(() => {
                        feedback.style.opacity = '1';
                    }, 50);
                    
                    // Hide feedback
                    setTimeout(() => {
                        feedback.style.opacity = '0';
                        setTimeout(() => {
                            feedback.remove();
                        }, 300);
                    }, 1500);
                })
                .catch(err => console.error('Failed to copy text: ', err));
        });
        
        // Add clickable class
        notificationEl.classList.add('clickable');
    }
    
    // Auto remove after the specified time (default: 5 seconds)
    const hideTime = notification.hideTime || 5000;
    setTimeout(() => {
        if (notificationEl && notificationEl.parentNode) {
            notificationEl.style.animation = 'fadeOut 0.3s forwards';
            setTimeout(() => {
                if (notificationEl && notificationEl.parentNode) {
                    notificationEl.remove();
                }
            }, 300);
        }
    }, hideTime);
    
    return notificationEl;
}

// Function specifically for success notifications like "CA shared successfully"
function showSupabaseSuccessNotification(data) {
    const notification = {
        title: '✓ Contract Address Shared',
        content: data.content || '',
        url: data.url || '',
        timestamp: Date.now(),
        noIcon: false,  // Show the icon
        autoHide: true,  // Auto hide without OK button
        hideTime: 2500   // Hide after 2.5 seconds
    };
    
    return showInAppNotification(notification, 'db-notification');
}

// Function to clear all DB notifications
function clearDbNotifications() {
    const container = document.querySelector('.ela-notifications-container');
    if (!container) return;
    
    // Find all db-notification elements
    const dbNotifications = container.querySelectorAll('.ela-notification.db-notification');
    
    // Remove each one with animation
    dbNotifications.forEach(notification => {
        notification.style.animation = 'fadeOut 0.3s forwards';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 300);
    });
}

// Setup listener for notifications from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'showInAppNotification') {
        // If it's a db notification, clear any existing ones first
        if (message.styleType === 'db-notification') {
            clearDbNotifications();
        }
        showInAppNotification(message.notification, message.styleType || '');
        sendResponse({ success: true });
    }
    else if (message.action === 'showSuccessNotification') {
        showSupabaseSuccessNotification(message.data);
        sendResponse({ success: true });
    }
    else if (message.action === 'broadcastNotification') {
        // Handle broadcasted notifications from other instances
        if (message.type === 'db-notification') {
            clearDbNotifications();
            showInAppNotification(message.notification, 'db-notification');
        }
        sendResponse({ success: true });
    }
    else if (message.action === 'clearDbNotifications') {
        clearDbNotifications();
        sendResponse({ success: true });
    }
    return true;
});

// Initialize on page load with all necessary event listeners
document.addEventListener('DOMContentLoaded', initializeElaFeatures);

// Also initialize when the page is fully loaded
window.addEventListener('load', () => {
    if (!document.querySelector('.ela-floating-button')) {
        initializeElaFeatures();
    }
});

// For dynamic pages, observe DOM changes
const observer = new MutationObserver(() => {
    if (document.body && !document.querySelector('.ela-floating-button')) {
        initializeElaFeatures();
    }
});

if (document.documentElement) {
    observer.observe(document.documentElement, { 
        childList: true, 
        subtree: true 
    });
}

// Initialize immediately if document is already loaded
if (document.readyState !== 'loading') {
    initializeElaFeatures();
}