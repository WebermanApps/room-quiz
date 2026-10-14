/* MWMid: Submit-anytime for Construction decks (Oct 14 2026), modeled on this-or-that-home's mid-deck Submit.
   MWMid({app,near:()=>el (optional: sit inline before this element instead of fixed top-right),deck,agent,answered:()=>[ids],total:()=>n,results:(ids)=>obj,notes:(ids)=>str,hide:(ids,fresh)=>void,
          open:()=>[ids still unanswered, skips included] (optional),skipped:()=>[ids] (optional),afterSend:(ids,skipped)=>void (optional)}
   fresh=false on page load (indexes already relative), true right after a Submit.
   R64: a Skip is not an answer. Skipped cards are never hidden; they are sent in results.skipped (and unanswered) so the agent can reword them, then come back.
   Sends answers so far through MWSubmit.send (submit.js). Sent ids are remembered in localStorage
   ('mw-mid-sent-'+app) and handed to hide() so only unanswered questions remain. Deck state itself is kept. */
(function(w){
  var DECKS='https://webermanapps.github.io/branding-djqmb410/decks/';
  var CSS='.mwm-btn{position:fixed;z-index:9000;top:calc(8px + env(safe-area-inset-top,0px));right:calc(8px + env(safe-area-inset-right,0px));display:inline-flex;align-items:center;gap:6px;min-height:44px;padding:0 14px;background:#0B6E4F;color:#fff;border:2px solid #0B6E4F;border-radius:0;font:700 14px/1 Khand,Hind,system-ui,sans-serif;letter-spacing:.08em;text-transform:uppercase;cursor:pointer;touch-action:manipulation;box-shadow:0 4px 14px rgba(10,10,10,.14)}'+
  '.mwm-btn.mwm-inline{position:static;box-shadow:none;margin:0 8px 0 auto;flex:none}.mwm-btn[disabled]{opacity:.7;cursor:default}.mwm-btn small{font:600 12px/1 Hind,system-ui,sans-serif;letter-spacing:0;opacity:.9}'+
  '@media(min-width:1800px){.mwm-btn{min-height:56px;font-size:18px;padding:0 20px;top:16px;right:16px}.mwm-btn.mwm-inline{min-height:48px}}'+
  '.mwm-bg{position:fixed;inset:0;z-index:9500;background:rgba(10,10,10,.45);display:flex;align-items:center;justify-content:center;padding:16px;box-sizing:border-box}'+
  '.mwm-card{background:#fff;color:#0a0a0a;width:100%;max-width:380px;box-sizing:border-box;padding:24px 20px 20px;border:1px solid #e5e5e5;box-shadow:0 12px 40px rgba(10,10,10,.18);font-family:Hind,system-ui,sans-serif;text-align:center}'+
  '.mwm-card h2{margin:10px 0 6px;font:700 1.6rem/1.1 Khand,Hind,system-ui,sans-serif;letter-spacing:.03em}.mwm-card p{margin:0 0 6px;color:#525252;font-size:15px;line-height:1.4}'+
  '.mwm-card .mwm-row{display:flex;flex-direction:column;gap:8px;margin-top:16px}'+
  '.mwm-card a,.mwm-card button{display:flex;align-items:center;justify-content:center;gap:8px;min-height:52px;box-sizing:border-box;border:2px solid #171717;border-radius:0;font:700 15px/1 Khand,Hind,system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;cursor:pointer}'+
  '.mwm-keep{background:#171717;color:#fafafa}.mwm-card .mw-backdecks{background:#0B6E4F;color:#fff;border-color:#0B6E4F;min-height:56px;font-size:16px}'+
  '.mwm-toast{position:fixed;left:50%;top:18%;transform:translateX(-50%);z-index:9600;background:#fff;color:#0B6E4F;border:2px solid #0B6E4F;padding:10px 18px;font:700 16px/1.2 Khand,Hind,system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;box-shadow:0 8px 24px rgba(10,10,10,.15);pointer-events:none}';
  var CHECK='<svg width="56" height="56" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="28" fill="none" stroke="#0B6E4F" stroke-width="4"/><path d="M19 33 L28 42 L46 23" fill="none" stroke="#0B6E4F" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  var SEND='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true"><path d="M4 12l16-8-6 16-3-7z"/></svg>';
  var BACK='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M19 12H5M11 6l-6 6 6 6"/></svg>';
  function isTest(){return /[?&](?:mwtest|test)=1\b/.test(location.search);}
  function key(app){return 'mw-mid-sent-'+app;}
  function sent(app){try{return JSON.parse(localStorage.getItem(key(app))||'[]')}catch(_){return[]}}
  function toast(t){var d=document.createElement('div');d.className='mwm-toast';d.setAttribute('role','status');d.textContent=t;document.body.appendChild(d);setTimeout(function(){d.remove()},2200);}
  function strip(o){return JSON.parse(JSON.stringify(o==null?null:o,function(k,v){return (typeof v==='string'&&v.slice(0,5)==='data:')?'[image not sent]':v;}));}
  function confirmBox(n,ok,left){var bg=document.createElement('div');bg.className='mwm-bg';bg.setAttribute('role','dialog');bg.setAttribute('aria-modal','true');bg.setAttribute('aria-labelledby','mwm-t');
    bg.innerHTML='<div class="mwm-card">'+CHECK+'<h2 id="mwm-t">'+(ok?'Answers Sent':'Saved, Will Send')+'</h2><p>'+n+' answer'+(n===1?'':'s')+(ok?' sent to the Construction agent.':' saved on this device; it sends when you are back online.')+'</p><p>'+(left?left+' question'+(left===1?'':'s')+' still open. Answered ones are hidden now.':'Nothing left to answer.')+'</p>'+
      '<div class="mwm-row">'+(left?'<button type="button" class="mwm-keep mw-hover">Keep Going</button>':'')+'<a class="mw-backdecks mw-hover" href="'+DECKS+'">'+BACK+'<span>Back to Deck Building</span></a></div></div>';
    document.body.appendChild(bg);var k=bg.querySelector('.mwm-keep');if(k){k.onclick=function(){bg.remove()};setTimeout(function(){k.focus()},30);}
    bg.addEventListener('keydown',function(e){if(e.key==='Escape')bg.remove()});}
  w.MWMid=function(c){
    var agent=c.agent||'construction';
    if(!document.getElementById('mwm-css')){var s=document.createElement('style');s.id='mwm-css';s.textContent=CSS;document.head.appendChild(s);}
    var done=sent(c.app).map(String);if(done.length){try{c.hide(done,false)}catch(e){}}
    var b=document.createElement('button');b.type='button';b.className='mwm-btn mw-hover';b.id='mwMidSubmit';b.title='Submit answers so far';b.setAttribute('aria-label','Submit answers so far');b.innerHTML=SEND+'<span>Submit</span>';
    function place(){var near=c.near&&c.near();if(near&&near.parentNode&&near.parentNode!==document.body){b.classList.add('mwm-inline');if(near.previousSibling!==b)near.parentNode.insertBefore(b,near);}else{b.classList.remove('mwm-inline');if(b.parentNode!==document.body)document.body.appendChild(b);}}
    place();if(c.near){w.addEventListener('load',place);setTimeout(place,300);setTimeout(place,1200);}
    b.addEventListener('click',function(){
      if(b.disabled||!w.MWSubmit)return;
      b.disabled=true;var prev=sent(c.app),ids;
      Promise.resolve().then(function(){return c.answered()}).then(function(a){
      ids=(a||[]).map(String).filter(function(i){return prev.indexOf(i)<0});
      if(!ids.length){b.disabled=false;toast('Answer a question first');return;}
      return Promise.resolve().then(function(){return c.results(ids)}).then(function(r){return r},function(e){return {error:'could not read results: '+e.message}}).then(function(r){
      var total=c.total(),results=strip(r),notes='';
      try{notes=c.notes(ids)||''}catch(e){}
      var answered=prev.length+ids.length,open=Math.max(0,total-answered),t=isTest(),un,sk=[];
      try{un=c.open?(c.open()||[]).map(String).filter(function(i){return ids.indexOf(i)<0&&prev.indexOf(i)<0}):undefined}catch(e){}
      try{sk=c.skipped?(c.skipped()||[]).map(String):[]}catch(e){}
      if(un)open=un.length;
      if(results&&typeof results==='object'){results.partial=open>0;results.answered=answered;results.total=total;results.sentNow=ids;results.sentBefore=prev;if(un)results.unanswered=un;results.skipped=sk;if(t){results.test=true;results.label='TEST';}}
      if(t)notes=('TEST submit from Construction agent, please ignore. '+notes).trim();
      try{localStorage.setItem('mw-submit-backup-'+c.app,JSON.stringify({savedAt:new Date().toISOString(),app:c.app,deck:c.deck,results:results,notes:notes}))}catch(e){}
      w.MWSubmit.send({agent:agent,app:c.app,deck:c.deck,results:results,notes:notes,partial:open>0,answered:answered,total:total,unanswered:un,test:t||undefined}).then(function(ok){
        b.disabled=false;
        if(!ok&&w.MWSubmit.blocked){toast('Password needed. Nothing was sent.');return;}
        var all=prev.concat(ids);try{localStorage.setItem(key(c.app),JSON.stringify(all))}catch(e){}
        try{if(c.afterSend)c.afterSend(ids,sk)}catch(e){}
        try{c.hide(ids,true)}catch(e){}
        confirmBox(ids.length,ok,open);
      });});}).catch(function(e){b.disabled=false;toast('Not sent: '+e.message);});
    });
    return {sent:function(){return sent(c.app)}};
  };
})(window);
