
import * as XLSX from 'xlsx';

export async function writeExcel(records, filePath, options = {}) {
    if (!Array.isArray(records)) {
        throw new Error('Records must be an array');
    }

    if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('File path must be a non-empty string');
    }

    if (options === null || typeof options !== 'object' || Array.isArray(options)) {
        throw new Error('Writer options must be an object');
    }

    const { sheetName = 'Sheet1', columns } = options;

    if (
        typeof sheetName !== 'string' ||
        sheetName.trim() === '' ||
        sheetName.length > 31 ||
        /[\\/?*[\]:]/.test(sheetName)
    ) {
        throw new Error('Invalid Excel sheet name');
    }

    if (
        columns !== undefined &&
        (!Array.isArray(columns) ||
            columns.some(
                column => typeof column !== 'string' || column.trim() === '',
            ))
    ) {
        throw new Error('Columns must be an array of non-empty strings');
    }

    for (const [index, record] of records.entries()) {
        if (record === null || typeof record !== 'object' || Array.isArray(record)) {
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

    const columnNames =
        columns ?? (records.length > 0 ? Object.keys(records[0]) : []);

    if (new Set(columnNames).size !== columnNames.length) {
        throw new Error('Excel columns must not contain duplicates');
    }

    try {
        const workbook = XLSX.utils.book_new();

        let worksheet;

        if (columnNames.length > 0) {
            const rows = [
                columnNames,
                ...records.map(record =>
                    columnNames.map(column => record[column] ?? null),
                ),
            ];

            worksheet = XLSX.utils.aoa_to_sheet(rows);
        } else {
            worksheet = XLSX.utils.aoa_to_sheet([]);
        }

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, filePath);
    } catch (error) {
        throw new Error(
            `Failed to write Excel file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    return filePath;
}
