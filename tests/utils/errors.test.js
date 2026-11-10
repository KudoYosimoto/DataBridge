import test from 'node:test';
import assert from 'node:assert/strict';

import {
    DataBridgeError,
    FileOperationError,
    ConfigurationError,
    ValidationError,
} from '../../src/utils/errors.js';

test('creates a DataBridgeError', () => {
    const error = new DataBridgeError('Something went wrong');

    assert.equal(error.message, 'Something went wrong');
    assert.equal(error.name, 'DataBridgeError');
    assert.equal(error.code, 'DATABRIDGE_ERROR');
    assert.ok(error instanceof Error);
});

test('creates a FileOperationError', () => {
    const error = new FileOperationError('Cannot read file');

    assert.equal(error.name, 'FileOperationError');
    assert.equal(error.code, 'FILE_OPERATION_ERROR');
    assert.ok(error instanceof DataBridgeError);
});

test('creates a ConfigurationError', () => {
    const error = new ConfigurationError('Invalid configuration');

    assert.equal(error.name, 'ConfigurationError');
    assert.equal(error.code, 'CONFIGURATION_ERROR');
    assert.ok(error instanceof DataBridgeError);
});

test('creates a ValidationError', () => {
    const error = new ValidationError('Validation failed');

    assert.equal(error.name, 'ValidationError');
    assert.equal(error.code, 'VALIDATION_ERROR');
    assert.ok(error instanceof DataBridgeError);
});

test('supports custom error codes', () => {
    const error = new DataBridgeError('Custom error', {
        code: 'CUSTOM_CODE',
    });

    assert.equal(error.code, 'CUSTOM_CODE');
});

test('preserves the original error as cause', () => {
    const originalError = new Error('Original error');

    const error = new FileOperationError('File operation failed', {
        cause: originalError,
    });

    assert.equal(error.cause, originalError);
});
