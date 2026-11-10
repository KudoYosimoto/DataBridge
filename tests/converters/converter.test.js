
import test from 'node:test';
import assert from 'node:assert/strict';

import { convertRecords } from '../../src/converters/converter.js';

test('converts records without mapping or transformations', () => {
    const records = [{ name: 'Anna', age: 25 }];

    const result = convertRecords(records);

    assert.deepEqual(result, records);
});

test('renames fields using mapping', () => {
    const records = [{ first_name: 'Anna' }];

    const result = convertRecords(records, {
        mapping: {
            first_name: 'name',
        },
    });

    assert.deepEqual(result, [{ name: 'Anna' }]);
});

test('transforms values without renaming fields', () => {
    const records = [{ name: ' anna ' }];

    const result = convertRecords(records, {
        transformations: {
            name: { type: 'trim' },
        },
    });

    assert.deepEqual(result, [{ name: 'anna' }]);
});

test('applies mapping before transformations', () => {
    const records = [
        {
            first_name: ' anna ',
            country: 'NL',
        },
    ];

    const result = convertRecords(records, {
        mapping: {
            first_name: 'name',
        },
        transformations: {
            name: { type: 'trim' },
            country: {
                type: 'replace',
                dictionary: {
                    NL: 'Netherlands',
                },
            },
        },
    });

    assert.deepEqual(result, [
        {
            name: 'anna',
            country: 'Netherlands',
        },
    ]);
});

test('converts multiple records', () => {
    const records = [
        { first_name: 'anna' },
        { first_name: 'john' },
    ];

    const result = convertRecords(records, {
        mapping: {
            first_name: 'name',
        },
        transformations: {
            name: { type: 'uppercase' },
        },
    });

    assert.deepEqual(result, [
        { name: 'ANNA' },
        { name: 'JOHN' },
    ]);
});

test('does not modify original records', () => {
    const records = [{ first_name: ' anna ' }];

    convertRecords(records, {
        mapping: {
            first_name: 'name',
        },
        transformations: {
            name: { type: 'trim' },
        },
    });

    assert.deepEqual(records, [{ first_name: ' anna ' }]);
});

test('returns an empty array for empty input', () => {
    assert.deepEqual(convertRecords([]), []);
});

test('throws an error when records is not an array', () => {
    assert.throws(
        () => convertRecords({ name: 'Anna' }),
        /Records must be an array/,
    );
});

test('throws an error when options is not an object', () => {
    assert.throws(
        () => convertRecords([], []),
        /Converter options must be an object/,
    );
});

test('converts numeric strings to numbers', () => {
    const result = convertRecords(
        [{ name: 'Alice', age: '25', salary: '1250.50' }],
        {
            fieldTypes: {
                age: 'integer',
                salary: 'float',
            },
        },
    );

    assert.equal(result[0].age, 25);
    assert.equal(typeof result[0].age, 'number');
    assert.equal(result[0].salary, 1250.5);
    assert.equal(typeof result[0].salary, 'number');
});

test('converts boolean strings to booleans', () => {
    const result = convertRecords(
        [
            { active: 'true' },
            { active: 'false' },
            { active: true },
        ],
        {
            fieldTypes: {
                active: 'boolean',
            },
        },
    );

    assert.deepEqual(result, [
        { active: true },
        { active: false },
        { active: true },
    ]);
});

test('preserves empty optional values', () => {
    const result = convertRecords(
        [{ age: '', active: null }],
        {
            fieldTypes: {
                age: 'integer',
                active: 'boolean',
            },
        },
    );

    assert.deepEqual(result, [{ age: '', active: null }]);
});

test('normalizes types before mapping fields', () => {
    const result = convertRecords(
        [{ age: '25' }],
        {
            fieldTypes: { age: 'integer' },
            mapping: { age: 'userAge' },
        },
    );

    assert.deepEqual(result, [{ userAge: 25 }]);
});
