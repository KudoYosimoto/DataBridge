
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';

import { writeExcel } from '../../src/writers/excelWriter.js';

async function withTempFile(callback) {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'databridge-excel-'));
    const filePath = path.join(tempDir, 'test.xlsx');

    try {
        await callback(filePath);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

async function readWorkbook(filePath) {
    const fileBuffer = await readFile(filePath);
    return XLSX.read(fileBuffer, { type: 'buffer' });
}

test('writes records to an Excel file', async () => {
    await withTempFile(async filePath => {
        const records = [
            { name: 'Alice', age: 25 },
            { name: 'Bob', age: 30 },
        ];

        await writeExcel(records, filePath);

        const workbook = await readWorkbook(filePath);
        const worksheet = workbook.Sheets.Sheet1;

        const result = XLSX.utils.sheet_to_json(worksheet);

        assert.deepEqual(result, records);
    });
});

test('uses the first worksheet by default', async () => {
    await withTempFile(async filePath => {
        await writeExcel([{ name: 'Alice' }], filePath);

        const workbook = await readWorkbook(filePath);

        assert.equal(workbook.SheetNames[0], 'Sheet1');
    });
});

test('supports a custom worksheet name', async () => {
    await withTempFile(async filePath => {
        await writeExcel([{ name: 'Alice' }], filePath, {
            sheetName: 'Employees',
        });

        const workbook = await readWorkbook(filePath);

        assert.equal(workbook.SheetNames[0], 'Employees');
    });
});

test('preserves number and boolean values', async () => {
    await withTempFile(async filePath => {
        const records = [
            { age: 25, active: true },
            { age: 30, active: false },
        ];

        await writeExcel(records, filePath);

        const workbook = await readWorkbook(filePath);
        const worksheet = workbook.Sheets.Sheet1;
        const result = XLSX.utils.sheet_to_json(worksheet);

        assert.deepEqual(result, records);
    });
});

test('supports a custom column order', async () => {
    await withTempFile(async filePath => {
        const records = [
            { name: 'Alice', age: 25, city: 'London' },
        ];

        await writeExcel(records, filePath, {
            columns: ['city', 'name', 'age'],
        });

        const workbook = await readWorkbook(filePath);
        const worksheet = workbook.Sheets.Sheet1;

        const headers = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
        })[0];

        assert.deepEqual(headers, ['city', 'name', 'age']);
    });
});

test('writes headers for an empty array when columns are provided', async () => {
    await withTempFile(async filePath => {
        await writeExcel([], filePath, {
            columns: ['name', 'age'],
        });

        const workbook = await readWorkbook(filePath);
        const worksheet = workbook.Sheets.Sheet1;

        const rows = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
        });

        assert.deepEqual(rows, [['name', 'age']]);
    });
});

test('creates an empty worksheet for an empty array', async () => {
    await withTempFile(async filePath => {
        await writeExcel([], filePath);

        const workbook = await readWorkbook(filePath);

        assert.equal(workbook.SheetNames[0], 'Sheet1');

        const worksheet = workbook.Sheets.Sheet1;

        assert.deepEqual(
            XLSX.utils.sheet_to_json(worksheet, { header: 1 }),
            [],
        );
    });
});

test('rejects records that are not an array', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeExcel({}, filePath),
            /Records must be an array/,
        );
    });
});

test('rejects an empty file path', async () => {
    await assert.rejects(
        writeExcel([], ''),
        /File path must be a non-empty string/,
    );
});

test('rejects an invalid worksheet name', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeExcel([], filePath, { sheetName: 'Invalid/Name' }),
            /Invalid Excel sheet name/,
        );
    });
});

test('rejects duplicate column names', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeExcel([{ name: 'Alice' }], filePath, {
                columns: ['name', 'name'],
            }),
            /Excel columns must not contain duplicates/,
        );
    });
});

test('rejects nested values', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeExcel([{ name: 'Alice', address: { city: 'London' } }], filePath),
            /nested values are not supported/,
        );
    });
});

test('rejects invalid records', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeExcel([null], filePath),
            /Invalid record at index 0/,
        );
    });
});
