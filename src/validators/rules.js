
const isMissing = value =>
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '');

export function validateRequired(value, required) {
    if (required && isMissing(value)) {
        return 'Value is required';
    }

    return null;
}

export function validateType(value, type, format = 'YYYY-MM-DD') {
    if (isMissing(value)) {
        return null;
    }

    switch (type) {
        case 'string':
            return typeof value === 'string'
                ? null
                : 'Expected a string';

        case 'integer': {
            const number = typeof value === 'number' ? value : Number(value);

            return Number.isInteger(number)
                ? null
                : 'Expected an integer';
        }

        case 'float': {
            const number = typeof value === 'number' ? value : Number(value);

            return Number.isFinite(number)
                ? null
                : 'Expected a number';
        }

        case 'boolean':
            return typeof value === 'boolean' ||
                (typeof value === 'string' &&
                    ['true', 'false'].includes(value.trim().toLowerCase()))
                ? null
                : 'Expected a boolean';

        case 'date': {
            if (format !== 'YYYY-MM-DD') return `Unsupported date format: ${format}`;
            if (typeof value !== 'string') {
                return 'Expected a date in YYYY-MM-DD format';
            }

            if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
                return 'Expected a date in YYYY-MM-DD format';
            }

            const [year, month, day] = value.split('-').map(Number);
            const date = new Date(Date.UTC(year, month - 1, day));

            const isValid =
                year >= 1000 &&
                date.getUTCFullYear() === year &&
                date.getUTCMonth() === month - 1 &&
                date.getUTCDate() === day;

            return isValid ? null : 'Invalid date';
        }

        default:
            return `Unsupported type: ${type}`;
    }
}

export function validateMinMax(value, min, max, type) {
    if (isMissing(value)) {
        return null;
    }

    let comparableValue;

    if (type === 'date') {
        comparableValue = Date.parse(`${value}T00:00:00Z`);

        if (!Number.isFinite(comparableValue)) {
            return 'Cannot compare an invalid date';
        }
    } else {
        comparableValue = Number(value);

        if (!Number.isFinite(comparableValue)) {
            return 'Cannot compare a non-numeric value';
        }
    }

    if (min !== undefined) {
        const minValue = type === 'date'
            ? Date.parse(`${min}T00:00:00Z`)
            : Number(min);

        if (comparableValue < minValue) {
            return `Value must be greater than or equal to ${min}`;
        }
    }

    if (max !== undefined) {
        const maxValue = type === 'date'
            ? Date.parse(`${max}T00:00:00Z`)
            : Number(max);

        if (comparableValue > maxValue) {
            return `Value must be less than or equal to ${max}`;
        }
    }

    return null;
}

export function validateLength(value, minLength, maxLength) {
    if (isMissing(value)) {
        return null;
    }

    if (typeof value !== 'string') {
        return 'Length validation requires a string';
    }

    if (minLength !== undefined && value.length < minLength) {
        return `Length must be at least ${minLength} characters`;
    }

    if (maxLength !== undefined && value.length > maxLength) {
        return `Length must be no more than ${maxLength} characters`;
    }

    return null;
}

export function validatePattern(value, pattern) {
    if (isMissing(value)) {
        return null;
    }

    if (typeof value !== 'string') {
        return 'Pattern validation requires a string';
    }

    const regex = pattern instanceof RegExp
        ? pattern
        : new RegExp(pattern);

    regex.lastIndex = 0;
    const isValid = regex.test(value);
    regex.lastIndex = 0;

    return isValid ? null : 'Value does not match the required pattern';
}

export function validateUnique(records, fieldName) {
    const seen = new Set();
    const duplicates = new Set();

    for (const record of records) {
        const value = record[fieldName];

        if (isMissing(value)) {
            continue;
        }

        if (seen.has(value)) {
            duplicates.add(value);
        } else {
            seen.add(value);
        }
    }

    return records.map((record, index) => {
        const value = record[fieldName];

        return duplicates.has(value)
            ? {
                index,
                field: fieldName,
                value,
                message: `Duplicate value "${value}"`,
            }
            : null;
    }).filter(Boolean);
}
