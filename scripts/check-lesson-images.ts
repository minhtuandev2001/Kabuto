import assert from "node:assert/strict";
import { swapImageUrls } from "../src/lib/swap-image-urls";

const base = ["a", "b", "c"];
const swapped = swapImageUrls(base, 0, 2);
assert.equal(swapped.join(","), "c,b,a");
assert.equal(base.join(","), "a,b,c");
assert.equal(swapImageUrls(base, 1, 1).join(","), "a,b,c");
assert.equal(swapImageUrls(base, -1, 0).join(","), "a,b,c");
console.log("check:lesson-images ok");
