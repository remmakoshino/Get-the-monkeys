import { create } from 'zustand';
import * as THREE from 'three';
import {
  RacingStore,
  RacingGameState,
  RacingMachine,
  RacingInput,
  PlacedItem,
  CupType,
  RacingSaveData,
  RaceResult,
  MachineType,
  AIMachineType,
} from './types';

const RACING_SAVE_KEY = 'monkey-racer-save';

// 初期セーブデータ
const createInitialSaveData = (): RacingSaveData => ({
  coins: 0,
  unlockedMachines: ['heroMonkey'],
  unlockedParts: ['engine_normal', 'tire_standard', 'handle_normal', 'body_light'],
  unlockedCups: ['monkey'],
  cupProgress: {
    monkey: { completed: false, bestRank: null },
    banana: { completed: false, bestRank: null },
    star: { completed: false, bestRank: null },
    special: { completed: false, bestRank: null },
  },
  bestTimes: {},
  customization: {
    engine: 'engine_normal',
    tire: 'tire_standard',
    handle: 'handle_normal',
    body: 'body_light',
  },
});

// 初期入力状態
const createInitialInput = (): RacingInput => ({
  accelerate: false,
  brake: false,
  left: false,
  right: false,
  drift: false,
  useItem: false,
  transform: false,
  pause: false,
});

// ローカルストレージからロード
const loadSaveDataFromStorage = (): RacingSaveData => {
  try {
    const saved = localStorage.getItem(RACING_SAVE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (e) {
    console.error('Failed to load racing save data:', e);
  }
  return createInitialSaveData();
};

// ローカルストレージに保存
const saveSaveDataToStorage = (data: RacingSaveData) => {
  try {
    localStorage.setItem(RACING_SAVE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save racing data:', e);
  }
};

export const useRacingStore = create<RacingStore>((set, get) => ({
  // ゲーム状態
  gameState: 'menu',
  setGameState: (state: RacingGameState) => set({ gameState: state }),

  // カップ・コース
  currentCup: null,
  setCurrentCup: (cup: CupType | null) => set({ currentCup: cup }),
  currentCourse: 0,
  setCurrentCourse: (courseIndex: number) => set({ currentCourse: courseIndex }),

  // プレイヤーマシン
  playerMachine: null,
  setPlayerMachine: (machine: RacingMachine | null) => set({ playerMachine: machine }),
  updatePlayerMachine: (data: Partial<RacingMachine>) =>
    set((state) => ({
      playerMachine: state.playerMachine
        ? { ...state.playerMachine, ...data }
        : null,
    })),

  // AIマシン
  aiMachines: [],
  setAIMachines: (machines: RacingMachine[]) => set({ aiMachines: machines }),
  updateAIMachine: (id: string, data: Partial<RacingMachine>) =>
    set((state) => ({
      aiMachines: state.aiMachines.map((m) =>
        m.id === id ? { ...m, ...data } : m
      ),
    })),

  // 設置アイテム
  placedItems: [],
  setPlacedItems: (items: PlacedItem[]) => set({ placedItems: items }),
  addPlacedItem: (item: PlacedItem) =>
    set((state) => ({
      placedItems: [...state.placedItems, item],
    })),
  removePlacedItem: (id: string) =>
    set((state) => ({
      placedItems: state.placedItems.filter((i) => i.id !== id),
    })),

  // レース情報
  raceTime: 0,
  setRaceTime: (time: number) => set({ raceTime: time }),
  countdown: 3,
  setCountdown: (countOrUpdater: number | ((prev: number) => number)) => {
    if (typeof countOrUpdater === 'function') {
      set((state) => ({ countdown: countOrUpdater(state.countdown) }));
    } else {
      set({ countdown: countOrUpdater });
    }
  },

  // 結果
  raceResults: [],
  setRaceResults: (results: RaceResult[]) => set({ raceResults: results }),

  // セーブデータ
  saveData: loadSaveDataFromStorage(),
  updateSaveData: (data: Partial<RacingSaveData>) => {
    const newData = { ...get().saveData, ...data };
    saveSaveDataToStorage(newData);
    set({ saveData: newData });
  },
  loadSaveData: () => {
    const data = loadSaveDataFromStorage();
    set({ saveData: data });
  },

  // 入力
  input: createInitialInput(),
  setInput: (data: Partial<RacingInput>) =>
    set((state) => ({
      input: { ...state.input, ...data },
    })),
  updateInput: (data: Partial<RacingInput>) =>
    set((state) => ({
      input: { ...state.input, ...data },
    })),
}));

// ヘルパー関数
export const createPlayerMachine = (
  type: MachineType = 'heroMonkey'
): RacingMachine => {
  const MACHINE_STATS = {
    heroMonkey: { maxSpeed: 100, acceleration: 80, handling: 80, weight: 50, driftBonus: 1.0 },
    speedStar: { maxSpeed: 120, acceleration: 70, handling: 60, weight: 40, driftBonus: 0.8 },
    tankMonkey: { maxSpeed: 80, acceleration: 60, handling: 70, weight: 90, driftBonus: 1.2 },
    ninjaMonkey: { maxSpeed: 90, acceleration: 90, handling: 100, weight: 30, driftBonus: 1.5 },
  };

  const MACHINE_COLORS = {
    heroMonkey: '#4169E1',
    speedStar: '#DC143C',
    tankMonkey: '#708090',
    ninjaMonkey: '#1a1a1a',
  };

  const MACHINE_NAMES = {
    heroMonkey: 'ヒーローモンキー',
    speedStar: 'スピードスター',
    tankMonkey: 'タンクモンキー',
    ninjaMonkey: 'ニンジャモンキー',
  };

  return {
    id: 'player',
    type,
    name: MACHINE_NAMES[type],
    color: MACHINE_COLORS[type],
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0,
    currentForm: 'normal',
    stats: MACHINE_STATS[type],
    currentLap: 0,
    lapTimes: [],
    currentCheckpoint: 0,
    totalDistance: 0,
    currentPosition: 1,
    currentItem: null,
    isSpinning: false,
    spinTime: 0,
    isInvincible: false,
    invincibleTime: 0,
    isSlowed: false,
    slowedTime: 0,
    isBoosting: false,
    boostTime: 0,
    isDrifting: false,
    driftTime: 0,
    driftLevel: 0,
    driftDirection: null,
    transformCooldown: 0,
    isAI: false,
    aiDifficulty: 'normal',
    targetWaypoint: 0,
  };
};

export const createAIMachine = (
  type: AIMachineType,
  index: number
): RacingMachine => {
  const AI_STATS = {
    pipotronYellow: { maxSpeed: 95, acceleration: 75, handling: 75, weight: 50, driftBonus: 1.0 },
    pipotronBlue: { maxSpeed: 110, acceleration: 85, handling: 65, weight: 45, driftBonus: 0.9 },
    pipotronRed: { maxSpeed: 100, acceleration: 90, handling: 70, weight: 55, driftBonus: 1.1 },
    pipotronBlack: { maxSpeed: 115, acceleration: 95, handling: 90, weight: 50, driftBonus: 1.3 },
    devichMonkey: { maxSpeed: 85, acceleration: 70, handling: 80, weight: 45, driftBonus: 1.0 },
    apeSoldier: { maxSpeed: 90, acceleration: 80, handling: 75, weight: 55, driftBonus: 0.9 },
    bananaBoy: { maxSpeed: 80, acceleration: 65, handling: 85, weight: 40, driftBonus: 1.1 },
  };

  const AI_COLORS = {
    pipotronYellow: '#FFD700',
    pipotronBlue: '#4169E1',
    pipotronRed: '#DC143C',
    pipotronBlack: '#1a1a1a',
    devichMonkey: '#800080',
    apeSoldier: '#228B22',
    bananaBoy: '#FFA500',
  };

  const AI_NAMES = {
    pipotronYellow: 'ピポトロン・イエロー',
    pipotronBlue: 'ピポトロン・ブルー',
    pipotronRed: 'ピポトロン・レッド',
    pipotronBlack: 'ピポトロン・ブラック',
    devichMonkey: 'デビッチモンキー',
    apeSoldier: 'エイプソルジャー',
    bananaBoy: 'バナナボーイ',
  };

  return {
    id: `ai_${type}_${index}`,
    type,
    name: AI_NAMES[type],
    color: AI_COLORS[type],
    position: new THREE.Vector3(0, 0, 0),
    rotation: new THREE.Euler(0, 0, 0),
    velocity: new THREE.Vector3(0, 0, 0),
    speed: 0,
    currentForm: 'normal',
    stats: AI_STATS[type],
    currentLap: 0,
    lapTimes: [],
    currentCheckpoint: 0,
    totalDistance: 0,
    currentPosition: index + 2,
    currentItem: null,
    isSpinning: false,
    spinTime: 0,
    isInvincible: false,
    invincibleTime: 0,
    isSlowed: false,
    slowedTime: 0,
    isBoosting: false,
    boostTime: 0,
    isDrifting: false,
    driftTime: 0,
    driftLevel: 0,
    driftDirection: null,
    transformCooldown: 0,
    isAI: true,
    aiDifficulty: 'normal',
    targetWaypoint: 0,
  };
};

export default useRacingStore;
