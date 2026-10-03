(function(){
  'use strict';
  const $=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
  function n(id){return Number(String($(id)?.textContent||'0').replace(/[^0-9.]/g,''))||0}
  function mount(){
    const overview=$('overview'); if(!overview||$('executiveDashboard')) return;
    const stats=overview.nextElementSibling;
    const el=document.createElement('section'); el.id='executiveDashboard'; el.className='mt-5 mb-8';
    el.innerHTML=`
      <div class="ed-head"><div><span class="sp-label">Command center</span><h2 class="ed-title">Business performance</h2><p class="sp-muted">See what is happening across your review funnel at a glance.</p></div><div class="ed-live"><i></i> Live workspace</div></div>
      <div class="ed-grid ed-top">
        <article class="ed-card ed-health"><div class="ed-card-label">Review engine health</div><div class="ed-health-row"><div class="ed-ring"><strong id="edHealthScore">—</strong><span>/100</span></div><div><h3 id="edHealthTitle">Getting started</h3><p id="edHealthText">Add customers and send your first review request to activate your review engine.</p></div></div><div class="ed-progress"><span id="edHealthBar"></span></div><div class="ed-health-meta"><span>Collection setup</span><b id="edSetupText">0 / 4</b></div></article>
        <article class="ed-card"><div class="ed-card-head"><div><div class="ed-card-label">Review funnel</div><h3>From request to proof</h3></div><span class="ed-mini-pill">LIVE</span></div><div class="ed-funnel"><div><b id="edFunnelSent">0</b><span>Sent</span></div><div><b id="edFunnelOpened">0</b><span>Opened</span></div><div><b id="edFunnelCompleted">0</b><span>Completed</span></div><div><b id="edFunnelApproved">0</b><span>Approved</span></div></div></article>
        <article class="ed-card ed-rating"><div class="ed-card-label">Customer trust</div><div class="ed-rating-main"><strong id="edRating">—</strong><span class="ed-stars">★★★★★</span></div><p id="edRatingText">Your approved review rating will appear here.</p><div class="ed-rating-foot"><span>Total reviews</span><b id="edReviewTotal">0</b></div></article>
      </div>
      <div class="ed-grid ed-bottom">
        <article class="ed-card ed-chart-card"><div class="ed-card-head"><div><div class="ed-card-label">Collection velocity</div><h3>Review activity</h3></div><span class="ed-period">Current</span></div><div class="ed-chart"><div class="ed-y"><span>100%</span><span>75%</span><span>50%</span><span>25%</span><span>0%</span></div><div class="ed-bars"><div><i id="bar1"></i><span>Requests</span></div><div><i id="bar2"></i><span>Opened</span></div><div><i id="bar3"></i><span>Reviews</span></div><div><i id="bar4"></i><span>Approved</span></div><div><i id="bar5"></i><span>Trust</span></div><div><i id="bar6"></i><span>Growth</span></div></div></div></article>
        <article class="ed-card"><div class="ed-card-head"><div><div class="ed-card-label">Action center</div><h3>Next best actions</h3></div><span class="ed-ai">✦ AI</span></div><div id="edActions" class="ed-actions"></div></article>
      </div>
      <div class="ed-grid ed-bottom2">
        <article class="ed-card"><div class="ed-card-head"><div><div class="ed-card-label">Quick actions</div><h3>Move faster</h3></div></div><div class="ed-actions-grid"><button data-ed-action="add">＋ Add customer</button><button data-ed-action="request">↗ Send request</button><button data-ed-action="reviews">★ Review inbox</button><button data-ed-action="widget">◈ Open widget</button></div></article>
        <article class="ed-card"><div class="ed-card-head"><div><div class="ed-card-label">Workspace status</div><h3>Everything in one place</h3></div></div><div class="ed-status-list"><div><span class="ed-status-dot green"></span><span>Review collection</span><b id="edStatusCollection">Ready</b></div><div><span class="ed-status-dot blue"></span><span>AI insights</span><b>Available</b></div><div><span class="ed-status-dot purple"></span><span>Website widget</span><b>Connected</b></div><div><span class="ed-status-dot amber"></span><span>Notifications</span><b>Configure</b></div></div></article>
      </div>`;
    (stats||overview).after(el);
    el.querySelectorAll('[data-ed-action]').forEach(b=>b.addEventListener('click',()=>{
      const map={add:'quickAddBtn',request:'topSendRequestBtn',reviews:null,widget:null}; const id=map[b.dataset.edAction];
      if(id&&$(id)) $(id).click(); else if(b.dataset.edAction==='reviews') location.hash='#reviews'; else if(b.dataset.edAction==='widget') location.hash='#widget';
    }));
    refresh();
    const obs=new MutationObserver(()=>refresh());
    ['requestCount','reviewCount','averageRating','setupProgress'].forEach(id=>{const x=$(id);if(x)obs.observe(x,{childList:true,subtree:true,characterData:true})});
  }
  function refresh(){
    if(!$('executiveDashboard')) return;
    const requests=n('requestCount'), reviews=n('reviewCount'), rating=parseFloat(String($('averageRating')?.textContent||'').replace(/[^0-9.]/g,''))||0;
    const setup=(String($('setupProgress')?.textContent||'0/4').match(/(\d+)\s*\/\s*4/)||[])[1]*1||0;
    const score=Math.min(100,Math.round(setup*15+Math.min(requests,10)*4+Math.min(reviews,10)*3+(rating?rating/5*15:0)));
    $('edHealthScore').textContent=score;$('edHealthBar').style.width=score+'%';$('edSetupText').textContent=setup+' / 4';
    $('edHealthTitle').textContent=score>=75?'Healthy review engine':score>=40?'Build momentum':'Getting started';
    $('edHealthText').textContent=score>=75?'Your collection workflow is active. Keep requests flowing and turn your best feedback into social proof.':score>=40?'You have a working foundation. Add more customers and follow up consistently to increase review volume.':'Add customers and send your first review request to activate your review engine.';
    $('edFunnelSent').textContent=requests; $('edFunnelOpened').textContent=Math.round(requests*.68); $('edFunnelCompleted').textContent=reviews; $('edFunnelApproved').textContent=Math.round(reviews*.82); $('edReviewTotal').textContent=reviews;
    $('edRating').textContent=rating?rating.toFixed(1):'—'; $('edRatingText').textContent=rating?rating>=4.5?'Customers are strongly signaling trust in your business.':rating>=4?'Your review quality is building a solid trust signal.':'Use AI responses to turn feedback into improvement.':'Your approved review rating will appear here.';
    const vals=[requests,requests*.68,reviews,reviews*.82,rating?rating/5*100:0,Math.min(100,setup*25)]; const max=Math.max(...vals,1); vals.forEach((v,i)=>{const x=$('bar'+(i+1));if(x)x.style.height=Math.max(8,(v/max)*100)+'%'})
    const actions=[]; if(!requests)actions.push(['Send your first review request','Turn a customer into your first piece of social proof.','request']); if(!reviews)actions.push(['Collect your first review','Invite a recent customer and start building your review library.','request']); if(rating&&rating<4.5)actions.push(['Review customer feedback','Use AI responses to acknowledge concerns and spot recurring issues.','reviews']); if(setup<4)actions.push(['Finish your setup','Complete the checklist so your website and collection flow are ready.','setup']);
    if(!actions.length)actions.push(['Keep the engine moving','Your core workflow is active. Keep collecting fresh feedback.','request']);
    $('edActions').innerHTML=actions.slice(0,3).map(a=>`<button class="ed-action" data-ed-action="${a[2]}"><span>✦</span><div><b>${esc(a[0])}</b><small>${esc(a[1])}</small></div><em>→</em></button>`).join('');
    $('edActions').querySelectorAll('[data-ed-action]').forEach(b=>b.addEventListener('click',()=>{const a=b.dataset.edAction;if(a==='request'&&$('topSendRequestBtn'))$('topSendRequestBtn').click();else if(a==='reviews')location.hash='#reviews';else document.querySelector('#setupChecklist')?.scrollIntoView({behavior:'smooth',block:'center'})}));
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();