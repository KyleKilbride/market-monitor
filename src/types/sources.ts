export interface KeywordRule {
  value: string;
  type: 'exact' | 'fuzzy' | 'phrase';
  caseSensitive?: boolean;
  weight?: number; // 1-10, default 5
}

export type Keyword = string | KeywordRule;

export interface Source {
  type: 'rss';
  url: string;
  name?: string;
  keywords?: Keyword[];
  useGlobalKeywords?: boolean;
  weight?: number;
}

export interface Config {
  keywords: Keyword[];
  sources: Source[];
}

export interface FeedItem {
  title: string;
  content: string;
  source: string;
  sourceName?: string;
  link: string;
  timestamp: Date;
  addedAt: Date;
  matchedKeywords: Array<{
    keyword: string;
    score: number;
    matchType: 'exact' | 'fuzzy' | 'phrase';
  }>;
  author?: string;
  categories?: string[];
  comments?: string;
  guid?: string;
  pubDate?: string;
  creator?: string;
  contentSnippet?: string;
  isoDate?: string;
} 