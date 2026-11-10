import path from 'node:path';

const supportedFormats = new Set([
    'csv',
    'json',
    'xml',
    'xlsx',
]);

export function detectFormat(filePath) {
    if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('File path must be a non-empty string');
    }

    const extension = path.extname(filePath).slice(1).toLowerCase();

    if (!supportedFormats.has(extension)) {
        throw new Error(
            `Unsupported file format: "${extension || 'unknown'}". ` +
            `Supported formats: ${[...supportedFormats].join(', ')}`,
        );
    }

    return extension;
}
