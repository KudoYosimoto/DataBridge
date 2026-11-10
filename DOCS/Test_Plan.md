# DataBridge — Test Plan

## 1. Purpose

The purpose of this test plan is to verify the correctness, reliability, and integration of DataBridge components.

Testing covers individual modules, interactions between modules, and command-line workflows.

## 2. Testing Environment

- Runtime: Node.js 22.12 or newer
- Language: JavaScript ES Modules
- Test framework: Node.js built-in test runner (`node:test`)
- Assertions: `node:assert/strict`
- Operating system: Windows / Linux (portable Node.js CLI)
- Dependencies: project dependencies listed in package.json

## 3. Testing Types

### 3.1 Unit Testing

Individual modules are tested independently.

Modules covered:
- CSV, JSON, XML, and Excel readers
- CSV, JSON, XML, and Excel writers
- Configuration loader
- Validation rules and validator
- Mapper and transformer
- Converter
- Console, HTML, and error reporters
- Format detector
- Utility modules

### 3.2 Integration Testing

Integration tests verify that different modules work together.

The format round-trip tests cover all 16 combinations of:
- CSV
- JSON
- XML
- XLSX

Each test:
1. Creates a source file.
2. Reads the source file.
3. Writes the records in the target format.
4. Reads the converted file.
5. Compares the resulting records with the original data.

### 3.3 CLI Testing

CLI tests execute the actual application through a separate Node.js process.

Commands tested:
- `stats`
- `validate`
- `convert`

Additional checks:
- Unsupported output formats.
- Output file creation.
- Error CSV generation.
- HTML report generation.
- Correct exit codes.

## 4. Test Scenarios

| ID | Component | Test scenario | Expected result |
|---|---|---|---|
| TP-01 | CSV Reader | Read CSV with headers | Records returned |
| TP-02 | CSV Reader | Read CSV without headers | Records returned |
| TP-03 | JSON Reader | Read flat JSON array | Records returned |
| TP-04 | JSON Reader | Reject nested objects | Error returned |
| TP-05 | XML Reader | Read multiple records | Records returned |
| TP-06 | XML Reader | Read empty root element | Empty array returned |
| TP-07 | Excel Reader | Read XLSX workbook | Records returned |
| TP-08 | Writers | Write supported formats | Files created |
| TP-09 | Validator | Validate required fields | Invalid records detected |
| TP-10 | Validator | Validate unique values | Duplicates detected |
| TP-11 | Validator | Validate numeric limits | Out-of-range values rejected |
| TP-12 | Mapper | Rename fields | New field names returned |
| TP-13 | Transformer | Apply transformations | Values transformed |
| TP-14 | Converter | Normalize data types | Correct types returned |
| TP-15 | Integration | Convert between formats | Data preserved |
| TP-16 | CLI | Execute stats | Statistics displayed |
| TP-17 | CLI | Execute validate | Validation reports created |
| TP-18 | CLI | Execute convert | Output file created |
| TP-19 | CLI | Unsupported output format | Readable error returned |
| TP-20 | Config Loader | Load fields as an array of named rules | Normalized field map returned |
| TP-21 | Config Loader | Reject duplicate names in fields array | Configuration error returned |
| TP-22 | Error Reporter | Run validation with zero invalid records | Old errors file replaced with header-only CSV |
| TP-23 | Validator | Validate date using YYYY-MM-DD format | Valid date accepted, invalid date rejected |
| TP-24 | CLI | Read semicolon CSV without headers and with supplied names | Records parsed using CLI options |

## 5. Test Execution

Run all tests:

```bash
npm test
```

Run a specific test file:

```bash
node --test tests/cli/commands.test.js
```

## 6. Acceptance Criteria

- All automated tests pass.
- Supported formats can be read and written.
- Invalid records are excluded from converted output.
- Validation errors are reported.
- All CLI commands execute correctly.
- Integration tests preserve supported data values and types.
