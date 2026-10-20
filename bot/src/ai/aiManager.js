// AI Manager: điều phối provider (Gemini / Claude / OpenAI / custom OpenAI-compatible)
// theo cấu hình của từng server, và tạo "kế hoạch" JSON cho AI Server Manager.
import * as gemini from './providers/gemini.js';
import * as claude from './providers/claude.js';
import * as openai from './providers/openai.js';

const PROVIDERS = { gemini, claude, openai, custom: openai }; // custom dùng giao thức OpenAI-compatible
const DEFAULT_MODELS = {
  gemini: 'gemini-2.0-flash',
  claude: 'claude-3-5-haiku-latest',
  openai: 'gpt-4o-mini',
  custom: 'gpt-4o-mini',
};

export const SUPPORTED_PROVIDERS = Object.keys(PROVIDERS);

// Gửi một yêu cầu tới provider đã cấu hình của server
export async function complete(config, { system, prompt, maxTokens = 2000 }) {
  const ai = config?.ai;
  if (!ai?.apiKey) throw new Error('Chưa cấu hình API Key. Vào Dashboard > AI Settings để thêm.');
  const provider = PROVIDERS[ai.provider];
  if (!provider) throw new Error(`Provider không được hỗ trợ: ${ai.provider}`);

  return provider.generate({
    apiKey: ai.apiKey,
    model: ai.model || DEFAULT_MODELS[ai.provider],
    baseUrl: ai.baseUrl || undefined,
    system,
    prompt,
    maxTokens,
  });
}

// Trích JSON từ phản hồi của AI (bỏ markdown fence nếu có)
export function parseJson(text) {
  const cleaned = String(text).replace(/```(?:json)?/gi, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI không trả về JSON hợp lệ.');
  return JSON.parse(cleaned.slice(start, end + 1));
}

// Sinh kế hoạch hành động từ yêu cầu tự nhiên của Admin
export async function generatePlan(config, userPrompt, serverContext) {
  const system = `Bạn là AI Server Manager cho Discord. Nhiệm vụ: chuyển yêu cầu của Admin thành kế hoạch hành động.
CHỈ trả về một JSON object hợp lệ, không có văn bản khác, dạng: {"actions":[...]}
Các action được phép (type):
- {"type":"createCategory","name":"..."}
- {"type":"createChannel","name":"...","channelType":"text|voice|announcement|forum","category":"tên danh mục (tuỳ chọn)","private":false,"topic":"(tuỳ chọn)"}
- {"type":"createRole","name":"...","color":"#RRGGBB","hoist":false,"permissions":["ManageMessages","KickMembers",...]}
- {"type":"createTicketSystem","channelName":"ticket-support","categoryName":"🎫 Tickets","supportRole":"tên role hỗ trợ (tuỳ chọn)"}
- {"type":"setAntispam","enabled":true,"maxMessages":5,"windowSeconds":5,"timeoutMinutes":5}
- {"type":"setBlockedWords","words":["..."]}
- {"type":"setSlowmode","channel":"tên kênh","seconds":5}
Quy tắc: tối đa 25 actions; không tạo quyền Administrator; tên kênh không dấu cách (dùng dấu gạch ngang).`;

  const text = await complete(config, {
    system,
    prompt: `Thông tin server hiện tại: ${JSON.stringify(serverContext)}\nYêu cầu của Admin: ${userPrompt}`,
    maxTokens: 3000,
  });
  return parseJson(text);
}
