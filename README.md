# DataBridge

**DataBridge** is a command-line application for reading, validating, transforming, and converting structured data files between different formats.

The project is built with JavaScript and Node.js using a modular architecture.

## Features

- **Multiple formats:** CSV, JSON, XML, and Excel (`.xlsx`).
- **Automatic format detection:** identifies input formats by file extension.
- **Data validation:** checks required fields, types, ranges, string lengths, regular expressions, and unique values.
- **Field mapping:** renames fields according to configuration.
- **Data transformations:** uppercase, lowercase, trim, dictionary replacement, and timestamp-to-date conversion.
- **Format conversion:** converts data between supported input and output formats.
- **Error handling:** excludes invalid records from converted output and saves validation errors separately.
- **Reporting:** provides console summaries, CSV error reports, and HTML reports.
- **Command-line interface:** supports `convert`, `validate`, and `stats` commands.

## Supported Formats

| Format | Read | Write |
|---|---:|---:|
| CSV | Yes | Yes |
| JSON | Yes | Yes |
| XML | Yes | Yes |
| Excel (`.xlsx`) | Yes | Yes |

## Requirements

- Node.js 22.12 or later
- npm

## Installation

Clone or download the repository and open its directory in a terminal.

Install dependencies:

```bash
npm install
```

Check the available commands:

```bash
node src/index.js --help
```

## Usage

### 1. Validate a file

Validate a CSV file using the default configuration:

```bash
node src/index.js validate samples/input/users.csv
```

Use a custom configuration:

```bash
node src/index.js validate samples/input/products.json --config samples/configs/products.json
```

### 2. Convert a file

Convert CSV to JSON:

```bash
node src/index.js convert samples/input/users.csv --to json --config config/schema.yaml --output samples/output/users.json
```

Convert JSON to CSV:

```bash
node src/index.js convert samples/input/products.json --to csv --config samples/configs/products.json --output samples/output/products.csv
```

Other supported output formats are `xml` and `xlsx`.

### 3. Display file statistics

```bash
node src/index.js stats samples/input/users.csv
```

### 4. Display command help

```bash
node src/index.js --help
node src/index.js convert --help
node src/index.js validate --help
node src/index.js stats --help
```

## Configuration

DataBridge supports YAML and JSON configuration files.

A configuration consists of three sections:

- `fields` — validation rules.
- `mapping` — field renaming.
- `transformations` — data transformations.

Example:

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

Supported data types:

- `string`
- `integer`
- `float`
- `date`
- `boolean`

Supported validation rules:

- `required`
- `min`
- `max`
- `min_length`
- `max_length`
- `pattern`
- `unique`

Supported transformations:

- `uppercase`
- `lowercase`
- `trim`
- `replace`
- `timestampToDate`

See [DOCS/Config_Spec.md](DOCS/Config_Spec.md) for the complete specification.

## Reports

DataBridge generates:

- A converted output file containing valid records.
- `errors.csv` containing validation errors.
- An HTML report containing validation statistics and error details.
- A console summary.

## Testing

The project uses Node.js built-in test runner.

Run all tests:

```bash
npm test
```

The test suite covers individual modules, format round trips, and CLI commands.

## Project Structure

```text
DataBridge/
├── src/
│   ├── readers/
│   ├── writers/
│   ├── validators/
│   ├── converters/
│   ├── reporters/
│   ├── cli/
│   ├── utils/
│   └── index.js
├── tests/
│   ├── readers/
│   ├── writers/
│   ├── validators/
│   ├── converters/
│   ├── reporters/
│   ├── cli/
│   └── integration/
├── samples/
│   ├── input/
│   ├── output/
│   └── configs/
├── config/
├── DOCS/
├── reports/
├── README.md
├── TEAM.md
├── CONTRIBUTIONS.md
└── package.json
```

## Documentation

Additional project documentation:

| Document | Description |
|---|---|
| [Requirements](DOCS/Requirements.md) | Functional and non-functional requirements |
| [Architecture](DOCS/Architecture.md) | Application architecture and data flow |
| [Config Specification](DOCS/Config_Spec.md) | Configuration format and validation rules |
| [Usage Guide](DOCS/Usage_Guide.md) | Command usage examples |
| [User Manual](DOCS/User_Manual.md) | Instructions for application users |
| [Test Plan](DOCS/Test_Plan.md) | Testing strategy and scenarios |
| [Test Report](DOCS/Test_Report.md) | Test execution results |
| [Team](TEAM.md) | Project organization |
| [Contributions](CONTRIBUTIONS.md) | Development standards |

## Architecture Principles

DataBridge follows these principles:

- Single Responsibility Principle
- Separation of concerns
- Modular architecture
- Reusable components
- Centralized format detection
- Consistent error handling
- Automated testing

## Limitations

- JSON input must be an array of flat objects.
- XML input must use a flat record structure.
- Nested data structures are not supported.
- Excel support is limited to `.xlsx`.
- Validation rules are defined through YAML or JSON configuration files.

## Project Status

The project includes the main readers, writers, validators, converters, reporters, CLI commands, and automated tests.

Final verification and documentation review are part of the project completion process.

## License

This project was developed for educational purposes.


## CSV options

`validate` and `convert` support `--delimiter <char>`, `--no-header`, and `--headers <name1,name2,...>` for headerless CSV files. Example:

```bash
node src/index.js validate samples/valid.csv --config config/assignment-example.yaml --delimiter ";"
node src/index.js validate samples/headerless.csv --config config/assignment-example.yaml --no-header --headers "id,name,email,age,birth_date"
```

A configuration example matching the assignment's `fields` array format is available at `config/assignment-example.yaml`.
