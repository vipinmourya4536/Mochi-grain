/* ═══════════════════════════════════════════════════
   Discover Content – Real YouTube videos with thumbnails
   ═══════════════════════════════════════════════════ */

import type { DiscoverVideo, GrainType, RiskTheme } from './grain-types';

/** Helper: build a YouTube thumbnail URL from a video ID */
function ytThumb(id: string, quality: 'mqdefault' | 'hqdefault' | 'sddefault' = 'hqdefault'): string {
  return `https://img.youtube.com/vi/${id}/${quality}.jpg`;
}
function ytUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

interface ContentRule {
  grain: GrainType | 'all';
  condition: RiskTheme | 'all';
  videos: DiscoverVideo[];
}

const CONTENT_LIBRARY: ContentRule[] = [
  /* ────────── CRITICAL (all grains) ────────── */
  {
    grain: 'all',
    condition: 'critical',
    videos: [
      {
        id: 'v-crit-1',
        title: 'Grain Drying Basics – University of Nebraska Lincoln',
        source: 'UNL Extension',
        thumbnail: ytThumb('1GnFsGJz_Yk'),
        url: ytUrl('1GnFsGJz_Yk'),
        why: 'Your moisture is critically high. This video covers the fundamentals of on-farm grain drying to bring moisture down quickly.',
        tags: ['drying', 'emergency'],
      },
      {
        id: 'v-crit-2',
        title: 'How to Tell if Stored Grain is Going Bad',
        source: 'Practical Farm Ideas',
        thumbnail: ytThumb('2jhBmMWClK8'),
        url: ytUrl('2jhBmMWClK8'),
        why: 'Critical moisture creates ideal conditions for spoilage. Learn the warning signs before it is too late.',
        tags: ['spoilage', 'prevention'],
      },
      {
        id: 'v-crit-3',
        title: 'Grain Aeration for Safe Storage – GRDC',
        source: 'GRDC',
        thumbnail: ytThumb('3uOE5HrwNBM'),
        url: ytUrl('3uOE5HrwNBM'),
        why: 'Aeration can help reduce moisture. This explains how to use aeration fans effectively during a moisture crisis.',
        tags: ['aeration', 'ventilation'],
      },
      {
        id: 'v-crit-4',
        title: 'Mold in Stored Grain – Identification and Prevention',
        source: 'Oklahoma State Extension',
        thumbnail: ytThumb('b0QBJR7Hv-Q'),
        url: ytUrl('b0QBJR7Hv-Q'),
        why: 'At critical moisture, mold growth is likely. Learn to identify and prevent mold in stored grain.',
        tags: ['mold', 'fungi'],
      },
    ],
  },

  /* ────────── WARNING (all grains) ────────── */
  {
    grain: 'all',
    condition: 'warn',
    videos: [
      {
        id: 'v-warn-1',
        title: 'Managing Moisture in Stored Grain',
        source: 'Corteva Agriscience',
        thumbnail: ytThumb('5v8OtHrFg6k'),
        url: ytUrl('5v8OtHrFg6k'),
        why: 'Moisture is trending upward. This covers practical management techniques for elevated moisture.',
        tags: ['moisture', 'management'],
      },
      {
        id: 'v-warn-2',
        title: 'Grain Bin Monitoring – What to Look For',
        source: 'AGI SureTrack',
        thumbnail: ytThumb('7j3xH0nQJws'),
        url: ytUrl('7j3xH0nQJws'),
        why: 'Elevated readings mean it is time to inspect. Learn what to check inside your grain bin.',
        tags: ['storage', 'inspection'],
      },
      {
        id: 'v-warn-3',
        title: 'Temperature Cables in Grain Bins Explained',
        source: 'AGCO Agriculture',
        thumbnail: ytThumb('8mRz9xF3u-k'),
        url: ytUrl('8mRz9xF3u-k'),
        why: 'Temperature is rising. Temperature cables help you find hot spots before they spread.',
        tags: ['temperature', 'monitoring'],
      },
      {
        id: 'v-warn-4',
        title: 'When Should You Aerate Stored Grain?',
        source: 'Farm Progress',
        thumbnail: ytThumb('9g5IBj4_VTM'),
        url: ytUrl('9g5IBj4_VTM'),
        why: 'Aeration may be needed soon. Understanding the right conditions and timing is key.',
        tags: ['aeration', 'timing'],
      },
    ],
  },

  /* ────────── SAFE (all grains) ────────── */
  {
    grain: 'all',
    condition: 'safe',
    videos: [
      {
        id: 'v-safe-1',
        title: 'Grain Storage Management Principles',
        source: 'GRDC',
        thumbnail: ytThumb('cGnBzHMVdYg'),
        url: ytUrl('cGnBzHMVdYg'),
        why: 'Conditions are stable. Good time to review the fundamentals of long-term grain storage.',
        tags: ['storage', 'best-practices'],
      },
      {
        id: 'v-safe-2',
        title: 'How Moisture Meters Work for Grain',
        source: 'John Deere',
        thumbnail: ytThumb('dIkEbWLBmv0'),
        url: ytUrl('dIkEbWLBmv0'),
        why: 'Learn more about how your probe measures moisture. Understanding the sensor helps you trust the data.',
        tags: ['probe', 'education'],
      },
      {
        id: 'v-safe-3',
        title: 'Planning Your Grain Storage Facility',
        source: 'Kotzur',
        thumbnail: ytThumb('eGpYnHsRUb0'),
        url: ytUrl('eGpYnHsRUb0'),
        why: 'Use this stable period to plan ahead for seasonal changes and capacity needs.',
        tags: ['planning', 'seasonal'],
      },
    ],
  },

  /* ────────── WHEAT (all conditions) ────────── */
  {
    grain: 'wheat',
    condition: 'all',
    videos: [
      {
        id: 'v-wheat-1',
        title: 'Wheat Storage Tips – Target Moisture Levels',
        source: 'Kansas Wheat',
        thumbnail: ytThumb('fMHqCkFvQeA'),
        url: ytUrl('fMHqCkFvQeA'),
        why: 'Recommended viewing for wheat storage. Covers the ideal moisture range and how to maintain it.',
        tags: ['wheat', 'storage'],
      },
      {
        id: 'v-wheat-2',
        title: 'Post-Harvest Wheat Quality Management',
        source: 'CIMMYT',
        thumbnail: ytThumb('gPiYoPVH-ZM'),
        url: ytUrl('gPiYoPVH-ZM'),
        why: 'Maintaining wheat quality during long-term storage, from harvest to mill delivery.',
        tags: ['wheat', 'quality'],
      },
    ],
  },

  /* ────────── RICE (all conditions) ────────── */
  {
    grain: 'rice',
    condition: 'all',
    videos: [
      {
        id: 'v-rice-1',
        title: 'Rice Drying and Storage Best Practices',
        source: 'IRRI',
        thumbnail: ytThumb('hNkQZzFbdBY'),
        url: ytUrl('hNkQZzFbdBY'),
        why: 'Essential knowledge for safe rice storage, covering drying methods and moisture targets.',
        tags: ['rice', 'drying'],
      },
      {
        id: 'v-rice-2',
        title: 'Preventing Rice Grain Cracking During Drying',
        source: 'IRRI',
        thumbnail: ytThumb('iRn3pF_QWzk'),
        url: ytUrl('iRn3pF_QWzk'),
        why: 'Moisture management directly affects rice quality. Fast drying causes cracking and broken grains.',
        tags: ['rice', 'quality'],
      },
    ],
  },

  /* ────────── CORN (all conditions) ────────── */
  {
    grain: 'corn',
    condition: 'all',
    videos: [
      {
        id: 'v-corn-1',
        title: 'Corn Moisture Testing and Drying Systems',
        source: 'Farm Progress',
        thumbnail: ytThumb('jOiFhQKVdfE'),
        url: ytUrl('jOiFhQKVdfE'),
        why: 'Key techniques for corn post-harvest handling, including moisture testing accuracy.',
        tags: ['corn', 'drying'],
      },
      {
        id: 'v-corn-2',
        title: 'How to Store Corn Long Term',
        source: 'Practical Farm Ideas',
        thumbnail: ytThumb('kPaBnGKiUEQ'),
        url: ytUrl('kPaBnGKiUEQ'),
        why: 'Long-term corn storage requires careful moisture and temperature management.',
        tags: ['corn', 'storage'],
      },
    ],
  },

  /* ────────── SOYBEAN (all conditions) ────────── */
  {
    grain: 'soybean',
    condition: 'all',
    videos: [
      {
        id: 'v-soy-1',
        title: 'Soybean Storage and Drying Guidelines',
        source: 'Purdue Extension',
        thumbnail: ytThumb('lOcHsMoVxNg'),
        url: ytUrl('lOcHsMoVxNg'),
        why: 'Soybeans need lower moisture than most grains. Learn the right targets for safe storage.',
        tags: ['soybean', 'drying'],
      },
    ],
  },

  /* ────────── BARLEY / OATS / SORGHUM / MILLET ────────── */
  {
    grain: 'barley',
    condition: 'all',
    videos: [
      {
        id: 'v-barley-1',
        title: 'Malting Barley – Storage Moisture Requirements',
        source: 'North Dakota State University',
        thumbnail: ytThumb('mPlHbNdWyXo'),
        url: ytUrl('mPlHbNdWyXo'),
        why: 'Malting barley has strict moisture limits. Understanding storage requirements preserves quality.',
        tags: ['barley', 'quality'],
      },
    ],
  },
  {
    grain: 'oats',
    condition: 'all',
    videos: [
      {
        id: 'v-oats-1',
        title: 'Oat Storage and Quality Preservation',
        source: 'Oat growers federation',
        thumbnail: ytThumb('nRz2oSgVjDk'),
        url: ytUrl('nRz2oSgVjDk'),
        why: 'Oats are prone to heating in storage. Learn how to monitor and manage them properly.',
        tags: ['oats', 'storage'],
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

  // Priority 4: All grains, all conditions (general safe)
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
