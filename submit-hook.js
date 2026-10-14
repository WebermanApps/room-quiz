/* Construction Submit hook: shows the shared MWSubmit button on an app's end screen.
   MWHook({app,deck,isEnd:()=>bool,mount:()=>el,before:()=>el|null,results:()=>obj,notes:()=>str,intro:str})
   No token here; MWSubmit posts to the shared receiver. ?mwtest=1 labels a submission TEST. */
(function(w){
  var CSS='.mws-sec{margin:24px 0;padding:18px 16px;border:1px solid #e5e5e5;background:#fff;color:#0a0a0a;box-sizing:border-box;max-width:100%}'+
  '.mws-sec h2{margin:0 0 6px;font-family:Khand,Hind,system-ui,sans-serif;font-weight:700;font-size:1.4rem;letter-spacing:.04em}'+
  '.mws-sec p{margin:0 0 4px;font-family:Hind,system-ui,sans-serif;font-size:.95rem;color:#525252;line-height:1.4}'+
  '.mws-sec .mws-wrap{max-width:none}.mws-sec .mws-btn{width:100%;box-sizing:border-box}.mw-backdecks{display:flex;align-items:center;justify-content:center;gap:10px;min-height:52px;margin:14px 0 8px;padding:0 18px;background:#0B6E4F;color:#fff;border:2px solid #0B6E4F;border-radius:0;text-decoration:none;font:700 18px/1 Khand,Hind,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase}.mw-backdecks:hover{background:#fff;color:#0B6E4F}';
  function strip(o){return JSON.parse(JSON.stringify(o==null?null:o,function(k,v){return (typeof v==='string'&&v.slice(0,5)==='data:')?'[image not sent]':v;}));}
  w.MWHook=function(c){
    var test=/[?&]mwtest=1\b/.test(location.search);
    if(!document.getElementById('mws-sec-css')){var s=document.createElement('style');s.id='mws-sec-css';s.textContent=CSS;document.head.appendChild(s);}
    function payloadResults(){var r;try{r=strip(c.results());}catch(e){r={error:'could not read results: '+e.message};}
      return test?{test:true,label:'TEST',results:r}:r;}
    function payloadNotes(){var n='';try{n=(c.notes&&c.notes())||'';}catch(e){}
      return test?('TEST submit from Construction agent, please ignore. '+n).trim():n;}
    function backup(){try{localStorage.setItem('mw-submit-backup-'+c.app,JSON.stringify({savedAt:new Date().toISOString(),app:c.app,deck:c.deck,results:payloadResults(),notes:payloadNotes()}));}catch(e){}}
    function tick(){
      var box=document.getElementById('mwSubmit');var end=false;try{end=c.isEnd();}catch(e){}
      if(!end){if(box)box.remove();return;}
      if(box)return;
      var host=c.mount&&c.mount();if(!host)return;
      box=document.createElement('section');box.id='mwSubmit';box.className='mws-sec';
      box.innerHTML='<h2>Send to Max</h2><p>'+(c.intro||'Tap Submit to send your answers and notes straight to Max.')+'</p><p>A copy is also kept on this device.</p>';
      var bf=c.before&&c.before();if(bf&&bf.parentNode===host)host.insertBefore(box,bf);else host.appendChild(box);
      box.addEventListener('click',function(e){if(e.target.closest('.mws-btn'))backup();},true);
      w.MWSubmit.button(box,{agent:'construction',app:c.app,deck:c.deck,getResults:payloadResults,getNotes:payloadNotes});
      if(!box.querySelector('.mw-backdecks')){var a=document.createElement('a');a.className='mw-backdecks mw-hover';a.href='https://webermanapps.github.io/branding-djqmb410/decks/';a.innerHTML='<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg><span>Back to Deck Building</span>';box.appendChild(a);}
      if(c.onMount)c.onMount();
    }
    function start(){new MutationObserver(tick).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['style','class','hidden']});tick();}
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  };
})(window);
