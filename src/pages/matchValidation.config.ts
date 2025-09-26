import type { TeamMatchData } from '@/api';

// This configuration drives the Match Validation table layout so the game-specific
// fields can be adjusted each season without modifying the rendering logic.

export type MatchValidationNumericField =
  | 'al4c'
  | 'al3c'
  | 'al2c'
  | 'al1c'
  | 'tl4c'
  | 'tl3c'
  | 'tl2c'
  | 'tl1c'
  | 'aNet'
  | 'tNet'
  | 'aProcessor'
  | 'tProcessor';

type FieldKey = MatchValidationNumericField & keyof TeamMatchData;

export interface MatchValidationNumericRowConfig {
  type: 'numeric';
  id: string;
  label: string;
  field: FieldKey;
}

export interface MatchValidationPairedRowEntry {
  id: string;
  label: string;
  displayLabel?: string;
  field: FieldKey;
}

export interface MatchValidationPairedRowConfig {
  type: 'paired';
  id: string;
  rows: MatchValidationPairedRowEntry[];
}

export interface MatchValidationEndgameRowConfig {
  type: 'endgame';
  id: string;
  label: string;
}

export type MatchValidationRowConfig =
  | MatchValidationNumericRowConfig
  | MatchValidationPairedRowConfig
  | MatchValidationEndgameRowConfig;

export interface MatchValidationSectionConfig {
  id: string;
  title: string;
  rows: MatchValidationRowConfig[];
}

export const MATCH_VALIDATION_TABLE_LAYOUT: MatchValidationSectionConfig[] = [
  {
    id: 'autonomous-coral',
    title: 'Autonomous Coral',
    rows: [
      { type: 'numeric', id: 'al4c', label: 'Level 4 al4c', field: 'al4c' },
      { type: 'numeric', id: 'al3c', label: 'Level 3 al3c', field: 'al3c' },
      { type: 'numeric', id: 'al2c', label: 'Level 2 al2c', field: 'al2c' },
      { type: 'numeric', id: 'al1c', label: 'Level 1 al1c', field: 'al1c' },
    ],
  },
  {
    id: 'teleop-coral',
    title: 'Teleop Coral',
    rows: [
      { type: 'numeric', id: 'tl4c', label: 'Level 4 tl4c', field: 'tl4c' },
      { type: 'numeric', id: 'tl3c', label: 'Level 3 tl3c', field: 'tl3c' },
      { type: 'numeric', id: 'tl2c', label: 'Level 2 tl2c', field: 'tl2c' },
      { type: 'numeric', id: 'tl1c', label: 'Level 1 tl1c', field: 'tl1c' },
    ],
  },
  {
    id: 'net-algae',
    title: 'Net Algae',
    rows: [
      {
        type: 'paired',
        id: 'net-values',
        rows: [
          { id: 'aNet', label: 'Autonomous aNet', displayLabel: 'Autonomous', field: 'aNet' },
          { id: 'tNet', label: 'Teleop tNet', displayLabel: 'Teleop', field: 'tNet' },
        ],
      },
    ],
  },
  {
    id: 'processor-algae',
    title: 'Processor Algae',
    rows: [
      {
        type: 'paired',
        id: 'processor-values',
        rows: [
          {
            id: 'aProcessor',
            label: 'Autonomous aProcessor',
            displayLabel: 'Autonomous',
            field: 'aProcessor',
          },
          { id: 'tProcessor', label: 'Teleop tProcessor', displayLabel: 'Teleop', field: 'tProcessor' },
        ],
      },
    ],
  },
  {
    id: 'endgame',
    title: 'Endgame',
    rows: [{ type: 'endgame', id: 'endgame', label: 'Endgame' }],
  },
];

const numericFields = new Set<MatchValidationNumericField>();

MATCH_VALIDATION_TABLE_LAYOUT.forEach((section) => {
  section.rows.forEach((row) => {
    if (row.type === 'numeric') {
      numericFields.add(row.field);
    }

    if (row.type === 'paired') {
      row.rows.forEach((entry) => numericFields.add(entry.field));
    }
  });
});

export const MATCH_VALIDATION_NUMERIC_FIELDS = Array.from(numericFields);

export const MATCH_VALIDATION_TEAM_HEADERS = ['Bot 1', 'Bot 2', 'Bot 3'] as const;
