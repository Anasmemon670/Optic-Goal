# Postman API Test Guide - OptikGoal API

## 🔑 API Key Details
**API Key:** `9ad61eb6-dab4-4968-82cc-2eca2a2b9453`

## 📡 Base URLs
- **Football API:** `https://v3.football.api-sports.io`
- **Basketball API:** `https://v1.basketball.api-sports.io`

## 🔧 Required Headers
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io (for football)
x-rapidapi-host: v1.basketball.api-sports.io (for basketball)
```

---

## ⚽ Football API Endpoints

### 1. Get Live Football Matches
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/fixtures?live=all`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

---

### 2. Get Football Fixtures (Upcoming/By Date)
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/fixtures?date=2026-01-13`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

**Query Parameters:**
- `date` (optional): Format `YYYY-MM-DD` (e.g., `2026-01-13`)
- `league` (optional): League ID (e.g., `39` for Premier League)

**Example:**
```
https://v3.football.api-sports.io/fixtures?date=2026-01-13&league=39
```

---

### 3. Get Football Match Details
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/fixtures?id=1035098`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

**Query Parameters:**
- `id`: Fixture ID (required)

**Additional Endpoints for Match Details:**
- Events: `https://v3.football.api-sports.io/fixtures/events?fixture=1035098`
- Statistics: `https://v3.football.api-sports.io/fixtures/statistics?fixture=1035098`
- Lineups: `https://v3.football.api-sports.io/fixtures/lineups?fixture=1035098`

---

### 4. Get Football Leagues
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/leagues?current=true`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

---

### 5. Get Football Teams
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/teams?league=39&season=2025`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

**Query Parameters:**
- `league` (optional): League ID
- `season` (optional): Season year (e.g., `2025`)

---

### 6. Get Football Standings
**Method:** `GET`  
**URL:** `https://v3.football.api-sports.io/standings?league=39&season=2025`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v3.football.api-sports.io
```

**Query Parameters:**
- `league` (required): League ID
- `season` (optional): Season year

---

## 🏀 Basketball API Endpoints

### 1. Get Live Basketball Matches
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/games?live=all`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

---

### 2. Get Basketball Fixtures (Upcoming/By Date)
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/games?date=2026-01-13`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

**Query Parameters:**
- `date` (optional): Format `YYYY-MM-DD`
- `league` (optional): League ID

---

### 3. Get Basketball Match Details
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/games?id=12345`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

**Additional Endpoints:**
- Events: `https://v1.basketball.api-sports.io/games/events?game=12345`
- Statistics: `https://v1.basketball.api-sports.io/games/statistics?game=12345`

---

### 4. Get Basketball Leagues
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/leagues?current=true`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

---

### 5. Get Basketball Teams
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/teams?league=12&season=2025`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

---

### 6. Get Basketball Standings
**Method:** `GET`  
**URL:** `https://v1.basketball.api-sports.io/standings?league=12&season=2025`

**Headers:**
```
x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453
x-rapidapi-host: v1.basketball.api-sports.io
```

---

## 📝 Postman Setup Instructions

### Step 1: Create New Request
1. Open Postman
2. Click "New" → "HTTP Request"
3. Select method: `GET`

### Step 2: Add URL
- Copy any endpoint URL from above

### Step 3: Add Headers
Go to "Headers" tab and add:
- **Key:** `x-rapidapi-key`  
  **Value:** `9ad61eb6-dab4-4968-82cc-2eca2a2b9453`

- **Key:** `x-rapidapi-host`  
  **Value:** `v3.football.api-sports.io` (for football)  
  OR  
  **Value:** `v1.basketball.api-sports.io` (for basketball)

### Step 4: Send Request
Click "Send" button

---

## ✅ Expected Response Format

### Success Response:
```json
{
  "get": "fixtures",
  "parameters": {
    "live": "all"
  },
  "errors": [],
  "results": 12,
  "paging": {
    "current": 1,
    "total": 1
  },
  "response": [
    {
      "fixture": {
        "id": 1035098,
        "date": "2026-01-13T20:00:00+00:00",
        "status": {
          "long": "Halftime",
          "short": "HT"
        }
      },
      "league": {
        "id": 262,
        "name": "Primera Division",
        "country": "Nicaragua"
      },
      "teams": {
        "home": {
          "id": 1234,
          "name": "Managua",
          "logo": "https://..."
        },
        "away": {
          "id": 5678,
          "name": "Diriangén",
          "logo": "https://..."
        }
      },
      "goals": {
        "home": 1,
        "away": 0
      }
    }
  ]
}
```

### Error Response (if API key invalid):
```json
{
  "message": "You are not subscribed to this API.",
  "errors": []
}
```

---

## 🧪 Quick Test Requests

### Test 1: Check API Status
**URL:** `https://v3.football.api-sports.io/status`  
**Headers:** Same as above

### Test 2: Get Today's Football Matches
**URL:** `https://v3.football.api-sports.io/fixtures?date=2026-01-13`  
**Headers:** Same as above

### Test 3: Get Live Basketball
**URL:** `https://v1.basketball.api-sports.io/games?live=all`  
**Headers:** 
- `x-rapidapi-key: 9ad61eb6-dab4-4968-82cc-2eca2a2b9453`
- `x-rapidapi-host: v1.basketball.api-sports.io`

---

## ⚠️ Important Notes

1. **API Key:** Always use the same key: `9ad61eb6-dab4-4968-82cc-2eca2a2b9453`
2. **Host Header:** Must match the base URL:
   - Football → `v3.football.api-sports.io`
   - Basketball → `v1.basketball.api-sports.io`
3. **Rate Limits:** Check your API subscription limits
4. **Date Format:** Always use `YYYY-MM-DD` format for dates

---

## 🔍 Common League IDs

### Football:
- Premier League: `39`
- La Liga: `140`
- Serie A: `135`
- Bundesliga: `78`
- Ligue 1: `61`

### Basketball:
- NBA: `12`
- Euroleague: `13`

---

## 📞 If You Get 403 Error

If you get `403 Forbidden`:
1. Check API key is correct
2. Verify subscription is active
3. Check rate limits haven't been exceeded
4. Ensure headers are exactly as shown above
