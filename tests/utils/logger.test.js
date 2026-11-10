import test from 'node:test';
import assert from 'node:assert/strict';

import { createLogger } from '../../src/utils/logger.js';

function createMockOutput() {
    return {
        messages: [],
        errors: [],

        log(message) {
            this.messages.push(message);
        },

        error(message) {
            this.errors.push(message);
        },
    };
}

test('logs info messages', () => {
    const output = createMockOutput();
    const logger = createLogger(output);

    logger.info('Processing started');

    assert.match(output.messages[0], /INFO/);
    assert.match(output.messages[0], /Processing started/);
});

test('logs success messages', () => {
    const output = createMockOutput();
    const logger = createLogger(output);

    logger.success('Conversion completed');

    assert.match(output.messages[0], /SUCCESS/);
    assert.match(output.messages[0], /Conversion completed/);
});

test('logs warning messages', () => {
    const output = createMockOutput();
    const logger = createLogger(output);

    logger.warn('Some records were skipped');

    assert.match(output.messages[0], /WARNING/);
    assert.match(output.messages[0], /Some records were skipped/);
});

test('logs error messages', () => {
    const output = createMockOutput();
    const logger = createLogger(output);

    logger.error('File not found');

    assert.match(output.errors[0], /ERROR/);
    assert.match(output.errors[0], /File not found/);
});

test('rejects invalid logger output', () => {
    assert.throws(
        () => createLogger(null),
        /Logger output must provide/,
    );
});

test('rejects output without required methods', () => {
    assert.throws(
        () => createLogger({ log() {} }),
        /Logger output must provide/,
    );
});
