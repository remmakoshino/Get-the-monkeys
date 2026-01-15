import * as THREE from 'three';
import { MonkeyData, PlayerData, MonkeyState, MonkeyType, MONKEY_STATS } from '../types';
import { GAME_CONFIG, randomRange, directionTo, distanceBetween, generateUniqueId, normalizeAngle } from './constants';

// 猿AIの行動ロジック

export interface AIContext {
  monkey: MonkeyData;
  player: PlayerData;
  deltaTime: number;
  obstacles: THREE.Vector3[];
  otherMonkeys: MonkeyData[];
}

// プレイヤーとの距離に基づいて警戒レベルを更新
export const updateAlertLevel = (context: AIContext): number => {
  const { monkey, player } = context;
  const distance = distanceBetween(monkey.position, player.position);
  const stats = MONKEY_STATS[monkey.type];
  
  if (distance < stats.detectionRange) {
    // プレイヤーを検知
    return Math.min(monkey.alertLevel + context.deltaTime * 2, 1);
  } else {
    // 警戒レベルを徐々に下げる
    return Math.max(monkey.alertLevel - context.deltaTime * GAME_CONFIG.MONKEY.ALERT_DECAY_RATE, 0);
  }
};

// 猿の状態を決定
export const determineState = (context: AIContext): MonkeyState => {
  const { monkey, player } = context;
  
  if (monkey.state === 'captured') return 'captured';
  if (monkey.stunTime > 0) return 'stunned';
  
  const distance = distanceBetween(monkey.position, player.position);
  const stats = MONKEY_STATS[monkey.type];
  
  if (monkey.alertLevel > 0.5) {
    // 高警戒状態
    switch (stats.behavior) {
      case 'flee':
      case 'zigzag':
        return 'fleeing';
      case 'attack':
        return distance < 5 ? 'attacking' : 'fleeing';
      case 'hide':
        return 'hidden';
      case 'elite':
        return distance < 8 ? 'attacking' : 'fleeing';
      default:
        return 'fleeing';
    }
  } else if (monkey.alertLevel > 0.2) {
    return 'alert';
  } else if (monkey.patrolPoints.length > 0) {
    return 'patrol';
  }
  
  return 'idle';
};

// 逃走方向を計算
export const calculateFleeDirection = (context: AIContext): THREE.Vector3 => {
  const { monkey, player } = context;
  const stats = MONKEY_STATS[monkey.type];
  
  // プレイヤーから離れる方向
  const fleeDir = directionTo(player.position, monkey.position);
  
  if (stats.behavior === 'zigzag') {
    // ジグザグ逃走
    const zigzagAngle = Math.sin(Date.now() * 0.005) * Math.PI / 3;
    const rotatedDir = new THREE.Vector3(
      fleeDir.x * Math.cos(zigzagAngle) - fleeDir.z * Math.sin(zigzagAngle),
      0,
      fleeDir.x * Math.sin(zigzagAngle) + fleeDir.z * Math.cos(zigzagAngle)
    );
    return rotatedDir.normalize();
  }
  
  return fleeDir;
};

// 攻撃行動
export const calculateAttackBehavior = (context: AIContext): { shouldAttack: boolean; attackDirection: THREE.Vector3 } => {
  const { monkey, player } = context;
  const distance = distanceBetween(monkey.position, player.position);
  
  if (distance < 5 && monkey.state === 'attacking') {
    const attackDir = directionTo(monkey.position, player.position);
    return { shouldAttack: true, attackDirection: attackDir };
  }
  
  return { shouldAttack: false, attackDirection: new THREE.Vector3() };
};

// パトロール行動
export const updatePatrol = (context: AIContext): THREE.Vector3 | null => {
  const { monkey } = context;
  
  if (monkey.patrolPoints.length === 0) return null;
  
  const targetPoint = monkey.patrolPoints[monkey.currentPatrolIndex];
  const distance = distanceBetween(monkey.position, targetPoint);
  
  if (distance < 1) {
    // 次のパトロールポイントへ
    return null; // 少し待機
  }
  
  return directionTo(monkey.position, targetPoint);
};

// 隠れる場所を探す
export const findHidingSpot = (context: AIContext): THREE.Vector3 => {
  const { monkey, player, obstacles } = context;
  
  // プレイヤーから最も遠い障害物の裏を見つける
  let bestSpot = monkey.position.clone();
  let maxDistance = 0;
  
  for (const obstacle of obstacles) {
    const toObstacle = directionTo(player.position, obstacle);
    const hidingSpot = obstacle.clone().add(toObstacle.multiplyScalar(3));
    const distFromPlayer = distanceBetween(hidingSpot, player.position);
    
    if (distFromPlayer > maxDistance) {
      maxDistance = distFromPlayer;
      bestSpot = hidingSpot;
    }
  }
  
  return bestSpot;
};

// 猿の移動を更新
export const updateMonkeyMovement = (context: AIContext): { position: THREE.Vector3; velocity: THREE.Vector3; rotation: THREE.Euler } => {
  const { monkey, deltaTime } = context;
  const stats = MONKEY_STATS[monkey.type];
  
  let targetVelocity = new THREE.Vector3();
  let speed = stats.speed;
  
  switch (monkey.state) {
    case 'fleeing': {
      const fleeDir = calculateFleeDirection(context);
      targetVelocity = fleeDir.multiplyScalar(speed);
      break;
    }
    case 'attacking': {
      const { attackDirection } = calculateAttackBehavior(context);
      // 攻撃時は近づく
      targetVelocity = attackDirection.multiplyScalar(speed * 0.5);
      break;
    }
    case 'patrol': {
      const patrolDir = updatePatrol(context);
      if (patrolDir) {
        targetVelocity = patrolDir.multiplyScalar(speed * 0.5);
      }
      break;
    }
    case 'alert': {
      // 警戒状態: プレイヤーの方を向きつつゆっくり後退
      const backDir = directionTo(context.player.position, monkey.position);
      targetVelocity = backDir.multiplyScalar(speed * 0.3);
      break;
    }
    case 'hidden':
    case 'idle':
    case 'stunned':
    case 'captured':
    default:
      targetVelocity = new THREE.Vector3();
      break;
  }
  
  // 速度を滑らかに補間
  const newVelocity = monkey.velocity.clone().lerp(targetVelocity, deltaTime * 5);
  
  // 位置を更新
  const newPosition = monkey.position.clone().add(newVelocity.clone().multiplyScalar(deltaTime));
  
  // 地面に固定（Y軸）
  newPosition.y = Math.max(newPosition.y, 1);
  
  // 境界チェック
  const boundary = GAME_CONFIG.STAGE.BOUNDARY;
  newPosition.x = Math.max(-boundary, Math.min(boundary, newPosition.x));
  newPosition.z = Math.max(-boundary, Math.min(boundary, newPosition.z));
  
  // 回転を計算（移動方向を向く）
  let newRotation = monkey.rotation.clone();
  if (newVelocity.length() > 0.1) {
    const targetAngle = Math.atan2(newVelocity.x, newVelocity.z);
    const currentAngle = monkey.rotation.y;
    const angleDiff = normalizeAngle(targetAngle - currentAngle);
    newRotation.y = currentAngle + angleDiff * deltaTime * 10;
  }
  
  return { position: newPosition, velocity: newVelocity, rotation: newRotation };
};

// ボスAI
export const updateBossAI = (boss: MonkeyData & { phase: number; attackCooldown: number }, player: PlayerData, _deltaTime: number): Partial<MonkeyData> => {
  const updates: Partial<MonkeyData> = {};
  
  // フェーズに応じた行動
  const healthPercent = boss.health / boss.maxHealth;
  
  if (healthPercent <= 0.25) {
    updates.bossPhase = 3;
  } else if (healthPercent <= 0.5) {
    updates.bossPhase = 2;
  } else {
    updates.bossPhase = 1;
  }
  
  // 攻撃パターン
  const distance = distanceBetween(boss.position, player.position);
  
  if (boss.attackCooldown <= 0) {
    if (distance < 10) {
      updates.state = 'attacking';
    } else {
      // プレイヤーに近づく
      const moveDir = directionTo(boss.position, player.position);
      updates.velocity = moveDir.multiplyScalar(MONKEY_STATS[boss.type].speed);
    }
  }
  
  return updates;
};

// 猿の生成
export const spawnMonkey = (type: MonkeyType, position: THREE.Vector3, patrolPoints?: THREE.Vector3[]): MonkeyData => {
  const stats = MONKEY_STATS[type];
  
  return {
    id: generateUniqueId(),
    type,
    position: position.clone(),
    rotation: new THREE.Euler(0, randomRange(0, Math.PI * 2), 0),
    velocity: new THREE.Vector3(),
    state: 'idle',
    health: stats.maxHealth,
    maxHealth: stats.maxHealth,
    stunTime: 0,
    alertLevel: 0,
    targetPosition: null,
    patrolPoints: patrolPoints || [],
    currentPatrolIndex: 0,
    isBoss: false,
  };
};

// パトロールポイントを生成
export const generatePatrolPoints = (center: THREE.Vector3, count: number, radius: number): THREE.Vector3[] => {
  const points: THREE.Vector3[] = [];
  const angleStep = (Math.PI * 2) / count;
  
  for (let i = 0; i < count; i++) {
    const angle = angleStep * i + randomRange(-0.3, 0.3);
    const dist = radius * randomRange(0.7, 1.3);
    points.push(new THREE.Vector3(
      center.x + Math.cos(angle) * dist,
      center.y,
      center.z + Math.sin(angle) * dist
    ));
  }
  
  return points;
};
