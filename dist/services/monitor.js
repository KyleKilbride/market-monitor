import Parser from 'rss-parser';
import { loadConfig } from '../config/index.js';
import notifier from 'node-notifier';
import chalk from 'chalk';
import { saveFeedItems, loadFeedItems } from './storage.js';
import { findKeywordMatches } from './keyword-matcher.js';
// Track failing sources to implement cooldown
const failingSourcesCooldown = new Map();
const COOLDOWN_DURATION = 15 * 60 * 1000; // 15 minutes
// Log formatting helpers
const log = {
    header: (msg) => console.log(chalk.bold.cyan(`\n━━━ ${msg} ━━━`)),
    info: (msg) => console.log(chalk.gray(`│  ${msg}`)),
    success: (msg) => console.log(chalk.green(`│  ✓ ${msg}`)),
    warning: (msg) => console.log(chalk.yellow(`│  ⚠ ${msg}`)),
    error: (msg) => console.log(chalk.red(`│  ✖ ${msg}`)),
    footer: () => console.log(chalk.cyan('└─')),
};
// Helper function to delay execution
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
// Fetch RSS feed with retry logic
async function fetchFeed(parser, source, maxRetries = 3) {
    const sourceKey = source.url;
    const now = Date.now();
    // Check if source is in cooldown
    const cooldownUntil = failingSourcesCooldown.get(sourceKey);
    if (cooldownUntil && now < cooldownUntil) {
        const minutesLeft = Math.ceil((cooldownUntil - now) / 60000);
        log.warning(`Skipping ${source.name || source.url} (cooldown: ${minutesLeft}m)`);
        throw new Error('Source in cooldown');
    }
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await parser.parseURL(source.url);
            failingSourcesCooldown.delete(sourceKey);
            return result;
        }
        catch (error) {
            lastError = error;
            if (error instanceof Error) {
                const message = error.message.toLowerCase();
                if (message.includes('enotfound')) {
                    log.error(`Cannot reach ${source.name || source.url}`);
                    failingSourcesCooldown.set(sourceKey, now + COOLDOWN_DURATION);
                    throw error;
                }
                if (message.includes('forbidden') || message.includes('unauthorized')) {
                    log.error(`Access denied to ${source.name || source.url}`);
                    failingSourcesCooldown.set(sourceKey, now + COOLDOWN_DURATION);
                    throw error;
                }
                if (message.includes('tls') || message.includes('ssl') || message.includes('certificate')) {
                    log.error(`SSL/TLS error for ${source.name || source.url}`);
                    failingSourcesCooldown.set(sourceKey, now + COOLDOWN_DURATION);
                    throw error;
                }
                if (message.includes('timeout') || message.includes('socket')) {
                    if (attempt === maxRetries) {
                        log.error(`Timeout error for ${source.name || source.url}`);
                        failingSourcesCooldown.set(sourceKey, now + COOLDOWN_DURATION);
                        throw error;
                    }
                }
            }
            if (attempt < maxRetries) {
                await delay(Math.min(1000 * Math.pow(2, attempt - 1), 5000));
            }
            else {
                log.error(`Max retries reached for ${source.name || source.url}`);
                failingSourcesCooldown.set(sourceKey, now + COOLDOWN_DURATION);
            }
        }
    }
    throw lastError;
}
export async function startMonitoring(options) {
    log.header('Market Monitor Starting');
    log.info(`Interval: ${options.checkInterval}m | Silent: ${options.silent}`);
    log.footer();
    const config = await loadConfig();
    const savedItems = await loadFeedItems();
    log.info(`Loaded ${savedItems.length} saved items`);
    const parser = new Parser({
        timeout: 10000,
        headers: {
            'User-Agent': 'Market Monitor RSS Reader/1.0'
        },
        maxRedirects: 5,
        customFields: {
            item: [
                ['media:content', 'media'],
                ['content:encoded', 'contentEncoded'],
                ['description', 'description']
            ]
        }
    });
    const stats = {
        totalProcessed: 0,
        matchedItems: 0,
        startTime: new Date()
    };
    const processedItems = new Map();
    savedItems.forEach(item => {
        const key = `${item.source}-${item.title}`;
        processedItems.set(key, true);
    });
    async function checkFeeds() {
        log.header(`Feed Check at ${new Date().toLocaleTimeString()}`);
        const newItems = [];
        for (const source of config.sources) {
            try {
                if (source.type === 'rss' && source.url) {
                    let sourceMatches = 0;
                    log.info(`Checking ${source.name || source.url}...`);
                    const feed = await fetchFeed(parser, source);
                    let keywordsToUse = [];
                    if (source.useGlobalKeywords && config.keywords) {
                        keywordsToUse = config.keywords;
                    }
                    else if (source.keywords) {
                        keywordsToUse = source.keywords;
                    }
                    else {
                        log.warning(`No keywords for ${source.name || source.url}`);
                        continue;
                    }
                    for (const item of feed.items) {
                        stats.totalProcessed++;
                        const itemKey = `${source.url}-${item.title}`;
                        if (!processedItems.has(itemKey)) {
                            const itemContent = item.contentEncoded || item.description || item.contentSnippet || '';
                            const content = `${item.title} ${itemContent}`;
                            const matches = findKeywordMatches(content, keywordsToUse);
                            if (matches && matches.length > 0) {
                                sourceMatches++;
                                const feedItem = {
                                    title: item.title || '',
                                    content: itemContent,
                                    source: source.url,
                                    sourceName: source.name || new URL(source.url).hostname,
                                    link: item.link || source.url,
                                    timestamp: new Date(item.pubDate || item.isoDate || ''),
                                    addedAt: new Date(),
                                    matchedKeywords: matches,
                                    author: item.author || item.creator,
                                    categories: item.categories,
                                    comments: item.comments,
                                    guid: item.guid,
                                    pubDate: item.pubDate,
                                    creator: item.creator,
                                    contentSnippet: item.contentSnippet,
                                    isoDate: item.isoDate
                                };
                                processedItems.set(itemKey, true);
                                newItems.push(feedItem);
                                stats.matchedItems++;
                                // Show source name and article title for each match
                                const sourceName = source.name || new URL(source.url).hostname;
                                log.success(`${sourceName}: ${item.title}`);
                            }
                        }
                    }
                    if (sourceMatches > 0) {
                        log.info(`Found ${sourceMatches} matches`);
                    }
                }
            }
            catch (error) {
                continue;
            }
        }
        if (newItems.length > 0) {
            const allItems = [...savedItems, ...newItems];
            await saveFeedItems(allItems);
            log.info(`Added ${newItems.length} new matches`);
        }
        log.footer();
    }
    await checkFeeds();
    const intervalMs = options.checkInterval * 60 * 1000;
    setInterval(checkFeeds, intervalMs);
}
function handleNewItem(item, silent) {
    if (!silent) {
        try {
            const matchSummary = item.matchedKeywords
                .sort((a, b) => b.score - a.score)
                .map(m => `${m.keyword}(${m.score})`)
                .join(', ');
            notifier.notify({
                title: `🆕 Market Monitor: ${item.sourceName || new URL(item.source).hostname}`,
                message: `${item.title}\nMatches: ${matchSummary}`,
                sound: true
            });
        }
        catch (error) {
            log.warning('Desktop notifications not available');
        }
    }
}
