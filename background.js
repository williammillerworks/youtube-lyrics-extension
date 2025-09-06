// Create context menu when extension is installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
      id: 'findLyrics',
      title: 'Find Lyrics for "%s"',
      contexts: ['selection'],
      documentUrlPatterns: ['https://www.youtube.com/*']
    });
    
    console.log('YouTube Lyrics Finder installed!');
  });
  
  // Handle context menu clicks
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === 'findLyrics') {
      console.log('Context menu clicked, selected text:', info.selectionText);
      
      // Store the selected text
      chrome.storage.local.set({
        selectedText: info.selectionText,
        timestamp: Date.now()
      });
      
      // Open the popup by sending message to content script
      chrome.tabs.sendMessage(tab.id, {
        action: 'contextMenuClicked',
        text: info.selectionText
      });
    }
  });
  
  // Handle messages from content script and popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'textSelected') {
      // Store selected text for popup access
      chrome.storage.local.set({
        selectedText: request.text,
        currentUrl: request.url,
        timestamp: Date.now()
      });
    }
    
    if (request.action === 'searchLyrics') {
      console.log('Received search request for:', request.query);
      
      searchLyrics(request.query)
        .then(lyrics => {
          console.log('Search completed successfully:', lyrics);
          sendResponse({ success: true, lyrics });
        })
        .catch(error => {
          console.error('Search failed with error:', error);
          sendResponse({ 
            success: false, 
            error: error.message,
            lyrics: {
              title: request.query,
              artist: 'Error',
              lyrics: `Search failed: ${error.message}\n\nTry using the search buttons below instead!`,
              source: 'Error',
              searchLinks: {
                genius: `https://genius.com/search?q=${encodeURIComponent(request.query)}`,
                google: `https://www.google.com/search?q=${encodeURIComponent(request.query + ' lyrics')}`
              }
            }
          });
        });
      return true; // Will respond asynchronously
    }
  });
  
  // Real lyrics search function using alternative approach
  async function searchLyrics(query) {
    console.log('=== STARTING SEARCH ===');
    console.log('Query:', query);
    
    try {
      // Clean and format the query
      const cleanQuery = query.replace(/[^\w\s-]/g, '').trim();
      console.log('Cleaned query:', cleanQuery);
      
      // Parse artist and song from query
      const songInfo = parseSongQuery(cleanQuery);
      console.log('Parsed song info:', songInfo);
      
      // Quick fallback - always return search links immediately
      const fallbackResult = {
        title: songInfo.song || cleanQuery,
        artist: songInfo.artist || 'Unknown Artist',
        lyrics: `🎵 Search for "${cleanQuery}"\n\n📖 Click the buttons below to find lyrics on popular sites!\n\n• Genius.com - Most comprehensive database\n• Google Search - Multiple sources\n\nTip: Use "Artist - Song" format for best results!`,
        source: 'Quick Search',
        searchLinks: {
          genius: `https://genius.com/search?q=${encodeURIComponent(cleanQuery)}`,
          google: `https://www.google.com/search?q=${encodeURIComponent(cleanQuery + ' lyrics')}`
        }
      };
      
      // Try API in background, but return fallback immediately if it takes too long
      const timeoutPromise = new Promise((resolve) => {
        setTimeout(() => {
          console.log('Using fallback due to timeout');
          resolve(fallbackResult);
        }, 3000); // 3 second timeout
      });
      
      const apiPromise = (async () => {
        if (songInfo.artist && songInfo.song) {
          console.log('Trying API search...');
          const apiResult = await searchWithLyricsAPI(songInfo.artist, songInfo.song);
          if (apiResult) {
            console.log('API search successful!');
            return apiResult;
          }
        }
        console.log('API search failed, using fallback');
        return fallbackResult;
      })();
      
      return await Promise.race([timeoutPromise, apiPromise]);
      
    } catch (error) {
      console.error('Error in searchLyrics:', error);
      
      return {
        title: query,
        artist: 'Error',
        lyrics: `⚠️ Search error for "${query}"\n\nBut don't worry! Click the buttons below to search manually:\n\n• Genius.com\n• Google Search\n\nError: ${error.message}`,
        source: 'Error',
        searchLinks: {
          genius: `https://genius.com/search?q=${encodeURIComponent(query)}`,
          google: `https://www.google.com/search?q=${encodeURIComponent(query + ' lyrics')}`
        }
      };
    }
  }
  
  // Parse artist and song from query
  function parseSongQuery(query) {
    // Common patterns: "Artist - Song", "Artist: Song", "Song by Artist"
    const patterns = [
      { regex: /^(.+?)\s*-\s*(.+)$/, artistIndex: 1, songIndex: 2 },
      { regex: /^(.+?)\s*:\s*(.+)$/, artistIndex: 1, songIndex: 2 },
      { regex: /^(.+?)\s+by\s+(.+)$/i, artistIndex: 2, songIndex: 1 }
    ];
    
    for (const pattern of patterns) {
      const match = query.match(pattern.regex);
      if (match) {
        return {
          artist: match[pattern.artistIndex].trim(),
          song: match[pattern.songIndex].trim()
        };
      }
    }
    
    // If no pattern matches, assume it's just a song name
    return {
      artist: null,
      song: query.trim()
    };
  }
  
  // Try to use a public lyrics API
  async function searchWithLyricsAPI(artist, song) {
    if (!artist || !song) return null;
    
    try {
      // Using lyrics.ovh - free public API
      const apiUrl = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(song)}`;
      console.log('Trying lyrics API:', apiUrl);
      
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        if (data.lyrics) {
          // Return first few lines only due to copyright
          const lyricsPreview = data.lyrics.split('\n').slice(0, 4).join('\n') + '\n\n[Click below to view full lyrics]';
          
          return {
            title: song,
            artist: artist,
            lyrics: `Found "${song}" by ${artist}!\n\nPreview:\n${lyricsPreview}`,
            source: 'Lyrics.ovh API',
            fullLyricsAvailable: true
          };
        }
      }
    } catch (error) {
      console.log('Lyrics API failed:', error);
    }
    
    return null;
  }