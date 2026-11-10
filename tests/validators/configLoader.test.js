
import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { loadConfig } from '../../src/validators/configLoader.js';

async function withConfigFile(content, extension, callback) {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, `test.${extension}`);

    try {
        await writeFile(filePath, content, 'utf-8');
        await callback(filePath);
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
}

const validConfig = {
    fields: {
        name: {
            type: 'string',
            required: true,
            min_length: 2,
            max_length: 50,
        },
        age: {
            type: 'integer',
            required: true,
            min: 18,
            max: 100,
        },
    },
};

const validYaml = `fields:
  name:
    type: string
    required: true
    min_length: 2
    max_length: 50
  age:
    type: integer
    required: true
    min: 18
    max: 100
`;

// 1. Загружает корректную JSON-конфигурацию.
test('loads a valid JSON config', async () => {
    await withConfigFile(
        JSON.stringify(validConfig),
        'json',
        async filePath => {
            const result = await loadConfig(filePath);

            assert.deepEqual(result, validConfig);
        },
    );
});

// 2. Загружает корректную YAML-конфигурацию.
test('loads a valid YAML config', async () => {
    await withConfigFile(validYaml, 'yaml', async filePath => {
        const result = await loadConfig(filePath);

        assert.deepEqual(result, validConfig);
    });
});

// 3. Поддерживает расширение .yml.
test('loads a YAML config with .yml extension', async () => {
    await withConfigFile(validYaml, 'yml', async filePath => {
        const result = await loadConfig(filePath);

        assert.deepEqual(result, validConfig);
    });
});

// 4. Поддерживает расширения в верхнем регистре.
test('handles uppercase file extensions', async () => {
    await withConfigFile(
        JSON.stringify(validConfig),
        'JSON',
        async filePath => {
            const result = await loadConfig(filePath);

            assert.deepEqual(result, validConfig);
        },
    );
});

// 5. Выдаёт ошибку, если файл не существует.
test('throws an error when config file does not exist', async () => {
    const directory = await mkdtemp(path.join(tmpdir(), 'databridge-'));
    const filePath = path.join(directory, 'missing.json');

    try {
        await assert.rejects(
            loadConfig(filePath),
            /Failed to read/,
        );
    } finally {
        await rm(directory, { recursive: true, force: true });
    }
});

// 6. Выдаёт ошибку при неподдерживаемом расширении.
test('throws an error for unsupported config file extensions', async () => {
    await withConfigFile('some content', 'txt', async filePath => {
        await assert.rejects(
            loadConfig(filePath),
            /Unsupported/,
        );
    });
});

// 7. Выдаёт ошибку при некорректном JSON.
test('throws an error when JSON syntax is invalid', async () => {
    await withConfigFile(
        '{"fields": ',
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /parse|JSON/i,
            );
        },
    );
});

// 8. Выдаёт ошибку при некорректном YAML.
test('throws an error when YAML syntax is invalid', async () => {
    await withConfigFile(
        'fields: [unclosed',
        'yaml',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /parse|YAML/i,
            );
        },
    );
});

// 9. Выдаёт ошибку, если конфигурация равна null.
test('throws an error when config is null', async () => {
    await withConfigFile('null', 'json', async filePath => {
        await assert.rejects(
            loadConfig(filePath),
            /config/i,
        );
    });
});

// 10. Выдаёт ошибку, если конфигурация является массивом.
test('throws an error when config is an array', async () => {
    await withConfigFile('[]', 'json', async filePath => {
        await assert.rejects(
            loadConfig(filePath),
            /config/i,
        );
    });
});

// 11. Выдаёт ошибку, если отсутствует fields.
test('throws an error when config has no fields property', async () => {
    const config = { name: 'Users' };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /fields/i,
            );
        },
    );
});

// 12. Выдаёт ошибку, если fields не является объектом.
test('throws an error when fields is not an object', async () => {
    const config = { fields: 'invalid' };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /fields/i,
            );
        },
    );
});

// 13. Выдаёт ошибку, если fields пустой.
test('throws an error when fields is empty', async () => {
    const config = { fields: {} };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /fields/i,
            );
        },
    );
});

// 14. Выдаёт ошибку, если у поля отсутствует type.
test('throws an error when field has no type', async () => {
    const config = {
        fields: {
            name: {
                required: true,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /type/i,
            );
        },
    );
});

// 15. Выдаёт ошибку при неизвестном типе поля.
test('throws an error when field has unsupported type', async () => {
    const config = {
        fields: {
            name: {
                type: 'unknown',
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /type/i,
            );
        },
    );
});

// 16. Выдаёт ошибку при неизвестном правиле.
test('throws an error when field has unknown validation rule', async () => {
    const config = {
        fields: {
            name: {
                type: 'string',
                unknown_rule: true,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /rule|unknown/i,
            );
        },
    );
});

// 17. Выдаёт ошибку при несовместимом правиле.
test('throws an error when validation rule is incompatible with field type', async () => {
    const config = {
        fields: {
            age: {
                type: 'integer',
                pattern: '^\\d+$',
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /incompatible|pattern/i,
            );
        },
    );
});

// 18. Выдаёт ошибку при некорректном регулярном выражении.
test('throws an error when regex pattern is invalid', async () => {
    const config = {
        fields: {
            name: {
                type: 'string',
                pattern: '[',
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /pattern|regular expression|regex/i,
            );
        },
    );
});

// 19. Выдаёт ошибку, если min больше max.
test('throws an error when min is greater than max', async () => {
    const config = {
        fields: {
            age: {
                type: 'integer',
                min: 100,
                max: 18,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /min|max/i,
            );
        },
    );
});

// 20. Выдаёт ошибку при некорректном min_length.
test('throws an error when min_length is invalid', async () => {
    const config = {
        fields: {
            name: {
                type: 'string',
                min_length: -1,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /min_length/i,
            );
        },
    );
});

// 21. Выдаёт ошибку при некорректном max_length.
test('throws an error when max_length is invalid', async () => {
    const config = {
        fields: {
            name: {
                type: 'string',
                max_length: 2.5,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /max_length/i,
            );
        },
    );
});

// 22. Выдаёт ошибку, если min_length больше max_length.
test('throws an error when min_length is greater than max_length', async () => {
    const config = {
        fields: {
            name: {
                type: 'string',
                min_length: 20,
                max_length: 10,
            },
        },
    };

    await withConfigFile(
        JSON.stringify(config),
        'json',
        async filePath => {
            await assert.rejects(
                loadConfig(filePath),
                /min_length|max_length/i,
            );
        },
    );
});


test('loads the fields array format from the assignment', async () => {
    const config = `fields:
  - name: id
    type: integer
    required: true
    unique: true
  - name: birth_date
    type: date
    format: "YYYY-MM-DD"
`;
    await withConfigFile(config, 'yaml', async filePath => {
        const result = await loadConfig(filePath);
        assert.deepEqual(result.fields.id, { type: 'integer', required: true, unique: true });
        assert.deepEqual(result.fields.birth_date, { type: 'date', format: 'YYYY-MM-DD' });
    });
});

test('rejects duplicate names in fields array', async () => {
    const config = `fields:
  - name: id
    type: integer
  - name: id
    type: string
`;
    await withConfigFile(config, 'yaml', async filePath => {
        await assert.rejects(loadConfig(filePath), /Duplicate field name/);
    });
});
