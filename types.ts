
export interface Fragment {
  text: string;
  isFixed: boolean;
}

export interface GameState {
  trust: number;
  autonomy: number;
  study: number;
  risk: number;
  coherence: number;
  currentFragments: Fragment[];
  roundStartFragments: Fragment[];
  history: NarrativeEntry[];
  status: 'start' | 'playing' | 'victory' | 'failure' | 'loading';
  lastInterpretation?: string;
  turn_id: string;
}

export interface NarrativeEntry {
  sequence: string[];
  interpretation: string;
  delta: {
    trust: number;
    autonomy: number;
    study: number;
  };
  newValues: {
    trust: number;
    autonomy: number;
    study: number;
  };
}

export interface GeminiResponse {
  turn_id: string;
  outcome: {
    is_game_over: boolean;
    ending_type: string;
    ending_text: string;
  };
  delta: {
    trust: number;
    autonomy: number;
    study: number;
    risk: number;
    coherence: number;
  };
  state_tags: {
    risk_level: 'low' | 'medium' | 'high' | 'critical';
    turn_type: 'normal' | 'high_risk' | 'confrontation' | 'evidence' | 'resolution';
  };
  player_feedback_cn: string;
  next_fragments_cn: string[];
  internal_notes?: {
    coherence_flags: string[];
    fail_reason: string;
    fixed_indices?: number[]; // AI 建议的固定片段索引
  };
}
