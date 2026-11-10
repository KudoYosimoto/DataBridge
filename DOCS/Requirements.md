# DataBridge — Requirements Specification

## 1. Project Overview

DataBridge is a command-line application for reading, validating, transforming, and converting structured data between different file formats.

## 2. Supported Input and Output Formats

- CSV
- JSON
- XML
- Excel (.xlsx)

The application detects input format automatically by file extension.

## 3. Functional Requirements

### 3.1 Data Reading
- Read CSV files with or without headers.
- Support configurable CSV delimiters.
- Read JSON arrays containing flat objects.
- Read XML files with flat record structures.
- Read Excel workbooks.
- Support configurable Excel sheet names.

### 3.2 Data Validation
- Required fields.
- Data types: string, integer, float, date, boolean.
- Minimum and maximum values.
- Minimum and maximum string lengths.
- Regular expression patterns.
- Unique field values.

### 3.3 Data Transformation
- Rename fields using mapping.
- Convert strings to uppercase.
- Convert strings to lowercase.
- Trim whitespace.
- Replace values using dictionaries.
- Convert timestamps to dates.

### 3.4 Data Conversion
- Convert between all supported formats.
- Exclude invalid records from converted output.
- Preserve valid record values and supported data types.

### 3.5 Error Handling
- Save invalid records and validation errors to errors.csv.
- Display readable error messages.
- Generate an HTML validation report.

### 3.6 CLI Commands

- `databridge convert` — convert files.
- `databridge validate` — validate input data.
- `databridge stats` — display file statistics.

## 4. Non-Functional Requirements

- Node.js 22.12 or newer.
- Modular architecture.
- Separation of responsibilities.
- Asynchronous file operations where appropriate.
- Clear error handling.
- Automated unit and integration tests.
- No database required.

## 5. Project Constraints

- Input data is processed locally.
- JSON and XML support flat structures only.
- Excel support is limited to XLSX files.
- Configuration is provided in YAML or JSON.
