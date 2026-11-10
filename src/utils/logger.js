import chalk from 'chalk';

export function createLogger(output = console) {
    if (
        output === null ||
        typeof output !== 'object' ||
        typeof output.log !== 'function' ||
        typeof output.error !== 'function'
    ) {
        throw new Error('Logger output must provide log() and error() methods');
    }

    return {
        info(message) {
            output.log(chalk.blue(`[INFO] ${message}`));
        },

        success(message) {
            output.log(chalk.green(`[SUCCESS] ${message}`));
        },

        warn(message) {
            output.log(chalk.yellow(`[WARNING] ${message}`));
        },

        error(message) {
            output.error(chalk.red(`[ERROR] ${message}`));
        },
    };
}

export const logger = createLogger();
