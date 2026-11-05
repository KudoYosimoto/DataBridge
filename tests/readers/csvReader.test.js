
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { readCSV } from '../../src/readers/csvReader.js';

test('reads CSV with headers', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
  const filePath = path.join(directory, 'test.csv');

  try {
    await writeFile(filePath, 'name,age\nAlice,25\nBob,30', 'utf-8');

    const records = await readCSV(filePath);

    assert.deepEqual(records, [
      { name: 'Alice', age: '25' },
      { name: 'Bob', age: '30' },
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('reads CSV with a custom delimiter', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
  const filePath = path.join(directory, 'test.csv');

  try {
    await writeFile(filePath, 'name;age\nAlice;25', 'utf-8');

    const records = await readCSV(filePath, { delimiter: ';' });

    assert.deepEqual(records, [{ name: 'Alice', age: '25' }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('reads CSV without headers', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
  const filePath = path.join(directory, 'test.csv');

  try {
    await writeFile(filePath, 'Alice,25\nBob,30', 'utf-8');

    const records = await readCSV(filePath, { hasHeader: false });

    assert.deepEqual(records, [
      { column_1: 'Alice', column_2: '25' },
      { column_1: 'Bob', column_2: '30' },
    ]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('uses custom headers when CSV has no header row', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
  const filePath = path.join(directory, 'test.csv');

  try {
    await writeFile(filePath, 'Alice,25', 'utf-8');

    const records = await readCSV(filePath, {
      hasHeader: false,
      headers: ['name', 'age'],
    });

    assert.deepEqual(records, [{ name: 'Alice', age: '25' }]);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});

test('rejects CSV with duplicate headers', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
  const filePath = path.join(directory, 'test.csv');

  try {
    await writeFile(filePath, 'name,name\nAlice,Bob', 'utf-8');

    await assert.rejects(
      readCSV(filePath),
      /duplicate column names/i,
    );
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
