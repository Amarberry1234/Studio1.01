const assert = require("assert");
const fs = require("fs/promises");
const os = require("os");
const path = require("path");
const { __test } = require("../electron/code-agent.cjs");

(async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "nova-code-agent-"));
  await fs.mkdir(path.join(root, "src"), { recursive: true });
  await fs.writeFile(path.join(root, "src", "a.ts"), "export const value = 1;\n", "utf8");

  assert.throws(() => __test.safeResolve(root, "../outside.txt"), /hors workspace/);

  const snapshot = await __test.createTaskSnapshot(root);
  const first = await __test.applyOperations(root, [
    { type: "replace", path: "src/a.ts", old: "value = 1", new: "value = 2" },
    { type: "write", path: "src/b.ts", content: "export const b = true;\n" },
  ], snapshot);
  assert.deepStrictEqual(first.changed.sort(), ["src/a.ts", "src/b.ts"]);
  assert.match(await fs.readFile(path.join(root, "src", "a.ts"), "utf8"), /value = 2/);

  await __test.applyOperations(root, [
    { type: "replace", path: "src/a.ts", old: "value = 2", new: "value = 3" },
    { type: "write", path: "src/c.ts", content: "export const c = true;\n" },
  ], snapshot);
  assert.match(await fs.readFile(path.join(root, "src", "a.ts"), "utf8"), /value = 3/);

  await __test.restoreSnapshot(root, snapshot.id);
  assert.match(await fs.readFile(path.join(root, "src", "a.ts"), "utf8"), /value = 1/);
  await assert.rejects(() => fs.access(path.join(root, "src", "b.ts")));
  await assert.rejects(() => fs.access(path.join(root, "src", "c.ts")));

  await assert.rejects(
    () => __test.prepareOperations(root, [{ type: "replace", path: "src/a.ts", old: "not-there", new: "x" }]),
    /n'a pas été trouvé exactement/
  );

  await fs.rm(root, { recursive: true, force: true });
  console.log("NOVA CODE AGENT TEST PASS: sandbox + atomic patches + multi-pass snapshot + undo");
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
