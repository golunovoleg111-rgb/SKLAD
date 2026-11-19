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
 canvas.setAttribute('aria-label',color===null ? model+' · Микс размеров' : [color,size+' р.'].join(' · '));
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
 const qr=qrcode(0,'L');
 qr.addData(boxCode(model,color,size,order,shipment));qr.make();
 const modules=qr.getModuleCount();
 // Integer modules, four-module quiet zone and an aligned origin for thermal output.
 const pitch=Math.max(4,Math.min(6,Math.floor((wide?23:19)*resolution/(modules+8))));
 const qrSide=(modules+8)*pitch/resolution;
 for(let r=0;r<modules;r++)for(let c=0;c<modules;c++){
  if(qr.isDark(r,c))ctx.fillRect(1+(4+c)*pitch/resolution,1+(4+r)*pitch/resolution,pitch/resolution,pitch/resolution);
 }
 const titleX=qrSide+2, header=qrSide+1.5;
 textBlock(color===null?'СКЛАД / МИКС':'СКЛАД / ЭТИКЕТКА',titleX,1,w-titleX-2,3,2.2,true);
 textBlock(model,titleX,4,w-titleX-2,header-4,wide?7.5:5.8,true);
 line(2,header,w-2,header);
 if(color===null){
  const fields=['Цвет','Размеры','Кол-во, шт.','Подпись'];
  const row=(h-2-header)/fields.length;
  fields.forEach((name,i)=>{
   const y=header+i*row;
   textBlock(name,2,y,16,row,2.7);
   line(19,y+row-1,w-2,y+row-1);
  });
 }else{
  const split=w*.65, bottom=h-7, row=(bottom-header)/2;
  [color,size+' р.'].forEach((s,i)=>textBlock(s,2,header+i*row,split-3,row,wide?[6,7.5][i]:[4.6,5.8][i],true));
  line(split,header+1,split,bottom-1);
  ['Кол-во, шт.','Подпись'].forEach((s,i)=>{
   const y=header+1+i*(bottom-header-1)/2;
   textBlock(s,split+2,y,w-split-4,4,2.6);
   line(split+2,y+(bottom-header-1)/2-1,w-2,y+(bottom-header-1)/2-1);
  });
  line(2,bottom,w-2,bottom);
  textBlock('Заказ № '+order+' · Отправление '+shipment,2,bottom+.3,w-4,6,2.5);
 }
 return canvas;
}
