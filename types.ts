
export interface Fragment {
  text: string;
  isFixed: boolean;
}

export interface GameState {
  happiness: number;
  currentFragments: Fragment[];
  roundStartFragments: Fragment[];
  history: NarrativeEntry[];
  status: 'start' | 'playing' | 'victory' | 'failure' | 'loading';
  lastInterpretation?: string;
  tone?: string;
}

export interface NarrativeEntry {
  sequence: string[];
  interpretation: string;
  happinessDelta: number;
  newHappiness: number;
}

export interface GeminiResponse {
  happiness_delta: number;
  interpretation_summary: string;
  next_fragments: {
    text: string;
    is_fixed: boolean;
  }[];
  tone: string;
}

export interface FinalNarrative {
  text: string;
}
