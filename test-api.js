/**
 * Тестовый скрипт для Polymarket API
 * 
 * Использование:
 *   node test-api.js [OPTIONS]
 * 
 * Опции:
 *   --url <URL>         URL функции (обязательно)
 *   --local             Использовать локальный URL
 *   --remote <PROJECT>  Использовать удаленный URL
 */

const FUNCTION_URL = process.argv.includes('--url') 
  ? process.argv[process.argv.indexOf('--url') + 1]
  : process.argv.includes('--local')
  ? 'http://127.0.0.1:54321/functions/v1/polymarket'
  : process.argv.includes('--remote')
  ? `https://${process.argv[process.argv.indexOf('--remote') + 1]}.supabase.co/functions/v1/polymarket`
  : null;

if (!FUNCTION_URL) {
  console.error('❌ Укажите URL функции');
  console.error('\nПримеры:');
  console.error('  node test-api.js --local');
  console.error('  node test-api.js --url http://127.0.0.1:54321/functions/v1/polymarket');
  console.error('  node test-api.js --remote YOUR_PROJECT_ID');
  process.exit(1);
}

// Опциональный API key (необязательно, т.к. verify_jwt = false)
const API_KEY = process.env.SUPABASE_ANON_KEY || 'YOUR_ANON_KEY';

async function testAPI(name, payload) {
  console.log(`\n🧪 ${name}`);
  console.log('─'.repeat(50));
  
  try {
    const start = Date.now();
    const response = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify(payload),
    });

    const duration = Date.now() - start;
    const data = await response.json();

    if (data.success) {
      console.log(`✅ Успех (${duration}ms)`);
      console.log(`   Рынков: ${data.meta?.filtered || data.data?.length || 0}`);
      console.log(`   Всего: ${data.meta?.total || 'N/A'}`);
      console.log(`   Из кеша: ${data.meta?.fromCache ? 'да' : 'нет'}`);
      
      if (data.data && data.data.length > 0) {
        const first = data.data[0];
        console.log(`   Первый рынок: ${first.title?.substring(0, 50)}...`);
        console.log(`   Категория: ${first.category}`);
        console.log(`   Вероятность YES: ${first.outcomes?.yes?.probability}%`);
        if (first.chart) {
          console.log(`   График: ${first.chart.length} точек`);
        }
      }
    } else {
      console.log(`❌ Ошибка: ${data.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log(`❌ Ошибка запроса: ${error.message}`);
  }
}

async function runTests() {
  console.log('🚀 Тестирование Polymarket API');
  console.log(`📍 URL: ${FUNCTION_URL}\n`);

  // Тест 1: Базовый запрос
  await testAPI('Тест 1: Все рынки (первые 5)', {
    limit: 5,
  });

  // Тест 2: По категории
  await testAPI('Тест 2: Категория Politics', {
    category: 'Politics',
    limit: 3,
  });

  // Тест 3: Поиск
  await testAPI('Тест 3: Поиск "trump"', {
    search: 'trump',
    limit: 3,
  });

  // Тест 4: Сортировка
  await testAPI('Тест 4: Сортировка по объему', {
    sort: 'volume',
    limit: 3,
  });

  // Тест 5: С графиками (может быть медленно)
  console.log('\n⏳ Тест 5: С графиками (первые 2) - может занять время...');
  await testAPI('Тест 5: С графиками', {
    limit: 2,
    includeCharts: true,
  });

  console.log('\n✅ Все тесты завершены!');
}

runTests().catch(console.error);

