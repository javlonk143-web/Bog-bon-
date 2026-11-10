"use strict";
const { buildPrompt, LABELS } = require("../lib/prompt.js");
const MODEL = process.env.CLAUDE_MODEL || "claude-sonnet-5-5";
const MAX_PER_HOUR = parseInt(process.env.HOURLY_LIMIT || "12", 10);
const hits = new Map();
function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (a.length >= MAX_PER_HOUR) { hits.set(ip, a); return true; }
  a.push(now); hits.set(ip, a);
  if (hits.size > 5000) hits.clear();
  return false;
}
const send = (res, status, body) => res.status(status).json(body);
const oneLine = (v, n) => String(v == null ? "" : v).replace(/[\u0000-\u001f]+/g, " ").trim().slice(0, n);

module.exports = async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return send(res, 405, { code: "method_not_allowed" });
  if (!process.env.ANTHROPIC_API_KEY) return send(res, 500, { code: "not_configured" });
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (limited(ip)) return send(res, 429, { code: "rate_limited" });

  let b = req.body;
  if (typeof b === "string") { try { b = JSON.parse(b); } catch (e) { b = null; } }
  if (!b || !Array.isArray(b.images) || b.images.length < 1 || b.images.length > 4) return send(res, 400, { code: "bad_request" });

  const blocks = []; let total = 0;
  for (const u of b.images) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(u));
    if (!m) return send(res, 400, { code: "image_rejected" });
    total += m[2].length;
    if (total > 4000000) return send(res, 413, { code: "image_rejected" });
    blocks.push({ type: "image", source: { type: "base64", media_type: m[1], data: m[2] } });
  }
  const info = {};
  for (const k of Object.keys(LABELS)) if (b.info && b.info[k]) info[k] = oneLine(b.info[k], 300);
  const prev = (b.prev && typeof b.prev === "object" && JSON.stringify(b.prev).length < 14000) ? b.prev : null;
  const answers = oneLine(b.answers, 1500);
  const text = buildPrompt(info, b.images, prev, answers);

  const ctl = new AbortController(), timer = setTimeout(() => ctl.abort(), 55000);
  let r;
  try {
    r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST", signal: ctl.signal,
      headers: { "content-type": "application/json", "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({ model: MODEL, max_tokens: 4096, messages: [{ role: "user", content: [...blocks, { type: "text", text }] }] })
    });
  } catch (e) {
    return send(res, 504, { code: e && e.name === "AbortError" ? "timeout" : "upstream_error" });
  } finally { clearTimeout(timer); }

  if (!r.ok) {
    let em = ""; try { em = ((await r.json()).error || {}).message || ""; } catch (e) {}
    console.error("Anthropic xatosi", r.status, em.slice(0, 300));
    const code = r.status === 429 ? "rate_limited" : (r.status === 400 && /image/i.test(em)) ? "image_rejected" : "upstream_error";
    return send(res, r.status === 429 ? 429 : 502, { code });
  }
  const j = await r.json();
  const t = (j.content || []).filter(c => c.type === "text").map(c => c.text).join("");
  const a = t.indexOf("{"), z = t.lastIndexOf("}");
  let data = null;
  if (a >= 0 && z > a) { try { data = JSON.parse(t.slice(a, z + 1)); } catch (e) {} }
  if (!data) return send(res, 502, { code: "invalid_json" });
  return send(res, 200, { data });
};
