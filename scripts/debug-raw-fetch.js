require("dotenv").config();

async function debugRawFetch() {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = "gemini-3.0-flash";
  const baseUrl = "https://generativelanguage.googleapis.com/v1beta";
  const url = `${baseUrl}/models/${modelName}:generateContent?key=${apiKey}`;

  // 1x1 pixel transparente
  const base64Data = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  console.log(`🔍 DEBUG: Testando FETCH RAW para ${modelName}...`);

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Diga OK." },
            { inlineData: { mimeType: "image/png", data: base64Data } }
          ]
        }]
      })
    });

    const data = await response.json();
    console.log("Status:", response.status);
    console.log("Full Response:", JSON.stringify(data, null, 2));

    if (data.candidates?.[0]?.finishReason === "SAFETY") {
        console.log("🛑 REJEITADO POR SEGURANÇA (SAFETY)");
    }
  } catch (err) {
    console.error("💥 CRASH NO FETCH:", err.message);
  }
}

debugRawFetch();
