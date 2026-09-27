import React from 'react';
import {ConfigProvider} from 'antd';
import koKR from 'antd/locale/ko_KR';
import dayjs from 'dayjs';
import 'dayjs/locale/ko';
import {design} from './design-config';
dayjs.locale('ko');
export function ClinicTheme({font,motion,children}) {
 const compact=font<=16;
 return <ConfigProvider locale={koKR} componentSize="large" theme={{
  token:{
   colorPrimary:design.accent,colorPrimaryHover:design.accentHover,colorInfo:'#59748e',colorSuccess:'#60726b',colorWarning:'#9a702a',colorError:'#ad4e59',
   colorText:design.ink,colorTextSecondary:design.muted,colorBorder:design.line,colorBorderSecondary:design.line,
   colorBgContainer:'#ffffff',colorBgLayout:design.canvas,colorBgElevated:'#ffffff',colorFillAlter:design.softest,
   borderRadius:design.radius,fontFamily:'"Noto Sans KR Variable", sans-serif',fontSize:font,fontSizeLG:font,
   controlHeight:Math.max(44,Math.round(font*2.7)),controlHeightLG:Math.max(44,Math.round(font*2.8)),
   motion:motion&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },
  components:{
   Button:{primaryShadow:'none',defaultShadow:'none',fontWeight:550,paddingInlineLG:20},
   Card:{borderRadiusLG:16},
   Segmented:{trackBg:design.softest,itemSelectedBg:'#ffffff',itemSelectedColor:design.accent,itemColor:design.muted,itemHoverBg:design.soft},
   Tag:{defaultBg:design.soft},
   Table:{headerBg:design.softest,headerColor:design.muted,borderColor:design.line,rowHoverBg:design.softest,cellPaddingBlock:compact?12:18,cellPaddingInline:compact?16:20},
   Input:{activeShadow:'0 0 0 3px var(--focus-ring)'},
   Select:{optionSelectedBg:design.soft,optionSelectedColor:design.accent},
   DatePicker:{activeShadow:'0 0 0 3px var(--focus-ring)'},
   Modal:{borderRadiusLG:16},Drawer:{footerPaddingBlock:20}
  }
 }}>{children}</ConfigProvider>;
}
