import * as THREE from 'three';
import { PlayerData, MonkeyData, Platform, Obstacle, ToolType } from '../types';
import { GAME_CONFIG, checkSphereCollision, distanceBetween } from './constants';

// 物理演算とコリジョン

export interface PhysicsState {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  grounded: boolean;
}

// 重力を適用
export const applyGravity = (state: PhysicsState, deltaTime: number): PhysicsState => {
  if (!state.grounded) {
    const newVelocity = state.velocity.clone();
    newVelocity.y += GAME_CONFIG.PLAYER.GRAVITY * deltaTime;
    return { ...state, velocity: newVelocity };
  }
  return state;
};

// プレイヤーの移動を計算
export const calculatePlayerMovement = (
  player: PlayerData,
  input: { forward: boolean; backward: boolean; left: boolean; right: boolean },
  cameraYaw: number,
  _deltaTime: number
): THREE.Vector3 => {
  const moveDirection = new THREE.Vector3();
  
  if (input.forward) moveDirection.z -= 1;
  if (input.backward) moveDirection.z += 1;
  if (input.left) moveDirection.x -= 1;
  if (input.right) moveDirection.x += 1;
  
  if (moveDirection.length() > 0) {
    moveDirection.normalize();
    
    // カメラの向きに合わせて移動方向を回転
    const rotationMatrix = new THREE.Matrix4().makeRotationY(cameraYaw);
    moveDirection.applyMatrix4(rotationMatrix);
    
    const speed = player.isDashing ? GAME_CONFIG.PLAYER.DASH_SPEED : GAME_CONFIG.PLAYER.MOVE_SPEED;
    moveDirection.multiplyScalar(speed);
  }
  
  return moveDirection;
};

// ジャンプを適用
export const applyJump = (velocity: THREE.Vector3, grounded: boolean): THREE.Vector3 => {
  if (grounded) {
    const newVelocity = velocity.clone();
    newVelocity.y = GAME_CONFIG.PLAYER.JUMP_FORCE;
    return newVelocity;
  }
  return velocity;
};

// 地面との衝突判定
export const checkGroundCollision = (
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  platforms: Platform[],
  groundLevel: number = 0
): { position: THREE.Vector3; velocity: THREE.Vector3; grounded: boolean } => {
  let grounded = false;
  const newPosition = position.clone();
  const newVelocity = velocity.clone();
  
  // 基本の地面チェック
  if (newPosition.y <= groundLevel + 1) {
    newPosition.y = groundLevel + 1;
    if (newVelocity.y < 0) {
      newVelocity.y = 0;
    }
    grounded = true;
  }
  
  // プラットフォームとの衝突
  for (const platform of platforms) {
    const platformTop = platform.position.y + platform.size.y / 2;
    const platformBottom = platform.position.y - platform.size.y / 2;
    
    // X-Z範囲内にいるか
    const inXRange = Math.abs(position.x - platform.position.x) < platform.size.x / 2 + 0.5;
    const inZRange = Math.abs(position.z - platform.position.z) < platform.size.z / 2 + 0.5;
    
    if (inXRange && inZRange) {
      // 上からの着地
      if (velocity.y <= 0 && position.y >= platformTop && newPosition.y <= platformTop + 1) {
        newPosition.y = platformTop + 1;
        newVelocity.y = 0;
        grounded = true;
      }
      // 下からのぶつかり
      else if (velocity.y > 0 && position.y <= platformBottom && newPosition.y >= platformBottom - 1) {
        newVelocity.y = 0;
      }
    }
  }
  
  return { position: newPosition, velocity: newVelocity, grounded };
};

// 障害物との衝突判定
export const checkObstacleCollision = (
  position: THREE.Vector3,
  velocity: THREE.Vector3,
  obstacles: Obstacle[],
  playerRadius: number = 0.5
): { position: THREE.Vector3; velocity: THREE.Vector3 } => {
  let newPosition = position.clone();
  const newVelocity = velocity.clone();
  
  for (const obstacle of obstacles) {
    const obstacleMin = new THREE.Vector3(
      obstacle.position.x - obstacle.size.x / 2 - playerRadius,
      obstacle.position.y - obstacle.size.y / 2,
      obstacle.position.z - obstacle.size.z / 2 - playerRadius
    );
    const obstacleMax = new THREE.Vector3(
      obstacle.position.x + obstacle.size.x / 2 + playerRadius,
      obstacle.position.y + obstacle.size.y / 2,
      obstacle.position.z + obstacle.size.z / 2 + playerRadius
    );
    
    // AABB衝突判定
    if (
      newPosition.x >= obstacleMin.x &&
      newPosition.x <= obstacleMax.x &&
      newPosition.y >= obstacleMin.y &&
      newPosition.y <= obstacleMax.y &&
      newPosition.z >= obstacleMin.z &&
      newPosition.z <= obstacleMax.z
    ) {
      // 最も近い面に押し出す
      const distances = [
        { axis: 'x', dir: -1, dist: Math.abs(newPosition.x - obstacleMin.x) },
        { axis: 'x', dir: 1, dist: Math.abs(newPosition.x - obstacleMax.x) },
        { axis: 'z', dir: -1, dist: Math.abs(newPosition.z - obstacleMin.z) },
        { axis: 'z', dir: 1, dist: Math.abs(newPosition.z - obstacleMax.z) },
      ];
      
      distances.sort((a, b) => a.dist - b.dist);
      const nearest = distances[0];
      
      if (nearest.axis === 'x') {
        newPosition.x = nearest.dir === -1 ? obstacleMin.x - 0.01 : obstacleMax.x + 0.01;
        newVelocity.x = 0;
      } else {
        newPosition.z = nearest.dir === -1 ? obstacleMin.z - 0.01 : obstacleMax.z + 0.01;
        newVelocity.z = 0;
      }
    }
  }
  
  return { position: newPosition, velocity: newVelocity };
};

// 境界チェック
export const applyBoundary = (position: THREE.Vector3, boundary: number): THREE.Vector3 => {
  const newPosition = position.clone();
  newPosition.x = Math.max(-boundary, Math.min(boundary, newPosition.x));
  newPosition.z = Math.max(-boundary, Math.min(boundary, newPosition.z));
  return newPosition;
};

// 猿との衝突判定（捕獲/攻撃）
export const checkMonkeyInteraction = (
  player: PlayerData,
  monkeys: MonkeyData[],
  currentTool: ToolType,
  isAttacking: boolean
): { capturedId: string | null; hitIds: string[] } => {
  let capturedId: string | null = null;
  const hitIds: string[] = [];
  
  for (const monkey of monkeys) {
    if (monkey.state === 'captured') continue;
    
    const distance = distanceBetween(player.position, monkey.position);
    
    if (isAttacking) {
      if (currentTool === 'net' && distance < GAME_CONFIG.PLAYER.CAPTURE_RANGE) {
        // ネットで捕獲（判定を緩和：気絶中、体力0、または体力が少ない場合）
        if (monkey.state === 'stunned' || monkey.health <= 0 || monkey.health <= monkey.maxHealth * 0.5) {
          capturedId = monkey.id;
          break;
        }
      } else if (currentTool === 'rod' && distance < GAME_CONFIG.PLAYER.ATTACK_RANGE) {
        // ロッドで攻撃
        hitIds.push(monkey.id);
      }
    }
  }
  
  return { capturedId, hitIds };
};

// プレイヤーへのダメージ判定
export const checkPlayerDamage = (
  player: PlayerData,
  monkeys: MonkeyData[],
  projectiles: THREE.Vector3[]
): { damage: number; knockbackDirection: THREE.Vector3 | null } => {
  if (player.invincibleTime > 0) {
    return { damage: 0, knockbackDirection: null };
  }
  
  let totalDamage = 0;
  let knockbackDirection: THREE.Vector3 | null = null;
  
  // 攻撃型の猿からのダメージ
  for (const monkey of monkeys) {
    if (monkey.state === 'attacking' && monkey.type === 'red') {
      const distance = distanceBetween(player.position, monkey.position);
      if (distance < 2) {
        totalDamage += 10;
        knockbackDirection = new THREE.Vector3()
          .subVectors(player.position, monkey.position)
          .normalize();
        break;
      }
    }
  }
  
  // 投擲物からのダメージ
  for (const projectile of projectiles) {
    if (checkSphereCollision(player.position, 0.5, projectile, 0.3)) {
      totalDamage += 5;
    }
  }
  
  return { damage: totalDamage, knockbackDirection };
};

// レイキャスト（視線判定）
export const raycast = (
  origin: THREE.Vector3,
  direction: THREE.Vector3,
  obstacles: Obstacle[],
  maxDistance: number
): { hit: boolean; point: THREE.Vector3 | null; distance: number } => {
  let closestHit: { point: THREE.Vector3; distance: number } | null = null;
  
  for (const obstacle of obstacles) {
    // 簡易的なAABBレイキャスト
    const invDir = new THREE.Vector3(
      1 / direction.x,
      1 / direction.y,
      1 / direction.z
    );
    
    const min = new THREE.Vector3(
      obstacle.position.x - obstacle.size.x / 2,
      obstacle.position.y - obstacle.size.y / 2,
      obstacle.position.z - obstacle.size.z / 2
    );
    const max = new THREE.Vector3(
      obstacle.position.x + obstacle.size.x / 2,
      obstacle.position.y + obstacle.size.y / 2,
      obstacle.position.z + obstacle.size.z / 2
    );
    
    const t1 = (min.x - origin.x) * invDir.x;
    const t2 = (max.x - origin.x) * invDir.x;
    const t3 = (min.y - origin.y) * invDir.y;
    const t4 = (max.y - origin.y) * invDir.y;
    const t5 = (min.z - origin.z) * invDir.z;
    const t6 = (max.z - origin.z) * invDir.z;
    
    const tmin = Math.max(
      Math.max(Math.min(t1, t2), Math.min(t3, t4)),
      Math.min(t5, t6)
    );
    const tmax = Math.min(
      Math.min(Math.max(t1, t2), Math.max(t3, t4)),
      Math.max(t5, t6)
    );
    
    if (tmax >= 0 && tmin <= tmax && tmin <= maxDistance) {
      const hitDistance = tmin >= 0 ? tmin : tmax;
      if (!closestHit || hitDistance < closestHit.distance) {
        closestHit = {
          point: origin.clone().add(direction.clone().multiplyScalar(hitDistance)),
          distance: hitDistance,
        };
      }
    }
  }
  
  return closestHit
    ? { hit: true, point: closestHit.point, distance: closestHit.distance }
    : { hit: false, point: null, distance: maxDistance };
};
