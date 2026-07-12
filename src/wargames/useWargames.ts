import { create } from 'zustand';

export interface Talent {
  id: string;
  level: number;
}

export interface Player {
  id: string;
  eloRating: number;
  agileReleaseTrainId: string | null;
  level: number;
  prestige: number;
  seasonBattlePassTier: number;
  guildId: string | null;
  cosmetics: Record<string, string>;
  talents: Record<string, number>;
}

export interface Agent {
  id: string;
  synergies: string[];
  talents: Talent[];
  skinCosmetic: string | null;
}

export interface Card {
  id: string;
  synergies: string[];
  cosmetic: string | null;
  deployCount: number;
}

export interface Guild {
  id: string;
  name: string;
  members: string[];
  vault: Record<string, string>;
  warRanking: number;
  questLog: string[];
}

export interface RaidBoss {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  phaseNum: number;
  cosplayers: string[];
}

export interface CampaignNode {
  modifiers: string[];
  threat: number;
}

export interface RoguelikeCampaign {
  runId: string;
  prestige: number;
  nodes: CampaignNode[];
  loot: string[];
}

export interface WargamesState {
  players: Record<string, Player>;
  agents: Record<string, Agent>;
  cards: Record<string, Card>;
  guilds: Record<string, Guild>;
  raidBosses: Record<string, RaidBoss>;
  roguelikeCampaigns: Record<string, RoguelikeCampaign>;
  updatePlayer: (id: string, player: Partial<Player>) => void;
  updateAgent: (id: string, agent: Partial<Agent>) => void;
  updateCard: (id: string, card: Partial<Card>) => void;
  recordToUnrdf: (executeTelemetry: (data: any) => Promise<any>) => Promise<void>;
}

export const useWargames = create<WargamesState>((set, get) => ({
  players: {},
  agents: {},
  cards: {},
  guilds: {},
  raidBosses: {},
  roguelikeCampaigns: {},
  updatePlayer: (id, player) => set((state) => ({ players: { ...state.players, [id]: { ...state.players[id], ...player } as Player } })),
  updateAgent: (id, agent) => set((state) => ({ agents: { ...state.agents, [id]: { ...state.agents[id], ...agent } as Agent } })),
  updateCard: (id, card) => set((state) => ({ cards: { ...state.cards, [id]: { ...state.cards[id], ...card } as Card } })),
  recordToUnrdf: async (executeTelemetry) => {
    const state = get();
    // Map these directly to the unrdf semantic knowledge graph so that Wargames simulations are recorded as valid enterprise topologies.
    const enterpriseTopology = {
      type: 'WargamesSimulationTopology',
      players: Object.values(state.players),
      agents: Object.values(state.agents),
      cards: Object.values(state.cards),
      guilds: Object.values(state.guilds),
      raidBosses: Object.values(state.raidBosses),
      roguelikeCampaigns: Object.values(state.roguelikeCampaigns),
    };
    await executeTelemetry({ type: 'RECORD_TOPOLOGY', payload: enterpriseTopology });
  },
}));
