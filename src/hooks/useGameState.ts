import { create } from 'zustand';
import * as THREE from 'three';
import {
  GameStore,
  GameState,
  StageId,
  StageInfo,
  PlayerData,
  MonkeyData,
  BossData,
  InputState,
  CameraData,
  ParticleEffect,
  GameResult,
  GameSettings,
  SaveData,
  STAGE_CONFIGS,
  TOOLS,
} from '../types';
import { saveToStorage, loadFromStorage, GAME_CONFIG } from '../utils/constants';

const SAVE_KEY = 'monkey-catcher-save';

const createInitialPlayerData = (): PlayerData => ({
  position: new THREE.Vector3(0, 1, 0),
  rotation: new THREE.Euler(0, 0, 0),
  velocity: new THREE.Vector3(0, 0, 0),
  health: GAME_CONFIG.PLAYER.MAX_HEALTH,
  maxHealth: GAME_CONFIG.PLAYER.MAX_HEALTH,
  currentTool: 'net',
  tools: [...TOOLS],
  isJumping: false,
  isDashing: false,
  isAttacking: false,
  dashCooldown: 0,
  invincibleTime: 0,
  capturedMonkeys: 0,
});

const createInitialInputState = (): InputState => ({
  forward: false,
  backward: false,
  left: false,
  right: false,
  jump: false,
  dash: false,
  attack: false,
  tool1: false,
  tool2: false,
  tool3: false,
  tool4: false,
  tool5: false,
  pause: false,
  mouseX: 0,
  mouseY: 0,
  mouseDeltaX: 0,
  mouseDeltaY: 0,
  isPointerLocked: false,
});

const createInitialCameraData = (): CameraData => ({
  position: new THREE.Vector3(0, 5, 10),
  target: new THREE.Vector3(0, 1, 0),
  rotation: new THREE.Euler(0, 0, 0),
  distance: GAME_CONFIG.CAMERA.DISTANCE,
  pitch: 0.3,
  yaw: 0,
});

const createInitialSettings = (): GameSettings => ({
  musicVolume: 0.7,
  sfxVolume: 0.8,
  mouseSensitivity: 1,
  invertY: false,
  showTutorial: true,
  language: 'ja',
});

export const useGameStore = create<GameStore>((set, get) => ({
  // ゲーム状態
  gameState: 'menu',
  setGameState: (state: GameState) => set({ gameState: state }),
  
  // ステージ情報
  currentStage: 1,
  setCurrentStage: (stage: StageId) => set({ currentStage: stage }),
  stages: [...STAGE_CONFIGS],
  updateStageInfo: (stageId: StageId, info: Partial<StageInfo>) =>
    set((state) => ({
      stages: state.stages.map((s) =>
        s.id === stageId ? { ...s, ...info } : s
      ),
    })),
  
  // プレイヤー
  player: createInitialPlayerData(),
  updatePlayer: (data: Partial<PlayerData>) =>
    set((state) => ({
      player: { ...state.player, ...data },
    })),
  resetPlayer: () => set({ player: createInitialPlayerData() }),
  
  // 猿
  monkeys: [],
  setMonkeys: (monkeys: MonkeyData[]) => set({ monkeys }),
  updateMonkey: (id: string, data: Partial<MonkeyData>) =>
    set((state) => ({
      monkeys: state.monkeys.map((m) =>
        m.id === id ? { ...m, ...data } : m
      ),
    })),
  removeMonkey: (id: string) =>
    set((state) => ({
      monkeys: state.monkeys.filter((m) => m.id !== id),
    })),
  
  // ボス
  boss: null,
  setBoss: (boss: BossData | null) => set({ boss }),
  updateBoss: (data: Partial<BossData>) =>
    set((state) => ({
      boss: state.boss ? { ...state.boss, ...data } : null,
    })),
  
  // 入力
  input: createInitialInputState(),
  updateInput: (data: Partial<InputState>) =>
    set((state) => ({
      input: { ...state.input, ...data },
    })),
  
  // カメラ
  camera: createInitialCameraData(),
  updateCamera: (data: Partial<CameraData>) =>
    set((state) => ({
      camera: { ...state.camera, ...data },
    })),
  
  // エフェクト
  effects: [],
  addEffect: (effect: ParticleEffect) =>
    set((state) => ({
      effects: [...state.effects, effect],
    })),
  removeEffect: (id: string) =>
    set((state) => ({
      effects: state.effects.filter((e) => e.id !== id),
    })),
  clearEffects: () => set({ effects: [] }),
  
  // タイマー
  gameTime: 0,
  setGameTime: (time: number) => set({ gameTime: time }),
  incrementGameTime: (delta: number) =>
    set((state) => ({ gameTime: state.gameTime + delta })),
  
  // 結果
  result: null,
  setResult: (result: GameResult | null) => set({ result }),
  
  // 設定
  settings: createInitialSettings(),
  updateSettings: (settings: Partial<GameSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),
  
  // セーブ/ロード
  saveGame: () => {
    const state = get();
    const saveData: SaveData = {
      version: '1.0.0',
      stages: state.stages.reduce((acc, stage) => {
        acc[stage.id] = {
          unlocked: stage.unlocked,
          cleared: stage.cleared,
          bestTime: stage.bestTime,
          bestRank: stage.bestRank,
        };
        return acc;
      }, {} as SaveData['stages']),
      totalCaptured: state.player.capturedMonkeys,
      gallery: [],
      settings: state.settings,
    };
    saveToStorage(SAVE_KEY, saveData);
  },
  loadGame: () => {
    const defaultSave: SaveData = {
      version: '1.0.0',
      stages: {},
      totalCaptured: 0,
      gallery: [],
      settings: createInitialSettings(),
    };
    const saveData = loadFromStorage<SaveData>(SAVE_KEY, defaultSave);
    
    set((state) => ({
      stages: state.stages.map((stage) => {
        const savedStage = saveData.stages[stage.id];
        if (savedStage) {
          return {
            ...stage,
            unlocked: savedStage.unlocked,
            cleared: savedStage.cleared,
            bestTime: savedStage.bestTime,
            bestRank: savedStage.bestRank,
          };
        }
        return stage;
      }),
      settings: saveData.settings,
    }));
  },
  
  // 通知
  notification: null,
  setNotification: (message: string | null) => set({ notification: message }),
  
  // ダメージフラッシュ
  showDamageFlash: false,
  setShowDamageFlash: (show: boolean) => set({ showDamageFlash: show }),
}));
