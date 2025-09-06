console.log('YouTube Lyrics Finder loaded!');

let selectedText = '';

// Listen for text selection
document.addEventListener('mouseup', function(e) {
  const selection = window.getSelection();
  selectedText = selection.toString().trim();
  
  if (selectedText.length > 0) {
    console.log('Selected text:', selectedText);
    
    // Store selected text for the popup
    chrome.runtime.sendMessage({
      action: 'textSelected',
      text: selectedText,
      url: window.location.href
    });
  }
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getSelectedText') {
    sendResponse({
      text: selectedText,
      url: window.location.href
    });
  }
  
  if (request.action === 'getPageInfo') {
    console.log('Auto-detect triggered on:', window.location.href);
    
    // Wait a bit for YouTube to load if needed
    setTimeout(() => {
      // Try multiple selectors for YouTube video title
      const titleSelectors = [
        'h1.style-scope.ytd-watch-metadata yt-formatted-string',
        'h1.ytd-watch-metadata yt-formatted-string',
        'h1 yt-formatted-string',
        '.title.style-scope.ytd-video-primary-info-renderer',
        'h1[class*="title"]',
        '.watch-title',
        '#title h1'
      ];
      
      let title = '';
      let foundSelector = '';
      
      for (const selector of titleSelectors) {
        console.log('Trying selector:', selector);
        const element = document.querySelector(selector);
        if (element) {
          title = element.textContent || element.innerText || '';
          if (title.trim()) {
            foundSelector = selector;
            console.log('Found title with selector:', selector, 'Title:', title);
            break;
          }
        }
      }
      
      // If no specific selector worked, try a broader search
      if (!title.trim()) {
        const allH1s = document.querySelectorAll('h1');
        console.log('Trying all h1 elements, found:', allH1s.length);
        for (const h1 of allH1s) {
          const text = h1.textContent || h1.innerText || '';
          if (text.trim() && text.length > 10) { // Assume video titles are longer than 10 chars
            title = text;
            foundSelector = 'h1 (generic)';
            console.log('Found title in h1:', title);
            break;
          }
        }
      }
      
      // Try to get channel name
      const channelSelectors = [
        '#channel-name a',
        '.ytd-channel-name a',
        '#owner-name a',
        '.ytd-video-owner-renderer a',
        'a[href*="/channel/"]',
        'a[href*="/@"]'
      ];
      
      let channel = '';
      for (const selector of channelSelectors) {
        const element = document.querySelector(selector);
        if (element) {
          channel = element.textContent || element.innerText || '';
          if (channel.trim()) break;
        }
      }
      
      console.log('Final results - Title:', title, 'Channel:', channel, 'Selector used:', foundSelector);
      
      sendResponse({
        title: title.trim(),
        channel: channel.trim(),
        url: window.location.href,
        debug: {
          foundSelector: foundSelector,
          totalH1s: document.querySelectorAll('h1').length
        }
      });
    }, 500); // Wait 500ms for page to load
    
    return true; // Will respond asynchronously
  }
});

// Auto-detect song info from video title
function detectSongInfo() {
  const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
  if (titleElement) {
    const title = titleElement.textContent;
    console.log('Video title:', title);
    
    // Common patterns: "Artist - Song", "Artist: Song", "Song by Artist"
    const patterns = [
      /^(.+?)\s*-\s*(.+)$/,
      /^(.+?)\s*:\s*(.+)$/,
      /^(.+?)\s+by\s+(.+)$/i
    ];
    
    for (const pattern of patterns) {
      const match = title.match(pattern);
      if (match) {
        console.log('Detected artist:', match[1], 'song:', match[2]);
        return { artist: match[1].trim(), song: match[2].trim() };
      }
    }
  }
  return null;
}