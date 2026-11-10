"use strict";
const { buildPrompt, LABELS } = require("../lib/prompt.js");

const MODEL = process.env.CLAUDE_MODEL || "anthropic.claude-sonnet-5-5";
const MAX_PER_HOUR = parseInt(process.env.HOURLY_LIMIT || "12", 10);
const hits = new Map();

function limited(ip) {
  const now = Date.now(), a = (hits.get(ip) || []).filter(t => now - t < 3600000);
  if (a.length >= MAX_PER_HOUR) return true;
  a.push(now);
  hits.set(ip, a);
  return false;
}

module.exports = async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress || "anon";
  if (limited(ip)) return res.status(429).json({ error: "Soatlik limitga yetdingiz. Birozdan so'ng urinib ko'ring." });

  try {
    const { imageBase64 } = req.body || {};
    if (!imageBase64) return res.status(400).json({ error: "Rasm ko'rsatilmadi" });

    const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
    const region = "ap-southeast-2";

    const bedrockUrl = `https://bedrock-runtime.${region}.amazonaws.com/model/${MODEL}/invoke`;

    const bedrockResponse = await fetch(bedrockUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${bearerToken}`,
      },
      body: JSON.stringify({
        anthropic_version: "bedrock-2023-05-31",
        max_tokens: 1000,
        messages: [
          {
            role: "user",
            content: [
              {
                type: "image",
                source: {
                  type: "base64",
                  media_type: "image/jpeg",
                  data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
                },
              },
              {
                type: "text",
                text: "O'simlik bargidagi kasallikni aniqlang va uni davolash uchun agronomik tavsiyalar bering.",
              },
            ],
          },
        ],
      }),
    });

    const data = await bedrockResponse.json();

    if (!bedrockResponse.ok) {
      console.error("Bedrock Error:", data);
      return res.status(bedrockResponse.status).json({ error: data.message || "Bedrock API xatosi" });
    }

    const replyText = data.content[0].text;
    return res.status(200).json({ result: replyText });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Serverda ichki xatolik yuz berdi" });
  }
};
