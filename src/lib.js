"use strict";

/**
 * Checks whether a string is wrapped in quotes: "..." / '...' / «...»
 */
function isWrappedInQuotes(s) {
  const t = String(s ?? "").trim();
  if (t.length < 2) return false;

  const first = t[0];
  const last = t[t.length - 1];

  const pairs = new Map([
    ['"', '"'],
    ["'", "'"],
    ["«", "»"],
  ]);

  return pairs.has(first) && pairs.get(first) === last;
}

/**
 * Removes quotes ' " « » from the string (if enabled).
 * Returns "" for empty strings.
 */
function sanitizeValue(line, removeQuotes) {
  const trimmed = String(line ?? "").trim();
  if (!trimmed) return "";
  if (!removeQuotes) return trimmed;
  return trimmed.replace(/['"«»]/g, "");
}

/**
 * Generation of a key from the "cleaned value" (your requirement):
 * - Unicode-safe: preserves letters/digits (including Cyrillic)
 * - removes punctuation/symbols
 * - spaces -> underscore
 * - collapses underscores
 */
function slugifyToKeyFromValue(cleanValue) {
  const normalized = String(cleanValue ?? "")
    .normalize("NFKD")
    .toLowerCase();

  const cleaned = normalized.replace(/[^\p{L}\p{N}\s]+/gu, " ");

  const underscored = cleaned
    .trim()
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_+|_+$/g, "");

  return underscored.length ? underscored : "key";
}

/**
 * Normalization of a key that comes in the format key:value or key=value:
 * - lowercases
 * - spaces -> underscore
 * - allows: unicode letters/numbers, underscore, dot
 * - others -> underscore
 * - trims edges
 */
function normalizeProvidedKey(rawKey) {
  const k = String(rawKey ?? "")
    .trim()
    .normalize("NFKD")
    .toLowerCase();
  if (!k) return "";

  const spaced = k.replace(/\s+/g, "_");
  const cleaned = spaced.replace(/[^\p{L}\p{N}_.]+/gu, "_");

  return cleaned
    .replace(/_+/g, "_")
    .replace(/^\.+|\.+$/g, "")
    .replace(/^_+|_+$/g, "");
}

/**
 * Deduplication of keys: key, key_2, key_3...
 */
function ensureUniqueKey(baseKey, usedKeys) {
  if (!usedKeys.has(baseKey)) {
    usedKeys.add(baseKey);
    return baseKey;
  }
  let i = 2;
  while (usedKeys.has(`${baseKey}_${i}`)) i++;
  const k = `${baseKey}_${i}`;
  usedKeys.add(k);
  return k;
}

/**
 * Attempts to parse "key: value" or "key = value"
 * IMPORTANT: call only if the line is NOT wrapped in quotes (this is a CLI rule).
 */
function tryParseKeyValue(line) {
  const t = String(line ?? "").trim();
  if (!t) return null;

  const colonIdx = t.indexOf(":");
  const eqIdx = t.indexOf("=");

  if (colonIdx === -1 && eqIdx === -1) return null;

  let idx;
  if (colonIdx !== -1 && eqIdx !== -1) idx = Math.min(colonIdx, eqIdx);
  else idx = colonIdx !== -1 ? colonIdx : eqIdx;

  const left = t.slice(0, idx).trim();
  const right = t.slice(idx + 1).trim();

  if (!left || !right) return null;

  return { key: left, value: right };
}

/**
 * Main function to transform a single line into a dictionary entry.
 *
 * Rules:
 * - if the string is empty -> null
 * - if the string is NOT in quotes -> try to parse key:value / key=value
 *   - on success: key = normalizeProvidedKey(key), value = sanitizeValue(value)
 * - otherwise: generate a key from the cleanedWholeValue (sanitizeValue of the entire line)
 *
 * Returns:
 *   { key, value, mode: "parsed"|"auto" } or null
 */
function convertLineToEntry(line, options, usedKeys) {
  const removeQuotes = options?.removeQuotes !== false;
  const raw = String(line ?? "").trim();
  if (!raw) return null;

  const quoted = isWrappedInQuotes(raw);

  if (!quoted) {
    const parsed = tryParseKeyValue(raw);
    if (parsed) {
      const providedKey = normalizeProvidedKey(parsed.key);
      const cleanedValue = sanitizeValue(parsed.value, removeQuotes);

      if (providedKey && cleanedValue) {
        const finalKey = ensureUniqueKey(providedKey, usedKeys);
        return { key: finalKey, value: cleanedValue, mode: "parsed" };
      }
      // if the key/value are invalid — fall back to the auto-branch
    }
  }

  const cleanedWholeValue = sanitizeValue(raw, removeQuotes);
  if (!cleanedWholeValue) return null;

  const baseKey = slugifyToKeyFromValue(cleanedWholeValue);
  const finalKey = ensureUniqueKey(baseKey, usedKeys);

  return { key: finalKey, value: cleanedWholeValue, mode: "auto" };
}

module.exports = {
  isWrappedInQuotes,
  sanitizeValue,
  slugifyToKeyFromValue,
  normalizeProvidedKey,
  ensureUniqueKey,
  tryParseKeyValue,
  convertLineToEntry,
};
