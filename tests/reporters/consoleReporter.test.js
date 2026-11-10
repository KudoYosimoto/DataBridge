import test from 'node:test';
import assert from 'node:assert/strict';

import { reportToConsole } from '../../src/reporters/consoleReporter.js';

function createLogger() {
    const messages = [];

    return {
        messages,
        log(message) {
            messages.push(String(message));
        },
    };
}

const validResult = {
    validRecords: [{ name: 'Alice' }],
    invalidRecords: [],
    errors: [],
    statistics: {
        total: 1,
        valid: 1,
        invalid: 0,
    },
};

test('displays validation statistics', () => {
    const logger = createLogger();

    reportToConsole(validResult, logger);

    const output = logger.messages.join('\n');

    assert.match(output, /Total records: 1/);
    assert.match(output, /Valid records: 1/);
    assert.match(output, /Invalid records: 0/);
});

test('displays validation errors', () => {
    const logger = createLogger();

    const result = {
        ...validResult,
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

    reportToConsole(result, logger);

    const output = logger.messages.join('\n');

    assert.match(output, /Record 2/);
    assert.match(output, /age/);
    assert.match(output, /greater than or equal to 0/);
});

test('displays a message when there are no errors', () => {
    const logger = createLogger();

    reportToConsole(validResult, logger);

    const output = logger.messages.join('\n');

    assert.match(output, /No validation errors found/);
});

test('does not display error details when errors are empty', () => {
    const logger = createLogger();

    reportToConsole(validResult, logger);

    const output = logger.messages.join('\n');

    assert.doesNotMatch(output, /Validation errors:/);
});

test('rejects an invalid validation result', () => {
    const logger = createLogger();

    assert.throws(
        () => reportToConsole(null, logger),
        /Invalid validation result/,
    );
});
