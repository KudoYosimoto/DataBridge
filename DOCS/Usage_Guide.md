# DataBridge — Usage Guide

## 1. Installation

Requirements:
- Node.js 22.12 or newer
- npm

Install project dependencies:

```bash
npm install
```

## 2. Available Commands

Display help:

```bash
node src/index.js --help
```

Display version:

```bash
node src/index.js --version
```

## 3. Validate a File

Use the default configuration:

```bash
node src/index.js validate samples/input/users.csv
```

Specify a configuration file:

```bash
node src/index.js validate samples/input/users.csv --config samples/configs/users.yaml
```

Specify report destinations:

```bash
node src/index.js validate samples/input/users.csv \
  --config samples/configs/users.yaml \
  --errors reports/errors.csv \
  --report reports/validation-report.html
```

## 4. Convert a File

Convert CSV to JSON:

```bash
node src/index.js convert samples/input/users.csv \
  --to json \
  --config samples/configs/users.yaml \
  --output samples/output/users.json
```

Convert JSON to CSV:

```bash
node src/index.js convert samples/input/users.json \
  --to csv \
  --config samples/configs/users.yaml \
  --output samples/output/users.csv
```

Convert CSV to Excel:

```bash
node src/index.js convert samples/input/users.csv \
  --to xlsx \
  --config samples/configs/users.yaml \
  --output samples/output/users.xlsx
```

Supported output formats:
- csv
- json
- xml
- xlsx

## 5. Display File Statistics

```bash
node src/index.js stats samples/input/users.csv
```

The command displays:
- File name
- Detected format
- Number of records
- Number of fields
- Field names

## 6. Output Files

DataBridge can generate:

- Converted output files.
- `errors.csv` containing invalid records and validation errors.
- HTML validation reports.

## 7. Running Tests

Run all tests:

```bash
npm test
```

Run a specific test file:

```bash
node --test tests/readers/csvReader.test.js
```

## 8. Troubleshooting

### Unsupported file format

Check that the input file uses a supported extension.

### Invalid configuration

Check the YAML or JSON syntax and verify that validation rules match field types.

### Invalid records

Review `errors.csv` and the HTML report for details.

### Missing input file

Verify the input path and file permissions.


## CSV input options

The `validate` and `convert` commands accept CSV options:

```bash
databridge validate samples/valid.csv --config config/assignment-example.yaml --delimiter ";"
databridge validate samples/headerless.csv --config config/assignment-example.yaml --no-header --headers "id,name,email,age,birth_date"
databridge convert samples/valid.csv --to json --config config/assignment-example.yaml --output samples/output/valid.json
```

`--delimiter` must be one character. When `--no-header` is used, provide `--headers` to define field names; otherwise generated names `column_1`, `column_2`, etc. are used.
