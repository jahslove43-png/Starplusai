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
})();
