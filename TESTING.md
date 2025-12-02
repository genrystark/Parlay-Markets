# 🧪 Testing Guide

Comprehensive guide for testing the Parlay Market backend API.

## 📋 Testing Options

### 1. Local Testing (Recommended)

#### Install Backend CLI

```bash
# macOS
brew install supabase/tap/supabase

# or via npm
npm install -g supabase
```

#### Run Locally

```bash
# From project root
supabase start

# Serve function only
supabase functions serve polymarket

# Or with auto-reload
supabase functions serve polymarket --no-verify-jwt
```

Function will be available at:
```
http://127.0.0.1:54321/functions/v1/polymarket
```

#### Test Locally

**Option 1: Use test script**

```bash
# Make script executable
chmod +x test-polymarket-api.sh

# Run local tests
./test-polymarket-api.sh http://127.0.0.1:54321/functions/v1/polymarket
```

**Option 2: Use Node.js script**

```bash
node test-api.js --local
```

**Option 3: Via curl**

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{"limit": 5}'
```

**Option 4: Via Frontend**

1. Ensure local backend is running
2. Check that `.env.local` has correct `VITE_API_BASE_URL`
3. Run frontend: `npm run dev`
4. Open app in browser

---

### 2. Testing via Deployed Backend

#### Deploy Function

```bash
# Login (if not already logged in)
supabase login

# Link project
supabase link --project-ref YOUR_PROJECT_ID

# Deploy function
supabase functions deploy polymarket
```

#### Test Remotely

**Option 1: Via script**

```bash
./test-polymarket-api.sh https://YOUR_PROJECT_ID.supabase.co/functions/v1/polymarket
```

**Option 2: Via Node.js**

```bash
node test-api.js --remote YOUR_PROJECT_ID
```

**Option 3: Via curl**

```bash
curl -X POST https://YOUR_PROJECT_ID.supabase.co/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"limit": 5}'
```

---

### 3. Testing via Frontend Application

1. Start frontend:
   ```bash
   npm run dev
   ```

2. Open browser at `http://localhost:5173`

3. Open developer console (F12)

4. Function is called automatically via `usePolymarketData` hook

5. Check console logs:
   - `Fetching markets from polymarket edge function...`
   - `Received response: true markets: X`

---

## 🔍 Test Requests

### Basic Request (All Markets)

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{"limit": 10}'
```

### Filter by Category

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{
    "category": "Politics",
    "limit": 5
  }'
```

### Search

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{
    "search": "trump",
    "limit": 3
  }'
```

### Sort

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{
    "sort": "volume",
    "limit": 5
  }'
```

### With Charts (May be slow)

```bash
curl -X POST http://127.0.0.1:54321/functions/v1/polymarket \
  -H "Content-Type: application/json" \
  -d '{
    "limit": 2,
    "includeCharts": true
  }'
```

---

## ✅ What to Check

### 1. Successful Response
- ✅ `success: true`
- ✅ `data` contains array of markets
- ✅ Each market has all fields: `id`, `title`, `outcomes`, `category`, etc.

### 2. Data Normalization
- ✅ `outcomes.yes.price` (probability)
- ✅ `outcomes.yes.odds` (odds = 1/price)
- ✅ `outcomes.no.price` and `outcomes.no.odds`

### 3. Caching
- ✅ First request: `fromCache: false`
- ✅ Second request (within 25 sec): `fromCache: true`

### 4. Filters
- ✅ Categories work
- ✅ Search works
- ✅ Sorting works

### 5. Rate Limiting
- ✅ No 429 errors
- ✅ Charts load with delay (stagger)

### 6. Charts
- ✅ `chart` array present (if `includeCharts: true`)
- ✅ Chart contains points with `t` (timestamp) and `p` (price)
- ✅ Maximum 48 points (downsampling)

---

## 🐛 Troubleshooting

### Error: Function not found
- Check that function is deployed: `supabase functions list`
- Verify URL is correct

### Error: 401 Unauthorized
- For local testing: ensure `verify_jwt = false` in `supabase/config.toml`
- For remote: use correct `ANON_KEY`

### Error: 500 Internal Server Error
- Check logs: `supabase functions logs polymarket`
- Verify all dependencies are installed

### No Data in Response
- Check that CLOB API or Gamma API are accessible
- Check function logs
- Ensure cache is not empty (may be issue with first request)

### Slow Performance
- This is normal for first request (loading all markets)
- Charts may take several seconds (rate limiting)
- Check caching - second request should be faster

---

## 📊 Expected Results

### Successful Response:

```json
{
  "success": true,
  "data": [
    {
      "id": "...",
      "title": "Will...",
      "description": "...",
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
    "filtered": 10,
    "fromCache": false,
    "cacheAge": 0,
    "categoryCounts": {...},
    "categories": [...]
  }
}
```

---

## 🚀 Quick Start

```bash
# 1. Install Backend CLI
brew install supabase/tap/supabase

# 2. Run locally
supabase start
supabase functions serve polymarket

# 3. In another terminal - run tests
chmod +x test-polymarket-api.sh
./test-polymarket-api.sh http://127.0.0.1:54321/functions/v1/polymarket

# OR via Node.js
node test-api.js --local
```

---

## 📝 Logs and Debugging

### View Logs (Local)

```bash
# All logs
supabase functions logs polymarket

# Follow logs in real-time
supabase functions logs polymarket --follow
```

### View Logs (Remote)

In Backend Dashboard: Functions > polymarket > Logs

---

## 💡 Tips

1. **Use local testing** for fast iteration
2. **Check caching** - second request should be faster
3. **Charts load slowly** - this is normal due to rate limiting
4. **First request may be slow** - loading all markets from API
5. **Use `limit`** to restrict response size
