'use strict';
const $ = id => document.getElementById(id);
const icons = {
 box:'<path d="m12 2 9 5v10l-9 5-9-5V7zM3 7l9 5 9-5M12 12v10M7.5 4.5l9 5"/>',
 tag:'<path d="M3 3h9l9 9-9 9-9-9z"/><circle cx="8" cy="8" r="1"/>',
 clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v6l4 2"/>',
 sliders:'<path d="M4 7h6m4 0h6M4 17h10m4 0h2"/><circle cx="12" cy="7" r="2"/><circle cx="16" cy="17" r="2"/>',
 eye:'<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
 download:'<path d="M12 3v12m-5-5 5 5 5-5M4 16v4h16v-4"/>',
 printer:'<path d="M7 8V3h10v5M7 17H3V9h18v8h-4M7 14h10v7H7z"/>',
 folder:'<path d="M3 5h7l2 3h9v12H3z"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => el.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+icons[el.dataset.icon]+'</svg>');
const palette={'Тёмно-синий':'#273951','Чёрный':'#292b30','Бежевый':'#cfbca2','Голубой':'#8bc0e3','Красный':'#ce5859'};
const colors=Object.keys(palette), grid=Array.from({length:11},(_,i)=>40+i*2), sizes=new Set(grid);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=id=>$(id).value.trim();
const selected=()=>grid.filter(n=>sizes.has(n));
let cursor=0, events=[];
try{const saved=JSON.parse(localStorage.getItem('sklad-log')||'[]');if(Array.isArray(saved))events=saved}catch{}
document.querySelector('time').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
function ticket(color,size){
 return '<div class="ticket"><header><span>СКЛАД / ЭТИКЕТКА</span><span aria-hidden="true" class="bars"></span></header><div class="ticketbody"><div><div class="model">'+esc(value('model'))+'</div><div class="color">'+esc(color)+'</div><strong class="bigsize">'+size+' р.</strong></div><div class="sign"><div>Кол-во, шт.<div class="line"></div></div><div>Подпись<div class="line"></div></div></div></div><div class="ref">Заказ № '+esc(value('order'))+' · Отправление '+esc(value('shipment'))+'</div></div>';
}
function update(){
 const list=selected(), count=list.length*colors.length;
 cursor=Math.max(0,Math.min(cursor,count-1));
 $('sample').innerHTML=count?ticket(colors[Math.floor(cursor/list.length)],list[cursor%list.length]):'<div class="ticket">Выберите цвет и размер</div>';
 $('page').textContent=count?(cursor+1)+' из '+count:'0 из 0';
 $('sum').textContent='Цветов: '+colors.length+'   ×   Размеров: '+list.length+'   =   Этикеток: '+count;
 $('prev').disabled=cursor===0;$('next').disabled=cursor>=count-1;
 $('print').disabled=document.querySelector('.primary').disabled=!count;
}
function renderColors(){
 $('chips').replaceChildren(...colors.map(color=>{
 const btn=document.createElement('button');btn.type='button';btn.className='chip';btn.setAttribute('aria-label','Удалить цвет '+color);
 btn.innerHTML='<span class="dot"></span>'+esc(color)+'<span>×</span>';btn.firstChild.style.background=Object.hasOwn(palette,color)?palette[color]:'#84909b';
 btn.onclick=()=>{colors.splice(colors.indexOf(color),1);cursor=0;renderColors()};return btn;
 }));update();
}
function addColor(){
 const name=value('custom');if(!name){$('custom').focus();return}
 if(colors.some(c=>c.toLocaleLowerCase('ru')===name.toLocaleLowerCase('ru'))){$('message').textContent='Этот цвет уже выбран.';return}
 colors.push(name);$('custom').value='';$('message').textContent='';renderColors();
}
$('add').onclick=addColor;$('custom').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();addColor()}};
grid.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='size';b.textContent=n;b.setAttribute('aria-pressed',true);b.onclick=()=>{if(sizes.has(n))sizes.delete(n);else sizes.add(n);b.setAttribute('aria-pressed',sizes.has(n));cursor=0;update()};$('sizes').append(b)});
['model','order','shipment'].forEach(id=>{$(id).pattern='.*\\S.*';$(id).oninput=update});
$('prev').onclick=()=>{cursor--;update()};$('next').onclick=()=>{cursor++;update()};renderColors();
function logAction(action){
 events.unshift({date:new Date().toISOString(),action,model:value('model'),order:value('order'),shipment:value('shipment'),count:colors.length*sizes.size});
 try{localStorage.setItem('sklad-log',JSON.stringify(events))}catch{$('message').textContent+=' Журнал доступен только до закрытия страницы.'}
}
function showHistory(on){
 $('history').hidden=!on;$('editor').hidden=on;$('crumb').textContent=on?'Журнал действий':'Этикетки';
 $('navLog').classList.toggle('active',on);$('navForm').classList.toggle('active',!on);$('message').textContent='';
 if(on)$('events').innerHTML=events.length?events.map(e=>'<div class="event"><b>'+esc(e.action)+'</b> · '+esc(e.model)+'<div>Заказ № '+esc(e.order)+' · Отправление '+esc(e.shipment)+' · Этикеток: '+esc(e.count)+'</div><small>'+esc(new Date(e.date).toLocaleString('ru-RU'))+'</small></div>').join(''):'Действий пока нет.';
}
$('navForm').onclick=()=>showHistory(false);$('navLog').onclick=()=>showHistory(true);
const printStyles='@page{size:A4;margin:10mm}.sheet{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-content:start;gap:3mm}.ticket{box-sizing:border-box;border:1px dashed #666;padding:4mm;break-inside:avoid;font:14px Arial,sans-serif;overflow-wrap:anywhere;color:#111;background:white}.ticket header{display:flex;justify-content:space-between;height:auto;border:0;border-bottom:1px solid;padding:0 0 2mm;margin:0 0 3mm;font:bold 11px monospace;color:#111}.ticketbody{display:grid;grid-template-columns:1.2fr 1fr;gap:3mm}.model{font-size:24px;font-weight:bold}.color{margin:2mm 0}.bigsize{font-size:22px}.sign{border-left:1px dashed #888;padding-left:3mm;display:flex;flex-direction:column;justify-content:space-around;font-size:12px}.line{height:5mm;border-bottom:1px solid}.ref{border-top:1px solid;margin-top:3mm;padding-top:2mm;font:12px monospace}.bars{width:12mm;height:4mm;background:repeating-linear-gradient(90deg,#111 0 2px,transparent 2px 4px);print-color-adjust:exact}';
const style=document.createElement('style');style.media='print';style.textContent='body{background:white;margin:0}body>aside,body>main{display:none}#printArea{display:block}'+printStyles;document.head.append(style);
function sheet(color){return selected().map(n=>ticket(color,n)).join('')}
$('print').onclick=()=>{if(!$('form').reportValidity())return;$('printArea').innerHTML='<div class="sheet">'+colors.map(sheet).join('')+'</div>';logAction('Запрос печати');window.print()};
// ZIP with UTF-8 filenames and uncompressed entries (PKWARE APPNOTE).
function zip(files){
 const encode=new TextEncoder(), parts=[],directory=[];let offset=0;
 const header=n=>new DataView(new ArrayBuffer(n));
 files.forEach(([path,html])=>{
 const name=encode.encode(path),data=encode.encode(html);let crc=-1;
 for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^-1)>>>0;
 const local=header(30),central=header(46);local.setUint32(0,0x04034b50,true);central.setUint32(0,0x02014b50,true);central.setUint16(4,20,true);
 for(const [view,p] of [[local,0],[central,2]]){view.setUint16(4+p,20,true);view.setUint16(6+p,0x800,true);view.setUint16(12+p,33,true);view.setUint32(14+p,crc,true);view.setUint32(18+p,data.length,true);view.setUint32(22+p,data.length,true);view.setUint16(26+p,name.length,true)}
 central.setUint32(42,offset,true);directory.push(central.buffer,name);parts.push(local.buffer,name,data);offset+=30+name.length+data.length;
 });
 const end=header(22);end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,directory.reduce((n,x)=>n+x.byteLength,0),true);end.setUint32(16,offset,true);
 return new Blob([...parts,...directory,end.buffer],{type:'application/zip'});
}
const safe=s=>s.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'').slice(0,80)||'_';
$('form').onsubmit=e=>{
 e.preventDefault();if(!colors.length||!sizes.size)return;
 const folder=safe('Заказ '+value('order')+' — отправление '+value('shipment'));
 const files=colors.map((c,i)=>[folder+'/'+(i+1)+' '+safe(c)+'.html','<!doctype html><html lang="ru"><meta charset="utf-8"><title>'+esc(c)+' — '+esc(value('model'))+'</title><style>'+printStyles+'body{margin:10mm}button{margin-bottom:8mm;padding:8px 16px}@media print{body{margin:0}button{display:none}}</style><button onclick="window.print()">Печать</button><div class="sheet">'+sheet(c)+'</div></html>']);
 const url=URL.createObjectURL(zip(files)),a=document.createElement('a');a.href=url;a.download=folder+'.zip';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);
 $('message').textContent='Архив подготовлен к скачиванию.';logAction('Скачивание архива');
};
