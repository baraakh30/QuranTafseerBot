document.addEventListener('DOMContentLoaded', function () {
    // Quran Chat elements
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const sourceSelector = document.getElementById('tafseer-source');
    const suggestions = document.querySelectorAll('.suggestion');

    // Quran browsing elements
    const surahSelect = document.getElementById('surah-select');
    const browseButton = document.getElementById('browse-button');
    const surahBrowser = document.getElementById('surah-browser');
    const surahTitle = document.getElementById('surah-title');
    const versesContainer = document.getElementById('verses-container');
    const prevPageButton = document.getElementById('prev-page');
    const nextPageButton = document.getElementById('next-page');
    const pageInfo = document.getElementById('page-info');
    const expandChatBtn = document.getElementById('expand-chat');
    const expandBrowseBtn = document.getElementById('expand-browse');

    // Quran browsing state
    let currentSurah = null;
    let currentPage = 1;
    let totalPages = 1;
    let chatExpandedState = false;
    let browseExpandedState = false;
    const pageCache = {};

    // Surah information
    let currentSurahInfo = {
        totalAyahs: 0,
        ayahsPerPage: 2,
        ayahOffset: 0
    };

    // Store original parent elements for collapse functionality
    const chatContainerWrapper = document.querySelector('.chat-container-wrapper');
    const browseContainerWrapper = document.querySelector('.browse-container-wrapper');
    const originalChatParent = chatContainerWrapper ? chatContainerWrapper.parentNode : null;
    const originalBrowseParent = browseContainerWrapper ? browseContainerWrapper.parentNode : null;

    // Welcome message
    addBotMessage("السلام عليكم! أنا بوت التفسير. اسألني عن أي آية من القرآن الكريم وسأقدم لك تفسيرها. يمكنك تحديد سورة وآية مثل (2:255) أو البحث بالنص.");

    // Initialize
    initializeQuranChat();
    initializeQuranBrowsing();
    addClearChatButton();

    // Make necessary functions available to other modules
    window.sendMessage = sendMessage;

    function initializeQuranChat() {
        // Event listeners
        sendButton.addEventListener('click', sendMessage);
        userInput.addEventListener('keypress', function (e) {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

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

        // Expand chat button
        if (expandChatBtn) {
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
            });
        }
            // Setup read more/less functionality
    setupReadMoreListeners();
    }
/**
 * Set up listeners for the read more/less functionality
 */
function setupReadMoreListeners() {
    document.body.addEventListener('click', function (e) {
        if (e.target && e.target.classList.contains('read-more')) {
            const section = e.target.closest('.collapsible');
            if (!section) return;

            // Get the button text to determine if it's "read more" or "show less"
            const isReadMore = e.target.textContent.includes('قراءة المزيد');

            if (section.classList.contains('expanded')) {
                // Collapse the section
                section.classList.remove('expanded');
                
                // Restore original height and shortened content
                const fullContent = section.getAttribute('data-full-content');
                if (fullContent) {
                    const maxChars = window.innerWidth <= 768 ? 300 : 500;
                    const shortContent = fullContent.substring(0, maxChars) + 
                        '... <span class="read-more">قراءة المزيد...</span>';
                    
                    section.innerHTML = shortContent;
                    
                    // Re-add the data attribute that gets overwritten by innerHTML
                    section.setAttribute('data-full-content', fullContent);
                }
            } else {
                // Expand the section
                section.classList.add('expanded');

                // Show full content
                const fullContent = section.getAttribute('data-full-content');
                if (fullContent) {
                    section.innerHTML = fullContent +
                        ' <span class="read-more">عرض أقل</span>';
                    
                    // Re-add the data attribute that gets overwritten by innerHTML
                    section.setAttribute('data-full-content', fullContent);
                }
            }
        }
    });
}
    function initializeQuranBrowsing() {
        // Event listeners for browsing
        if (browseButton) {
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
        }

        if (prevPageButton) {
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
        }

        if (nextPageButton) {
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
        }

        // Expand browse button
        if (expandBrowseBtn) {
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

                // Initialize expanded view pagination events
                initExpandedViewPaginationEvents();
            });
        }

        // Initialize pagination navigation if it exists
        if (nextPageButton && prevPageButton) {
            nextPageButton.addEventListener('click', createAyahNavBar);
            prevPageButton.addEventListener('click', createAyahNavBar);
        }

        // Initialize ayah navigation
        initAyahNavigation();
    }

    // Chat functionality
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

    function scrollToBottom() {
        scrollChatToBottom();
    }

    function formatResponse(response) {
        // Use the shared formatResponse function from core.js
        let formattedResponse = window.formatResponse(response);
        
        // Now add read more functionality for long responses
        return addReadMoreFunctionality(formattedResponse);
    }
    
    /**
     * Add read more functionality to long text sections
     */
    function addReadMoreFunctionality(content) {
        // Don't process if the content is short
        if (content.length < 300) return content;
        
        const maxChars = window.innerWidth <= 768 ? 300 : 500;
        
        // Process the HTML to add read more buttons to long sections
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        
        // Look for text blocks that are likely to be long
        const textSections = [...tempDiv.querySelectorAll('.tafseer-text, .verse-text, .quran-text, p')];
        textSections.forEach(section => {
            const content = section.innerHTML;
            // Only add read more if content is long enough
            if (content.length > maxChars) {
                // Set the class and create shortened content
                section.className = section.className + ' collapsible';
                const shortContent = content.substring(0, maxChars) + '...';
                
                // Add read more button
                section.innerHTML = shortContent + ' <span class="read-more">قراءة المزيد...</span>';
                
                // Store full content as a data attribute for later expansion
                section.setAttribute('data-full-content', content);
            }
        });
        
        return tempDiv.innerHTML;
    }

    // Collapse expanded views
    function collapseChat() {
        if (!chatExpandedState) return;

        chatExpandedState = false;
        chatContainer.classList.remove('expanded');

        // Return the chat container to its original position
        originalChatParent.insertBefore(chatContainerWrapper, document.querySelector('.input-group'));

        // Remove expanded view
        document.getElementById('chat-expanded-view').remove();
    }

    function collapseBrowse() {
        if (!browseExpandedState) return;

        browseExpandedState = false;

        // Remove expanded view
        document.getElementById('browse-expanded-view').remove();
    }

    // Browsing functions
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
        // Apply formatting and then add read more functionality
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
                    // Apply formatting and then add read more functionality
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

    // Expanded view functions
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
                // Apply formatting and then add read more functionality
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

    // Ayah navigation
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

    function highlightVerse(verseCard) {
        // Add highlight class
        verseCard.classList.add('verse-highlight');
    }

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

        // Add the button container AFTER the source selector (changed from 'insertBefore' to 'insertAfter')
        const sourceSelector = document.getElementById('source-selector');
        sourceSelector.parentNode.insertBefore(buttonContainer, sourceSelector.nextSibling);

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
                            // Insert AFTER the expanded source selector
                            expandedSourceSelector.parentNode.insertBefore(expandedButtonContainer, expandedSourceSelector.nextSibling);

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
                function () {
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


});