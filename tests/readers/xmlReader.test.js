
import test from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { readXML } from '../../src/readers/xmlReader.js';

// Создаём временный XML-файл для теста.
async function withTestFile(content, callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'test.xml');

    try {
        await writeFile(filePath, content, 'utf-8');
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

// 1. Чтение нескольких записей.
test('reads XML with multiple records', async () => {
    const xml = `
        <users>
            <user>
                <name>Alice</name>
                <age>25</age>
            </user>
            <user>
                <name>Bob</name>
                <age>30</age>
            </user>
        </users>
    `;

    const expected = [
        { name: 'Alice', age: '25' },
        { name: 'Bob', age: '30' },
    ];

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, expected);
    });
});

// 2. Чтение одной записи.
test('reads XML with a single record', async () => {
    const xml = `
        <users>
            <user>
                <name>Alice</name>
                <age>25</age>
            </user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, [
            { name: 'Alice', age: '25' },
        ]);
    });
});

// 3. Другие названия элементов.
test('supports different root and record names', async () => {
    const xml = `
        <products>
            <product>
                <name>Laptop</name>
                <price>1200</price>
            </product>
        </products>
    `;

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, [
            { name: 'Laptop', price: '1200' },
        ]);
    });
});

// 4. XML с атрибутами.
test('ignores XML attributes', async () => {
    const xml = `
        <users>
            <user id="1">
                <name>Alice</name>
            </user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, [
            { name: 'Alice' },
        ]);
    });
});

// 5. Некорректный XML.
test('throws error for invalid XML', async () => {
    const xml = `
        <users>
            <user>
                <name>Alice</user>
            </user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        await assert.rejects(
            readXML(filePath),
            /Invalid XML file/,
        );
    });
});

// 6. Пустой XML-файл.
test('throws error for empty XML file', async () => {
    await withTestFile('', async (filePath) => {
        await assert.rejects(
            readXML(filePath),
            /Invalid XML file/,
        );
    });
});

// 7. Пустой корневой элемент без записей.
test('returns an empty array when XML root has no records', async () => {
    const xml = '<users></users>';

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, []);
    });
});

// 8. Вложенный XML-элемент.
test('throws error for nested XML elements', async () => {
    const xml = `
        <users>
            <user>
                <name>Alice</name>
                <address>
                    <city>Vilnius</city>
                </address>
            </user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        await assert.rejects(
            readXML(filePath),
            /nested elements are not supported/,
        );
    });
});

// 9. XML-запись не является объектом.
test('throws error when XML record is a primitive value', async () => {
    const xml = `
        <users>
            <user>Alice</user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        await assert.rejects(
            readXML(filePath),
            /Invalid XML record/,
        );
    });
});

// 10. Файл не существует.
test('throws error when XML file does not exist', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'missing.xml');

    try {
        await assert.rejects(
            readXML(filePath),
            /Failed to read XML file/,
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

// 11. Пустые значения элементов.
test('reads empty XML element values', async () => {
    const xml = `
        <users>
            <user>
                <name>Alice</name>
                <city></city>
            </user>
        </users>
    `;

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.equal(records[0].name, 'Alice');
        assert.equal(records[0].city, '');
    });
});

// 12. Записи с несколькими простыми полями.
test('reads records with multiple primitive fields', async () => {
    const xml = `
        <employees>
            <employee>
                <name>John</name>
                <age>28</age>
                <active>true</active>
                <department>IT</department>
            </employee>
        </employees>
    `;

    await withTestFile(xml, async (filePath) => {
        const records = await readXML(filePath);

        assert.deepEqual(records, [
            {
                name: 'John',
                age: '28',
                active: 'true',
                department: 'IT',
            },
        ]);
    });
});
