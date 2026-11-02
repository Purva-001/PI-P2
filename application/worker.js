const json = (body, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "access-control-allow-origin": "*"
  }
});
const key = (id) => `task:${id}`;
const PRIORITIES = new Set(["High", "Medium", "Low"]);
const STATUSES = new Set(["Pending", "In Progress", "Completed"]);

async function listTasks(env) {
  const names = [];
  let cursor;
  do {
    const listed = await env.TASKS_KV.list({ prefix: "task:", cursor });
    names.push(...listed.keys.map(({ name }) => name));
    cursor = listed.list_complete ? undefined : listed.cursor;
  } while (cursor);
  const tasks = await Promise.all(names.map((name) => env.TASKS_KV.get(name, "json")));
  return tasks.filter(Boolean).sort((a, b) => b.createdDate.localeCompare(a.createdDate));
}

async function readJson(request) {
  try {
    const body = await request.json();
    return body && typeof body === "object" && !Array.isArray(body) ? body : null;
  } catch {
    return null;
  }
}

function validateInput(input, partial = false) {
  if (!input) return "Request body must be valid JSON.";
  if (!partial && (typeof input.title !== "string" || !input.title.trim())) return "Title is required.";
  if (input.title !== undefined && (typeof input.title !== "string" || !input.title.trim() || input.title.trim().length > 120)) return "Title must be between 1 and 120 characters.";
  if (input.priority !== undefined && !PRIORITIES.has(input.priority)) return "Priority must be High, Medium, or Low.";
  if (input.status !== undefined && !STATUSES.has(input.status)) return "Status is invalid.";
  return null;
}

async function api(request, env, url) {
  const id = url.pathname.split("/").filter(Boolean)[2];
  if (request.method === "GET" && !id) return json(await listTasks(env));
  if (request.method === "GET" && id) {
    const task = await env.TASKS_KV.get(key(id), "json");
    return task ? json(task) : json({ message: "Task not found" }, 404);
  }
  if (request.method === "POST") {
    const input = await readJson(request);
    const error = validateInput(input);
    if (error) return json({ message: error }, 400);
    const task = { id: `T${crypto.randomUUID().slice(0, 6).toUpperCase()}`, title: input.title.trim(), priority: input.priority || "Medium", status: input.status || "Pending", createdDate: new Date().toISOString().slice(0, 10) };
    await env.TASKS_KV.put(key(task.id), JSON.stringify(task));
    return json(task, 201);
  }
  if ((request.method === "PUT" || request.method === "DELETE") && !id) return json({ message: "Task ID is required" }, 400);
  if (request.method === "PUT") {
    const existing = await env.TASKS_KV.get(key(id), "json");
    if (!existing) return json({ message: "Task not found" }, 404);
    const input = await readJson(request);
    const error = validateInput(input, true);
    if (error) return json({ message: error }, 400);
    const task = {
      ...existing,
      ...(input.title === undefined ? {} : { title: input.title.trim() }),
      ...(input.priority === undefined ? {} : { priority: input.priority }),
      ...(input.status === undefined ? {} : { status: input.status }),
      id: existing.id,
      createdDate: existing.createdDate
    };
    await env.TASKS_KV.put(key(id), JSON.stringify(task));
    return json(task);
  }
  if (request.method === "DELETE") {
    await env.TASKS_KV.delete(key(id));
    return json({ message: "Task deleted" });
  }
  return json({ message: "Method not allowed" }, 405);
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname === "/api/tasks" || url.pathname.startsWith("/api/tasks/")) return await api(request, env, url);
      if (env.ASSETS) return env.ASSETS.fetch(request);
      return new Response("Static assets are not configured.", { status: 503 });
    } catch (error) {
      console.error("Unhandled request error", error);
      return json({ message: "Internal server error" }, 500);
    }
  }
};
