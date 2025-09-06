# YouTube Lyrics Extension

> Find song lyrics instantly while watching YouTube videos

[![Chrome Web Store](https://img.shields.io/badge/Chrome-Web%20Store-blue)](link-when-published)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

## Project Overview
A Chrome extension that allows users to easily find song lyrics while watching YouTube music videos by extracting artist and song information and searching for lyrics on popular lyrics websites.

## Core Features

### 1. Text Selection & Extraction
- **Drag Selection**: Users can drag to select artist name and song title from YouTube video titles, descriptions, or comments
- **Right-Click Context Menu**: Add a custom context menu option "Find Lyrics" when text is selected
- **Auto-Detection**: Optionally parse YouTube video titles automatically to extract artist and song information

### 2. Lyrics Search Integration
- **Primary Source**: Genius.com (largest and most comprehensive lyrics database)
- **Backup Sources**: 
  - AZLyrics.com
  - MetroLyrics
  - LyricFind API (if available)
- **Search Algorithm**: Clean and format the extracted text for optimal search results

### 3. User Interface
- **Popup Window**: Display lyrics in a clean, readable popup overlay
- **Side Panel**: Alternative display as a Chrome side panel
- **Formatting**: Properly formatted lyrics with verse/chorus separation
- **Controls**: Copy lyrics, open source website, search different song

## Technical Architecture

### Chrome Extension Components

#### 1. Manifest (manifest.json)
```json
{
  "manifest_version": 3,
  "name": "YouTube Lyrics Finder",
  "version": "1.0",
  "permissions": [
    "contextMenus",
    "activeTab",
    "storage"
  ],
  "host_permissions": [
    "https://www.youtube.com/*",
    "https://genius.com/*"
  ]
}
```

#### 2. Content Script (content.js)
- Runs on YouTube pages
- Handles text selection detection
- Communicates with background script
- Injects UI elements

#### 3. Background Script (background.js)
- Manages context menu creation
- Handles API calls to lyrics services
- Coordinates between content script and popup

#### 4. Popup Script (popup.js/popup.html)
- Displays lyrics interface
- Handles user interactions
- Manages settings

### Implementation Strategy

#### Phase 1: Basic Functionality
1. **Set up extension structure** with manifest.json
2. **Create content script** to detect YouTube pages
3. **Implement text selection** detection and context menu
4. **Basic lyrics search** using Genius.com web scraping

#### Phase 2: Enhanced Features
1. **Improve search accuracy** with better text parsing
2. **Add multiple lyrics sources** with fallback system
3. **Implement caching** to avoid repeated searches
4. **Add user preferences** and settings

#### Phase 3: Polish & Optimization
1. **UI/UX improvements** with better styling
2. **Error handling** and loading states
3. **Performance optimization**
4. **User feedback system**

## Lyrics Source Integration

### Genius.com Integration
- **Method**: Web scraping (no official free API)
- **Search URL**: `https://genius.com/search?q={artist}+{song}`
- **Parsing**: Extract lyrics from HTML structure
- **Rate Limiting**: Implement delays between requests

### Alternative Approaches
- **LyricsAPI**: Free API service (if available)
- **MusixMatch API**: Commercial API with free tier
- **Custom aggregation**: Combine multiple sources

## User Experience Flow

1. **User watches YouTube music video**
2. **Selects artist and song text** by dragging
3. **Right-clicks and selects "Find Lyrics"**
4. **Extension processes the selection**:
   - Cleans and formats the text
   - Searches lyrics database
   - Retrieves and parses lyrics
5. **Displays lyrics** in popup or side panel
6. **User can**:
   - Read full lyrics
   - Copy lyrics
   - Search for different song
   - Open source website

## Technical Considerations

### Data Privacy
- No personal data collection
- Lyrics cached locally only
- User searches not tracked

### Performance
- Lazy loading of lyrics content
- Caching frequently searched songs
- Minimal resource usage

### Error Handling
- Network connectivity issues
- Lyrics not found scenarios
- Invalid text selections
- Rate limiting from lyrics sites

### Browser Compatibility
- Chrome/Chromium browsers
- Manifest V3 compliance
- Cross-platform support

## Development Roadmap

### Week 1: Foundation
- Set up Chrome extension boilerplate
- Implement basic YouTube page detection
- Create context menu functionality

### Week 2: Core Features
- Text selection detection
- Basic Genius.com integration
- Simple popup UI

### Week 3: Enhancement
- Multiple lyrics sources
- Better text parsing algorithms
- Improved UI design

### Week 4: Polish
- Error handling
- Performance optimization
- User testing and feedback

## Future Enhancements

### Advanced Features
- **Auto-sync with video playback**: Highlight current lyrics line
- **Translation support**: Multi-language lyrics
- **Offline mode**: Cache popular songs
- **Social features**: Share lyrics, create playlists

### Integration Possibilities
- Spotify integration for cross-platform use
- Apple Music compatibility
- Last.fm scrobbling
- Social media sharing

## Resources & APIs

### Lyrics Services
- **Genius.com**: Web scraping approach
- **LyricsAPI**: Free tier available
- **MusixMatch**: Commercial with free tier
- **ChartLyrics**: SOAP API (older)

### Development Tools
- Chrome Extension Developer Tools
- YouTube Data API (for enhanced features)
- Web scraping libraries (Cheerio for Node.js)

### Legal Considerations
- Respect robots.txt files
- Implement proper rate limiting
- Consider fair use policies
- Attribution to lyrics sources

## Success Metrics
- User adoption rate
- Lyrics retrieval accuracy
- Response time performance
- User satisfaction feedback
- Extension store ratings

---

*This document serves as the comprehensive guide for developing the YouTube Lyrics Chrome Extension. Regular updates will be made as the project evolves.*
