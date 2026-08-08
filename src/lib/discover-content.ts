/* ═══════════════════════════════════════════════════════════════
   Discover Content – Curated YouTube recommendations by grain & condition
   ═══════════════════════════════════════════════════════════════ */

import type { DiscoverVideo, GrainType, RiskTheme } from './grain-types';

interface ContentRule {
  grain: GrainType | 'all';
  condition: RiskTheme | 'all';
  videos: DiscoverVideo[];
}

const CONTENT_LIBRARY: ContentRule[] = [
  {
    grain: 'all',
    condition: 'critical',
    videos: [
      {
        id: 'v-crit-1',
        title: 'Emergency Grain Drying Methods',
        source: 'Grain Storage Solutions',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=emergency+grain+drying+methods',
        why: 'Your moisture levels are critically high. Immediate drying is essential.',
        tags: ['drying', 'emergency'],
      },
      {
        id: 'v-crit-2',
        title: 'Preventing Spoilage in Wet Grain',
        source: 'AgriSafe Learning',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=preventing+spoilage+wet+grain',
        why: 'High moisture increases spoilage risk. Learn prevention techniques.',
        tags: ['spoilage', 'prevention'],
      },
      {
        id: 'v-crit-3',
        title: 'Grain Aeration and Ventilation Basics',
        source: 'Farm Progress',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=grain+aeration+ventilation+basics',
        why: 'Aeration can help reduce moisture. Learn how to set it up quickly.',
        tags: ['aeration', 'ventilation'],
      },
      {
        id: 'v-crit-4',
        title: 'Mold and Fungi in Stored Grain',
        source: 'University Extension',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=mold+fungi+stored+grain+prevention',
        why: 'Critical moisture levels create ideal conditions for mold growth.',
        tags: ['mold', 'fungi'],
      },
    ],
  },
  {
    grain: 'all',
    condition: 'warn',
    videos: [
      {
        id: 'v-warn-1',
        title: 'Grain Moisture Management Best Practices',
        source: 'Crop Science Review',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=grain+moisture+management+best+practices',
        why: 'Moisture is trending upward. Learn management strategies.',
        tags: ['moisture', 'management'],
      },
      {
        id: 'v-warn-2',
        title: 'How to Check Grain Storage Conditions',
        source: 'Practical Farmer',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=check+grain+storage+conditions',
        why: 'Elevated readings suggest checking your storage environment.',
        tags: ['storage', 'inspection'],
      },
      {
        id: 'v-warn-3',
        title: 'Grain Bin Temperature Monitoring',
        source: 'AGCO Agriculture',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=grain+bin+temperature+monitoring',
        why: 'Temperature is elevated. Proper monitoring helps prevent loss.',
        tags: ['temperature', 'monitoring'],
      },
      {
        id: 'v-warn-4',
        title: 'When to Aerate Stored Grain',
        source: 'Grain Handlers Network',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=when+to+aerate+stored+grain',
        why: 'Aeration may be needed soon. Learn the right conditions.',
        tags: ['aeration', 'timing'],
      },
    ],
  },
  {
    grain: 'wheat',
    condition: 'all',
    videos: [
      {
        id: 'v-wheat-1',
        title: 'Optimal Wheat Storage Moisture Levels',
        source: 'Wheat Growers Association',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=optimal+wheat+storage+moisture+levels',
        why: 'Recommended content for wheat storage monitoring.',
        tags: ['wheat', 'storage'],
      },
      {
        id: 'v-wheat-2',
        title: 'Wheat Quality After Harvest',
        source: 'Post-Harvest Hub',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=wheat+quality+after+harvest+storage',
        why: 'Maintaining wheat quality during long-term storage.',
        tags: ['wheat', 'quality'],
      },
    ],
  },
  {
    grain: 'rice',
    condition: 'all',
    videos: [
      {
        id: 'v-rice-1',
        title: 'Rice Storage and Drying Techniques',
        source: 'Rice Research Institute',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=rice+storage+drying+techniques',
        why: 'Essential knowledge for safe rice storage.',
        tags: ['rice', 'drying'],
      },
      {
        id: 'v-rice-2',
        title: 'Preventing Rice Grain Cracking',
        source: 'Rice Milling Academy',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=preventing+rice+grain+cracking+moisture',
        why: 'Moisture management directly affects rice quality.',
        tags: ['rice', 'quality'],
      },
    ],
  },
  {
    grain: 'corn',
    condition: 'all',
    videos: [
      {
        id: 'v-corn-1',
        title: 'Corn Moisture Testing and Drying',
        source: 'Corn Producers Federation',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=corn+moisture+testing+drying',
        why: 'Key techniques for corn post-harvest handling.',
        tags: ['corn', 'drying'],
      },
    ],
  },
  {
    grain: 'all',
    condition: 'safe',
    videos: [
      {
        id: 'v-safe-1',
        title: 'Long-Term Grain Storage Principles',
        source: 'Grain Storage Solutions',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=long+term+grain+storage+principles',
        why: 'Good time to review best practices while conditions are stable.',
        tags: ['storage', 'best-practices'],
      },
      {
        id: 'v-safe-2',
        title: 'Understanding Grain Moisture Meters',
        source: 'AgriTech Insights',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=understanding+grain+moisture+meters',
        why: 'Learn more about how your probe measures moisture.',
        tags: ['probe', 'education'],
      },
      {
        id: 'v-safe-3',
        title: 'Seasonal Grain Storage Planning',
        source: 'Farm Journal',
        thumbnail: '',
        url: 'https://www.youtube.com/results?search_query=seasonal+grain+storage+planning',
        why: 'Plan ahead for changing weather conditions.',
        tags: ['planning', 'seasonal'],
      },
    ],
  },
];

/**
 * Get recommended videos based on current grain type and risk condition.
 * Returns a curated list ordered by relevance.
 */
export function getDiscoverContent(
  grainType: GrainType,
  condition: RiskTheme,
): DiscoverVideo[] {
  const results: DiscoverVideo[] = [];
  const seen = new Set<string>();

  // Priority 1: Exact match (grain + condition)
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain === grainType && rule.condition === condition) {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  // Priority 2: All grains, matching condition
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain === 'all' && rule.condition === condition) {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  // Priority 3: Matching grain, all conditions
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain === grainType && rule.condition === 'all') {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  // Priority 4: All grains, all conditions (general)
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain === 'all' && rule.condition === 'all') {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  // Priority 5: Other grains, current condition
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain !== 'all' && rule.grain !== grainType && rule.condition === condition) {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  return results.slice(0, 10);
}
