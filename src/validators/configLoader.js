import * as yaml from 'js-yaml';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

export async function loadConfig(filePath) {
    let content;

    try {
        content = await readFile(filePath, 'utf-8');
    } catch (error) {
        throw new Error(
            `Failed to read config file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    try {
        switch (path.extname(filePath).toLowerCase()) {
            case '.yaml':
            case '.yml':
                content = yaml.load(content);
                break;

            case '.json':
                content = JSON.parse(content);
                break;

            default:
                throw new Error(
                    `Unsupported config file extension "${path.extname(filePath)}". Use .yaml, .yml or .json.`,
                );
        }
    } catch (error) {
        throw new Error(
            `Failed to parse config file "${filePath}": ${error.message}`,
            { cause: error },
        );
    }

    content = normalizeConfig(content);
    validateConfig(content);

    return content;
}

export function normalizeConfig(config) {
    if (config && typeof config === 'object' && !Array.isArray(config) && Array.isArray(config.fields)) {
        const normalized = { ...config, fields: {} };
        for (const field of config.fields) {
            if (!field || typeof field !== 'object' || Array.isArray(field) || typeof field.name !== 'string' || !field.name.trim()) {
                throw new Error('Each item in the fields array must contain a non-empty name.');
            }
            const { name, ...rules } = field;
            if (Object.hasOwn(normalized.fields, name)) throw new Error(`Duplicate field name: "${name}".`);
            normalized.fields[name] = rules;
        }
        return normalized;
    }
    return config;
}

export function validateConfig(config) {
    config = normalizeConfig(config);
    if (
        typeof config !== 'object' ||
        config === null ||
        Array.isArray(config)
    ) {
        throw new Error('Config should be an object.');
    }

    if (!Object.hasOwn(config, 'fields')) {
        throw new Error('Config must contain a "fields" property.');
    }

    const fields = config.fields;

    if (
        typeof fields !== 'object' ||
        fields === null ||
        Array.isArray(fields)
    ) {
        throw new Error('The "fields" property must be an object.');
    }

    const fieldKeys = Object.keys(fields);

    if (fieldKeys.length === 0) {
        throw new Error('The "fields" object must not be empty.');
    }

    for (const key of fieldKeys) {
        const fieldRule = fields[key];

        if (
            typeof fieldRule !== 'object' ||
            fieldRule === null ||
            Array.isArray(fieldRule)
        ) {
            throw new Error(
                `The rule for the "${key}" field must be an object.`,
            );
        }

        validateFieldRules(key, fieldRule);
    }

    validateMapping(config.mapping);
    validateTransformations(config.transformations);
    return true;
}

const VALID_TYPES = ['string', 'integer', 'float', 'date', 'boolean'];

const ALLOWED_RULES = new Set([
    'type',
    'required',
    'unique',
    'pattern',
    'format',
    'min_length',
    'max_length',
    'max',
    'min',
]);

const TYPE_CONSTRAINTS = {
    string: ['type', 'required', 'unique', 'pattern', 'min_length', 'max_length'],
    integer: ['type', 'required', 'unique', 'min', 'max'],
    float: ['type', 'required', 'unique', 'min', 'max'],
    date: ['type', 'required', 'unique', 'min', 'max', 'format'],
    boolean: ['type', 'required', 'unique'],
};

function validateFieldRules(fieldName, fieldRule) {
    const type = fieldRule.type;

    if (type === undefined || !VALID_TYPES.includes(type)) {
        throw new Error(
            `Field "${fieldName}": invalid type "${type}".`,
        );
    }

    for (const ruleName of Object.keys(fieldRule)) {
        if (!ALLOWED_RULES.has(ruleName)) {
            throw new Error(
                `Field "${fieldName}": unknown rule "${ruleName}".`,
            );
        }

        if (!TYPE_CONSTRAINTS[type].includes(ruleName)) {
            throw new Error(
                `Field "${fieldName}": rule "${ruleName}" is not allowed for type "${type}".`,
            );
        }
    }

    for (const [ruleName, ruleValue] of Object.entries(fieldRule)) {
        validateRuleCompatibility(fieldName, ruleName, ruleValue, type);
    }

    validateCrossRuleCompatibility(fieldName, fieldRule);
}

function isValidDate(value) {
    if (typeof value !== 'string') {
        return false;
    }

    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

    if (!match) {
        return false;
    }

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);

    if (year < 1000) {
        return false;
    }

    const date = new Date(Date.UTC(year, month - 1, day));

    return (
        date.getUTCFullYear() === year &&
        date.getUTCMonth() === month - 1 &&
        date.getUTCDate() === day
    );
}

function validateRuleCompatibility(fieldName, ruleName, ruleValue, type) {
    switch (ruleName) {
        case 'type':
            break;

        case 'required':
        case 'unique':
            if (typeof ruleValue !== 'boolean') {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be a Boolean.`,
                );
            }
            break;

        case 'format':
            if (type !== 'date' || ruleValue !== 'YYYY-MM-DD') throw new Error('Only date format YYYY-MM-DD is supported for field ' + fieldName);
            break;

        case 'pattern':
            if (typeof ruleValue !== 'string') {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be a string.`,
                );
            }

            try {
                new RegExp(ruleValue);
            } catch {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" contains an invalid regular expression.`,
                );
            }
            break;

        case 'min':
        case 'max':
            if (
                type === 'integer' &&
                (typeof ruleValue !== 'number' || !Number.isInteger(ruleValue))
            ) {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be an integer.`,
                );
            }

            if (
                type === 'float' &&
                (typeof ruleValue !== 'number' || !Number.isFinite(ruleValue))
            ) {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be a finite number.`,
                );
            }

            if (type === 'date' && !isValidDate(ruleValue)) {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be a valid date in YYYY-MM-DD format.`,
                );
            }
            break;

        case 'min_length':
        case 'max_length':
            if (
                typeof ruleValue !== 'number' ||
                !Number.isInteger(ruleValue) ||
                ruleValue < 0
            ) {
                throw new Error(
                    `Field "${fieldName}": property "${ruleName}" must be a non-negative integer.`,
                );
            }
            break;

        default:
            break;
    }
}

function validateCrossRuleCompatibility(fieldName, fieldRules) {
    if (
        fieldRules.min_length !== undefined &&
        fieldRules.max_length !== undefined &&
        fieldRules.min_length > fieldRules.max_length
    ) {
        throw new Error(
            `Field "${fieldName}": "min_length" (${fieldRules.min_length}) cannot be greater than "max_length" (${fieldRules.max_length}).`,
        );
    }

    if (
        fieldRules.min !== undefined &&
        fieldRules.max !== undefined &&
        fieldRules.min > fieldRules.max
    ) {
        const constraintType = fieldRules.type === 'date' ? 'date' : 'value';

        throw new Error(
            `Field "${fieldName}": "min" ${constraintType} (${fieldRules.min}) cannot be greater than "max" (${fieldRules.max}).`,
        );
    }
}


function validateMapping(mapping) {
    if (mapping === undefined) return;

    if (
        typeof mapping !== 'object' ||
        mapping === null ||
        Array.isArray(mapping)
    ) {
        throw new Error('"mapping" must be an object.');
    }

    for (const [source, target] of Object.entries(mapping)) {
        if (
            typeof target !== 'string' ||
            target.trim() === ''
        ) {
            throw new Error(
                `Mapping for "${source}" must be a non-empty string.`,
            );
        }
    }

    const targets = Object.values(mapping);

    if (new Set(targets).size !== targets.length) {
        throw new Error('Mapping must not contain duplicate target fields.');
    }
}

function validateTransformations(transformations) {
    if (transformations === undefined) return;

    if (
        typeof transformations !== 'object' ||
        transformations === null ||
        Array.isArray(transformations)
    ) {
        throw new Error('"transformations" must be an object.');
    }

    const supportedTypes = [
        'uppercase',
        'lowercase',
        'trim',
        'replace',
        'timestampToDate',
    ];

    for (const [fieldName, transformation] of Object.entries(transformations)) {
        if (
            typeof transformation !== 'object' ||
            transformation === null ||
            Array.isArray(transformation)
        ) {
            throw new Error(
                `Transformation for "${fieldName}" must be an object.`,
            );
        }

        if (!supportedTypes.includes(transformation.type)) {
            throw new Error(
                `Unsupported transformation "${transformation.type}" for field "${fieldName}".`,
            );
        }

        if (transformation.type === 'timestampToDate') {
            if (transformation.unit !== undefined && !['seconds', 'milliseconds'].includes(transformation.unit)) {
                throw new Error('Timestamp unit must be seconds or milliseconds for field ' + fieldName);
            }
            if (transformation.dictionary !== undefined) throw new Error('timestampToDate does not support dictionary');
        } else if (transformation.type === 'replace') {
            const dictionary = transformation.dictionary;

            if (
                typeof dictionary !== 'object' ||
                dictionary === null ||
                Array.isArray(dictionary)
            ) {
                throw new Error(
                    `Replace transformation for "${fieldName}" requires a dictionary object.`,
                );
            }
        } else if (transformation.dictionary !== undefined || transformation.unit !== undefined) {
            throw new Error(
                `Transformation "${transformation.type}" for "${fieldName}" does not support a dictionary.`,
            );
        }
    }
}
