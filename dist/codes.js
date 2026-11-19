// ASCII transport keeps label contents independent of the scanner's Cyrillic support.
function boxCode(model, color, size, order, shipment) {
 const fields=color===null?[model]:[model,color,size,order,shipment];
 const bytes=new TextEncoder().encode(JSON.stringify(fields));
 return 'SK1:'+btoa(String.fromCharCode(...bytes));
}
function readBox(code){
 if(!code.startsWith('SK1:') || code.length>2048)throw Error();
 const bytes=Uint8Array.from(atob(code.slice(4)),ch=>ch.charCodeAt(0));
 const fields=JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 const text=(s,max)=>typeof s==='string' && s.trim().length>0 && s.length<=max;
 if(!Array.isArray(fields) || !text(fields[0],40))throw Error();
 if(fields.length===1)return {model:fields[0],mix:true,color:'',size:'',quantity:''};
 const [model,color,size,order,shipment]=fields;
 if(fields.length!==5 || !text(color,35) || !Number.isInteger(size) || size<38 || size>66 || size%2 || !text(order,24) || !text(shipment,24))throw Error();
 return {model,color,size,order,shipment,quantity:''};
}
