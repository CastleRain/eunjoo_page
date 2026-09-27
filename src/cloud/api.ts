import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';

const url = import.meta.env.VITE_SUPABASE_URL || '';
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';
// Public browser key only. Fail closed for incomplete or privileged configuration.
export const cloudConfigured = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(url) && key.startsWith('sb_publishable_');
export const cloud = cloudConfigured ? createClient(url, key, {
 auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, storageKey: 'ondam-cloud-auth' },
}) : null;

export const statusNames = { PENDING:'승인 대기',APPROVED:'승인 완료',REJECTED:'반려',WITHDRAWN:'신청 철회',CANCEL_PENDING:'취소 요청',CANCELLED:'취소 완료' } as const;
export const actionNames: Record<string,string> = {SUBMIT:'휴가 신청',APPROVE:'휴가 승인',REJECT:'휴가 반려',WITHDRAW:'신청 철회',REQUEST_CANCEL:'취소 요청',APPROVE_CANCEL:'취소 승인',REJECT_CANCEL:'취소 반려'};
const status = z.enum(['PENDING','APPROVED','REJECTED','WITHDRAWN','CANCEL_PENDING','CANCELLED']);
const schedule = z.object({id:z.string().uuid(),applicantName:z.string(),type:z.string(),start:z.string(),end:z.string(),days:z.number(),status});
const request = schedule.extend({applicantId:z.string().uuid(),reason:z.string(),handover:z.string(),version:z.number().int(),createdAt:z.string(),history:z.array(z.object({action:z.string(),actor:z.string(),comment:z.string(),at:z.string()}))});
export const workspaceSchema = z.object({profile:z.object({id:z.string().uuid(),name:z.string(),role:z.enum(['OWNER','STAFF'])}),requests:z.array(request),calendar:z.array(schedule)});
export type Workspace = z.infer<typeof workspaceSchema>;
export type LeaveRequest = Workspace['requests'][number];
export type LeaveAction = 'APPROVE'|'REJECT'|'WITHDRAW'|'REQUEST_CANCEL'|'APPROVE_CANCEL'|'REJECT_CANCEL';

export function friendlyError(error: unknown): string {
 const message = error instanceof Error ? error.message : typeof error==='object' && error && 'message' in error ? String(error.message) : '';
 const known: Record<string,string> = {
  MEMBERSHIP_REQUIRED:'로그인은 완료됐지만 업무실 사용 승인이 필요합니다. 관리자에게 계정 등록을 요청해 주세요.',
  NOT_ALLOWED:'이 작업을 처리할 권한이 없습니다.', OVERLAPPING_LEAVE:'같은 기간에 신청한 휴가가 있습니다. 기존 내역을 확인해 주세요.',
  STALE_VERSION:'다른 사용자가 먼저 처리했습니다. 새로고침 후 다시 확인해 주세요.',
  INVALID_TRANSITION:'이미 처리됐거나 현재 상태에서 할 수 없는 작업입니다.', INVALID_RANGE:'시작일과 종료일을 확인해 주세요.',
  REJECTION_REASON_REQUIRED:'반려 사유를 입력해 주세요.', IDEMPOTENCY_CONFLICT:'요청 내용이 바뀌었습니다. 새로고침 후 다시 시도해 주세요.',
  'Invalid login credentials':'이메일 또는 비밀번호를 확인해 주세요.', 'Email not confirmed':'이메일 인증을 완료해 주세요.',
 };
 for (const [code,text] of Object.entries(known)) if(message.includes(code)) return text;
 return '연결 또는 처리에 실패했습니다. 저장 완료 여부를 내역에서 확인한 뒤 다시 시도해 주세요.';
}
export async function loadWorkspace(from:string,to:string) {
 if(!cloud) throw new Error('NOT_CONFIGURED');
 const {data,error}=await cloud.rpc('ondam_workspace',{p_from:from,p_to:to});
 if(error) throw error;
 return workspaceSchema.parse(data);
}
export async function submitLeave(input:{key:string;type:string;start:string;end:string;reason:string;handover:string}) {
 if(!cloud) throw new Error('NOT_CONFIGURED');
 const {data,error}=await cloud.rpc('ondam_request_leave',{p_key:input.key,p_type:input.type,p_start:input.start,p_end:input.end,p_reason:input.reason,p_handover:input.handover});
 if(error) throw error; return data;
}
export async function transitionLeave(id:string,version:number,action:LeaveAction,operation:string,comment:string) {
 if(!cloud) throw new Error('NOT_CONFIGURED');
 const {error}=await cloud.rpc('ondam_transition_leave',{p_id:id,p_version:version,p_action:action,p_operation:operation,p_comment:comment});
 if(error) throw error;
}
