# DataBridge User Manual

## 1. Introduction

DataBridge is a command-line tool for validating, transforming, and converting structured data files.

It supports the following formats:

- CSV
- JSON
- XML
- Excel (`.xlsx`)

The application detects the input format automatically based on the file extension.

## 2. System Requirements

Before using DataBridge, make sure that you have:

- Windows, Linux, or macOS
- Node.js version 20 or later
- npm

## 3. Installation

1. Download or clone the DataBridge project.
2. Open a terminal in the project directory.
3. Install the dependencies:

```bash
npm install
```

4. Check that the application starts:

```bash
node src/index.js --help
```

## 4. Command-Line Interface

DataBridge provides three main commands:

- `convert` — validates, transforms, and converts a file.
- `validate` — validates records without converting them.
- `stats` — displays basic information about a file.

### 4.1. Help

Display available commands and options:

```bash
node src/index.js --help
```

Display help for a specific command:

```bash
node src/index.js convert --help
node src/index.js validate --help
node src/index.js stats --help
```

### 4.2. Validate a File

Validate a file using the default configuration:

```bash
node src/index.js validate samples/input/users.csv
```

Use a custom configuration:

```bash
node src/index.js validate samples/input/products.json --config samples/configs/products.json
```

The command displays:

- Total number of records
- Number of valid records
- Number of invalid records
- Validation errors

Invalid records are excluded from conversion output.

### 4.3. Convert a File

Convert a file to another format:

```bash
node src/index.js convert samples/input/users.csv --to json
```

Specify a configuration and output path:

```bash
node src/index.js convert samples/input/users.csv --to json --config config/schema.yaml --output samples/output/users.json
```

Convert JSON to CSV:

```bash
node src/index.js convert samples/input/products.json --to csv --config samples/configs/products.json --output samples/output/products.csv
```

Supported output formats:

- `csv`
- `json`
- `xml`
- `xlsx`

The conversion process includes validation, field mapping, and configured transformations.

### 4.4. Display File Statistics

Display information about an input file:

```bash
node src/index.js stats samples/input/users.csv
```

The command displays the detected format, record count, field count, and field names.

## 5. Configuration

DataBridge uses YAML or JSON configuration files.

A configuration contains three optional or required sections:

- `fields` — validation rules for fields.
- `mapping` — field renaming rules.
- `transformations` — data transformation rules.

### 5.1. Example Configuration

```yaml
fields:
  name:
    type: string
    required: true
    min_length: 2
    max_length: 50

  email:
    type: string
    required: true
    pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$'
    unique: true

  age:
    type: integer
    required: true
    min: 18
    max: 100

mapping:
  name: fullName

transformations:
  fullName:
    type: trim

  email:
    type: lowercase
```

### 5.2. Supported Data Types

- `string`
- `integer`
- `float`
- `date`
- `boolean`

### 5.3. Supported Validation Rules

| Rule | Description |
|---|---|
| `required` | The field must contain a value |
| `min` | Minimum numeric value or date |
| `max` | Maximum numeric value or date |
| `min_length` | Minimum string length |
| `max_length` | Maximum string length |
| `pattern` | Regular expression validation |
| `unique` | Values must be unique across records |

### 5.4. Supported Transformations

| Transformation | Description |
|---|---|
| `uppercase` | Converts text to uppercase |
| `lowercase` | Converts text to lowercase |
| `trim` | Removes leading and trailing whitespace |
| `replace` | Replaces values using a dictionary |
| `timestampToDate` | Converts a timestamp to a date |

## 6. Reports and Output Files

DataBridge can generate the following files:

- Converted output file — contains valid converted records.
- `errors.csv` — contains validation errors and related record information.
- HTML report — contains validation statistics and error details.

The output and report paths can be configured through command-line options where supported.

## 7. Error Handling

DataBridge reports errors for situations such as:

- Unsupported file extensions
- Missing input files
- Invalid configuration files
- Incorrect data formats
- Invalid field values
- Unsupported nested data structures

Error messages are displayed in the terminal. Invalid records are excluded from converted output.

## 8. Running Tests

Run the complete automated test suite:

```bash
npm test
```

The project uses Node.js built-in test runner and `node:assert/strict`.

## 9. Troubleshooting

**Problem: Node.js is not recognized.**

Install Node.js 22.12 or later and restart the terminal.

**Problem: Dependencies are missing.**

Run:

```bash
npm install
```

**Problem: Configuration file is invalid.**

Check the YAML indentation or JSON syntax. Verify that field types and validation rules are supported.

**Problem: Input file cannot be found.**

Check the file path and make sure the file exists.

**Problem: Output file is not created.**

Check the output path and ensure that the application has permission to write to the destination directory.

## 10. Additional Documentation

For more information, see:

- `Requirements.md` — project requirements
- `Architecture.md` — system architecture
- `Config_Spec.md` — configuration specification
- `Usage_Guide.md` — command usage examples
- `Test_Plan.md` — testing strategy
- `Test_Report.md` — testing results


## CSV-specific options

Both `validate` and `convert` support `--delimiter <char>`, `--no-header`, and `--headers <comma-separated-names>`. Example:

```bash
databridge validate samples/valid.csv --config config/assignment-example.yaml --delimiter ";"
databridge validate samples/headerless.csv --config config/assignment-example.yaml --no-header --headers "id,name,email,age,birth_date"
```
