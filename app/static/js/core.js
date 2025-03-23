document.addEventListener('DOMContentLoaded', function () {
    // Initialize shared UI components
    initializeConfirmDialog();
    
    // Add mobile-specific features
    if (window.innerWidth <= 768) {
        addMobileBottomNav();
        addMobileGestureSupport();
        addDoubleTapZoom();
        optimizeMobilePerformance();
    }

    // Export global functions for other modules
    window.formatResponse = formatResponse;
    window.createConfirmDialog = createConfirmDialog;
    window.addDoubleTapZoom = addDoubleTapZoom;
    window.openTab = openTab;
    window.updateMobileBottomNavForCurrentTab = updateMobileBottomNavForCurrentTab;

    // Initialize tabs if they exist
    const tabButtons = document.querySelectorAll('.tab-button');
    if (tabButtons.length > 0) {
        initializeTabs();
    }

    // Create confirmDialog function in the global scope
    function initializeConfirmDialog() {
        window.createConfirmDialog = function(message, onConfirm, onCancel) {
            // Create overlay
            const overlay = document.createElement('div');
            overlay.className = 'confirm-overlay';
            overlay.style.position = 'fixed';
            overlay.style.top = '0';
            overlay.style.left = '0';
            overlay.style.right = '0';
            overlay.style.bottom = '0';
            overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            overlay.style.display = 'flex';
            overlay.style.alignItems = 'center';
            overlay.style.justifyContent = 'center';
            overlay.style.zIndex = '9999';
            overlay.style.opacity = '0';
            overlay.style.transition = 'opacity 0.3s ease';

            // Create dialog box
            const dialog = document.createElement('div');
            dialog.className = 'confirm-dialog';
            dialog.style.backgroundColor = 'white';
            dialog.style.borderRadius = '8px';
            dialog.style.padding = '20px';
            dialog.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.2)';
            dialog.style.textAlign = 'center';
            dialog.style.maxWidth = '300px';
            dialog.style.width = '80%';
            dialog.style.transform = 'translateY(20px)';
            dialog.style.transition = 'transform 0.3s ease';
            dialog.style.direction = 'rtl'; // RTL for Arabic

            // Add message
            const messageEl = document.createElement('div');
            messageEl.className = 'confirm-message';
            messageEl.textContent = message;
            messageEl.style.marginBottom = '20px';
            messageEl.style.fontSize = '16px';

            // Add buttons container
            const buttonsContainer = document.createElement('div');
            buttonsContainer.className = 'confirm-buttons';
            buttonsContainer.style.display = 'flex';
            buttonsContainer.style.justifyContent = 'space-around';

            // Confirm button
            const confirmButton = document.createElement('button');
            confirmButton.className = 'confirm-button confirm-yes';
            confirmButton.textContent = 'تأكيد';
            confirmButton.style.backgroundColor = '#e74c3c';
            confirmButton.style.color = 'white';
            confirmButton.style.border = 'none';
            confirmButton.style.borderRadius = '4px';
            confirmButton.style.padding = '8px 16px';
            confirmButton.style.cursor = 'pointer';
            confirmButton.style.fontWeight = 'bold';

            // Cancel button
            const cancelButton = document.createElement('button');
            cancelButton.className = 'confirm-button confirm-no';
            cancelButton.textContent = 'إلغاء';
            cancelButton.style.backgroundColor = '#f8f9fa';
            cancelButton.style.color = '#343a40';
            cancelButton.style.border = '1px solid #dee2e6';
            cancelButton.style.borderRadius = '4px';
            cancelButton.style.padding = '8px 16px';
            cancelButton.style.cursor = 'pointer';

            // Add event listeners
            confirmButton.addEventListener('click', () => {
                // Close dialog with animation
                overlay.style.opacity = '0';
                dialog.style.transform = 'translateY(20px)';

                // Remove after animation completes
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    if (typeof onConfirm === 'function') {
                        onConfirm();
                    }
                }, 300);
            });

            cancelButton.addEventListener('click', () => {
                // Close dialog with animation
                overlay.style.opacity = '0';
                dialog.style.transform = 'translateY(20px)';

                // Remove after animation completes
                setTimeout(() => {
                    document.body.removeChild(overlay);
                    if (typeof onCancel === 'function') {
                        onCancel();
                    }
                }, 300);
            });

            // Assemble the dialog
            buttonsContainer.appendChild(cancelButton);
            buttonsContainer.appendChild(confirmButton);

            dialog.appendChild(messageEl);
            dialog.appendChild(buttonsContainer);

            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Trigger animation
            requestAnimationFrame(() => {
                overlay.style.opacity = '1';
                dialog.style.transform = 'translateY(0)';
            });
        };
    }

    // Format response for both Quran and Rulings modules
    function formatResponse(response) {
        // Check if the response is already HTML
        if (response.includes('<div') || response.includes('<p')) {
            return response;
        }

        // Basic formatting for tafsir results
        let formattedResponse = response;

        // Style verse IDs
        formattedResponse = formattedResponse.replace(/الآية (\d+:\d+)/g,
            '<div class="verse-id">الآية $1</div>');

        // Style verse text
        formattedResponse = formattedResponse.replace(/نص الآية: (.+?)(?=\n)/g,
            '<div class="verse-text">$1</div>');

        // Style tafseer source
        formattedResponse = formattedResponse.replace(/المصدر: (.+?)(?=\n)/g,
            '<div class="tafseer-source">المصدر: $1</div>');

        // Style tafseer text
        formattedResponse = formattedResponse.replace(/التفسير: (.+?)(?=\n|$)/g,
            '<div class="tafseer-text">$1</div>');

        // Replace separators
        formattedResponse = formattedResponse.replace(/---/g,
            '<div class="separator"></div>');

        // Convert newlines to <br> tags
        formattedResponse = formattedResponse.replace(/\n/g, '<br>');

        return formattedResponse;
    }

    // Mobile bottom navigation
    function addMobileBottomNav() {
        // Only add for mobile devices
        if (window.innerWidth <= 768) {
            const nav = document.createElement('div');
            nav.className = 'mobile-bottom-nav';

            // Start with the default nav (for Quran tab which is active initially)
            nav.innerHTML = `
            <button id="mobile-chat-btn" aria-label="Chat">💬</button>
            <button id="mobile-browse-btn" aria-label="Browse">📖</button>
            <button id="mobile-sources-btn" aria-label="Sources">📚</button>
            <button id="mobile-top-btn" aria-label="Scroll to top">⬆️</button>
            `;

            document.body.appendChild(nav);

            // Add initial event listeners
            document.getElementById('mobile-chat-btn').addEventListener('click', () => {
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-browse-btn').addEventListener('click', () => {
                document.querySelector('.browse-container').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-sources-btn').addEventListener('click', () => {
                document.getElementById('user-input').value = "المصادر";
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
                if (typeof window.sendMessage === 'function') {
                    window.sendMessage();
                }
            });

            document.getElementById('mobile-top-btn').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Update mobile bottom nav based on active tab
    function updateMobileBottomNavForCurrentTab() {
        const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
        if (!mobileBottomNav || window.innerWidth > 768) return;

        // Check which tab is currently active
        const isRulingsTabActive = document.getElementById('rulings-tab') && 
                                  document.getElementById('rulings-tab').classList.contains('active');

        if (isRulingsTabActive) {
            // Keep only chat and top buttons for rulings tab
            mobileBottomNav.innerHTML = `
            <button id="mobile-chat-btn" aria-label="Chat">💬</button>
            <button id="mobile-top-btn" aria-label="Scroll to top">⬆️</button>
            `;

            // Add event listeners for rulings chat
            document.getElementById('mobile-chat-btn').addEventListener('click', () => {
                document.querySelector('#rulings-tab .chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-top-btn').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        } else {
            // Restore full nav for Quran tab
            mobileBottomNav.innerHTML = `
            <button id="mobile-chat-btn" aria-label="Chat">💬</button>
            <button id="mobile-browse-btn" aria-label="Browse">📖</button>
            <button id="mobile-sources-btn" aria-label="Sources">📚</button>
            <button id="mobile-top-btn" aria-label="Scroll to top">⬆️</button>
            `;

            // Add event listeners for Quran tab
            document.getElementById('mobile-chat-btn').addEventListener('click', () => {
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-browse-btn').addEventListener('click', () => {
                document.querySelector('.browse-container').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-sources-btn').addEventListener('click', () => {
                document.getElementById('user-input').value = "المصادر";
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
                if (typeof window.sendMessage === 'function') {
                    window.sendMessage();
                }
            });

            document.getElementById('mobile-top-btn').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    // Tab functionality
    function initializeTabs() {
        // Set up tab functionality
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', function (e) {
                openTab(e, this.getAttribute('data-tab'));
            });
        });
    }

    // Tab switching function
    function openTab(evt, tabName) {
        // Declare all variables
        let i, tabcontent, tabbuttons;

        // Get all elements with class="tab-content" and hide them
        tabcontent = document.getElementsByClassName("tab-content");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].classList.remove("active");
        }

        // Get all elements with class="tab-button" and remove the class "active"
        tabbuttons = document.getElementsByClassName("tab-button");
        for (i = 0; i < tabbuttons.length; i++) {
            tabbuttons[i].classList.remove("active");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        document.getElementById(tabName).classList.add("active");
        evt.currentTarget.classList.add("active");

        // Update the mobile bottom nav based on the current tab
        updateMobileBottomNavForCurrentTab();

        // Special handling for tab-specific elements
        if (tabName === 'rulings-tab') {
            // Show test alert when switching to rulings tab
            showTestAlert();

            // Make sure rulings chat container scrolls to bottom when tab is opened
            const rulingsChatContainer = document.getElementById('rulings-chat-container');
            if (rulingsChatContainer) {
                setTimeout(() => {
                    rulingsChatContainer.scrollTop = rulingsChatContainer.scrollHeight;
                }, 100);
            }
        } else if (tabName === 'quran-tab') {
            // Similar handling for Quran tab if needed
            const chatContainer = document.getElementById('chat-container');
            if (chatContainer) {
                setTimeout(() => {
                    chatContainer.scrollTop = chatContainer.scrollHeight;
                }, 100);
            }
        }
    }

    // Function to show a floating test alert for rulings tab
    function showTestAlert() {
        // Check if we've already shown this alert in this session
        if (sessionStorage.getItem('rulingsAlertShown')) {
            return;
        }

        // Create alert container
        const alertContainer = document.createElement('div');
        alertContainer.className = 'test-alert';

        // Add content to alert
        alertContainer.innerHTML = `
        <div class="test-alert-icon">🧪</div>
        <div class="test-alert-content">
            <div class="test-alert-title">تنبيه</div>
            <div class="test-alert-message">ميزة الأحكام الشرعية لا تزال قيد التجربة والاختبار</div>
        </div>
        <button class="test-alert-close" aria-label="إغلاق">✕</button>
        `;

        // Add to DOM
        document.body.appendChild(alertContainer);

        // Trigger animation after adding to DOM
        setTimeout(() => {
            alertContainer.classList.add('show');
        }, 50);

        // Close button functionality
        const closeButton = alertContainer.querySelector('.test-alert-close');
        closeButton.addEventListener('click', () => {
            alertContainer.classList.remove('show');

            // Remove from DOM after animation completes
            setTimeout(() => {
                alertContainer.remove();
            }, 300);
        });

        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (alertContainer.parentNode) {
                alertContainer.classList.remove('show');
                setTimeout(() => {
                    if (alertContainer.parentNode) {
                        alertContainer.remove();
                    }
                }, 300);
            }
        }, 5000);

        // Mark as shown for this session
        sessionStorage.setItem('rulingsAlertShown', 'true');
    }

    // Mobile gesture support
    function addMobileGestureSupport() {
        // Only for mobile devices
        if (window.innerWidth <= 768) {
            let touchStartX = 0;
            let touchEndX = 0;

            const handleSwipe = (element, leftCallback, rightCallback) => {
                element.addEventListener('touchstart', (e) => {
                    touchStartX = e.changedTouches[0].screenX;
                }, { passive: true });

                element.addEventListener('touchend', (e) => {
                    touchEndX = e.changedTouches[0].screenX;
                    handleSwipeGesture(leftCallback, rightCallback);
                }, { passive: true });
            };

            const handleSwipeGesture = (leftCallback, rightCallback) => {
                const minSwipeDistance = 50;
                const swipeDistance = touchEndX - touchStartX;

                if (swipeDistance > minSwipeDistance && rightCallback) {
                    // Right swipe
                    rightCallback();
                } else if (swipeDistance < -minSwipeDistance && leftCallback) {
                    // Left swipe
                    leftCallback();
                }
            };

            // Add swipe support for surah browsing if it exists
            const versesContainer = document.getElementById('verses-container');
            if (versesContainer) {
                const prevPageButton = document.getElementById('prev-page');
                const nextPageButton = document.getElementById('next-page');
                
                handleSwipe(
                    versesContainer,
                    () => { if (!nextPageButton.disabled) nextPageButton.click(); },  // Left swipe - next page
                    () => { if (!prevPageButton.disabled) prevPageButton.click(); }   // Right swipe - prev page (RTL direction)
                );
            }

            // Add collapsible tafseer support
            document.addEventListener('click', (e) => {
                if (e.target.classList.contains('read-more')) {
                    const tafseerDiv = e.target.parentNode;
                    tafseerDiv.classList.toggle('expanded');
                    e.target.textContent = tafseerDiv.classList.contains('expanded') ? 'عرض أقل' : 'قراءة المزيد...';
                }
            });
        }
    }

    // Double-tap to zoom functionality
    function addDoubleTapZoom() {
        if (window.innerWidth <= 768) {
            let lastTap = 0;
            const tapDelay = 300; // ms

            document.addEventListener('click', (e) => {
                // Check if click was on a verse text
                if (e.target.closest('.verse-text') || e.target.closest('.tafseer-text')) {
                    const currentTime = new Date().getTime();
                    const tapLength = currentTime - lastTap;

                    if (tapLength < tapDelay && tapLength > 0) {
                        // Double tap detected
                        e.preventDefault();
                        const element = e.target.closest('.verse-text') || e.target.closest('.tafseer-text');

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
    }

    // Mobile performance optimizations
    function optimizeMobilePerformance() {
        // Add support for lazy loading images if any
        if ('loading' in HTMLImageElement.prototype) {
            document.querySelectorAll('img').forEach(img => {
                img.loading = 'lazy';
            });
        }

        // Disable complex animations on low-power devices
        const isLowPowerDevice = () => {
            return window.innerWidth <= 768 &&
                navigator.hardwareConcurrency &&
                navigator.hardwareConcurrency <= 4;
        };

        if (isLowPowerDevice()) {
            document.body.classList.add('reduce-animations');
        }
    }

    // Make necessary functions available globally
    window.openTab = openTab;
});