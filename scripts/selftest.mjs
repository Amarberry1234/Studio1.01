import http from "node:http";
import { spawn } from "node:child_process";

const MOCK_PORT = 11434;
const NOVA_PORT = 32123;

function json(res, status, value) {
  const body = JSON.stringify(value);
  res.writeHead(status, { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) });
  res.end(body);
}

const mock = http.createServer(async (req, res) => {
  let raw = "";
  for await (const chunk of req) raw += chunk;
  let body = {};
  try { body = raw ? JSON.parse(raw) : {}; } catch {}

  if (req.url === "/api/tags" && req.method === "GET") {
    return json(res, 200, { models: [{ name: "mock:latest", model: "mock:latest", size: 123456789, details: { family: "mock", parameter_size: "1B", quantization_level: "Q4" } }] });
  }

  if (req.url === "/api/chat" && req.method === "POST") {
    if (body.stream === false) return json(res, 200, { message: { role: "assistant", content: "mock answer" }, done: true });
    res.writeHead(200, { "Content-Type": "application/x-ndjson" });
    res.write(JSON.stringify({ message: { role: "assistant", content: "mock " }, done: false }) + "\n");
    res.write(JSON.stringify({ message: { role: "assistant", content: "answer" }, done: true }) + "\n");
    return res.end();
  }

  if (req.url === "/api/pull" && req.method === "POST") {
    res.writeHead(200, { "Content-Type": "application/x-ndjson" });
    res.write(JSON.stringify({ status: "success" }) + "\n");
    return res.end();
  }

  if (req.url === "/api/delete" && req.method === "DELETE") return json(res, 200, { status: "success" });
  if (req.url === "/api/create" && req.method === "POST") return json(res, 200, { status: "success" });
  return json(res, 404, { error: "not found" });
});

await new Promise((resolve, reject) => {
  mock.once("error", reject);
  mock.listen(MOCK_PORT, "127.0.0.1", resolve);
});

const nova = spawn(process.execPath, ["dist/server.cjs"], {
  env: { ...process.env, NODE_ENV: "production", NOVA_PORT: String(NOVA_PORT), NOVA_DIST_DIR: "dist", OLLAMA_HOST: `http://127.0.0.1:${MOCK_PORT}` },
  stdio: ["ignore", "pipe", "pipe"],
  windowsHide: true,
});

nova.stdout.on("data", (d) => process.stdout.write(`[nova] ${d}`));
nova.stderr.on("data", (d) => process.stderr.write(`[nova] ${d}`));

async function waitFor(url, timeout = 15000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    try {
      const r = await fetch(url);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`timeout waiting for ${url}`);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

try {
  await waitFor(`http://127.0.0.1:${NOVA_PORT}/api/health`);

  const tagsRes = await fetch(`http://127.0.0.1:${NOVA_PORT}/api/ollama/tags`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: `http://127.0.0.1:${MOCK_PORT}`, model: "missing-model" }),
  });
  const tags = await tagsRes.json();
  assert(tags.online === true, "Ollama tags bridge is offline");
  assert(tags.selectedModel === "mock:latest", `model fallback failed: ${tags.selectedModel}`);

  const chatRes = await fetch(`http://127.0.0.1:${NOVA_PORT}/api/ollama/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ host: `http://127.0.0.1:${MOCK_PORT}`, model: "missing-model", messages: [{ role: "user", content: "hello" }] }),
  });
  const chatText = await chatRes.text();
  assert(chatText.includes("mock") && chatText.includes("answer"), "streaming chat bridge failed");

  const researchRes = await fetch(`http://127.0.0.1:${NOVA_PORT}/api/external-ai/consult`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "test", includeWebSearch: false, host: `http://127.0.0.1:${MOCK_PORT}`, model: "missing-model" }),
  });
  const research = await researchRes.json();
  assert(research.response === "mock answer", "research synthesis did not use working model fallback");

  const autopatch = await (await fetch(`http://127.0.0.1:${NOVA_PORT}/api/autopatch/status`)).json();
  assert(Array.isArray(autopatch.modules), "autopatch status route missing");

  const scripts = await (await fetch(`http://127.0.0.1:${NOVA_PORT}/api/desktop/scripts`)).json();
  assert(Array.isArray(scripts.scripts), "desktop scripts route missing");

  const jira = await (await fetch(`http://127.0.0.1:${NOVA_PORT}/api/integrations/jira`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ summary: "Test", description: "Body" }),
  })).json();
  assert(typeof jira.formattedJiraMarkdown === "string", "Jira response shape mismatch");

  const network = await (await fetch(`http://127.0.0.1:${NOVA_PORT}/api/network/diagnose`)).json();
  assert(Array.isArray(network.checks), "network diagnostic route missing");

  console.log("SELFTEST PASS: runtime routes + Ollama fallback + streaming + research bridge");
} finally {
  nova.kill();
  await new Promise((resolve) => mock.close(resolve));
}
