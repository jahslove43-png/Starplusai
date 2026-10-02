(function(){
  const SUPABASE_URL='https://rxebfyhoojuyasddkqyr.supabase.co';
  const FUNCTION_URL=SUPABASE_URL+'/functions/v1/starplusai-agent';
  if(document.getElementById('starplusai-agent')) return;
  const root=document.createElement('div');
  root.id='starplusai-agent';
  root.innerHTML=''
    +'<button class="spai-chat-button" id="spaiChatButton" aria-label="Open StarPlusAI AI assistant">✦ <span>Ask StarPlusAI</span></button>'
    +'<section class="spai-chat-panel" id="spaiChatPanel" hidden aria-label="StarPlusAI AI assistant">'
    +'<header class="spai-chat-header"><div><strong>StarPlusAI Assistant</strong><small>Ask me about reviews, features, pricing or getting started.</small></div><button id="spaiClose" aria-label="Close chat">×</button></header>'
    +'<div class="spai-chat-messages" id="spaiMessages"><div class="spai-msg spai-bot">Hi! I’m the StarPlusAI Assistant. How can I help you?</div></div>'
    +'<form class="spai-chat-form" id="spaiForm"><input id="spaiInput" maxlength="1000" autocomplete="off" placeholder="Ask a question…" aria-label="Your question" required><button type="submit" aria-label="Send message">➤</button></form>'
    +'<div class="spai-chat-note">AI answers can be imperfect. For account-specific help, log in to your dashboard.</div>'
    +'</section>';
  document.body.appendChild(root);
  const panel=document.getElementById('spaiChatPanel'), messages=document.getElementById('spaiMessages'), input=document.getElementById('spaiInput');
  const history=[];
  function add(text,role){const el=document.createElement('div');el.className='spai-msg '+(role==='user'?'spai-user':'spai-bot');el.textContent=text;messages.appendChild(el);messages.scrollTop=messages.scrollHeight;return el;}
  document.getElementById('spaiChatButton').onclick=()=>{panel.hidden=false;input.focus();};
  document.getElementById('spaiClose').onclick=()=>{panel.hidden=true;};
  document.getElementById('spaiForm').onsubmit=async(e)=>{
    e.preventDefault(); const text=input.value.trim(); if(!text)return; input.value=''; add(text,'user'); history.push({role:'user',content:text});
    const pending=add('Thinking…','bot');
    const btn=e.currentTarget.querySelector('button'); btn.disabled=true; input.disabled=true;
    try{const res=await fetch(FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-10)})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'The assistant is temporarily unavailable.'); pending.textContent=data.reply||'I could not generate a response.'; history.push({role:'assistant',content:pending.textContent});}
    catch(err){pending.textContent=err.message||'The assistant is temporarily unavailable. Please try again.';}
    finally{btn.disabled=false;input.disabled=false;input.focus();}
  };

  // Dashboard production enhancements. These run only where the dashboard elements exist.
  if(!window.supabase || !document.getElementById('dashboardView')) return;
  const db=window.supabase.createClient(SUPABASE_URL,'sb_publishable_LUBsZv3T2XUey0jZ5BI4vw_6shsxEfg');
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let settings={};

  async function loadServerSettings(){
    if(!window.currentUser?.id) return;
    const {data,error}=await db.from('business_settings').select('*').eq('business_id',window.currentUser.id).maybeSingle();
    if(error)return;
    settings=data||{business_id:window.currentUser.id};
    if($('notifyNewReview'))$('notifyNewReview').checked=settings.notify_new_review!==false;
    if($('notifyNegative'))$('notifyNegative').checked=settings.notify_negative_review!==false;
    if($('notifyApproved'))$('notifyApproved').checked=settings.notify_approved_review!==false;
    if($('followupToggle'))$('followupToggle').checked=!!settings.followup_enabled;
    if($('widgetLayout'))$('widgetLayout').value=settings.widget_layout||'grid';
    if($('widgetColor'))$('widgetColor').value=settings.widget_color||'#4f46e5';
    if($('widgetDark'))$('widgetDark').checked=!!settings.widget_dark;
    if($('widgetRadius'))$('widgetRadius').value=String(settings.widget_radius||18);
    if($('widgetAiSummary'))$('widgetAiSummary').checked=settings.widget_ai_summary!==false;
    if($('widgetSummary'))$('widgetSummary').value=settings.widget_summary||'';
    if(typeof window.updateWidgetPreview==='function')window.updateWidgetPreview($('previewBusiness')?.textContent||'Customer reviews');
  }
  async function saveServerSettings(patch){
    if(!window.currentUser?.id)return;
    settings={...settings,...patch,business_id:window.currentUser.id,updated_at:new Date().toISOString()};
    const {error}=await db.from('business_settings').upsert(settings,{onConflict:'business_id'});
    if(error)window.toast?.('Could not save settings: '+error.message,'error');
  }
  async function ensureFollowups(){
    if(!window.currentUser?.id || !settings.followup_enabled)return;
    const at=new Date(Date.now()+3*86400000).toISOString();
    await db.from('review_requests').update({followup_at:at}).eq('business_id',window.currentUser.id).in('status',['sent','opened']).is('followup_sent_at',null).is('followup_at',null);
  }
  function enhanceCustomerRows(){
    const body=$('customerRows'); if(!body)return;
    body.querySelectorAll('tr').forEach(row=>{
      const request=row.querySelector('.send-customer'); if(!request||row.querySelector('.edit-customer'))return;
      const id=request.dataset.id;
      const cell=row.lastElementChild;
      cell.insertAdjacentHTML('beforeend',' <button class="text-button edit-customer" data-id="'+esc(id)+'">Edit</button> <button class="text-button delete-customer" data-id="'+esc(id)+'">Delete</button>');
    });
    body.querySelectorAll('.edit-customer').forEach(btn=>btn.onclick=async()=>{
      const {data}=await db.from('customers').select('id,name,email,phone').eq('id',btn.dataset.id).eq('business_id',window.currentUser.id).maybeSingle();
      if(!data)return;
      $('customerName').value=data.name||'';$('customerEmail').value=data.email||'';$('customerPhone').value=data.phone||'';window.show?.('customerForm');
      const form=$('customerForm');form.dataset.editId=data.id;form.querySelector('button[type="submit"]').textContent='Update';
    });
    body.querySelectorAll('.delete-customer').forEach(btn=>btn.onclick=async()=>{
      const id=btn.dataset.id;
      const [rq,rv]=await Promise.all([db.from('review_requests').select('id',{count:'exact',head:true}).eq('customer_id',id),db.from('reviews').select('id',{count:'exact',head:true}).eq('customer_id',id)]);
      if((rq.count||0)+(rv.count||0)>0)return window.toast?.('This customer has review history and cannot be deleted. Edit the contact instead.','error');
      if(!confirm('Delete this customer?'))return;
      const {error}=await db.from('customers').delete().eq('id',id).eq('business_id',window.currentUser.id);if(error)return window.toast?.(error.message,'error');window.toast?.('Customer deleted.');window.loadDashboard?.(window.currentUser);
    });
  }
  function enhanceReviews(){
    const list=$('reviewList');if(!list)return;
    list.querySelectorAll('.review-card').forEach(card=>{
      if(card.querySelector('.ai-review-tools'))return;
      const text=card.querySelector('p')?.textContent||'';
      const buttons=card.querySelector('.moderation-actions')||card.lastElementChild;
      const id=(card.querySelector('.moderate-review')||{}).dataset?.id;if(!id)return;
      const box=document.createElement('div');box.className='ai-review-tools mt-3 flex flex-wrap gap-2';box.innerHTML='<button class="sp-btn sp-secondary px-3 py-2 text-xs ai-analyze-review" data-id="'+esc(id)+'">✦ Analyze sentiment</button><button class="sp-btn sp-secondary px-3 py-2 text-xs ai-draft-review" data-id="'+esc(id)+'">Draft AI response</button>';
      (buttons?.parentNode||card).appendChild(box);
      box.querySelector('.ai-analyze-review').onclick=async()=>{
        const b=box.querySelector('.ai-analyze-review');b.disabled=true;b.textContent='Analyzing…';
        try{const reply=await fetch(SUPABASE_URL+'/functions/v1/starplusai-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Analyze this customer review. Return exactly: Sentiment: POSITIVE/NEUTRAL/NEGATIVE; Keywords: 3 short comma-separated themes; Action: one practical business action. Do not invent facts. Review: '+text}]})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'AI unavailable');return d.reply||''});await db.from('reviews').update({ai_sentiment:reply}).eq('id',id).eq('business_id',window.currentUser.id);box.insertAdjacentHTML('afterend','<div class="ai-response text-xs whitespace-pre-wrap">'+esc(reply)+'</div>');}catch(e){window.toast?.(e.message,'error')}finally{b.disabled=false;b.textContent='✦ Analyze sentiment';}
      };
      box.querySelector('.ai-draft-review').onclick=async()=>{
        const b=box.querySelector('.ai-draft-review');b.disabled=true;b.textContent='Drafting…';
        try{const reply=await fetch(SUPABASE_URL+'/functions/v1/starplusai-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Draft a concise professional reply to this customer review. For positive feedback, thank the customer specifically. For negative feedback, acknowledge the concern and suggest a constructive next step. Do not invent facts. Review: '+text}]})}).then(async r=>{const d=await r.json();if(!r.ok)throw new Error(d.error||'AI unavailable');return d.reply||''});await db.from('reviews').update({ai_response_draft:reply}).eq('id',id).eq('business_id',window.currentUser.id);box.insertAdjacentHTML('afterend','<div class="ai-response"><div class="ai-chip">✦ AI DRAFT</div><textarea class="sp-input mt-2 ai-draft-text">'+esc(reply)+'</textarea><button class="sp-btn sp-primary px-3 py-2 text-xs mt-2 copy-draft">Copy draft</button></div>');box.parentElement.querySelector('.copy-draft').onclick=async()=>{await navigator.clipboard.writeText(reply);window.toast?.('Draft copied.');};}catch(e){window.toast?.(e.message,'error')}finally{b.disabled=false;b.textContent='Draft AI response';}
      };
    });
  }
  const observe=(id,fn)=>{const el=$(id);if(!el)return;new MutationObserver(fn).observe(el,{childList:true,subtree:true});fn();};
  observe('customerRows',enhanceCustomerRows);observe('reviewList',enhanceReviews);

  // Wrap dashboard loader so server-backed settings are restored after every refresh.
  const originalLoad=window.loadDashboard;
  if(typeof originalLoad==='function')window.loadDashboard=async function(...args){const out=await originalLoad.apply(this,args);await loadServerSettings();await ensureFollowups();enhanceCustomerRows();enhanceReviews();return out;};

  $('saveNotifications')?.addEventListener('click',()=>saveServerSettings({notify_new_review:$('notifyNewReview').checked,notify_negative_review:$('notifyNegative').checked,notify_approved_review:$('notifyApproved').checked}));
  $('followupToggle')?.addEventListener('change',async e=>{await saveServerSettings({followup_enabled:e.target.checked});if(e.target.checked)await ensureFollowups();window.toast?.('Follow-up settings saved.');});
  $('saveWidgetConfig')?.addEventListener('click',async()=>{await saveServerSettings({widget_layout:$('widgetLayout').value,widget_color:$('widgetColor').value,widget_dark:$('widgetDark').checked,widget_radius:Number($('widgetRadius').value),widget_ai_summary:$('widgetAiSummary').checked,widget_summary:$('widgetSummary').value});});
  $('customerForm')?.addEventListener('submit',async e=>{const form=e.currentTarget;if(!form.dataset.editId)return; e.preventDefault();const id=form.dataset.editId;const {error}=await db.from('customers').update({name:$('customerName').value.trim(),email:$('customerEmail').value.trim()||null,phone:$('customerPhone').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',id).eq('business_id',window.currentUser.id);if(error)return window.toast?.(error.message,'error');delete form.dataset.editId;form.querySelector('button[type="submit"]').textContent='Save';form.reset();window.hide?.('customerForm');window.toast?.('Customer updated.');window.loadDashboard?.(window.currentUser);});

  // The dashboard exposes currentUser as a lexical variable, so publish a small accessor when possible.
  try{Object.defineProperty(window,'currentUser',{get(){return window.__spCurrentUser||null},set(v){window.__spCurrentUser=v}})}catch{}
})();
