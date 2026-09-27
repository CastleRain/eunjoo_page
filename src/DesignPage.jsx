import React from 'react';
import {motion as animated,useReducedMotion} from 'motion/react';
import {useApp} from './ui';
import {ClinicFlower,Package} from './icons';
export function DesignPage({kind,children}) {
 const {motion}=useApp(), reduce=useReducedMotion();
 return <animated.section className={`redesign-page ${kind}-page`} initial={motion&&!reduce?{opacity:0,y:6}:false} animate={{opacity:1,y:0}} transition={{duration:motion&&!reduce?0.18:0}}>
  <div className="section-eyebrow">{kind==='today'?<ClinicFlower size={18}/>:<Package size={18}/>}<span>{kind==='today'?'오늘의 흐름, 한눈에':'약재부터 전달까지'}</span><span className="eyebrow-line"/></div>{children}
 </animated.section>;
}
