import {design} from './design-config';
import React,{useEffect,useRef,useState} from 'react';
import {Button,Select,Progress,Modal as AntModal} from 'antd';
import {Play,Pause,SkipForward,Stop,Presentation,CheckCircle} from './icons';
import {useApp,Notice} from './ui';
import {demoChapters} from './demo-script.mjs';

const normalize = value => (value||'').replace(/\s/g,'');
const visible = el => el && el.getClientRects().length && getComputedStyle(el).visibility!=='hidden' && !el.closest('.demo-ui');
const all = selector => [...document.querySelectorAll(selector)].filter(visible);
const activeScope = () => all('[role="dialog"]').at(-1)||document;
const button = (label,index=0,scope=activeScope()) => [...scope.querySelectorAll('button')].filter(visible).filter(el=>normalize(el.textContent)===normalize(label)||el.getAttribute('aria-label')===label)[index];
const findInput = label => all('input,textarea,[role="combobox"]').find(el=>el.getAttribute('aria-label')===label)
  || (()=>{const l=all('label').find(el=>el.textContent===label);return l?.htmlFor?document.getElementById(l.htmlFor):null;})();

export function DemoCenter({open,onClose}) {
  const a=useApp(),app=useRef(a);app.current=a;
  const [chapter,setChapter]=useState('all'),[pace,setPace]=useState(6000),[status,setStatus]=useState('idle'),[current,setCurrent]=useState(null),[error,setError]=useState('');
  const control=useRef(null),snapshot=useRef(null),highlight=useRef(null),speed=useRef(pace);speed.current=pace;
  const clearHighlight=()=>{highlight.current?.classList.remove('demo-focus');highlight.current=null;};
  useEffect(()=>{document.body.classList.toggle('demo-active',status!=='idle');return()=>document.body.classList.remove('demo-active')},[status]);
  useEffect(()=>()=>{control.current?.abort.abort();clearHighlight()},[]);
  const stop=()=>{control.current?.abort.abort();control.current=null;clearHighlight();if(snapshot.current)app.current.restoreDemoState(snapshot.current);snapshot.current=null;app.current.setDemoActive(false);setStatus('idle');setCurrent(null);setError('');};
  const pause=()=>{if(!control.current)return;control.current.paused=!control.current.paused;setStatus(control.current.paused?'paused':'playing');};
  const start=async()=>{
    if(control.current)return;
    snapshot.current=app.current.captureDemoState();
    const ctl={abort:new AbortController(),paused:false,next:false};control.current=ctl;
    app.current.setDemoActive(true);setStatus('playing');setError('');onClose();
    const signal=ctl.abort.signal;
    const check=()=>{if(signal.aborted)throw new DOMException('시연 종료','AbortError');};
    const tick=()=>new Promise(resolve=>setTimeout(resolve,50));
    const gate=async()=>{check();while(ctl.paused){await tick();check();}};
    const wait=async(ms,skippable=false)=>{let spent=0;while(spent<ms){await gate();if(skippable&&ctl.next){ctl.next=false;return;}await tick();spent+=50;}check();};
    const locate=async(fn,name)=>{for(let i=0;i<50;i++){await gate();const el=fn();if(el)return el;await wait(100);}throw new Error(`“${name}” 화면을 찾지 못했습니다. 종료 후 해당 순서를 다시 시작해 주세요.`);};
    const focus=async el=>{await gate();clearHighlight();highlight.current=el;el.classList.add('demo-focus');el.scrollIntoView({block:'center',inline:'nearest',behavior:'instant'});await wait(180);};
    const click=async(el)=>{await focus(el);await gate();el.click();await wait(260);};
    const h={
      go:async route=>{await gate();clearHighlight();app.current.nav(route);await wait(350);},
      open:async(type,extra={})=>{await gate();app.current.open({type,...extra});await wait(350);},
      close:async()=>{const el=await locate(()=>all('.ant-drawer-close,.ant-modal-close').at(-1),'상세 창 닫기');await click(el);},
      focus:async selector=>focus(await locate(()=>all(selector)[0],selector)),
      button:async(label,index=0)=>click(await locate(()=>button(label,index),label)),
      tab:async label=>click(await locate(()=>all('.ant-segmented-item-label').find(el=>normalize(el.textContent)===normalize(label)),label)),
      row:async(text,label)=>click(await locate(()=>{const row=all('tbody tr').find(el=>el.textContent.includes(text));return row&&button(label,0,row);},`${text} / ${label}`)),
      leaveRow:async text=>click(await locate(()=>all('.leave-request-row').find(el=>el.textContent.includes(text)),text)),
      calendarEvent:async text=>click(await locate(()=>all('.calendar-event').find(el=>el.textContent.includes(text)),text)),
      answer:async text=>click(await locate(()=>all('label.answer').find(el=>el.textContent.includes(text)),text)),
      switch:async label=>click(await locate(()=>all('[role="switch"]').find(el=>el.getAttribute('aria-label')===label),label)),
      role:async role=>{await h.open('role');await h.button(role);},
      field:async(label,value,type=false)=>{
        const el=await locate(()=>findInput(label),label);await focus(el);el.focus({preventScroll:true});
        const values=type&&value.length>2?[value.slice(0,Math.ceil(value.length/3)),value.slice(0,Math.ceil(value.length*2/3)),value]:[value];
        for(const part of values){await gate();window.dispatchEvent(new CustomEvent('ondam-demo-input',{detail:{label,value:part}}));await wait(type?240:280);}
        // The field remains controlled by the normal React onChange callback.
        el.blur();
      },
      inputIs:async(label,value)=>{const el=await locate(()=>findInput(label),label);await focus(el);if(String(el.value)!==value)throw new Error(`${label}: ${value} 자동 계산을 확인하지 못했습니다.`);},
      expect:async(predicate,message)=>{for(let i=0;i<35;i++){await gate();if(predicate(app.current))return;await wait(100);}throw new Error(message);}
    };
    const chapters=chapter==='all'?demoChapters:demoChapters.filter(c=>c.id===chapter);
    const total=chapters.reduce((n,c)=>n+c.steps.length,0);let index=0;
    try {
      for(const c of chapters){
        await gate();clearHighlight();app.current.resetDemoState(c.route);await wait(450);
        for(const s of c.steps){
          await gate();ctl.next=false;setCurrent({...s,chapter:c.title,index:++index,total,settled:false});
          await s.run(h);await gate();setCurrent(v=>({...v,settled:true}));await wait(speed.current,true);
        }
      }
      clearHighlight();setStatus('done');
    }catch(e){if(e.name!=='AbortError'){clearHighlight();ctl.paused=true;setError(e.message);setStatus('error');}}
  };
  const count=demoChapters.reduce((n,c)=>n+c.steps.length,0);
  return <>
    <AntModal open={open} onCancel={onClose} title={<h2>발표용 자동 시연</h2>} footer={null} width={720} rootClassName="demo-ui" centered destroyOnHidden>
      <p className="lead">입력 없이 전체 업무 흐름을 보여주세요.</p>
      <p>실제 시안 화면에서 예시 입력·저장·승인을 순서대로 진행합니다. 각 장은 동일한 샘플 데이터로 시작하고, <b>종료하면 시작 전 업무 데이터와 화면 설정을 복원</b>합니다.</p>
      <div className="demo-setup-fields"><label>보여줄 순서<Select aria-label="시연 범위" value={chapter} onChange={setChapter} options={[{value:'all',label:`전체 시연 · 11개 순서 / ${count}단계`},...demoChapters.map(c=>({value:c.id,label:c.title}))]}/></label><label>단계별 설명 시간<Select aria-label="시연 설명 시간" value={pace} onChange={setPace} options={[{value:6000,label:'기본 · 6초'},{value:10000,label:'발표용 · 10초'},{value:1500,label:'빠르게 · 1.5초'}]}/></label></div>
      <Notice>전체 기본 시연은 약 11–14분입니다. 일시정지로 설명을 덧붙이고, 다음으로 설명 대기 시간을 넘길 수 있습니다. 실제 전화·메시지 발송·결제·인쇄는 실행하지 않습니다.</Notice>
      <div className="demo-outline">{demoChapters.map(c=><div key={c.id}><span>{c.title}</span><small>{c.steps.length}단계</small></div>)}</div>
      <div className="dialog-actions"><Button href={`${import.meta.env.BASE_URL}demo-guide.md`} download="온담_발표_시연_안내.md">발표 대본 내려받기</Button><Button onClick={onClose}>닫기</Button><Button type="primary" icon={<Play/>} onClick={start}>선택한 순서 자동 시작</Button></div>
    </AntModal>
    {status!=='idle'&&<section className="demo-player demo-ui" data-demo-status={status} data-demo-step={current?.index||0} aria-label="자동 시연 조절">
      <Progress percent={current?Math.round(current.index/current.total*100):0} showInfo={false} size="small" strokeColor={design.accent}/>
      <div className="demo-player-content"><div className="demo-caption"><div className="demo-eyebrow"><Presentation size={19}/><span>{status==='done'?'시연 완료':status==='error'?'진행 확인 필요':status==='paused'?'일시정지':current?.settled?'설명 시간':'화면 진행 중'} · {current?.index||0}/{current?.total||count}</span><span>{current?.chapter}</span></div><h2>{status==='done'?'시연을 모두 마쳤습니다.':current?.title||'시연을 준비하고 있습니다.'}</h2><p>{error||current?.narration}</p>{current&&<div className="demo-expected"><CheckCircle size={17}/><span>확인할 내용: {current.expected}</span></div>}</div><div className="demo-controls">{!['done','error'].includes(status)&&<><Button icon={status==='paused'?<Play/>:<Pause/>} onClick={pause}>{status==='paused'?'계속 재생':'일시정지'}</Button><Button icon={<SkipForward/>} disabled={!current?.settled} onClick={()=>{control.current.next=true;if(control.current.paused){control.current.paused=false;setStatus('playing')}}}>다음</Button></>}<Button icon={<Stop/>} onClick={stop}>종료·원래대로</Button></div></div>
    </section>}
  </>;
}
