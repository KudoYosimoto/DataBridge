import { readFile } from 'node:fs/promises';

export async function readJSON(filePath) {

    let content;
    try {
        content = await readFile(filePath, 'utf-8');
    } catch (error) {
        throw new Error(`Failed to read JSON file "${filePath}": ${error.message}`, {
            cause: error,
        });
    }

    try{
        content = JSON.parse(content);
    } catch(error){
        throw new Error(`Failed to parse JSON file "${filePath}": ${error.message}`, {
            cause: error,
        });
    }

    if (!Array.isArray(content)) {
        throw new Error('JSON root must be an array');
    }

    for (const[index, record] of content.entries()){
        if (
            typeof record !== 'object'
            || record === null
            || Array.isArray(record)
        ){
            throw new Error(
                `Invalid record at index ${index}: expected an object`,
            )
        }

        const hasNestedValues = Object.values(record).some(
            val => typeof val === 'object' && val !== null
        );

        if (hasNestedValues){
            throw new Error(
                `Invalid record at index ${index}: nested objects and arrays are not supported`,
            );
        }
    }

    return content
}
