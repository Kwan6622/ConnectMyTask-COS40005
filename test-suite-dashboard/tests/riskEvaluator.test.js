const assert = require('assert');
const { evaluateTaskRisk } = require('../../src/modules/tasks/riskEvaluator');

describe('Task Risk & AI Fraud Evaluator', () => {
  it('should not flag a task with healthy budget as suspicious', async () => {
    const rawTask = {
      title: 'Painting my wall',
      description: 'Need my living room painted',
      category: 'HOME_REPAIR',
      budget: 800000 
    };
    const risk = await evaluateTaskRisk(rawTask);
    
    assert.strictEqual(risk.isSuspicious, false);
    assert.strictEqual(risk.riskLevel, null);
  });

  it('should flag tasks with extraordinarily low budgets against category logic', async () => {
    // If Python AI is offline, JS fallback flags tasks with <50% expected budget 
    const rawTask = {
      title: 'Painting my wall',
      description: 'Need my living room painted',
      category: 'HOME_REPAIR',
      budget: 50000 // Very low, JS fallback expects ~350,000 baseline
    };
    const risk = await evaluateTaskRisk(rawTask);
    
    assert.strictEqual(risk.isSuspicious, true);
    assert.ok(risk.expectedMinBudget > 100000);
  });
  
  it('should invoke fraud detection and penalize explicitly scammy behaviors', async () => {
    // This assumes AI service intercepts it or JS picks it up
    const rawTask = {
      title: 'Painting my wall',
      description: 'Contact me on telegram immediately to do this',
      category: 'HOME_REPAIR',
      budget: 0 // Free
    };
    const risk = await evaluateTaskRisk(rawTask);
    
    assert.strictEqual(risk.isSuspicious, true);
  });
});
