'use strict';
(() => {
 const COLORS=['#7963F2','#26B8AD','#F1AA65','#EF78A1','#5795ED','#A38BE7','#75C7DB','#D5B064'];
 const SECTOR_COLORS={'전력운영':'#7963F2','방위력개선':'#26B8AD','병무행정':'#F1AA65'};
 const ACCOUNT_COLORS={'일반회계':'#7963F2','특별회계·기금':'#26B8AD','내부거래·보전지출':'#EF78A1','내부거래':'#F1AA65'};
 const $=id=>document.getElementById(id);
 const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const number=n=>Math.round(n).toLocaleString('ko-KR');
 const signed=n=>(n>0?'+':n<0?'−':'')+number(Math.abs(n));
 const pct=n=>n===null?'—':(n>0?'+':n<0?'−':'')+Math.abs(n*100).toFixed(1)+'%';
 const rate=(a,b)=>a===0?null:(b-a)/a;
 const money=n=>{const a=Math.abs(n),sign=n<0?'−':'';return a>=10000?`${sign}${Math.floor(a/10000)}조 ${number(a%10000)}억원`:`${sign}${number(a)}억원`;};
 const short=n=>Math.abs(n)>=10000?(n/10000).toFixed(Math.abs(n)>=100000?0:1)+'조':number(n);
 const sum=(rows,k)=>rows.reduce((s,r)=>s+r[k],0);
 const all=window.BUDGET_DATA.rows.map((r,i)=>({...r,id:i,change:r.y2027-r.y2026,rate:rate(r.y2026,r.y2027)}));
 const state={sector:'',account:'',search:'',sort:'y2027',direction:-1};
 let current=[];
 const group=(rows,key)=>Object.values(rows.reduce((o,r)=>{const name=r[key];o[name]??={name,y2026:0,y2027:0,change:0,count:0};o[name].y2026+=r.y2026;o[name].y2027+=r.y2027;o[name].change+=r.change;o[name].count++;return o;},{}));
 const tip=(r)=>`${r.program}\n${r.sector} / ${r.account}\n2026: ${money(r.y2026)}\n2027: ${money(r.y2027)}\n증감: ${signed(r.change)}억원 (${pct(r.rate)})`;
 const attrs=t=>`data-tip="${esc(t)}"`;
 const svg=(w,h,content,label)=>`<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${esc(label)}">${content}</svg>`;
 const text=(x,y,t,extra='')=>`<text x="${x}" y="${y}" fill="#898DA5" font-size="10" ${extra}>${esc(t)}</text>`;
 const line=(x1,y1,x2,y2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" ${extra.includes('stroke=')?'':'stroke="#EDEEF6"'} ${extra}/>`;
 const cut=(s,n=14)=>s.length>n?s.slice(0,n-1)+'…':s;
 const empty=id=>$(id).innerHTML='<div class="chart-empty">표시할 양수 예산 항목이 없습니다.</div>';
 function sectorChart(rows){
  const data=group(rows,'sector'),w=600,h=260,left=85,right=65,top=27,plot=w-left-right;
  const max=Math.max(...data.flatMap(x=>[Math.abs(x.y2026),Math.abs(x.y2027)]),1),hasNeg=data.some(x=>x.y2026<0||x.y2027<0);
  const baseline=hasNeg?left+plot/2:left,scale=plot/(max*(hasNeg?2:1));let s='';
  for(let i=0;i<=4;i++){const x=left+plot*i/4;s+=line(x,top-5,x,h-29,'stroke-dasharray="3 5"');s+=text(x,h-7,short(hasNeg?(i/2-1)*max:i/4*max),'text-anchor="middle" font-size="9"');}
  const step=Math.min(73,185/data.length);
  data.forEach((r,i)=>{const y=top+i*step+8;s+=text(left-14,y+19,r.name,'text-anchor="end" fill="#5D627C" font-size="11"');
   [['y2026','#BCC7F8',y],['y2027','#7963F2',y+20]].forEach(([key,c,yy])=>{const v=r[key],width=Math.abs(v)*scale,x=v<0?baseline-width:baseline;s+=`<rect x="${x}" y="${yy}" width="${Math.max(width,1)}" height="13" rx="4" fill="${c}" ${attrs(`${r.name} · ${key==='y2026'?'2026':'2027'}\n${money(v)}`)}/>`;s+=text(v<0?x-5:x+width+5,yy+10,short(v),`text-anchor="${v<0?'end':'start'}" font-size="9"`);});
  });
  $('sector-chart').innerHTML=svg(w,h,s,'부문별 2026년과 2027년 예산 비교');
 }
 function accountChart(rows){
  const data=group(rows.filter(r=>r.y2027>0),'account').sort((a,b)=>b.y2027-a.y2027);if(!data.length)return empty('account-chart');
  const total=sum(data,'y2027'),w=420,h=260,cx=110,cy=126,rad=77,circ=2*Math.PI*rad;let offset=0;
  let s=`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="#F3F1F8" stroke-width="27"/>`;
  data.forEach((r,i)=>{const part=r.y2027/total,len=part*circ; s+=`<circle cx="${cx}" cy="${cy}" r="${rad}" fill="none" stroke="${ACCOUNT_COLORS[r.name]||COLORS[i]}" stroke-width="27" stroke-dasharray="${Math.max(0,len-(data.length>1?3:0))} ${circ}" stroke-dashoffset="${-offset}" transform="rotate(-90 ${cx} ${cy})" ${attrs(`${r.name}\n${money(r.y2027)}\n구성비 ${(part*100).toFixed(1)}%`)}/>`;offset+=len;
   const yy=80+i*58;s+=`<rect x="225" y="${yy-9}" width="8" height="8" rx="2" fill="${ACCOUNT_COLORS[r.name]||COLORS[i]}"/>`;s+=text(241,yy,r.name,'font-size="11" fill="#656980"');s+=text(241,yy+19,`${(part*100).toFixed(1)}%`,'font-size="17" font-weight="700" fill="#33364E"');s+=text(241,yy+34,short(r.y2027)+'억원','font-size="9"');
  });s+=text(cx,cy-8,'2027 재원','text-anchor="middle" font-size="10"');s+=text(cx,cy+16,(total/10000).toFixed(1)+'조','text-anchor="middle" font-size="23" font-weight="700" fill="#35354F"');
  $('account-chart').innerHTML=svg(w,h,s,'양수 예산의 회계별 구성비');
 }
 // Balanced binary treemap: every positive program retains its relative area.
 function treemapChart(rows){
  const data=rows.filter(r=>r.y2027>0).sort((a,b)=>b.y2027-a.y2027);if(!data.length)return empty('treemap-chart');
  let s='';const total=sum(data,'y2027');
  function layout(items,x,y,w,h){if(items.length===1){const r=items[0],color=SECTOR_COLORS[r.sector],gap=3;const rw=Math.max(0,w-gap),rh=Math.max(0,h-gap);s+=`<rect x="${x}" y="${y}" width="${rw}" height="${rh}" rx="6" fill="${color}" opacity="${.72+(r.id%4)*.07}" ${attrs(tip(r))}/>`;
    if(w>63&&h>35){const n=Math.max(3,Math.floor((w-16)/11));s+=text(x+9,y+19,cut(r.program,n),'fill="#FFFFFF" font-size="11" pointer-events="none"');if(h>53)s+=text(x+9,y+37,short(r.y2027)+(w>120?'억원':''),'fill="#FFFFFFCE" font-size="10" pointer-events="none"');if(h>85&&w>90)s+=text(x+9,y+58,`${(r.y2027/total*100).toFixed(1)}%`,'fill="#FFFFFFB0" font-size="10" pointer-events="none"');}return;}
   const t=sum(items,'y2027');let acc=0,index=1;while(index<items.length){if(acc+items[index-1].y2027>=t/2){acc+=items[index-1].y2027;break;}acc+=items[index-1].y2027;index++;}if(index>=items.length){index=items.length-1;acc=sum(items.slice(0,index),'y2027');}const ratio=acc/t;
   if(w>=h){layout(items.slice(0,index),x,y,w*ratio,h);layout(items.slice(index),x+w*ratio,y,w*(1-ratio),h);}else{layout(items.slice(0,index),x,y,w,h*ratio);layout(items.slice(index),x,y+h*ratio,w,h*(1-ratio));}}
  layout(data,0,0,600,240);let i=0;Object.entries(SECTOR_COLORS).filter(([k])=>data.some(r=>r.sector===k)).forEach(([k,c])=>{s+=`<circle cx="${8+i*115}" cy="256" r="4" fill="${c}"/>`+text(18+i*115,260,k,'font-size="9"');i++;});
  $('treemap-chart').innerHTML=svg(600,267,s,'프로그램별 예산 규모 트리맵');
 }
 function mixChart(rows){
  const positive=rows.filter(r=>r.y2027>0);if(!positive.length)return empty('mix-chart');const sectors=group(positive,'sector');let s='';const w=420,h=267;
  sectors.forEach((r,i)=>{const y=28+i*64;s+=text(5,y,r.name,'fill="#5D627C" font-size="11"');let x=5;const parts=group(positive.filter(p=>p.sector===r.name),'account');parts.forEach((p,j)=>{const width=p.y2027/r.y2027*405;s+=`<rect x="${x}" y="${y+10}" width="${width}" height="23" rx="${parts.length===1?5:0}" fill="${ACCOUNT_COLORS[p.name]||COLORS[j]}" ${attrs(`${r.name} / ${p.name}\n${money(p.y2027)}\n비중 ${(p.y2027/r.y2027*100).toFixed(1)}%`)}/>`;if(width>65)s+=text(x+width/2,y+26,(p.y2027/r.y2027*100).toFixed(1)+'%','text-anchor="middle" fill="#FFFFFF" font-size="10" pointer-events="none"');x+=width;});});
  group(positive,'account').forEach((r,i)=>{s+=`<rect x="${5+i*175}" y="239" width="8" height="8" rx="2" fill="${ACCOUNT_COLORS[r.name]||COLORS[i]}"/>`+text(20+i*175,247,r.name,'font-size="10"');});
  $('mix-chart').innerHTML=svg(w,h,s,'부문별 회계 구성비 누적 막대');
 }
 function changeChart(rows){
  const data=[...rows].sort((a,b)=>Math.abs(b.change)-Math.abs(a.change)).slice(0,10),w=600,h=340,left=154,plot=350,max=Math.max(...data.map(r=>Math.abs(r.change)),1),zero=left+plot*.34;let s='';
  s+=line(zero,5,zero,310,'stroke="#DBDEEB"');s+=text(zero,332,'0','text-anchor="middle" font-size="9"');
  data.forEach((r,i)=>{const y=12+i*30,width=Math.abs(r.change)/max*(r.change<0?plot*.31:plot*.62),x=r.change<0?zero-width:zero;s+=text(left-9,y+13,cut(r.program,17),'text-anchor="end" font-size="10" fill="#696C85"');s+=`<rect x="${x}" y="${y}" width="${Math.max(width,1)}" height="19" rx="4" fill="${r.change>=0?'#7963F2':'#EF78A1'}" ${attrs(tip(r))}/>`;s+=text(r.change<0?x-5:x+width+6,y+13,signed(r.change),`text-anchor="${r.change<0?'end':'start'}" font-size="9" fill="${r.change>=0?'#7963D7':'#D97298'}"`);});
  $('change-chart').innerHTML=svg(w,h,s,'프로그램 증감액 상위 10개');
 }
 function growthChart(rows){
  const data=rows.filter(r=>r.y2026>0&&r.y2027>=0&&r.rate!==null).sort((a,b)=>Math.abs(b.rate)-Math.abs(a.rate)).slice(0,8);if(!data.length)return empty('growth-chart');const w=420,h=340,left=158,plot=199,max=Math.max(...data.map(r=>Math.abs(r.rate)),.01);let s='';
  data.forEach((r,i)=>{const y=20+i*38,x=left+Math.abs(r.rate)/max*plot,c=r.rate<0?'#EF78A1':'#27B8AD';s+=text(left-13,y+4,cut(r.program,17),'text-anchor="end" font-size="10" fill="#696C85"');s+=line(left,y,left+plot,y,'stroke-dasharray="2 4"');s+=line(left,y,x,y,`stroke="${c}" stroke-width="3"`);s+=`<circle cx="${x}" cy="${y}" r="5" fill="${c}" ${attrs(tip(r))}/>`;s+=text(x+10,y+4,pct(r.rate),`font-size="10" fill="${c}"`);});
  $('growth-chart').innerHTML=svg(w,h,s,'프로그램 절대 증감률 상위 8개');
 }
 function bubbleChart(rows){
  const data=rows.filter(r=>r.y2026>0&&r.y2027>0&&r.rate!==null);if(!data.length)return empty('bubble-chart');const w=600,h=267,left=48,right=36,top=20,bottom=37,pw=w-left-right,ph=h-top-bottom,xmax=Math.max(...data.map(r=>r.y2027))*1.1,ymin=Math.min(0,...data.map(r=>r.rate))-.08,ymax=Math.max(.1,...data.map(r=>r.rate))+.1;
  const x=v=>left+v/xmax*pw,y=v=>top+(ymax-v)/(ymax-ymin)*ph;let s='';
  for(let i=0;i<=4;i++){const v=ymin+(ymax-ymin)*i/4,yy=y(v);s+=line(left,yy,w-right,yy,'stroke-dasharray="3 5"')+text(left-8,yy+3,(v*100).toFixed(0)+'%','text-anchor="end" font-size="9"');const xv=xmax*i/4,xx=x(xv);s+=text(xx,h-15,short(xv),'text-anchor="middle" font-size="9"');}
  s+=line(left,y(0),w-right,y(0),'stroke="#B8BCCE"');
  [...data].sort((a,b)=>b.y2027-a.y2027).forEach(r=>{const radius=5+Math.sqrt(r.y2027/xmax)*21;s+=`<circle cx="${x(r.y2027)}" cy="${y(r.rate)}" r="${radius}" fill="${SECTOR_COLORS[r.sector]}" fill-opacity=".6" stroke="${SECTOR_COLORS[r.sector]}" stroke-width="1.2" ${attrs(tip(r))}/>`;});
  [...data].sort((a,b)=>b.y2027-a.y2027).slice(0,3).forEach(r=>{s+=text(x(r.y2027),y(r.rate)-29,cut(r.program,14),'text-anchor="middle" font-size="9" fill="#696C85" pointer-events="none"');});
  $('bubble-chart').innerHTML=svg(w,h,s,'프로그램별 예산 규모와 증감률 산점도');
 }
 function categoryChart(rows){
  const data=group(rows.filter(r=>r.y2027>0),'category').sort((a,b)=>b.y2027-a.y2027).slice(0,6);if(!data.length)return empty('category-chart');const w=420,h=267,left=153,right=62,plot=w-left-right,max=Math.max(...data.flatMap(r=>[r.y2026,r.y2027]),1);let s='';
  data.forEach((r,i)=>{const y=24+i*35,x1=left+r.y2026/max*plot,x2=left+r.y2027/max*plot;s+=text(left-15,y+4,cut(r.name,17),'text-anchor="end" font-size="10" fill="#696C85"');s+=line(Math.min(x1,x2),y,Math.max(x1,x2),y,'stroke="#D4D9EC" stroke-width="5"');s+=`<circle cx="${x1}" cy="${y}" r="5" fill="#BCC7F8" ${attrs(`${r.name} · 2026\n${money(r.y2026)}`)}/><circle cx="${x2}" cy="${y}" r="6" fill="#26B8AD" ${attrs(`${r.name} · 2027\n${money(r.y2027)}\n증감 ${signed(r.change)}억원`)}/>`;s+=text(Math.max(x1,x2)+10,y+4,short(r.y2027),'font-size="9" fill="#699D96"');});
  s+=text(left,257,'● 2026','font-size="9" fill="#9FADE1"')+text(left+90,257,'● 2027','font-size="9" fill="#26B8AD"');$('category-chart').innerHTML=svg(w,h,s,'구분별 2026년과 2027년 예산 변화');
 }
 function updateTable(rows){
  const sorted=[...rows].sort((a,b)=>{const x=a[state.sort],y=b[state.sort];if(x===null)return 1;if(y===null)return -1;return state.direction*(typeof x==='number'?x-y:String(x).localeCompare(String(y),'ko'));});
  $('table-count').textContent=rows.length+'개 항목';
  $('data-table').innerHTML=sorted.map(r=>`<tr><td><span class="sector-tag" style="color:${SECTOR_COLORS[r.sector]};background:${SECTOR_COLORS[r.sector]}14">${esc(r.sector)}</span></td><td>${esc(r.account)}</td><td>${esc(r.category)}</td><td class="program" title="${esc(r.program)}">${esc(r.program)}</td><td class="numeric">${number(r.y2026)}</td><td class="numeric">${number(r.y2027)}</td><td class="numeric ${r.change<0?'negative':'positive'}">${signed(r.change)}</td><td class="numeric"><span class="rate-tag ${r.rate<0?'negative':'positive'}">${pct(r.rate)}</span></td></tr>`).join('')||'<tr><td colspan="8" style="text-align:center;padding:35px">조건에 맞는 항목이 없습니다.</td></tr>';
  const a=sum(rows,'y2026'),b=sum(rows,'y2027');$('table-total').innerHTML=`<tr><td colspan="4">선택 항목 합계</td><td class="numeric">${number(a)}</td><td class="numeric">${number(b)}</td><td class="numeric">${signed(b-a)}</td><td class="numeric">${pct(rate(a,b))}</td></tr>`;
  document.querySelectorAll('th[data-key]').forEach(th=>{const selected=th.dataset.key===state.sort;th.setAttribute('aria-sort',selected?(state.direction===1?'ascending':'descending'):'none');th.querySelector('span').textContent=selected?(state.direction===1?'↑':'↓'):'↕';});
 }
 function render(){
  current=all.filter(r=>(!state.sector||r.sector===state.sector)&&(!state.account||r.account===state.account)&&(!state.search||[r.program,r.category].some(v=>v.toLowerCase().includes(state.search.toLowerCase()))));
  const a=sum(current,'y2026'),b=sum(current,'y2027'),diff=b-a;
  $('selection').textContent=`${state.sector||'전체 부문'} · ${state.account||'전체 회계'}${state.search?' · “'+state.search+'”':''} / ${current.length}개 항목`;
  $('budget-value').textContent=money(b);$('budget-note').textContent='2026년 '+money(a);$('change-value').textContent=signed(diff)+'억원';$('rate-value').textContent=pct(rate(a,b));$('count-value').textContent=current.length+'개';
  $('count-note').textContent=`${current.filter(r=>r.change>0).length}개 증가 · ${current.filter(r=>r.change<0).length}개 감소 · ${current.filter(r=>r.change===0).length}개 동일`;
  $('change-spark').innerHTML=[12,20,17,27,23,34,32,40].map(h=>`<i style="height:${h}px"></i>`).join('');
  $('empty').classList.toggle('hidden',current.length>0);$('visuals').classList.toggle('hidden',current.length===0);
  if(current.length)[sectorChart,accountChart,treemapChart,mixChart,changeChart,growthChart,bubbleChart,categoryChart].forEach(fn=>fn(current));
  updateTable(current);
 }
 function updateAccountOptions(){const values=[...new Set(all.filter(r=>!state.sector||r.sector===state.sector).map(r=>r.account))];if(!values.includes(state.account))state.account='';$('account').innerHTML='<option value="">전체 회계</option>'+values.map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');$('account').value=state.account;}
 function reset(){state.sector='';state.account='';state.search='';$('sector').value='';$('search').value='';updateAccountOptions();render();}
 $('sector').innerHTML+=[...new Set(all.map(r=>r.sector))].map(v=>`<option value="${esc(v)}">${esc(v)}</option>`).join('');updateAccountOptions();
 $('sector').addEventListener('change',e=>{state.sector=e.target.value;updateAccountOptions();render();});$('account').addEventListener('change',e=>{state.account=e.target.value;render();});$('search').addEventListener('input',e=>{state.search=e.target.value.trim();render();});$('reset').addEventListener('click',reset);$('empty-reset').addEventListener('click',reset);
 document.querySelectorAll('th[data-key] button').forEach(b=>b.addEventListener('click',()=>{const key=b.parentElement.dataset.key;if(state.sort===key)state.direction*=-1;else{state.sort=key;state.direction=['y2026','y2027','change','rate'].includes(key)?-1:1;}updateTable(current);}));
 $('download').addEventListener('click',()=>{const quote=v=>'"'+String(v??'').replace(/"/g,'""')+'"';const header=['부문','회계구분','구분','프로그램명','2026년(억원)','2027년(억원)','증감(억원)','증감률(%)'];const csv='\uFEFF'+[header,...current.map(r=>[r.sector,r.account,r.category,r.program,r.y2026,r.y2027,r.change,r.rate===null?'':(r.rate*100).toFixed(4)])].map(r=>r.map(quote).join(',')).join('\r\n');const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));const a=document.createElement('a');a.href=url;a.download='국방예산_선택데이터.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 const tooltip=$('tooltip');document.addEventListener('pointermove',e=>{const node=e.target.closest('[data-tip]');if(!node){tooltip.style.opacity=0;return;}tooltip.textContent=node.dataset.tip;tooltip.style.opacity=1;const rect=tooltip.getBoundingClientRect();tooltip.style.left=Math.max(8,Math.min(e.clientX+15,innerWidth-rect.width-10))+'px';tooltip.style.top=Math.max(8,Math.min(e.clientY+15,innerHeight-rect.height-10))+'px';});document.addEventListener('pointerleave',()=>tooltip.style.opacity=0);window.addEventListener('scroll',()=>tooltip.style.opacity=0,{passive:true});
 document.querySelectorAll('nav a').forEach(a=>a.addEventListener('click',()=>{document.querySelectorAll('nav a').forEach(n=>n.classList.remove('active'));a.classList.add('active');}));
 render();
 // Expose only a read-only summary for local verification.
 window.dashboardSummary=()=>({count:current.length,y2026:sum(current,'y2026'),y2027:sum(current,'y2027'),change:sum(current,'change'),charts:document.querySelectorAll('.chart svg').length});
})();
