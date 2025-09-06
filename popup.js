// DOM elements
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const autoDetectBtn = document.getElementById('autoDetectBtn');
const clearBtn = document.getElementById('clearBtn');
const results = document.getElementById('results');
const selectedTextDiv = document.getElementById('selectedTextDiv');
const selectedTextSpan = document.getElementById('selectedText');

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  loadSelectedText();
  setupEventListeners();
});

function setupEventListeners() {
  searchBtn.addEventListener('click', handleSearch);
  autoDetectBtn.addEventListener('click', handleAutoDetect);
  clearBtn.addEventListener('click', handleClear);
  
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      handleSearch();
    }
  });
}

// Load any previously selected text
async function loadSelectedText() {
  try {
    // Check storage for selected text
    const result = await chrome.storage.local.get(['selectedText', 'timestamp']);
    
    if (result.selectedText && result.timestamp) {
      const timeDiff = Date.now() - result.timestamp;
      // Only use if selected within last 30 seconds
      if (timeDiff < 30000) {
        displaySelectedText(result.selectedText);
        searchInput.value = result.selectedText;
      }
    }
    
    // Also try to get current selection from active tab
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (tabs[0] && tabs[0].url.includes('youtube.com')) {
      chrome.tabs.sendMessage(tabs[0].id, {action: 'getSelectedText'}, (response) => {
        if (response && response.text) {
          displaySelectedText(response.text);
          if (!searchInput.value) {
            searchInput.value = response.text;
          }
        }
      });
    }
  } catch (error) {
    console.error('Error loading selected text:', error);
  }
}

function displaySelectedText(text) {
  if (text && text.length > 0) {
    selectedTextSpan.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;
    selectedTextDiv.style.display = 'block';
  }
}

// Handle search button click
async function handleSearch() {
  const query = searchInput.value.trim();
  
  if (!query) {
    showError('Please enter a song name or artist');
    return;
  }
  
  setLoading(true);
  
  // Add timeout to prevent infinite loading
  const searchTimeout = setTimeout(() => {
    setLoading(false);
    showError('Search timed out. Try using the search buttons below!');
  }, 10000); // 10 second timeout
  
  try {
    // Send message to background script to search lyrics
    chrome.runtime.sendMessage({
      action: 'searchLyrics',
      query: query
    }, (response) => {
      clearTimeout(searchTimeout);
      setLoading(false);
      
      console.log('Received response:', response);
      
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError);
        showError('Extension error: ' + chrome.runtime.lastError.message);
        return;
      }
      
      if (response && response.success) {
        displayLyrics(response.lyrics);
      } else if (response && response.lyrics) {
        // Handle error response with fallback lyrics
        displayLyrics(response.lyrics);
      } else {
        showError(response ? response.error || 'Unknown error' : 'No response received');
      }
    });
    
  } catch (error) {
    clearTimeout(searchTimeout);
    setLoading(false);
    console.error('Search error:', error);
    showError('Error searching lyrics: ' + error.message);
  }
}

// Handle auto-detect button click
async function handleAutoDetect() {
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0]) {
      showError('No active tab found');
      return;
    }
    
    if (!tabs[0].url.includes('youtube.com')) {
      showError('Please navigate to a YouTube video first');
      return;
    }
    
    showMessage('Detecting song info...');
    
    // Simple approach: just get the page title
    const title = tabs[0].title || '';
    console.log('Page title:', title);
    
    if (title && title !== 'YouTube') {
      // Clean up the title (remove " - YouTube" suffix)
      const cleanTitle = title.replace(/\s*-\s*YouTube\s*$/, '').trim();
      
      if (cleanTitle) {
        searchInput.value = cleanTitle;
        showMessage(`Auto-detected: ${cleanTitle}`);
        return;
      }
    }
    
    // If page title doesn't work, try content script
    chrome.tabs.sendMessage(tabs[0].id, {action: 'getPageInfo'}, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Content script error:', chrome.runtime.lastError);
        showError('Could not access page content. Try selecting text manually.');
        return;
      }
      
      if (response && response.title) {
        searchInput.value = response.title;
        showMessage(`Auto-detected: ${response.title}`);
      } else {
        showError('Could not detect song info. Try selecting the video title manually.');
      }
    });
    
  } catch (error) {
    console.error('Auto-detect error:', error);
    showError('Auto-detect failed: ' + error.message);
  }
}

// Handle clear button click
function handleClear() {
  searchInput.value = '';
  selectedTextDiv.style.display = 'none';
  results.innerHTML = '<div class="loading">👋 Enter a search query above to get started!</div>';
  chrome.storage.local.remove(['selectedText', 'timestamp']);
}

// Display lyrics in results section
function displayLyrics(lyricsData) {
  console.log('Displaying lyrics data:', lyricsData);
  
  // Create Google search URL
  const searchQuery = `${lyricsData.title || ''} ${lyricsData.artist || ''} lyrics`.trim();
  const googleUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
  
  results.innerHTML = `
    <div style="margin-bottom: 12px;">
      <strong>${lyricsData.title}</strong>
      ${lyricsData.artist && lyricsData.artist !== 'Unknown Artist' && lyricsData.artist !== 'Unknown' ? `<br><small>by ${lyricsData.artist}</small>` : ''}
    </div>
    <div class="lyrics-text">${lyricsData.lyrics}</div>
    ${lyricsData.source ? `<div style="margin-top: 12px; font-size: 12px; opacity: 0.7;">Source: ${lyricsData.source}</div>` : ''}
    <div style="margin-top: 16px;">
      <button id="googleSearchBtn" class="search-btn" style="background: #4285f4; width: 100%;">
        🔍 Search Full Lyrics on Google
      </button>
    </div>
  `;
  
  // Add event listener after the HTML is inserted
  setTimeout(() => {
    const googleBtn = document.getElementById('googleSearchBtn');
    if (googleBtn) {
      googleBtn.addEventListener('click', () => {
        console.log('Opening Google search:', googleUrl);
        window.open(googleUrl, '_blank');
      });
      console.log('Google button event listener added');
    } else {
      console.error('Google button not found in DOM');
    }
  }, 100);
  
  console.log('Google search query:', searchQuery);
  console.log('Google URL:', googleUrl);
}

// Show error message
function showError(message) {
  results.innerHTML = `<div class="error">❌ ${message}</div>`;
}

// Show info message
function showMessage(message) {
  results.innerHTML = `<div class="loading">ℹ️ ${message}</div>`;
}

// Set loading state
function setLoading(isLoading) {
  searchBtn.disabled = isLoading;
  searchBtn.textContent = isLoading ? '🔍 Searching...' : '🔍 Find Lyrics';
  
  if (isLoading) {
    results.innerHTML = '<div class="loading">🎵 Searching for lyrics...</div>';
  }
}