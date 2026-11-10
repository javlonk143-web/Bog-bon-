"use strict";

const MODEL = process.env.CLAUDE_MODEL || "anthropic.claude-sonnet-5";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    let body = req.body;
    if (typeof body === "string") {
      try { body = JSON.parse(body); } catch (e) {}
    }
    if (!body && req.readable) {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      try { body = JSON.parse(Buffer.concat(chunks).toString()); } catch (e) {}
    }

    const imageBase64 = body?.imageBase64 || body?.image || body?.images?.[0];
    
    if (!imageBase64) {
      return res.status(400).json({ error: "Rasm ma'lumoti topilmadi" });
    }

    const bearerToken = process.env.AWS_BEARER_TOKEN_BEDROCK;
    if (!bearerToken) {
      return res.status(500).json({ error: "Serverda AWS token topilmadi" });
    }

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
                  data: String(imageBase64).replace(/^data:image\/\w+;base64,/, ""),
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
      console.error("Bedrock API Error:", data);
      return res.status(bedrockResponse.status).json({ 
        error: data.message || data.error || "Bedrock API xatosi", 
        details: data 
      });
    }

    const replyText = data.content?.[0]?.text || "Natija topilmadi";
    return res.status(200).json({ result: replyText });

  } catch (err) {
    console.error("Server Error:", err);
    return res.status(500).json({ error: "Serverda ichki xatolik yuz berdi", details: err.message });
  }
};
