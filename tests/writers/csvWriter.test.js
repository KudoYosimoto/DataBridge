
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { writeCSV } from '../../src/writers/csvWriter.js';

async function withTempFile(callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'output.csv');

    try {
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

test('writes records with headers', async () => {
    await withTempFile(async filePath => {
        await writeCSV(
            [
                { name: 'Anna', age: 25 },
                { name: 'John', age: 30 },
            ],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(
            content,
            'name,age\nAnna,25\nJohn,30\n',
        );
    });
});

test('writes records without headers', async () => {
    await withTempFile(async filePath => {
        await writeCSV(
            [{ name: 'Anna', age: 25 }],
            filePath,
            { header: false },
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, 'Anna,25\n');
    });
});

test('supports a custom delimiter', async () => {
    await withTempFile(async filePath => {
        await writeCSV(
            [{ name: 'Anna', age: 25 }],
            filePath,
            { delimiter: ';' },
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, 'name;age\nAnna;25\n');
    });
});

test('supports a custom column order', async () => {
    await withTempFile(async filePath => {
        await writeCSV(
            [{ name: 'Anna', age: 25, city: 'Amsterdam' }],
            filePath,
            { columns: ['city', 'name', 'age'] },
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(
            content,
            'city,name,age\nAmsterdam,Anna,25\n',
        );
    });
});

test('writes an empty file for an empty array', async () => {
    await withTempFile(async filePath => {
        await writeCSV([], filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, '');
    });
});

test('writes headers for an empty array when columns are provided', async () => {
    await withTempFile(async filePath => {
        await writeCSV([], filePath, {
            columns: ['name', 'age'],
        });

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, 'name,age\n');
    });
});

test('escapes values containing commas', async () => {
    await withTempFile(async filePath => {
        await writeCSV(
            [{ name: 'Anna, Maria' }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, 'name\n"Anna, Maria"\n');
    });
});

test('throws an error when records is not an array', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeCSV({ name: 'Anna' }, filePath),
            /Records must be an array/,
        );
    });
});

test('throws an error when a record is not an object', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeCSV(['Anna'], filePath),
            /Invalid record at index 0/,
        );
    });
});

test('throws an error when a record contains nested values', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeCSV(
                [{ name: 'Anna', address: { city: 'Amsterdam' } }],
                filePath,
            ),
            /nested values are not supported/,
        );
    });
});

test('throws an error for an invalid delimiter', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeCSV([{ name: 'Anna' }], filePath, {
                delimiter: '||',
            }),
            /Delimiter must be a single character/,
        );
    });
});

test('throws an error when the output path is invalid', async () => {
    await assert.rejects(
        writeCSV([{ name: 'Anna' }], ''),
        /File path must be a non-empty string/,
    );
});
