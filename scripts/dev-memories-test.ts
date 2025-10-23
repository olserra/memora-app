import * as dev from "../lib/devMemories";

console.log("Listing initial items");
console.log(await dev.listMemories());

console.log("Creating a test memory");
const m = await dev.createMemory({
  title: "test",
  content: "created by test",
} as any);
console.log("created", m);

console.log("Updating the test memory");
const up = await dev.updateMemory(m.id, { title: "updated test" } as any);
console.log("updated", up);

console.log("Deleting the test memory");
const ok = await dev.deleteMemory(m.id);
console.log("deleted", ok);

console.log("Final list");
console.log(await dev.listMemories());
