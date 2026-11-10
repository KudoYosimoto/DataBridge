# DataBridge — Configuration Specification

## 1. Overview

DataBridge uses YAML or JSON configuration files to define validation rules, field mappings, and transformations.

A configuration file contains three main sections:

- `fields`
- `mapping`
- `transformations`

## 2. Fields Section

The `fields` section defines validation rules for input fields.

Example:

```yaml
fields:
  name:
    type: string
    required: true
    min_length: 2
    max_length: 50

  age:
    type: integer
    required: true
    min: 18
    max: 100
```

### Supported Data Types

| Type | Description |
|---|---|
| string | Text value |
| integer | Whole number |
| float | Decimal number |
| date | Date in YYYY-MM-DD format |
| boolean | true or false |

### Supported Validation Rules

| Rule | Description |
|---|---|
| required | Field must contain a value |
| min | Minimum numeric value or date |
| max | Maximum numeric value or date |
| min_length | Minimum string length |
| max_length | Maximum string length |
| pattern | Regular expression validation |
| unique | Value must be unique across records |

Rules must be compatible with the declared field type.

## 3. Mapping Section

The `mapping` section renames fields.

Example:

```yaml
mapping:
  name: fullName
  phone: phoneNumber
```

The left side is the original field name. The right side is the new field name.

Target field names must be unique.

## 4. Transformations Section

The `transformations` section defines operations applied to field values.

Example:

```yaml
transformations:
  fullName:
    type: trim

  email:
    type: lowercase
```

### Supported Transformations

| Transformation | Description |
|---|---|
| uppercase | Converts text to uppercase |
| lowercase | Converts text to lowercase |
| trim | Removes leading and trailing whitespace |
| replace | Replaces values using a dictionary |
| timestampToDate | Converts timestamps to dates |

### Dictionary Replacement Example

```yaml
transformations:
  status:
    type: replace
    dictionary:
      active: Enabled
      inactive: Disabled
```

## 5. Complete Configuration Example

```yaml
fields:
  name:
    type: string
    required: true
    min_length: 2

  email:
    type: string
    required: true
    unique: true

mapping:
  name: fullName

transformations:
  fullName:
    type: trim

  email:
    type: lowercase
```

## 6. Configuration Formats

Supported extensions:

- `.yaml`
- `.yml`
- `.json`

Invalid configuration files produce readable errors.


## Compatibility with the assignment example

The loader accepts both supported layouts. The assignment layout uses an array of objects:

```yaml
fields:
  - name: id
    type: integer
    required: true
    unique: true
  - name: birth_date
    type: date
    format: "YYYY-MM-DD"
```

The loader normalizes this layout internally to the same field-name map used by the original project configuration. Existing map-style configurations remain supported. At present, the supported date format is `YYYY-MM-DD`.

For `timestampToDate`, the optional `unit` setting accepts `seconds` or `milliseconds`; the default is `milliseconds`.
