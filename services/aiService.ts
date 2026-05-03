interface AIConversationMessage {
  role: "user" | "assistant";
  content: string;
}

interface AIPayload {
  conversationMessages: AIConversationMessage[];
  integrationsContext: string;
}

function toOpenRouterMessages(payload: AIPayload) {
  const system =
    "You are a tenant-scoped AI assistant. Use provided context faithfully, keep answers concise, and never invent tenant data.";
  return [
    {
      role: "system" as const,
      content: `${system}\n\nIntegrations and metrics context:\n${payload.integrationsContext}`
    },
    ...payload.conversationMessages.map((message) => ({
      role: (message.role === "assistant" ? "assistant" : "user") as "assistant" | "user",
      content: message.content
    }))
  ];
}

async function openRouterChat(payload: AIPayload, stream: boolean) {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY is required.");
  }

  const model = process.env.OPENROUTER_MODEL || "openrouter/auto";
  const referer = process.env.NEXT_PUBLIC_APP_URL;

  return fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(referer
        ? {
            "HTTP-Referer": referer,
            "X-Title": "Multi-tenant AI Assistant"
          }
        : {})
    },
    body: JSON.stringify({
      model,
      messages: toOpenRouterMessages(payload),
      stream
    })
  });
}

export async function generateAIResponse(payload: AIPayload) {
  const response = await openRouterChat(payload, false);
  const raw = await response.text();

  if (!response.ok) {
    if (response.status === 429) {
      throw new Error("OpenRouter rate limit reached. Please retry.");
    }
    throw new Error(`OpenRouter API error (${response.status}): ${raw}`);
  }

  let data: { choices?: Array<{ message?: { content?: string } }> };
  try {
    data = JSON.parse(raw) as { choices?: Array<{ message?: { content?: string } }> };
  } catch {
    throw new Error("OpenRouter returned invalid JSON.");
  }

  const text = data?.choices?.[0]?.message?.content;
  if (!text?.trim()) {
    throw new Error("OpenRouter returned an empty response.");
  }
  return text;
}

export async function* generateAIResponseStream(payload: AIPayload): AsyncGenerator<string> {
  const response = await openRouterChat(payload, true);

  if (!response.ok) {
    const raw = await response.text();
    if (response.status === 429) {
      throw new Error("OpenRouter rate limit reached. Please retry.");
    }
    throw new Error(`OpenRouter API error (${response.status}): ${raw}`);
  }

  if (!response.body) {
    throw new Error("OpenRouter returned no response body.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let carry = "";

  while (true) {
    const { done, value } = await reader.read();
    carry += decoder.decode(value ?? new Uint8Array(), { stream: !done });

    const lines = carry.split("\n");
    carry = lines.pop() ?? "";

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const json = trimmed.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const parsed = JSON.parse(json) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const chunk = parsed?.choices?.[0]?.delta?.content;
        if (chunk) yield chunk;
      } catch {
        // Incomplete JSON line; skip until next chunk.
      }
    }

    if (done) break;
  }
}
