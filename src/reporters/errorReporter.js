import { writeCSV } from '../writers/csvWriter.js';
import { writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function reportErrors(validationResult, filePath = 'errors.csv') {
    if (
        validationResult === null ||
        typeof validationResult !== 'object' ||
        !Array.isArray(validationResult.invalidRecords) ||
        !Array.isArray(validationResult.errors)
    ) {
        throw new Error('Invalid validation result');
    }

    const { invalidRecords, errors } = validationResult;

    if (invalidRecords.length === 0) {
        await mkdir(dirname(filePath), { recursive: true });
        await writeFile(filePath, 'record,field,value,message,recordData\n', 'utf8');
        return filePath;
    }

    // Find the original record index for each invalid record.
    const invalidIndexes = [
        ...new Set(errors.map(error => error.recordIndex)),
    ].sort((a, b) => a - b);

    const recordsByIndex = new Map(
        invalidIndexes.map((index, position) => [
            index,
            invalidRecords[position],
        ]),
    );

    const errorRows = errors.map(error => {
        const originalRecord = recordsByIndex.get(error.recordIndex);

        return {
            record: error.recordIndex + 1,
            field: error.field,
            value: error.value ?? '',
            message: error.message,
            recordData: JSON.stringify(originalRecord ?? {}),
        };
    });

    await writeCSV(errorRows, filePath, {
        columns: ['record', 'field', 'value', 'message', 'recordData'],
    });

    return filePath;
}
