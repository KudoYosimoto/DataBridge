
import test from 'node:test';
import assert from 'node:assert/strict';

import { detectFormat } from '../../src/utils/formatDetector.js';

test('detects CSV format', () => {
    assert.equal(detectFormat('input.csv'), 'csv');
});

test('detects JSON format', () => {
    assert.equal(detectFormat('input.json'), 'json');
});

test('detects XML format', () => {
    assert.equal(detectFormat('input.xml'), 'xml');
});

test('detects XLSX format', () => {
    assert.equal(detectFormat('input.xlsx'), 'xlsx');
});

test('supports uppercase extensions', () => {
    assert.equal(detectFormat('input.JSON'), 'json');
});

test('supports file paths with directories', () => {
    assert.equal(detectFormat('samples/input/data.csv'), 'csv');
});

test('rejects unsupported formats', () => {
    assert.throws(
        () => detectFormat('input.txt'),
        /Unsupported file format/,
    );
});

test('rejects files without extensions', () => {
    assert.throws(
        () => detectFormat('input'),
        /Unsupported file format/,
    );
});

test('rejects empty file paths', () => {
    assert.throws(
        () => detectFormat(''),
        /File path must be a non-empty string/,
    );
});

test('rejects non-string file paths', () => {
    assert.throws(
        () => detectFormat(null),
        /File path must be a non-empty string/,
    );
});
