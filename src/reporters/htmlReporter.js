import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

function escapeHtml(value) {
    return String(value ?? '')
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;');
}

export async function generateHTMLReport(
    validationResult,
    filePath = 'reports/report.html',
) {
    if (
        validationResult === null ||
        typeof validationResult !== 'object' ||
        !validationResult.statistics ||
        !Array.isArray(validationResult.errors)
    ) {
        throw new Error('Invalid validation result');
    }

    if (typeof filePath !== 'string' || filePath.trim() === '') {
        throw new Error('File path must be a non-empty string');
    }

    const { total, valid, invalid } = validationResult.statistics;
    const { errors } = validationResult;

    const errorRows = errors.length > 0
        ? errors.map(error => `
            <tr>
                <td>${escapeHtml(error.recordIndex + 1)}</td>
                <td>${escapeHtml(error.field)}</td>
                <td>${escapeHtml(error.value)}</td>
                <td>${escapeHtml(error.message)}</td>
            </tr>
        `).join('')
        : `
            <tr>
                <td colspan="4" class="empty">
                    No validation errors found.
                </td>
            </tr>
        `;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>DataBridge — Validation Report</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 1100px;
            margin: 40px auto;
            padding: 0 20px;
            color: #222;
            background: #f5f6f8;
        }

        h1, h2 {
            color: #243247;
        }

        .statistics {
            display: flex;
            gap: 16px;
            flex-wrap: wrap;
            margin: 24px 0;
        }

        .stat {
            flex: 1;
            min-width: 150px;
            padding: 20px;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
        }

        .stat strong {
            display: block;
            margin-top: 8px;
            font-size: 28px;
        }

        .valid {
            color: #198754;
        }

        .invalid {
            color: #dc3545;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            background: white;
        }

        th, td {
            padding: 12px;
            border: 1px solid #ddd;
            text-align: left;
            overflow-wrap: anywhere;
        }

        th {
            background: #243247;
            color: white;
        }

        .empty {
            text-align: center;
            color: #198754;
        }
    </style>
</head>
<body>
    <h1>DataBridge — Validation Report</h1>

    <section class="statistics">
        <div class="stat">
            Total records
            <strong>${escapeHtml(total)}</strong>
        </div>
        <div class="stat">
            Valid records
            <strong class="valid">${escapeHtml(valid)}</strong>
        </div>
        <div class="stat">
            Invalid records
            <strong class="invalid">${escapeHtml(invalid)}</strong>
        </div>
    </section>

    <h2>Validation errors</h2>

    <table>
        <thead>
            <tr>
                <th>Record</th>
                <th>Field</th>
                <th>Value</th>
                <th>Error</th>
            </tr>
        </thead>
        <tbody>
            ${errorRows}
        </tbody>
    </table>
</body>
</html>
`;

    try {
        await mkdir(path.dirname(filePath), { recursive: true });
        await writeFile(filePath, html, 'utf-8');
    } catch (error) {
        throw new Error(
            `Failed to write HTML report "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    return filePath;
}
