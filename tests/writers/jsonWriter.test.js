
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { writeJSON } from '../../src/writers/jsonWriter.js';

async function withTempFile(callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'output.json');

    try {
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

test('writes records as formatted JSON', async () => {
    await withTempFile(async filePath => {
        await writeJSON(
            [{ name: 'Anna', age: 25 }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(
            content,
            '[\n  {\n    "name": "Anna",\n    "age": 25\n  }\n]\n',
        );
    });
});

test('writes compact JSON when pretty is false', async () => {
    await withTempFile(async filePath => {
        await writeJSON(
            [{ name: 'Anna', age: 25 }],
            filePath,
            { pretty: false },
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(
            content,
            '[{"name":"Anna","age":25}]\n',
        );
    });
});

test('writes an empty array', async () => {
    await withTempFile(async filePath => {
        await writeJSON([], filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, '[]\n');
    });
});

test('preserves number and boolean values', async () => {
    await withTempFile(async filePath => {
        await writeJSON(
            [{ age: 25, active: true }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');
        const parsed = JSON.parse(content);

        assert.equal(parsed[0].age, 25);
        assert.equal(parsed[0].active, true);
    });
});

test('throws an error when records is not an array', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeJSON({ name: 'Anna' }, filePath),
            /Records must be an array/,
        );
    });
});

test('throws an error when a record is not an object', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeJSON(['Anna'], filePath),
            /Invalid record at index 0/,
        );
    });
});

test('throws an error when a record contains nested values', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeJSON(
                [{ name: 'Anna', address: { city: 'Amsterdam' } }],
                filePath,
            ),
            /nested values are not supported/,
        );
    });
});

test('throws an error when the output path is invalid', async () => {
    await assert.rejects(
        writeJSON([{ name: 'Anna' }], ''),
        /File path must be a non-empty string/,
    );
});

test('throws an error when pretty is not a boolean', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeJSON([{ name: 'Anna' }], filePath, {
                pretty: 'yes',
            }),
            /Pretty option must be a boolean/,
        );
    });
});
