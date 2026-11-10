
export function mapRecords(records, mapping = {}) {
    if (!Array.isArray(records)) {
        throw new Error('Records must be an array');
    }

    if (
        typeof mapping !== 'object' ||
        mapping === null ||
        Array.isArray(mapping)
    ) {
        throw new Error('Mapping must be an object');
    }

    return records.map(record => {
        if (
            typeof record !== 'object' ||
            record === null ||
            Array.isArray(record)
        ) {
            throw new Error('Each record must be an object');
        }

        const mappedRecord = {};

        for (const [fieldName, value] of Object.entries(record)) {
            const newFieldName = mapping[fieldName] ?? fieldName;

            if (typeof newFieldName !== 'string' || newFieldName.trim() === '') {
                throw new Error(
                    `Invalid mapping for field "${fieldName}"`,
                );
            }

            if (Object.hasOwn(mappedRecord, newFieldName)) {
                throw new Error(
                    `Mapping creates duplicate field "${newFieldName}"`,
                );
            }

            mappedRecord[newFieldName] = value;
        }

        return mappedRecord;
    });
}
