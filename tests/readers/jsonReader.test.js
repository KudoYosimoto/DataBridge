import test from 'node:test';
import assert from 'node:assert/strict';

import { readJSON } from '../../src/readers/jsonReader.js';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';


async function withTestFile(content, callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'test.json');

    try{
        await writeFile(filePath, content, 'utf-8');
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true })
    }
}

// 1. Корректный JSON с массивом объектов.
test('reads valid JSON file', async () => {
    const data = [{ name: 'Alice', age: 25 }];

    await withTestFile(JSON.stringify(data), async (filePath) => {
        const records = await readJSON(filePath);

        assert.deepEqual(records, data);
    });
});

// 2. Пустой массив.
test('reads empty JSON array', async () => {
    await withTestFile('[]', async (filePath) => {
        const records = await readJSON(filePath);

        assert.deepEqual(records, []);
    });
});

// 3. Некорректный JSON.
test('throws error for invalid JSON', async () => {
    await withTestFile('{invalid json}', async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /Failed to parse JSON file/,
        );
    });
});

// 4. Пустой файл.
test('throws error for empty JSON file', async () => {
    await withTestFile('', async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /Failed to parse JSON file/,
        );
    });
});

// 5. Корневой элемент — объект, а не массив.
test('throws error when JSON root is not an array', async () => {
    const data = { name: 'Alice', age: 25 };

    await withTestFile(JSON.stringify(data), async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /JSON root must be an array/,
        );
    });
});

// 6. Корневой элемент — строка.
test('throws error when JSON root is a string', async () => {
    await withTestFile(JSON.stringify('Alice'), async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /JSON root must be an array/,
        );
    });
});

// 7. В массиве находится null.
test('throws error when JSON array contains null', async () => {
    await withTestFile('[null]', async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /Invalid record at index 0/,
        );
    });
});

// 8. В массиве находится строка.
test('throws error when JSON array contains a string', async () => {
    await withTestFile('["Alice"]', async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /Invalid record at index 0/,
        );
    });
});

// 9. В массиве находится число.
test('throws error when JSON array contains a number', async () => {
    await withTestFile('[123]', async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /Invalid record at index 0/,
        );
    });
});

// 10. В объекте находится вложенный объект.
test('throws error for nested objects', async () => {
    const data = [
        {
            name: 'Alice',
            address: { city: 'Vilnius' },
        },
    ];

    await withTestFile(JSON.stringify(data), async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /nested objects and arrays are not supported/,
        );
    });
});

// 11. В объекте находится вложенный массив.
test('throws error for nested arrays', async () => {
    const data = [
        {
            name: 'Alice',
            tags: ['developer', 'admin'],
        },
    ];

    await withTestFile(JSON.stringify(data), async (filePath) => {
        await assert.rejects(
            readJSON(filePath),
            /nested objects and arrays are not supported/,
        );
    });
});

// 12. Корректные примитивные значения внутри объектов.
test('reads objects with primitive values', async () => {
    const data = [
        {
            name: 'Alice',
            age: 25,
            active: true,
            department: null,
        },
    ];

    await withTestFile(JSON.stringify(data), async (filePath) => {
        const records = await readJSON(filePath);

        assert.deepEqual(records, data);
    });
});

// 13. Файл не существует.
test('throws error when file does not exist', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'missing.json');

    try {
        await assert.rejects(
            readJSON(filePath),
            /Failed to read JSON file/,
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});
