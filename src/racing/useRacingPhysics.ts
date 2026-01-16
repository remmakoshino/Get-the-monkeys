import { useRef, useCallback } from 'react';
import * as THREE from 'three';
import { RacingMachine, CourseData, RACING_CONFIG, RacingInput } from './types';

// 入力変換ヘルパー
interface PhysicsInput {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  drift: boolean;
  item: boolean;
  transform: boolean;
}

const convertInput = (input: RacingInput): PhysicsInput => ({
  forward: input.accelerate,
  backward: input.brake,
  left: input.left,
  right: input.right,
  drift: input.drift,
  item: input.useItem,
  transform: input.transform,
});

// レース物理エンジン
export const useRacingPhysics = () => {
  const updateMachinePhysics = useCallback((
    machine: RacingMachine,
    rawInput: RacingInput | PhysicsInput,
    _courseData: CourseData,
    delta: number
  ): Partial<RacingMachine> => {
    // 入力を変換（RacingInput形式の場合）
    const input: PhysicsInput = 'accelerate' in rawInput 
      ? convertInput(rawInput as RacingInput) 
      : rawInput as PhysicsInput;
    
    const updates: Partial<RacingMachine> = {};
    const stats = machine.stats;

    // 加速度と減速
    let targetSpeed = 0;
    if (input.forward) {
      targetSpeed = stats.maxSpeed;
      if (machine.isBoosting) {
        targetSpeed *= 1.5;
      }
    } else if (input.backward) {
      targetSpeed = -stats.maxSpeed * 0.3;
    }

    // 加速
    const acceleration = input.forward ? stats.acceleration : stats.acceleration * 2;
    let newSpeed = THREE.MathUtils.lerp(machine.speed, targetSpeed, acceleration * delta);

    // ドリフト処理
    let newIsDrifting = machine.isDrifting;
    let newDriftDirection = machine.driftDirection;
    let newDriftLevel = machine.driftLevel;
    let newDriftTime = machine.driftTime;

    if (input.drift && machine.speed > RACING_CONFIG.DRIFT_MIN_SPEED) {
      if (!machine.isDrifting) {
        newIsDrifting = true;
        newDriftDirection = input.left ? 'left' : input.right ? 'right' : null;
        newDriftLevel = 1;
        newDriftTime = 0;
      } else {
        newDriftTime = (machine.driftTime || 0) + delta;
        // ドリフトレベルの更新
        if (newDriftTime > RACING_CONFIG.DRIFT_LEVEL_3_TIME) {
          newDriftLevel = 3;
        } else if (newDriftTime > RACING_CONFIG.DRIFT_LEVEL_2_TIME) {
          newDriftLevel = 2;
        }
      }
    } else if (machine.isDrifting && !input.drift) {
      // ドリフト解除時のブースト
      newIsDrifting = false;
      if (machine.driftLevel >= 1) {
        updates.isBoosting = true;
        updates.boostEndTime = Date.now() + RACING_CONFIG.DRIFT_BOOST_DURATION * machine.driftLevel * 1000;
      }
      newDriftDirection = null;
      newDriftLevel = 0;
      newDriftTime = 0;
    }

    // ステアリング
    let turnAmount = 0;
    if (input.left) turnAmount = 1;
    if (input.right) turnAmount = -1;

    const handling = newIsDrifting ? stats.handling * 0.7 : stats.handling;
    const turnSpeed = handling * delta * (newSpeed / stats.maxSpeed);

    const newRotation = machine.rotation.clone();
    newRotation.y += turnAmount * turnSpeed;

    // ドリフト中の追加回転
    if (newIsDrifting && newDriftDirection) {
      const driftTurn = newDriftDirection === 'left' ? 0.5 : -0.5;
      newRotation.y += driftTurn * delta;
    }

    // 位置更新
    const forward = new THREE.Vector3(0, 0, 1);
    forward.applyEuler(newRotation);
    const newPosition = machine.position.clone();
    newPosition.add(forward.multiplyScalar(newSpeed * delta));

    // コース境界チェック（簡易版）
    const maxDistance = 150;
    if (newPosition.length() > maxDistance) {
      newPosition.setLength(maxDistance);
      newSpeed *= 0.5;
    }

    // 地面に固定
    newPosition.y = 0;

    // フォーム変更
    let newForm = machine.currentForm;
    if (input.transform && machine.transformCooldown <= 0) {
      newForm = machine.currentForm === 'normal' ? 'long' : 'normal';
      updates.transformCooldown = RACING_CONFIG.TRANSFORM_COOLDOWN;
    }

    // クールダウン更新
    let newTransformCooldown = machine.transformCooldown - delta;
    if (newTransformCooldown < 0) newTransformCooldown = 0;

    // ブースト終了チェック
    if (machine.isBoosting && machine.boostEndTime && Date.now() > machine.boostEndTime) {
      updates.isBoosting = false;
      updates.boostEndTime = undefined;
    }

    // スピン回復
    if (machine.isSpinning) {
      updates.isSpinning = false; // 実際のゲームではタイマーで管理
    }

    // 無敵終了チェック
    if (machine.isInvincible && machine.invincibleEndTime && Date.now() > machine.invincibleEndTime) {
      updates.isInvincible = false;
      updates.invincibleEndTime = undefined;
    }

    return {
      ...updates,
      position: newPosition,
      rotation: newRotation,
      speed: newSpeed,
      isDrifting: newIsDrifting,
      driftDirection: newDriftDirection,
      driftLevel: newDriftLevel,
      driftTime: newDriftTime,
      currentForm: newForm,
      transformCooldown: newTransformCooldown,
    };
  }, []);

  return { updateMachinePhysics };
};

// AI制御
export const useRacingAI = () => {
  const targetWaypointRef = useRef<Map<string, number>>(new Map());

  const updateAI = useCallback((
    machine: RacingMachine,
    courseData: CourseData,
    allMachines: RacingMachine[],
    _delta: number
  ): { forward: boolean; backward: boolean; left: boolean; right: boolean; drift: boolean; item: boolean; transform: boolean } => {
    // ターゲットのウェイポイントを取得
    let targetIndex = targetWaypointRef.current.get(machine.id) || 0;
    const targetWaypoint = courseData.waypoints[targetIndex];

    // 現在位置からターゲットへの方向
    const toTarget = new THREE.Vector3().subVectors(targetWaypoint, machine.position);
    const distanceToTarget = toTarget.length();

    // ウェイポイント到達判定
    if (distanceToTarget < 10) {
      targetIndex = (targetIndex + 1) % courseData.waypoints.length;
      targetWaypointRef.current.set(machine.id, targetIndex);
    }

    // 現在の向きとターゲットへの向きの差
    const currentForward = new THREE.Vector3(0, 0, 1).applyEuler(machine.rotation);
    toTarget.normalize();

    const cross = currentForward.cross(toTarget);
    const dot = new THREE.Vector3(0, 0, 1).applyEuler(machine.rotation).dot(toTarget);

    // ステアリング決定
    const turnThreshold = 0.1;
    const left = cross.y < -turnThreshold;
    const right = cross.y > turnThreshold;

    // 前進判定
    const forward = dot > -0.3;
    const backward = dot < -0.7;

    // ドリフト判定（カーブで速度が高い時）
    const needsDrift = Math.abs(cross.y) > 0.5 && machine.speed > RACING_CONFIG.DRIFT_MIN_SPEED * 0.8;

    // アイテム使用判定
    let useItem = false;
    if (machine.currentItem) {
      // ターゲットが前方にいる場合にアイテム使用
      const machinesAhead = allMachines.filter(m => 
        m.id !== machine.id && 
        m.currentPosition < machine.currentPosition
      );
      if (machinesAhead.length > 0 && Math.random() < 0.02) {
        useItem = true;
      }
    }

    // フォーム変更判定（直線で変更）
    const transform = Math.abs(cross.y) < 0.1 && machine.currentForm === 'normal' && Math.random() < 0.001;

    return {
      forward,
      backward,
      left,
      right,
      drift: needsDrift,
      item: useItem,
      transform,
    };
  }, []);

  return { updateAI };
};

// チェックポイント/ラップ管理
export const useRaceProgress = () => {
  const updateProgress = useCallback((
    machine: RacingMachine,
    courseData: CourseData
  ): Partial<RacingMachine> => {
    const updates: Partial<RacingMachine> = {};

    // 現在のチェックポイントを確認
    const currentCheckpointIndex = machine.currentCheckpoint;
    if (currentCheckpointIndex >= courseData.checkpoints.length) {
      return updates;
    }

    const checkpoint = courseData.checkpoints[currentCheckpointIndex];
    const distanceToCheckpoint = machine.position.distanceTo(checkpoint.position);

    // チェックポイント通過判定
    if (distanceToCheckpoint < checkpoint.width) {
      updates.currentCheckpoint = currentCheckpointIndex + 1;

      // ラップ完了判定
      if (currentCheckpointIndex === courseData.checkpoints.length - 1) {
        updates.currentLap = machine.currentLap + 1;
        updates.currentCheckpoint = 0;

        // ラップタイム記録
        const now = Date.now();
        if (machine.lapTimes.length === 0) {
          updates.lapTimes = [now];
        } else {
          const lastLapTime = machine.lapTimes[machine.lapTimes.length - 1];
          updates.lapTimes = [...machine.lapTimes, now - lastLapTime];
        }
      }
    }

    return updates;
  }, []);

  return { updateProgress };
};

// 衝突検出
export const useRacingCollision = () => {
  const checkMachineCollisions = useCallback((
    machine: RacingMachine,
    allMachines: RacingMachine[]
  ): { collidedWith: RacingMachine | null; pushDirection: THREE.Vector3 } => {
    const collisionRadius = 1.5;

    for (const other of allMachines) {
      if (other.id === machine.id) continue;

      const distance = machine.position.distanceTo(other.position);
      if (distance < collisionRadius * 2) {
        const pushDirection = new THREE.Vector3()
          .subVectors(machine.position, other.position)
          .normalize();
        return { collidedWith: other, pushDirection };
      }
    }

    return { collidedWith: null, pushDirection: new THREE.Vector3() };
  }, []);

  const checkItemBoxCollision = useCallback((
    machine: RacingMachine,
    courseData: CourseData
  ): string | null => {
    const collisionRadius = 2;

    for (const itemBox of courseData.itemBoxes) {
      if (!itemBox.isActive) continue;

      const distance = machine.position.distanceTo(itemBox.position);
      if (distance < collisionRadius) {
        return itemBox.id;
      }
    }

    return null;
  }, []);

  return { checkMachineCollisions, checkItemBoxCollision };
};

// 順位計算
export const useRaceRanking = () => {
  const calculateRankings = useCallback((
    machines: RacingMachine[],
    courseData: CourseData
  ): RacingMachine[] => {
    return [...machines].sort((a, b) => {
      // ラップ数で比較
      if (a.currentLap !== b.currentLap) {
        return b.currentLap - a.currentLap;
      }

      // チェックポイントで比較
      if (a.currentCheckpoint !== b.currentCheckpoint) {
        return b.currentCheckpoint - a.currentCheckpoint;
      }

      // 次のチェックポイントまでの距離で比較
      const nextCheckpointA = courseData.checkpoints[a.currentCheckpoint % courseData.checkpoints.length];
      const nextCheckpointB = courseData.checkpoints[b.currentCheckpoint % courseData.checkpoints.length];

      const distA = a.position.distanceTo(nextCheckpointA.position);
      const distB = b.position.distanceTo(nextCheckpointB.position);

      return distA - distB;
    });
  }, []);

  return { calculateRankings };
};

export default {
  useRacingPhysics,
  useRacingAI,
  useRaceProgress,
  useRacingCollision,
  useRaceRanking,
};
