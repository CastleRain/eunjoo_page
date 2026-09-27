import React,{useCallback,useEffect,useRef,useState} from 'react';
import {Alert,App as AntApp,Button,Calendar,Card,DatePicker,Descriptions,Drawer,Empty,Form,Input,Segmented,Select,Space,Spin,Table,Tag,Typography} from 'antd';
import type {Session} from '@supabase/supabase-js';
import dayjs from 'dayjs';
import {ClinicTheme} from '../Theme';
import {calculateLeaveDays} from '../../shared/leave-days';
import {cloud,cloudConfigured,loadWorkspace,submitLeave,transitionLeave,friendlyError,statusNames,actionNames} from './api';
import type {Workspace,LeaveRequest,LeaveAction} from './api';
import './cloud.css';
const demoUrl=location.pathname+'?mode=demo#today';
const DemoApp=React.lazy(()=>import('../App.jsx').then(module=>({default:module.App})));
const demoMode=new URLSearchParams(location.search).get('mode')==='demo';

export function CloudApp(){
 const [font,setFont]=useState(()=>[16,18,20,22].includes(Number(localStorage.getItem('ondam-font')))?Number(localStorage.getItem('ondam-font')):16);
 useEffect(()=>{document.documentElement.style.fontSize=font+'px';document.documentElement.dataset.density=font===16?'compact':'comfortable';document.documentElement.dataset.motion=localStorage.getItem('ondam-motion')==='off'?'off':'on';localStorage.setItem('ondam-font',String(font))},[font]);
 return <ClinicTheme font={font} motion={localStorage.getItem('ondam-motion')!=='off'}><AntApp><CloudSession font={font} setFont={setFont}/></AntApp></ClinicTheme>
}
function CloudSession({font,setFont}:{font:number;setFont:(n:number)=>void}){
 const [session,setSession]=useState<Session|null>(null),[ready,setReady]=useState(false),[authError,setAuthError]=useState('');
 useEffect(()=>{
  if(!cloud){setReady(true);return}
  let mounted=true,authEventSeen=false;
  const {data:{subscription}}=cloud.auth.onAuthStateChange((_event,next)=>{if(mounted){authEventSeen=true;setSession(next);setAuthError('');setReady(true)}});
  cloud.auth.getSession().then(({data,error})=>{if(mounted&&!authEventSeen){if(error)setAuthError('로그인 상태를 확인하지 못했습니다. 다시 로그인해 주세요.');setSession(data.session);setReady(true)}}).catch(()=>{if(mounted){setReady(true);setAuthError('로그인 연결을 확인해 주세요.')}});
  return()=>{mounted=false;subscription.unsubscribe()};
 },[]);
 async function logout(){const {error}=await cloud!.auth.signOut({scope:'local'});if(error)setAuthError('로그아웃에 실패했습니다. 다시 시도해 주세요.')}
 if(ready&&session&&demoMode)return <LeaveWorkspace key={session.user.id} session={session} demo onLogout={logout}/>;
 return <div className="cloud-app">
  <header className="cloud-header"><a className="cloud-brand" href={location.pathname+'?mode=live'}>온담 업무실</a><Tag>공동 테스트</Tag><div className="cloud-header-actions"><Select aria-label="글자 크기" value={font} onChange={setFont} options={[16,18,20,22].map(value=>({value,label:value+'px'}))}/>{session&&<Button href={demoUrl}>전체 시안 보기</Button>}{session&&<Button onClick={logout}>로그아웃</Button>}</div></header>
  {authError&&<Alert type="error" title={authError}/>}
  {!cloudConfigured?<Card className="cloud-login"><Typography.Title level={2}>연결 준비 중입니다</Typography.Title><p>로그인 연결 설정이 준비되지 않아 업무 화면을 열 수 없습니다. 관리자에게 문의해 주세요.</p></Card>:!ready?<div className="cloud-loading"><Spin/><p>로그인 상태를 확인하고 있습니다.</p></div>:!session?<Login/>:<LeaveWorkspace key={session.user.id} session={session} onLogout={logout}/>}
 </div>
}
function Login(){
 const [busy,setBusy]=useState(false),[error,setError]=useState('');
 async function login(values:{email:string;password:string}){setBusy(true);setError('');try{const {error}=await cloud!.auth.signInWithPassword(values);if(error)throw error}catch(e){setError(friendlyError(e))}finally{setBusy(false)}}
 return <Card className="cloud-login"><span className="section-eyebrow">우리 한의원의 하루</span><Typography.Title level={2}>직원 계정으로 로그인</Typography.Title><p className="muted">휴가를 신청하고 승인된 일정을 함께 확인하세요.</p>
 <Form layout="vertical" onFinish={login} requiredMark={false}><Form.Item label="이메일" name="email" rules={[{required:true,message:'이메일을 입력해 주세요.'},{type:'email',message:'이메일 형식을 확인해 주세요.'}]}><Input autoComplete="username" type="email"/></Form.Item><Form.Item label="비밀번호" name="password" rules={[{required:true,message:'비밀번호를 입력해 주세요.'}]}><Input.Password autoComplete="current-password"/></Form.Item>{error&&<Alert role="alert" type="error" title={error}/>}<Button type="primary" htmlType="submit" loading={busy} block>로그인</Button></Form><p className="muted">계정이 없거나 비밀번호를 잊었다면 관리자에게 문의해 주세요.</p></Card>
}
function LeaveWorkspace({session,demo=false,onLogout}:{session:Session;demo?:boolean;onLogout:()=>Promise<void>}){
 const {message}=AntApp.useApp();
 const [month,setMonth]=useState(()=>dayjs().startOf('month')),[data,setData]=useState<Workspace|null>(null),[error,setError]=useState(''),[loading,setLoading]=useState(true),[tab,setTab]=useState('달력'),[requestOpen,setRequestOpen]=useState(false),[selected,setSelected]=useState<LeaveRequest|null>(null);
 const sequence=useRef(0);
 const from=month.startOf('month').subtract(7,'day').format('YYYY-MM-DD'),to=month.endOf('month').add(7,'day').format('YYYY-MM-DD');
 const refresh=useCallback(async()=>{const ticket=++sequence.current;setLoading(true);try{const next=await loadWorkspace(from,to);if(ticket===sequence.current){setData(next);setError('')}}catch(e){if(ticket===sequence.current){setData(null);setSelected(null);setError(friendlyError(e))}}finally{if(ticket===sequence.current)setLoading(false)}},[from,to]);
 useEffect(()=>{void refresh();const timer=setInterval(()=>{if(document.visibilityState==='visible')void refresh()},20000);const focus=()=>void refresh();window.addEventListener('focus',focus);return()=>{++sequence.current;clearInterval(timer);window.removeEventListener('focus',focus)}},[refresh,session.access_token]);
 if(!data)return <main className="cloud-main">{error?<Alert type="error" title={error} action={<Space><Button onClick={refresh}>다시 확인</Button><Button onClick={onLogout}>로그아웃</Button></Space>}/>:<div className="cloud-loading"><Spin/><p>업무 일정을 불러오고 있습니다.</p></div>}</main>;
 if(demo)return <React.Suspense fallback={<div className="cloud-loading"><Spin/><p>시안을 불러오고 있습니다.</p></div>}><DemoApp account={data.profile} onLogout={onLogout}/></React.Suspense>;
 const owner=data.profile.role==='OWNER';
 const rows=tab==='승인 대기함'?data.requests.filter(r=>['PENDING','CANCEL_PENDING'].includes(r.status)):data.requests;
 const detail=selected?data.requests.find(r=>r.id===selected.id):null;
 return <main className="cloud-main redesign-page"><div className="page-title"><div><span className="section-eyebrow">{owner?'대표':'직원'} · {data.profile.name}</span><h1>직원·휴가</h1><p>신청부터 승인까지, 한곳에서 함께 확인합니다.</p></div><Space wrap><Button onClick={refresh} loading={loading}>새로고침</Button><Button type="primary" onClick={()=>setRequestOpen(true)}>휴가 신청</Button></Space></div>
 <div className="cloud-metrics"><Card><span>표시 기간의 승인된 휴가</span><strong>{data.calendar.length}<small>건</small></strong></Card><Card><span>{owner?'승인·취소 검토 대기':'내 승인 대기'}</span><strong>{data.requests.filter(r=>owner?['PENDING','CANCEL_PENDING'].includes(r.status):r.status==='PENDING').length}<small>건</small></strong></Card><Card><span>휴가 계산</span><b>주말·공휴일 포함</b><small>반차는 0.5일</small></Card></div>
 <Card className="cloud-content"><div className="cloud-toolbar"><Segmented value={tab} onChange={setTab} options={owner?['달력','승인 대기함','전체 신청 내역']:['달력','내 신청 내역']}/><span className="muted">20초마다 갱신 · 사유는 본인과 대표만 확인</span></div>
 {tab==='달력'?<div className="calendar-scroll"><Calendar className="clinic-calendar" value={month} onPanelChange={value=>setMonth(value.startOf('month'))} onSelect={(value,info)=>{if(info.source==='date')setMonth(value.startOf('month'))}} cellRender={(date,info)=>info.type==='date'?data.calendar.filter(row=>row.start<=date.format('YYYY-MM-DD')&&row.end>=date.format('YYYY-MM-DD')).map(row=><div key={row.id} className="cloud-calendar-event"><b>{row.applicantName} · {row.type}</b>{row.status==='CANCEL_PENDING'&&<small>취소 검토 중</small>}</div>):info.originNode}/></div>:<Table rowKey="id" pagination={{pageSize:10}} scroll={{x:740}} dataSource={rows} locale={{emptyText:<Empty description="확인할 신청이 없습니다."/>}} columns={[
 {title:'직원',dataIndex:'applicantName'},{title:'기간',render:(_,row)=>row.start===row.end?row.start:row.start+' ~ '+row.end},{title:'휴가',dataIndex:'type'},{title:'일수',render:(_,row)=>row.days+'일'},{title:'상태',render:(_,row)=><Tag>{statusNames[row.status]}</Tag>},{title:'내역',render:(_,row)=><Button onClick={()=>setSelected(row)}>상세</Button>}
 ]}/>}
 </Card><Alert type="info" title="승인된 휴가만 달력에 표시됩니다. 취소 요청 중에는 일정을 유지하고, 대표의 취소 승인 후 제외합니다."/>
 <p className="cloud-footnote">로그인·휴가는 공유 DB에 저장됩니다. 다른 업무 메뉴는 ‘전체 시안 보기’에서 확인할 수 있습니다. 신청 목록은 최근 200건입니다.</p>
 <Drawer title="휴가 신청" open={requestOpen} onClose={()=>setRequestOpen(false)} destroyOnHidden size="min(32rem,100vw)">{requestOpen&&<RequestForm onSuccess={async()=>{setRequestOpen(false);message.success('휴가 신청이 저장됐습니다.');await refresh()}}/>}</Drawer>
 <Drawer title="휴가 신청 상세" open={!!detail} onClose={()=>setSelected(null)} destroyOnHidden size="min(32rem,100vw)">{detail&&<RequestDetail request={detail} profile={data.profile} onSuccess={async()=>{setSelected(null);message.success('처리 결과가 저장됐습니다.');await refresh()}}/>}</Drawer>
 </main>
}
function RequestForm({onSuccess}:{onSuccess:()=>Promise<void>}){
 const [form]=Form.useForm();const [busy,setBusy]=useState(false),[error,setError]=useState('');
 const retry=useRef<{payload:string;key:string}|null>(null);
 const type=Form.useWatch('type',form)||'연차',start=Form.useWatch('start',form),end=Form.useWatch('end',form),half=type.includes('반차');
 useEffect(()=>{if(half&&start)form.setFieldValue('end',start)},[half,start,form]);
 const days=calculateLeaveDays(type,start?.format('YYYY-MM-DD'),(half?start:end)?.format('YYYY-MM-DD'));
 async function submit(values:{type:string;start:dayjs.Dayjs;end:dayjs.Dayjs;reason?:string;handover?:string}){
  const input={type:values.type,start:values.start.format('YYYY-MM-DD'),end:(half?values.start:values.end).format('YYYY-MM-DD'),reason:values.reason||'',handover:values.handover||''};
  const payload=JSON.stringify(input);if(retry.current?.payload!==payload)retry.current={payload,key:crypto.randomUUID()};
  setBusy(true);setError('');try{await submitLeave({...input,key:retry.current!.key});await onSuccess()}catch(e){setError(friendlyError(e))}finally{setBusy(false)}
 }
 return <Form form={form} layout="vertical" onFinish={submit} initialValues={{type:'연차',start:dayjs(),end:dayjs()}} disabled={busy} requiredMark={false}>
 <Form.Item label="휴가 종류" name="type"><Select options={['연차','오전 반차','오후 반차','기타 휴가'].map(value=>({value,label:value}))}/></Form.Item>
 <div className="cloud-form-dates"><Form.Item label="시작일" name="start" rules={[{required:true,message:'시작일을 선택해 주세요.'}]}><DatePicker allowClear={false} onChange={date=>{if(date&&(!end||end.isBefore(date,'day')))form.setFieldValue('end',date)}}/></Form.Item><Form.Item label="종료일" name="end" rules={[{validator:(_,value)=>half||!start||!value||!value.isBefore(start,'day')?Promise.resolve():Promise.reject(new Error('시작일 이후로 선택해 주세요.'))},{required:!half,message:'종료일을 선택해 주세요.'}]}>{half?<DatePicker value={start} disabled/>:<DatePicker allowClear={false} minDate={start}/>}</Form.Item></div>
 <Form.Item label="신청 일수"><Input value={days===null?'':days+'일'} readOnly/></Form.Item><p className="muted">시작일·종료일을 포함합니다. 주말·공휴일 포함, 반차 0.5일입니다.</p>
 <Form.Item label="사유 (본인과 대표만 확인)" name="reason"><Input.TextArea rows={3} maxLength={1000} showCount/></Form.Item><Form.Item label="업무 인계사항 (선택)" name="handover"><Input.TextArea rows={3} maxLength={1000} showCount/></Form.Item>
 {error&&<Alert role="alert" type="error" title={error}/>}
 <Button type="primary" htmlType="submit" loading={busy} disabled={days===null}>휴가 신청하기</Button>
 </Form>
}
function RequestDetail({request,profile,onSuccess}:{request:LeaveRequest;profile:Workspace['profile'];onSuccess:()=>Promise<void>}){
 const {modal}=AntApp.useApp();
 const [busy,setBusy]=useState(false),[error,setError]=useState(''),[reject,setReject]=useState(false),[comment,setComment]=useState('');
 const retry=useRef<{payload:string;key:string}|null>(null);const owner=profile.role==='OWNER',mine=profile.id===request.applicantId;
 async function act(action:LeaveAction){const text=action==='REJECT'||action==='REJECT_CANCEL'?comment:'';if(action.includes('REJECT')&&!text.trim()){setError('반려 사유를 입력해 주세요.');return}const payload=JSON.stringify([request.id,request.version,action,text]);if(retry.current?.payload!==payload)retry.current={payload,key:crypto.randomUUID()};setBusy(true);setError('');try{await transitionLeave(request.id,request.version,action,retry.current!.key,text);await onSuccess()}catch(e){setError(friendlyError(e))}finally{setBusy(false)}}
 return <><Typography.Title level={3}>{request.applicantName} · {request.type}</Typography.Title><Tag>{statusNames[request.status]}</Tag><Descriptions column={1} items={[{key:'dates',label:'기간',children:request.start+' ~ '+request.end},{key:'days',label:'일수',children:request.days+'일'},{key:'reason',label:'사유',children:request.reason||'미입력'},{key:'handover',label:'인계',children:request.handover||'미입력'}]}/><Typography.Title level={4}>처리 이력</Typography.Title><ul className="cloud-history">{request.history.map((h,index)=><li key={index}><b>{h.actor} · {actionNames[h.action]||h.action}</b><small>{dayjs(h.at).format('YYYY.MM.DD HH:mm')}</small>{h.comment&&<p>{h.comment}</p>}</li>)}</ul>
 {error&&<Alert role="alert" type="error" title={error}/>}
 {owner&&['PENDING','CANCEL_PENDING'].includes(request.status)&&<>{reject?<><Input.TextArea aria-label="반려 사유" placeholder="반려 사유를 입력해 주세요." value={comment} onChange={e=>setComment(e.target.value)} maxLength={1000}/><Button type="primary" loading={busy} onClick={()=>act(request.status==='PENDING'?'REJECT':'REJECT_CANCEL')}>반려 확정</Button></>:<Space><Button disabled={busy} onClick={()=>setReject(true)}>반려</Button><Button type="primary" loading={busy} onClick={()=>act(request.status==='PENDING'?'APPROVE':'APPROVE_CANCEL')}>{request.status==='PENDING'?'휴가 승인':'취소 승인'}</Button></Space>}</>}
 {mine&&request.status==='PENDING'&&<Button disabled={busy} onClick={()=>modal.confirm({title:'휴가 신청을 철회할까요?',okText:'신청 철회',cancelText:'돌아가기',onOk:()=>act('WITHDRAW')})}>신청 철회</Button>}
 {mine&&request.status==='APPROVED'&&<Button loading={busy} onClick={()=>act('REQUEST_CANCEL')}>승인된 휴가 취소 요청</Button>}
 </>
}
