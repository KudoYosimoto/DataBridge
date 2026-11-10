
const transformations = {
    uppercase(value) {
        return typeof value === 'string' ? value.toUpperCase() : value;
    },

    lowercase(value) {
        return typeof value === 'string' ? value.toLowerCase() : value;
    },

    trim(value) {
        return typeof value === 'string' ? value.trim() : value;
    },

    replace(value, dictionary = {}) {
        if (typeof value !== 'string') {
            return value;
        }

        return Object.hasOwn(dictionary, value)
            ? dictionary[value]
            : value;
    },

    timestampToDate(value, unit = 'milliseconds') {
        const timestamp = Number(value);

        if (!Number.isFinite(timestamp)) {
            throw new Error(`Invalid timestamp: "${value}"`);
        }

        if (!['seconds', 'milliseconds'].includes(unit)) throw new Error('Timestamp unit must be seconds or milliseconds');
        const date = new Date(unit === 'seconds' ? timestamp * 1000 : timestamp);

        if (Number.isNaN(date.getTime())) {
            throw new Error(`Invalid timestamp: "${value}"`);
        }

        return date.toISOString().slice(0, 10);
    },
};

export function transformValue(value, transformation) {
    if (!transformation || typeof transformation !== 'object') {
        throw new Error('Transformation must be an object');
    }

    const { type, dictionary, unit } = transformation;

    if (typeof type !== 'string' || !Object.hasOwn(transformations, type)) {
        throw new Error(`Unsupported transformation: "${type}"`);
    }

    if (type === 'timestampToDate') return transformations.timestampToDate(value, unit ?? 'milliseconds');

    if (type === 'replace') {
        if (
            dictionary === null ||
            typeof dictionary !== 'object' ||
            Array.isArray(dictionary)
        ) {
            throw new Error('Replace transformation requires a dictionary object');
        }

        return transformations.replace(value, dictionary);
    }

    return transformations[type](value);
}

export function transformRecords(records, config = {}) {
    if (!Array.isArray(records)) {
        throw new Error('Records must be an array');
    }

    if (
        config === null ||
        typeof config !== 'object' ||
        Array.isArray(config)
    ) {
        throw new Error('Transformation config must be an object');
    }

    return records.map(record => {
        if (
            record === null ||
            typeof record !== 'object' ||
            Array.isArray(record)
        ) {
            throw new Error('Each record must be an object');
        }

        const transformedRecord = { ...record };

        for (const [fieldName, transformation] of Object.entries(config)) {
            if (!Object.hasOwn(transformedRecord, fieldName)) {
                continue;
            }

            transformedRecord[fieldName] = transformValue(
                transformedRecord[fieldName],
                transformation,
            );
        }

        return transformedRecord;
    });
}
