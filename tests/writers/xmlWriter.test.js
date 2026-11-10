
import test from 'node:test';
import assert from 'node:assert/strict';
import {
    mkdtemp,
    readFile,
    rm,
} from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { XMLParser, XMLValidator } from 'fast-xml-parser';
import { writeXML } from '../../src/writers/xmlWriter.js';

async function withTempFile(callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'output.xml');

    try {
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

test('writes records as valid XML', async () => {
    await withTempFile(async filePath => {
        await writeXML(
            [
                { name: 'Anna', age: 25 },
                { name: 'John', age: 30 },
            ],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(XMLValidator.validate(content), true);
        assert.match(content, /<records>/);
        assert.match(content, /<record>/);
        assert.match(content, /<name>Anna<\/name>/);
        assert.match(content, /<age>25<\/age>/);
    });
});

test('supports custom root and record element names', async () => {
    await withTempFile(async filePath => {
        await writeXML(
            [{ name: 'Anna' }],
            filePath,
            {
                rootName: 'people',
                recordName: 'person',
            },
        );

        const content = await readFile(filePath, 'utf-8');

        assert.match(content, /<people>/);
        assert.match(content, /<person>/);
        assert.equal(XMLValidator.validate(content), true);
    });
});

test('writes an empty XML root for an empty array', async () => {
    await withTempFile(async filePath => {
        await writeXML([], filePath);

        const content = await readFile(filePath, 'utf-8');

        assert.equal(content, '<records></records>');
        assert.equal(XMLValidator.validate(content), true);
    });
});

test('escapes special XML characters', async () => {
    await withTempFile(async filePath => {
        await writeXML(
            [{ description: 'Tom & Jerry <3' }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(XMLValidator.validate(content), true);
        assert.match(content, /Tom &amp; Jerry &lt;3/);
    });
});

test('preserves number and boolean values as XML text', async () => {
    await withTempFile(async filePath => {
        await writeXML(
            [{ age: 25, active: true }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');
        const parser = new XMLParser({
            ignoreAttributes: true,
            parseTagValue: false,
        });
        const parsed = parser.parse(content);

        const record = parsed.records.record;

        assert.equal(record.age, '25');
        assert.equal(record.active, 'true');
    });
});

test('writes null values as empty elements', async () => {
    await withTempFile(async filePath => {
        await writeXML(
            [{ name: 'Anna', city: null }],
            filePath,
        );

        const content = await readFile(filePath, 'utf-8');

        assert.equal(XMLValidator.validate(content), true);
        assert.match(content, /<city><\/city>|<city\/>/);
    });
});

test('throws an error when records is not an array', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML({ name: 'Anna' }, filePath),
            /Records must be an array/,
        );
    });
});

test('throws an error when a record is not an object', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML(['Anna'], filePath),
            /Invalid record at index 0/,
        );
    });
});

test('throws an error when a record contains nested values', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML(
                [{ address: { city: 'Amsterdam' } }],
                filePath,
            ),
            /expected a primitive value/,
        );
    });
});

test('throws an error for an invalid XML field name', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML([{ 'first name': 'Anna' }], filePath),
            /Invalid XML field name/,
        );
    });
});

test('throws an error for an invalid root element name', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML([{ name: 'Anna' }], filePath, {
                rootName: 'invalid root',
            }),
            /Invalid XML root element name/,
        );
    });
});

test('throws an error for an invalid record element name', async () => {
    await withTempFile(async filePath => {
        await assert.rejects(
            writeXML([{ name: 'Anna' }], filePath, {
                recordName: 'invalid record',
            }),
            /Invalid XML record element name/,
        );
    });
});

test('throws an error when the output path is invalid', async () => {
    await assert.rejects(
        writeXML([{ name: 'Anna' }], ''),
        /File path must be a non-empty string/,
    );
});
