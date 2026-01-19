# Highlightly API Integration Analysis

## Issue Summary
- Demo tool works: https://highlightly.net/demo
- Endpoint tested: `/football/bookmakers`
- Demo returns: `{ "data": [...], "plan": {...} }`
- Our backend sometimes receives 403 or incorrect responses

## Current Backend Implementation

### Base URL
```javascript
const HIGHLIGHTLY_BASE_URL = USE_RAPIDAPI 
  ? 'https://sport-highlights-api.p.rapidapi.com'
  : 'https://sports.highlightly.net';
```

### Headers (Direct Highlightly)
```javascript
{
  'x-api-key': HIGHLIGHTLY_API_KEY,
  'Content-Type': 'application/json',
  'Accept': 'application/json',
}
```

### Headers (RapidAPI)
```javascript
{
  'X-RapidAPI-Key': HIGHLIGHTLY_API_KEY,
  'X-RapidAPI-Host': 'sport-highlights-api.p.rapidapi.com',
  'Content-Type': 'application/json',
}
```

### API Key Source
- Environment variable: `HIGHLIGHTLY_API_KEY`
- Validated on startup (warns if missing)

## Potential Issues Identified

### 1. Header Case Sensitivity
- **Current**: `'x-api-key'` (lowercase)
- **Possible Issue**: API might require `'X-API-Key'` or `'X-Api-Key'`

### 2. Missing Bookmakers Endpoint
- **Demo tests**: `/football/bookmakers`
- **Our code**: No bookmakers endpoint implemented
- **Impact**: Cannot verify if this endpoint works

### 3. Base URL Mismatch
- **Demo tool**: Likely uses `https://highlightly.net` or `https://api.highlightly.net`
- **Our code**: Uses `https://sports.highlightly.net`
- **Impact**: Different base URLs might have different authentication requirements

### 4. Missing Headers
- Demo tool might send additional headers:
  - `User-Agent`
  - `Origin`
  - `Referer`
  - Custom headers

### 5. API Key Placement
- **Current**: Header only (`x-api-key`)
- **Possible**: API might require key in URL path or query parameter

### 6. HTTP Method
- **Current**: All requests use GET
- **Verification needed**: Confirm demo tool uses GET

### 7. Query Parameters
- **Current**: Some endpoints use query params
- **Possible**: Missing required params or wrong format

## Next Steps

1. Test the exact endpoint from demo: `/football/bookmakers`
2. Compare request headers using browser DevTools
3. Verify API key is correctly loaded at runtime
4. Check if API plan restricts certain endpoints
5. Test with different header formats
