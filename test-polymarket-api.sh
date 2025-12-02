#!/bin/bash

# Тестовый скрипт для Polymarket API
# Использование: ./test-polymarket-api.sh [LOCAL_URL]

set -e

# Определяем URL для тестирования
if [ -z "$1" ]; then
  echo "❌ Укажите URL функции"
  echo ""
  echo "Примеры:"
  echo "  Локально (Supabase CLI): ./test-polymarket-api.sh http://127.0.0.1:54321/functions/v1/polymarket"
  echo "  Удаленно: ./test-polymarket-api.sh https://YOUR_PROJECT.supabase.co/functions/v1/polymarket"
  exit 1
fi

FUNCTION_URL="$1"

echo "🧪 Тестирование Polymarket API"
echo "📍 URL: $FUNCTION_URL"
echo ""

# Цвета для вывода
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Тест 1: Базовый запрос (все рынки)
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Тест 1: Получить все рынки${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "limit": 10
  }' \
  | jq '.success, .meta.total, .meta.filtered, .data | length' 2>/dev/null || echo "⚠️  jq не установлен, показываю сырой ответ:"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"limit": 10}' \
  -s | head -c 500
echo ""
echo ""

# Тест 2: Фильтр по категории
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Тест 2: Фильтр по категории (Politics)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "category": "Politics",
    "limit": 5
  }' \
  | jq '.success, .data[0].category, .meta.filtered' 2>/dev/null || echo "См. ответ выше"
echo ""
echo ""

# Тест 3: Поиск
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Тест 3: Поиск (trump)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "search": "trump",
    "limit": 3
  }' \
  | jq '.success, .data[] | {title: .title, category: .category}' 2>/dev/null || echo "См. ответ выше"
echo ""
echo ""

# Тест 4: Сортировка по объему
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Тест 4: Сортировка по объему${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "sort": "volume",
    "limit": 3
  }' \
  | jq '.success, .data[] | {title: .title, volume24h: .volume24h}' 2>/dev/null || echo "См. ответ выше"
echo ""
echo ""

# Тест 5: С графиками (может быть медленно)
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}Тест 5: С графиками (первые 2 рынка)${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}⏳ Это может занять несколько секунд...${NC}"
curl -X POST "$FUNCTION_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "limit": 2,
    "includeCharts": true
  }' \
  | jq '.success, .data[] | {title: .title, chart_points: (.chart | length)}' 2>/dev/null || echo "См. ответ выше"
echo ""
echo ""

echo -e "${GREEN}✅ Тестирование завершено!${NC}"
echo ""
echo "💡 Советы:"
echo "  - Если получаете 401, проверьте Authorization header"
echo "  - Если функция не найдена, проверьте URL"
echo "  - Для локального тестирования используйте Supabase CLI: supabase functions serve"

