export const roles = ['OWNER', 'STAFF'] as const;
export type Role = typeof roles[number];

// Session verification must supply this identity; never construct it from a role header/body.
export interface AuthenticatedActor { id: string; role: Role; }
export type Permission =
  | 'inventory.read' | 'inventory.register' | 'inventory.intake' | 'inventory.reserve'
  | 'leave.request' | 'leave.calendar' | 'leave.decide' | 'business.read';

const permissions: Record<Role, readonly Permission[]> = {
  OWNER: ['inventory.read', 'inventory.register', 'inventory.intake', 'inventory.reserve', 'leave.request', 'leave.calendar', 'leave.decide', 'business.read'],
  STAFF: ['inventory.read', 'inventory.register', 'inventory.intake', 'inventory.reserve', 'leave.request', 'leave.calendar'],
};

export function hasPermission(actor: AuthenticatedActor | null | undefined, permission: Permission): boolean {
  if (!actor?.id || !roles.includes(actor.role)) return false;
  return permissions[actor.role].includes(permission);
}

export function canReadPrivateLeave(actor: AuthenticatedActor | null | undefined, applicantId: string): boolean {
  if (!actor?.id || !roles.includes(actor.role)) return false;
  return actor.role === 'OWNER' || actor.id === applicantId;
}

export type LeaveStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'WITHDRAWN' | 'CANCEL_PENDING' | 'CANCELLED';
export interface CalendarLeave {
  id: string; applicantId: string; applicantName: string;
  startDate: string; endDate: string; status: LeaveStatus;
}

/** Explicit public fields only: reasons, handover text, and reviewer comments never leave this projection. */
export function toStaffCalendar(leaves: readonly CalendarLeave[]) {
  return leaves.filter(leave => leave.status === 'APPROVED' || leave.status === 'CANCEL_PENDING').map(leave => ({
    id: leave.id, applicantId: leave.applicantId, applicantName: leave.applicantName,
    startDate: leave.startDate, endDate: leave.endDate,
  }));
}
