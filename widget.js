(function () {
  const script = document.currentScript;
  const businessId = script && script.dataset.businessId;
  const targetId = script && script.dataset.target;
  if (!businessId) return;

  const target = targetId ? document.getElementById(targetId) : script.parentElement;
  if (!target) return;

  const endpoint = "https://rxebfyhoojuyasddkqyr.supabase.co/functions/v1/widget-feed?business_id=" +
    encodeURIComponent(businessId) + "&limit=6";

  target.innerHTML = '<div style="font-family:Arial,sans-serif;padding:20px;border:1px solid #e5e7eb;border-radius:14px">Loading reviews…</div>';

  fetch(endpoint)
    .then(r => r.json().then(data => ({ ok: r.ok, data })))
    .then(({ ok, data }) => {
      if (!ok) throw new Error(data.error || "Could not load reviews.");
      const reviews = data.reviews || [];
      const average = Number(data.summary?.average_rating || 0).toFixed(1);
      const count = data.summary?.count || 0;

      const stars = rating => "★".repeat(rating) + "☆".repeat(5 - rating);
      const cards = reviews.length
        ? reviews.map(r => '<article style="padding:14px 0;border-bottom:1px solid #eee">' +
            '<div style="font-weight:700;letter-spacing:1px">' + stars(r.rating) + '</div>' +
            '<p style="margin:8px 0;color:#374151">' + escapeHtml(r.comment) + '</p>' +
            '<small style="color:#6b7280">' + escapeHtml(r.customer_name) + '</small>' +
          '</article>').join("")
        : '<p style="color:#6b7280">No approved reviews yet.</p>';

      target.innerHTML =
        '<div style="font-family:Arial,sans-serif;max-width:680px;padding:20px;border:1px solid #e5e7eb;border-radius:14px;background:#fff">' +
          '<div style="display:flex;justify-content:space-between;gap:16px;align-items:center;flex-wrap:wrap">' +
            '<div><strong style="font-size:18px">' + escapeHtml(data.business?.name || "Customer reviews") + '</strong>' +
            '<div style="margin-top:5px;color:#f59e0b;font-size:18px">★ ' + average + '</div></div>' +
            '<span style="color:#6b7280">' + count + ' approved review' + (count === 1 ? "" : "s") + '</span>' +
          '</div>' +
          '<div style="margin-top:12px">' + cards + '</div>' +
          '<div style="margin-top:14px;font-size:11px;color:#9ca3af">Powered by StarPlusAI</div>' +
        '</div>';
    })
    .catch(error => {
      target.innerHTML = '<div style="font-family:Arial,sans-serif;padding:14px;border:1px solid #fecaca;border-radius:12px;color:#991b1b">Reviews are temporarily unavailable.</div>';
      console.error("StarPlusAI widget:", error);
    });

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    }[c]));
  }
})();