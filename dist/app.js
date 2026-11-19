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
const colors=[], grid=Array.from({length:15},(_,i)=>38+i*2), sizes=new Set();
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const value=id=>$(id).value.trim();
const selected=()=>grid.filter(n=>sizes.has(n));
let cursor=0, events=[];
try{const saved=JSON.parse(localStorage.getItem('sklad-log')||'[]');if(Array.isArray(saved))events=saved}catch{}
document.querySelector('time').textContent=new Date().toLocaleDateString('ru-RU',{day:'numeric',month:'long',year:'numeric'});
let busy = false;
const copies = new Map();
const isMix = () => document.querySelector('[name="mode"]:checked').value === 'mix';
const height = () => Number(document.querySelector('[name="height"]:checked').value);
const perColor = () => selected().reduce((sum, n) => sum + (copies.get(n) || 0), 0);
const total = () => isMix() ? Number(Boolean(value('model'))) : colors.length * perColor();

function update(){
 const mix = isMix(), count = total();
 cursor = Math.max(0, Math.min(cursor, count-1));
 const sample = $('sample');
 if(count){
  let position = cursor % perColor();
  const size = mix ? null : selected().find(n => {
   if(position < copies.get(n)) return true;
   position -= copies.get(n);
   return false;
  });
  sample.replaceChildren(drawLabel(value('model'), mix ? null : colors[Math.floor(cursor/perColor())], size, height(), value('order'), value('shipment')));
 } else {
  sample.innerHTML = '<div class="empty-preview">'+(mix?'Введите название изделия':'Выберите цвет и размер')+'</div>';
 }
 $('page').textContent = (count ? cursor+1 : 0)+' из '+count;
 $('sum').textContent = mix ? 'Этикеток: '+count : 'Цветов: '+colors.length+' · Наклеек на цвет: '+perColor()+' · Всего: '+count;
 $('prev').disabled=cursor===0; $('next').disabled=cursor>=count-1;
 $('download').disabled=busy || !count || !value('model') || (!mix && (!value('order') || !value('shipment') || selected().some(n=>!copies.get(n))));
}
function renderQuantities(){
 $('quantityFields').hidden = !sizes.size;
 $('quantities').replaceChildren(...selected().map(n=>{
  const label=document.createElement('label');
  label.textContent=n+' р.';
  const input=document.createElement('input');
  input.type='number'; input.min=1; input.step=1; input.required=true;
  input.value=copies.get(n) || '';
  input.oninput=()=>{
   const v=input.valueAsNumber;
   copies.set(n,Number.isSafeInteger(v) && v>0 ? v : 0);
   update();
  };
  label.append(input); return label;
 }));
}
function changeMode(){
 const mix=isMix();
 $('monoFields').hidden=mix;
 $('monoFields').querySelectorAll('input,button').forEach(el=>el.disabled=mix);
 $('download').querySelector('span').textContent=mix?'Скачать PDF':'Скачать архив';
 $('noteTitle').textContent=mix?'Микс размеров':'Архив по цветам';
 $('noteText').textContent=mix?'Цвет, размеры и количество впишите на этикетке от руки.':'В архиве — отдельный PDF для каждого цвета.';
 cursor=0; update();
}
document.querySelectorAll('[name="mode"]').forEach(el=>el.onchange=changeMode);
document.querySelectorAll('[name="height"]').forEach(el=>el.onchange=update);
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
grid.forEach(n=>{const b=document.createElement('button');b.type='button';b.className='size';b.textContent=n;b.setAttribute('aria-pressed',false);b.onclick=()=>{if(sizes.has(n))sizes.delete(n);else {sizes.add(n);if(!copies.has(n))copies.set(n,1)}renderQuantities();b.setAttribute('aria-pressed',sizes.has(n));cursor=0;update()};$('sizes').append(b)});
['model','order','shipment'].forEach(id=>{$(id).pattern='.*\\S.*';$(id).oninput=update});
$('prev').onclick=()=>{cursor--;update()};$('next').onclick=()=>{cursor++;update()};renderColors();
function logAction(action){
 events.unshift({date:new Date().toISOString(),action,model:value('model'),order:value('order'),shipment:value('shipment'),count:total()});
 try{localStorage.setItem('sklad-log',JSON.stringify(events))}catch{$('message').textContent+=' Журнал доступен только до закрытия страницы.'}
}
function showHistory(on){
 $('placement').hidden=true;
 $('navPlan').classList.remove('active');
 $('history').hidden=!on;$('editor').hidden=on;$('crumb').textContent=on?'Журнал действий':'Этикетки';
 $('navLog').classList.toggle('active',on);$('navForm').classList.toggle('active',!on);$('message').textContent='';
 if(on)$('events').innerHTML=events.length?events.map(e=>'<div class="event"><b>'+esc(e.action)+'</b> · '+esc(e.model)+'<div>Заказ № '+esc(e.order)+' · Отправление '+esc(e.shipment)+' · Этикеток: '+esc(e.count)+'</div><small>'+esc(new Date(e.date).toLocaleString('ru-RU'))+'</small></div>').join(''):'Действий пока нет.';
}
$('navForm').onclick=()=>showHistory(false);$('navLog').onclick=()=>showHistory(true);
// ZIP with UTF-8 filenames and uncompressed entries (PKWARE APPNOTE).
function zip(files){
 const encode=new TextEncoder(), parts=[],directory=[];let offset=0;
 const header=n=>new DataView(new ArrayBuffer(n));
 files.forEach(([path,data])=>{
 const name=encode.encode(path);let crc=-1;
 for(const byte of data){crc^=byte;for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0)}crc=(crc^-1)>>>0;
 const local=header(30),central=header(46);local.setUint32(0,0x04034b50,true);central.setUint32(0,0x02014b50,true);central.setUint16(4,20,true);
 for(const [view,p] of [[local,0],[central,2]]){view.setUint16(4+p,20,true);view.setUint16(6+p,0x800,true);view.setUint16(12+p,33,true);view.setUint32(14+p,crc,true);view.setUint32(18+p,data.length,true);view.setUint32(22+p,data.length,true);view.setUint16(26+p,name.length,true)}
 central.setUint32(42,offset,true);directory.push(central.buffer,name);parts.push(local.buffer,name,data);offset+=30+name.length+data.length;
 });
 const end=header(22);end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);end.setUint32(12,directory.reduce((n,x)=>n+x.byteLength,0),true);end.setUint32(16,offset,true);
 return new Blob([...parts,...directory,end.buffer],{type:'application/zip'});
}
const safe=s=>s.replace(/[<>:"/\\|?*\u0000-\u001f]/g,'_').replace(/[. ]+$/g,'').slice(0,80)||'_';
async function makePdf(color){
 const doc=await PDFLib.PDFDocument.create();
 const mm=72/25.4, h=height();
 for(const size of color===null?[null]:selected()){
  const canvas=drawLabel(value('model'),color,size,h,value('order'),value('shipment'));
  const img=await doc.embedPng(canvas.toDataURL('image/png'));
  const rotated=h===80;
  for(let i=0;i<(size===null?1:copies.get(size));i++){
   const page=doc.addPage([58*mm,h*mm]);
   page.drawImage(img,{x:0,y:rotated?h*mm:0,width:(rotated?h:58)*mm,height:(rotated?58:h)*mm,rotate:PDFLib.degrees(rotated?-90:0)});
  }
 }
 return doc.save();
}
$('form').onsubmit=async e=>{
 e.preventDefault();
 if(busy || $('download').disabled)return;
 busy=true;
 const form=$('form'), mix=isMix();
 form.inert=true;
 update();
 $('message').textContent='Подготовка файлов…';
 try{
  let blob, filename;
  if(mix){
   blob=new Blob([await makePdf(null)],{type:'application/pdf'});
   filename='Микс — '+safe(value('model'))+'.pdf';
  }else{
   const files=[], used=new Set();
   for(const color of colors){
    const base=safe(color);
    let name=base, suffix=1;
    while(used.has(name.toLowerCase()))name=base+' ('+(++suffix)+')';
    used.add(name.toLowerCase());
    files.push([name+'.pdf',await makePdf(color)]);
   }
   blob=zip(files);filename=safe('Заказ '+value('order')+' — отправление '+value('shipment'))+'.zip';
  }
  const link=document.createElement('a');
  link.href=URL.createObjectURL(blob);link.download=filename;link.click();
  setTimeout(()=>URL.revokeObjectURL(link.href),30000);
  $('message').textContent='Файл подготовлен к скачиванию.';
  logAction(mix?'Скачивание PDF микса':'Скачивание архива монокоробов');
 }catch(error){
  console.error(error);$('message').textContent='Не удалось создать файл. Попробуйте скачать ещё раз.';
 }finally{form.inert=false;busy=false;update()}
};
