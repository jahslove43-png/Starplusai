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
    const pending=add('Thinking…','bot'); const btn=e.currentTarget.querySelector('button'); btn.disabled=true; input.disabled=true;
    try{const res=await fetch(FUNCTION_URL,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:history.slice(-10)})}); const data=await res.json(); if(!res.ok) throw new Error(data.error||'The assistant is temporarily unavailable.'); pending.textContent=data.reply||'I could not generate a response.'; history.push({role:'assistant',content:pending.textContent});}
    catch(err){pending.textContent=err.message||'The assistant is temporarily unavailable. Please try again.';}
    finally{btn.disabled=false;input.disabled=false;input.focus();}
  };
})();

/* StarPlusAI production dashboard functions: persistent settings, customer management, AI review tools. */
(function(){
  if(!window.supabase || !document.getElementById('dashboardView')) return;
  const URL='https://rxebfyhoojuyasddkqyr.supabase.co', KEY='sb_publishable_LUBsZv3T2XUey0jZ5BI4vw_6shsxEfg';
  const db=window.supabase.createClient(URL,KEY), $=id=>document.getElementById(id);
  let uid=null, settings={};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const toast=(m,t='success')=>window.toast?window.toast(m,t):null;
  async function userId(){if(uid)return uid;const {data}=await db.auth.getUser();uid=data?.user?.id||null;return uid;}
  async function loadSettings(){const id=await userId();if(!id)return;const {data}=await db.from('business_settings').select('*').eq('business_id',id).maybeSingle();if(data)settings=data;else settings={business_id:id};
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
  }
  async function saveSettings(patch){const id=await userId();if(!id)return;const next={...settings,...patch,business_id:id,updated_at:new Date().toISOString()};const {error}=await db.from('business_settings').upsert(next,{onConflict:'business_id'});if(error)return toast(error.message,'error');settings=next;toast('Settings saved.');}
  async function scheduleFollowups(){const id=await userId();if(!id||!settings.followup_enabled)return;const at=new Date(Date.now()+3*86400000).toISOString();await db.from('review_requests').update({followup_at:at}).eq('business_id',id).in('status',['sent','opened']).is('followup_at',null).is('followup_sent_at',null);}
  async function customerActions(){const body=$('customerRows');if(!body)return;body.querySelectorAll('tr').forEach(row=>{const req=row.querySelector('.send-customer');if(!req||row.querySelector('.sp-edit-customer'))return;const id=req.dataset.id;row.lastElementChild.insertAdjacentHTML('beforeend',' <button class="text-button sp-edit-customer" data-id="'+esc(id)+'">Edit</button> <button class="text-button sp-delete-customer" data-id="'+esc(id)+'">Delete</button>');});
    body.querySelectorAll('.sp-edit-customer').forEach(btn=>btn.onclick=async()=>{const id=await userId();const {data}=await db.from('customers').select('id,name,email,phone').eq('id',btn.dataset.id).eq('business_id',id).maybeSingle();if(!data)return;$('customerName').value=data.name||'';$('customerEmail').value=data.email||'';$('customerPhone').value=data.phone||'';const f=$('customerForm');f.dataset.editId=data.id;f.querySelector('button[type=submit]').textContent='Update';f.classList.remove('hidden');});
    body.querySelectorAll('.sp-delete-customer').forEach(btn=>btn.onclick=async()=>{const id=await userId();const [a,b]=await Promise.all([db.from('review_requests').select('id',{count:'exact',head:true}).eq('customer_id',btn.dataset.id),db.from('reviews').select('id',{count:'exact',head:true}).eq('customer_id',btn.dataset.id)]);if((a.count||0)+(b.count||0)>0)return toast('This customer has review history. Edit the contact instead.','error');if(!confirm('Delete this customer?'))return;const {error}=await db.from('customers').delete().eq('id',btn.dataset.id).eq('business_id',id);if(error)return toast(error.message,'error');toast('Customer deleted.');location.reload();});
  }
  async function reviewTools(){const list=$('reviewList');if(!list)return;const id=await userId();list.querySelectorAll('.review-card').forEach(card=>{if(card.querySelector('.sp-review-tools'))return;const control=card.querySelector('.moderate-review');if(!control)return;const rid=control.dataset.id,text=card.querySelector('p')?.textContent||'';const wrap=document.createElement('div');wrap.className='sp-review-tools flex flex-wrap gap-2 mt-3';wrap.innerHTML='<button class="sp-btn sp-secondary px-3 py-2 text-xs sp-analyze">✦ Analyze sentiment</button><button class="sp-btn sp-secondary px-3 py-2 text-xs sp-draft">Draft AI response</button>';card.appendChild(wrap);
      wrap.querySelector('.sp-analyze').onclick=async e=>{e.currentTarget.disabled=true;e.currentTarget.textContent='Analyzing…';try{const r=await fetch(URL+'/functions/v1/starplusai-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Analyze this customer review. Return Sentiment, three Keywords, and one Action. Do not invent facts. Review: '+text}]})});const d=await r.json();if(!r.ok)throw Error(d.error||'AI unavailable');await db.from('reviews').update({ai_sentiment:d.reply}).eq('id',rid).eq('business_id',id);wrap.insertAdjacentHTML('afterend','<div class="ai-response text-xs whitespace-pre-wrap">'+esc(d.reply)+'</div>');}catch(x){toast(x.message,'error')}finally{e.currentTarget.disabled=false;e.currentTarget.textContent='✦ Analyze sentiment';}};
      wrap.querySelector('.sp-draft').onclick=async e=>{e.currentTarget.disabled=true;e.currentTarget.textContent='Drafting…';try{const r=await fetch(URL+'/functions/v1/starplusai-agent',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({messages:[{role:'user',content:'Draft a concise professional reply to this customer review. Thank positive feedback; for negative feedback acknowledge the concern and suggest a constructive next step. Do not invent facts. Review: '+text}]})});const d=await r.json();if(!r.ok)throw Error(d.error||'AI unavailable');await db.from('reviews').update({ai_response_draft:d.reply}).eq('id',rid).eq('business_id',id);wrap.insertAdjacentHTML('afterend','<div class="ai-response"><div class="ai-chip">✦ AI DRAFT</div><textarea class="sp-input mt-2 sp-draft-text">'+esc(d.reply)+'</textarea><button class="sp-btn sp-primary px-3 py-2 text-xs mt-2 sp-copy-draft">Copy draft</button></div>');wrap.nextElementSibling.querySelector('.sp-copy-draft').onclick=async()=>{await navigator.clipboard.writeText(d.reply);toast('Draft copied.');};}catch(x){toast(x.message,'error')}finally{e.currentTarget.disabled=false;e.currentTarget.textContent='Draft AI response';}};
    });
  }
  const obs=(id,fn)=>{const el=$(id);if(!el)return;new MutationObserver(fn).observe(el,{childList:true,subtree:true});fn();};
  obs('customerRows',customerActions);obs('reviewList',reviewTools);
  $('saveNotifications')?.addEventListener('click',()=>saveSettings({notify_new_review:$('notifyNewReview').checked,notify_negative_review:$('notifyNegative').checked,notify_approved_review:$('notifyApproved').checked}));
  $('followupToggle')?.addEventListener('change',async e=>{await saveSettings({followup_enabled:e.target.checked});if(e.target.checked)await scheduleFollowups();});
  $('saveWidgetConfig')?.addEventListener('click',()=>saveSettings({widget_layout:$('widgetLayout').value,widget_color:$('widgetColor').value,widget_dark:$('widgetDark').checked,widget_radius:Number($('widgetRadius').value),widget_ai_summary:$('widgetAiSummary').checked,widget_summary:$('widgetSummary').value}));
  $('customerForm')?.addEventListener('submit',async e=>{const f=e.currentTarget;if(!f.dataset.editId)return;e.preventDefault();const id=await userId();const {error}=await db.from('customers').update({name:$('customerName').value.trim(),email:$('customerEmail').value.trim()||null,phone:$('customerPhone').value.trim()||null,updated_at:new Date().toISOString()}).eq('id',f.dataset.editId).eq('business_id',id);if(error)return toast(error.message,'error');delete f.dataset.editId;f.querySelector('button[type=submit]').textContent='Save';f.reset();f.classList.add('hidden');toast('Customer updated.');location.reload();});
  db.auth.onAuthStateChange(async(_event,session)=>{uid=session?.user?.id||null;if(uid){await loadSettings();await scheduleFollowups();}});
  setTimeout(async()=>{if(await userId()){await loadSettings();await scheduleFollowups();}},900);
})();
