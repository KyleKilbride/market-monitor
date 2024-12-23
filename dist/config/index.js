import { readFile } from 'fs/promises';
import { join } from 'path';
function validateConfig(config) {
    return (config &&
        Array.isArray(config.keywords) &&
        Array.isArray(config.sources) &&
        config.sources.every((source) => source.type === 'rss' &&
            typeof source.url === 'string' &&
            (!source.keywords || Array.isArray(source.keywords)) &&
            (!source.name || typeof source.name === 'string') &&
            (!source.weight || typeof source.weight === 'number') &&
            (!source.useGlobalKeywords || typeof source.useGlobalKeywords === 'boolean')));
}
export async function loadConfig() {
    try {
        const configPath = join(process.cwd(), 'config.json');
        const configData = await readFile(configPath, 'utf-8');
        const config = JSON.parse(configData);
        if (!validateConfig(config)) {
            throw new Error('Invalid config format');
        }
        return config;
    }
    catch (error) {
        throw new Error(`Failed to load config: ${error}`);
    }
}
