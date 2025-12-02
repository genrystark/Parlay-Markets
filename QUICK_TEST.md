# ⚡ Quick Testing Guide

Fast testing guide for Parlay Market API.

## 🚀 Option 1: Via Frontend (Simplest)

1. **Ensure you have environment variables:**
   ```bash
   # Create .env.local (if not exists)
   VITE_API_BASE_URL=https://YOUR_PROJECT_ID.supabase.co
   VITE_API_KEY=your_anon_key
   ```

2. **Start frontend:**
   ```bash
   npm run dev
   ```

3. **Open browser:**
   - http://localhost:8080
   - Open developer console (F12)
   - Check request logs

4. **Function is called automatically!** 🎉

---

## 🔧 Option 2: Local Backend Testing

### Install CLI (if not installed)

```bash
# macOS
brew install supabase/tap/supabase

# or via npm
npm install -g supabase
```

### Quick Start

```bash
# 1. Initialize (if not done)
supabase init

# 2. Start locally
supabase start

# 3. In SEPARATE terminal - serve function
supabase functions serve polymarket --no-verify-jwt

# 4. Test (in third terminal)
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

---

## 🌐 Option 3: Via Deployed Backend

If function is already deployed:

```bash
# 1. Replace YOUR_PROJECT_ID and YOUR_ANON_KEY with real values

# 2. Simple test
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"limit": 5}'
```

Or use ready script:

```bash
node test-api.js --remote YOUR_PROJECT_ID
```

---

## ✅ Check Result

Successful response should contain:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "...",
      "category": "Politics",
      "outcomes": {
        "yes": {
          "price": 0.65,
          "probability": 65,
          "odds": 1.54
        },
        "no": {
          "price": 0.35,
          "probability": 35,
          "odds": 2.86
        }
      },
      "volume24h": 12345,
      "chart": [...]
    }
  ],
  "meta": {
    "total": 150,
    "filtered": 5,
    "fromCache": false
  }
}
```

---

## 🐛 Common Issues

### "Function not found"
- ✅ Function not deployed or URL incorrect
- ✅ Check: `supabase functions list`

### "401 Unauthorized"  
- ✅ For local: use `--no-verify-jwt`
- ✅ For remote: check ANON_KEY

### "500 Internal Server Error"
- ✅ Check logs: `supabase functions logs polymarket`
- ✅ Ensure APIs are accessible

### No Data
- ✅ First request may be slow (loading markets)
- ✅ Check cache - second request should work faster

---

## 📚 Full Documentation

See [TESTING.md](./TESTING.md) for detailed instructions.
