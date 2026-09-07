const TEMPLATES = [
  {id:"abysm-30x12",name:"Abysm",size:[30,12],description:"Formato horizontal compacto, negro, logo a la izquierda y datos del producto.",kind:"wide"},
  {id:"oset-5x5",name:"Oset cuadrada",size:[50,50],description:"Formato cuadrado minimalista para nombre, color y tamaño.",kind:"square"},
  {id:"oset-qr-100x100",name:"Oset + QR",size:[100,100],description:"Formato cuadrado con QR, logo y datos de producto.",kind:"qr"}
];

let selectedTemplate = TEMPLATES[0];
let rows = [];
let currentRow = 0;
let commonLogo = null;
let targetDirectory = null;

const $ = s => document.querySelector(s);
const statusEl = $("#status");

function setStatus(t){statusEl.textContent=t}
function toast(t){const e=$("#toast");e.textContent=t;e.classList.add("show");setTimeout(()=>e.classList.remove("show"),2800)}
function mmToPx(mm){return mm*3.7795}

function renderHome(){
  $("#template-grid").innerHTML = TEMPLATES.map(t=>`
    <article class="template-card">
      <button onclick="selectTemplate('${t.id}')">
        <div class="template-thumb">
          ${templateThumb(t)}
        </div>
        <div class="template-meta">
          <div><h3>${t.name}</h3><p>${t.description}</p></div>
          <span class="size">${t.size[0]} × ${t.size[1]} mm</span>
        </div>
      </button>
    </article>`).join("");
}
function templateThumb(t){
  if(t.kind==="wide") return `<div class="fake-label thumb-wide"><div class="fake-logo">ABYSM</div><div class="fake-info"><b>PIETRA GREY</b>30X12</div></div>`;
  if(t.kind==="square") return `<div class="fake-label thumb-square"><div class="fake-logo">Oset</div><div class="fake-info"><b>MENORCA GREEN</b>5X5</div></div>`;
  return `<div class="fake-label thumb-qr"><div class="fake-qr"></div><div class="fake-logo">Oset</div><div class="fake-info"><b>SOLSTICE PLUMB</b>100X100</div></div>`;
}
window.selectTemplate = function(id){
  selectedTemplate=TEMPLATES.find(x=>x.id===id)||TEMPLATES[0];
  $("#screen-home").classList.remove("active");$("#screen-editor").classList.add("active");
  $("#editorTitle").textContent=selectedTemplate.name;
  $("#editorDescription").textContent=selectedTemplate.description;
  $("#dimensionsPill").textContent=`${selectedTemplate.size[0]} × ${selectedTemplate.size[1]} mm`;
  updatePreview();
  window.scrollTo({top:0,behavior:"smooth"});
};

$("#backBtn").onclick=()=>{$("#screen-editor").classList.remove("active");$("#screen-home").classList.add("active")};

function parseCSV(file){
  Papa.parse(file,{header:true,skipEmptyLines:true,complete:r=>{
    rows=r.data.map(cleanRow);
    currentRow=0;
    $("#csvInfo").textContent=`${file.name} · ${rows.length} etiquetas`;
    $("#csvInfo").classList.remove("hidden");
    $("#rowCounter").textContent=rows.length?`1 / ${rows.length}`:"0 filas";
    $("#csvColumns").innerHTML='<span>Columnas detectadas:</span>'+Object.keys(rows[0]||{}).map(k=>`<code>${k}</code>`).join("");
    setStatus(`${rows.length} etiquetas cargadas`);
    updatePreview();
    toast(`CSV cargado: ${rows.length} etiquetas`);
  },error:()=>toast("No se ha podido leer el CSV")});
}
function cleanRow(r){
  const out={};
  Object.keys(r).forEach(k=>out[k.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"")]=String(r[k]??"").trim());
  return out;
}
$("#csvInput").addEventListener("change",e=>{if(e.target.files[0])parseCSV(e.target.files[0])});
$("#csvDropzone").addEventListener("dragover",e=>{e.preventDefault()});
$("#csvDropzone").addEventListener("drop",e=>{e.preventDefault();const f=e.dataTransfer.files[0];if(f)parseCSV(f)});

$("#logoInput").addEventListener("change",e=>{
  const f=e.target.files[0];if(!f)return;
  const rd=new FileReader();rd.onload=()=>{commonLogo=rd.result;updatePreview()};rd.readAsDataURL(f);
});
["bgColor","textColor","bleed","scale","rounded"].forEach(id=>$("#"+id).addEventListener("input",updatePreview));
$("#prevRow").onclick=()=>{if(rows.length){currentRow=(currentRow-1+rows.length)%rows.length;updatePreview()}};
$("#nextRow").onclick=()=>{if(rows.length){currentRow=(currentRow+1)%rows.length;updatePreview()}};

function val(row,keys){for(const k of keys){if(row[k])return row[k]}return ""}
function rowData(row){
  return {
    logo:val(row,["logo"]),
    producto:val(row,["producto","product","nombre","nombreproducto"]),
    color:val(row,["color","colour"]),
    tamano:val(row,["tamano","tamaño","size","talla"]),
    detalles:val(row,["detalles","detalle","details"]),
    qr:val(row,["qr","qrcode","codigoqr"])
  };
}
function imageSrc(value){
  if(!value)return null;
  if(value.startsWith("data:image")||value.startsWith("http://")||value.startsWith("https://"))return value;
  return null;
}
function updatePreview(){
  const d=rowData(rows[currentRow]||{producto:"EJEMPLO",color:"NEGRO",tamano:"M",detalles:"100% ALGODÓN"});
  const bg=$("#bgColor").value,text=$("#textColor").value;
  const scale=Number($("#scale").value||100)/100, bleed=Number($("#bleed").value||0);
  const [w,h]=selectedTemplate.size;
  const p=$("#labelPreview");
  p.style.width=mmToPx(w*scale+bleed*2)+"px";p.style.height=mmToPx(h*scale+bleed*2)+"px";
  p.style.background=bg;p.style.color=text;p.classList.toggle("rounded",$("#rounded").checked);
  p.innerHTML=labelHTML(d);
  $("#rowCounter").textContent=rows.length?`${currentRow+1} / ${rows.length}`:"Ejemplo";
}
function labelHTML(d){
  const logo=imageSrc(d.logo)||commonLogo;
  const qr=imageSrc(d.qr);
  const logoEl=logo?`<img class="logo" src="${logo}">`:`<div class="logo fake-logo">${selectedTemplate.kind==="wide"?"ABYSM":"Oset"}</div>`;
  const info=`<div class="info"><div class="product">${esc(d.producto||"PRODUCTO")}</div><div class="line">${esc(d.color||"COLOR")}</div><div class="line">${esc(d.tamano||"TAMAÑO")}</div><div class="line">${esc(d.detalles||"DETALLES")}</div></div>`;
  if(selectedTemplate.kind==="square") return `<div class="label-content square-layout">${logoEl}${info}</div>`;
  if(selectedTemplate.kind==="qr") return `<div class="label-content">${qr?`<img class="qr" src="${qr}">`:`<div class="qr"></div>`}${logoEl}${info}</div>`;
  return `<div class="label-content logo-left">${logoEl}${info}</div>`;
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}

async function loadImage(src){
  if(!src)return null;
  return new Promise(resolve=>{const im=new Image();im.crossOrigin="anonymous";im.onload=()=>resolve(im);im.onerror=()=>resolve(null);im.src=src});
}
function safeFileName(s){
  return String(s||"Etiqueta").replace(/[<>:"/\\|?*\x00-\x1F]/g,"-").replace(/\s+/g," ").trim().replace(/\.+$/,"").slice(0,180)||"Etiqueta";
}
function fileNameFor(row,i){
  const d=rowData(row);
  const parts=[d.producto,d.color,d.tamano,d.detalles].filter(Boolean);
  return safeFileName(parts.join(" - ")||`Etiqueta ${String(i+1).padStart(3,"0")}`)+".pdf";
}
async function createPDF(row){
  const {jsPDF}=window.jspdf;
  const d=rowData(row), bleed=Number($("#bleed").value||0), scale=Number($("#scale").value||100)/100;
  const w=selectedTemplate.size[0]*scale,h=selectedTemplate.size[1]*scale;
  const doc=new jsPDF({unit:"mm",format:[w+bleed*2,h+bleed*2],orientation:w>=h?"landscape":"portrait"});
  const bg=$("#bgColor").value,text=$("#textColor").value;
  const rgbHex=x=>{x=x.replace("#","");return [parseInt(x.slice(0,2),16),parseInt(x.slice(2,4),16),parseInt(x.slice(4,6),16)]};
  const b=rgbHex(bg),tc=rgbHex(text);
  doc.setFillColor(...b);doc.rect(0,0,w+bleed*2,h+bleed*2,"F");
  const ox=bleed,oy=bleed;
  doc.setTextColor(...tc);
  const logo=await loadImage(imageSrc(d.logo)||commonLogo), qr=await loadImage(imageSrc(d.qr));
  const baseFont=Math.max(3.2,Math.min(7,h*.11));
  if(selectedTemplate.kind==="qr"){
    if(qr)doc.addImage(qr,"PNG",ox+w*.07,oy+h*.2,w*.30,w*.30);
    if(logo)doc.addImage(logo,"PNG",ox+w*.52,oy+h*.12,w*.36,h*.22);
    doc.setFont("helvetica","bold");doc.setFontSize(baseFont*1.2);doc.text(d.producto||"PRODUCTO",ox+w*.52,oy+h*.50,{maxWidth:w*.4});
    doc.setFont("helvetica","normal");doc.setFontSize(baseFont);doc.text([d.color,d.tamano,d.detalles].filter(Boolean).join("\n"),ox+w*.52,oy+h*.59,{maxWidth:w*.4});
  }else if(selectedTemplate.kind==="square"){
    if(logo)doc.addImage(logo,"PNG",ox+w*.20,oy+h*.13,w*.60,h*.25);
    doc.setFont("helvetica","bold");doc.setFontSize(baseFont*1.25);doc.text(d.producto||"PRODUCTO",ox+w/2,oy+h*.55,{align:"center",maxWidth:w*.8});
    doc.setFont("helvetica","normal");doc.setFontSize(baseFont);doc.text([d.color,d.tamano,d.detalles].filter(Boolean).join("\n"),ox+w/2,oy+h*.64,{align:"center",maxWidth:w*.8});
  }else{
    if(logo)doc.addImage(logo,"PNG",ox+w*.06,oy+h*.18,w*.36,h*.48);
    doc.setFont("helvetica","bold");doc.setFontSize(baseFont*1.15);doc.text(d.producto||"PRODUCTO",ox+w*.47,oy+h*.38,{maxWidth:w*.48});
    doc.setFont("helvetica","normal");doc.setFontSize(baseFont);doc.text([d.color,d.tamano,d.detalles].filter(Boolean).join("\n"),ox+w*.47,oy+h*.52,{maxWidth:w*.48});
  }
  return doc.output("arraybuffer");
}

async function generate(){
  if(!rows.length){toast("Primero sube un CSV");return}
  setStatus("Generando PDFs…");
  $("#generateBtn").disabled=true;
  try{
    if(targetDirectory && window.showDirectoryPicker){
      for(let i=0;i<rows.length;i++){
        const bytes=await createPDF(rows[i]);
        const fh=await targetDirectory.getFileHandle(fileNameFor(rows[i],i),{create:true});
        const writable=await fh.createWritable();await writable.write(bytes);await writable.close();
      }
      setStatus(`${rows.length} PDFs generados`);toast(`Listo: ${rows.length} PDFs en la carpeta elegida`);
    }else{
      const zip=new JSZip();
      for(let i=0;i<rows.length;i++)zip.file(fileNameFor(rows[i],i),await createPDF(rows[i]));
      const blob=await zip.generateAsync({type:"blob"});
      const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="etiquetas_generadas.zip";a.click();URL.revokeObjectURL(a.href);
      setStatus(`${rows.length} PDFs preparados`);toast("ZIP generado con todas las etiquetas");
    }
  }catch(e){console.error(e);toast("Ha ocurrido un error al generar")}
  finally{$("#generateBtn").disabled=false}
}
$("#generateBtn").onclick=generate;

$("#folderBtn").onclick=async()=>{
  if(!window.showDirectoryPicker){toast("Tu navegador no permite seleccionar carpeta. Se usará ZIP.");return}
  try{
    targetDirectory=await window.showDirectoryPicker({mode:"readwrite"});
    $("#destination").textContent="Destino: carpeta seleccionada";
    toast("Carpeta de destino seleccionada");
  }catch(e){}
};

renderHome();
