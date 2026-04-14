const runBtn = document.getElementById('runTestsBtn');
const btnText = runBtn.querySelector('.btn-text');
const loader = runBtn.querySelector('.loader');
const statusBadge = document.getElementById('statusBadge');
const resultsList = document.getElementById('resultsList');

const elTotal = document.getElementById('stat-total');
const elPassed = document.getElementById('stat-passed');
const elFailed = document.getElementById('stat-failed');
const elDuration = document.getElementById('stat-duration');

runBtn.addEventListener('click', async () => {
    // UI Reset
    runBtn.disabled = true;
    btnText.textContent = 'Executing...';
    loader.classList.remove('hidden');
    statusBadge.textContent = 'Running';
    statusBadge.className = 'badge status-running';
    resultsList.innerHTML = '';
    
    elTotal.textContent = '-';
    elPassed.textContent = '-';
    elFailed.textContent = '-';
    elDuration.textContent = '-';

    try {
        const response = await fetch('/api/run-tests');
        const data = await response.json();
        
        renderResults(data);
    } catch (err) {
        resultsList.innerHTML = `<div class="error-box">Fatal Error: Could not connect to API test runner. ${err.message}</div>`;
        statusBadge.textContent = 'Error';
    } finally {
        runBtn.disabled = false;
        btnText.textContent = 'Run Analytics Suite';
        loader.classList.add('hidden');
    }
});

function renderResults(data) {
    elTotal.textContent = data.stats.total;
    elPassed.textContent = data.stats.passed;
    elFailed.textContent = data.stats.failed;
    elDuration.textContent = `${data.stats.duration}ms`;

    statusBadge.textContent = 'Finished';
    statusBadge.className = 'badge status-finished';

    const allTests = [
        ...data.passes.map(t => ({ ...t, status: 'pass' })),
        ...data.failures.map(t => ({ ...t, status: 'fail' }))
    ];

    if (allTests.length === 0) {
        resultsList.innerHTML = '<div class="empty-state">No tests found.</div>';
        return;
    }

    // Sort by suite name
    allTests.sort((a, b) => {
        if (a.suite < b.suite) return -1;
        if (a.suite > b.suite) return 1;
        return 0;
    });

    resultsList.innerHTML = '';

    allTests.forEach(test => {
        const item = document.createElement('div');
        item.className = 'test-item';
        
        const isPass = test.status === 'pass';
        const iconClass = isPass ? 'pass-icon' : 'fail-icon';
        const iconSvg = isPass 
            ? '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>'
            : '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';

        let html = `
            <div class="test-header">
                <div class="status-icon ${iconClass}">${iconSvg}</div>
                <span class="test-suite-name">${test.suite} ›</span>
                <span class="test-title">${test.title}</span>
                <span class="test-duration">${test.duration || '<1'}ms</span>
            </div>
        `;

        if (!isPass && test.error) {
            html += `<div class="error-box">${test.error}\n\n${test.stack}</div>`;
        }

        item.innerHTML = html;
        resultsList.appendChild(item);
    });
}
