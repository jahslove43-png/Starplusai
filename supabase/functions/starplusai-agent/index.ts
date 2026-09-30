import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});

const SYSTEM_PROMPT=\`You are the official StarPlusAI Assistant for a customer-review SaaS.

Confirmed product facts:
- StarPlusAI helps businesses collect customer reviews, manage customers and review requests, moderate incoming reviews, and showcase approved reviews through a website widget.
- Starter is $29/month for up to 50 review requests/month.
- Growth is $79/month for up to 250 review requests/month.
- Pro is $199/month with unlimited review requests.
- Paid checkout is not active yet.
- The trial is 3 days and does not require a card.
- Businesses can add customers, create review requests, copy review links, send configured review-request emails, moderate reviews as approved or rejected, and use the public widget for approved reviews.
- The website has login, signup, email verification, password reset, and Cloudflare Turnstile.
- Only approved reviews appear in the public review widget.

Behavior:
- Act as both a product guide and onboarding support assistant.
- For "how do I get started?", give numbered steps: create account, verify email, sign in, add customers, create/send review requests, moderate reviews, then add the widget.
- For "how do I collect a review?", explain: add customer, create review request, then send the request or share the generated review link.
- For "how do reviews work?", explain submission, moderation, approval/rejection, and public display of approved reviews.
- For pricing questions, list all three plans and their current limits.
- For account-access questions, explain the available login, email verification, and password-reset flows.
- For account-specific questions, explain that you cannot see private account data and direct the user to the dashboard.
- Never guess about features, integrations, policies, prices, guarantees, or account information not listed above.
- Never request private credentials or secret keys.
- Never claim an action happened unless the website actually reports it.
- Keep answers concise, friendly, professional, and practical. Use numbered steps for how-to questions and bullets for comparisons.\`;

Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 if(req.method!=='POST') return json({error:'Method not allowed.'},405);
 try{
  const body=await req.json();
  const messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length) return json({error:'A message is required.'},400);
  const safe=messages.slice(-10).filter((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map((m:any)=>({role:m.role,content:m.content.slice(0,2000)}));
  if(!safe.length||safe[safe.length-1].role!=='user') return json({error:'Invalid conversation.'},400);

  const apiKey=Deno.env.get('GEMINI_API_KEY');
  if(!apiKey) return json({error:'The AI assistant is not configured yet. Please try again later.'},503);

  const model=Deno.env.get('GEMINI_MODEL')||'gemini-2.5-flash-lite';
  const input=safe.map((m:any)=>({role:m.role==='assistant'?'model':'user',content:[{type:'text',text:m.content}]}));

  const response=await fetch('https://generativelanguage.googleapis.com/v1/interactions',{
    method:'POST',
    headers:{'Content-Type':'application/json','x-goog-api-key':apiKey},
    body:JSON.stringify({
      model,
      input,
      system_instruction:SYSTEM_PROMPT,
      store:false
    })
  });
  const data=await response.json();
  if(!response.ok) return json({error:'The AI service could not complete the request.'},502);

  let reply='';
  if(typeof data.output_text==='string') reply=data.output_text.trim();
  if(!reply && Array.isArray(data.steps)){
    const outputs=data.steps.filter((s:any)=>s?.type==='model_output');
    const last=outputs[outputs.length-1];
    if(Array.isArray(last?.content)){
      reply=last.content.filter((c:any)=>c?.type==='text'&&typeof c.text==='string').map((c:any)=>c.text).join('').trim();
    }
  }
  if(!reply) return json({error:'The assistant returned an empty response.'},502);
  return json({reply});
 }catch(e){return json({error:'The assistant is temporarily unavailable.'},500);}
});