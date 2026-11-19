'use strict';
(()=>{
 const key='sklad-placement-v1';
 let pallets=[], active=0, saved=false, excelLoad;
 const status=message=>$('planStatus').textContent=message;
 function restore(){
  const data=JSON.parse(localStorage.getItem(key)||'null');
  if(!data)return;
  pallets=data.pallets; active=data.active; saved=data.saved;
 }
 try{restore()}catch{status('Не удалось прочитать планировку в этом браузере.')}
 function persist(){
  try{localStorage.setItem(key,JSON.stringify({pallets,active,saved}));return true}
  catch{status('Не удалось сохранить данные в этом браузере.');return false}
 }
 function actions(){
  $('createPallet').disabled=pallets.length>=50;
  $('savePlan').disabled=!pallets.length || saved;
  $('exportPlan').hidden=!saved;
  $('newPlan').hidden=!saved;
 }
 function dirty(){
  saved=false;status('');actions();persist();
 }
 function focusScan(){if(pallets[active]?.boxes.length<20)$('scanCode').focus()}
 function boxField(label,box,field,type='text'){
  const wrap=document.createElement('label');
  wrap.textContent=label;
  const input=document.createElement('input');
  input.type=type; input.value=box[field];
  if(type==='number'){input.min=1;input.step=1}else input.maxLength=80;
  input.oninput=()=>{box[field]=input.value;dirty()};
  wrap.append(input);return wrap;
 }
 function render(){
  actions();
  const pallet=pallets[active];
  $('palletView').hidden=!pallet;
  $('palletChoice').disabled=!pallet;
  $('palletChoice').replaceChildren(...pallets.map((p,i)=>new Option(p.number?'№ '+p.number:'Палета '+(i+1),String(i),false,i===active)));
  if(!pallet)return;
  $('palletNumber').value=pallet.number;
  const n=pallet.boxes.length;
  $('scanCode').disabled=$('scanForm').querySelector('button').disabled=n>=20;
  $('nextSlot').textContent=n===20?'Палета заполнена · 20 из 20 коробок':
   'Следующая коробка · '+(n<10?'Лицевая':'Обратная')+' сторона · ряд '+(1+Math.floor(n%10/2))+' · '+(n%2?'справа':'слева');
  const faces=$('faces'); faces.replaceChildren();
  for(let side=0;side<2;side++){
   const face=document.createElement('div');face.className='face';
   const heading=document.createElement('h3');heading.textContent=side?'Обратная':'Лицевая';face.append(heading);
   for(let i=0;i<10;i++){
    const index=side*10+i,box=pallet.boxes[index],cell=document.createElement('div');
    cell.className='slot';
    if(!box){
     cell.classList.add('empty');if(index===n)cell.classList.add('next');
     cell.textContent='Ряд '+(1+Math.floor(i/2))+' · '+(i%2?'справа':'слева');
    }else{
     const name=document.createElement('b');name.textContent=box.model;cell.append(name);
     if(box.mix)cell.append(boxField('Цвет',box,'color'),boxField('Размеры',box,'size'));
     else{
      const info=document.createElement('small');info.textContent=box.color+' · '+box.size+' р.';cell.append(info);
     }
     cell.append(boxField('Количество, шт.',box,'quantity','number'));
    }
    face.append(cell);
   }
   faces.append(face);
  }
 }
 $('navPlan').onclick=()=>{
  showHistory(false);$('editor').hidden=true;$('placement').hidden=false;
  $('crumb').textContent='Расстановка';$('navForm').classList.remove('active');$('navPlan').classList.add('active');
  render();focusScan();
 };
 $('createPallet').onclick=()=>{
  if(pallets.length>=50)return;
  active=pallets.length;pallets.push({number:'',boxes:[]});dirty();render();focusScan();
 };
 $('palletChoice').onchange=e=>{active=Number(e.target.value);persist();render();focusScan()};
 $('palletNumber').oninput=e=>{
  pallets[active].number=e.target.value;
  $('palletChoice').selectedOptions[0].text=e.target.value?'№ '+e.target.value:'Палета '+(active+1);
  dirty();
 };
 $('palletView').addEventListener('keydown',e=>{
  if(e.key==='Enter' && e.target instanceof HTMLInputElement && e.target!==$('scanCode')){
   e.preventDefault();focusScan();
  }
 });
 $('scanForm').onsubmit=e=>{
  e.preventDefault();
  const pallet=pallets[active], input=$('scanCode');
  if(!pallet || pallet.boxes.length>=20)return;
  let box;
  try{box=readBox(input.value.trim())}
  catch{status('Код не распознан. Отсканируйте этикетку склада.');input.select();return}
  pallet.boxes.push(box);input.value='';dirty();render();focusScan();
 };
 $('savePlan').onclick=()=>{
  const numbers=new Set();
  for(let i=0;i<pallets.length;i++){
   const p=pallets[i], number=p.number.trim().toLowerCase();
   const invalid=p.boxes.findIndex(box=>!Number.isSafeInteger(Number(box.quantity)) || Number(box.quantity)<1);
   if(!number || numbers.has(number) || invalid>=0){
    active=i;render();
    if(!number || numbers.has(number)){
     status(number?'У каждой палеты должен быть свой номер.':'Присвойте палете номер.');$('palletNumber').focus();
    }else{
     status('Укажите количество изделий в коробке '+(invalid+1)+'.');
     $('faces').querySelectorAll('input[type=number]')[invalid].focus();
    }
    return;
   }
   numbers.add(number);
  }
  saved=true;
  if(persist())status('Планировка сохранена в этом браузере.');else saved=false;
  actions();
 };
 $('newPlan').onclick=()=>{
  if(!confirm('Начать новую планировку? Сохраните Excel текущей планировки перед продолжением.'))return;
  pallets=[];active=0;dirty();render();
 };
 function loadExcel(){
  if(!excelLoad)excelLoad=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='vendor/exceljs.min.js';
   script.onload=resolve;script.onerror=()=>{excelLoad=null;script.remove();reject(Error())};document.head.append(script);
  });
  return excelLoad;
 }
 $('exportPlan').onclick=async()=>{
  if(!saved)return;
  const snapshot=structuredClone(pallets);
  $('exportPlan').disabled=true;
  try{
   await loadExcel();
   const bytes=await workbookFor(snapshot).xlsx.writeBuffer();
   const link=document.createElement('a');
   link.href=URL.createObjectURL(new Blob([bytes],{type:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'}));
   link.download='Расстановка палет.xlsx';link.click();setTimeout(()=>URL.revokeObjectURL(link.href),30000);
  }catch{status('Не удалось создать Excel. Попробуйте ещё раз.')}
  finally{$('exportPlan').disabled=false}
 };
 function workbookFor(plan){
  const book=new ExcelJS.Workbook(), sheet=book.addWorksheet('Расстановка');
  const sides=['Лицевая','Обратная'];
  const colors={'черный':'101010','белый':'FFFFFF','бежевый':'DAC7A8','красный':'BD2631','бордовый':'890C29','голубой':'8ACDE9','темно-синий':'213E74','синий':'365CA3','коричневый':'804817','графит':'898B90','серый':'ABB0B5','светло-серый':'CDD0D4','темно-зеленый':'387136','зеленый':'6CAA64','розовый':'EABFCB','темно-розовый':'DAA4B6'};
  const border={style:'thin',color:{argb:'FF333333'}};
  function paint(cell,value,bg,bold=false,size=11){
   cell.value=value;cell.alignment={horizontal:'center',vertical:'middle',wrapText:true,shrinkToFit:true};
   const [r,g,b]=bg.match(/../g).map(n=>parseInt(n,16));
   cell.font={name:'Arial',size,bold,color:{argb:0.299*r+0.587*g+0.114*b<143?'FFFFFFFF':'FF000000'}};
   cell.fill={type:'pattern',pattern:'solid',fgColor:{argb:'FF'+bg}};
   cell.border={top:border,bottom:border,left:border,right:border};
  }
  const width=Math.min(3,plan.length)*5-1;
  sheet.mergeCells(1,1,1,width);paint(sheet.getCell(1,1),'ПРАВАЯ СТЕНА','CDDEF8',true,23);sheet.getRow(1).height=44;
  plan.forEach((p,i)=>{
   const row=3+Math.floor(i/3)*9,col=1+i%3*5;
   sheet.mergeCells(row,col,row,col+3);paint(sheet.getCell(row,col),'Палета №'+p.number,'69E354',true,13);sheet.getRow(row).height=23;
   for(let side=0;side<2;side++){
    const start=col+side*2;sheet.mergeCells(row+1,start,row+1,start+1);paint(sheet.getCell(row+1,start),sides[side],'FFFFFF',true);
    for(let pos=0;pos<10;pos++){
     const r=row+2+Math.floor(pos/2),c=start+pos%2,box=p.boxes[side*10+pos];
     sheet.getRow(r).height=66;sheet.getColumn(c).width=17;
     const text=box?[box.model,box.color || 'Микс',(box.size?box.size+' р. · ':'')+box.quantity+' шт.'].join('\n'):'';
     const color=(box?.color||'').trim().toLowerCase().replaceAll('ё','е');
     paint(sheet.getCell(r,c),text,Object.hasOwn(colors,color)?colors[color]:(box?'E8EDF1':'FFFFFF'));
    }
   }
   sheet.getColumn(col+4).width=4;
  });
  sheet.pageSetup={orientation:'landscape',paperSize:9,fitToPage:true,fitToWidth:1,fitToHeight:0};
  return book;
 }
 render();
})();
