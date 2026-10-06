import assert from "node:assert/strict";
import { isSameOrderSet, moveItem } from "../src/lib/reorder";

const base = ["a", "b", "c", "d"];
assert.equal(moveItem(base, 0, 2).join(""), "bcad");
assert.equal(moveItem(base, 3, 0).join(""), "dabc");
assert.equal(moveItem(base, 1, 1).join(""), "abcd");
assert.equal(moveItem(base, -1, 2).join(""), "abcd");
assert.equal(base.join(""), "abcd");

assert.equal(isSameOrderSet([3, 1, 2], [1, 2, 3]), true);
assert.equal(isSameOrderSet([1, 2], [1, 2, 3]), false);
assert.equal(isSameOrderSet([1, 1, 3], [1, 2, 3]), false);
assert.equal(isSameOrderSet([1, 2, 4], [1, 2, 3]), false);
assert.equal(isSameOrderSet([1.5, 2], [1.5, 2]), false);
console.log("check:reorder ok");
