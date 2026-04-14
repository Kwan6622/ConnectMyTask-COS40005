const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const Mocha = require('mocha');

const app = express();
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/run-tests', (req, res) => {
  const mocha = new Mocha({ timeout: 10000 });
  const testDir = path.join(__dirname, 'tests');

  try {
    fs.readdirSync(testDir)
      .filter((file) => file.endsWith('.js'))
      .forEach((file) => {
        const filePath = path.join(testDir, file);
        delete require.cache[require.resolve(filePath)];
        mocha.addFile(filePath);
      });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to read tests directory' });
  }

  const results = {
    passes: [],
    failures: [],
    stats: { passed: 0, failed: 0, total: 0, duration: 0 },
  };

  const startTime = Date.now();
  const runner = mocha.run();

  runner.on('pass', (test) => {
    results.passes.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      duration: test.duration,
      suite: test.parent.title
    });
    results.stats.passed++;
    results.stats.total++;
  });

  runner.on('fail', (test, err) => {
    results.failures.push({
      title: test.title,
      fullTitle: test.fullTitle(),
      error: err.message,
      stack: err.stack,
      suite: test.parent.title
    });
    results.stats.failed++;
    results.stats.total++;
  });

  runner.on('end', () => {
    results.stats.duration = Date.now() - startTime;
    res.json(results);
  });
});

const PORT = 5500;
app.listen(PORT, () => {
  console.log(`Test dashboard running at http://localhost:${PORT}`);
});
