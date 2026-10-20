// Provider Google Gemini (REST generateContent). API key gửi qua header x-goog-api-key.
export async function generate({ apiKey, model, system, prompt, maxTokens }) {
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens, temperature: 0.3, responseMimeType: 'application/json' },
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Gemini: ${data.error?.message ?? res.status}`);
  return (data.candidates?.[0]?.content?.parts ?? []).map((p) => p.text ?? '').join('');
}
