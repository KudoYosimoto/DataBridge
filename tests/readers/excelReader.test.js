import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import * as XLSX from 'xlsx';

import { readExcel } from '../../src/readers/excelReader.js';

async function withExcelFile(sheets, callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'test.xlsx');

    try {
        const workbook = XLSX.utils.book_new();

        for (const [sheetName, data] of Object.entries(sheets)) {
            const worksheet = XLSX.utils.aoa_to_sheet(data);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        const buffer = XLSX.write(workbook, {
            type: 'buffer',
            bookType: 'xlsx',
        });

        await writeFile(filePath, buffer);
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

// 1. Читает несколько записей.
test('reads Excel file with multiple records', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', 'age', 'city'],
                ['Alice', 25, 'Berlin'],
                ['Bob', 30, 'London'],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice', age: 25, city: 'Berlin' },
                { name: 'Bob', age: 30, city: 'London' },
            ]);
        },
    );
});

// 2. Читает одну запись.
test('reads Excel file with a single record', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', 'age'],
                ['Alice', 25],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice', age: 25 },
            ]);
        },
    );
});

// 3. По умолчанию читает первый лист.
test('reads the first worksheet by default', async () => {
    await withExcelFile(
        {
            First: [
                ['name'],
                ['Alice'],
            ],
            Second: [
                ['name'],
                ['Bob'],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice' },
            ]);
        },
    );
});

// 4. Позволяет выбрать лист по имени.
test('reads a worksheet by its name', async () => {
    await withExcelFile(
        {
            First: [
                ['name'],
                ['Alice'],
            ],
            Second: [
                ['name'],
                ['Bob'],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath, {
                sheetName: 'Second',
            });

            assert.deepEqual(result, [
                { name: 'Bob' },
            ]);
        },
    );
});

// 5. Сохраняет типы значений.
test('preserves numbers and boolean values', async () => {
    await withExcelFile(
        {
            Data: [
                ['name', 'age', 'active'],
                ['Alice', 25, true],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice', age: 25, active: true },
            ]);
        },
    );
});

// 6. Преобразует пустые ячейки в null.
test('converts empty cells to null', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', 'age', 'city'],
                ['Alice', 25, 'Berlin'],
                ['Bob', null, 'London'],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice', age: 25, city: 'Berlin' },
                { name: 'Bob', age: null, city: 'London' },
            ]);
        },
    );
});

// 7. Пропускает полностью пустые строки.
test('ignores completely empty rows', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', 'age'],
                ['Alice', 25],
                [],
                ['Bob', 30],
            ],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, [
                { name: 'Alice', age: 25 },
                { name: 'Bob', age: 30 },
            ]);
        },
    );
});

// 8. Возвращает пустой массив для пустого листа.
test('returns an empty array for an empty worksheet', async () => {
    await withExcelFile(
        {
            Empty: [],
        },
        async filePath => {
            const result = await readExcel(filePath);

            assert.deepEqual(result, []);
        },
    );
});

// 9. Выдаёт ошибку, если лист не найден.
test('throws an error when the requested worksheet does not exist', async () => {
    await withExcelFile(
        {
            Users: [
                ['name'],
                ['Alice'],
            ],
        },
        async filePath => {
            await assert.rejects(
                readExcel(filePath, { sheetName: 'Products' }),
                /was not found/,
            );
        },
    );
});

// 10. Выдаёт ошибку при повторяющихся заголовках.
test('throws an error when Excel contains duplicate headers', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', 'name'],
                ['Alice', 'Bob'],
            ],
        },
        async filePath => {
            await assert.rejects(
                readExcel(filePath),
                /duplicate headers/,
            );
        },
    );
});

// 11. Выдаёт ошибку, если заголовок пустой.
test('throws an error when an Excel header is empty', async () => {
    await withExcelFile(
        {
            Users: [
                ['name', null],
                ['Alice', 25],
            ],
        },
        async filePath => {
            await assert.rejects(
                readExcel(filePath),
                /header names must be non-empty strings/,
            );
        },
    );
});

// 12. Выдаёт ошибку, если файл не существует.
test('throws an error when the Excel file does not exist', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'missing.xlsx');

    try {
        await assert.rejects(
            readExcel(filePath),
            /Failed to read Excel file/,
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
