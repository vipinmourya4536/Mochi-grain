/* ═══════════════════════════════════════════════════
   Discover Content – Real, verified YouTube videos
   Every video ID below was checked against the
   YouTube oEmbed API (title + channel) and its
   thumbnail (HTTP 200) at curation time.
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
        title: 'Preventing Grain Spoilage in Storage',
        source: 'Ag PhD',
        thumbnail: ytThumb('j5d8Hx_fcM0'),
        url: ytUrl('j5d8Hx_fcM0'),
        why: 'Your moisture is critically high. This video covers why spoilage starts and the fastest ways to stop it.',
        tags: ['spoilage', 'emergency'],
      },
      {
        id: 'v-crit-2',
        title: 'Our Grain Dryer and Bin System – How They Work',
        source: 'Millennial Farmer',
        thumbnail: ytThumb('Ov3ZLYDpk9U'),
        url: ytUrl('Ov3ZLYDpk9U'),
        why: 'A working farm walks through its dryer and bin setup — practical reference when moisture must come down quickly.',
        tags: ['drying', 'equipment'],
      },
      {
        id: 'v-crit-3',
        title: 'Proper Grain Bin Management Saves Lives',
        source: 'UK Martin-Gatton CAFE',
        thumbnail: ytThumb('3AxwPhMck5I'),
        url: ytUrl('3AxwPhMck5I'),
        why: 'Critical moisture often means crusted or bridged grain. Extension specialists show how to work the bin safely.',
        tags: ['safety', 'bin-management'],
      },
      {
        id: 'v-crit-4',
        title: 'The Agronomists Ep 212: Drying Grain',
        source: 'RealAgriculture',
        thumbnail: ytThumb('V6j3kd3-204'),
        url: ytUrl('V6j3kd3-204'),
        why: 'Agronomy experts answer the core question of a moisture crisis: how to bring grain down to a safe level efficiently.',
        tags: ['drying', 'expert'],
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
        title: 'Grain Storage Management – Crop Hour',
        source: 'SDSU Extension',
        thumbnail: ytThumb('EEFTK-acVYg'),
        url: ytUrl('EEFTK-acVYg'),
        why: 'Moisture is trending upward. Extension specialists cover the management techniques that keep rising moisture in check.',
        tags: ['moisture', 'management'],
      },
      {
        id: 'v-warn-2',
        title: 'Grain Storage Series 3/3: Monitoring Grain Temperature',
        source: 'GRDC',
        thumbnail: ytThumb('zaekI8XcKhg'),
        url: ytUrl('zaekI8XcKhg'),
        why: 'Temperature is your early-warning signal. Learn where hot spots form and how to monitor for them.',
        tags: ['temperature', 'monitoring'],
      },
      {
        id: 'v-warn-3',
        title: 'Natural Aeration Grain Drying',
        source: 'Farming Smarter',
        thumbnail: ytThumb('lFy1-uf5nCc'),
        url: ytUrl('lFy1-uf5nCc'),
        why: 'Aeration may be enough at this stage. This session explains when natural airflow works and when it will not.',
        tags: ['aeration', 'timing'],
      },
      {
        id: 'v-warn-4',
        title: 'GSI GrainVue Takes the Guesswork Out of Managing Grain',
        source: 'RealAgriculture',
        thumbnail: ytThumb('cMToOp4Wa48'),
        url: ytUrl('cMToOp4Wa48'),
        why: 'Elevated readings are a cue to tighten your monitoring loop. See how connected systems track moisture around the clock.',
        tags: ['monitoring', 'technology'],
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
        title: 'Grain Storage Tips with Sam McNeill',
        source: 'UK Martin-Gatton CAFE',
        thumbnail: ytThumb('_ZrJ_gPxYqc'),
        url: ytUrl('_ZrJ_gPxYqc'),
        why: 'Conditions are stable — the ideal time to review storage fundamentals with a storage research specialist.',
        tags: ['storage', 'best-practices'],
      },
      {
        id: 'v-safe-2',
        title: 'How to Test the Moisture Content of Grain',
        source: 'Northern Farmer',
        thumbnail: ytThumb('B_1irmtvhDs'),
        url: ytUrl('B_1irmtvhDs'),
        why: 'Understanding how moisture testing works helps you trust your probe readings and calibrate your expectations.',
        tags: ['probe', 'education'],
      },
      {
        id: 'v-safe-3',
        title: 'What Is a Farm Moisture Meter and How Does It Work?',
        source: 'Tom Lamb',
        thumbnail: ytThumb('DxFOCH90xJk'),
        url: ytUrl('DxFOCH90xJk'),
        why: 'A plain-language explainer of the meter in your hand — what it measures and where its accuracy limits are.',
        tags: ['probe', 'education'],
      },
      {
        id: 'v-safe-4',
        title: 'How to Properly Store Grains to Prevent Moisture and Pest Damage',
        source: 'TheSkyOnlineStore',
        thumbnail: ytThumb('68UvH1ChVME'),
        url: ytUrl('68UvH1ChVME'),
        why: 'Use this calm period to strengthen the basics: clean storage, sealed gaps and dry grain going in.',
        tags: ['storage', 'pests'],
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
        title: 'How to Store Wheat Grains for a Long Period of Time',
        source: 'Abid Ali Agrarian',
        thumbnail: ytThumb('xMCcRM6k5ZY'),
        url: ytUrl('xMCcRM6k5ZY'),
        why: 'Recommended viewing for wheat growers: the moisture targets and storage conditions wheat needs for the long haul.',
        tags: ['wheat', 'storage'],
      },
      {
        id: 'v-wheat-2',
        title: 'Postharvest Loss: Salt Testing for Grain Moisture Levels',
        source: 'SAWBO Scientific Animations',
        thumbnail: ytThumb('46IRXQ8IB_Q'),
        url: ytUrl('46IRXQ8IB_Q'),
        why: 'A simple field method to cross-check moisture without equipment — a useful sanity check between probe readings.',
        tags: ['wheat', 'field-method'],
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
        title: 'Measuring Rice Grain Moisture Content',
        source: 'International Rice Research Institute',
        thumbnail: ytThumb('loCKGozm0Y8'),
        url: ytUrl('loCKGozm0Y8'),
        why: 'IRRI explains correct sampling and measuring technique for rice — the foundation of every reading your probe takes.',
        tags: ['rice', 'measurement'],
      },
      {
        id: 'v-rice-2',
        title: 'Drying and Storage of Paddy Seeds',
        source: 'Digital Green · CSISA',
        thumbnail: ytThumb('08CG8Y9dJyE'),
        url: ytUrl('08CG8Y9dJyE'),
        why: 'A field-level walkthrough of paddy drying and storage practice, filmed with farmers in Odisha.',
        tags: ['rice', 'paddy', 'drying'],
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
        title: 'Drying Grain',
        source: 'Ag PhD',
        thumbnail: ytThumb('w8R6wyDcKHU'),
        url: ytUrl('w8R6wyDcKHU'),
        why: 'Corn comes off the field hot and wet. This covers drying strategy and the moisture targets to aim for.',
        tags: ['corn', 'drying'],
      },
      {
        id: 'v-corn-2',
        title: 'END ZONE Grain Bin Control',
        source: "Beck's Hybrids",
        thumbnail: ytThumb('31eYRD0ifbQ'),
        url: ytUrl('31eYRD0ifbQ'),
        why: 'Practical bin control for high-volume grain: what to automate, what to watch, and when to intervene.',
        tags: ['corn', 'bin-control'],
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
        title: 'Grain Storage Simplified: What You Actually Need',
        source: 'Grains and Grit',
        thumbnail: ytThumb('0PJvoRS41uc'),
        url: ytUrl('0PJvoRS41uc'),
        why: 'Soybeans need lower moisture than most grains. A no-nonsense look at the storage equipment that actually matters.',
        tags: ['soybean', 'storage'],
      },
      {
        id: 'v-soy-2',
        title: 'Intelligent System Makes Grain Storage Better',
        source: 'CGTN',
        thumbnail: ytThumb('1Lom_OlgO4A'),
        url: ytUrl('1Lom_OlgO4A'),
        why: 'A look at smart storage technology — useful context for where connected moisture monitoring is heading.',
        tags: ['soybean', 'technology'],
      },
    ],
  },

  /* ────────── BARLEY (all conditions) ────────── */
  {
    grain: 'barley',
    condition: 'all',
    videos: [
      {
        id: 'v-barley-1',
        title: 'Shore 930 Moisture Tester Scale Tutorial',
        source: 'Barndoor Ag',
        thumbnail: ytThumb('UzfLiViBGJs'),
        url: ytUrl('UzfLiViBGJs'),
        why: 'Malting barley has strict moisture limits. A tester walkthrough that shows how lab-grade measurement is done.',
        tags: ['barley', 'measurement'],
      },
      {
        id: 'v-barley-2',
        title: 'AGI BinManager: Automated In-Bin Conditioning and Monitoring',
        source: 'AGI',
        thumbnail: ytThumb('-Tn3iUxfWIc'),
        url: ytUrl('-Tn3iUxfWIc'),
        why: 'Automated conditioning keeps sensitive grain inside tight moisture bands — see how a full system operates.',
        tags: ['barley', 'conditioning'],
      },
    ],
  },

  /* ────────── OATS (all conditions) ────────── */
  {
    grain: 'oats',
    condition: 'all',
    videos: [
      {
        id: 'v-oats-1',
        title: 'Moisture Testing Grain',
        source: 'roosty6',
        thumbnail: ytThumb('jAYsA6E42WI'),
        url: ytUrl('jAYsA6E42WI'),
        why: 'Oats are prone to heating in storage. A hands-on moisture testing routine you can repeat at every loading.',
        tags: ['oats', 'testing'],
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

  // Priority 4: Other grains, current condition
  for (const rule of CONTENT_LIBRARY) {
    if (rule.grain !== 'all' && rule.grain !== grainType && rule.condition === condition) {
      for (const v of rule.videos) {
        if (!seen.has(v.id)) { results.push(v); seen.add(v.id); }
      }
    }
  }

  return results.slice(0, 10);
}
