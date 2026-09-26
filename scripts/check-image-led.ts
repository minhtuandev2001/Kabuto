import assert from "node:assert/strict";
import { isImageLedJlpt } from "../src/lib/grammar";

assert.equal(isImageLedJlpt("N3"), false);
assert.equal(isImageLedJlpt("N2"), false);
assert.equal(isImageLedJlpt("N5"), false);
console.log("check:image-led ok");
