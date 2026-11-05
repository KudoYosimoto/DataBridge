
import { readFile } from 'node:fs/promises';
import { parse } from 'csv-parse/sync';

/**
 * Reads a CSV file and converts its rows into JavaScript objects.
 *
 * @param {string} filePath - Path to the CSV file.
 * @param {object} options - CSV parsing options.
 * @param {string} options.delimiter - Column separator.
 * @param {boolean} options.hasHeader - Whether the first row contains headers.
 * @param {string[]} options.headers - Custom headers for headerless CSV files.
 * @returns {Promise<object[]>} Parsed records.
 */

export async function readCSV(filePath, options = {}) {
  const {
    delimiter = ',',
    hasHeader = true,
    headers: customHeaders,
  } = options;

  if (typeof delimiter !== 'string' || delimiter.length !== 1) {
    throw new Error('CSV delimiter must be exactly one character.');
  }

  if (
    customHeaders !== undefined &&
    (!Array.isArray(customHeaders) ||
      customHeaders.some((header) => typeof header !== 'string' || !header.trim()))
  ) {
    throw new Error('Custom headers must be an array of non-empty strings.');
  }

  if (customHeaders && new Set(customHeaders).size !== customHeaders.length) {
    throw new Error('CSV headers must be unique.');
  }

  let content;

  try {
    content = await readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to read CSV file "${filePath}": ${error.message}`, {
      cause: error,
    });
  }

  let rows;

  try {
    rows = parse(content, {
      delimiter,
      bom: true,
      skip_empty_lines: true,
      relax_column_count: false,
    });
  } catch (error) {
    throw new Error(`Failed to parse CSV file "${filePath}": ${error.message}`, {
      cause: error,
    });
  }

  if (rows.length === 0) {
    return [];
  }

  let headers;
  let dataRows;

  if (hasHeader) {
    headers = rows[0].map((header) => String(header).trim());
    dataRows = rows.slice(1);
  } else {
    headers = customHeaders ?? rows[0].map((_, index) => `column_${index + 1}`);
    dataRows = rows;
  }

  if (headers.length === 0 || headers.some((header) => !header)) {
    throw new Error('CSV contains an empty or missing column name.');
  }

  if (new Set(headers).size !== headers.length) {
    throw new Error('CSV contains duplicate column names.');
  }

  return dataRows.map((row, index) => {
    if (row.length !== headers.length) {
      throw new Error(
        `Invalid number of columns in CSV record ${index + 1}: ` +
        `expected ${headers.length}, received ${row.length}.`,
      );
    }

    return Object.fromEntries(
      headers.map((header, columnIndex) => [header, row[columnIndex]]),
    );
  });
}
