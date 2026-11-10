import test from 'node:test';
import assert from 'node:assert/strict';

import { mkdtemp, writeFile, readFile, access, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    '../..',
);

const cliPath = path.join(projectRoot, 'src/index.js');

const csvContent = [
    'name,email,age',
    ' Alice ,ALICE@example.com,25',
    'Bob,bob@example.com,15',
].join('\n');

const configContent = `
fields:
  name:
    type: string
    required: true
    min_length: 2

  email:
    type: string
    required: true
    pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$'
    unique: true

  age:
    type: integer
    required: true
    min: 18
    max: 100

mapping:
  name: fullName

transformations:
  fullName:
    type: trim

  email:
    type: lowercase
`;

async function withTestEnvironment(callback) {
    const directory = await mkdtemp(
        path.join(tmpdir(), 'databridge-cli-'),
    );

    try {
        const inputPath = path.join(directory, 'users.csv');
        const configPath = path.join(directory, 'schema.yaml');

        await writeFile(inputPath, csvContent, 'utf-8');
        await writeFile(configPath, configContent, 'utf-8');

        await callback({ directory, inputPath, configPath });
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

function runCLI(args) {
    return spawnSync(
        process.execPath,
        [cliPath, ...args],
        {
            cwd: projectRoot,
            encoding: 'utf-8',
        },
    );
}

// 1. Проверка команды stats.
test('CLI stats displays file statistics', async () => {
    await withTestEnvironment(async ({ inputPath }) => {
        const result = runCLI(['stats', inputPath]);

        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Total records:\s+2/);
        assert.match(result.stdout, /Total fields:\s+3/);
        assert.match(result.stdout, /CSV/);
    });
});

// 2. Проверка команды validate.
test('CLI validate checks records and creates reports', async () => {
    await withTestEnvironment(async ({
        directory,
        inputPath,
        configPath,
    }) => {
        const errorsPath = path.join(directory, 'errors.csv');
        const reportPath = path.join(directory, 'report.html');

        const result = runCLI([
            'validate',
            inputPath,
            '--config', configPath,
            '--errors', errorsPath,
            '--report', reportPath,
        ]);

        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Total records:\s+2/);
        assert.match(result.stdout, /Valid records:\s+1/);
        assert.match(result.stdout, /Invalid records:\s+1/);

        await access(errorsPath);
        await access(reportPath);

        const errorsContent = await readFile(errorsPath, 'utf-8');
        const reportContent = await readFile(reportPath, 'utf-8');

        assert.match(errorsContent, /Bob/);
        assert.match(reportContent, /age/);
        assert.match(reportContent, /15/);
        assert.match(reportContent, /greater than or equal to 18/);
    });
});

// 3. Проверка команды convert.
test('CLI convert creates converted JSON file', async () => {
    await withTestEnvironment(async ({
        directory,
        inputPath,
        configPath,
    }) => {
        const outputPath = path.join(directory, 'users.json');

        const result = runCLI([
            'convert',
            inputPath,
            '--to', 'json',
            '--config', configPath,
            '--output', outputPath,
        ]);

        assert.equal(result.status, 0, result.stderr);
        assert.match(result.stdout, /Conversion completed successfully/);
        assert.match(result.stdout, /Converted records:\s+1/);

        const outputContent = await readFile(outputPath, 'utf-8');
        const records = JSON.parse(outputContent);

        assert.deepEqual(records, [
            {
                fullName: 'Alice',
                email: 'alice@example.com',
                age: 25,
            },
        ]);
    });
});

// 4. Проверка неподдерживаемого формата.
test('CLI convert rejects unsupported output format', async () => {
    await withTestEnvironment(async ({ inputPath }) => {
        const result = runCLI([
            'convert',
            inputPath,
            '--to', 'pdf',
        ]);

        assert.equal(result.status, 1);
        assert.match(result.stderr, /Unsupported output format/);
    });
});
