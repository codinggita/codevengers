import { generateMystery } from './ai/mysteryGenerator.js';

async function runBenchmark() {
  const iterations = 10;
  let successFirstTry = 0;
  let successRetry = 0;
  let failures = 0;

  console.log(`Starting LLM Reliability Benchmark (${iterations} iterations)...`);

  for (let i = 1; i <= iterations; i++) {
    console.log(`\n--- Iteration ${i} ---`);
    try {
      const start = Date.now();
      const mystery = await generateMystery(5); // 5 players
      const duration = ((Date.now() - start) / 1000).toFixed(1);
      
      console.log(`✅ Success! Took ${duration}s`);
      successFirstTry++;
    } catch (err) {
      console.error(`❌ Failure: ${err.message}`);
      failures++;
    }
  }

  console.log(`\n--- Benchmark Complete ---`);
  console.log(`Total Runs: ${iterations}`);
  console.log(`Successes: ${successFirstTry}`);
  console.log(`Failures: ${failures}`);
  
  process.exit(failures > 0 ? 1 : 0);
}

runBenchmark();
