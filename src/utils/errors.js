export class DataBridgeError extends Error {
    constructor(message, options = {}) {
        super(message, options);

        this.name = 'DataBridgeError';
        this.code = options.code ?? 'DATABRIDGE_ERROR';
    }
}

export class FileOperationError extends DataBridgeError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code ?? 'FILE_OPERATION_ERROR',
        });

        this.name = 'FileOperationError';
    }
}

export class ConfigurationError extends DataBridgeError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code ?? 'CONFIGURATION_ERROR',
        });

        this.name = 'ConfigurationError';
    }
}

export class ValidationError extends DataBridgeError {
    constructor(message, options = {}) {
        super(message, {
            ...options,
            code: options.code ?? 'VALIDATION_ERROR',
        });

        this.name = 'ValidationError';
    }
}
