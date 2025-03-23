document.addEventListener('DOMContentLoaded', function () {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const sourceSelector = document.getElementById('tafseer-source');
    const suggestions = document.querySelectorAll('.suggestion');

    // Welcome message
    addBotMessage("السلام عليكم! أنا بوت التفسير. اسألني عن أي آية من القرآن الكريم وسأقدم لك تفسيرها. يمكنك تحديد سورة وآية مثل (2:255) أو البحث بالنص.");

    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });

    // Add suggestion click events
    // Add suggestion click events
    suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', function (e) {
            e.preventDefault();
            const query = this.getAttribute('data-query');

            // Check if the query is for Surah Al-Fatiha
            if (query === "1:1") {
                // Scroll to the surah browsing section
                document.querySelector('.browse-container').scrollIntoView({ behavior: 'smooth' });

                // Select the first surah in the dropdown
                setTimeout(() => {
                    surahSelect.value = "1";

                    // Explicitly fetch surah info before triggering browse action
                    fetchSurahInfo("1").then(() => {
                        // After fetching info, call the original browse function directly
                        // or trigger the browse flow
                        browseButton.click();

                        // Wait for content to load and scroll to verses container
                        setTimeout(() => {
                            versesContainer.scrollIntoView({ behavior: 'smooth' });
                        }, 500);
                    });
                }, 500);

                return;
            } else {
                // For other queries (Ayat al-Kursi or المصادر), scroll to chat area
                userInput.value = query;
                chatContainer.scrollIntoView({ behavior: 'smooth' });
                sendMessage();
            }
        });
    });

    function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;

        // Add user message to chat
        addUserMessage(message);

        // Clear input
        userInput.value = '';

        // Show loading indicator
        const loadingElement = document.createElement('div');
        loadingElement.className = 'loading';
        loadingElement.id = 'loading-indicator';
        loadingElement.textContent = 'جاري البحث...';
        chatContainer.appendChild(loadingElement);
        scrollToBottom();

        // Get selected source
        const selectedSource = sourceSelector.value;

        // Send request to server
        fetch('/api/query', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                query: message,
                source: selectedSource
            }),
        })
            .then(response => response.json())
            .then(data => {
                // Remove loading indicator
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }

                // Format and display response
                const response = formatResponse(data.response);
                addBotMessage(response);
            })
            .catch(error => {
                // Remove loading indicator
                const loadingIndicator = document.getElementById('loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }

                addBotMessage('حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.');
                console.error('Error:', error);
            });
    }

    function addBotMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message bot-message';
        messageElement.innerHTML = message;
        chatContainer.appendChild(messageElement);

        // Only scroll if the user is already near the bottom
        if (isNearBottom()) {
            scrollChatToBottom();
        }
    }

    function addUserMessage(message) {
        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message user-message';
        messageElement.textContent = message;
        chatContainer.appendChild(messageElement);

        // Always scroll to bottom after user sends a message
        scrollChatToBottom();
    }

    function scrollChatToBottom() {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function isNearBottom() {
        // Check if user is already near the bottom of the chat
        const threshold = 100; // pixels from bottom
        const position = chatContainer.scrollTop + chatContainer.clientHeight;
        const bottom = chatContainer.scrollHeight;

        return bottom - position <= threshold;
    }

    // Replace the scrollToBottom function with our new function
    function scrollToBottom() {
        scrollChatToBottom();
    }
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

    function createConfirmDialog(message, onConfirm, onCancel) {
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
    }
    
    // Surah browsing functionality
    const surahSelect = document.getElementById('surah-select');
    const browseButton = document.getElementById('browse-button');
    const surahBrowser = document.getElementById('surah-browser');
    const surahTitle = document.getElementById('surah-title');
    const versesContainer = document.getElementById('verses-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');

    let currentSurah = null;
    let currentPage = 1;
    let totalPages = 1;

    // Page cache to store loaded pages
    const pageCache = {};

    browseButton.addEventListener('click', function () {
        const selectedSurah = surahSelect.value;
        if (!selectedSurah) {
            alert('الرجاء اختيار سورة أولاً');
            return;
        }

        // Clear cache when changing surahs
        if (currentSurah !== selectedSurah) {
            Object.keys(pageCache).forEach(key => {
                if (key.startsWith(selectedSurah + '_')) {
                    delete pageCache[key];
                }
            });
        }

        currentSurah = selectedSurah;
        currentPage = 1;

        // If the browser is not already visible, show it and scroll to it
        if (surahBrowser.style.display === 'none') {
            surahBrowser.style.display = 'block';
            surahBrowser.scrollIntoView({ behavior: 'smooth' });
        }

        loadSurahPage();
    });

    prevPageButton.addEventListener('click', function () {
        if (currentPage > 1) {
            // Show loading only if page isn't cached
            const cacheKey = `${currentSurah}_${currentPage - 1}`;
            const isPageCached = pageCache[cacheKey] !== undefined;

            if (!isPageCached) {
                // Show loading indicator only if page isn't cached
                const loadingElement = document.createElement('div');
                loadingElement.className = 'loading';
                loadingElement.textContent = 'جاري التحميل...';
                versesContainer.insertBefore(loadingElement, versesContainer.firstChild);
            }

            currentPage--;
            displayCachedPageOrLoad();
        }
    });

    nextPageButton.addEventListener('click', function () {
        if (currentPage < totalPages) {
            // Show loading only if page isn't cached
            const cacheKey = `${currentSurah}_${currentPage + 1}`;
            const isPageCached = pageCache[cacheKey] !== undefined;

            if (!isPageCached) {
                // Show loading indicator only if page isn't cached
                const loadingElement = document.createElement('div');
                loadingElement.className = 'loading';
                loadingElement.textContent = 'جاري التحميل...';
                versesContainer.appendChild(loadingElement);
            }

            currentPage++;
            displayCachedPageOrLoad();
        }
    });

    function displayCachedPageOrLoad() {
        const cacheKey = `${currentSurah}_${currentPage}`;

        if (pageCache[cacheKey]) {
            // Use cached data
            displayPageFromCache(cacheKey);
        } else {
            // Load the page
            loadSurahPage(false);
        }
    }

    function displayPageFromCache(cacheKey) {
        const data = pageCache[cacheKey];

        // Update UI with cached data
        surahTitle.textContent = `سورة ${data.surah_name_ar} (${data.surah_name_en})`;
        totalPages = data.total_pages;
        pageInfo.textContent = `الصفحة ${data.current_page} من ${data.total_pages}`;

        // Update navigation buttons
        prevPageButton.disabled = data.current_page <= 1;
        nextPageButton.disabled = data.current_page >= data.total_pages;

        // Display verses
        versesContainer.innerHTML = '';
        data.verses.forEach(verse => {
            const verseCard = document.createElement('div');
            verseCard.className = 'verse-card';
            verseCard.innerHTML = formatResponse(verse);
            versesContainer.appendChild(verseCard);
        });

        // Scroll to top of verses container
        versesContainer.scrollTop = 0;

        // Preload adjacent pages
        preloadAdjacentPages();
    }

    function loadSurahPage(scrollToSection = true) {
        // Show loading indicator if the page isn't already cached
        const cacheKey = `${currentSurah}_${currentPage}`;
        if (!pageCache[cacheKey]) {
            versesContainer.innerHTML = '<div class="loading">جاري تحميل التفسير...</div>';
        }

        // Make sure the browser is visible
        if (surahBrowser.style.display === 'none') {
            surahBrowser.style.display = 'block';
        }

        // Only scroll to the section if it's the first load or explicitly requested
        if (scrollToSection) {
            surahBrowser.scrollIntoView({ behavior: 'smooth' });
        }

        // Get selected source
        const selectedSource = sourceSelector.value;

        // Check cache first
        if (pageCache[cacheKey]) {
            displayPageFromCache(cacheKey);
            return;
        }

        fetch('/api/browse_surah', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                surah_id: currentSurah,
                page: currentPage,
                source: selectedSource
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    versesContainer.innerHTML = `<div class="error">${data.error}</div>`;
                    return;
                }

                // Cache the page data
                pageCache[cacheKey] = data;

                // Update UI
                surahTitle.textContent = `سورة ${data.surah_name_ar} (${data.surah_name_en})`;
                totalPages = data.total_pages;
                pageInfo.textContent = `الصفحة ${data.current_page} من ${data.total_pages}`;

                // Update navigation buttons
                prevPageButton.disabled = data.current_page <= 1;
                nextPageButton.disabled = data.current_page >= data.total_pages;

                // Display verses
                versesContainer.innerHTML = '';
                data.verses.forEach(verse => {
                    const verseCard = document.createElement('div');
                    verseCard.className = 'verse-card';
                    verseCard.innerHTML = formatResponse(verse);
                    versesContainer.appendChild(verseCard);
                });

                // Scroll to top of verses container
                versesContainer.scrollTop = 0;

                // After loading current page, preload adjacent pages
                preloadAdjacentPages();
            })
            .catch(error => {
                versesContainer.innerHTML = '<div class="error">حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.</div>';
                console.error('Error:', error);
            });
    }
    function preloadAdjacentPages() {
        // Preload next page if it exists and isn't already cached
        if (currentPage < totalPages) {
            preloadPage(currentPage + 1);
        }

        // Preload previous page if it exists and isn't already cached
        if (currentPage > 1) {
            preloadPage(currentPage - 1);
        }
    }

    function preloadPage(pageNumber) {
        const cacheKey = `${currentSurah}_${pageNumber}`;

        // Skip if already cached
        if (pageCache[cacheKey]) {
            return;
        }

        // Get selected source
        const selectedSource = sourceSelector.value;

        // Fetch in background
        fetch('/api/browse_surah', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                surah_id: currentSurah,
                page: pageNumber,
                source: selectedSource
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (!data.error) {
                    // Cache the preloaded page
                    pageCache[cacheKey] = data;
                }
            })
            .catch(error => {
                console.error('Error preloading page:', error);
            });
    }
    const expandChatBtn = document.getElementById('expand-chat');
    const expandBrowseBtn = document.getElementById('expand-browse');
    const chatContainerWrapper = document.querySelector('.chat-container-wrapper');
    const browseContainerWrapper = document.querySelector('.browse-container-wrapper');
    const originalChatParent = chatContainerWrapper.parentNode;
    const originalBrowseParent = browseContainerWrapper.parentNode;
    let chatExpandedState = false;
    let browseExpandedState = false;

    // Function to expand chat
    expandChatBtn.addEventListener('click', function () {
        if (chatExpandedState) return; // Already expanding

        chatExpandedState = true;

        // Create expanded container
        const expandedView = document.createElement('div');
        expandedView.className = 'expanded-view';
        expandedView.id = 'chat-expanded-view';
        expandedView.style.opacity = '0';

        // Create close button
        const closeButton = document.createElement('div');
        closeButton.className = 'close-expanded';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', function () {
            collapseChat();
        });

        // Create inner container
        const expandedContainer = document.createElement('div');
        expandedContainer.className = 'expanded-container';

        // Set title
        const title = document.createElement('h2');
        title.textContent = 'بوت تفسير القرآن الكريم';

        // Move elements to expanded view
        expandedContainer.appendChild(title);
        expandedContainer.appendChild(document.getElementById('source-selector').cloneNode(true));
        expandedContainer.appendChild(chatContainerWrapper);
        expandedContainer.appendChild(document.querySelector('.input-group').cloneNode(true));

        // Set up new elements
        const newSourceSelector = expandedContainer.querySelector('#source-selector select');
        newSourceSelector.id = 'tafseer-source-expanded';
        newSourceSelector.value = sourceSelector.value;
        newSourceSelector.addEventListener('change', function () {
            sourceSelector.value = this.value;
        });

        const newInput = expandedContainer.querySelector('#user-input');
        newInput.id = 'user-input-expanded';
        const newSendButton = expandedContainer.querySelector('#send-button');
        newSendButton.id = 'send-button-expanded';

        newSendButton.addEventListener('click', function () {
            if (newInput.value.trim() !== '') {
                userInput.value = newInput.value;
                sendMessage();
                newInput.value = '';
            }
        });

        newInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter' && newInput.value.trim() !== '') {
                userInput.value = newInput.value;
                sendMessage();
                newInput.value = '';
            }
        });

        // Add expanded classes
        chatContainer.classList.add('expanded');

        // Add to DOM
        expandedView.appendChild(closeButton);
        expandedView.appendChild(expandedContainer);
        document.body.appendChild(expandedView);

        // Trigger animation after DOM insertion
        requestAnimationFrame(() => {
            expandedView.style.opacity = '1';
        });

        // Scroll to bottom of chat
        scrollChatToBottom();

        // Initialize new animations
    });

    function collapseChat() {
        if (!chatExpandedState) return;

        chatExpandedState = false;
        chatContainer.classList.remove('expanded');

        // Return the chat container to its original position
        originalChatParent.insertBefore(chatContainerWrapper, document.querySelector('.input-group'));

        // Remove expanded view
        document.getElementById('chat-expanded-view').remove();
    }

    // Function to expand browse
    expandBrowseBtn.addEventListener('click', function () {
        if (browseExpandedState) return; // Already expanding

        browseExpandedState = true;

        // Create expanded container
        const expandedView = document.createElement('div');
        expandedView.className = 'expanded-view';
        expandedView.id = 'browse-expanded-view';
        expandedView.style.opacity = '0';

        // Create close button
        const closeButton = document.createElement('div');
        closeButton.className = 'close-expanded';
        closeButton.textContent = '✕';
        closeButton.addEventListener('click', function () {
            collapseBrowse();
        });

        // Create inner container
        const expandedContainer = document.createElement('div');
        expandedContainer.className = 'expanded-container';

        // Set title
        const title = document.createElement('h2');
        title.textContent = 'تصفح سور القرآن';
        expandedContainer.appendChild(title);

        // Create browse layout for expanded view
        const browseLayout = document.createElement('div');
        browseLayout.className = 'browse-layout-expanded';

        // Left sidebar
        const sidebar = document.createElement('div');
        sidebar.className = 'browse-sidebar';

        // Clone and modify surah selector
        const surahSelectorClone = document.querySelector('.surah-selector').cloneNode(true);
        surahSelectorClone.classList.add('expanded');

        // Update the select in the cloned element
        const surahSelectClone = surahSelectorClone.querySelector('select');
        surahSelectClone.id = 'surah-select-expanded';
        surahSelectClone.value = surahSelect.value;

        // Update the button in the cloned element
        const browseBtnClone = surahSelectorClone.querySelector('button');
        browseBtnClone.id = 'browse-button-expanded';

        // Add event listeners to cloned elements
        browseBtnClone.addEventListener('click', function () {
            const selectedSurah = surahSelectClone.value;
            if (!selectedSurah) {
                alert('الرجاء اختيار سورة أولاً');
                return;
            }

            // Update the original select
            surahSelect.value = selectedSurah;

            // First fetch surah info to ensure we have correct data
            fetchSurahInfo(selectedSurah).then(() => {
                // Call the browse function with the expanded view
                if (currentSurah !== selectedSurah) {
                    Object.keys(pageCache).forEach(key => {
                        if (key.startsWith(selectedSurah + '_')) {
                            delete pageCache[key];
                        }
                    });
                }

                currentSurah = selectedSurah;
                currentPage = 1;

                // Display browser in expanded view
                const expandedBrowser = expandedView.querySelector('#surah-browser-expanded');
                if (expandedBrowser) {
                    expandedBrowser.style.display = 'block';
                }

                loadSurahPageExpanded();
            });
        });

        sidebar.appendChild(surahSelectorClone);

        // Right content area - will hold surah browser
        const contentArea = document.createElement('div');
        contentArea.className = 'browse-content';

        // Clone the surah browser
        const surahBrowserClone = document.getElementById('surah-browser').cloneNode(true);
        surahBrowserClone.id = 'surah-browser-expanded';
        surahBrowserClone.style.display = 'none';

        // Update IDs for expanded view elements
        const surahTitleClone = surahBrowserClone.querySelector('#surah-title');
        surahTitleClone.id = 'surah-title-expanded';

        const prevPageBtnClone = surahBrowserClone.querySelector('#prev-page');
        prevPageBtnClone.id = 'prev-page-expanded';
        prevPageBtnClone.disabled = prevPageButton.disabled;

        const pageInfoClone = surahBrowserClone.querySelector('#page-info');
        pageInfoClone.id = 'page-info-expanded';
        pageInfoClone.textContent = pageInfo.textContent;

        const nextPageBtnClone = surahBrowserClone.querySelector('#next-page');
        nextPageBtnClone.id = 'next-page-expanded';
        nextPageBtnClone.disabled = nextPageButton.disabled;

        const versesContainerClone = surahBrowserClone.querySelector('#verses-container');
        versesContainerClone.id = 'verses-container-expanded';
        versesContainerClone.classList.add('expanded');
        versesContainerClone.classList.add('verse-cards-grid');

        // Add event listeners for pagination
        prevPageBtnClone.addEventListener('click', function () {
            if (currentPage > 1) {
                currentPage--;
                loadSurahPageExpanded();

                // Update original buttons
                prevPageButton.disabled = (currentPage <= 1);
                nextPageButton.disabled = (currentPage >= totalPages);
            }
        });

        nextPageBtnClone.addEventListener('click', function () {
            if (currentPage < totalPages) {
                currentPage++;
                loadSurahPageExpanded();

                // Update original buttons
                prevPageButton.disabled = (currentPage <= 1);
                nextPageButton.disabled = (currentPage >= totalPages);
            }
        });

        contentArea.appendChild(surahBrowserClone);

        // Assemble the layout
        browseLayout.appendChild(sidebar);
        browseLayout.appendChild(contentArea);
        expandedContainer.appendChild(browseLayout);

        // Add to DOM
        expandedView.appendChild(closeButton);
        expandedView.appendChild(expandedContainer);
        document.body.appendChild(expandedView);

        // Trigger animation after DOM insertion
        requestAnimationFrame(() => {
            expandedView.style.opacity = '1';
        });

        // If a surah is already selected, load it in expanded view
        if (currentSurah) {
            // First fetch surah info to ensure we have correct data
            fetchSurahInfo(currentSurah).then(() => {
                surahBrowserClone.style.display = 'block';
                loadSurahPageExpanded();
            });
        }
    });
    // Add specific event listeners for the expanded view pagination buttons
    function initExpandedViewPaginationEvents() {
        document.addEventListener('click', function (e) {
            // If we're in expanded view and clicking pagination buttons
            if (browseExpandedState) {
                if (e.target.id === 'prev-page-expanded' || e.target.id === 'next-page-expanded') {
                    // Make sure navigation gets updated after page change
                    setTimeout(() => {
                        createAyahNavBar();
                        setupScrollTracking();
                    }, 300);
                }
            }
        });
    }


    function collapseBrowse() {
        if (!browseExpandedState) return;

        browseExpandedState = false;

        // Remove expanded view
        document.getElementById('browse-expanded-view').remove();
    }

    function loadSurahPageExpanded() {
        const cacheKey = `${currentSurah}_${currentPage}`;

        const expandedView = document.getElementById('browse-expanded-view');
        const versesContainerExpanded = expandedView.querySelector('#verses-container-expanded');
        const surahTitleExpanded = expandedView.querySelector('#surah-title-expanded');
        const pageInfoExpanded = expandedView.querySelector('#page-info-expanded');
        const prevPageBtnExpanded = expandedView.querySelector('#prev-page-expanded');
        const nextPageBtnExpanded = expandedView.querySelector('#next-page-expanded');

        // Show loading if not cached
        if (!pageCache[cacheKey]) {
            versesContainerExpanded.innerHTML = '<div class="loading">جاري تحميل التفسير...</div>';
        }

        // If already in cache, display it
        if (pageCache[cacheKey]) {
            displayExpandedPageFromCache(cacheKey);
            return;
        }

        // Otherwise, load from server and update both views
        fetch('/api/browse_surah', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                surah_id: currentSurah,
                page: currentPage,
                source: sourceSelector.value
            }),
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    versesContainerExpanded.innerHTML = `<div class="error">${data.error}</div>`;
                    return;
                }

                // Cache the page data
                pageCache[cacheKey] = data;

                // Update expanded UI
                surahTitleExpanded.textContent = `سورة ${data.surah_name_ar} (${data.surah_name_en})`;
                pageInfoExpanded.textContent = `الصفحة ${data.current_page} من ${data.total_pages}`;

                // Update navigation buttons
                prevPageBtnExpanded.disabled = data.current_page <= 1;
                nextPageBtnExpanded.disabled = data.current_page >= data.total_pages;

                // Display verses in grid layout
                versesContainerExpanded.innerHTML = '';
                data.verses.forEach(verse => {
                    const verseCard = document.createElement('div');
                    verseCard.className = 'verse-card';
                    verseCard.innerHTML = formatResponse(verse);
                    versesContainerExpanded.appendChild(verseCard);
                });

                // Update original view if visible
                if (surahBrowser.style.display !== 'none') {
                    displayPageFromCache(cacheKey);
                }

                totalPages = data.total_pages;

                // Preload adjacent pages
                preloadAdjacentPages();

                // Explicitly fetch surah info and update the navigation bar for expanded view
                fetchSurahInfo(currentSurah).then(() => {
                    setTimeout(() => {
                        createAyahNavBar();
                        setupScrollTracking();
                    }, 300);
                });
            })
            .catch(error => {
                versesContainerExpanded.innerHTML = '<div class="error">حدث خطأ في الاتصال. الرجاء المحاولة مرة أخرى.</div>';
                console.error('Error:', error);
            });
    }

    // Update displayExpandedPageFromCache to also refresh the ayah navigation
    function displayExpandedPageFromCache(cacheKey) {
        const data = pageCache[cacheKey];
        const expandedView = document.getElementById('browse-expanded-view');

        if (!expandedView) return;

        const versesContainerExpanded = expandedView.querySelector('#verses-container-expanded');
        const surahTitleExpanded = expandedView.querySelector('#surah-title-expanded');
        const pageInfoExpanded = expandedView.querySelector('#page-info-expanded');
        const prevPageBtnExpanded = expandedView.querySelector('#prev-page-expanded');
        const nextPageBtnExpanded = expandedView.querySelector('#next-page-expanded');

        // Update UI with cached data
        surahTitleExpanded.textContent = `سورة ${data.surah_name_ar} (${data.surah_name_en})`;
        pageInfoExpanded.textContent = `الصفحة ${data.current_page} من ${data.total_pages}`;

        // Update navigation buttons
        prevPageBtnExpanded.disabled = data.current_page <= 1;
        nextPageBtnExpanded.disabled = data.current_page >= data.total_pages;

        // Display verses
        versesContainerExpanded.innerHTML = '';
        data.verses.forEach(verse => {
            const verseCard = document.createElement('div');
            verseCard.className = 'verse-card';
            verseCard.innerHTML = formatResponse(verse);
            versesContainerExpanded.appendChild(verseCard);
        });

        // Make sure to update the ayah navigation in expanded view as well
        setTimeout(() => {
            createAyahNavBar();
            setupScrollTracking();
        }, 300);
    }
    // Global variable to track surah information
    let currentSurahInfo = {
        totalAyahs: 0,
        ayahsPerPage: 2,
        ayahOffset: 0 // For special cases like Al-Fatiha
    };

    // Fetch surah information from the server
    async function fetchSurahInfo(surahId) {
        try {
            const response = await fetch('/api/get_surah_info', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    surah_id: surahId
                }),
            });
            const data = await response.json();
            // Store surah information
            currentSurahInfo = {
                totalAyahs: data.total_ayahs || 0,
                ayahsPerPage: data.ayahs_per_page || 2,
                // Special case for Al-Fatiha (surah ID 1), which starts from ayah 2
                ayahOffset: surahId === "1" ? 1 : 0
            };
            return currentSurahInfo;
        } catch (error) {
            console.error('Error fetching surah info:', error);
            return currentSurahInfo;
        }
    }

    // Create and add ayah navigation bar
    function createAyahNavBar() {
        // Create navigation bar for both regular and expanded views
        const createNavForView = (containerId, versesContainerId) => {
            const container = document.getElementById(containerId);
            if (!container) return;

            // Remove existing nav if any
            const existingNav = container.querySelector('.ayah-nav-bar');
            if (existingNav) existingNav.remove();

            // Create ayah navigation bar
            const ayahNavBar = document.createElement('div');
            ayahNavBar.className = 'ayah-nav-bar';
            ayahNavBar.setAttribute('aria-label', 'التنقل بين الآيات');

            // Add to container
            container.appendChild(ayahNavBar);

            return {
                navBar: ayahNavBar,
                versesContainer: document.getElementById(versesContainerId)
            };
        };

        // Create for regular view
        const regularView = createNavForView('surah-browser', 'verses-container');

        // Create for expanded view if it exists
        const expandedView = createNavForView('surah-browser-expanded', 'verses-container-expanded');

        // Update both navs with current ayahs
        updateAyahNavBars(regularView, expandedView);
    }

    // Update ayah navigation bars showing all ayahs in the surah, not just current page
    function updateAyahNavBars(regularView, expandedView) {
        // Make sure we have surah info
        if (currentSurahInfo.totalAyahs === 0 && currentSurah) {
            fetchSurahInfo(currentSurah).then(() => {
                updateAyahNavBarsWithInfo(regularView, expandedView);
            });
        } else {
            updateAyahNavBarsWithInfo(regularView, expandedView);
        }
    }

    // Update navigation bars with surah information
    function updateAyahNavBarsWithInfo(regularView, expandedView) {
        // Function to update a specific nav bar
        const updateNav = (view) => {
            if (!view || !view.navBar || !view.versesContainer) return;

            const ayahNavBar = view.navBar;
            const versesContainer = view.versesContainer;

            // Clear current nav
            ayahNavBar.innerHTML = '';

            // Exit if no surah is selected
            if (!currentSurah || currentSurahInfo.totalAyahs === 0) return;

            // Calculate current page ayah range
            const startAyah = ((currentPage - 1) * currentSurahInfo.ayahsPerPage) + 1 + currentSurahInfo.ayahOffset;
            const endAyah = Math.min(startAyah + currentSurahInfo.ayahsPerPage - 1, currentSurahInfo.totalAyahs + currentSurahInfo.ayahOffset);

            // Create section label for current verses
            const sectionLabel = document.createElement('div');
            sectionLabel.className = 'ayah-nav-section';
            sectionLabel.textContent = `الآيات ${startAyah}-${endAyah}`;
            ayahNavBar.appendChild(sectionLabel);

            // Get all verses in current page
            const verseCards = versesContainer.querySelectorAll('.verse-card');

            // Add buttons for each ayah in the current page
            verseCards.forEach((verseCard, index) => {
                // Extract ayah ID from verse card
                const verseIdEl = verseCard.querySelector('.verse-id');
                if (!verseIdEl) return;

                // Extract ayah number
                const verseIdText = verseIdEl.textContent;
                const ayahMatch = verseIdText.match(/\d+:\d+/);
                if (!ayahMatch) return;

                const [surahNum, ayahNum] = ayahMatch[0].split(':').map(Number);

                // Create button
                const ayahButton = document.createElement('button');
                ayahButton.className = 'ayah-nav-button';
                ayahButton.textContent = ayahNum;
                ayahButton.title = `الآية ${surahNum}:${ayahNum}`;
                ayahButton.setAttribute('data-index', index);
                ayahButton.setAttribute('data-ayah', ayahNum);

                // Add event listener to scroll to verse when clicked
                ayahButton.addEventListener('click', () => {
                    verseCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    highlightVerse(verseCard);
                });

                ayahNavBar.appendChild(ayahButton);
            });

            // Add full surah navigation if total ayahs is reasonable
            if (currentSurahInfo.totalAyahs <= 30) {
                const fullNavLabel = document.createElement('div');
                fullNavLabel.className = 'ayah-nav-section';
                fullNavLabel.textContent = 'كل الآيات:';
                ayahNavBar.appendChild(fullNavLabel);

                // Add buttons for all ayahs in the surah
                for (let i = 1 + currentSurahInfo.ayahOffset; i <= currentSurahInfo.totalAyahs + currentSurahInfo.ayahOffset; i++) {
                    const ayahButton = document.createElement('button');
                    ayahButton.className = 'ayah-nav-button full-surah';
                    ayahButton.textContent = i;
                    ayahButton.title = `الآية ${currentSurah}:${i}`;
                    ayahButton.setAttribute('data-ayah', i);

                    // Check if this ayah is on the current page
                    const isCurrentPage = i >= startAyah && i <= endAyah;
                    if (isCurrentPage) {
                        ayahButton.classList.add('current-page');
                    }

                    // Calculate which page this ayah is on
                    const ayahPage = Math.ceil((i - currentSurahInfo.ayahOffset) / currentSurahInfo.ayahsPerPage);

                    // Add event listener to navigate to the correct page and scroll to verse
                    ayahButton.addEventListener('click', () => {
                        // If ayah is on current page, just scroll to it
                        if (isCurrentPage) {
                            // Find the verse card for this ayah
                            const verseCards = versesContainer.querySelectorAll('.verse-card');
                            const targetIndex = i - startAyah;
                            if (verseCards[targetIndex]) {
                                verseCards[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
                                highlightVerse(verseCards[targetIndex]);
                            }
                        } else {
                            // Navigate to the page containing this ayah
                            navigateToAyah(ayahPage, i);
                        }
                    });

                    ayahNavBar.appendChild(ayahButton);
                }
            } else {
                // For longer surahs, add a page jump field
                const pageJumpContainer = document.createElement('div');
                pageJumpContainer.className = 'ayah-jump-container';

                const pageJumpLabel = document.createElement('span');
                pageJumpLabel.textContent = 'انتقل للآية:';
                pageJumpContainer.appendChild(pageJumpLabel);

                const pageJumpInput = document.createElement('input');
                pageJumpInput.type = 'number';
                pageJumpInput.min = 1 + currentSurahInfo.ayahOffset;
                pageJumpInput.max = currentSurahInfo.totalAyahs + currentSurahInfo.ayahOffset;
                pageJumpInput.placeholder = 'رقم الآية';
                pageJumpContainer.appendChild(pageJumpInput);

                const pageJumpButton = document.createElement('button');
                pageJumpButton.textContent = 'انتقل';
                pageJumpButton.addEventListener('click', () => {
                    const targetAyah = parseInt(pageJumpInput.value);
                    if (targetAyah >= (1 + currentSurahInfo.ayahOffset) &&
                        targetAyah <= (currentSurahInfo.totalAyahs + currentSurahInfo.ayahOffset)) {
                        // Calculate which page this ayah is on
                        const ayahPage = Math.ceil((targetAyah - currentSurahInfo.ayahOffset) / currentSurahInfo.ayahsPerPage);
                        navigateToAyah(ayahPage, targetAyah);
                    }
                });
                pageJumpContainer.appendChild(pageJumpButton);

                ayahNavBar.appendChild(pageJumpContainer);
            }
        };

        // Update both navs
        updateNav(regularView);
        updateNav(expandedView);
    }

    // Navigate to a specific ayah
    function navigateToAyah(page, ayahNumber) {
        // Update the current page
        currentPage = page;

        // Store the target ayah for after page load
        const targetAyah = ayahNumber;

        // Load the page
        const pageLoaded = new Promise(resolve => {
            // Override the page load function temporarily to get a callback
            const originalLoadSurahPage = loadSurahPage;
            loadSurahPage = function (...args) {
                const result = originalLoadSurahPage.apply(this, args);
                // Restore original function
                loadSurahPage = originalLoadSurahPage;
                resolve();
                return result;
            };

            const originalLoadSurahPageExpanded = loadSurahPageExpanded;
            loadSurahPageExpanded = function (...args) {
                const result = originalLoadSurahPageExpanded.apply(this, args);
                // Restore original function
                loadSurahPageExpanded = originalLoadSurahPageExpanded;
                resolve();
                return result;
            };

            // Trigger page load based on which view is active
            if (browseExpandedState) {
                loadSurahPageExpanded();
            } else {
                loadSurahPage();
            }
        });

        // After page is loaded, scroll to the target ayah
        pageLoaded.then(() => {
            setTimeout(() => {
                // Calculate the index of the target ayah in the current page
                const startAyah = ((currentPage - 1) * currentSurahInfo.ayahsPerPage) + 1 + currentSurahInfo.ayahOffset;
                const targetIndex = ayahNumber - startAyah;

                // Find the verse cards
                const versesContainerId = browseExpandedState ? 'verses-container-expanded' : 'verses-container';
                const versesContainer = document.getElementById(versesContainerId);
                const verseCards = versesContainer.querySelectorAll('.verse-card');

                // Scroll to the target verse card
                if (verseCards[targetIndex]) {
                    verseCards[targetIndex].scrollIntoView({ behavior: 'smooth', block: 'start' });
                    highlightVerse(verseCards[targetIndex]);
                }
            }, 300);
        });
    }

    // Highlight a verse temporarily
    function highlightVerse(verseCard) {
        // Add highlight class
        verseCard.classList.add('verse-highlight');


    }

    // Track scroll position to update active ayah in nav bar
    function setupScrollTracking() {
        // Setup for normal view
        const setupForView = (versesContainerId, navBarSelector) => {
            const versesContainer = document.getElementById(versesContainerId);
            if (!versesContainer) return;

            versesContainer.addEventListener('scroll', () => {
                // Throttle scroll event
                if (versesContainer.scrollTimeout) return;

                versesContainer.scrollTimeout = setTimeout(() => {
                    const navBar = document.querySelector(navBarSelector);
                    if (!navBar) return;

                    // Get all verse cards
                    const verseCards = versesContainer.querySelectorAll('.verse-card');

                    // Find visible verses
                    let visibleIndex = -1;
                    const containerTop = versesContainer.scrollTop;
                    const containerMiddle = containerTop + (versesContainer.clientHeight / 3);

                    // Find the verse that's most visible
                    verseCards.forEach((card, index) => {
                        const cardTop = card.offsetTop;
                        const cardBottom = cardTop + card.offsetHeight;

                        if (cardTop <= containerMiddle && cardBottom >= containerMiddle) {
                            visibleIndex = index;
                        }
                    });

                    // Update active button
                    if (visibleIndex >= 0) {
                        const buttons = navBar.querySelectorAll('.ayah-nav-button');
                        buttons.forEach(button => button.classList.remove('active'));

                        // Find verse ID
                        const verseIdEl = verseCards[visibleIndex].querySelector('.verse-id');
                        if (verseIdEl) {
                            const verseIdText = verseIdEl.textContent;
                            const ayahMatch = verseIdText.match(/\d+:\d+/);
                            if (ayahMatch) {
                                const [_, ayahNum] = ayahMatch[0].split(':').map(Number);

                                // Activate buttons with this ayah number
                                const activeButtons = navBar.querySelectorAll(`.ayah-nav-button[data-ayah="${ayahNum}"]`);
                                activeButtons.forEach(button => button.classList.add('active'));

                                // Scroll nav bar to keep active button visible
                                const firstActiveButton = activeButtons[0];
                                if (firstActiveButton) {
                                    const navBarMiddle = navBar.offsetWidth / 2;
                                    const buttonLeft = firstActiveButton.offsetLeft;
                                    navBar.scrollLeft = buttonLeft - navBarMiddle + (firstActiveButton.offsetWidth / 2);
                                }
                            }
                        }
                    }

                    versesContainer.scrollTimeout = null;
                }, 100);
            });
        };

        // Setup for both views
        setupForView('verses-container', '#surah-browser .ayah-nav-bar');
        setupForView('verses-container-expanded', '#surah-browser-expanded .ayah-nav-bar');
    }

    // Override surah browsing functions to fetch surah info
    function overrideBrowseFunctions() {
        // Override browse button click
        const originalBrowseButtonClick = browseButton.onclick;

        browseButton.onclick = function (event) {
            if (!event.isTrusted) {
                // Only call the original function if it's defined
                if (originalBrowseButtonClick) {
                    return originalBrowseButtonClick.call(this, event);
                }
                return;
            }

            const selectedSurah = surahSelect.value;
            if (!selectedSurah) {
                alert('الرجاء اختيار سورة أولاً');
                return;
            }

            // Fetch surah info before browsing
            fetchSurahInfo(selectedSurah).then(() => {
                // Call original function if defined
                if (originalBrowseButtonClick) {
                    originalBrowseButtonClick.call(this, event);
                }
            });
        };

        // When using expanded view browse button
        if (document.getElementById('browse-button-expanded')) {
            const expandedBrowseBtn = document.getElementById('browse-button-expanded');
            const originalExpandedBrowseClick = expandedBrowseBtn.onclick;

            expandedBrowseBtn.onclick = function (event) {
                if (!event.isTrusted) {
                    // Only call the original function if it's defined
                    if (originalExpandedBrowseClick) {
                        return originalExpandedBrowseClick.call(this, event);
                    }
                    return;
                }

                const expandedSelect = document.getElementById('surah-select-expanded');
                const selectedSurah = expandedSelect.value;
                if (!selectedSurah) {
                    alert('الرجاء اختيار سورة أولاً');
                    return;
                }

                // Fetch surah info before browsing
                fetchSurahInfo(selectedSurah).then(() => {
                    // Call original function if defined
                    if (originalExpandedBrowseClick) {
                        originalExpandedBrowseClick.call(this, event);
                    }
                });
            };
        }
    }


    // Initialize the ayah navigation
    function initAyahNavigation() {
        // Override browse button to fetch surah info
        overrideBrowseFunctions();

        // Initialize expanded view specific events
        initExpandedViewPaginationEvents();

        // Add ayah navigation when loading a surah page
        const originalLoadSurahPage = loadSurahPage;
        loadSurahPage = function (...args) {
            originalLoadSurahPage.apply(this, args);

            // Add navigation after page loads (with small delay to ensure DOM is ready)
            setTimeout(() => {
                createAyahNavBar();
                setupScrollTracking();
            }, 300);
        };

        // Also override for expanded view
        const originalLoadSurahPageExpanded = loadSurahPageExpanded;
        loadSurahPageExpanded = function (...args) {
            originalLoadSurahPageExpanded.apply(this, args);

            // Add navigation after page loads
            setTimeout(() => {
                createAyahNavBar();
                setupScrollTracking();
            }, 300);
        };

        // Update navigation when changing source
        sourceSelector.addEventListener('change', () => {
            setTimeout(createAyahNavBar, 300);
        });
    }
    nextPageButton.addEventListener('click', createAyahNavBar);

    prevPageButton.addEventListener('click', createAyahNavBar);
    // Call to initialize
    initAyahNavigation();

    function addMobileBottomNav() {
        // Only add for mobile devices
        if (window.innerWidth <= 768) {
            const nav = document.createElement('div');
            nav.className = 'mobile-bottom-nav';
            nav.innerHTML = `
                <button id="mobile-chat-btn" aria-label="Chat">💬</button>
                <button id="mobile-browse-btn" aria-label="Browse">📖</button>
                <button id="mobile-sources-btn" aria-label="Sources">📚</button>
                <button id="mobile-top-btn" aria-label="Scroll to top">⬆️</button>
            `;

            document.body.appendChild(nav);

            // Add event listeners
            document.getElementById('mobile-chat-btn').addEventListener('click', () => {
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-browse-btn').addEventListener('click', () => {
                document.querySelector('.browse-container').scrollIntoView({ behavior: 'smooth' });
            });

            document.getElementById('mobile-sources-btn').addEventListener('click', () => {
                userInput.value = "المصادر";
                document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
                sendMessage();
            });

            document.getElementById('mobile-top-btn').addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    addMobileBottomNav();
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
            if (versesContainer) {
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

    addMobileGestureSupport();

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

    addDoubleTapZoom();
    function optimizeMobileKeyboard() {
        if (window.innerWidth <= 768) {
            const userInputField = document.getElementById('user-input');

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
                const suggestionsBar = document.createElement('div');
                suggestionsBar.className = 'quick-suggestions';
                suggestionsBar.innerHTML = `
                    <div class="quick-suggestion" data-text="2:255">آية الكرسي</div>
                    <div class="quick-suggestion" data-text="المصادر">المصادر</div>
                `;

                // Insert after input group
                const inputGroup = document.querySelector('.input-group');
                inputGroup.parentNode.insertBefore(suggestionsBar, inputGroup.nextSibling);

                // Add event listeners
                document.querySelectorAll('.quick-suggestion').forEach(btn => {
                    btn.addEventListener('click', () => {
                        userInputField.value = btn.dataset.text;
                        userInputField.focus();
                    });
                });
            };

            // Call once DOM is fully loaded
            if (document.readyState === 'complete') {
                addQuickSuggestions();
            } else {
                window.addEventListener('load', addQuickSuggestions);
            }
        }
    }

    optimizeMobileKeyboard();


    function optimizeMobilePerformance() {
        // Limit cache size for better memory management on mobile
        const MAX_CACHE_ENTRIES = window.innerWidth <= 768 ? 10 : 20;

        // Override pageCache with a more memory-efficient version
        const cacheEntries = [];
        const originalPageCache = pageCache;

        // Create a new pageCache object with getter/setter
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

    optimizeMobilePerformance();
    function addClearChatButton() {
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
    
        // Add the button container next to the source selector
        const sourceSelector = document.getElementById('source-selector');
        sourceSelector.parentNode.insertBefore(buttonContainer, sourceSelector);
    
        // Also add it to the expanded view when active
        document.addEventListener('click', function (e) {
            if (e.target.id === 'expand-chat') {
                setTimeout(() => {
                    const expandedSourceSelector = document.querySelector('.expanded-container #source-selector');
                    if (expandedSourceSelector) {
                        // Remove the clear button if it was cloned with the source selector
                        const existingClearButton = expandedSourceSelector.querySelector('#clear-chat-button');
                        if (existingClearButton) {
                            existingClearButton.remove();
                        }
                        
                        // Only add the expanded clear button if it doesn't already exist
                        if (!expandedSourceSelector.querySelector('#clear-chat-button-expanded')) {
                            const expandedButtonContainer = buttonContainer.cloneNode(false);
                            expandedButtonContainer.id = 'clear-button-container-expanded';
                            
                            const expandedClearButton = clearButton.cloneNode(true);
                            expandedClearButton.id = 'clear-chat-button-expanded';
                            
                            expandedButtonContainer.appendChild(expandedClearButton);
                            expandedSourceSelector.parentNode.insertBefore(expandedButtonContainer, expandedSourceSelector);
    
                            // Add event listener to the expanded clear button
                            expandedClearButton.addEventListener('click', showClearConfirmation);
                        }
                    }
                }, 100);
            }
        });
    
        // Add click handler to show confirmation dialog
        clearButton.addEventListener('click', showClearConfirmation);
    
        // Function to show confirmation dialog
        function showClearConfirmation() {
            createConfirmDialog(
                'هل أنت متأكد من رغبتك في مسح جميع المحادثات؟', 
                function() {
                    // User confirmed - clear the chat
                    clearChat();
                }
            );
        }
    
        // Function to clear chat and add welcome message
        function clearChat() {
            // Get chat container
            const chatContainer = document.getElementById('chat-container');
    
            // Clear all messages
            chatContainer.innerHTML = '';
    
            // Add welcome message
            addBotMessage("السلام عليكم! أنا بوت التفسير. اسألني عن أي آية من القرآن الكريم وسأقدم لك تفسيرها. يمكنك تحديد سورة وآية مثل (2:255) أو البحث بالنص.");
    
            // Scroll to bottom
            scrollChatToBottom();
        }
    }
    

    addClearChatButton();
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
   
   // Welcome message
   addRulingsMessage('مرحباً بك في بوت الأحكام الشرعية. يمكنك سؤالي عن أي حكم شرعي وسأبحث لك في فتاوي ابن باز.');

   // Add clear chat button
   addClearRulingsButton();
   
   // Event listeners
   rulingsSendButton.addEventListener('click', function() {
       sendRulingsQuery(rulingsUserInput.value);
   });
   
   rulingsUserInput.addEventListener('keypress', function(e) {
       if (e.key === 'Enter') {
           sendRulingsQuery(rulingsUserInput.value);
           e.preventDefault();
       }
   });
   

   // Function to expand rulings chat
   expandRulingsChat.addEventListener('click', function() {
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
       closeButton.addEventListener('click', function() {
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
        function clearRulingsChat() {
            // Clear all messages
            rulingsChatContainer.innerHTML = '';
     
            // Add welcome message
            addRulingsMessage('مرحباً بك في بوت الأحكام الشرعية. يمكنك سؤالي عن أي حكم شرعي وسأبحث لك في فتاوي ابن باز.');
     
            // Scroll to bottom
            scrollRulingsChatToBottom();
        }
        // Add confirmation to the expanded clear button
        clearButtonExpanded.addEventListener('click', function() {
            createConfirmDialog(
                'هل أنت متأكد من رغبتك في مسح جميع المحادثات؟', 
                function() {
                    // User confirmed - clear the chat
                    clearRulingsChat();
                }
            );
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

       newSendButton.addEventListener('click', function() {
           if (newInput.value.trim() !== '') {
               rulingsUserInput.value = newInput.value;
               sendRulingsQuery(newInput.value);
               newInput.value = '';
           }
       });

       newInput.addEventListener('keypress', function(e) {
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
   });

   // Collapse the expanded chat view
// Fix the collapseRulingsChat function

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

   // Add clear button for rulings chat
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
    function clearRulingsChat() {
        // Clear all messages
        rulingsChatContainer.innerHTML = '';
 
        // Add welcome message
        addRulingsMessage('مرحباً بك في بوت الأحكام الشرعية. يمكنك سؤالي عن أي حكم شرعي وسأبحث لك في فتاوي ابن باز.');
 
        // Scroll to bottom
        scrollRulingsChatToBottom();
    }
    // Function to show confirmation dialog
    function showClearConfirmation() {
        createConfirmDialog(
            'هل أنت متأكد من رغبتك في مسح جميع المحادثات؟', 
            function() {
                // User confirmed - clear the chat
                clearRulingsChat();
            }
        );
    }
}


   // Function to add messages to the rulings chat
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

   // Function to check if user is near bottom of chat
   function isRulingsNearBottom() {
       const threshold = 100; // pixels from bottom
       const position = rulingsChatContainer.scrollTop + rulingsChatContainer.clientHeight;
       const bottom = rulingsChatContainer.scrollHeight;

       return bottom - position <= threshold;
   }

   // Function to scroll chat to bottom
   function scrollRulingsChatToBottom() {
       rulingsChatContainer.scrollTop = rulingsChatContainer.scrollHeight;
   }

   // Function to format rulings responses with proper styling
   function formatRulingsResponse(response) {
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
    formattedResponse = formattedResponse.replace(/السؤال: (.+?)(?=\n\n|\n$|$)/g,
        '<div class="ruling-question">$1</div>');

    // Style ruling answers
    formattedResponse = formattedResponse.replace(/الإجابة: (.+?)(?=\n---|$)/gs,
        '<div class="ruling-answer">$1</div>');

    // Style source references
    formattedResponse = formattedResponse.replace(/المصدر: (.+?)(?=\n)/g,
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

   // Function to send query to the API
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

   // Mobile optimizations
   function initializeRulingsMobileFeatures() {
       if (window.innerWidth <= 768) {
           // Double tap to zoom text
           addRulingsDoubleTapZoom();
           
           // Mobile keyboard optimization
           optimizeRulingsMobileKeyboard();
           
           // Mobile gesture support
           addRulingsMobileGestureSupport();
       }
   }

   // Add double-tap zoom for ruling texts
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
       
       // Handle read more buttons
       document.addEventListener('click', function(e) {
        // Check if the clicked element has the 'read-more' class
        if (e.target.classList.contains('read-more')) {
            // Get the parent element (the ruling-answer div)
            const rulingsText = e.target.closest('.ruling-answer');
            if (rulingsText) {
                // Toggle expanded class
                rulingsText.classList.toggle('expanded');
                
                // Update the button text
                if (rulingsText.classList.contains('expanded')) {
                    e.target.textContent = 'عرض أقل';
                    // If expanded, show the full content by removing any height limits
                    rulingsText.style.maxHeight = 'none';
                } else {
                    e.target.textContent = 'قراءة المزيد...';
                    // If collapsed, restore the original height limit
                    rulingsText.style.maxHeight = '150px';
                }
            }
        }
    });
   }

   // Mobile keyboard optimizations
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
           const suggestionsBar = document.createElement('div');
           suggestionsBar.className = 'quick-suggestions';
           suggestionsBar.innerHTML = `
               <div class="quick-suggestion" data-text="حكم الصلاة في السفر">الصلاة في السفر</div>
               <div class="quick-suggestion" data-text="أحكام الزكاة">أحكام الزكاة</div>
           `;

           // Insert after input group
           const inputGroup = document.querySelector('#rulings-tab .input-group');
           inputGroup.parentNode.insertBefore(suggestionsBar, inputGroup.nextSibling);

           // Add event listeners
           suggestionsBar.querySelectorAll('.quick-suggestion').forEach(btn => {
               btn.addEventListener('click', () => {
                   rulingsUserInput.value = btn.dataset.text;
                   rulingsUserInput.focus();
               });
           });
       };

       // Call if DOM is ready or add event listener
       if (document.readyState === 'complete') {
           addRulingsQuickSuggestions();
       } else {
           window.addEventListener('load', addRulingsQuickSuggestions);
       }
   }

   // Add mobile gesture support
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
               document.querySelector('.tab-button:first-child').click(); 
           }, 
           () => { 
               // Right swipe - do nothing or other action
           }
       );
   }


   // Add CSS styles for rulings-specific elements
   function addRulingsStyles() {
    const rulingsStyles = `
        .ruling-title {
            font-size: 1.2em;
            font-weight: bold;
            color: #3a7f89;
            margin-bottom: 10px;
            border-right: 3px solid #3a7f89;
            padding-right: 10px;
        }
        
        .ruling-question {
            font-style: italic;
            color: #555;
            margin-bottom: 10px;
            background-color: #f5f5f5;
            padding: 10px;
            border-radius: 5px;
        }
        
        .ruling-answer {
            margin-top: 10px;
            line-height: 1.6;
            position: relative;
        }
        
        .ruling-source {
            font-size: 0.9em;
            color: #666;
            margin-top: 10px;
            font-style: italic;
        }
        
        .ruling-answer.collapsible {
            position: relative;
            overflow: hidden;
            max-height: 150px;
            transition: max-height 0.5s ease;
        }
        
        .ruling-answer.expanded {
            max-height: none !important;
        }
        
        .read-more {
            color: #3a7f89;
            cursor: pointer;
            font-weight: bold;
            display: inline-block;
            margin-top: 5px;
            padding: 3px 8px;
            background-color: rgba(58, 127, 137, 0.1);
            border-radius: 4px;
        }
        
        .zoomed {
            transition: font-size 0.3s ease;
        }
        
        #clear-rulings-chat-button, #clear-rulings-chat-button-expanded {
            background-color: #f8f8f8;
            border: 1px solid #ddd;
            border-radius: 4px;
            padding: 4px 8px;
            font-size: 12px;
            cursor: pointer;
            margin-right: 10px;
            display: flex;
            align-items: center;
        }
        
        #clear-rulings-chat-button .clear-icon, 
        #clear-rulings-chat-button-expanded .clear-icon {
            margin-left: 5px;
        }
        
        @media (max-width: 768px) {
            #rulings-tab .quick-suggestions {
                display: flex;
                overflow-x: auto;
                padding: 8px 0;
                background-color: #f5f5f5;
                border-top: 1px solid #ddd;
                margin-top: 10px;
            }
            
            #rulings-tab .quick-suggestion {
                white-space: nowrap;
                background-color: white;
                border: 1px solid #ddd;
                border-radius: 15px;
                padding: 5px 15px;
                margin: 0 5px;
                font-size: 14px;
            }
        }
    `;

    // Add styles to head
    const styleElement = document.createElement('style');
    styleElement.textContent = rulingsStyles;
    document.head.appendChild(styleElement);
}

   // Initialize all features
   addRulingsStyles();
   initializeRulingsMobileFeatures();
   
   // Fix tab switching behavior - make sure all UI elements work properly after tab switch
   document.querySelectorAll('.tab-button').forEach(button => {
       button.addEventListener('click', function() {
           // Wait for tab switch animation
           setTimeout(() => {
               // If rulings tab is now active
               if (document.getElementById('rulings-tab').classList.contains('active')) {
                   // Ensure rulings chat scrolls to bottom on tab switch
                   scrollRulingsChatToBottom();
                   
               }
           }, 100);
       });
   });

// Update mobile bottom nav when switching tabs
function updateMobileBottomNavForCurrentTab() {
    const mobileBottomNav = document.querySelector('.mobile-bottom-nav');
    if (!mobileBottomNav || window.innerWidth > 768) return;
    
    // Check which tab is currently active
    const isRulingsTabActive = document.getElementById('rulings-tab').classList.contains('active');
    
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
            userInput.value = "المصادر";
            document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            sendMessage();
        });
        
        document.getElementById('mobile-top-btn').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Replace the mobile bottom nav adding function
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
            userInput.value = "المصادر";
            document.querySelector('.chat-container-wrapper').scrollIntoView({ behavior: 'smooth' });
            sendMessage();
        });
        
        document.getElementById('mobile-top-btn').addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
}

// Update the openTab function to call our nav updater
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

// Function to show a floating test alert
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

// Make openTab global so the HTML onclick can access it
window.openTab = openTab;
document.body.addEventListener('click', function(e) {
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




});

