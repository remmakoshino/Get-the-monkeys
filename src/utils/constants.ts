import * as THREE from 'three';

// ゲーム定数
export const GAME_CONFIG = {
  // プレイヤー設定
  PLAYER: {
    MOVE_SPEED: 8,
    DASH_SPEED: 16,
    JUMP_FORCE: 12,
    GRAVITY: -25,
    MAX_HEALTH: 100,
    DASH_DURATION: 0.3,
    DASH_COOLDOWN: 1.5,
    INVINCIBLE_DURATION: 1.5,
    CAPTURE_RANGE: 4.5, // 捕獲範囲を拡大（2.5 → 4.5）
    ATTACK_RANGE: 4, // 攻撃範囲も拡大（3 → 4）
    ATTACK_DAMAGE: 1,
  },
  
  // カメラ設定
  CAMERA: {
    DISTANCE: 10,
    MIN_DISTANCE: 5,
    MAX_DISTANCE: 20,
    HEIGHT_OFFSET: 3,
    LERP_SPEED: 8,
    MOUSE_SENSITIVITY: 0.002,
    MIN_PITCH: -Math.PI / 4,
    MAX_PITCH: Math.PI / 3,
  },
  
  // 猿AI設定
  MONKEY: {
    PATROL_WAIT_TIME: 2,
    ALERT_DECAY_RATE: 0.5,
    STUN_DURATION: 3,
    FLEE_DISTANCE: 20,
    ATTACK_COOLDOWN: 1.5,
    PROJECTILE_SPEED: 15,
  },
  
  // ステージ設定
  STAGE: {
    GROUND_SIZE: 100,
    BOUNDARY: 50,
  },
  
  // ランク評価基準
  RANK: {
    S: { time: 180, damage: 0 },     // 3分以内、ノーダメージ
    A: { time: 300, damage: 30 },    // 5分以内、ダメージ30以下
    B: { time: 600, damage: 100 },   // 10分以内
  },
  
  // UI設定
  UI: {
    NOTIFICATION_DURATION: 2,
    DAMAGE_FLASH_DURATION: 0.2,
  },
};

// カラーパレット
export const COLORS = {
  PLAYER: {
    BODY: '#4a90d9',
    SKIN: '#ffcc99',
    HAIR: '#4a3728',
  },
  MONKEY: {
    YELLOW: '#FFD700',
    BLUE: '#4169E1',
    RED: '#DC143C',
    GREEN: '#228B22',
    BLACK: '#2F2F2F',
    HELMET: '#808080',
    HELMET_LIGHT: '#ff0000',
  },
  STAGE: {
    JUNGLE: {
      GROUND: '#3d5c3d',
      SKY: '#87CEEB',
      FOG: '#90EE90',
    },
    ICE: {
      GROUND: '#E0FFFF',
      SKY: '#B0E0E6',
      FOG: '#F0F8FF',
    },
    RUINS: {
      GROUND: '#8B7355',
      SKY: '#DEB887',
      FOG: '#D2B48C',
    },
    MECHANICAL: {
      GROUND: '#2F4F4F',
      SKY: '#1a1a2e',
      FOG: '#363636',
    },
    VOLCANO: {
      GROUND: '#4a2020',
      SKY: '#2d1b1b',
      FOG: '#3d2020',
    },
  },
  EFFECTS: {
    CAPTURE: '#00FF00',
    HIT: '#FF4444',
    STUN: '#FFFF00',
    DASH: '#00BFFF',
  },
};

// キー設定
export const KEY_BINDINGS = {
  FORWARD: ['w', 'W', 'ArrowUp'],
  BACKWARD: ['s', 'S', 'ArrowDown'],
  LEFT: ['a', 'A', 'ArrowLeft'],
  RIGHT: ['d', 'D', 'ArrowRight'],
  JUMP: [' '],
  DASH: ['Shift'],
  TOOL_1: ['1'],
  TOOL_2: ['2'],
  TOOL_3: ['3'],
  TOOL_4: ['4'],
  TOOL_5: ['5'],
  PAUSE: ['Escape', 'p', 'P'],
};

// ヘルパー関数
export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const lerpVector3 = (start: THREE.Vector3, end: THREE.Vector3, t: number): THREE.Vector3 => {
  return new THREE.Vector3(
    lerp(start.x, end.x, t),
    lerp(start.y, end.y, t),
    lerp(start.z, end.z, t)
  );
};

export const randomRange = (min: number, max: number): number => {
  return Math.random() * (max - min) + min;
};

export const randomInt = (min: number, max: number): number => {
  return Math.floor(randomRange(min, max + 1));
};

export const randomVector3 = (rangeX: number, rangeY: number, rangeZ: number): THREE.Vector3 => {
  return new THREE.Vector3(
    randomRange(-rangeX, rangeX),
    randomRange(0, rangeY),
    randomRange(-rangeZ, rangeZ)
  );
};

export const distanceBetween = (a: THREE.Vector3, b: THREE.Vector3): number => {
  return a.distanceTo(b);
};

export const directionTo = (from: THREE.Vector3, to: THREE.Vector3): THREE.Vector3 => {
  return new THREE.Vector3().subVectors(to, from).normalize();
};

export const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 100);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
};

export const calculateRank = (time: number, damageTaken: number): 'S' | 'A' | 'B' | 'C' => {
  if (time <= GAME_CONFIG.RANK.S.time && damageTaken <= GAME_CONFIG.RANK.S.damage) {
    return 'S';
  }
  if (time <= GAME_CONFIG.RANK.A.time && damageTaken <= GAME_CONFIG.RANK.A.damage) {
    return 'A';
  }
  if (time <= GAME_CONFIG.RANK.B.time) {
    return 'B';
  }
  return 'C';
};

export const generateUniqueId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// 衝突判定ヘルパー
export const checkBoxCollision = (
  pos1: THREE.Vector3,
  size1: THREE.Vector3,
  pos2: THREE.Vector3,
  size2: THREE.Vector3
): boolean => {
  return (
    Math.abs(pos1.x - pos2.x) < (size1.x + size2.x) / 2 &&
    Math.abs(pos1.y - pos2.y) < (size1.y + size2.y) / 2 &&
    Math.abs(pos1.z - pos2.z) < (size1.z + size2.z) / 2
  );
};

export const checkSphereCollision = (
  pos1: THREE.Vector3,
  radius1: number,
  pos2: THREE.Vector3,
  radius2: number
): boolean => {
  return pos1.distanceTo(pos2) < radius1 + radius2;
};

// ローカルストレージヘルパー
export const saveToStorage = (key: string, data: unknown): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save to localStorage:', e);
  }
};

export const loadFromStorage = <T>(key: string, defaultValue: T): T => {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch (e) {
    console.error('Failed to load from localStorage:', e);
    return defaultValue;
  }
};

// アニメーションヘルパー
export const easeOutQuad = (t: number): number => {
  return 1 - (1 - t) * (1 - t);
};

export const easeInOutQuad = (t: number): number => {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
};

export const easeOutElastic = (t: number): number => {
  const c4 = (2 * Math.PI) / 3;
  return t === 0
    ? 0
    : t === 1
    ? 1
    : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
};

// 角度ヘルパー
export const degToRad = (degrees: number): number => {
  return degrees * (Math.PI / 180);
};

export const radToDeg = (radians: number): number => {
  return radians * (180 / Math.PI);
};

export const normalizeAngle = (angle: number): number => {
  while (angle > Math.PI) angle -= Math.PI * 2;
  while (angle < -Math.PI) angle += Math.PI * 2;
  return angle;
};

// 配列ヘルパー
export const shuffleArray = <T>(array: T[]): T[] => {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
};

export const pickRandom = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)];
};
