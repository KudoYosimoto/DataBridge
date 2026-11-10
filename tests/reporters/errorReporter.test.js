import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    writeFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { reportErrors } from '../../src/reporters/errorReporter.js';

async function withTempDir(callback) {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'databridge-errors-'));

    try {
        await callback(tempDir);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

const validationResult = {
    validRecords: [{ name: 'Alice', age: 25 }],
    invalidRecords: [
        { name: 'Bob', age: -5 },
        { name: '', age: 30 },
    ],
    errors: [
        {
            recordIndex: 1,
            field: 'age',
            value: -5,
            message: 'Value must be greater than or equal to 0',
        },
        {
            recordIndex: 2,
            field: 'name',
            value: '',
            message: 'Value is required',
        },
    ],
    statistics: {
        total: 3,
        valid: 1,
        invalid: 2,
    },
};

test('creates an errors CSV file', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'errors.csv');

        await reportErrors(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.ok(content.length > 0);
        assert.match(content, /record,field,value,message/);
    });
});


test('writes error details to CSV', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'errors.csv');

        await reportErrors(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /age/);
        assert.match(content, /Bob/);
        assert.match(content, /-5/);
        assert.match(content, /Value must be greater than or equal to 0/);
        assert.match(content, /Value is required/);
        assert.match(content, /recordData/);
    });
});

test('uses record numbers starting from one', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'errors.csv');

        await reportErrors(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /2,age/);
        assert.match(content, /3,name/);
    });
});

test('uses errors.csv as the default file path', async () => {
    await withTempDir(async tempDir => {
        const previousDirectory = process.cwd();

        try {
            process.chdir(tempDir);

            await reportErrors(validationResult);

            const content = await readFile('errors.csv', 'utf-8');

            assert.match(content, /record,field,value,message/);
        } finally {
            process.chdir(previousDirectory);
        }
    });
});

test('overwrites the errors CSV with headers when there are no invalid records', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'errors.csv');

        const result = {
            invalidRecords: [],
            errors: [],
            statistics: {
                total: 1,
                valid: 1,
                invalid: 0,
            },
        };

        await writeFile(filePath, 'stale previous error', 'utf-8');
        await reportErrors(result, filePath);

        const content = await readFile(filePath, 'utf-8');
        assert.match(content, /^record,field,value,message,recordData/);
        assert.doesNotMatch(content, /stale previous error/);
    });
});

test('rejects an invalid validation result', async () => {
    await assert.rejects(
        reportErrors(null),
        /Invalid validation result/,
    );
});

test('returns the output file path', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'errors.csv');

        const result = await reportErrors(validationResult, filePath);

        assert.equal(result, filePath);
    });
});
