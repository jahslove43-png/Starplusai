import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const cors={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"content-type","Access-Control-Allow-Methods":"POST,OPTIONS","Content-Type":"application/json"};
const json=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers:cors});
const SYSTEM_PROMPT=`You are the official StarPlusAI Assistant for the StarPlusAI customer-review SaaS.

Product facts:
- StarPlusAI helps businesses collect customer reviews, manage customers and review requests, moderate incoming reviews, and showcase approved reviews through a website widget.
- The current public plans shown on the website are Starter $29/month (up to 50 review requests/month), Growth $79/month (up to 250 requests/month), and Pro $199/month (unlimited requests). Paid checkout is not active yet.
- The current trial shown on the website is 3 days and no credit card is required to start.
- Businesses can add customers, create review requests, copy review links, send configured review-request emails, moderate reviews as approved or rejected, and use the public widget for approved reviews.
- The website includes login, signup, email verification, password reset, and Cloudflare Turnstile protection.
- Only approved reviews are returned by the public review widget feed.
- Do not invent features, prices, policies, integrations, guarantees, customer stories, or account data. If the answer is not in your known facts, say that you do not have enough information and direct the user to the Contact page or dashboard where appropriate.
- Never ask users for passwords, API keys, secret keys, or payment-card details.
- Be concise, friendly, professional, and practical. If the user asks how to do something, give numbered steps.
`;
Deno.serve(async(req:Request)=>{
 if(req.method==='OPTIONS') return new Response('ok',{headers:cors});
 if(req.method!=='POST') return json({error:'Method not allowed.'},405);
 try{
  const body=await req.json();
  const messages=Array.isArray(body.messages)?body.messages:[];
  if(!messages.length) return json({error:'A message is required.'},400);
  const safe=messages.slice(-10).filter((m:any)=>m&&['user','assistant'].includes(m.role)&&typeof m.content==='string').map((m:any)=>({role:m.role,content:m.content.slice(0,2000)}));
  if(!safe.length||safe[safe.length-1].role!=='user') return json({error:'Invalid conversation.'},400);
  const apiKey=Deno.env.get('OPENAI_API_KEY');
  if(!apiKey) return json({error:'The AI assistant is not configured yet. Please try again later.'},503);
  const model=Deno.env.get('OPENAI_MODEL')||'gpt-5-mini';
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':'Bearer '+apiKey,'Content-Type':'application/json'},body:JSON.stringify({model,instructions:SYSTEM_PROMPT,input:safe,max_output_tokens:500})});
  const data=await response.json();
  if(!response.ok) return json({error:'The AI service could not complete the request.'},502);
  const reply=typeof data.output_text==='string'?data.output_text.trim():'';
  if(!reply) return json({error:'The assistant returned an empty response.'},502);
  return json({reply});
 }catch(e){return json({error:'The assistant is temporarily unavailable.'},500);}
});
