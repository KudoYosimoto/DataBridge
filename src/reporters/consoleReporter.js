import chalk from 'chalk';

export function reportToConsole(validationResult, logger = console) {
    if (
        validationResult === null ||
        typeof validationResult !== 'object' ||
        !validationResult.statistics ||
        !Array.isArray(validationResult.errors)
    ) {
        throw new Error('Invalid validation result');
    }

    const { total, valid, invalid } = validationResult.statistics;
    const { errors } = validationResult;

    logger.log(chalk.bold('\nDataBridge — Validation Report'));
    logger.log('------------------------------');
    logger.log(`Total records: ${total}`);
    logger.log(chalk.green(`Valid records: ${valid}`));
    logger.log(chalk.red(`Invalid records: ${invalid}`));

    if (errors.length === 0) {
        logger.log(chalk.green('\nNo validation errors found.'));
        return;
    }

    logger.log(chalk.bold('\nValidation errors:'));

    for (const error of errors) {
        const recordNumber = error.recordIndex + 1;

        logger.log(
            chalk.red(
                `Record ${recordNumber} | Field "${error.field}": ${error.message}`,
            ),
        );
    }
}
