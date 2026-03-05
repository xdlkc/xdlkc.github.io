const test = require('node:test');
const assert = require('node:assert/strict');

const { buildUpdatedLabel } = require('../scripts/helpers/updated-label');

test('buildUpdatedLabel: returns empty string when updated is missing', () => {
  assert.equal(
    buildUpdatedLabel({
      date: new Date('2026-03-01T10:00:00Z'),
      updated: null
    }),
    ''
  );
});

test('buildUpdatedLabel: returns empty string when updated is same calendar day as date', () => {
  assert.equal(
    buildUpdatedLabel({
      date: new Date('2026-03-01T01:00:00Z'),
      updated: new Date('2026-03-01T23:59:59Z')
    }),
    ''
  );
});

test('buildUpdatedLabel: returns formatted label when updated is on a different day', () => {
  assert.equal(
    buildUpdatedLabel({
      date: new Date('2026-03-01T10:00:00Z'),
      updated: new Date('2026-03-03T09:00:00Z')
    }),
    ' · 更新于 2026-03-03'
  );
});
