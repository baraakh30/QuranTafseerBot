/**
 * Rulings (Ahkam) module for the Islamic rulings chatbot functionality
 * This file contains all features related to the Islamic rulings tab
 */

document.addEventListener('DOMContentLoaded', function () {
    // Only initialize if we're on a page with the rulings tab
    if (!document.getElementById('rulings-tab')) return;

    // Get rulings-specific elements
    const rulingsChatContainer = document.getElementById('rulings-chat-container');
    const rulingsUserInput = document.getElementById('rulings-user-input');
    const rulingsSendButton = document.getElementById('rulings-send-button');
    const expandRulingsChat = document.getElementById('expand-rulings-chat');

    // Variables to track states
    let rulingsExpandedState = false;
    const originalRulingsChatParent = document.querySelector('#rulings-tab .chat-container-wrapper');
    let lastTap = 0; // For double-tap detection

    // Initialize rulings chat
    initRulingsChat();

    /**
     * Main initialization function
     */
    function initRulingsChat() {
        // Welcome message
        addRulingsMessage('مرحباً بك في بوت الأحكام الشرعية. يمكنك سؤالي عن أي حكم شرعي وسأبحث لك في فتاوي ابن باز.');

        // Add clear chat button
        addClearRulingsButton();

        // Event listeners
        addEventListeners();

        // Mobile optimizations if available from mobile.js
        initializeRulingsMobileFeatures();

        // Setup rulings-specific event listeners for read-more functionality
        setupReadMoreListeners();
    }

    /**
     * Set up all event listeners for the rulings module
     */
    function addEventListeners() {
        // Send message button click
        rulingsSendButton.addEventListener('click', function () {
            sendRulingsQuery(rulingsUserInput.value);
        });

        // Enter key in input field
        rulingsUserInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendRulingsQuery(rulingsUserInput.value);
                e.preventDefault();
            }
        });

        // Expand chat button
        expandRulingsChat.addEventListener('click', expandRulingsChatF);
    }

    /**
     * Function to expand rulings chat into fullscreen view
     */
    function expandRulingsChatF() {
        if (rulingsExpandedState) return; // Already expanding

        rulingsExpandedState = true;

        // Create expanded container
        const expandedView = document.createElement('div');
        expandedView.className = 'expanded-view';
        expandedView.id = 'rulings-expanded-view';
        expandedView.style.opacity = '0';

        // Create close button
        const closeButton = document.createElement('div');
        closeButton.className = 'close-expanded';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', function () {
            collapseRulingsChat();
        });

        // Create inner container
        const expandedContainer = document.createElement('div');
        expandedContainer.className = 'expanded-container';

        // Set title
        const title = document.createElement('h2');
        title.textContent = 'بوت الأحكام الشرعية';
        expandedContainer.appendChild(title);

        // Add clear button
        const clearButtonExpanded = document.createElement('button');
        clearButtonExpanded.id = 'clear-chat-button-expanded';
        clearButtonExpanded.className = 'clear-chat-button';
        clearButtonExpanded.innerHTML = '<span class="clear-icon">🗑️</span><span class="clear-text">مسح المحادثة</span>';
        clearButtonExpanded.style.margin = '0 auto';
        clearButtonExpanded.style.display = 'flex';
        clearButtonExpanded.style.alignItems = 'center';
        clearButtonExpanded.style.justifyContent = 'center';
        clearButtonExpanded.style.padding = '6px 15px';
        
        // Add confirmation to the expanded clear button
        clearButtonExpanded.addEventListener('click', function () {
            if (typeof window.createConfirmDialog === 'function') {
                window.createConfirmDialog(
                    'هل أنت متأكد من رغبتك في مسح جميع المحادثات؟',
                    function () {
                        // User confirmed - clear the chat
                        clearRulingsChat();
                    }
                );
            }
        });
        expandedContainer.appendChild(clearButtonExpanded);

        // Move chat container
        expandedContainer.appendChild(rulingsChatContainer);

        // Clone input group
        const inputGroupClone = document.querySelector('#rulings-tab .input-group').cloneNode(true);
        expandedContainer.appendChild(inputGroupClone);

        // Set up new elements
        const newInput = inputGroupClone.querySelector('#rulings-user-input');
        newInput.id = 'rulings-user-input-expanded';
        const newSendButton = inputGroupClone.querySelector('#rulings-send-button');
        newSendButton.id = 'rulings-send-button-expanded';

        newSendButton.addEventListener('click', function () {
            if (newInput.value.trim() !== '') {
                rulingsUserInput.value = newInput.value;
                sendRulingsQuery(newInput.value);
                newInput.value = '';
            }
        });

        newInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && newInput.value.trim() !== '') {
                rulingsUserInput.value = newInput.value;
                sendRulingsQuery(newInput.value);
                newInput.value = '';
                e.preventDefault();
            }
        });

        // Add expanded classes
        rulingsChatContainer.classList.add('expanded');

        // Add to DOM
        expandedView.appendChild(closeButton);
        expandedView.appendChild(expandedContainer);
        document.body.appendChild(expandedView);

        // Trigger animation after DOM insertion
        requestAnimationFrame(() => {
            expandedView.style.opacity = '1';
        });

        // Scroll to bottom of chat
        scrollRulingsChatToBottom();
    }

    /**
     * Collapse the expanded chat view
     */
    function collapseRulingsChat() {
        if (!rulingsExpandedState) return;

        // Set state to not expanded
        rulingsExpandedState = false;

        // Remove expanded class from the chat container
        rulingsChatContainer.classList.remove('expanded');

        // Get references to the relevant elements
        const expandedView = document.getElementById('rulings-expanded-view');
        const chatWrapper = document.querySelector('#rulings-tab .chat-container-wrapper');
        const inputGroup = document.querySelector('#rulings-tab .input-group');

        // Start fading out the expanded view
        if (expandedView) {
            expandedView.style.opacity = '0';
        }

        // Wait for fade animation before removing
        setTimeout(() => {
            // If the chat wrapper exists, append the chat container to it
            if (chatWrapper) {
                chatWrapper.appendChild(rulingsChatContainer);

                // Scroll to ensure visibility
                setTimeout(() => {
                    scrollRulingsChatToBottom();
                }, 50);
            }

            // Remove the expanded view completely
            if (expandedView) {
                expandedView.remove();
            }
        }, 300);
    }

    /**
     * Add clear button for rulings chat
     */
    function addClearRulingsButton() {
        // Create a container for the button to allow for centering
        const buttonContainer = document.createElement('div');
        buttonContainer.className = 'clear-button-container';
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.margin = '10px 0';
        buttonContainer.style.width = '100%';

        // Create the clear button with centered styling
        const clearButton = document.createElement('button');
        clearButton.id = 'clear-chat-button';
        clearButton.className = 'clear-chat-button';
        clearButton.innerHTML = '<span class="clear-icon">🗑️</span><span class="clear-text">مسح المحادثة</span>';
        clearButton.style.margin = '0 auto';
        clearButton.style.display = 'flex';
        clearButton.style.alignItems = 'center';
        clearButton.style.justifyContent = 'center';
        clearButton.style.padding = '6px 15px';

        // Add the button to the container
        buttonContainer.appendChild(clearButton);

        // Add the button container to the rulings tab
        const chatWrapper = document.querySelector('#rulings-tab .chat-container-wrapper');
        if (chatWrapper) {
            chatWrapper.parentNode.insertBefore(buttonContainer, chatWrapper);

            // Add click handler to show confirmation dialog
            clearButton.addEventListener('click', showClearConfirmation);
        }
        
        // Function to show confirmation dialog
        function showClearConfirmation() {
            if (typeof window.createConfirmDialog === 'function') {
                window.createConfirmDialog(
                    'هل أنت متأكد من رغبتك في مسح جميع المحادثات؟',
                    function () {
                        // User confirmed - clear the chat
                        clearRulingsChat();
                    }
                );
            }
        }
    }

    /**
     * Clear rulings chat and add welcome message
     */
    function clearRulingsChat() {
        // Clear all messages
        rulingsChatContainer.innerHTML = '';

        // Add welcome message
        addRulingsMessage('مرحباً بك في بوت الأحكام الشرعية. يمكنك سؤالي عن أي حكم شرعي وسأبحث لك في فتاوي ابن باز.');

        // Scroll to bottom
        scrollRulingsChatToBottom();
    }

    /**
     * Add messages to the rulings chat
     */
    function addRulingsMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message');

        if (isUser) {
            messageDiv.classList.add('user-message');
            messageDiv.textContent = message;
        } else {
            messageDiv.classList.add('bot-message');
            // Format the bot response
            messageDiv.innerHTML = formatRulingsResponse(message);
        }

        rulingsChatContainer.appendChild(messageDiv);

        // Only scroll if user is near the bottom
        if (isRulingsNearBottom() || isUser) {
            scrollRulingsChatToBottom();
        }
    }

    /**
     * Check if user is near bottom of chat
     */
    function isRulingsNearBottom() {
        const threshold = 100; // pixels from bottom
        const position = rulingsChatContainer.scrollTop + rulingsChatContainer.clientHeight;
        const bottom = rulingsChatContainer.scrollHeight;

        return bottom - position <= threshold;
    }

    /**
     * Scroll chat to bottom
     */
    function scrollRulingsChatToBottom() {
        rulingsChatContainer.scrollTop = rulingsChatContainer.scrollHeight;
    }

    /**
     * Format rulings responses with proper styling
     */
    /**
 * Format rulings responses with proper styling
 */
function formatRulingsResponse(response) {
    // Use core formatResponse if available, otherwise format here
    if (typeof window.formatResponse === 'function') {
        // First check if this is a rulings-specific response that needs custom formatting
        if (response.includes('السؤال:') || response.includes('الإجابة:') || response.includes('العنوان:')) {
            // This appears to be a ruling-specific response, format it specially
        } else {
            // For general responses, use the shared formatter
            return window.formatResponse(response);
        }
    }
    
    // Check if the response is already HTML
    if (response.includes('<div') || response.includes('<p')) {
        return response;
    }

    // Basic formatting for rulings results
    let formattedResponse = response;

    // Style ruling titles
    formattedResponse = formattedResponse.replace(/العنوان: (.+?)(?=\n\n|\n$|$)/g,
        '<div class="ruling-title">$1</div>');

    // Style ruling questions
    formattedResponse = formattedResponse.replace(/السؤال: (.+?)(?=\n\n|\nالإجابة|\n$|$)/gs,
        '<div class="ruling-question">$1</div>');

    // Style ruling answers - improved regex to better capture multi-line answers
    formattedResponse = formattedResponse.replace(/الإجابة: ([\s\S]+?)(?=\n---|\nالمصدر|$)/g,
        '<div class="ruling-answer">$1</div>');

    // Style source references
    formattedResponse = formattedResponse.replace(/المصدر: (.+?)(?=\n|$)/g,
        '<div class="ruling-source">المصدر: $1</div>');

    // Add read more functionality for long answers
    const maxChars = window.innerWidth <= 768 ? 300 : 500;

    // Process the HTML to add read more buttons to long answers
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = formattedResponse;

    tempDiv.querySelectorAll('.ruling-answer').forEach(answerDiv => {
        const content = answerDiv.innerHTML;

        // Only add read more if content is long enough
        if (content.length > maxChars) {
            // Set the class and create shortened content
            answerDiv.className = 'ruling-answer collapsible';
            const shortContent = content.substring(0, maxChars) + '...';

            // Add read more button
            answerDiv.innerHTML = shortContent + ' <span class="read-more">قراءة المزيد...</span>';

            // Store full content as a data attribute for later expansion
            answerDiv.setAttribute('data-full-content', content);
        }
    });

    formattedResponse = tempDiv.innerHTML;

    // Replace separators
    formattedResponse = formattedResponse.replace(/---/g,
        '<div class="separator"></div>');

    // Convert newlines to <br> tags
    formattedResponse = formattedResponse.replace(/\n/g, '<br>');

    return formattedResponse;
}

    /**
     * Send query to the API
     */
    async function sendRulingsQuery(query) {
        const trimmedQuery = query.trim();
        if (!trimmedQuery) {
            return;
        }

        // Add user message to chat
        addRulingsMessage(trimmedQuery, true);

        // Clear input
        rulingsUserInput.value = '';

        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.id = 'rulings-loading-indicator';
        loadingElement.textContent = 'جاري البحث...';
        rulingsChatContainer.appendChild(loadingElement);
        scrollRulingsChatToBottom();

        try {
            const response = await fetch('/api/ahkam', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query: trimmedQuery }),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Remove loading indicator
            const loadingIndicator = document.getElementById('rulings-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }

            // Add bot response
            addRulingsMessage(data.response);

        } catch (error) {
            console.error('Error:', error);
            // Remove loading indicator
            const loadingIndicator = document.getElementById('rulings-loading-indicator');
            if (loadingIndicator) {
                loadingIndicator.remove();
            }
            // Show error message
            addRulingsMessage('عذراً، حدث خطأ أثناء معالجة طلبك. الرجاء المحاولة مرة أخرى.');
        }
    }

    /**
     * Initialize mobile features for rulings if on mobile
     */
    function initializeRulingsMobileFeatures() {
        if (window.innerWidth <= 768) {
            // Check if these functions are available from mobile.js
            if (window.mobileUtils && window.mobileUtils.addRulingsDoubleTapZoom) {
                window.mobileUtils.addRulingsDoubleTapZoom(rulingsChatContainer, lastTap);
            } else {
                // Fallback to local implementation
                addRulingsDoubleTapZoom();
            }

            // Check for mobile keyboard optimization
            if (window.mobileUtils && window.mobileUtils.optimizeRulingsMobileKeyboard) {
                window.mobileUtils.optimizeRulingsMobileKeyboard();
            } else {
                optimizeRulingsMobileKeyboard();
            }

            // Add mobile gesture support
            addRulingsMobileGestureSupport();
        }
    }

    /**
     * Add double-tap zoom for ruling texts
     */
    function addRulingsDoubleTapZoom() {
        rulingsChatContainer.addEventListener('click', (e) => {
            // Check if click was on an answer text
            if (e.target.closest('.ruling-answer') || e.target.closest('.ruling-question')) {
                const currentTime = new Date().getTime();
                const tapLength = currentTime - lastTap;

                if (tapLength < 300 && tapLength > 0) {
                    // Double tap detected
                    e.preventDefault();
                    const element = e.target.closest('.ruling-answer') || e.target.closest('.ruling-question');

                    if (element.classList.contains('zoomed')) {
                        // Reset to normal
                        element.classList.remove('zoomed');
                        element.style.fontSize = '';
                    } else {
                        // Zoom text
                        element.classList.add('zoomed');
                        element.style.fontSize = '1.4em';
                    }
                }
                lastTap = currentTime;
            }
        });
    }

    /**
     * Mobile keyboard optimizations
     */
    function optimizeRulingsMobileKeyboard() {
        // Scroll to input when focused
        rulingsUserInput.addEventListener('focus', () => {
            // Small delay to allow keyboard to appear
            setTimeout(() => {
                rulingsUserInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });

        // Add quick input suggestions above keyboard
        const addRulingsQuickSuggestions = () => {
            // Check if suggestions already exist
            if (document.querySelector('#rulings-tab .quick-suggestions')) return;
            
            const suggestionsBar = document.createElement('div');
            suggestionsBar.className = 'quick-suggestions';
            suggestionsBar.innerHTML = `
               <div class="quick-suggestion" data-text="حكم الصلاة في السفر">الصلاة في السفر</div>
               <div class="quick-suggestion" data-text="أحكام الزكاة">أحكام الزكاة</div>
            `;

            // Insert after input group
            const inputGroup = document.querySelector('#rulings-tab .input-group');
            if (inputGroup) {
                inputGroup.parentNode.insertBefore(suggestionsBar, inputGroup.nextSibling);

                // Add event listeners
                suggestionsBar.querySelectorAll('.quick-suggestion').forEach(btn => {
                    btn.addEventListener('click', () => {
                        rulingsUserInput.value = btn.dataset.text;
                        rulingsUserInput.focus();
                    });
                });
            }
        };

        // Call if DOM is ready or add event listener
        if (document.readyState === 'complete') {
            addRulingsQuickSuggestions();
        } else {
            window.addEventListener('load', addRulingsQuickSuggestions);
        }
    }

    /**
     * Add mobile gesture support
     */
    function addRulingsMobileGestureSupport() {
        let touchStartX = 0;
        let touchEndX = 0;

        const handleSwipe = (element, leftCallback, rightCallback) => {
            element.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
            }, { passive: true });

            element.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                const minSwipeDistance = 50;
                const swipeDistance = touchEndX - touchStartX;

                if (swipeDistance > minSwipeDistance && rightCallback) {
                    // Right swipe
                    rightCallback();
                } else if (swipeDistance < -minSwipeDistance && leftCallback) {
                    // Left swipe
                    leftCallback();
                }
            }, { passive: true });
        };

        // Swipe between tabs
        handleSwipe(rulingsChatContainer,
            () => {
                // Left swipe - go to Quran tab
                const quranTabButton = document.querySelector('.tab-button:first-child');
                if (quranTabButton) quranTabButton.click();
            },
            () => {
                // Right swipe - do nothing or other action
            }
        );
    }

    /**
     * Set up listeners for the read more/less functionality
     */
    function setupReadMoreListeners() {
        document.body.addEventListener('click', function (e) {
            if (e.target && e.target.classList.contains('read-more')) {
                const answerDiv = e.target.closest('.ruling-answer');
                if (!answerDiv) return;

                if (answerDiv.classList.contains('expanded')) {
                    // Collapse the answer
                    answerDiv.classList.remove('expanded');
                    e.target.textContent = 'قراءة المزيد...';

                    // Restore original height and shortened content
                    const shortContent = answerDiv.getAttribute('data-full-content');
                    if (shortContent) {
                        const maxChars = window.innerWidth <= 768 ? 300 : 500;
                        answerDiv.innerHTML = shortContent.substring(0, maxChars) +
                            '... <span class="read-more">قراءة المزيد...</span>';
                    }
                } else {
                    // Expand the answer
                    answerDiv.classList.add('expanded');

                    // Show full content
                    const fullContent = answerDiv.getAttribute('data-full-content');
                    if (fullContent) {
                        answerDiv.innerHTML = fullContent +
                            ' <span class="read-more">عرض أقل</span>';
                    }
                }
            }
        });
    }

    // Export public methods for other modules to use
    window.rulingsModule = {
        addRulingsMessage,
        clearRulingsChat,
        scrollRulingsChatToBottom,
        expandRulingsChatF,
        collapseRulingsChat
    };
});