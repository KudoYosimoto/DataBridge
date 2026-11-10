import { writeFile } from 'node:fs/promises';
import { stringify } from 'csv-stringify/sync';

export async function writeCSV(records, filePath, options = {}) {
    if (!Array.isArray(records)) {
        throw new Error('Records must be an array');
    }

    if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('File path must be a non-empty string');
    }

    if (
        options === null ||
        typeof options !== 'object' ||
        Array.isArray(options)
    ) {
        throw new Error('Writer options must be an object');
    }

    const {
        delimiter = ',',
        header = true,
        columns,
    } = options;

    if (typeof delimiter !== 'string' || delimiter.length !== 1) {
        throw new Error('Delimiter must be a single character');
    }

    if (typeof header !== 'boolean') {
        throw new Error('Header option must be a boolean');
    }

    if (
        columns !== undefined &&
        (
            !Array.isArray(columns) ||
            columns.some(column => typeof column !== 'string' || column.trim() === '')
        )
    ) {
        throw new Error('Columns must be an array of non-empty strings');
    }

    for (const [index, record] of records.entries()) {
        if (
            record === null ||
            typeof record !== 'object' ||
            Array.isArray(record)
        ) {
            throw new Error(`Invalid record at index ${index}: expected an object`);
        }

        const hasNestedValues = Object.values(record).some(
            value => typeof value === 'object' && value !== null,
        );

        if (hasNestedValues) {
            throw new Error(
                `Invalid record at index ${index}: nested values are not supported`,
            );
        }
    }

    const columnNames = columns ?? (
        records.length > 0 ? Object.keys(records[0]) : []
    );

    let content = '';

    if (records.length > 0 || columnNames.length > 0) {
        try {
            content = stringify(records, {
                header,
                delimiter,
                columns: columnNames,
            });
        } catch (error) {
            throw new Error(`Failed to format CSV data: ${error.message}`, {
                cause: error,
            });
        }
    }

    try {
        await writeFile(filePath, content, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to write CSV file "${filePath}": ${error.message}`, {
            cause: error,
        });
    }

    return filePath;
}
