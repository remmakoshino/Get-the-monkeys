import * as THREE from 'three';

// ===============================
// レーシングゲーム型定義
// ===============================

// マシンの形態
export type MachineForm = 'normal' | 'long';

// アイテムタイプ
export type RacingItemType = 
  | 'banana'          // バナナボム
  | 'missile'         // デビッチミサイル
  | 'shield'          // シールド
  | 'boost'           // ブースト
  | 'thunder'         // サンダー
  | 'oil'             // オイル
  | 'banana3'         // トリプルバナナ
  | 'goldBoost';      // ゴールデンブースト

// カップタイプ
export type CupType = 'monkey' | 'banana' | 'star' | 'special';

// マシンタイプ
export type MachineType = 
  | 'heroMonkey'      // ヒーローモンキー（初期）
  | 'speedStar'       // スピードスター
  | 'tankMonkey'      // タンクモンキー
  | 'ninjaMonkey';    // ニンジャモンキー

// AIマシンタイプ
export type AIMachineType =
  | 'pipotronYellow'
  | 'pipotronBlue'
  | 'pipotronRed'
  | 'pipotronBlack'
  | 'devichMonkey'
  | 'apeSoldier'
  | 'bananaBoy';

// ドリフトレベル
export type DriftLevel = 0 | 1 | 2 | 3;

// パーツタイプ
export type PartType = 'engine' | 'tire' | 'handle' | 'body';

// パーツ定義
export interface MachinePart {
  id: string;
  type: PartType;
  name: string;
  price: number;
  stats: {
    speedBonus: number;
    accelerationBonus: number;
    handlingBonus: number;
    weightBonus: number;
    specialAbility?: string;
  };
}

// マシンステータス
export interface MachineStats {
  maxSpeed: number;
  acceleration: number;
  handling: number;
  weight: number;
  driftBonus: number;
}

// マシンデータ
export interface RacingMachine {
  id: string;
  type: MachineType | AIMachineType;
  name: string;
  color: string;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  speed: number;
  currentForm: MachineForm;
  stats: MachineStats;
  
  // レース状態
  currentLap: number;
  lapTimes: number[];
  currentCheckpoint: number;
  totalDistance: number;
  currentPosition: number;
  
  // アイテム
  currentItem: RacingItemType | null;
  
  // 状態
  isSpinning: boolean;
  spinTime: number;
  isInvincible: boolean;
  invincibleTime: number;
  invincibleEndTime?: number;
  isSlowed: boolean;
  slowedTime: number;
  isBoosting: boolean;
  boostTime: number;
  boostEndTime?: number;
  
  // ドリフト
  isDrifting: boolean;
  driftTime: number;
  driftLevel: DriftLevel;
  driftDirection: 'left' | 'right' | null;
  
  // フォーム変形
  transformCooldown: number;
  
  // AI用
  isAI: boolean;
  aiDifficulty: 'easy' | 'normal' | 'hard' | 'extreme';
  targetWaypoint: number;
}

// コースチェックポイント
export interface Checkpoint {
  id: string;
  position: THREE.Vector3;
  width: number;
  rotation: THREE.Euler;
  order: number;
}

// コースウェイポイント（AI用）
export interface Waypoint {
  position: THREE.Vector3;
  optimalSpeed: number;
  shouldDrift: boolean;
  canUseLongForm: boolean;
}

// コースギミック
export interface CourseGimmick {
  id: string;
  type: 'jump' | 'boost' | 'obstacle' | 'shortcut' | 'hazard';
  position: THREE.Vector3;
  size: THREE.Vector3;
  active: boolean;
  data?: Record<string, unknown>;
}

// アイテムボックス
export interface ItemBox {
  id: string;
  position: THREE.Vector3;
  isActive: boolean;
  respawnTime: number;
}

// 設置アイテム（バナナなど）
export interface PlacedItem {
  id: string;
  type: RacingItemType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  ownerId: string;
  createdAt: number;
  targetId?: string;
}

// コースデータ
export interface CourseData {
  id: string;
  name: string;
  cup: CupType;
  laps: number;
  
  // コース構造
  waypoints: THREE.Vector3[];
  checkpoints: Checkpoint[];
  
  // 配置物
  itemBoxes: ItemBox[];
  obstacles: CourseGimmick[];
  
  // スタート位置
  startPosition: THREE.Vector3;
  startRotation: THREE.Euler;
  
  // 環境
  environment: string;
}

// カップデータ
export interface CupData {
  type: CupType;
  name: string;
  courses: string[]; // コースIDの配列
  unlocked: boolean;
}

// レース結果
export interface RaceResult {
  position: number;
  totalTime: number;
  bestLap: number;
  lapTimes: number[];
  coinsEarned: number;
}

// カスタマイズデータ
export interface CustomizationData {
  engine: string;
  tire: string;
  handle: string;
  body: string;
}

// プレイヤーのレーシングセーブデータ
export interface RacingSaveData {
  coins: number;
  unlockedMachines: MachineType[];
  unlockedParts: string[];
  unlockedCups: CupType[];
  cupProgress: Record<CupType, { completed: boolean; bestRank: string | null }>;
  bestTimes: Record<string, number>;
  customization: CustomizationData;
}

// レーシングゲーム状態
export type RacingGameState = 
  | 'menu'
  | 'cup-select'
  | 'course-select'
  | 'customize'
  | 'countdown'
  | 'racing'
  | 'paused'
  | 'finished'
  | 'results';

// レーシング入力
export interface RacingInput {
  accelerate: boolean;
  brake: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  useItem: boolean;
  transform: boolean;
  pause: boolean;
}

// レーシングストア
export interface RacingStore {
  // ゲーム状態
  gameState: RacingGameState;
  setGameState: (state: RacingGameState) => void;
  
  // カップ・コース
  currentCup: CupType | null;
  setCurrentCup: (cup: CupType | null) => void;
  currentCourse: number;
  setCurrentCourse: (courseIndex: number) => void;
  
  // マシン
  playerMachine: RacingMachine | null;
  setPlayerMachine: (machine: RacingMachine | null) => void;
  updatePlayerMachine: (data: Partial<RacingMachine>) => void;
  
  aiMachines: RacingMachine[];
  setAIMachines: (machines: RacingMachine[]) => void;
  updateAIMachine: (id: string, data: Partial<RacingMachine>) => void;
  
  // アイテム
  placedItems: PlacedItem[];
  setPlacedItems: (items: PlacedItem[]) => void;
  addPlacedItem: (item: PlacedItem) => void;
  removePlacedItem: (id: string) => void;
  
  // レース情報
  raceTime: number;
  setRaceTime: (time: number) => void;
  countdown: number;
  setCountdown: (count: number | ((prev: number) => number)) => void;
  
  // 結果
  raceResults: RaceResult[];
  setRaceResults: (results: RaceResult[]) => void;
  
  // セーブデータ
  saveData: RacingSaveData;
  updateSaveData: (data: Partial<RacingSaveData>) => void;
  loadSaveData: () => void;
  
  // 入力
  input: RacingInput;
  setInput: (data: Partial<RacingInput>) => void;
  updateInput: (data: Partial<RacingInput>) => void;
}

// ===============================
// 定数
// ===============================

// マシン初期ステータス
export const MACHINE_STATS: Record<MachineType, MachineStats> = {
  heroMonkey: {
    maxSpeed: 100,
    acceleration: 80,
    handling: 80,
    weight: 50,
    driftBonus: 1.0,
  },
  speedStar: {
    maxSpeed: 120,
    acceleration: 70,
    handling: 60,
    weight: 40,
    driftBonus: 0.8,
  },
  tankMonkey: {
    maxSpeed: 80,
    acceleration: 60,
    handling: 70,
    weight: 90,
    driftBonus: 1.2,
  },
  ninjaMonkey: {
    maxSpeed: 90,
    acceleration: 90,
    handling: 100,
    weight: 30,
    driftBonus: 1.5,
  },
};

// AIマシンステータス
export const AI_MACHINE_STATS: Record<AIMachineType, MachineStats> = {
  pipotronYellow: { maxSpeed: 95, acceleration: 75, handling: 75, weight: 50, driftBonus: 1.0 },
  pipotronBlue: { maxSpeed: 110, acceleration: 85, handling: 65, weight: 45, driftBonus: 0.9 },
  pipotronRed: { maxSpeed: 100, acceleration: 90, handling: 70, weight: 55, driftBonus: 1.1 },
  pipotronBlack: { maxSpeed: 115, acceleration: 95, handling: 90, weight: 50, driftBonus: 1.3 },
  devichMonkey: { maxSpeed: 85, acceleration: 70, handling: 80, weight: 45, driftBonus: 1.0 },
  apeSoldier: { maxSpeed: 90, acceleration: 80, handling: 75, weight: 55, driftBonus: 0.9 },
  bananaBoy: { maxSpeed: 80, acceleration: 65, handling: 85, weight: 40, driftBonus: 1.1 },
};

// パーツリスト
export const PARTS_LIST: MachinePart[] = [
  // エンジン
  { id: 'engine_normal', type: 'engine', name: 'ノーマル', price: 0, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0, weightBonus: 0 } },
  { id: 'engine_power', type: 'engine', name: 'パワー型', price: 300, stats: { speedBonus: 15, accelerationBonus: 5, handlingBonus: 0, weightBonus: 5 } },
  { id: 'engine_turbo', type: 'engine', name: 'ターボ型', price: 500, stats: { speedBonus: 25, accelerationBonus: 10, handlingBonus: -5, weightBonus: 10 } },
  
  // タイヤ
  { id: 'tire_standard', type: 'tire', name: 'スタンダード', price: 0, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0, weightBonus: 0 } },
  { id: 'tire_grip', type: 'tire', name: 'グリップ型', price: 250, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 20, weightBonus: 0 } },
  { id: 'tire_offroad', type: 'tire', name: 'オフロード型', price: 400, stats: { speedBonus: -5, accelerationBonus: 0, handlingBonus: 10, weightBonus: 5, specialAbility: 'allTerrain' } },
  
  // ハンドル
  { id: 'handle_normal', type: 'handle', name: 'ノーマル', price: 0, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0, weightBonus: 0 } },
  { id: 'handle_quick', type: 'handle', name: 'クイック型', price: 200, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 30, weightBonus: 0 } },
  { id: 'handle_stable', type: 'handle', name: '安定型', price: 350, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 10, weightBonus: 0, specialAbility: 'spinResist' } },
  
  // ボディ
  { id: 'body_light', type: 'body', name: 'ライト級', price: 0, stats: { speedBonus: 0, accelerationBonus: 0, handlingBonus: 0, weightBonus: 0 } },
  { id: 'body_middle', type: 'body', name: 'ミドル級', price: 300, stats: { speedBonus: -10, accelerationBonus: 0, handlingBonus: 0, weightBonus: 25, specialAbility: 'collisionResist' } },
  { id: 'body_heavy', type: 'body', name: 'ヘビー級', price: 600, stats: { speedBonus: -15, accelerationBonus: -5, handlingBonus: -10, weightBonus: 50, specialAbility: 'push' } },
];

// カップデータ
export const CUPS_DATA: CupData[] = [
  { type: 'monkey', name: 'モンキーカップ', courses: ['monkeyPark', 'jungleCruise', 'beachBlue'], unlocked: true },
  { type: 'banana', name: 'バナナカップ', courses: ['apeCityMetro', 'iceMountain', 'volcanoHeat'], unlocked: false },
  { type: 'star', name: 'スターカップ', courses: ['ancientRuins', 'hauntedHouse', 'technoFactory'], unlocked: false },
  { type: 'special', name: 'スペシャルカップ', courses: ['dragonMountain', 'rainbowRoad', 'pipoHelix'], unlocked: false },
];

// アイテム出現率（順位別）
export const ITEM_PROBABILITY = {
  first: { banana: 0.35, missile: 0, shield: 0, boost: 0.30, thunder: 0, oil: 0.20, banana3: 0.10, goldBoost: 0.05 },
  early: { banana: 0.25, missile: 0.10, shield: 0.10, boost: 0.25, thunder: 0, oil: 0.15, banana3: 0.10, goldBoost: 0.05 },
  middle: { banana: 0.15, missile: 0.20, shield: 0.15, boost: 0.20, thunder: 0.05, oil: 0.10, banana3: 0.10, goldBoost: 0.05 },
  last: { banana: 0.05, missile: 0.25, shield: 0.20, boost: 0.15, thunder: 0.15, oil: 0.05, banana3: 0.05, goldBoost: 0.10 },
};

// レーシング設定
export const RACING_CONFIG = {
  // 物理
  GRAVITY: -20,
  MAX_SPEED_MULTIPLIER: 1.5,
  LONG_FORM_SPEED_BONUS: 1.2,
  LONG_FORM_HANDLING_PENALTY: 0.7,
  
  // ドリフト
  DRIFT_MIN_SPEED: 50,
  DRIFT_LEVEL_2_TIME: 1.0,
  DRIFT_LEVEL_3_TIME: 2.0,
  DRIFT_BOOST_DURATION: 1.5,
  
  // フォームチェンジ
  TRANSFORM_COOLDOWN: 5,
  
  // ミサイル
  MISSILE_SPEED: 80,
  
  // 報酬
  COINS_BY_POSITION: [500, 300, 200, 100, 100, 100],
  
  // AI
  RUBBER_BAND_STRENGTH: 0.1,
  AI_DIFFICULTY_SPEED: { easy: 0.8, normal: 0.9, hard: 1.0, extreme: 1.05 },
};
