import test from 'node:test';
import assert from 'node:assert/strict';
import { roles, hasPermission, canReadPrivateLeave, toStaffCalendar } from '../shared/access-policy.ts';

const staff = { id: 'staff-a', role: 'STAFF' };
const owner = { id: 'owner', role: 'OWNER' };

test('staff can register, intake and reserve herbs; business and decisions are owner-only', () => {
  assert.deepEqual(roles, ['OWNER', 'STAFF']);
  for (const permission of ['inventory.read', 'inventory.register', 'inventory.intake', 'inventory.reserve', 'leave.request', 'leave.calendar']) {
    assert.equal(hasPermission(staff, permission), true);
    assert.equal(hasPermission(owner, permission), true);
  }
  for (const permission of ['business.read', 'leave.decide']) {
    assert.equal(hasPermission(staff, permission), false);
    assert.equal(hasPermission(owner, permission), true);
  }
  assert.equal(hasPermission(null, 'inventory.intake'), false);
  assert.equal(hasPermission({ id: 'x', role: 'ADMIN' }, 'business.read'), false);
  assert.equal(hasPermission({ id: '', role: 'OWNER' }, 'business.read'), false);
});

test('private leave details are readable only by the applicant or owner', () => {
  assert.equal(canReadPrivateLeave(staff, 'staff-a'), true);
  assert.equal(canReadPrivateLeave(staff, 'staff-b'), false);
  assert.equal(canReadPrivateLeave(owner, 'staff-a'), true);
  assert.equal(canReadPrivateLeave(null, 'staff-a'), false);
});

test('calendar keeps pending cancellations, excludes unapproved requests and strips private fields', () => {
  const statuses = ['PENDING', 'APPROVED', 'REJECTED', 'WITHDRAWN', 'CANCEL_PENDING', 'CANCELLED'];
  const rows = statuses.map(status => ({ id: status, status, applicantId: 'staff-a', applicantName: '직원 A', startDate: '2026-10-01', endDate: '2026-10-02', reason: '비공개 사유', handover: '비공개 인계', reviewerComment: '비공개 의견' }));
  const calendar = toStaffCalendar(rows);
  assert.deepEqual(calendar.map(row => row.id), ['APPROVED', 'CANCEL_PENDING']);
  for (const row of calendar) assert.deepEqual(Object.keys(row).sort(), ['id', 'applicantId', 'applicantName', 'startDate', 'endDate'].sort());
});
