import { mapRecords } from './mapper.js';
import { transformRecords } from './transformer.js';

function normalizeRecordTypes(records, fieldTypes = {}) {
    return records.map(record => {
        const normalizedRecord = { ...record };

        for (const [fieldName, type] of Object.entries(fieldTypes)) {
            if (!Object.hasOwn(normalizedRecord, fieldName)) {
                continue;
            }

            const value = normalizedRecord[fieldName];

            if (
                value === null ||
                value === undefined ||
                (typeof value === 'string' && value.trim() === '')
            ) {
                continue;
            }

            switch (type) {
                case 'integer':
                    normalizedRecord[fieldName] = Number(value);
                    break;

                case 'float':
                    normalizedRecord[fieldName] = Number(value);
                    break;

                case 'boolean':
                    if (typeof value === 'string') {
                        normalizedRecord[fieldName] =
                            value.trim().toLowerCase() === 'true';
                    }
                    break;

                case 'string':
                case 'date':
                    break;

                default:
                    throw new Error(
                        `Unsupported field type "${type}" for "${fieldName}"`,
                    );
            }
        }

        return normalizedRecord;
    });
}

export function convertRecords(records, options = {}) {
    if (!Array.isArray(records)) {
        throw new Error('Records must be an array');
    }

    if (
        options === null ||
        typeof options !== 'object' ||
        Array.isArray(options)
    ) {
        throw new Error('Converter options must be an object');
    }

    const {
        mapping = {},
        transformations = {},
        fieldTypes = {},
    } = options;

    if (
        fieldTypes === null ||
        typeof fieldTypes !== 'object' ||
        Array.isArray(fieldTypes)
    ) {
        throw new Error('Field types must be an object');
    }

    const normalizedRecords = normalizeRecordTypes(records, fieldTypes);
    const mappedRecords = mapRecords(normalizedRecords, mapping);
    return transformRecords(mappedRecords, transformations);
}
