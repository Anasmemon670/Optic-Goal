# Highlightly API Setup Guide

## Environment Configuration

Create a `.env` file in the `backend` directory with the following:

```env
# Highlightly Sport API Key
HIGHLIGHTLY_API_KEY=9f52fbf1-02ae-4b67-96c7-eb164bb292fa

# Backend Server Configuration
PORT=5001
HOST=127.0.0.1
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/optikgoal

# JWT Configuration
JWT_SECRET=your-secret-key-change-this-in-production

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:3000
```

## Important Notes

1. **API Key Security**: The `HIGHLIGHTLY_API_KEY` is stored in `.env` and never exposed to frontend
2. **Base URL**: All API calls go to `https://sports.highlightly.net`
3. **Header Format**: API key is sent via `X-API-Key` header
4. **Never commit `.env`**: Add `.env` to `.gitignore`

## Verification

After adding the API key, restart the backend server. You should see:

```
[HighlightlyCron] 🚀 Starting Highlightly cron jobs...
[HighlightlyCron] ✅ Highlightly cron jobs started
```

If the API key is invalid, you'll see warnings in the console.
