import React,{useRef,useState} from 'react';
import {useApp,Field,Notice,Btn} from './ui';

const nameKey=value=>value.normalize('NFKC').replace(/\s+/g,'').toLocaleLowerCase();
export function HerbRegistration(){
  const a=useApp(),[name,setName]=useState(''),[supplier,setSupplier]=useState(''),[error,setError]=useState(''),saving=useRef(false);
  const next=Math.max(0,...a.herbs.map(h=>/^H\d+$/.test(h.code)?Number(h.code.slice(1)):0))+1;
  const code='H'+String(next).padStart(3,'0');
  const submit=e=>{
    e.preventDefault();if(saving.current)return;
    const cleanName=name.normalize('NFC').trim().replace(/\s+/g,' ');
    if(!cleanName){setError('약재명을 입력해 주세요.');return;}
    const existing=a.herbs.find(h=>nameKey(h.name)===nameKey(cleanName));
    if(existing){setError(`${existing.name} (${existing.code})은 이미 등록되어 있어요. 기존 약재의 입고 등록을 이용해 주세요.`);return;}
    saving.current=true;
    a.setHerbs(hs=>[...hs,{code,name:cleanName,supplier:supplier.trim()||'미등록',unit:'g',qty:0,reserved:0,expiry:'입고 대기',registered:true}]);
    const intake=e.nativeEvent.submitter?.dataset.next==='intake';
    a.notify(`${cleanName}을 새 약재로 등록했어요.${intake?' 이제 입고 수량을 입력해 주세요.':''}`);
    if(intake)a.open({type:'intake',name:cleanName});else a.close();
  };
  return <form className="herb-registration" onSubmit={submit}>
    <p className="lead">처방과 재고에서 사용할 약재를 추가합니다.</p>
    <Field label="약재명"><input required maxLength={60} value={name} onChange={e=>{setName(e.target.value);setError('')}} placeholder="예: 백출"/></Field>
    <Field label="공급처 (선택)"><input maxLength={80} value={supplier} onChange={e=>setSupplier(e.target.value)} placeholder="예: 온담 약업"/></Field>
    <div className="form-grid"><Field label="품목 코드 (자동 생성)"><input value={code} readOnly/></Field><Field label="기준 단위"><input value="g (그램)" readOnly/></Field></div>
    <Notice>등록 시 재고는 0g으로 시작합니다. 실제 보유량은 입고 등록에서 포장 수·중량·사용기한과 함께 기록하세요.</Notice>
    {error&&<Notice type="rose">{error}</Notice>}
    <div className="dialog-actions"><Btn type="submit" data-next="list">약재만 등록</Btn><Btn primary type="submit" data-next="intake">등록하고 입고</Btn></div>
  </form>;
}
