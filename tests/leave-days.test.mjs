import test from 'node:test';
import assert from 'node:assert/strict';
import {calculateLeaveDays as days} from '../src/leave-days.mjs';
test('inclusive dates update the requested amount', () => {
  assert.equal(days('연차', '2026-09-28', '2026-09-30'), 3);
  assert.equal(days('연차', '2026-09-28', '2026-09-28'), 1);
  assert.equal(days('기타 휴가', '2026-09-30', '2026-10-02'), 3);
});
test('preview includes weekends and counts half days independently of old end date', () => {
  assert.equal(days('연차', '2026-09-25', '2026-09-28'), 4);
  assert.equal(days('오전 반차', '2026-09-28', '2026-09-30'), .5);
  assert.equal(days('오후 반차', '2026-09-28', ''), .5);
});
test('calendar validation and leap years do not depend on local timezone', () => {
  assert.equal(days('연차', '2028-02-28', '2028-03-01'), 3);
  assert.equal(days('연차', '2026-02-29', '2026-03-01'), null);
  assert.equal(days('연차', '2026-09-30', '2026-09-28'), null);
  assert.equal(days('연차', '', '2026-09-28'), null);
});
