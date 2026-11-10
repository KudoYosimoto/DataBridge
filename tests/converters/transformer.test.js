
import test from 'node:test';
import assert from 'node:assert/strict';

import {
    transformValue,
    transformRecords,
} from '../../src/converters/transformer.js';

test('converts text to uppercase', () => {
    assert.equal(
        transformValue('anna', { type: 'uppercase' }),
        'ANNA',
    );
});

test('converts text to lowercase', () => {
    assert.equal(
        transformValue('ANNA', { type: 'lowercase' }),
        'anna',
    );
});

test('removes spaces from text', () => {
    assert.equal(
        transformValue('  Anna  ', { type: 'trim' }),
        'Anna',
    );
});

test('replaces values using a dictionary', () => {
    assert.equal(
        transformValue('NL', {
            type: 'replace',
            dictionary: {
                NL: 'Netherlands',
                DE: 'Germany',
            },
        }),
        'Netherlands',
    );
});

test('keeps the original value when dictionary has no match', () => {
    assert.equal(
        transformValue('FR', {
            type: 'replace',
            dictionary: { NL: 'Netherlands' },
        }),
        'FR',
    );
});

test('converts timestamp to YYYY-MM-DD date', () => {
    assert.equal(
        transformValue(0, { type: 'timestampToDate' }),
        '1970-01-01',
    );
});

test('preserves non-string values in text transformations', () => {
    assert.equal(
        transformValue(123, { type: 'uppercase' }),
        123,
    );
});

test('throws an error for unsupported transformation', () => {
    assert.throws(
        () => transformValue('Anna', { type: 'unknown' }),
        /Unsupported transformation/,
    );
});

test('throws an error when replace dictionary is missing', () => {
    assert.throws(
        () => transformValue('NL', { type: 'replace' }),
        /requires a dictionary object/,
    );
});

test('throws an error for invalid timestamp', () => {
    assert.throws(
        () => transformValue('not-a-timestamp', {
            type: 'timestampToDate',
        }),
        /Invalid timestamp/,
    );
});

test('transforms selected fields in multiple records', () => {
    const records = [
        { name: ' anna ', city: 'amsterdam', age: 25 },
        { name: ' john ', city: 'berlin', age: 30 },
    ];

    const result = transformRecords(records, {
        name: { type: 'trim' },
        city: { type: 'uppercase' },
    });

    assert.deepEqual(result, [
        { name: 'anna', city: 'AMSTERDAM', age: 25 },
        { name: 'john', city: 'BERLIN', age: 30 },
    ]);
});

test('does not modify the original records', () => {
    const records = [{ name: ' anna ' }];

    transformRecords(records, {
        name: { type: 'trim' },
    });

    assert.equal(records[0].name, ' anna ');
});

test('skips fields that are absent from a record', () => {
    const records = [{ age: 25 }];

    assert.deepEqual(
        transformRecords(records, {
            name: { type: 'uppercase' },
        }),
        [{ age: 25 }],
    );
});

test('returns an empty array for empty input', () => {
    assert.deepEqual(transformRecords([]), []);
});


test('converts Unix timestamps in seconds when configured', () => {
    assert.equal(transformValue(1735689600, { type: 'timestampToDate', unit: 'seconds' }), '2025-01-01');
});
