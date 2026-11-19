// All drawing coordinates are millimetres. Use the same artwork for the preview and PDF.
function drawLabel(model, color, size, paperHeight, order, shipment) {
 const wide = paperHeight === 80;
 const w = wide ? 80 : 58, h = wide ? 58 : paperHeight;
 const canvas = document.createElement('canvas');
 const resolution = 16;
 canvas.width = w * resolution;
 canvas.height = h * resolution;
 canvas.style.width = w+'mm';
 canvas.setAttribute('role','img');
 canvas.setAttribute('aria-label',color===null ? model+' · Микс размеров' : [model,color,size+' р.'].join(' · '));
 const ctx = canvas.getContext('2d');
 ctx.scale(resolution,resolution);
 ctx.fillStyle='white';ctx.fillRect(0,0,w,h);ctx.fillStyle='black';
 ctx.textBaseline='top';
 function line(x,y,endX,endY){
  ctx.lineWidth=.22;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(endX,endY);ctx.stroke();
 }
 function textBlock(text,x,y,width,height,fontSize,bold=false){
  let lines;
  for(;;fontSize-=.15){
   ctx.font=(bold?'bold ':'')+fontSize+'px Arial, sans-serif';
   lines=[''];
   for(const ch of text){
    const last=lines.length-1;
    if(lines[last] && ctx.measureText(lines[last]+ch).width>width)lines.push(ch);
    else lines[last]+=ch;
   }
   if(lines.length*fontSize*1.13<=height || fontSize<=1)break;
  }
  const start=y+(height-lines.length*fontSize*1.13)/2;
  lines.forEach((lineText,i)=>ctx.fillText(lineText,x,start+i*fontSize*1.13,width));
 }
 textBlock(color===null?'СКЛАД / МИКС':'СКЛАД / ЭТИКЕТКА',2,1,w-4,4,2.4,true);
 line(2,5.5,w-2,5.5);
 if(color===null){
  const titleHeight=h*.23;
  textBlock(model,2,6,w-4,titleHeight,wide?7:5.7,true);
  const fields=['Цвет','Размеры','Кол-во, шт.','Подпись'];
  const row=(h-8-titleHeight)/fields.length;
  fields.forEach((name,i)=>{
   const y=6+titleHeight+i*row;
   textBlock(name,2,y,16,row,2.7);
   line(19,y+row-1,w-2,y+row-1);
  });
 }else{
  const split=w*.65, bottom=h-7, row=(bottom-7)/3;
  [model,color,size+' р.'].forEach((s,i)=>textBlock(s,2,6+i*row,split-3,row,wide?[7.5,6,7.5][i]:[5.8,4.6,5.8][i],true));
  line(split,7,split,bottom-1);
  ['Кол-во, шт.','Подпись'].forEach((s,i)=>{
   const y=7+i*(bottom-8)/2;
   textBlock(s,split+2,y,w-split-4,4,2.6);
   line(split+2,y+(bottom-8)/2-1,w-2,y+(bottom-8)/2-1);
  });
  line(2,bottom,w-2,bottom);
  textBlock('Заказ № '+order+' · Отправление '+shipment,2,bottom+.3,w-4,6,2.5);
 }
 return canvas;
}
