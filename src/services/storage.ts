import { FeedItem } from '../types/sources.js';
import { writeFile, readFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const DATA_DIR = join(process.cwd(), 'data');
const STORAGE_FILE = join(DATA_DIR, 'feeds.json');
const MAX_ITEMS = 2000; // Increased from 1000 to store more items
const RETENTION_DAYS = 30; // Keep items for 30 days

interface StoredData {
  lastUpdated: string;
  items: FeedItem[];
}

export async function saveFeedItems(items: FeedItem[]): Promise<void> {
  try {
    if (!existsSync(DATA_DIR)) {
      await mkdir(DATA_DIR);
    }

    // Apply retention policy
    const now = new Date();
    const retentionDate = new Date(now.setDate(now.getDate() - RETENTION_DAYS));
    
    const filteredItems = items
      // Remove items older than retention period
      .filter(item => new Date(item.timestamp) > retentionDate)
      // Sort by timestamp, newest first
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      // Keep only MAX_ITEMS
      .slice(0, MAX_ITEMS);

    const data: StoredData = {
      lastUpdated: new Date().toISOString(),
      items: filteredItems
    };

    await writeFile(STORAGE_FILE, JSON.stringify(data, null, 2));
    console.log(`Saved ${filteredItems.length} items (removed ${items.length - filteredItems.length} old items)`);
  } catch (error) {
    console.error('Failed to save feed items:', error);
  }
}

export async function loadFeedItems(): Promise<FeedItem[]> {
  try {
    if (!existsSync(STORAGE_FILE)) {
      return [];
    }
    const data = await readFile(STORAGE_FILE, 'utf-8');
    const storedData = JSON.parse(data) as StoredData;
    return storedData.items || [];
  } catch {
    return [];
  }
} 