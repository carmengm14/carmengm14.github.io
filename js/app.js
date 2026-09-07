const GOOGLE_FONTS=[
"Barlow Semi Condensed","Barlow","Inter","Roboto","Open Sans","Montserrat","Poppins","Lato","Oswald",
"Raleway","Nunito","Roboto Condensed","Bebas Neue","Playfair Display","Merriweather","DM Sans",
"Manrope","Work Sans","Archivo","Source Sans 3"
];

const TEMPLATES=[
 {id:"80x18",name:"Etiqueta 80 × 18 mm",size:[80,18],image:"assets/portadas/80x18.svg",description:"Formato horizontal compacto."},
 {id:"70x40",name:"Etiqueta 70 × 40 mm",size:[70,40],image:"assets/portadas/70x40.svg",description:"Formato horizontal de mayor altura."},
 {id:"48-5x25-4",name:"Etiqueta 48,5 × 25,4 mm",size:[48.5,25.4],image:"assets/portadas/48-5x25-4.svg",description:"Formato compacto para etiquetas pequeñas."}
];

const DEFAULT_TEXT={
 producto:{size:9,weight:700,align:"left",lineHeight:1.1},
 color:{size:6.5,weight:400,align:"left",lineHeight:1.1},
 tamano:{size:6.5,weight:400,align:"left",lineHeight:1.1},
 detalles:{size:6.5,weight:400,align:"left",lineHeight:1.1}
};

let selectedTemplate=TEMPLATES[0],rows=[],currentRow=0,commonLogo=null,targetDirectory=null,customFontFamily=null;
let logoState={x:6,y:18,w:36,h:48};
let lockLogoAspect=true;
let qrState={x:7,y:20,size:22};
let qrDataUrl=null;
let qrGenerationKey="";
let qrColor="#ffffff";
let textStyles=JSON.parse(JSON.stringify(DEFAULT_TEXT));
const DEFAULT_TEXT_POSITIONS={
  "70x40":{producto:{x:54,y:31,w:42},color:{x:54,y:49,w:42},tamano:{x:54,y:63,w:42},detalles:{x:54,y:76,w:42}},
  "80x18":{producto:{x:47,y:30,w:48},color:{x:47,y:49,w:48},tamano:{x:47,y:63,w:48},detalles:{x:47,y:77,w:48}},
  "48-5x25-4":{producto:{x:45,y:25,w:48},color:{x:45,y:47,w:48},tamano:{x:45,y:61,w:48},detalles:{x:45,y:75,w:48}}
};
let textPositions=JSON.parse(JSON.stringify(DEFAULT_TEXT_POSITIONS["80x18"]));
let guides={visible:true,items:[]},selectedGuideId=null;
let dragState=null, selectedText="producto";

const $=s=>document.querySelector(s), statusEl=$("#status");
function setStatus(t){statusEl.textContent=t}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2600)}
function mmToPx(mm){return mm*3.779527559}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function clamp(n,min,max){return Math.max(min,Math.min(max,n))}
function renderHome(){
 $("#template-grid").innerHTML=TEMPLATES.map(t=>`<article class="template-card"><button onclick="selectTemplate('${t.id}')"><div class="template-thumb"><img src="${t.image}" alt="${esc(t.name)}" onerror="this.style.opacity='.25'"></div><div class="template-meta"><div><h3>${esc(t.name)}</h3><p>${esc(t.description)}</p></div><span class="size">${t.size[0]} × ${t.size[1]} mm</span></div></button></article>`).join("");
}
window.selectTemplate=function(id){
 selectedTemplate=TEMPLATES.find(x=>x.id===id)||TEMPLATES[0];
 $("#screen-home").classList.remove("active");$("#screen-editor").classList.add("active");
 $("#editorTitle").textContent=selectedTemplate.name;$("#editorDescription").textContent=selectedTemplate.description;
 $("#dimensionsPill").textContent=`${selectedTemplate.size[0]} × ${selectedTemplate.size[1]} mm`;
 resetElementPositions();updatePreview();window.scrollTo({top:0,behavior:"smooth"});
};
$("#backBtn").onclick=()=>{$("#screen-editor").classList.remove("active");$("#screen-home").classList.add("active")};

function resetElementPositions(){
 logoState=selectedTemplate.id==="70x40"
   ? {x:54,y:7,w:39,h:16}
   : {x:6,y:18,w:36,h:48};
 if(selectedTemplate.id==="70x40") qrState={x:4,y:12,size:35};
 else if(selectedTemplate.id==="48-5x25-4") qrState={x:7,y:20,size:22};
 else qrState={x:72,y:20,size:22};
 textPositions=JSON.parse(JSON.stringify(DEFAULT_TEXT_POSITIONS[selectedTemplate.id]||DEFAULT_TEXT_POSITIONS["80x18"]));
 guides={visible:true,items:[]};selectedGuideId=null;
 qrDataUrl=null;qrGenerationKey="";
 renderGuides();
}
function parseCSV(file){
 Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>{
  rows=r.data.map(cleanRow);currentRow=0;
  $("#csvInfo").textContent=`${file.name} · ${rows.length} etiquetas`;$("#csvInfo").classList.remove("hidden");
  $("#rowCounter").textContent=rows.length?`1 / ${rows.length}`:"0 filas";
  $("#csvColumns").innerHTML='<span>Columnas detectadas:</span>'+Object.keys(rows[0]||{}).map(k=>`<code>${esc(k)}</code>`).join("");
  setStatus(`${rows.length} etiquetas cargadas`);updatePreview();toast(`CSV cargado: ${rows.length} etiquetas`);
 },error:()=>toast("No se ha podido leer el CSV")});
}
function cleanRow(r){const out={};Object.keys(r).forEach(k=>out[k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")]=String(r[k]??"").trim());return out}
$("#csvInput").addEventListener("change",e=>{if(e.target.files[0])parseCSV(e.target.files[0])});
$("#csvDropzone").addEventListener("dragover",e=>e.preventDefault());
$("#csvDropzone").addEventListener("drop",e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)parseCSV(f)});

$("#logoInput").addEventListener("change",e=>{
 const f=e.target.files[0];if(!f)return;const rd=new FileReader();
 rd.onload=()=>{commonLogo=rd.result;updatePreview();toast("Logo cargado: ahora puedes moverlo y redimensionarlo")};rd.readAsDataURL(f)
});

function loadGoogleFont(font){
 if(!font)return;
 const id="google-font-"+font.replace(/[^a-z0-9]/gi,"-").toLowerCase();
 if(!document.getElementById(id)){
  const link=document.createElement("link");link.id=id;link.rel="stylesheet";link.href=`https://fonts.googleapis.com/css2?family=${font.split(" ").join("+")}:wght@300;400;500;600;700;800&display=swap`;document.head.appendChild(link)
 }
 document.fonts.load(`700 20px "${font}"`).then(updatePreview).catch(updatePreview)
}
function populateFonts(){$("#fontFamily").innerHTML=GOOGLE_FONTS.map(f=>`<option value="${esc(f)}">${esc(f)}</option>`).join("");loadGoogleFont($("#fontFamily").value)}
$("#fontFamily").addEventListener("change",e=>{customFontFamily=null;$("#fontInfo").classList.add("hidden");loadGoogleFont(e.target.value);updatePreview()});
$("#fontInput").addEventListener("change",async e=>{
 const file=e.target.files[0];if(!file)return;
 try{const face=new FontFace("CustomFont",await file.arrayBuffer());await face.load();document.fonts.add(face);customFontFamily="CustomFont";$("#fontInfo").textContent=`Tipografía cargada: ${file.name}`;$("#fontInfo").classList.remove("hidden");updatePreview();toast("Tipografía propia cargada")}catch(err){console.error(err);toast("No se ha podido cargar esa tipografía")}
});

["bgColor","textColor","bleed","scale","rounded"].forEach(id=>$("#"+id).addEventListener("input",updatePreview));
$("#qrColor").addEventListener("input",e=>{qrColor=e.target.value;qrDataUrl=null;qrGenerationKey="";updatePreview()});
$("#prevRow").onclick=()=>{if(rows.length){currentRow=(currentRow-1+rows.length)%rows.length;updatePreview()}};
$("#nextRow").onclick=()=>{if(rows.length){currentRow=(currentRow+1)%rows.length;updatePreview()}};

function syncLogoControls(){["x","y","w","h"].forEach(k=>$("#logo"+k.toUpperCase()).value=Number(logoState[k]).toFixed(1).replace(".0",""))}
["X","Y","W","H"].forEach(k=>$("#logo"+k).addEventListener("input",()=>{
 const key=k.toLowerCase();
 if(key==="w" || key==="h") {
   const value=clamp(Number($("#logo"+k).value)||1,1,100);
   if(lockLogoAspect){
     const ratio=logoState.w/Math.max(logoState.h,0.001);
     if(key==="w"){
       logoState.w=value;
       logoState.h=clamp(value/Math.max(ratio,0.001),1,100-logoState.y);
     }else{
       logoState.h=value;
       logoState.w=clamp(value*ratio,1,100-logoState.x);
     }
   }else logoState[key]=clamp(value,1,100);
 } else {
   logoState[key]=clamp(Number($("#logo"+k).value)||0,0,100);
 }
 updatePreview();
}));
$("#lockLogoAspect").addEventListener("change",e=>{lockLogoAspect=e.target.checked;});
function syncQRControls(){
 $("#qrX").value=Number(qrState.x).toFixed(1).replace(".0","");
 $("#qrY").value=Number(qrState.y).toFixed(1).replace(".0","");
 $("#qrSize").value=Number(qrState.size).toFixed(1).replace(".0","");
}
["qrX","qrY","qrSize"].forEach(id=>$("#"+id).addEventListener("input",()=>{
 const key=id.replace("qr","").toLowerCase();
 if(key==="x") qrState.x=clamp(Number($("#qrX").value)||0,0,100-qrState.size);
 if(key==="y") qrState.y=clamp(Number($("#qrY").value)||0,0,100-qrState.size);
 if(key==="size") qrState.size=clamp(Number($("#qrSize").value)||1,1,Math.min(100-qrState.x,100-qrState.y));
 updatePreview();
}));
function rowData(row){const val=(keys)=>{for(const k of keys)if(row[k])return row[k];return""};return{
 logo:val(["logo"]),producto:val(["producto","product","nombre","nombreproducto"]),color:val(["color","colour"]),
 tamano:val(["tamano","tamaño","size","talla"]),detalles:val(["detalles","detalle","details"]),qr:val(["qr","qrcode","codigoqr"])
}}
function imageSrc(v){if(!v)return null;if(v.startsWith("data:image")||v.startsWith("http://")||v.startsWith("https://"))return v;return null}
function activeFont(){return customFontFamily||$("#fontFamily").value||"Barlow Semi Condensed"}
async function makeQRDataUrl(url){
 let value=String(url||"").trim();
 if(!value)return null;
 if(/^www\./i.test(value)) value="https://"+value;
 else if(/^[a-z0-9.-]+\.[a-z]{2,}(\/|$)/i.test(value)) value="https://"+value;

 // Generamos un SVG transparente desde la matriz del QR.
 // Solo se dibujan los módulos oscuros, por lo que el fondo queda totalmente transparente.
 if(typeof QRCode!=="undefined" && typeof QRCode.create==="function") {
   try {
     const qr=QRCode.create(value,{errorCorrectionLevel:"M"});
     const modules=qr.modules;
     const count=modules.size;
     const quiet=2;
     const total=count+quiet*2;
     const color=qrColor || "#ffffff";
     let rects="";
     for(let y=0;y<count;y++){
       for(let x=0;x<count;x++){
         if(modules.get(x,y)) rects+=`<rect x="${x+quiet}" y="${y+quiet}" width="1" height="1"/>`;
       }
     }
     const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${total}" shape-rendering="crispEdges"><g fill="${color}">${rects}</g></svg>`;
     return "data:image/svg+xml;charset=utf-8,"+encodeURIComponent(svg);
   } catch(e){console.warn("Generación SVG de QR no disponible",e)}
 }

 // Fallback para navegadores donde la librería QR no esté disponible.
 // Se conserva el color solicitado y se usa un fondo del color de la etiqueta.
 try{
   return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&margin=0&format=png&color=${encodeURIComponent((qrColor||"#ffffff").replace("#",""))}&bgcolor=${encodeURIComponent(($("#bgColor").value||"#050505").replace("#",""))}&data=${encodeURIComponent(value)}`;
 }catch(e){return null}
}
async function ensureQR(row){
 const url=rowData(row).qr, key=String(url||"").trim();
 if(!key){qrDataUrl=null;qrGenerationKey="";return null}
 if(key===qrGenerationKey && qrDataUrl)return qrDataUrl;
 qrDataUrl=await makeQRDataUrl(key);qrGenerationKey=key;return qrDataUrl;
}

function populateTextControls(){
 const s=textStyles[selectedText],pos=textPositions[selectedText];
 $("#textSize").value=s.size;$("#textWeight").value=s.weight;$("#textAlign").value=s.align;$("#lineHeight").value=s.lineHeight;
 $("#textX").value=Number(pos.x).toFixed(1).replace(".0","");$("#textY").value=Number(pos.y).toFixed(1).replace(".0","");
}
$("#textElement").addEventListener("change",e=>{selectedText=e.target.value;populateTextControls();updatePreview()});
["textSize","textWeight","textAlign","lineHeight"].forEach(id=>$("#"+id).addEventListener("input",()=>{
 const s=textStyles[selectedText];s.size=Number($("#textSize").value)||s.size;s.weight=Number($("#textWeight").value)||s.weight;s.align=$("#textAlign").value;s.lineHeight=Number($("#lineHeight").value)||s.lineHeight;updatePreview()
}));
["textX","textY"].forEach(id=>$("#"+id).addEventListener("input",()=>{
 const pos=textPositions[selectedText],key=id==="textX"?"x":"y";pos[key]=clamp(Number($("#"+id).value)||0,0,key==="x"?100-pos.w:98);updatePreview()
}));

function labelHTML(d,qrGenerated=null){
 const logo=imageSrc(d.logo)||commonLogo,qr=qrGenerated;
 // El logo vive dentro de un contenedor real. Antes se añadía el tirador
 // directamente como hijo de <img>, lo que podía provocar diferencias al
 // rasterizar el PDF. El contenedor mantiene posición/tamaño y el <img>
 // conserva siempre object-fit: contain.
 const logoEl=logo
   ? `<div id="editableLogo" class="logo-box"><img class="canvas-logo" src="${logo}" draggable="false" alt=""></div>`
   : `<div id="editableLogo" class="logo-box logo-placeholder">LOGO</div>`;
 const text=(key,value,extra="")=> {
   if (!String(value ?? "").trim()) return "";
   return `<div class="text-layer ${selectedText===key?"selected":""}" data-text-key="${key}" style="${extra}">${esc(value)}</div>`;
 };
 let html=`<div class="label-content">${logoEl}`;
 if(selectedTemplate.id==="70x40"){
   // Plantilla con QR a la izquierda y contenido a la derecha.
   for(const key of ["producto","color","tamano","detalles"]){const pos=textPositions[key];html+=text(key,d[key],`left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;`)}
   if(qr)html+=`<div id="editableQR" class="qr-box"><img class="canvas-qr" src="${qr}" alt="QR" draggable="false"></div>`;
 }else if(selectedTemplate.id==="48-5x25-4"){
   for(const key of ["producto","color","tamano","detalles"]){const pos=textPositions[key];html+=text(key,d[key],`left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;`)}
   if(qr)html+=`<div id="editableQR" class="qr-box"><img class="canvas-qr" src="${qr}" alt="QR" draggable="false"></div>`;
 }else{
   for(const key of ["producto","color","tamano","detalles"]){const pos=textPositions[key];html+=text(key,d[key],`left:${pos.x}%;top:${pos.y}%;width:${pos.w}%;`)}
   if(qr)html+=`<div id="editableQR" class="qr-box"><img class="canvas-qr" src="${qr}" alt="QR" draggable="false"></div>`;
 }
 return html+"</div>";
}

function applyElementStyles(){
 const p=$("#labelPreview"), logo=p.querySelector("#editableLogo");
 if(logo){
   logo.style.left=logoState.x+"%";logo.style.top=logoState.y+"%";
   logo.style.width=logoState.w+"%";logo.style.height=logoState.h+"%";
 }
 const qr=p.querySelector("#editableQR");
 if(qr){
   qr.style.left=qrState.x+"%";qr.style.top=qrState.y+"%";
   qr.style.width=qrState.size+"%";qr.style.height=qrState.size+"%";
 }
 p.querySelectorAll(".text-layer").forEach(el=>{
   const key=el.dataset.textKey,s=textStyles[key];
   el.style.fontFamily=`"${activeFont()}",Arial,sans-serif`;el.style.fontSize=s.size+"px";el.style.fontWeight=s.weight;el.style.textAlign=s.align;el.style.lineHeight=s.lineHeight;
 });
}

async function updatePreview(){
 const d=rowData(rows[currentRow]||{producto:"GALDANA",color:"OCRE",tamano:"15X15",detalles:"",qr:""});
 const [w,h]=selectedTemplate.size,scale=Number($("#scale").value||100)/100,bleed=Number($("#bleed").value||0),p=$("#labelPreview");
 p.style.width=mmToPx(w*scale+bleed*2)+"px";p.style.height=mmToPx(h*scale+bleed*2)+"px";p.style.background=$("#bgColor").value;p.style.color=$("#textColor").value;
 p.classList.toggle("rounded",$("#rounded").checked);
 const qr=await ensureQR(rows[currentRow]||d);
 p.innerHTML=labelHTML(d,qr);applyElementStyles();syncLogoControls();syncQRControls();bindCanvasInteractions();
 $("#rowCounter").textContent=rows.length?`${currentRow+1} / ${rows.length}`:"Ejemplo";
}

function bindCanvasInteractions(){
 const p=$("#labelPreview");
 const logo=p.querySelector("#editableLogo");
 if(logo){
  logo.onpointerdown=e=>{if(e.target.classList.contains("logo-handle"))return;e.preventDefault();logo.setPointerCapture(e.pointerId);dragState={type:"moveLogo",startX:e.clientX,startY:e.clientY,start:{...logoState}}};
  logo.onpointermove=e=>{if(!dragState||dragState.type!=="moveLogo")return;const r=p.getBoundingClientRect(),dx=(e.clientX-dragState.startX)/r.width*100,dy=(e.clientY-dragState.startY)/r.height*100;logoState.x=clamp(dragState.start.x+dx,0,100-logoState.w);logoState.y=clamp(dragState.start.y+dy,0,100-logoState.h);applyElementStyles();syncLogoControls()};
  logo.onpointerup=()=>dragState=null;logo.onpointercancel=()=>dragState=null;
  const handle=document.createElement("span");handle.className="logo-handle";logo.appendChild(handle);
  handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();handle.setPointerCapture(e.pointerId);dragState={type:"resizeLogo",startX:e.clientX,startY:e.clientY,start:{...logoState}}};
  handle.onpointermove=e=>{if(!dragState||dragState.type!=="resizeLogo")return;const r=p.getBoundingClientRect(),dx=(e.clientX-dragState.startX)/r.width*100,dy=(e.clientY-dragState.startY)/r.height*100,start=dragState.start;if(lockLogoAspect){const ratio=start.w/Math.max(start.h,.001);let w=Math.max(2,Math.abs(dx)>=Math.abs(dy)?start.w+dx:(start.h+dy)*ratio);let h=w/ratio;const maxW=100-start.x,maxH=100-start.y;if(w>maxW){w=maxW;h=w/ratio}if(h>maxH){h=maxH;w=h*ratio}logoState.w=clamp(w,2,maxW);logoState.h=clamp(h,2,maxH)}else{logoState.w=clamp(start.w+dx,2,100-start.x);logoState.h=clamp(start.h+dy,2,100-start.y)}applyElementStyles();syncLogoControls()};
  handle.onpointerup=()=>dragState=null;handle.onpointercancel=()=>dragState=null;
 }
 const qr=p.querySelector("#editableQR");
 if(qr){
  qr.onpointerdown=e=>{if(e.target.classList.contains("qr-handle"))return;e.preventDefault();qr.setPointerCapture(e.pointerId);dragState={type:"moveQR",startX:e.clientX,startY:e.clientY,start:{...qrState}}};
  qr.onpointermove=e=>{if(!dragState||dragState.type!=="moveQR")return;const r=p.getBoundingClientRect(),dx=(e.clientX-dragState.startX)/r.width*100,dy=(e.clientY-dragState.startY)/r.height*100;qrState.x=clamp(dragState.start.x+dx,0,100-qrState.size);qrState.y=clamp(dragState.start.y+dy,0,100-qrState.size);applyElementStyles();syncQRControls()};
  qr.onpointerup=()=>dragState=null;qr.onpointercancel=()=>dragState=null;
  const handle=document.createElement("span");handle.className="qr-handle";qr.appendChild(handle);
  handle.onpointerdown=e=>{e.preventDefault();e.stopPropagation();handle.setPointerCapture(e.pointerId);dragState={type:"resizeQR",startX:e.clientX,startY:e.clientY,start:{...qrState}}};
  handle.onpointermove=e=>{if(!dragState||dragState.type!=="resizeQR")return;const r=p.getBoundingClientRect(),dx=(e.clientX-dragState.startX)/r.width*100,dy=(e.clientY-dragState.startY)/r.height*100,start=dragState.start;const delta=Math.abs(dx)>=Math.abs(dy)?dx:dy;const size=clamp(start.size+delta,3,Math.min(100-start.x,100-start.y));qrState.size=size;applyElementStyles();syncQRControls()};
  handle.onpointerup=()=>dragState=null;handle.onpointercancel=()=>dragState=null;
 }
 p.querySelectorAll(".text-layer").forEach(el=>{
   el.addEventListener("click",e=>{e.stopPropagation();selectedText=el.dataset.textKey;$("#textElement").value=selectedText;populateTextControls();applyElementStyles()});
   el.onpointerdown=e=>{e.preventDefault();e.stopPropagation();selectedText=el.dataset.textKey;$("#textElement").value=selectedText;populateTextControls();el.setPointerCapture(e.pointerId);dragState={type:"moveText",key:selectedText,startX:e.clientX,startY:e.clientY,start:{...textPositions[selectedText]}}};
   el.onpointermove=e=>{if(!dragState||dragState.type!=="moveText"||dragState.key!==el.dataset.textKey)return;const r=p.getBoundingClientRect(),dx=(e.clientX-dragState.startX)/r.width*100,dy=(e.clientY-dragState.startY)/r.height*100,start=dragState.start,pos=textPositions[dragState.key];pos.x=clamp(start.x+dx,0,100-pos.w);pos.y=clamp(start.y+dy,0,98);el.style.left=pos.x+"%";el.style.top=pos.y+"%";populateTextControls()};
   el.onpointerup=()=>dragState=null;el.onpointercancel=()=>dragState=null;
 });
}

function renderRulers(){
 const h=$('#rulerH'),v=$('#rulerV'),p=$('#labelPreview'); if(!h||!v||!p)return;
 const [w,hmm]=selectedTemplate.size;
 h.style.width=p.offsetWidth+'px';v.style.height=p.offsetHeight+'px';
 h.innerHTML='';v.innerHTML='';
 for(let mm=0;mm<=w;mm+=10){const el=document.createElement('span');el.className='ruler-tick ruler-tick-h';el.style.left=(mm/w*100)+'%';el.innerHTML=`<b>${mm}</b>`;h.appendChild(el)}
 for(let mm=0;mm<=hmm;mm+=5){const el=document.createElement('span');el.className='ruler-tick ruler-tick-v';el.style.top=(mm/hmm*100)+'%';el.innerHTML=`<b>${mm}</b>`;v.appendChild(el)}
}
function renderGuides(){
 const layer=$('#guideLayer'); if(!layer)return;
 layer.innerHTML='';layer.classList.toggle('guides-hidden',!guides.visible);
 guides.items.forEach(g=>{
   const el=document.createElement('div');el.className=`guide guide-${g.type}`;el.dataset.id=g.id;el.style[g.type==='v'?'left':'top']=g.pos+'%';
   el.title='Arrastra para mover · doble clic para eliminar';
   el.onpointerdown=e=>{e.preventDefault();e.stopPropagation();selectedGuideId=g.id;const p=$('#labelPreview'),r=p.getBoundingClientRect();dragState={type:'guide',id:g.id,startX:e.clientX,startY:e.clientY,start:g.pos};el.setPointerCapture(e.pointerId);
     el.onpointermove=ev=>{if(!dragState||dragState.type!=='guide')return;const delta=(g.type==='v'?(ev.clientX-dragState.startX)/r.width:(ev.clientY-dragState.startY)/r.height)*100;g.pos=clamp(dragState.start+delta,0,100);el.style[g.type==='v'?'left':'top']=g.pos+'%'};
     el.onpointerup=()=>dragState=null;el.onpointercancel=()=>dragState=null;};
   el.ondblclick=e=>{e.stopPropagation();guides.items=guides.items.filter(x=>x.id!==g.id);selectedGuideId=null;renderGuides()};
   layer.appendChild(el);
 });
 renderRulers();
}
function addGuide(type){const g={id:Date.now()+Math.random(),type,pos:50};guides.items.push(g);selectedGuideId=g.id;guides.visible=true;renderGuides()}
function deleteSelectedGuide(){if(selectedGuideId==null){toast('Selecciona una guía o haz doble clic sobre ella para eliminarla');return}guides.items=guides.items.filter(g=>g.id!==selectedGuideId);selectedGuideId=null;renderGuides()}
function clearGuides(){guides.items=[];selectedGuideId=null;renderGuides()}
function toggleGuides(){guides.visible=!guides.visible;const b=$('#toggleGuides');if(b)b.textContent=guides.visible?'Ocultar guías':'Mostrar guías';renderGuides()}
$('#addGuideV')?.addEventListener('click',()=>addGuide('v'));
$('#addGuideH')?.addEventListener('click',()=>addGuide('h'));
$('#deleteGuide')?.addEventListener('click',deleteSelectedGuide);
$('#clearGuides')?.addEventListener('click',clearGuides);
$('#toggleGuides')?.addEventListener('click',toggleGuides);

function safeFileName(s){return String(s||"Etiqueta").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-").replace(/\s+/g," ").trim().replace(/\.+$/g,"").slice(0,180)||"Etiqueta"}
function fileNameFor(row,i){const d=rowData(row),parts=[d.producto,d.color,d.tamano,d.detalles].filter(Boolean);return safeFileName(parts.join(" - ")||`Etiqueta ${String(i+1).padStart(3,"0")}`)+".pdf"}

async function rasterizeImagesForExport(clone){
 const imgs=[...clone.querySelectorAll("img")];
 await Promise.all(imgs.map(async img=>{
   try{
     if(img.decode) await img.decode();
   }catch(e){}

   const rect=img.getBoundingClientRect();
   const width=Math.max(1,Math.round(rect.width));
   const height=Math.max(1,Math.round(rect.height));
   if(!width||!height)return;

   const canvas=document.createElement("canvas");
   const dpr=2;
   canvas.width=width*dpr;
   canvas.height=height*dpr;
   canvas.style.cssText=img.style.cssText;
   canvas.style.display="block";
   canvas.style.position=getComputedStyle(img).position;
   canvas.style.width=width+"px";
   canvas.style.height=height+"px";
   canvas.setAttribute("aria-hidden","true");

   const ctx=canvas.getContext("2d");
   ctx.setTransform(dpr,0,0,dpr,0,0);
   ctx.imageSmoothingEnabled=true;
   ctx.imageSmoothingQuality="high";

   const src=img.currentSrc||img.src;
   const image=new Image();
   image.decoding="async";
   image.crossOrigin="anonymous";

   await new Promise(resolve=>{
     image.onload=()=>resolve();
     image.onerror=()=>resolve();
     image.src=src;
   });

   if(image.naturalWidth && image.naturalHeight){
     const fit=getComputedStyle(img).objectFit||"fill";
     if(fit==="contain"){
       const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight);
       const dw=image.naturalWidth*scale,dh=image.naturalHeight*scale;
       ctx.drawImage(image,(width-dw)/2,(height-dh)/2,dw,dh);
     }else{
       ctx.drawImage(image,0,0,width,height);
     }
   }
   img.replaceWith(canvas);
 }));
}

async function createPDF(row){
 const {jsPDF}=window.jspdf,[w,h]=selectedTemplate.size;
 const bleed=Number($("#bleed").value||0);
 const scale=Number($("#scale").value||100)/100;
 const totalW=w*scale+bleed*2,totalH=h*scale+bleed*2;

 const oldRows=rows,oldCurrent=currentRow;
 rows=[row];currentRow=0;await updatePreview();
 await document.fonts.ready;

 const source=$("#labelPreview");
 const exportHost=document.createElement("div");
 exportHost.style.cssText=
   `position:fixed;left:-100000px;top:0;width:${source.offsetWidth}px;height:${source.offsetHeight}px;`+
   `overflow:hidden;pointer-events:none;z-index:-1;`;

 const clone=source.cloneNode(true);
 clone.removeAttribute("id");
 clone.style.cssText=
   `position:relative;width:${source.offsetWidth}px;height:${source.offsetHeight}px;`+
   `max-width:none;max-height:none;transform:none;overflow:hidden;`+
   `background:${$("#bgColor").value};color:${$("#textColor").value};`;

 clone.querySelectorAll(".logo-handle,.qr-handle,.guide,.editor-overlay").forEach(el=>el.remove());
 clone.querySelectorAll(".text-layer.selected").forEach(el=>{
   el.classList.remove("selected");
   el.style.outline="none";
 });
 clone.querySelectorAll("*").forEach(el=>{
   el.style.animation="none";
   el.style.transition="none";
 });

 exportHost.appendChild(clone);
 document.body.appendChild(exportHost);

 try{
   // Esperamos a que el navegador calcule exactamente las dimensiones finales
   // antes de convertir imágenes a canvas.
   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

   await rasterizeImagesForExport(clone);

   await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));

   const canvas=await html2canvas(clone,{
     scale:4,
     useCORS:true,
     allowTaint:false,
     backgroundColor:null,
     width:source.offsetWidth,
     height:source.offsetHeight,
     windowWidth:source.offsetWidth,
     windowHeight:source.offsetHeight,
     logging:false
   });

   const doc=new jsPDF({
     unit:"mm",
     format:[totalW,totalH],
     orientation:totalW>=totalH?"landscape":"portrait",
     compress:true
   });

   doc.addImage(
     canvas.toDataURL("image/png"),
     "PNG",0,0,totalW,totalH,undefined,"FAST"
   );

   return doc.output("arraybuffer");
 }finally{
   exportHost.remove();
   rows=oldRows;currentRow=oldCurrent;
   updatePreview();
 }
}

async function generate(){
 if(!rows.length){toast("Primero sube un CSV");return}
 setStatus("Generando PDFs…");$("#generateBtn").disabled=true;
 try{
  if(targetDirectory&&window.showDirectoryPicker){
   for(let i=0;i<rows.length;i++){const bytes=await createPDF(rows[i]),fh=await targetDirectory.getFileHandle(fileNameFor(rows[i],i),{create:true}),w=await fh.createWritable();await w.write(bytes);await w.close()}
   setStatus(`${rows.length} PDFs generados`);toast(`Listo: ${rows.length} PDFs en la carpeta elegida`)
  }else{
   const zip=new JSZip();for(let i=0;i<rows.length;i++)zip.file(fileNameFor(rows[i],i),await createPDF(rows[i]));
   const blob=await zip.generateAsync({type:"blob"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="etiquetas_generadas.zip";a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
   setStatus(`${rows.length} PDFs preparados`);toast("ZIP generado con todas las etiquetas")
  }
 }catch(e){console.error(e);toast("Ha ocurrido un error al generar")}finally{$("#generateBtn").disabled=false}
}
$("#generateBtn").onclick=generate;
$("#folderBtn").onclick=async()=>{if(!window.showDirectoryPicker){toast("Tu navegador no permite seleccionar carpeta. Se usará ZIP.");return}try{targetDirectory=await window.showDirectoryPicker({mode:"readwrite"});$("#destination").textContent="Destino: carpeta seleccionada";toast("Carpeta de destino seleccionada")}catch(e){}};

populateFonts();populateTextControls();syncLogoControls();renderHome();updatePreview();
