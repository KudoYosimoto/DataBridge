import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { generateHTMLReport } from '../../src/reporters/htmlReporter.js';

async function withTempDir(callback) {
    const tempDir = await mkdtemp(path.join(tmpdir(), 'databridge-html-'));

    try {
        await callback(tempDir);
    } finally {
        await rm(tempDir, { recursive: true, force: true });
    }
}

const validationResult = {
    validRecords: [{ name: 'Alice', age: 25 }],
    invalidRecords: [{ name: 'Bob', age: -5 }],
    errors: [
        {
            recordIndex: 1,
            field: 'age',
            value: -5,
            message: 'Value must be greater than or equal to 0',
        },
    ],
    statistics: {
        total: 2,
        valid: 1,
        invalid: 1,
    },
};

test('creates an HTML report', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        await generateHTMLReport(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /<!DOCTYPE html>/);
        assert.match(content, /DataBridge/);
        assert.match(content, /<\/html>/);
    });
});

test('includes validation statistics', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        await generateHTMLReport(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /Total records/);
        assert.match(content, /Valid records/);
        assert.match(content, /Invalid records/);
        assert.match(content, />2</);
        assert.match(content, />1</);
    });
});

test('includes validation error details', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        await generateHTMLReport(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /age/);
        assert.match(content, /-5/);
        assert.match(content, /Value must be greater than or equal to 0/);
    });
});

test('escapes HTML in user-provided values', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        const result = {
            ...validationResult,
            errors: [
                {
                    recordIndex: 0,
                    field: '<script>alert(1)</script>',
                    value: '<img src=x>',
                    message: 'Invalid & unsafe "value"',
                },
            ],
        };

        await generateHTMLReport(result, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.ok(!content.includes('<script>alert(1)</script>'));
        assert.ok(!content.includes('<img src=x>'));
        assert.match(content, /&lt;script&gt;/);
        assert.match(content, /&lt;img/);
        assert.match(content, /&amp;/);
    });
});

test('shows a message when there are no errors', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        const result = {
            ...validationResult,
            errors: [],
        };

        await generateHTMLReport(result, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /No validation errors found/);
    });
});

test('creates missing directories automatically', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(
            tempDir,
            'reports',
            'nested',
            'report.html',
        );

        await generateHTMLReport(validationResult, filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /DataBridge/);
    });
});

test('returns the output file path', async () => {
    await withTempDir(async tempDir => {
        const filePath = path.join(tempDir, 'report.html');

        const result = await generateHTMLReport(
            validationResult,
            filePath,
        );

        assert.equal(result, filePath);
    });
});

test('rejects an invalid validation result', async () => {
    await assert.rejects(
        generateHTMLReport(null),
        /Invalid validation result/,
    );
});

test('rejects an empty file path', async () => {
    await assert.rejects(
        generateHTMLReport(validationResult, ''),
        /File path must be a non-empty string/,
    );
});
