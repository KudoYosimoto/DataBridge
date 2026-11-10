import { Command } from 'commander';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';

import {
    readCSV,
    readJSON,
    readXML,
    readExcel,
} from '../readers/index.js';

import {
    writeCSV,
    writeJSON,
    writeXML,
    writeExcel,
} from '../writers/index.js';

import {
    loadConfig,
    validateRecords,
} from '../validators/index.js';

import { convertRecords } from '../converters/index.js';

import {
    reportToConsole,
    reportErrors,
    generateHTMLReport,
} from '../reporters/index.js';

import { detectFormat } from '../utils/formatDetector.js';

const program = new Command();

const readers = {
    csv: readCSV,
    json: readJSON,
    xml: readXML,
    xlsx: readExcel,
};

const writers = {
    csv: writeCSV,
    json: writeJSON,
    xml: writeXML,
    xlsx: writeExcel,
};

async function readInputFile(filePath, options = {}) {
    const format = detectFormat(filePath);
    if (format === 'csv') {
        const headers = options.headers
            ? options.headers.split(',').map(header => header.trim())
            : undefined;
        return readers[format](filePath, {
            delimiter: options.delimiter ?? ',',
            hasHeader: options.header !== false,
            ...(headers ? { headers } : {}),
        });
    }
    return readers[format](filePath);
}

async function loadValidationConfig(configPath) {
    return loadConfig(configPath ?? 'config/schema.yaml');
}

async function saveReports(result, options = {}) {
    await reportErrors(
        result,
        options.errors ?? 'errors.csv',
    );

    await generateHTMLReport(
        result,
        options.report ?? 'reports/validation-report.html',
    );
}

async function validateCommand(input, options) {
    try {
        console.log(`Reading input file: ${input}`);

        const records = await readInputFile(input, options);
        const config = await loadValidationConfig(options.config);

        const result = validateRecords(records, config);

        reportToConsole(result);
        await saveReports(result, options);

        console.log('\nValidation completed.');
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exitCode = 1;
    }
}

async function convertCommand(input, options) {
    try {
        const targetFormat = options.to.toLowerCase();

        if (!Object.hasOwn(writers, targetFormat)) {
            throw new Error(
                `Unsupported output format "${options.to}". ` +
                'Supported formats: csv, json, xml, xlsx.',
            );
        }

        console.log(`Reading input file: ${input}`);

        const records = await readInputFile(input, options);
        const config = await loadValidationConfig(options.config);

        const validationResult = validateRecords(records, config);

        const fieldTypes = Object.fromEntries(
            Object.entries(config.fields).map(([fieldName, rules]) => [
                fieldName,
                rules.type,
            ]),
        );

        const convertedRecords = convertRecords(
            validationResult.validRecords,
            {
                fieldTypes,
                mapping: config.mapping ?? {},
                transformations: config.transformations ?? {},
            },
        );

        const outputPath =
            options.output ??
            path.join('output', `${path.parse(input).name}.${targetFormat}`);

        await mkdir(path.dirname(outputPath), { recursive: true });

        await writers[targetFormat](convertedRecords, outputPath);

        await saveReports(validationResult, options);

        reportToConsole(validationResult);

        console.log(`\nConversion completed successfully.`);
        console.log(`Output file: ${outputPath}`);
        console.log(`Converted records: ${convertedRecords.length}`);
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exitCode = 1;
    }
}

async function statsCommand(input) {
    try {
        console.log(`Reading input file: ${input}`);

        const records = await readInputFile(input);

        const fieldNames = [
            ...new Set(records.flatMap(record => Object.keys(record))),
        ];

        console.log('\nDataBridge — File Statistics');
        console.log('----------------------------');
        console.log(`File: ${input}`);
        console.log(`Format: ${detectFormat(input).toUpperCase()}`);
        console.log(`Total records: ${records.length}`);
        console.log(`Total fields: ${fieldNames.length}`);

        if (fieldNames.length > 0) {
            console.log('\nFields:');

            for (const fieldName of fieldNames) {
                console.log(`- ${fieldName}`);
            }
        } else {
            console.log('\nNo fields found.');
        }

        console.log('\nStatistics completed.');
    } catch (error) {
        console.error(`\nError: ${error.message}`);
        process.exitCode = 1;
    }
}

program
    .name('databridge')
    .description('DataBridge - Data conversion and validation CLI')
    .version('1.0.0');

program
    .command('convert')
    .description('Convert data between different formats')
    .argument('<input>', 'Path to the input file')
    .requiredOption('--to <format>', 'Target output format')
    .option('--config <path>', 'Path to validation configuration')
    .option('--output <path>', 'Path to the output file')
    .option('--errors <path>', 'Path to the CSV errors file')
    .option('--report <path>', 'Path to the HTML report')
    .option('--delimiter <char>', 'CSV delimiter (one character)', ',')
    .option('--no-header', 'CSV input has no header row')
    .option('--headers <list>', 'Comma-separated column names for headerless CSV')
    .action(convertCommand);

program
    .command('validate')
    .description('Validate input data')
    .argument('<input>', 'Path to the input file')
    .option('--config <path>', 'Path to validation configuration')
    .option('--errors <path>', 'Path to the CSV errors file')
    .option('--report <path>', 'Path to the HTML report')
    .option('--delimiter <char>', 'CSV delimiter (one character)', ',')
    .option('--no-header', 'CSV input has no header row')
    .option('--headers <list>', 'Comma-separated column names for headerless CSV')
    .action(validateCommand);

program
    .command('stats')
    .description('Show statistics about input data')
    .argument('<input>', 'Path to the input file')
    .action(statsCommand);

export function runCLI() {
    program.parse();
}
