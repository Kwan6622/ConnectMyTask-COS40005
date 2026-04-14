const assert = require('assert');
const { buildBudgetSuggestion } = require('../../src/modules/ai-integration/budgetEngine');

describe('Budget Engine Integration', () => {
  it('should return a high budget range for deep cleaning 3 rooms', () => {
    const res = buildBudgetSuggestion({
      title: 'Deep cleaning 3 rooms',
      description: 'I need a full deep cleaning of my large apartment',
      category: 'CLEANING',
      location: 'district 1'
    });
    
    assert.ok(res.suggestedMin >= 400000);
    assert.ok(res.suggestedMax <= 1500000);
    assert.ok(res.factorsUsed.length > 0);
  });

  it('should calculate urgent premium for delivery', () => {
    const resNormal = buildBudgetSuggestion({ title: 'Delivering document', category: 'DELIVERY' });
    const resUrgent = buildBudgetSuggestion({ title: 'Delivering document URGENT', category: 'DELIVERY' });
    
    assert.ok(resUrgent.suggestedBudget > resNormal.suggestedBudget);
  });

  it('should fall back safely when category is missing', () => {
    const res = buildBudgetSuggestion({ title: 'Something abstract' });
    assert.ok(res.suggestedMin > 0);
    assert.ok(res.suggestedMin > 0);
  });
});
