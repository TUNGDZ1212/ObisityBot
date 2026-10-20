// Provider Anthropic Claude (Messages API). Header bắt buộc: x-api-key và anthropic-version.
export async function generate({ apiKey, model, system, prompt, maxTokens }) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(`Claude: ${data.error?.message ?? res.status}`);
  return (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('');
}
