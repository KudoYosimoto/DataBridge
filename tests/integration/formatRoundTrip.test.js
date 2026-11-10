import test from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { readCSV, readJSON, readXML, readExcel } from '../../src/readers/index.js';
import { writeCSV, writeJSON, writeXML, writeExcel } from '../../src/writers/index.js';

const readers = {
    csv: readCSV,
    json: readJSON,
    xml: readXML,
    xlsx: readExcel,
};

const writers = {
    csv: writeCSV,
    json: writeJSON,
    xml: writeXML,
    xlsx: writeExcel,
};

const formats = ['csv', 'json', 'xml', 'xlsx'];

const sampleRecords = [
    {
        name: 'Alice',
        email: 'alice@example.com',
        department: 'IT',
    },
    {
        name: 'Bob',
        email: 'bob@example.com',
        department: 'HR',
    },
];

async function withTempDirectory(callback) {
    const directory = await mkdtemp(
        path.join(tmpdir(), 'databridge-integration-'),
    );

    try {
        await callback(directory);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

for (const sourceFormat of formats) {
    for (const targetFormat of formats) {
        test(
            `converts ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}`,
            async () => {
                await withTempDirectory(async (directory) => {
                    const inputPath = path.join(
                        directory,
                        `input.${sourceFormat}`,
                    );

                    const outputPath = path.join(
                        directory,
                        `output.${targetFormat}`,
                    );

                    await writers[sourceFormat](sampleRecords, inputPath);

                    const records = await readers[sourceFormat](inputPath);

                    assert.deepEqual(records, sampleRecords);

                    await writers[targetFormat](records, outputPath);

                    const convertedRecords =
                        await readers[targetFormat](outputPath);

                    assert.deepEqual(convertedRecords, sampleRecords);
                });
            },
        );
    }
}
