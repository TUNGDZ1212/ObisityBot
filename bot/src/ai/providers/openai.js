// Provider OpenAI ChatGPT (Chat Completions). Dùng baseUrl để kết nối mọi API tương thích OpenAI
// (Groq, DeepSeek, OpenRouter, server tự host...).
export async function generate({ apiKey, model, baseUrl, system, prompt, maxTokens }) {
  const root = (baseUrl || 'https://api.openai.com/v1').replace(/\/$/, '');
  const res = await fetch(`${root}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model,
      temperature: 0.3,
      max_tokens: maxTokens,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`OpenAI: ${data.error?.message ?? res.status}`);
  return data.choices?.[0]?.message?.content ?? '';
}
