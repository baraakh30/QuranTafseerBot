/**
 * Mobile-specific functionality for the Quran app
 * This file contains all mobile-optimized features and UI enhancements
 */

// Execute when DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
    // Initialize all mobile features if screen width is appropriate
    if (window.innerWidth <= 768) {
        addMobileGestureSupport();
        addDoubleTapZoom();
        optimizeMobileKeyboard();
        optimizeMobilePerformance();
    }

  
    
    /**
     * Add swipe gesture support for mobile devices
     */
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

            // Add swipe support for surah browsing
            const versesContainer = document.getElementById('verses-container');
            const nextPageButton = document.getElementById('next-page');
            const prevPageButton = document.getElementById('prev-page');
            
            if (versesContainer && nextPageButton && prevPageButton) {
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
            
            // Add swipe support for rulings chat (if exists)
            const rulingsChatContainer = document.getElementById('rulings-chat-container');
            if (rulingsChatContainer) {
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
        }
    }

    /**
     * Add double-tap zoom functionality for verses and tafseer text on mobile
     */
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

    /**
     * Optimize mobile keyboard behavior and add quick suggestions
     */
    function optimizeMobileKeyboard() {
        if (window.innerWidth <= 768) {
            const userInputField = document.getElementById('user-input');
            
            if (!userInputField) return;

            // Scroll to input when focused
            userInputField.addEventListener('focus', () => {
                // Small delay to allow keyboard to appear
                setTimeout(() => {
                    userInputField.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 300);
            });

            // Auto-hide keyboard when scrolling in verses container
            const versesContainer = document.getElementById('verses-container');
            if (versesContainer) {
                versesContainer.addEventListener('touchstart', () => {
                    if (document.activeElement === userInputField) {
                        userInputField.blur();
                    }
                });
            }

            // Add quick input suggestions above keyboard
            const addQuickSuggestions = () => {
                // Check if suggestions are already added
                if (document.querySelector('.quick-suggestions')) return;
                
                const suggestionsBar = document.createElement('div');
                suggestionsBar.className = 'quick-suggestions';
                suggestionsBar.innerHTML = `
                    <div class="quick-suggestion" data-text="2:255">آية الكرسي</div>
                    <div class="quick-suggestion" data-text="المصادر">المصادر</div>
                `;

                // Insert after input group
                const inputGroup = document.querySelector('.input-group');
                if (inputGroup) {
                    inputGroup.parentNode.insertBefore(suggestionsBar, inputGroup.nextSibling);

                    // Add event listeners
                    document.querySelectorAll('.quick-suggestion').forEach(btn => {
                        btn.addEventListener('click', () => {
                            userInputField.value = btn.dataset.text;
                            userInputField.focus();
                        });
                    });
                }
            };

            // Call once DOM is fully loaded
            if (document.readyState === 'complete') {
                addQuickSuggestions();
            } else {
                window.addEventListener('load', addQuickSuggestions);
            }
        }
    }

    /**
     * Optimize performance on mobile devices
     */
    function optimizeMobilePerformance() {
        // Get reference to the existing pageCache
        const originalPageCache = window.pageCache || {};

        // Limit cache size for better memory management on mobile
        const MAX_CACHE_ENTRIES = window.innerWidth <= 768 ? 10 : 20;
        const cacheEntries = [];

        // Create a new pageCache object with getter/setter if it doesn't already exist
        if (!window.pageCache || Object.keys(window.pageCache).length === 0) {
            window.pageCache = new Proxy({}, {
                get: function (target, prop) {
                    return originalPageCache[prop];
                },
                set: function (target, prop, value) {
                    // If we're at maximum capacity, remove oldest entry
                    if (cacheEntries.length >= MAX_CACHE_ENTRIES) {
                        const oldestEntry = cacheEntries.shift();
                        delete originalPageCache[oldestEntry];
                    }

                    // Add new entry
                    cacheEntries.push(prop);
                    originalPageCache[prop] = value;
                    return true;
                }
            });
        }

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

    /**
     * Optimize the rulings mobile experience
     */
    function optimizeRulingsMobileKeyboard() {
        if (window.innerWidth <= 768) {
            const rulingsUserInput = document.getElementById('rulings-user-input');
            
            if (!rulingsUserInput) return;
            
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
    }

    /**
     * Add double-tap zoom for ruling texts
     */
    function addRulingsDoubleTapZoom() {
        const rulingsChatContainer = document.getElementById('rulings-chat-container');
        if (!rulingsChatContainer) return;
        
        let lastTap = 0;
        
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

    // Export mobile-related functions for global access
    window.mobileUtils = {
        addMobileGestureSupport,
        addDoubleTapZoom,
        optimizeMobileKeyboard,
        optimizeMobilePerformance,
        optimizeRulingsMobileKeyboard,
        addRulingsDoubleTapZoom
    };
    
    // Initialize rulings mobile features if the rulings tab exists
    if (document.getElementById('rulings-tab')) {
        optimizeRulingsMobileKeyboard();
        addRulingsDoubleTapZoom();
    }
});