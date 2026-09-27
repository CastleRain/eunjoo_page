\set ON_ERROR_STOP on
begin;
insert into auth.users(id) select ('00000000-0000-4000-8000-00000000000'||n)::uuid from generate_series(1,5)n;
insert into ondam.profiles(id,display_name,role,active) values
 ('00000000-0000-4000-8000-000000000001','대표 테스트','OWNER',true),
 ('00000000-0000-4000-8000-000000000002','직원 A','STAFF',true),
 ('00000000-0000-4000-8000-000000000003','직원 B','STAFF',true),
 ('00000000-0000-4000-8000-000000000004','비활성 직원','STAFF',false);
create function public.test_assert(ok boolean,label text) returns void language plpgsql as $$ begin if ok is distinct from true then raise exception 'FAIL: %',label; end if; raise notice 'PASS: %',label; end $$;
create function public.test_error(query text,expected text) returns void language plpgsql as $$ begin
 begin execute query; exception when others then
  if position(expected in sqlerrm)>0 then raise notice 'PASS rejected: %',expected; return; end if;
  raise exception 'Expected %, got %',expected,sqlerrm;
 end;
 raise exception 'FAIL expected error: %',expected;
end $$;
set local role anon;
select public.test_error($q$select public.ondam_workspace('2026-09-01','2026-10-31')$q$,'permission denied');
reset role;
set local role authenticated;
do $$
declare request_id uuid; half_id uuid; op uuid:=gen_random_uuid(); w jsonb; other_id uuid;
begin
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000005',true);
 perform public.test_error($q$select public.ondam_workspace('2026-09-01','2026-10-31')$q$,'MEMBERSHIP_REQUIRED');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000004',true);
 perform public.test_error($q$select public.ondam_request_leave(gen_random_uuid(),'연차','2026-09-25','2026-09-28')$q$,'MEMBERSHIP_REQUIRED');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
 perform public.test_error('select * from ondam.leave_requests','permission denied');
 perform public.test_error($q$update ondam.profiles set role='OWNER'$q$,'permission denied');
 perform public.test_error($q$select public.ondam_request_leave(gen_random_uuid(),'연차','2026-09-28','2026-09-25')$q$,'INVALID_RANGE');
 request_id:=public.ondam_request_leave(op,'연차','2026-09-25','2026-09-28','개인 비공개 사유','비공개 인계');
 perform public.test_assert(request_id=public.ondam_request_leave(op,'연차','2026-09-25','2026-09-28','개인 비공개 사유','비공개 인계'),'submission retry returns same request');
 perform public.test_error(format($q$select public.ondam_request_leave(%L,'연차','2026-09-25','2026-09-29')$q$,op),'IDEMPOTENCY_CONFLICT');
 perform public.test_error($q$select public.ondam_request_leave(gen_random_uuid(),'연차','2026-09-28','2026-09-30')$q$,'OVERLAPPING_LEAVE');
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert((w#>>'{requests,0,days}')::numeric=4,'inclusive days including weekend');
 perform public.test_assert(jsonb_array_length(w->'calendar')=0,'pending excluded from calendar');
 perform public.test_assert(jsonb_array_length(w#>'{requests,0,history}')=1,'submission retry creates one audit event');
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,0,'APPROVE',gen_random_uuid())$q$,request_id),'NOT_ALLOWED');
 half_id:=public.ondam_request_leave(gen_random_uuid(),'오전 반차','2026-10-01','2026-10-05');
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(exists(select 1 from jsonb_array_elements(w->'requests')r where r->>'id'=half_id::text and r->>'end'='2026-10-01' and (r->>'days')::numeric=0.5),'half-day normalized by server');
 perform public.ondam_transition_leave(half_id,0,'WITHDRAW',gen_random_uuid());
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,1,'APPROVE',gen_random_uuid())$q$,half_id),'NOT_ALLOWED');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(jsonb_array_length(w->'requests')=0,'another employee sees no private requests');
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,0,'WITHDRAW',gen_random_uuid())$q$,request_id),'NOT_ALLOWED');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
 op:=gen_random_uuid();
 perform public.ondam_transition_leave(request_id,0,'APPROVE',op);
 perform public.ondam_transition_leave(request_id,0,'APPROVE',op);
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,0,'REJECT',gen_random_uuid(),'반려')$q$,request_id),'STALE_VERSION');
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,1,'APPROVE',gen_random_uuid())$q$,request_id),'INVALID_TRANSITION');
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(exists(select 1 from jsonb_array_elements(w->'requests')r where r->>'id'=request_id::text and jsonb_array_length(r->'history')=2),'approval retry creates one audit event');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000003',true);
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(jsonb_array_length(w->'calendar')=1 and not ((w#>'{calendar,0}') ?| array['reason','handover','history','applicantId']),'approved public calendar omits private fields');
 perform public.test_assert(position('개인 비공개 사유' in w::text)=0 and position('비공개 인계' in w::text)=0,'no private text anywhere in staff response');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
 perform public.ondam_transition_leave(request_id,1,'REQUEST_CANCEL',gen_random_uuid());
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(w#>>'{calendar,0,status}'='CANCEL_PENDING','cancellation pending remains on calendar');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
 perform public.test_error(format($q$select public.ondam_transition_leave(%L,2,'REJECT_CANCEL',gen_random_uuid(),'')$q$,request_id),'REJECTION_REASON_REQUIRED');
 perform public.ondam_transition_leave(request_id,2,'REJECT_CANCEL',gen_random_uuid(),'인력 일정 확인');
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000002',true);
 perform public.ondam_transition_leave(request_id,3,'REQUEST_CANCEL',gen_random_uuid());
 perform set_config('request.jwt.claim.sub','00000000-0000-4000-8000-000000000001',true);
 perform public.ondam_transition_leave(request_id,4,'APPROVE_CANCEL',gen_random_uuid());
 w:=public.ondam_workspace('2026-09-01','2026-10-31');
 perform public.test_assert(jsonb_array_length(w->'calendar')=0,'approved cancellation removes calendar event');
end $$;
reset role;
rollback;
