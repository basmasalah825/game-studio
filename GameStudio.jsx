
// GameStudio.jsx
import React, { useEffect, useState } from "react";

const uid = () => Math.random().toString(36).slice(2, 9);
const nowISO = () => new Date().toISOString();
const STORAGE_KEY = "game_studio_saved_games_v3";
const IMGLIB_KEY = "game_studio_image_library_v1";

// Minimal templates and UI text (English default, switchable in app)
const TEMPLATES = {
  Flashcards: { type: "flashcard", items: [{ id: uid(), front: "Book", back: "كتاب" }] },
  Matching: { type: "matching", items: [{ id: uid(), left: "Pen", right: "قلم" }] },
  MultipleChoice: { type: "mcq", items: [{ id: uid(), question: "What is 2+2?", choices: ["3","4","5"], answerIndex: 1 }] },
  Pairs: { type: "pairs", items: [ { id: uid(), content: "Cat", kind: "text", pairId: "p1" }, { id: uid(), content: "قطة", kind: "text", pairId: "p1" } ] }
};

const UI = {
  en: {
    new: "New",
    add: "+ Add",
    duplicate: "Duplicate",
    exportJSON: "Export JSON",
    downloadHTML: "Download HTML",
    getEmbed: "Get Embed",
    delete: "Delete",
    edit: "Edit",
    preview: "Preview",
    embed: "Embed",
    items: "Items",
    metadata: "Metadata & Actions",
    created: "Created",
    updated: "Updated",
    tip: "Tip: Download HTML to host or use the iframe embed.",
    language: "Language",
    uiLanguage: "Interface Language",
    arabic: "Arabic",
    english: "English",
    itemKind: "Item type",
    text: "Text",
    imageUrl: "Image URL",
    uploadNote: "(paste image URL or use library)",
    imageLibrary: "Image Library",
    uploadImage: "Upload Image",
    searchPlaceholder: "Search images...",
    choose: "Choose",
    close: "Close",
    uploadFromDevice: "Upload from device"
  },
  ar: {
    new: "جديد",
    add: "+ إضافة",
    duplicate: "نسخ",
    exportJSON: "تصدير JSON",
    downloadHTML: "تحميل HTML",
    getEmbed: "الحصول على كود",
    delete: "حذف",
    edit: "تعديل",
    preview: "معاينة",
    embed: "تضمين",
    items: "العناصر",
    metadata: "بيانات وإجراءات",
    created: "تاريخ الإنشاء",
    updated: "آخر تحديث",
    tip: "نصيحة: حمّل ملف HTML أو انسخ كود iframe.",
    language: "لغة اللعبة",
    uiLanguage: "لغة الواجهة",
    arabic: "العربية",
    english: "الإنجليزية",
    itemKind: "نوع العنصر",
    text: "نص",
    imageUrl: "رابط صورة",
    uploadNote: "(ألصق رابط أو استعمل المكتبة)",
    imageLibrary: "مكتبة الصور",
    uploadImage: "رفع صورة",
    searchPlaceholder: "ابحث في الصور...",
    choose: "اختر",
    close: "إغلاق",
    uploadFromDevice: "رفع من الجهاز"
  }
};

export default function GameStudio(){
  const [games, setGames] = useState([]);
  const [images, setImages] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [mode, setMode] = useState("edit");
  const [embedHtml, setEmbedHtml] = useState("");
  const [uiLang, setUiLang] = useState("en");
  const [showImageLibrary, setShowImageLibrary] = useState(false);
  const [imageSearch, setImageSearch] = useState("");
  const [imagePickerCallback, setImagePickerCallback] = useState(null);

  useEffect(()=> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try{ const p = JSON.parse(raw); setGames(p); if(p.length) setSelectedId(p[0].id); }catch(e){console.error(e)}
    } else {
      const starter = createNewFromTemplate("Flashcards"); setGames([starter]); setSelectedId(starter.id);
    }
    const rawImg = localStorage.getItem(IMGLIB_KEY); if(rawImg){ try{ setImages(JSON.parse(rawImg)); }catch(e){console.error(e)} }
  }, []);

  useEffect(()=> { localStorage.setItem(STORAGE_KEY, JSON.stringify(games)); }, [games]);
  useEffect(()=> { localStorage.setItem(IMGLIB_KEY, JSON.stringify(images)); }, [images]);

  function t(key){ return UI[uiLang][key] || UI['en'][key] || key; }

  function createNewFromTemplate(name){
    const tpl = TEMPLATES[name] || TEMPLATES.Flashcards;
    return { id: uid(), title: `${name} - ${new Date().toLocaleString()}`, type: tpl.type, language: 'en', uiLanguage:'en', data: JSON.parse(JSON.stringify(tpl.items)), createdAt: nowISO(), updatedAt: nowISO() };
  }

  function addNew(name){ const g = createNewFromTemplate(name); setGames(prev=>[g,...prev]); setSelectedId(g.id); setMode('edit'); }
  function duplicateGame(id){ const src = games.find(g=>g.id===id); if(!src) return; const copy = {...structuredClone(src), id: uid(), title: src.title + ' (copy)', createdAt: nowISO(), updatedAt: nowISO()}; setGames(prev=>[copy,...prev]); setSelectedId(copy.id); }
  function deleteGame(id){ if(!confirm(uiLang==='ar'?'حذف اللعبة؟':'Delete this game?')) return; setGames(prev=>prev.filter(g=>g.id!==id)); if(selectedId===id) setSelectedId(games.find(g=>g.id!==id)?.id ?? null); }
  function updateSelected(patch){ setGames(prev=>prev.map(g=> g.id===selectedId ? {...g, ...patch, updatedAt: nowISO()} : g)); }
  function updateItem(itemId, patch){ setGames(prev=>prev.map(g=>{ if(g.id!==selectedId) return g; return {...g, data: g.data.map(it=> it.id===itemId ? {...it, ...patch} : it), updatedAt: nowISO() }; })); }
  function addItem(){ setGames(prev=>prev.map(g=>{ if(g.id!==selectedId) return g; const newItem = { id: uid() }; if(g.type==='flashcard') Object.assign(newItem,{ front: 'Front', back: 'Back' }); else if(g.type==='matching') Object.assign(newItem,{ left: 'Left', right: 'Right' }); else if(g.type==='mcq') Object.assign(newItem,{ question: 'Question', choices: ['A','B','C'], answerIndex: 0 }); else if(g.type==='pairs') Object.assign(newItem,{ content: 'New', kind: 'text', pairId: 'p'+Math.random().toString(36).slice(2,6) }); return {...g, data: [...g.data, newItem], updatedAt: nowISO() }; })); }
  function removeItem(itemId){ setGames(prev=>prev.map(g=> g.id===selectedId ? {...g, data: g.data.filter(it=>it.id!==itemId), updatedAt: nowISO()} : g)); }

  // image library
  function uploadImageFile(file){ const reader = new FileReader(); reader.onload = (e)=>{ const base64 = e.target.result; const imgObj = { id: uid(), name: file.name, data: base64, createdAt: nowISO() }; setImages(prev => [imgObj, ...prev]); if(imagePickerCallback){ imagePickerCallback(imgObj); setImagePickerCallback(null); setShowImageLibrary(false); } }; reader.readAsDataURL(file); }
  function addImageByUrl(url, name){ const imgObj = { id: uid(), name: name || url, data: url, createdAt: nowISO() }; setImages(prev=>[imgObj,...prev]); if(imagePickerCallback){ imagePickerCallback(imgObj); setImagePickerCallback(null); setShowImageLibrary(false); } }
  function removeImage(id){ if(!confirm(uiLang==='ar'?'حذف الصورة؟':'Delete this image?')) return; setImages(prev=>prev.filter(i=>i.id!==id)); }
  function openImageLibraryForPicker(callback){ setImagePickerCallback(()=>callback); setShowImageLibrary(true); }

  function downloadJSON(game){ const blob = new Blob([JSON.stringify(game, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=(game.title||'game')+'.json'; a.click(); URL.revokeObjectURL(url); }

  function escapeHtml(s){ return (s||'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('\\\"','&quot;'); }

  function generateStandaloneHTML(game){
    const payload = JSON.stringify(game).replace(/</g,'\\\\u003c');
    const html = `<!doctype html>
<html dir="${game.language==='ar' ? 'rtl' : 'ltr'}">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${escapeHtml(game.title||'Game')}</title>
  <style>body{font-family:Inter,system-ui,Segoe UI,Roboto,Arial,sans-serif;padding:12px;} .card{border-radius:8px;padding:12px;border:1px solid #ddd;margin:8px;display:inline-block} .grid{display:flex;flex-wrap:wrap;gap:8px}</style>
</head>
<body>
  <div id="root"></div>
  <script>
    const GAME = ${payload};
    function createPlayer(game){
      const root = document.getElementById('root');
      const h1 = document.createElement('h1'); h1.textContent = game.title || 'Game'; root.appendChild(h1);
      if(game.type==='pairs'){
        const cards = game.data.map((it,i)=> ({...it, _id:i}));
        shuffle(cards);
        const container = document.createElement('div'); container.className='grid';
        let first=null, second=null;
        cards.forEach((c,idx)=>{
          const el = document.createElement('div'); el.className='card'; el.style.width='140px'; el.style.height='90px'; el.style.display='flex'; el.style.alignItems='center'; el.style.justifyContent='center'; el.style.cursor='pointer'; el.style.userSelect='none'; el.dataset.idx=idx;
          el.textContent='?';
          el.onclick = ()=>{
            if(el.dataset.matched) return;
            if(c.kind==='image'){
              el.innerHTML=''; const img=document.createElement('img'); img.src=c.content; img.style.maxWidth='120px'; img.style.maxHeight='80px'; el.appendChild(img);
            } else { el.textContent = c.content; }
            if(!first){ first={card:c,el}; } else if(!second && el!==first.el){ second={card:c,el};
              if(first.card.pairId === second.card.pairId){ first.el.style.visibility='hidden'; second.el.style.visibility='hidden'; first.el.dataset.matched=true; second.el.dataset.matched=true; first=null; second=null;
                if(Array.from(container.children).every(ch=>ch.style.visibility==='hidden')){ setTimeout(()=>alert(game.language==='ar'? 'مبروك!':'Well done!'),200); }
              } else {
                setTimeout(()=>{ first.el.textContent='?'; second.el.textContent='?'; first.el.innerHTML=''; second.el.innerHTML=''; first=null; second=null; }, 700);
              }
            }
          };
          container.appendChild(el);
        });
        root.appendChild(container);
        function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j = Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
      } else {
        const div=document.createElement('div'); div.textContent='No player for this type in standalone export.'; root.appendChild(div);
      }
    }
    createPlayer(GAME);
  </script>
</body>
</html>`;
    return html;
  }

  function downloadStandalone(game){ const html = generateStandaloneHTML(game); const blob = new Blob([html], { type: 'text/html' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href=url; a.download=(game.title||'game')+'.html'; a.click(); URL.revokeObjectURL(url); }
  function showEmbed(game){ const html = generateStandaloneHTML(game); const dataUri = 'data:text/html;base64,' + btoa(unescape(encodeURIComponent(html))); const iframe = `<iframe src=\"${dataUri}\" width=\"800\" height=\"600\" style=\"border:1px solid #ccc\"></iframe>`; setEmbedHtml(iframe); setMode('embed'); }

  const selected = games.find(g=>g.id===selectedId);
  const dir = selected?.language==='ar' ? 'rtl' : 'ltr';

  return (
    <div style={{padding:16}}>
      <h2>Basma Games — Game Studio</h2>
      <div style={{display:'flex',gap:12}}>
        <aside style={{width:300,background:'#fff',padding:12,borderRadius:8}}>
          <div style={{display:'flex',gap:8,marginBottom:8}}>
            <select id="tpl" style={{flex:1,padding:8}}>
              {Object.keys(TEMPLATES).map(t=> <option key={t} value={t}>{t}</option>)}
            </select>
            <button onClick={()=>addNew(document.getElementById('tpl').value)}>{t('new')}</button>
          </div>
          <div style={{marginTop:8}}>
            <label>{t('uiLanguage')}:</label>
            <select value={uiLang} onChange={(e)=>setUiLang(e.target.value)} style={{marginLeft:8}}>
              <option value="en">English</option>
              <option value="ar">العربية</option>
            </select>
          </div>
          <div style={{marginTop:12}}>
            <button style={{width:'100%'}} onClick={()=>setShowImageLibrary(true)}>{t('imageLibrary')}</button>
          </div>
          <div style={{marginTop:12}}>
            {games.map(g=>(
              <div key={g.id} style={{border:'1px solid #eee',padding:8,borderRadius:6,marginBottom:8,cursor:'pointer'}} onClick={()=>setSelectedId(g.id)}>
                <div style={{fontWeight:600}}>{g.title}</div>
                <div style={{fontSize:12,color:'#666'}}>{g.type} • {new Date(g.updatedAt).toLocaleString()}</div>
              </div>
            ))}
          </div>
        </aside>
        <main style={{flex:1,background:'#fff',padding:12,borderRadius:8}}>
          {!selected && <div>{uiLang==='ar' ? 'اختر لعبة' : 'Choose or create a game to start editing.'}</div>}
          {selected && <>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
              <div>
                <input value={selected.title} onChange={(e)=>updateSelected({ title: e.target.value })} style={{fontSize:18,padding:6}} />
                <select value={selected.type} onChange={(e)=>updateSelected({ type: e.target.value, data: [] })} style={{marginLeft:8}}>
                  <option value="flashcard">Flashcard</option>
                  <option value="matching">Matching</option>
                  <option value="mcq">Multiple Choice</option>
                  <option value="pairs">Match in Pairs</option>
                </select>
                <select value={selected.language} onChange={(e)=>updateSelected({ language: e.target.value })} style={{marginLeft:8}}>
                  <option value="en">English</option>
                  <option value="ar">العربية</option>
                </select>
              </div>
              <div>
                <button onClick={()=>setMode('edit')}>{t('edit')}</button>
                <button onClick={()=>setMode('preview')}>{t('preview')}</button>
                <button onClick={()=>setMode('embed')}>{t('embed')}</button>
              </div>
            </div>
            {mode==='edit' && (<div style={{display:'flex',gap:12}}>
              <div style={{flex:1}}>
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                  <h3>{t('items')}</h3>
                  <button onClick={addItem}>{t('add')}</button>
                </div>
                <div>
                  {selected.data.map(it=>(
                    <div key={it.id} style={{border:'1px solid #eee',padding:8,borderRadius:6,marginBottom:8}}>
                      {selected.type==='pairs' ? (
                        <>
                          <div style={{marginBottom:6}}>
                            <select value={it.kind||'text'} onChange={(e)=>updateItem(it.id,{ kind: e.target.value })}>
                              <option value="text">{t('text')}</option>
                              <option value="image">{t('imageUrl')}</option>
                            </select>
                            <input value={it.content} onChange={(e)=>updateItem(it.id,{ content: e.target.value })} style={{marginLeft:8}} />
                            <button style={{marginLeft:8}} onClick={()=>openImageLibraryForPicker((img)=> updateItem(it.id,{ content: img.data, kind: 'image' }))}>{t('imageLibrary')}</button>
                          </div>
                          <div>Pair ID: <input value={it.pairId} onChange={(e)=>updateItem(it.id,{ pairId: e.target.value })} /></div>
                        </>
                      ) : <div>Item editor</div>}
                      <div style={{marginTop:6}}><button onClick={()=>removeItem(it.id)} style={{color:'red'}}>{t('delete')}</button></div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{width:300}}>
                <h4>{t('metadata')}</h4>
                <div style={{fontSize:12,color:'#666'}}>{t('created')}: {selected.createdAt}</div>
                <div style={{fontSize:12,color:'#666'}}>{t('updated')}: {selected.updatedAt}</div>
                <div style={{marginTop:12}}>
                  <button onClick={()=>downloadJSON(selected)}>{t('exportJSON')}</button>
                  <button onClick={()=>downloadStandalone(selected)} style={{marginLeft:8}}>{t('downloadHTML')}</button>
                </div>
              </div>
            </div>)}
            {mode==='preview' && (<div><h3>{t('preview')}</h3>{selected.type==='pairs' ? <PairsPreview items={selected.data} language={selected.language} /> : <div>Preview not available for this type.</div>}</div>)}
            {mode==='embed' && (<div><h3>{t('embed')}</h3><textarea readOnly rows={6} style={{width:'100%'}} value={embedHtml}></textarea></div>)}
          </>}
        </main>
      </div>

      {showImageLibrary && (<div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',display:'flex',alignItems:'center',justifyContent:'center'}} onClick={()=>{ setShowImageLibrary(false); setImagePickerCallback(null); }}>
        <div style={{width:'90%',maxWidth:900,background:'#fff',padding:16,borderRadius:8}} onClick={(e)=>e.stopPropagation()}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}><h3>{t('imageLibrary')}</h3><button onClick={()=>{ setShowImageLibrary(false); setImagePickerCallback(null); }}>{t('close')}</button></div>
          <div style={{display:'flex',gap:8,marginTop:8,marginBottom:12}}>
            <input placeholder={t('searchPlaceholder')} value={imageSearch} onChange={(e)=>setImageSearch(e.target.value)} style={{flex:1,padding:8}} />
            <label style={{padding:8,border:'1px solid #eee',borderRadius:6,cursor:'pointer'}}>{t('uploadFromDevice')}<input type="file" accept="image/*" style={{display:'none'}} onChange={(e)=>{ const f = e.target.files?.[0]; if(f) uploadImageFile(f); }} /></label>
            <input id="manualImageUrl" placeholder="Image URL (optional)" style={{padding:8}} />
            <button onClick={()=>{ const url = document.getElementById('manualImageUrl').value; if(url) addImageByUrl(url); }}>{t('uploadImage')}</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>
            {images.filter(img=> img.name.toLowerCase().includes(imageSearch.toLowerCase())).map(img=>(
              <div key={img.id} style={{border:'1px solid #eee',padding:8,borderRadius:6}}>
                <img src={img.data} alt={img.name} style={{width:'100%',height:120,objectFit:'cover'}} />
                <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:8}}>
                  <div style={{fontSize:12,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{img.name}</div>
                  <div><button onClick={()=>{ if(imagePickerCallback){ imagePickerCallback(img); setImagePickerCallback(null); setShowImageLibrary(false); } }}>{t('choose')}</button><button onClick={()=>removeImage(img.id)} style={{marginLeft:6,color:'red'}}>{t('delete')}</button></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>)}

    </div>
  );
}

// Small preview components
function PairsPreview({ items, language }){
  const [shuffled, setShuffled] = useState([]);
  const [first, setFirst] = useState(null);
  const [second, setSecond] = useState(null);
  useEffect(()=>{ const arr = items.map((it,i)=> ({...it,_idx:i})); shuffle(arr); setShuffled(arr); setFirst(null); setSecond(null); }, [items]);
  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } }
  function onClickCard(card, idx){
    if(card._matched) return;
    if(first && second) return;
    if(!first){ setShuffled(s=> s.map((c,i)=> i===idx? {...c,_flipped:true}: c)); setFirst({card,idx}); } else if(!second && idx!==first.idx){ setShuffled(s=> s.map((c,i)=> i===idx? {...c,_flipped:true}: c)); setSecond({card,idx});
      if(first.card.pairId === card.pairId){
        setTimeout(()=>{ setShuffled(s=> s.map((c,i)=> (i===first.idx||i===idx)? {...c,_matched:true}: c)); setFirst(null); setSecond(null); if(shuffled.filter(c=>!c._matched).length<=2){ setTimeout(()=>alert(language==='ar'?'مبروك!':'Well done!'),200); } },300);
      } else {
        setTimeout(()=>{ setShuffled(s=> s.map((c,i)=> i===first.idx||i===idx? {...c,_flipped:false}: c)); setFirst(null); setSecond(null); },700);
      }
  } }
  return (<div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12}}>{shuffled.map((c,idx)=>(<div key={c.id+\"-\"+idx} onClick={()=>onClickCard(c,idx)} style={{border:'1px solid #eee',padding:8,borderRadius:6,height:100,display:'flex',alignItems:'center',justifyContent:'center',cursor:c._matched?'default':'pointer',opacity:c._matched?0.15:1}}>{c._flipped||c._matched ? (c.kind==='image'? <img src={c.content} alt=\"img\" style={{maxWidth:120,maxHeight:80}} /> : <div>{c.content}</div>) : <div style={{fontSize:24}}>?</div>}</div>))}</div>);
}
