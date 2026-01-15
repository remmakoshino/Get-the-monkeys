import * as THREE from 'three';

// ゲーム状態
export type GameState = 'menu' | 'stage-select' | 'playing' | 'paused' | 'result' | 'loading' | 'tutorial' | 'gallery';

// ステージ情報
export type StageId = 1 | 2 | 3 | 4 | 5;

export interface StageInfo {
  id: StageId;
  name: string;
  theme: string;
  monkeyCount: number;
  bossName: string;
  unlocked: boolean;
  cleared: boolean;
  bestTime: number | null;
  bestRank: Rank | null;
}

// 評価ランク
export type Rank = 'S' | 'A' | 'B' | 'C';

// ツール種類
export type ToolType = 'net' | 'rod' | 'booster' | 'hover' | 'radar';

export interface Tool {
  type: ToolType;
  name: string;
  description: string;
  cooldown: number;
  currentCooldown: number;
  key: string;
}

// 猿の種類
export type MonkeyType = 'yellow' | 'blue' | 'red' | 'green' | 'black';

export interface MonkeyStats {
  type: MonkeyType;
  health: number;
  maxHealth: number;
  speed: number;
  detectionRange: number;
  color: string;
  behavior: MonkeyBehavior;
}

export type MonkeyBehavior = 'flee' | 'zigzag' | 'attack' | 'hide' | 'elite';

export type MonkeyState = 'idle' | 'patrol' | 'alert' | 'fleeing' | 'attacking' | 'stunned' | 'captured' | 'hidden';

export interface MonkeyData {
  id: string;
  type: MonkeyType;
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  state: MonkeyState;
  health: number;
  maxHealth: number;
  stunTime: number;
  alertLevel: number;
  targetPosition: THREE.Vector3 | null;
  patrolPoints: THREE.Vector3[];
  currentPatrolIndex: number;
  isBoss: boolean;
  bossPhase?: number;
}

// プレイヤー情報
export interface PlayerData {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  velocity: THREE.Vector3;
  health: number;
  maxHealth: number;
  currentTool: ToolType;
  tools: Tool[];
  isJumping: boolean;
  isDashing: boolean;
  isAttacking: boolean;
  dashCooldown: number;
  invincibleTime: number;
  capturedMonkeys: number;
}

// 入力状態
export interface InputState {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  jump: boolean;
  dash: boolean;
  attack: boolean;
  tool1: boolean;
  tool2: boolean;
  tool3: boolean;
  tool4: boolean;
  tool5: boolean;
  pause: boolean;
  mouseX: number;
  mouseY: number;
  mouseDeltaX: number;
  mouseDeltaY: number;
  isPointerLocked: boolean;
}

// カメラ情報
export interface CameraData {
  position: THREE.Vector3;
  target: THREE.Vector3;
  rotation: THREE.Euler;
  distance: number;
  pitch: number;
  yaw: number;
}

// ステージ環境
export interface StageEnvironment {
  groundColor: string;
  skyColor: string;
  fogColor: string;
  fogNear: number;
  fogFar: number;
  ambientLightColor: string;
  ambientLightIntensity: number;
  directionalLightColor: string;
  directionalLightIntensity: number;
  directionalLightPosition: THREE.Vector3;
}

// プラットフォーム
export interface Platform {
  id: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: 'static' | 'moving' | 'falling' | 'ice' | 'lava';
  moveRange?: THREE.Vector3;
  moveSpeed?: number;
  color: string;
}

// 障害物
export interface Obstacle {
  id: string;
  position: THREE.Vector3;
  size: THREE.Vector3;
  type: 'block' | 'tree' | 'rock' | 'pillar' | 'trap';
  color: string;
  isDestructible: boolean;
}

// ステージデータ
export interface StageData {
  id: StageId;
  environment: StageEnvironment;
  platforms: Platform[];
  obstacles: Obstacle[];
  spawnPoints: THREE.Vector3[];
  monkeySpawns: { position: THREE.Vector3; type: MonkeyType }[];
  bossSpawn: THREE.Vector3;
  playerSpawn: THREE.Vector3;
}

// ボスデータ
export interface BossData extends MonkeyData {
  name: string;
  phase: number;
  maxPhase: number;
  attackPattern: string[];
  currentAttack: string;
  attackCooldown: number;
  isInvulnerable: boolean;
  specialAbility: string;
}

// エフェクト
export interface ParticleEffect {
  id: string;
  type: 'capture' | 'hit' | 'stun' | 'dash' | 'explosion' | 'sparkle';
  position: THREE.Vector3;
  duration: number;
  elapsed: number;
  color: string;
}

// ゲームリザルト
export interface GameResult {
  stageId: StageId;
  cleared: boolean;
  capturedCount: number;
  totalMonkeys: number;
  clearTime: number;
  damageTaken: number;
  rank: Rank;
}

// セーブデータ
export interface SaveData {
  version: string;
  stages: {
    [key: number]: {
      unlocked: boolean;
      cleared: boolean;
      bestTime: number | null;
      bestRank: Rank | null;
    };
  };
  totalCaptured: number;
  gallery: string[];
  settings: GameSettings;
}

// ゲーム設定
export interface GameSettings {
  musicVolume: number;
  sfxVolume: number;
  mouseSensitivity: number;
  invertY: boolean;
  showTutorial: boolean;
  language: 'ja' | 'en';
}

// ゲームストアの状態
export interface GameStore {
  // ゲーム状態
  gameState: GameState;
  setGameState: (state: GameState) => void;
  
  // ステージ情報
  currentStage: StageId;
  setCurrentStage: (stage: StageId) => void;
  stages: StageInfo[];
  updateStageInfo: (stageId: StageId, info: Partial<StageInfo>) => void;
  
  // プレイヤー
  player: PlayerData;
  updatePlayer: (data: Partial<PlayerData>) => void;
  resetPlayer: () => void;
  
  // 猿
  monkeys: MonkeyData[];
  setMonkeys: (monkeys: MonkeyData[]) => void;
  updateMonkey: (id: string, data: Partial<MonkeyData>) => void;
  removeMonkey: (id: string) => void;
  
  // ボス
  boss: BossData | null;
  setBoss: (boss: BossData | null) => void;
  updateBoss: (data: Partial<BossData>) => void;
  
  // 入力
  input: InputState;
  updateInput: (data: Partial<InputState>) => void;
  
  // カメラ
  camera: CameraData;
  updateCamera: (data: Partial<CameraData>) => void;
  
  // エフェクト
  effects: ParticleEffect[];
  addEffect: (effect: ParticleEffect) => void;
  removeEffect: (id: string) => void;
  clearEffects: () => void;
  
  // タイマー
  gameTime: number;
  setGameTime: (time: number) => void;
  incrementGameTime: (delta: number) => void;
  
  // 結果
  result: GameResult | null;
  setResult: (result: GameResult | null) => void;
  
  // 設定
  settings: GameSettings;
  updateSettings: (settings: Partial<GameSettings>) => void;
  
  // セーブ/ロード
  saveGame: () => void;
  loadGame: () => void;
  
  // 通知
  notification: string | null;
  setNotification: (message: string | null) => void;
  
  // ダメージフラッシュ
  showDamageFlash: boolean;
  setShowDamageFlash: (show: boolean) => void;
}

// 定数
export const MONKEY_STATS: Record<MonkeyType, Omit<MonkeyStats, 'type'>> = {
  yellow: {
    health: 1,
    maxHealth: 1,
    speed: 2.5, // 遅くしました（4 → 2.5）
    detectionRange: 8,
    color: '#FFD700',
    behavior: 'flee',
  },
  blue: {
    health: 1,
    maxHealth: 1,
    speed: 4.5, // 遅くしました（7 → 4.5）
    detectionRange: 10,
    color: '#4169E1',
    behavior: 'zigzag',
  },
  red: {
    health: 2,
    maxHealth: 2,
    speed: 3.5, // 遅くしました（5 → 3.5）
    detectionRange: 12,
    color: '#DC143C',
    behavior: 'attack',
  },
  green: {
    health: 2,
    maxHealth: 2,
    speed: 2, // 遅くしました（3 → 2）
    detectionRange: 6,
    color: '#228B22',
    behavior: 'hide',
  },
  black: {
    health: 4,
    maxHealth: 4,
    speed: 4, // 遅くしました（6 → 4）
    detectionRange: 15,
    color: '#2F2F2F',
    behavior: 'elite',
  },
};

export const TOOLS: Tool[] = [
  {
    type: 'net',
    name: 'キャプチャーネット',
    description: '猿を捕獲する網。接近して使用。',
    cooldown: 0.5,
    currentCooldown: 0,
    key: '1',
  },
  {
    type: 'rod',
    name: 'スタンロッド',
    description: '近距離攻撃。猿を気絶させる。',
    cooldown: 0.8,
    currentCooldown: 0,
    key: '2',
  },
  {
    type: 'booster',
    name: 'ブースター',
    description: '高速ダッシュ移動。',
    cooldown: 3,
    currentCooldown: 0,
    key: '3',
  },
  {
    type: 'hover',
    name: 'ホバードローン',
    description: '空中浮遊・滑空。',
    cooldown: 5,
    currentCooldown: 0,
    key: '4',
  },
  {
    type: 'radar',
    name: 'レーダースキャナー',
    description: '隠れた猿を探知。',
    cooldown: 10,
    currentCooldown: 0,
    key: '5',
  },
];

export const STAGE_CONFIGS: StageInfo[] = [
  {
    id: 1,
    name: 'ジャングルエリア',
    theme: 'jungle',
    monkeyCount: 15,
    bossName: 'ジャングルキング',
    unlocked: true,
    cleared: false,
    bestTime: null,
    bestRank: null,
  },
  {
    id: 2,
    name: 'アイスマウンテン',
    theme: 'ice',
    monkeyCount: 18,
    bossName: 'フロストリーダー',
    unlocked: false,
    cleared: false,
    bestTime: null,
    bestRank: null,
  },
  {
    id: 3,
    name: '遺跡ダンジョン',
    theme: 'ruins',
    monkeyCount: 20,
    bossName: 'テンプルガーディアン',
    unlocked: false,
    cleared: false,
    bestTime: null,
    bestRank: null,
  },
  {
    id: 4,
    name: 'メカニカルシティ',
    theme: 'mechanical',
    monkeyCount: 25,
    bossName: 'サイバーエイプ',
    unlocked: false,
    cleared: false,
    bestTime: null,
    bestRank: null,
  },
  {
    id: 5,
    name: 'ボルケーノベース',
    theme: 'volcano',
    monkeyCount: 30,
    bossName: 'メガスペクター',
    unlocked: false,
    cleared: false,
    bestTime: null,
    bestRank: null,
  },
];
