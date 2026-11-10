import { readFile } from 'node:fs/promises';
import { XMLParser, XMLValidator } from 'fast-xml-parser';

export async function readXML(filePath) {
    let content;

    try {
        content = await readFile(filePath, 'utf-8');
    } catch (error) {
        throw new Error(
            `Failed to read XML file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    const validationResult = XMLValidator.validate(content);

    if (validationResult !== true) {
        throw new Error(
            `Invalid XML file: ${validationResult.err.msg}`,
        );
    }

    const parser = new XMLParser({
        ignoreAttributes: true,
        parseTagValue: false,
        trimValues: true,
    });

    const parsedData = parser.parse(content);

    const rootNames = Object.keys(parsedData);

    if (rootNames.length !== 1) {
        throw new Error('XML must contain exactly one root element');
    }

    const rootContent = parsedData[rootNames[0]];

    if (rootContent === '') {
        return [];
    }

    if (
        typeof rootContent !== 'object'
        || rootContent === null
        || Array.isArray(rootContent)
    ) {
        throw new Error('XML root must contain record elements');
    }

    const recordNames = Object.keys(rootContent);

    if (recordNames.length !== 1) {
        throw new Error('XML root must contain exactly one record type');
    }

    const records = rootContent[recordNames[0]];

    const normalizedRecords = Array.isArray(records)
        ? records
        : [records];

    for (const [index, record] of normalizedRecords.entries()) {
        if (
            typeof record !== 'object'
            || record === null
            || Array.isArray(record)
        ) {
            throw new Error(
                `Invalid XML record at index ${index}: expected an object`,
            );
        }

        const hasNestedValues = Object.values(record).some(
            value => typeof value === 'object' && value !== null,
        );

        if (hasNestedValues) {
            throw new Error(
                `Invalid XML record at index ${index}: nested elements are not supported`,
            );
        }
    }

    return normalizedRecords;
}
