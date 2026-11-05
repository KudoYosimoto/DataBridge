import { readFile } from 'node:fs/promises';
import * as XLSX from 'xlsx';

export async function readExcel(filePath, options = {}) {
    let workbook;

    try {
        const fileBuffer = await readFile(filePath);

        workbook = XLSX.read(fileBuffer, {
            type: 'buffer',
        });
    } catch (error) {
        throw new Error(
            `Failed to read Excel file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    const sheetName = options.sheetName ?? workbook.SheetNames[0];

    if (!sheetName || !workbook.Sheets[sheetName]) {
        throw new Error(
            `Excel sheet "${sheetName ?? ''}" was not found in file "${filePath}"`,
        );
    }

    const worksheet = workbook.Sheets[sheetName];

    const rows = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: null,
        raw: true,
        blankrows: false,
    });

    if (rows.length === 0) {
        return [];
    }

    const headers = rows[0].map(header => {
        if (typeof header !== 'string' || header.trim() === '') {
            throw new Error('Excel header names must be non-empty strings');
        }

        return header.trim();
    });

    if (new Set(headers).size !== headers.length) {
        throw new Error('Excel file contains duplicate headers');
    }

    const records = rows.slice(1).map(row => {
        const record = {};

        headers.forEach((header, index) => {
            record[header] = row[index] ?? null;
        });

        return record;
    });

    return records;
}
