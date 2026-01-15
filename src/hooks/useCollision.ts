import { useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from './useGameState';
import { GAME_CONFIG, generateUniqueId } from '../utils/constants';
import {
  checkMonkeyInteraction,
  applyBoundary,
} from '../utils/physics';
import {
  updateAlertLevel,
  determineState,
  updateMonkeyMovement,
  AIContext,
} from '../utils/AI';

export const useCollision = () => {
  const {
    player,
    updatePlayer,
    monkeys,
    updateMonkey,
    camera,
    updateCamera,
    input,
    gameState,
    incrementGameTime,
    addEffect,
    setNotification,
    setResult,
    setGameState,
    currentStage,
    stages,
    updateStageInfo,
    gameTime,
  } = useGameStore();

  const obstaclesRef = useRef<THREE.Vector3[]>([]);

  // プレイヤーの物理更新
  const updatePlayerPhysics = useCallback(
    (deltaTime: number) => {
      if (gameState !== 'playing') return;

      let newVelocity = player.velocity.clone();
      let newPosition = player.position.clone();
      let isJumping = player.isJumping;
      let isDashing = player.isDashing;
      let dashCooldown = player.dashCooldown;
      let invincibleTime = Math.max(0, player.invincibleTime - deltaTime);

      // 重力
      newVelocity.y += GAME_CONFIG.PLAYER.GRAVITY * deltaTime;

      // 移動入力を処理
      const moveDir = new THREE.Vector3();
      if (input.forward) moveDir.z -= 1;
      if (input.backward) moveDir.z += 1;
      if (input.left) moveDir.x -= 1;
      if (input.right) moveDir.x += 1;

      if (moveDir.length() > 0) {
        moveDir.normalize();

        // カメラの向きに合わせて回転
        const rotationMatrix = new THREE.Matrix4().makeRotationY(camera.yaw);
        moveDir.applyMatrix4(rotationMatrix);

        const speed = isDashing ? GAME_CONFIG.PLAYER.DASH_SPEED : GAME_CONFIG.PLAYER.MOVE_SPEED;
        newVelocity.x = moveDir.x * speed;
        newVelocity.z = moveDir.z * speed;
      } else {
        // 減速
        newVelocity.x *= 0.8;
        newVelocity.z *= 0.8;
      }

      // ジャンプ
      if (input.jump && !isJumping) {
        newVelocity.y = GAME_CONFIG.PLAYER.JUMP_FORCE;
        isJumping = true;
      }

      // ダッシュ
      dashCooldown = Math.max(0, dashCooldown - deltaTime);
      if (input.dash && dashCooldown <= 0 && !isDashing) {
        isDashing = true;
        dashCooldown = GAME_CONFIG.PLAYER.DASH_COOLDOWN;
        setTimeout(() => {
          updatePlayer({ isDashing: false });
        }, GAME_CONFIG.PLAYER.DASH_DURATION * 1000);
      }

      // 位置を更新
      newPosition.add(newVelocity.clone().multiplyScalar(deltaTime));

      // 地面衝突
      if (newPosition.y <= 1) {
        newPosition.y = 1;
        newVelocity.y = 0;
        isJumping = false;
      }

      // 境界チェック
      newPosition = applyBoundary(newPosition, GAME_CONFIG.STAGE.BOUNDARY);

      // プレイヤーの回転を更新（移動方向に向く）
      let newRotation = player.rotation.clone();
      if (Math.abs(newVelocity.x) > 0.1 || Math.abs(newVelocity.z) > 0.1) {
        newRotation.y = Math.atan2(newVelocity.x, newVelocity.z);
      }

      updatePlayer({
        position: newPosition,
        velocity: newVelocity,
        rotation: newRotation,
        isJumping,
        isDashing,
        dashCooldown,
        invincibleTime,
      });
    },
    [player, input, camera.yaw, gameState, updatePlayer]
  );

  // カメラの更新
  const updateCameraFollow = useCallback(
    (deltaTime: number) => {
      const { yaw, pitch, distance } = camera;
      let newYaw = yaw - input.mouseDeltaX;
      let newPitch = pitch - input.mouseDeltaY;

      // ピッチの制限
      newPitch = Math.max(GAME_CONFIG.CAMERA.MIN_PITCH, Math.min(GAME_CONFIG.CAMERA.MAX_PITCH, newPitch));

      // カメラ位置を計算
      const cameraOffset = new THREE.Vector3(
        Math.sin(newYaw) * Math.cos(newPitch) * distance,
        Math.sin(newPitch) * distance + GAME_CONFIG.CAMERA.HEIGHT_OFFSET,
        Math.cos(newYaw) * Math.cos(newPitch) * distance
      );

      const targetPosition = player.position.clone().add(cameraOffset);
      const newCameraPosition = camera.position.clone().lerp(
        targetPosition,
        GAME_CONFIG.CAMERA.LERP_SPEED * deltaTime
      );

      updateCamera({
        position: newCameraPosition,
        target: player.position.clone(),
        yaw: newYaw,
        pitch: newPitch,
      });
    },
    [camera, input.mouseDeltaX, input.mouseDeltaY, player.position, updateCamera]
  );

  // 猿AIの更新
  const updateMonkeysAI = useCallback(
    (deltaTime: number) => {
      if (gameState !== 'playing') return;

      monkeys.forEach((monkey) => {
        if (monkey.state === 'captured') return;

        // スタン時間を減らす
        let stunTime = Math.max(0, monkey.stunTime - deltaTime);

        // AIコンテキストを作成
        const context: AIContext = {
          monkey,
          player,
          deltaTime,
          obstacles: obstaclesRef.current,
          otherMonkeys: monkeys.filter((m) => m.id !== monkey.id),
        };

        // 警戒レベルを更新
        const alertLevel = updateAlertLevel(context);

        // 状態を決定
        const newState = stunTime > 0 ? 'stunned' : determineState({ ...context, monkey: { ...monkey, alertLevel } });

        // 移動を更新
        const { position, velocity, rotation } = updateMonkeyMovement({
          ...context,
          monkey: { ...monkey, state: newState, alertLevel },
        });

        updateMonkey(monkey.id, {
          position,
          velocity,
          rotation,
          state: newState,
          stunTime,
          alertLevel,
        });
      });
    },
    [gameState, monkeys, player, updateMonkey]
  );

  // 猿との相互作用チェック
  const checkInteractions = useCallback(() => {
    if (gameState !== 'playing' || !player.isAttacking) return;

    const { capturedId, hitIds } = checkMonkeyInteraction(
      player,
      monkeys,
      player.currentTool,
      player.isAttacking
    );

    // 捕獲処理
    if (capturedId) {
      const monkey = monkeys.find((m) => m.id === capturedId);
      if (monkey) {
        updateMonkey(capturedId, { state: 'captured' });

        // エフェクトを追加
        addEffect({
          id: generateUniqueId(),
          type: 'capture',
          position: monkey.position.clone(),
          duration: 1,
          elapsed: 0,
          color: '#00FF00',
        });

        // 捕獲数を更新
        const newCapturedCount = player.capturedMonkeys + 1;
        updatePlayer({ capturedMonkeys: newCapturedCount });
        setNotification(`猿を捕獲！ (${newCapturedCount}/${monkeys.length})`);

        // 全捕獲チェック
        setTimeout(() => {
          const remainingMonkeys = useGameStore.getState().monkeys.filter(
            (m) => m.state !== 'captured'
          );
          if (remainingMonkeys.length === 0) {
            // ステージクリア
            handleStageClear();
          }
        }, 100);
      }
    }

    // 攻撃ヒット処理
    hitIds.forEach((id) => {
      const monkey = monkeys.find((m) => m.id === id);
      if (monkey && monkey.state !== 'stunned') {
        const newHealth = monkey.health - GAME_CONFIG.PLAYER.ATTACK_DAMAGE;
        
        if (newHealth <= 0) {
          // 気絶
          updateMonkey(id, {
            health: 0,
            state: 'stunned',
            stunTime: GAME_CONFIG.MONKEY.STUN_DURATION,
          });
        } else {
          updateMonkey(id, { health: newHealth });
        }

        // ヒットエフェクト
        addEffect({
          id: generateUniqueId(),
          type: 'hit',
          position: monkey.position.clone(),
          duration: 0.3,
          elapsed: 0,
          color: '#FF4444',
        });
      }
    });
  }, [
    gameState,
    player,
    monkeys,
    updateMonkey,
    updatePlayer,
    addEffect,
    setNotification,
  ]);

  // ステージクリア処理
  const handleStageClear = useCallback(() => {
    const damageTaken = GAME_CONFIG.PLAYER.MAX_HEALTH - player.health;
    const time = gameTime;

    // ランク計算
    let rank: 'S' | 'A' | 'B' | 'C' = 'C';
    if (time <= 180 && damageTaken === 0) rank = 'S';
    else if (time <= 300 && damageTaken <= 30) rank = 'A';
    else if (time <= 600) rank = 'B';

    // 結果を設定
    setResult({
      stageId: currentStage,
      cleared: true,
      capturedCount: player.capturedMonkeys,
      totalMonkeys: monkeys.length,
      clearTime: time,
      damageTaken,
      rank,
    });

    // ステージ情報を更新
    const currentStageInfo = stages.find((s) => s.id === currentStage);
    updateStageInfo(currentStage, {
      cleared: true,
      bestTime: currentStageInfo?.bestTime
        ? Math.min(currentStageInfo.bestTime, time)
        : time,
      bestRank:
        !currentStageInfo?.bestRank ||
        ['S', 'A', 'B', 'C'].indexOf(rank) <
          ['S', 'A', 'B', 'C'].indexOf(currentStageInfo.bestRank)
          ? rank
          : currentStageInfo.bestRank,
    });

    // 次のステージをアンロック
    if (currentStage < 5) {
      updateStageInfo((currentStage + 1) as 1 | 2 | 3 | 4 | 5, { unlocked: true });
    }

    setGameState('result');
  }, [
    player,
    gameTime,
    currentStage,
    stages,
    monkeys.length,
    setResult,
    updateStageInfo,
    setGameState,
  ]);

  // フレームごとの更新
  useFrame((_, delta) => {
    if (gameState !== 'playing') return;

    const clampedDelta = Math.min(delta, 0.1); // 最大デルタを制限

    // ゲーム時間を更新
    incrementGameTime(clampedDelta);

    // 各システムを更新
    updatePlayerPhysics(clampedDelta);
    updateCameraFollow(clampedDelta);
    updateMonkeysAI(clampedDelta);
    checkInteractions();
  });

  return {
    obstaclesRef,
  };
};
