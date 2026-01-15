# translate-gen

A small Node.js CLI tool that converts a plain-text file into an i18n dictionary.

The tool processes the input **line by line**, generates stable translation keys, and outputs a valid JSON file (or a JS module). It is designed for quickly transforming raw translation drafts into structured dictionaries.

---

## Features

- Stream-based, line-by-line processing (memory efficient)
- Translation keys are generated **from cleaned values**
- Optional parsing of `key: value` and `key=value`
- Parsing is performed **only if the entire line is NOT wrapped in quotes**
- Unicode-safe key generation (Cyrillic and other scripts are preserved)
- Automatic key de-duplication (`key`, `key_2`, `key_3`, …)
- Output formats:
  - JSON (default)
  - JavaScript module (`export default { ... }`)
- Optional pretty-printed output

---

## How It Works

### 1. Key generation from value

By default, quotes (`' " « »`) are removed from the value, then:

- text is lowercased
- punctuation and symbols are removed
- spaces are replaced with `_`
- Unicode letters and numbers are preserved

Examples:

- `Hello World` → `hello_world`
- `Order completed!` → `order_completed`
- `Привет мир` → `привет_мир`

---

### 2. Parsing `key: value` / `key=value`

If a line is **not wrapped in quotes**, the tool attempts to parse it as:

- `key: value`
- `key = value`

Examples:

```
user.profile.title: “Profile title”
order_completed = Order completed!
```

Result:

```json
{
  "user.profile.title": "Profile title",
  "order_completed": "Order completed!"
}
```

If the line is wrapped in quotes, parsing is skipped and the entire line is treated as a value:

```
"user.profile.title = Profile title"
```

This line will be processed as a plain value and its key will be generated automatically.

---

### 3. Duplicate keys

If a generated or parsed key already exists, a numeric suffix is added:

```
hello_world
hello_world_2
hello_world_3
```

---

## Usage

### Default

```bash
node translate-gen.js
```
- Input file: translates.txt
- Output file: new_translates.json

---

### Specify input and output

```bash
node translate-gen.js --in translates.txt --out new_translates.json --pretty
```

---

### Specify base directory

Useful when translation files are stored in a different folder:

```bash
node translate-gen.js --base ./i18n --in raw.txt --out en.json --pretty
```

---

### Output as a JS module

```bash
node translate-gen.js --in raw.txt --out dict.js --mode js --pretty
```

---

## CLI Options

- --in, -i — input file (default: translates.txt)
- --out, -o — output file (default: new_translates.json)
- --base, -b — base directory for input/output paths (default: current directory)
- --mode, -m — output format: json or js (default: json)
-	--pretty — pretty-print JSON output (2 spaces)
-	--no-remove-quotes — keep quotes in values
-	--help, -h — show help

---

## Tests

The project uses the built-in Node.js test runner (node:test) — no external dependencies.

```bash
npm test
```

Tests are intentionally minimal and focus on:
- key generation
- value sanitization
- key/value parsing rules
- duplicate key handling

⸻

## Requirements

- Node.js >= 18
