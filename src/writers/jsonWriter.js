
import { writeFile } from 'node:fs/promises';

export async function writeJSON(records, filePath, options = {}) {
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

    const { pretty = true } = options;

    if (typeof pretty !== 'boolean') {
        throw new Error('Pretty option must be a boolean');
    }

    for (const [index, record] of records.entries()) {
        if (
            record === null ||
            typeof record !== 'object' ||
            Array.isArray(record)
        ) {
            throw new Error(
                `Invalid record at index ${index}: expected an object`,
            );
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

    let content;

    try {
        content = JSON.stringify(records, null, pretty ? 2 : 0);
    } catch (error) {
        throw new Error(`Failed to format JSON data: ${error.message}`, {
            cause: error,
        });
    }

    try {
        await writeFile(filePath, `${content}\n`, 'utf-8');
    } catch (error) {
        throw new Error(
            `Failed to write JSON file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    return filePath;
}
