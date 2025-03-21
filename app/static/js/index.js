document.addEventListener('DOMContentLoaded', function() {
    const chatContainer = document.getElementById('chat-container');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    const sourceSelector = document.getElementById('tafseer-source');
    const suggestions = document.querySelectorAll('.suggestion');
    
    // Welcome message
    addBotMessage("السلام عليكم! أنا بوت التفسير. اسألني عن أي آية من القرآن الكريم وسأقدم لك تفسيرها. يمكنك تحديد سورة وآية مثل (2:255) أو البحث بالنص.");
    
    // Event listeners
    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // Add suggestion click events
    suggestions.forEach(suggestion => {
        suggestion.addEventListener('click', function(e) {
            e.preventDefault();
            const query = this.getAttribute('data-query');

            
            // Check if the query is for Surah Al-Fatiha
            if (query === "1:1") {
                // Scroll to the surah browsing section
                document.querySelector('.browse-container').scrollIntoView({ behavior: 'smooth' });
                
                // Select the first surah in the dropdown
                setTimeout(() => {
                    surahSelect.value = "1";
                    // Trigger the browse button click
                    browseButton.click();
                    
                    // Wait for content to load and scroll to verses container
                    setTimeout(() => {
                        versesContainer.scrollIntoView({ behavior: 'smooth' });
                    }, 500);
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

browseButton.addEventListener('click', function() {
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

prevPageButton.addEventListener('click', function() {
if (currentPage > 1) {
    // Show loading only if page isn't cached
    const cacheKey = `${currentSurah}_${currentPage-1}`;
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

nextPageButton.addEventListener('click', function() {
if (currentPage < totalPages) {
    // Show loading only if page isn't cached
    const cacheKey = `${currentSurah}_${currentPage+1}`;
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
expandChatBtn.addEventListener('click', function() {
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
closeButton.addEventListener('click', function() {
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
newSourceSelector.addEventListener('change', function() {
sourceSelector.value = this.value;
});

const newInput = expandedContainer.querySelector('#user-input');
newInput.id = 'user-input-expanded';
const newSendButton = expandedContainer.querySelector('#send-button');
newSendButton.id = 'send-button-expanded';

newSendButton.addEventListener('click', function() {
if (newInput.value.trim() !== '') {
    userInput.value = newInput.value;
    sendMessage();
    newInput.value = '';
}
});

newInput.addEventListener('keypress', function(e) {
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
refreshAnimations();
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
expandBrowseBtn.addEventListener('click', function() {
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
closeButton.addEventListener('click', function() {
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
browseBtnClone.addEventListener('click', function() {
const selectedSurah = surahSelectClone.value;
if (!selectedSurah) {
    alert('الرجاء اختيار سورة أولاً');
    return;
}

// Update the original select
surahSelect.value = selectedSurah;

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
prevPageBtnClone.addEventListener('click', function() {
if (currentPage > 1) {
    currentPage--;
    loadSurahPageExpanded();
    
    // Update original buttons
    prevPageButton.disabled = (currentPage <= 1);
    nextPageButton.disabled = (currentPage >= totalPages);
}
});

nextPageBtnClone.addEventListener('click', function() {
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
surahBrowserClone.style.display = 'block';
loadSurahPageExpanded();
}

// Initialize new animations
refreshAnimations();
});

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
}


});

