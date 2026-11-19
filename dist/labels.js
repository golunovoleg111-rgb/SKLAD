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
 // Measure the printed glyphs, so capitals, descenders and short names
 // can use the full allotted area. Prefer one line when sizes are similar.
 function headline(text,x,y,width,height){
  const content=text.trim();
  if(!content)return;
  ctx.save();
  ctx.font='bold 100px Arial, sans-serif';
  ctx.textBaseline='alphabetic';
  function layout(lines){
   const metrics=lines.map(line=>ctx.measureText(line));
   const widths=metrics.map(m=>m.actualBoundingBoxLeft+m.actualBoundingBoxRight);
   const heights=metrics.map(m=>m.actualBoundingBoxAscent+m.actualBoundingBoxDescent);
   const gap=12;
   const fullHeight=heights.reduce((a,b)=>a+b,0)+(lines.length-1)*gap;
   const scale=Math.min(width/Math.max(1,...widths),height/Math.max(1,fullHeight));
   return {lines,metrics,widths,heights,gap,fullHeight,scale};
  }
  let best=layout([content]);
  for(let i=1;i<content.length;i++){
   if(!/[\s-]/.test(content[i-1]))continue;
   const left=content.slice(0,i).trim(),right=content.slice(i).trim();
   if(!left || !right)continue;
   const candidate=layout([left,right]);
   if(candidate.scale>best.scale*1.04)best=candidate;
  }
  ctx.translate(x,y+(height-best.fullHeight*best.scale)/2);
  ctx.scale(best.scale,best.scale);
  let top=0;
  best.lines.forEach((line,i)=>{
   const m=best.metrics[i];
   ctx.fillText(line,(width/best.scale-best.widths[i])/2+m.actualBoundingBoxLeft,top+m.actualBoundingBoxAscent);
   top+=best.heights[i]+best.gap;
  });
  ctx.restore();
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
 if(color===null)textBlock('МИКС',titleX,1,w-titleX-2,3,2.2,true);
 const titleTop=color===null?4.5:1.5;
 headline(model,titleX,titleTop,w-titleX-2,header-titleTop-1);
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
  const bottom=h-5, colorBottom=header+(bottom-header)*.46;
  headline(color,2,header+1.3,w-4,colorBottom-header-2.6);
  const split=w*.53, lowerHeight=bottom-colorBottom;
  headline(size+' р.',2,colorBottom+1,split-4,lowerHeight-2);
  line(split,colorBottom+.5,split,bottom-.5);
  ['Кол-во, шт.','Подпись'].forEach((label,i)=>{
   const y=colorBottom+i*lowerHeight/2;
   textBlock(label,split+1,y+1,w-split-3,3,2.5);
   line(split+1,y+lowerHeight/2-.5,w-2,y+lowerHeight/2-.5);
  });
  line(2,bottom,w-2,bottom);
  textBlock('Заказ № '+order+' · Отправление '+shipment,2,bottom+.2,w-4,4.3,2.5);
 }
 return canvas;
}
