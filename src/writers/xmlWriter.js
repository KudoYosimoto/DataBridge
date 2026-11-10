
import { writeFile } from 'node:fs/promises';
import { XMLBuilder } from 'fast-xml-parser';

const isValidElementName = name =>
    typeof name === 'string' &&
    /^[A-Za-z_][A-Za-z0-9_.-]*$/.test(name);

export async function writeXML(records, filePath, options = {}) {
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
        rootName = 'records',
        recordName = 'record',
    } = options;

    if (!isValidElementName(rootName)) {
        throw new Error('Invalid XML root element name');
    }

    if (!isValidElementName(recordName)) {
        throw new Error('Invalid XML record element name');
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

        for (const [fieldName, value] of Object.entries(record)) {
            if (!isValidElementName(fieldName)) {
                throw new Error(
                    `Invalid XML field name "${fieldName}" in record ${index}`,
                );
            }

            if (
                value !== null &&
                !['string', 'number', 'boolean'].includes(typeof value)
            ) {
                throw new Error(
                    `Invalid value for field "${fieldName}" in record ${index}: expected a primitive value`,
                );
            }

            if (typeof value === 'number' && !Number.isFinite(value)) {
                throw new Error(
                    `Invalid numeric value for field "${fieldName}" in record ${index}`,
                );
            }
        }
    }

    let content;

    try {
        if (records.length === 0) {
            content = `<${rootName}></${rootName}>`;
        } else {
            const builder = new XMLBuilder({
                format: true,
                ignoreAttributes: true,
                suppressEmptyNode: false,
            });

            const xmlData = {
                [rootName]: {
                    [recordName]: records,
                },
            };

            content = builder.build(xmlData);
        }
    } catch (error) {
        throw new Error(`Failed to format XML data: ${error.message}`, {
            cause: error,
        });
    }

    try {
        await writeFile(filePath, content, 'utf-8');
    } catch (error) {
        throw new Error(
            `Failed to write XML file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    return filePath;
}
