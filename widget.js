(function () {
  const script = document.currentScript;
  const businessId = script && script.dataset.businessId;
  const targetId = script && script.dataset.target;
  if (!businessId) return;
  const target = targetId ? document.getElementById(targetId) : script.parentElement;
  if (!target) return;

  const layout = script.dataset.layout || 'grid';
  const color = script.dataset.color || '#4f46e5';
  const dark = script.dataset.dark === 'true';
  const radius = Math.max(0, Math.min(32, Number(script.dataset.radius || 18)));
  const showAi = script.dataset.aiSummary !== 'false';
  const endpoint = 'https://rxebfyhoojuyasddkqyr.supabase.co/functions/v1/widget-feed?business_id=' + encodeURIComponent(businessId) + '&limit=6';

  target.innerHTML = '<div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:'+radius+'px">Loading reviews…</div>';

  fetch(endpoint)
    .then(r => r.json().then(data => ({ ok:r.ok, data })))
    .then(({ok,data}) => {
      if (!ok) throw new Error(data.error || 'Could not load reviews.');
      const reviews=data.reviews||[];
      const average=Number(data.summary?.average_rating||0).toFixed(1);
      const count=data.summary?.count||0;
      const bg=dark?'#020617':'#fff', text=dark?'#f8fafc':'#111827', muted=dark?'#94a3b8':'#6b7280', border=dark?'#1e293b':'#e5e7eb';
      const stars=rating=>'★'.repeat(rating)+'☆'.repeat(5-rating);
      const cards=reviews.length?reviews.map(r=>'<article style="padding:14px 0;border-bottom:1px solid '+border+'">'+
        '<div style="font-weight:700;letter-spacing:1px;color:'+color+'">'+stars(r.rating)+'</div>'+
        '<p style="margin:8px 0;color:'+text+'">'+escapeHtml(r.comment)+'</p>'+
        '<small style="color:'+muted+'">'+escapeHtml(r.customer_name)+'</small></article>').join('')
        :'<p style="color:'+muted+'">No approved reviews yet.</p>';
      const summary=showAi && reviews.length ? '<div style="margin:14px 0;padding:12px;border-radius:12px;background:'+color+'12;color:'+text+'"><strong>✦ Verified review summary</strong><div style="margin-top:5px;color:'+muted+'">Customers consistently value the experience reflected in these approved reviews.</div></div>':'';
      let body=summary+cards;
      if(layout==='carousel') body='<div style="display:flex;gap:12px;overflow:auto">'+reviews.map(r=>'<article style="min-width:260px;padding:14px;border:1px solid '+border+';border-radius:'+radius+'px"><div style="color:'+color+'">'+stars(r.rating)+'</div><p style="color:'+text+'">'+escapeHtml(r.comment)+'</p><small style="color:'+muted+'">'+escapeHtml(r.customer_name)+'</small></article>').join('')+'</div>';
      if(layout==='floating') body='<div style="padding:14px;border-radius:999px;background:'+color+';color:#fff;box-shadow:0 8px 30px rgba(0,0,0,.18)"><strong>★ '+average+'</strong> · '+count+' verified review'+(count===1?'':'s')+'</div>';
      if(layout==='sidebar') body='<div style="border-left:4px solid '+color+';padding:14px 16px">'+summary+cards+'</div>';

      target.innerHTML='<div style="font-family:Arial,sans-serif;max-width:760px;padding:20px;border:1px solid '+border+';border-radius:'+radius+'px;background:'+bg+';color:'+text+'">'+
        '<div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap">'+
        '<div><strong style="font-size:18px">'+escapeHtml(data.business?.name||'Customer reviews')+'</strong><div style="margin-top:5px;color:'+color+';font-size:18px">★ '+average+'</div></div>'+
        '<span style="color:'+muted+'">'+count+' approved review'+(count===1?'':'s')+'</span></div>'+
        '<div style="margin-top:12px">'+body+'</div><div style="margin-top:14px;font-size:11px;color:'+muted+'">Powered by StarPlusAI</div></div>';

      if(reviews.length && count>0){
        const ld={"@context":"https://schema.org","@type":"Organization","name":data.business?.name||'Business',"aggregateRating":{"@type":"AggregateRating","ratingValue":average,"reviewCount":count}};
        const node=document.createElement('script');node.type='application/ld+json';node.textContent=JSON.stringify(ld);document.head.appendChild(node);
      }
    })
    .catch(error => {
      target.innerHTML='<div style="font-family:Arial,sans-serif;padding:14px;border:1px solid #fecaca;border-radius:12px;color:#991b1b">Reviews are temporarily unavailable.</div>';
      console.error('StarPlusAI widget:',error);
    });

  function escapeHtml(value){return String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
})();