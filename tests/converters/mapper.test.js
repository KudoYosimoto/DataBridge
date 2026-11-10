
import test from 'node:test';
import assert from 'node:assert/strict';

import { mapRecords } from '../../src/converters/mapper.js';

test('renames fields according to mapping', () => {
    const records = [
        { first_name: 'Anna', age: 25 },
    ];

    const result = mapRecords(records, {
        first_name: 'name',
    });

    assert.deepEqual(result, [
        { name: 'Anna', age: 25 },
    ]);
});

test('preserves fields that are not mapped', () => {
    const records = [
        { name: 'Anna', age: 25, city: 'Amsterdam' },
    ];

    const result = mapRecords(records, {
        name: 'fullName',
    });

    assert.deepEqual(result, [
        { fullName: 'Anna', age: 25, city: 'Amsterdam' },
    ]);
});

test('maps multiple records', () => {
    const records = [
        { first_name: 'Anna' },
        { first_name: 'John' },
    ];

    const result = mapRecords(records, {
        first_name: 'name',
    });

    assert.deepEqual(result, [
        { name: 'Anna' },
        { name: 'John' },
    ]);
});

test('returns an empty array for empty input', () => {
    assert.deepEqual(mapRecords([]), []);
});

test('returns records unchanged when mapping is empty', () => {
    const records = [{ name: 'Anna', age: 25 }];

    assert.deepEqual(mapRecords(records), records);
});

test('throws an error when records is not an array', () => {
    assert.throws(
        () => mapRecords({ name: 'Anna' }),
        /Records must be an array/,
    );
});

test('throws an error when mapping is not an object', () => {
    assert.throws(
        () => mapRecords([], []),
        /Mapping must be an object/,
    );
});

test('throws an error when a record is not an object', () => {
    assert.throws(
        () => mapRecords(['Anna']),
        /Each record must be an object/,
    );
});

test('throws an error when mapping creates duplicate fields', () => {
    const records = [
        { first_name: 'Anna', name: 'Existing name' },
    ];

    assert.throws(
        () => mapRecords(records, {
            first_name: 'name',
        }),
        /Mapping creates duplicate field "name"/,
    );
});
