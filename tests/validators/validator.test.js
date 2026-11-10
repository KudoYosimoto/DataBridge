
import test from 'node:test';
import assert from 'node:assert/strict';

import { validateRecords } from '../../src/validators/validator.js';

function makeConfig(fields) {
    return { fields };
}

test('returns all records as valid when they satisfy the rules', () => {
    const records = [
        { name: 'Alice', age: 25 },
        { name: 'Bob', age: 30 },
    ];

    const config = makeConfig({
        name: { type: 'string', required: true },
        age: { type: 'integer', required: true, min: 18, max: 100 },
    });

    const result = validateRecords(records, config);

    assert.deepEqual(result.validRecords, records);
    assert.deepEqual(result.invalidRecords, []);
    assert.deepEqual(result.errors, []);
    assert.deepEqual(result.statistics, {
        total: 2,
        valid: 2,
        invalid: 0,
    });
});

test('moves a record with a missing required value to invalidRecords', () => {
    const records = [{ name: '' }];

    const config = makeConfig({
        name: { type: 'string', required: true },
    });

    const result = validateRecords(records, config);

    assert.deepEqual(result.validRecords, []);
    assert.deepEqual(result.invalidRecords, records);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].field, 'name');
    assert.equal(result.errors[0].message, 'Value is required');
});

test('detects a missing field in a record', () => {
    const records = [{}];

    const config = makeConfig({
        name: { type: 'string', required: true },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.equal(result.errors[0].value, undefined);
    assert.equal(result.errors[0].message, 'Value is required');
});

test('detects an incorrect field type', () => {
    const records = [{ age: 'not-a-number' }];

    const config = makeConfig({
        age: { type: 'integer', required: true },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.equal(result.errors.length, 1);
    assert.equal(result.errors[0].message, 'Expected an integer');
});

test('accepts numeric strings for integer fields', () => {
    const records = [{ age: '25' }];

    const config = makeConfig({
        age: { type: 'integer', required: true },
    });

    const result = validateRecords(records, config);

    assert.deepEqual(result.validRecords, records);
    assert.deepEqual(result.errors, []);
});

test('detects a value below the minimum', () => {
    const records = [{ age: 15 }];

    const config = makeConfig({
        age: { type: 'integer', min: 18 },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.match(result.errors[0].message, /greater than or equal to 18/);
});

test('detects a value above the maximum', () => {
    const records = [{ age: 120 }];

    const config = makeConfig({
        age: { type: 'integer', max: 100 },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.match(result.errors[0].message, /less than or equal to 100/);
});

test('detects a string shorter than min_length', () => {
    const records = [{ name: 'A' }];

    const config = makeConfig({
        name: { type: 'string', min_length: 2 },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.match(result.errors[0].message, /at least 2 characters/);
});

test('detects a string that does not match the pattern', () => {
    const records = [{ email: 'not-an-email' }];

    const config = makeConfig({
        email: {
            type: 'string',
            pattern: '^[^@]+@[^@]+\\.[^@]+$',
        },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.equal(
        result.errors[0].message,
        'Value does not match the required pattern',
    );
});

test('detects duplicate values and marks every duplicate record invalid', () => {
    const records = [
        { id: 1 },
        { id: 2 },
        { id: 1 },
    ];

    const config = makeConfig({
        id: { type: 'integer', unique: true },
    });

    const result = validateRecords(records, config);

    assert.deepEqual(result.validRecords, [{ id: 2 }]);
    assert.deepEqual(result.invalidRecords, [
        { id: 1 },
        { id: 1 },
    ]);
    assert.equal(result.errors.length, 2);
    assert.equal(result.statistics.invalid, 2);
});

test('collects multiple errors for one record', () => {
    const records = [{ age: 15, name: 'A' }];

    const config = makeConfig({
        age: { type: 'integer', min: 18 },
        name: { type: 'string', min_length: 2 },
    });

    const result = validateRecords(records, config);

    assert.equal(result.invalidRecords.length, 1);
    assert.equal(result.errors.length, 2);
    assert.deepEqual(
        result.errors.map(error => error.field),
        ['age', 'name'],
    );
});

test('returns zero statistics for an empty records array', () => {
    const result = validateRecords(
        [],
        makeConfig({
            name: { type: 'string', required: true },
        }),
    );

    assert.deepEqual(result, {
        validRecords: [],
        invalidRecords: [],
        errors: [],
        statistics: {
            total: 0,
            valid: 0,
            invalid: 0,
        },
    });
});

test('does not apply optional validation rules to an empty optional value', () => {
    const records = [{ name: '' }];

    const config = makeConfig({
        name: {
            type: 'string',
            required: false,
            min_length: 2,
            pattern: '^[A-Z]+$',
        },
    });

    const result = validateRecords(records, config);

    assert.deepEqual(result.validRecords, records);
    assert.deepEqual(result.invalidRecords, []);
    assert.deepEqual(result.errors, []);
});
