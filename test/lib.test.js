"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const {
  isWrappedInQuotes,
  sanitizeValue,
  slugifyToKeyFromValue,
  normalizeProvidedKey,
  tryParseKeyValue,
  ensureUniqueKey,
  convertLineToEntry,
} = require("../src/lib");

test("isWrappedInQuotes()", () => {
  assert.equal(isWrappedInQuotes('"Hello"'), true);
  assert.equal(isWrappedInQuotes("'Hello'"), true);
  assert.equal(isWrappedInQuotes("«Hello»"), true);

  assert.equal(isWrappedInQuotes('"Hello'), false);
  assert.equal(isWrappedInQuotes("Hello'"), false);
  assert.equal(isWrappedInQuotes("Hello"), false);
  assert.equal(isWrappedInQuotes(""), false);
  assert.equal(isWrappedInQuotes("   "), false);
});

test("sanitizeValue()", () => {
  assert.equal(sanitizeValue(' "Hello" ', true), "Hello");
  assert.equal(sanitizeValue("«Привет»", true), "Привет");
  assert.equal(sanitizeValue("'Hi'", true), "Hi");
  assert.equal(sanitizeValue("   ", true), "");

  // when removeQuotes=false
  assert.equal(sanitizeValue(' "Hello" ', false), '"Hello"');
});

test("slugifyToKeyFromValue()", () => {
  assert.equal(slugifyToKeyFromValue("Hello World"), "hello_world");
  assert.equal(slugifyToKeyFromValue("Order completed!"), "order_completed");
  assert.equal(slugifyToKeyFromValue("Привет мир"), "привет_мир");

  // if everything is removed -> fallback
  assert.equal(slugifyToKeyFromValue("!!!"), "key");
});

test("normalizeProvidedKey()", () => {
  assert.equal(
    normalizeProvidedKey("User.Profile.Title"),
    "user.profile.title",
  );
  assert.equal(
    normalizeProvidedKey("  auth login title  "),
    "auth_login_title",
  );
  assert.equal(normalizeProvidedKey("a/b/c"), "a_b_c");
  assert.equal(normalizeProvidedKey(""), "");
});

test("tryParseKeyValue()", () => {
  assert.deepEqual(tryParseKeyValue("a: b"), { key: "a", value: "b" });
  assert.deepEqual(tryParseKeyValue("a=b"), { key: "a", value: "b" });
  assert.deepEqual(tryParseKeyValue("a :   b  "), { key: "a", value: "b" });

  assert.equal(tryParseKeyValue("no separator here"), null);
  assert.equal(tryParseKeyValue("a:"), null);
  assert.equal(tryParseKeyValue("=b"), null);
});

test("ensureUniqueKey()", () => {
  const used = new Set();
  assert.equal(ensureUniqueKey("k", used), "k");
  assert.equal(ensureUniqueKey("k", used), "k_2");
  assert.equal(ensureUniqueKey("k", used), "k_3");
});

test("convertLineToEntry(): parses key:value when line NOT wrapped in quotes", () => {
  const used = new Set();
  const entry = convertLineToEntry(
    'hello_world: "Hello World"',
    { removeQuotes: true },
    used,
  );

  assert.deepEqual(entry, {
    key: "hello_world",
    value: "Hello World",
    mode: "parsed",
  });
});

test("convertLineToEntry(): parses key=value when line NOT wrapped in quotes", () => {
  const used = new Set();
  const entry = convertLineToEntry(
    "user.profile.title = Profile title",
    { removeQuotes: true },
    used,
  );

  assert.deepEqual(entry, {
    key: "user.profile.title",
    value: "Profile title",
    mode: "parsed",
  });
});

test("convertLineToEntry(): does NOT parse when whole line wrapped in quotes", () => {
  const used = new Set();
  const entry = convertLineToEntry(
    '"user.profile.title = Profile title"',
    { removeQuotes: true },
    used,
  );

  // Entire line is treated as value; key is generated from cleaned value.
  assert.deepEqual(entry, {
    key: "userprofiletitle_profile_title",
    value: "user.profile.title = Profile title",
    mode: "auto",
  });
});

test("convertLineToEntry(): auto-generates key from cleaned value", () => {
  const used = new Set();
  const entry = convertLineToEntry(
    "Order completed!",
    { removeQuotes: true },
    used,
  );

  assert.deepEqual(entry, {
    key: "order_completed",
    value: "Order completed!",
    mode: "auto",
  });
});

test("convertLineToEntry(): deduplicates auto keys", () => {
  const used = new Set();

  const e1 = convertLineToEntry("Hello World", { removeQuotes: true }, used);
  const e2 = convertLineToEntry("Hello World", { removeQuotes: true }, used);

  assert.deepEqual(e1, {
    key: "hello_world",
    value: "Hello World",
    mode: "auto",
  });
  assert.deepEqual(e2, {
    key: "hello_world_2",
    value: "Hello World",
    mode: "auto",
  });
});
