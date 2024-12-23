import { KeywordRule } from '../types/sources.js';
import chalk from 'chalk';

interface KeywordMatch {
  keyword: string;
  score: number;
  matchType: 'exact' | 'fuzzy' | 'phrase';
}

function normalizeKeyword(rule: string | KeywordRule): KeywordRule {
  if (typeof rule === 'string') {
    return {
      value: rule,
      type: 'fuzzy',
      caseSensitive: false,
      weight: 5
    };
  }
  return {
    ...rule,
    caseSensitive: rule.caseSensitive ?? false,
    weight: rule.weight ?? 5
  };
}

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

function findMatches(content: string, rule: KeywordRule): KeywordMatch | null {
  const searchContent = rule.caseSensitive ? content : content.toLowerCase();
  const searchValue = rule.caseSensitive ? rule.value : rule.value.toLowerCase();
  const weight = rule.weight ?? 5;

  switch (rule.type) {
    case 'exact':
      if (searchContent.includes(searchValue)) {
        const score = 10 * (weight / 5);
        return {
          keyword: rule.value,
          score,
          matchType: 'exact'
        };
      }
      break;

    case 'phrase':
      const phraseRegex = new RegExp(searchValue.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'), rule.caseSensitive ? 'g' : 'gi');
      if (phraseRegex.test(searchContent)) {
        const score = 8 * (weight / 5);
        return {
          keyword: rule.value,
          score,
          matchType: 'phrase'
        };
      }
      break;

    case 'fuzzy':
      const words = searchContent.split(/\s+/);
      let bestDistance = Infinity;
      let bestWord = '';
      
      for (const word of words) {
        const distance = calculateLevenshteinDistance(word, searchValue);
        const maxDistance = Math.floor(searchValue.length * 0.3); // Allow 30% difference
        
        if (distance < bestDistance && distance <= maxDistance) {
          bestDistance = distance;
          bestWord = word;
        }
      }

      if (bestDistance < Infinity) {
        const similarity = 1 - (bestDistance / searchValue.length);
        const score = Math.round(similarity * 10 * (weight / 5));
        return {
          keyword: rule.value,
          score,
          matchType: 'fuzzy'
        };
      }
      break;
  }

  return null;
}

export function findKeywordMatches(content: string, keywords: (string | KeywordRule)[]): KeywordMatch[] {
  const matches: KeywordMatch[] = [];
  
  for (const keyword of keywords) {
    const rule = normalizeKeyword(keyword);
    const match = findMatches(content, rule);
    
    if (match && match.score >= 4) {
      matches.push(match);
    }
  }

  return matches.sort((a, b) => b.score - a.score);
} 