begin;
create schema if not exists ondam;
revoke all on schema ondam from public, anon, authenticated;
create table ondam.profiles (
 id uuid primary key references auth.users(id) on delete restrict,
 display_name text not null check (length(trim(display_name)) between 1 and 80),
 role text not null check (role in ('OWNER','STAFF')),
 active boolean not null default true
);
create table ondam.leave_requests (
 id uuid primary key default gen_random_uuid(),
 applicant_id uuid not null references ondam.profiles(id),
 request_key uuid not null,
 type text not null check (type in ('연차','오전 반차','오후 반차','기타 휴가')),
 start_date date not null, end_date date not null,
 days numeric(8,1) not null,
 reason text not null default '' check(length(reason)<=1000),
 handover text not null default '' check(length(handover)<=1000),
 status text not null default 'PENDING' check(status in ('PENDING','APPROVED','REJECTED','WITHDRAWN','CANCEL_PENDING','CANCELLED')),
 version integer not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(applicant_id,request_key),
 check(isfinite(start_date) and isfinite(end_date) and start_date<=end_date),
 check((type in ('오전 반차','오후 반차') and start_date=end_date and days=0.5) or
       (type not in ('오전 반차','오후 반차') and days=end_date-start_date+1))
);
create table ondam.leave_events (
 id bigint generated always as identity primary key,
 request_id uuid not null references ondam.leave_requests(id),
 actor_id uuid not null references ondam.profiles(id),
 operation_id uuid not null,
 action text not null, previous_status text, next_status text not null,
 comment text not null default '' check(length(comment)<=1000),
 created_at timestamptz not null default now(), unique(actor_id,operation_id)
);
create index leave_applicant on ondam.leave_requests(applicant_id,created_at desc);
create index leave_calendar on ondam.leave_requests(start_date,end_date) where status in ('APPROVED','CANCEL_PENDING');
create index leave_history on ondam.leave_events(request_id,id);
alter table ondam.profiles enable row level security;
alter table ondam.leave_requests enable row level security;
alter table ondam.leave_events enable row level security;
-- No direct grants/policies: browser access is only through the carefully scoped RPCs below.
revoke all on all tables in schema ondam from public,anon,authenticated;
revoke all on all sequences in schema ondam from public,anon,authenticated;

create function ondam.actor() returns ondam.profiles
language plpgsql stable security definer set search_path='' as $$
declare actor ondam.profiles;
begin
 select * into actor from ondam.profiles where id=auth.uid() and active;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 return actor;
end $$;
revoke all on function ondam.actor() from public,anon,authenticated;

create function public.ondam_workspace(p_from date,p_to date) returns jsonb
language plpgsql stable security definer set search_path='' as $$
declare actor ondam.profiles; requests jsonb; calendar jsonb;
begin
 actor:=ondam.actor();
 if p_from is null or p_to is null or not isfinite(p_from) or not isfinite(p_to) or p_to<p_from or p_to-p_from>366 then raise exception 'INVALID_RANGE'; end if;
 select coalesce(jsonb_agg(row_data order by created_at desc),'[]'::jsonb) into requests from (
  select r.created_at, jsonb_build_object('id',r.id,'applicantId',r.applicant_id,'applicantName',p.display_name,
   'type',r.type,'start',r.start_date,'end',r.end_date,'days',r.days,'reason',r.reason,'handover',r.handover,
   'status',r.status,'version',r.version,'createdAt',r.created_at,
   'history',(select coalesce(jsonb_agg(jsonb_build_object('action',e.action,'actor',ep.display_name,'comment',e.comment,'at',e.created_at) order by e.id),'[]'::jsonb)
     from ondam.leave_events e join ondam.profiles ep on ep.id=e.actor_id where e.request_id=r.id)) row_data
  from ondam.leave_requests r join ondam.profiles p on p.id=r.applicant_id
  where (actor.role='OWNER' or r.applicant_id=actor.id)
  order by r.created_at desc limit 200
 ) scoped;
 select coalesce(jsonb_agg(jsonb_build_object('id',r.id,'applicantName',p.display_name,'type',r.type,
   'start',r.start_date,'end',r.end_date,'days',r.days,'status',r.status) order by r.start_date),'[]'::jsonb)
 into calendar from ondam.leave_requests r join ondam.profiles p on p.id=r.applicant_id
 where r.status in ('APPROVED','CANCEL_PENDING') and r.start_date<=p_to and r.end_date>=p_from;
 return jsonb_build_object('profile',jsonb_build_object('id',actor.id,'name',actor.display_name,'role',actor.role),
   'requests',requests,'calendar',calendar);
end $$;

create function public.ondam_request_leave(p_key uuid,p_type text,p_start date,p_end date,p_reason text default '',p_handover text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor ondam.profiles; existing ondam.leave_requests; result_id uuid; actual_end date; amount numeric;
begin
 actor:=ondam.actor();
 -- Serialize each applicant's requests so overlapping simultaneous submissions cannot both pass.
 perform 1 from ondam.profiles where id=actor.id and active for update;
 if not found then raise exception 'MEMBERSHIP_REQUIRED' using errcode='42501'; end if;
 if p_key is null or p_type is null or p_type not in ('연차','오전 반차','오후 반차','기타 휴가') or p_start is null then raise exception 'INVALID_REQUEST'; end if;
 actual_end:=case when p_type in ('오전 반차','오후 반차') then p_start else p_end end;
 if actual_end is null or not isfinite(p_start) or not isfinite(actual_end) or actual_end<p_start then raise exception 'INVALID_RANGE'; end if;
 if length(coalesce(p_reason,''))>1000 or length(coalesce(p_handover,''))>1000 then raise exception 'TEXT_TOO_LONG'; end if;
 select * into existing from ondam.leave_requests where applicant_id=actor.id and request_key=p_key;
 if found then
  if existing.type<>p_type or existing.start_date<>p_start or existing.end_date<>actual_end or existing.reason<>coalesce(p_reason,'') or existing.handover<>coalesce(p_handover,'') then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return existing.id;
 end if;
 if exists(select 1 from ondam.leave_requests where applicant_id=actor.id and status in ('PENDING','APPROVED','CANCEL_PENDING') and start_date<=actual_end and end_date>=p_start) then raise exception 'OVERLAPPING_LEAVE'; end if;
 amount:=case when p_type in ('오전 반차','오후 반차') then 0.5 else actual_end-p_start+1 end;
 insert into ondam.leave_requests(applicant_id,request_key,type,start_date,end_date,days,reason,handover)
 values(actor.id,p_key,p_type,p_start,actual_end,amount,coalesce(p_reason,''),coalesce(p_handover,'')) returning id into result_id;
 insert into ondam.leave_events(request_id,actor_id,operation_id,action,next_status) values(result_id,actor.id,p_key,'SUBMIT','PENDING');
 return result_id;
end $$;

create function public.ondam_transition_leave(p_id uuid,p_version integer,p_action text,p_operation uuid,p_comment text default '') returns uuid
language plpgsql security definer set search_path='' as $$
declare actor ondam.profiles; request ondam.leave_requests; event ondam.leave_events; next_state text;
begin
 actor:=ondam.actor();
 if p_operation is null or p_version is null then raise exception 'INVALID_REQUEST'; end if;
 select * into request from ondam.leave_requests where id=p_id for update;
 if not found or (actor.role<>'OWNER' and request.applicant_id<>actor.id) then raise exception 'NOT_ALLOWED' using errcode='42501'; end if;
 select * into event from ondam.leave_events where actor_id=actor.id and operation_id=p_operation;
 if found then
  if event.request_id<>p_id or event.action<>p_action or event.comment<>coalesce(p_comment,'') then raise exception 'IDEMPOTENCY_CONFLICT'; end if;
  return p_id;
 end if;
 if request.version<>p_version then raise exception 'STALE_VERSION'; end if;
 if length(coalesce(p_comment,''))>1000 then raise exception 'TEXT_TOO_LONG'; end if;
 if p_action in ('APPROVE','REJECT','APPROVE_CANCEL','REJECT_CANCEL') and actor.role<>'OWNER' then raise exception 'NOT_ALLOWED' using errcode='42501'; end if;
 if p_action in ('WITHDRAW','REQUEST_CANCEL') and request.applicant_id<>actor.id then raise exception 'NOT_ALLOWED' using errcode='42501'; end if;
 next_state:=case
  when p_action='APPROVE' and request.status='PENDING' then 'APPROVED'
  when p_action='REJECT' and request.status='PENDING' then 'REJECTED'
  when p_action='WITHDRAW' and request.status='PENDING' then 'WITHDRAWN'
  when p_action='REQUEST_CANCEL' and request.status='APPROVED' then 'CANCEL_PENDING'
  when p_action='APPROVE_CANCEL' and request.status='CANCEL_PENDING' then 'CANCELLED'
  when p_action='REJECT_CANCEL' and request.status='CANCEL_PENDING' then 'APPROVED' end;
 if next_state is null then raise exception 'INVALID_TRANSITION'; end if;
 if p_action in ('REJECT','REJECT_CANCEL') and trim(coalesce(p_comment,''))='' then raise exception 'REJECTION_REASON_REQUIRED'; end if;
 update ondam.leave_requests set status=next_state,version=version+1,updated_at=now() where id=p_id;
 insert into ondam.leave_events(request_id,actor_id,operation_id,action,previous_status,next_status,comment)
 values(p_id,actor.id,p_operation,p_action,request.status,next_state,coalesce(p_comment,''));
 return p_id;
end $$;
revoke all on function public.ondam_workspace(date,date) from public,anon,authenticated;
revoke all on function public.ondam_request_leave(uuid,text,date,date,text,text) from public,anon,authenticated;
revoke all on function public.ondam_transition_leave(uuid,integer,text,uuid,text) from public,anon,authenticated;
grant execute on function public.ondam_workspace(date,date) to authenticated;
grant execute on function public.ondam_request_leave(uuid,text,date,date,text,text) to authenticated;
grant execute on function public.ondam_transition_leave(uuid,integer,text,uuid,text) to authenticated;
notify pgrst,'reload schema';
commit;
