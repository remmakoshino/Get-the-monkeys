import { useEffect, useCallback, useRef } from 'react';
import { useGameStore } from './useGameState';
import { KEY_BINDINGS, GAME_CONFIG } from '../utils/constants';
import { ToolType } from '../types';

export const useInput = () => {
  const { input, updateInput, updatePlayer, gameState } = useGameStore();
  const isPointerLocked = useRef(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (gameState !== 'playing') {
        if (KEY_BINDINGS.PAUSE.includes(e.key)) {
          if (gameState === 'paused') {
            useGameStore.getState().setGameState('playing');
          }
        }
        return;
      }

      const updates: Partial<typeof input> = {};

      if (KEY_BINDINGS.FORWARD.includes(e.key)) updates.forward = true;
      if (KEY_BINDINGS.BACKWARD.includes(e.key)) updates.backward = true;
      if (KEY_BINDINGS.LEFT.includes(e.key)) updates.left = true;
      if (KEY_BINDINGS.RIGHT.includes(e.key)) updates.right = true;
      if (KEY_BINDINGS.JUMP.includes(e.key)) updates.jump = true;
      if (KEY_BINDINGS.DASH.includes(e.key)) updates.dash = true;
      if (KEY_BINDINGS.PAUSE.includes(e.key)) {
        useGameStore.getState().setGameState('paused');
      }

      // ツール切り替え
      if (KEY_BINDINGS.TOOL_1.includes(e.key)) {
        updatePlayer({ currentTool: 'net' as ToolType });
      }
      if (KEY_BINDINGS.TOOL_2.includes(e.key)) {
        updatePlayer({ currentTool: 'rod' as ToolType });
      }
      if (KEY_BINDINGS.TOOL_3.includes(e.key)) {
        updatePlayer({ currentTool: 'booster' as ToolType });
      }
      if (KEY_BINDINGS.TOOL_4.includes(e.key)) {
        updatePlayer({ currentTool: 'hover' as ToolType });
      }
      if (KEY_BINDINGS.TOOL_5.includes(e.key)) {
        updatePlayer({ currentTool: 'radar' as ToolType });
      }

      if (Object.keys(updates).length > 0) {
        updateInput(updates);
      }
    },
    [gameState, updateInput, updatePlayer]
  );

  const handleKeyUp = useCallback(
    (e: KeyboardEvent) => {
      const updates: Partial<typeof input> = {};

      if (KEY_BINDINGS.FORWARD.includes(e.key)) updates.forward = false;
      if (KEY_BINDINGS.BACKWARD.includes(e.key)) updates.backward = false;
      if (KEY_BINDINGS.LEFT.includes(e.key)) updates.left = false;
      if (KEY_BINDINGS.RIGHT.includes(e.key)) updates.right = false;
      if (KEY_BINDINGS.JUMP.includes(e.key)) updates.jump = false;
      if (KEY_BINDINGS.DASH.includes(e.key)) updates.dash = false;

      if (Object.keys(updates).length > 0) {
        updateInput(updates);
      }
    },
    [updateInput]
  );

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isPointerLocked.current) return;

      const sensitivity = GAME_CONFIG.CAMERA.MOUSE_SENSITIVITY;
      updateInput({
        mouseDeltaX: e.movementX * sensitivity,
        mouseDeltaY: e.movementY * sensitivity,
      });
    },
    [updateInput]
  );

  const handleMouseDown = useCallback(
    (e: MouseEvent) => {
      if (gameState !== 'playing') return;

      if (e.button === 0) {
        // 左クリック: 攻撃/捕獲
        updateInput({ attack: true });
        updatePlayer({ isAttacking: true });
      }
    },
    [gameState, updateInput, updatePlayer]
  );

  const handleMouseUp = useCallback(
    (e: MouseEvent) => {
      if (e.button === 0) {
        updateInput({ attack: false });
        updatePlayer({ isAttacking: false });
      }
    },
    [updateInput, updatePlayer]
  );

  const handlePointerLockChange = useCallback(() => {
    isPointerLocked.current = document.pointerLockElement !== null;
    updateInput({ isPointerLocked: isPointerLocked.current });
  }, [updateInput]);

  const requestPointerLock = useCallback(() => {
    // モバイル対応: ポインターロックが利用できない場合はスキップ
    const canvas = document.querySelector('canvas');
    if (canvas && !isPointerLocked.current && 'requestPointerLock' in canvas) {
      try {
        canvas.requestPointerLock();
        console.log('Pointer lock requested');
      } catch (error) {
        console.warn('Pointer lock not supported:', error);
      }
    }
  }, []);

  const exitPointerLock = useCallback(() => {
    if (isPointerLocked.current) {
      document.exitPointerLock();
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('pointerlockchange', handlePointerLockChange);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
    };
  }, [
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handlePointerLockChange,
  ]);

  // ゲーム状態が変わったらポインターロックを管理（モバイルでは任意）
  useEffect(() => {
    if (gameState === 'playing') {
      // モバイルでポインターロックが使えなくてもゲームは開始できる
      setTimeout(() => {
        requestPointerLock();
      }, 100);
    } else {
      exitPointerLock();
    }
  }, [gameState, requestPointerLock, exitPointerLock]);

  // 毎フレームでデルタをリセット
  useEffect(() => {
    const resetMouseDelta = () => {
      updateInput({ mouseDeltaX: 0, mouseDeltaY: 0 });
    };

    const animationId = requestAnimationFrame(resetMouseDelta);
    return () => cancelAnimationFrame(animationId);
  }, [input.mouseDeltaX, input.mouseDeltaY, updateInput]);

  return {
    input,
    requestPointerLock,
    exitPointerLock,
    isPointerLocked: isPointerLocked.current,
  };
};

// タッチ操作用フック
export const useTouchInput = () => {
  const { updateInput, updatePlayer, gameState } = useGameStore();
  const joystickRef = useRef<{ startX: number; startY: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: TouchEvent) => {
      if (gameState !== 'playing') return;

      const touch = e.touches[0];
      const screenWidth = window.innerWidth;

      // 画面左半分はジョイスティック
      if (touch.clientX < screenWidth / 2) {
        joystickRef.current = { startX: touch.clientX, startY: touch.clientY };
      } else {
        // 画面右半分はアクション
        updateInput({ attack: true });
        updatePlayer({ isAttacking: true });
      }
    },
    [gameState, updateInput, updatePlayer]
  );

  const handleTouchMove = useCallback(
    (e: TouchEvent) => {
      if (!joystickRef.current) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - joystickRef.current.startX;
      const deltaY = touch.clientY - joystickRef.current.startY;
      const deadzone = 20;

      const updates: Partial<ReturnType<typeof useGameStore.getState>['input']> = {
        forward: false,
        backward: false,
        left: false,
        right: false,
      };

      if (Math.abs(deltaY) > deadzone) {
        if (deltaY < -deadzone) updates.forward = true;
        if (deltaY > deadzone) updates.backward = true;
      }

      if (Math.abs(deltaX) > deadzone) {
        if (deltaX < -deadzone) updates.left = true;
        if (deltaX > deadzone) updates.right = true;
      }

      updateInput(updates);
    },
    [updateInput]
  );

  const handleTouchEnd = useCallback(() => {
    joystickRef.current = null;
    updateInput({
      forward: false,
      backward: false,
      left: false,
      right: false,
      attack: false,
    });
    updatePlayer({ isAttacking: false });
  }, [updateInput, updatePlayer]);

  useEffect(() => {
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd]);
};
