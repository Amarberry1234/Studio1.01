import { jsPDF } from "jspdf";
import { ChatSession, ProjectItem, ModelParameters } from "../types";

/**
 * Generate CSV from Chat Messages or Projects
 */
export function exportToCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || !rows.length) return;
  const headers = Object.keys(rows[0]);
  const csvContent = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((field) => {
          let val = row[field] ?? "";
          if (typeof val === "object") val = JSON.stringify(val);
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        })
        .join(",")
    ),
  ].join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Export Chat Session to formatted PDF
 */
export function exportChatToPDF(session: ChatSession, modelName: string) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.setTextColor(33, 37, 41);
  doc.text("Local AI Studio - Session Report", 14, y);

  y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(108, 117, 125);
  doc.text(`Title: ${session.title}`, 14, y);
  doc.text(`Date: ${new Date(session.updatedAt).toLocaleString()}`, pageWidth - 80, y);

  y += 6;
  doc.text(`Model: ${modelName} (${session.modelId})`, 14, y);
  doc.text(`Encrypted Vault: ${session.isEncrypted ? "Yes (AES-GCM)" : "No"}`, pageWidth - 80, y);

  y += 4;
  doc.setDrawColor(220, 224, 230);
  doc.line(14, y, pageWidth - 14, y);
  y += 10;

  // System Prompt if exists
  if (session.systemInstruction) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(59, 130, 246);
    doc.text("System Instructions:", 14, y);
    y += 5;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(70, 80, 95);
    const splitSys = doc.splitTextToSize(session.systemInstruction, pageWidth - 28);
    doc.text(splitSys, 14, y);
    y += splitSys.length * 4.5 + 6;
  }

  // Messages
  for (const msg of session.messages) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }

    const isUser = msg.role === "user";
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(isUser ? 37 : 16, isUser ? 99 : 185, isUser ? 235 : 129); // Blue vs Green
    doc.text(isUser ? "User Prompt:" : `Assistant (${msg.modelUsed || modelName}):`, 14, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(30, 41, 59);

    const cleanContent = msg.content.replace(/<think>[\s\S]*?<\/think>/g, "").trim();
    const splitContent = doc.splitTextToSize(cleanContent || msg.content, pageWidth - 28);

    if (y + splitContent.length * 5 > 280) {
      doc.addPage();
      y = 20;
    }

    doc.text(splitContent, 14, y);
    y += splitContent.length * 5 + 8;
  }

  doc.save(`${session.title.replace(/[^a-z0-9_-]/gi, "_")}_export.pdf`);
}

/**
 * Export Projects to PDF
 */
export function exportProjectsToPDF(projects: ProjectItem[]) {
  const doc = new jsPDF();
  let y = 20;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("Local AI Studio - Project & Deadline Board", 14, y);

  y += 10;
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`Generated on ${new Date().toLocaleString()} | Total items: ${projects.length}`, 14, y);

  y += 8;
  doc.line(14, y, 196, y);
  y += 10;

  for (const p of projects) {
    if (y > 260) {
      doc.addPage();
      y = 20;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(15, 23, 42);
    doc.text(`${p.title} [${p.priority.toUpperCase()}]`, 14, y);

    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(71, 85, 105);
    doc.text(`Status: ${p.status} | Deadline: ${p.deadline || "No deadline"} | Tags: ${p.tags.join(", ") || "None"}`, 14, y);

    y += 5;
    const desc = doc.splitTextToSize(p.description || "No description", 180);
    doc.text(desc, 14, y);
    y += desc.length * 4.5 + 8;
  }

  doc.save("Project_Deadlines_Export.pdf");
}

/**
 * Generate code snippets for Google AI Studio "Get Code"
 */
export function generateCodeSnippet(
  language: "python" | "typescript" | "curl" | "ollama_cli" | "openai_format",
  modelId: string,
  systemInstruction: string,
  prompt: string,
  params: ModelParameters,
  host: string
): string {
  switch (language) {
    case "python":
      return `import requests
import json

# Local AI Studio - Zero Cost Python Client
OLLAMA_HOST = "${host || "http://localhost:11434"}"
MODEL_NAME = "${modelId}"

payload = {
    "model": MODEL_NAME,
    "messages": [
        {"role": "system", "content": ${JSON.stringify(systemInstruction || "You are a helpful local AI assistant.")}},
        {"role": "user", "content": ${JSON.stringify(prompt || "Hello!")}}
    ],
    "options": {
        "temperature": ${params.temperature},
        "top_p": ${params.topP},
        "top_k": ${params.topK},
        "num_predict": ${params.maxOutputTokens},
        "repeat_penalty": ${params.repeatPenalty}
    },
    "stream": True
}

response = requests.post(f"{OLLAMA_HOST}/api/chat", json=payload, stream=True)

print(f"Connecting to {MODEL_NAME} locally...")
for line in response.iter_lines():
    if line:
        chunk = json.loads(line.decode('utf-8'))
        content = chunk.get("message", {}).get("content", "")
        print(content, end="", flush=True)
`;

    case "typescript":
      return `// Local AI Studio - Zero Cost TypeScript / Node.js
async function runLocalPrompt() {
  const host = "${host || "http://localhost:11434"}";
  const response = await fetch(\`\${host}/api/chat\`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "${modelId}",
      messages: [
        { role: "system", content: ${JSON.stringify(systemInstruction || "You are a helpful AI assistant.")} },
        { role: "user", content: ${JSON.stringify(prompt || "Hello world!")} }
      ],
      options: {
        temperature: ${params.temperature},
        top_p: ${params.topP},
        top_k: ${params.topK},
        num_predict: ${params.maxOutputTokens},
        repeat_penalty: ${params.repeatPenalty}
      },
      stream: false
    })
  });

  const data = await response.json();
  console.log("Response:", data.message.content);
}

runLocalPrompt();
`;

    case "curl":
      return `curl -X POST ${host || "http://localhost:11434"}/api/chat \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${modelId}",
    "messages": [
      {"role": "system", "content": ${JSON.stringify(systemInstruction || "You are a helpful AI assistant.")}},
      {"role": "user", "content": ${JSON.stringify(prompt || "Explain quantum computing in simple terms.")}}
    ],
    "options": {
      "temperature": ${params.temperature},
      "top_p": ${params.topP}
    },
    "stream": false
  }'`;

    case "ollama_cli":
      return `# Run directly in your terminal with 0 latency & 0 cost:
ollama run ${modelId} "${(prompt || "Hello!").replace(/"/g, '\\"')}"`;

    case "openai_format":
      return `// OpenAI SDK Compatible (LM Studio / vLLM / Ollama v1 endpoint)
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "${host ? `${host}/v1` : "http://localhost:11434/v1"}",
  apiKey: "ollama-local-key", // No API key required for local execution
});

async function main() {
  const completion = await client.chat.completions.create({
    model: "${modelId}",
    messages: [
      { role: "system", content: ${JSON.stringify(systemInstruction || "")} },
      { role: "user", content: ${JSON.stringify(prompt || "")} },
    ],
    temperature: ${params.temperature},
    max_tokens: ${params.maxOutputTokens},
  });

  console.log(completion.choices[0].message.content);
}

main();`;
  }
}
