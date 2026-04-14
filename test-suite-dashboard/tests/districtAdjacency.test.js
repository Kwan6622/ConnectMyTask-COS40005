const assert = require('assert');
const { isSameDistrict, isNearbyDistrict } = require('../../src/modules/tasks/districtAdjacency');

describe('District Adjacency Rules', () => {
  it('should accurately compare same districts regardless of case', () => {
    assert.ok(isSameDistrict('District 1', ' district 1 '));
    assert.ok(isSameDistrict(' DISTRICT 1 ', 'district 1'));
    assert.ok(!isSameDistrict('District 2', 'District 1'));
  });

  it('should identify adjacent connected districts', () => {
    assert.ok(isNearbyDistrict('District 1', 'District 3')); // D1 borders D3
    assert.ok(isNearbyDistrict('District 4', 'District 1'));
    assert.ok(!isNearbyDistrict('District 1', 'Thu Duc')); // D1 does not border Thu Duc directly in our matrix
  });
  
  it('should return false gracefully on bad inputs', () => {
    assert.ok(!isNearbyDistrict('', null));
    assert.ok(!isNearbyDistrict('Random Place', 'District 1'));
  });
});
