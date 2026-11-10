
import {
    validateRequired,
    validateType,
    validateMinMax,
    validateLength,
    validatePattern,
    validateUnique,
} from './rules.js';

export function validateRecords(records, config) {
    const validRecords = [];
    const invalidRecords = [];
    const errors = [];

    const invalidIndexes = new Set();

    records.forEach((record, index) => {
        for (const [fieldName, fieldRules] of Object.entries(config.fields)) {
            const value = record[fieldName];

            const checks = [
                validateRequired(value, fieldRules.required),
                validateType(value, fieldRules.type, fieldRules.format),
            ];

            if (fieldRules.min !== undefined || fieldRules.max !== undefined) {
                checks.push(
                    validateMinMax(
                        value,
                        fieldRules.min,
                        fieldRules.max,
                        fieldRules.type,
                    ),
                );
            }

            if (
                fieldRules.min_length !== undefined ||
                fieldRules.max_length !== undefined
            ) {
                checks.push(
                    validateLength(
                        value,
                        fieldRules.min_length,
                        fieldRules.max_length,
                    ),
                );
            }

            if (fieldRules.pattern !== undefined) {
                checks.push(validatePattern(value, fieldRules.pattern));
            }

            for (const message of checks) {
                if (message !== null) {
                    invalidIndexes.add(index);

                    errors.push({
                        recordIndex: index,
                        field: fieldName,
                        value,
                        message,
                    });
                }
            }
        }
    });

    for (const [fieldName, fieldRules] of Object.entries(config.fields)) {
        if (fieldRules.unique === true) {
            const duplicates = validateUnique(records, fieldName);

            for (const duplicate of duplicates) {
                invalidIndexes.add(duplicate.index);

                errors.push({
                    recordIndex: duplicate.index,
                    field: fieldName,
                    value: duplicate.value,
                    message: duplicate.message,
                });
            }
        }
    }

    records.forEach((record, index) => {
        if (invalidIndexes.has(index)) {
            invalidRecords.push(record);
        } else {
            validRecords.push(record);
        }
    });

    return {
        validRecords,
        invalidRecords,
        errors,
        statistics: {
            total: records.length,
            valid: validRecords.length,
            invalid: invalidRecords.length,
        },
    };
}
