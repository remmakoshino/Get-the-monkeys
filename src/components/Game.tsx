import React, { useEffect, useMemo, Suspense, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Sky } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../hooks/useGameState';
import { useInput, useTouchInput } from '../hooks/useInput';
import { useCollision } from '../hooks/useCollision';
import Player from './Player';
import Monkey from './Monkey';
import Stage, { generateMonkeySpawns } from './Stage';
import Boss, { createBossData } from './Boss';
import HUD from './UI/HUD';
import { Menu, PauseMenu, Tutorial } from './UI/Menu';
import { Result, Notification, DamageFlash, LoadingScreen } from './UI/Result';
import CaptureEffect from './UI/CaptureEffect';
import BossBattleIntro from './UI/BossBattleIntro';
import { spawnMonkey, generatePatrolPoints } from '../utils/AI';

// ゲームシーン（3D部分）
const GameScene: React.FC = () => {
  const { monkeys, boss, currentStage, gameState } = useGameStore();
  
  // 衝突判定とゲームロジックを処理
  useCollision();

  if (gameState !== 'playing' && gameState !== 'paused') {
    return null;
  }

  return (
    <>
      {/* ライティング */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 50, 25]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-far={150}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight args={['#87CEEB', '#3d5c3d', 0.3]} />

      {/* 空 */}
      <Sky
        distance={450000}
        sunPosition={[100, 50, 100]}
        inclination={0.5}
        azimuth={0.25}
      />

      {/* フォグ */}
      <fog attach="fog" args={['#87CEEB', 30, 100]} />

      {/* ステージ */}
      <Stage stageId={currentStage} />

      {/* プレイヤー */}
      <Player />

      {/* 猿たち */}
      {monkeys.map((monkey) => (
        <Monkey key={monkey.id} data={monkey} />
      ))}

      {/* ボス */}
      {boss && <Boss stageId={currentStage} bossData={boss} />}
    </>
  );
};

// ゲーム初期化
const useGameInitialization = () => {
  const { 
    currentStage, 
    setMonkeys, 
    setBoss, 
    resetPlayer, 
    setGameTime,
    gameState 
  } = useGameStore();

  useEffect(() => {
    if (gameState === 'playing') {
      // プレイヤーをリセット
      resetPlayer();
      
      // ゲーム時間をリセット
      setGameTime(0);

      // 猿を生成
      const spawns = generateMonkeySpawns(currentStage);
      const newMonkeys = spawns.map((spawn) => {
        const patrolPoints = generatePatrolPoints(spawn.position, 4, 5);
        return spawnMonkey(spawn.type, spawn.position, patrolPoints);
      });
      setMonkeys(newMonkeys);

      // ボスを生成
      const bossPosition = new THREE.Vector3(0, 1, -30);
      const bossData = createBossData(currentStage, bossPosition);
      setBoss(bossData);
    }
  }, [currentStage, gameState, setMonkeys, setBoss, resetPlayer, setGameTime]);
};

// メインゲームコンポーネント
const Game: React.FC = () => {
  const { gameState, camera, player, boss, monkeys } = useGameStore();
  const [webglSupported, setWebglSupported] = React.useState(true);
  const [showCaptureEffect, setShowCaptureEffect] = React.useState(false);
  const [showBossIntro, setShowBossIntro] = React.useState(false);
  const previousCapturedCount = useRef(0);
  const bossIntroShown = useRef(false);
  
  // WebGLサポートチェック
  useEffect(() => {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      setWebglSupported(false);
      console.error('WebGL is not supported on this device');
    } else {
      console.log('WebGL is supported');
    }
  }, []);

  // 捕獲エフェクトの監視
  useEffect(() => {
    if (player.capturedMonkeys > previousCapturedCount.current) {
      setShowCaptureEffect(true);
      previousCapturedCount.current = player.capturedMonkeys;
    }
  }, [player.capturedMonkeys]);

  // ボス戦イントロの監視
  useEffect(() => {
    const remainingMonkeys = monkeys.filter(m => m.state !== 'captured');
    if (gameState === 'playing' && boss && remainingMonkeys.length === 0 && !bossIntroShown.current) {
      setShowBossIntro(true);
      bossIntroShown.current = true;
    }
  }, [boss, monkeys, gameState]);

  // ゲーム状態変更時にボスイントロフラグをリセット
  useEffect(() => {
    if (gameState === 'menu') {
      bossIntroShown.current = false;
    }
  }, [gameState]);
  
  // 入力処理
  useInput();
  useTouchInput();
  
  // ゲーム初期化
  useGameInitialization();

  // デバッグ用: ゲーム状態をログ出力
  useEffect(() => {
    console.log('Game state changed:', gameState);
  }, [gameState]);

  // カメラ位置の計算
  const cameraPosition = useMemo((): [number, number, number] => {
    return [camera.position.x, camera.position.y, camera.position.z];
  }, [camera.position]);

  const cameraLookAt = useMemo((): [number, number, number] => {
    return [player.position.x, player.position.y + 1, player.position.z];
  }, [player.position]);

  // WebGL非対応の場合
  if (!webglSupported) {
    return (
      <div style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        color: 'white',
        padding: '20px',
        textAlign: 'center'
      }}>
        <h2>⚠️ WebGLが利用できません</h2>
        <p>このゲームを遊ぶにはWebGLに対応したブラウザが必要です。</p>
      </div>
    );
  }

  return (
    <div className="game-container">
      {/* 3Dキャンバス */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <Canvas
            shadows
            camera={{
              position: cameraPosition,
              fov: 75,
              near: 0.1,
              far: 1000,
            }}
            onCreated={({ camera: cam, gl, size }) => {
              cam.lookAt(...cameraLookAt);
              // モバイル対応: WebGLの設定
              gl.setPixelRatio(Math.min(window.devicePixelRatio, 2));
              console.log('Canvas created', { 
                canvasWidth: gl.domElement.width, 
                canvasHeight: gl.domElement.height,
                sizeWidth: size.width,
                sizeHeight: size.height,
                devicePixelRatio: window.devicePixelRatio,
                windowSize: `${window.innerWidth}x${window.innerHeight}`,
                glInfo: gl.getContextAttributes()
              });
            }}
            style={{ 
              width: '100vw', 
              height: '100vh',
              position: 'absolute',
              top: 0,
              left: 0,
              display: 'block',
              background: '#1a1a2e',
              touchAction: 'none',
              zIndex: 10
            }}
            gl={{ 
              antialias: false,
              alpha: false,
              powerPreference: 'high-performance',
              preserveDrawingBuffer: true
            }}
          >
            <Suspense fallback={null}>
              <GameScene />
            </Suspense>
          </Canvas>
      )}

      {/* UI レイヤー */}
      {(gameState === 'playing' || gameState === 'paused') && <HUD />}
      
      {/* メニュー */}
      <Menu />
      <PauseMenu />
      <Tutorial />
      <Result />
      <Notification />
      <DamageFlash />
      <LoadingScreen />

      {/* 捕獲エフェクト */}
      <CaptureEffect 
        show={showCaptureEffect} 
        onComplete={() => setShowCaptureEffect(false)} 
      />

      {/* ボス戦イントロ */}
      <BossBattleIntro
        show={showBossIntro}
        bossName={boss?.name || 'BOSS'}
        onComplete={() => setShowBossIntro(false)}
      />

      {/* タッチコントロール（モバイル用） */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          <TouchJoystick />
          <TouchActionButtons />
        </>
      )}
    </div>
  );
};

// タッチジョイスティックコンポーネント
const TouchJoystick: React.FC = () => {
  const { updateInput } = useGameStore();
  const joystickRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = React.useState(false);
  const touchId = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchId.current = touch.identifier;
    setActive(true);
    updateJoystickPosition(touch.clientX, touch.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = Array.from(e.touches).find(t => t.identifier === touchId.current);
    if (touch) {
      updateJoystickPosition(touch.clientX, touch.clientY);
    }
  };

  const handleTouchEnd = () => {
    touchId.current = null;
    setActive(false);
    updateInput({ forward: false, backward: false, left: false, right: false });
    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  };

  const updateJoystickPosition = (touchX: number, touchY: number) => {
    if (!joystickRef.current || !knobRef.current) return;

    const rect = joystickRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const deltaX = touchX - centerX;
    const deltaY = touchY - centerY;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    const maxDistance = rect.width / 2 - 30;

    const clampedDistance = Math.min(distance, maxDistance);
    const angle = Math.atan2(deltaY, deltaX);

    const knobX = Math.cos(angle) * clampedDistance;
    const knobY = Math.sin(angle) * clampedDistance;

    knobRef.current.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

    // 入力状態を更新
    const threshold = maxDistance * 0.3;
    const normalizedX = deltaX / maxDistance;
    const normalizedY = deltaY / maxDistance;

    updateInput({
      forward: normalizedY < -threshold / maxDistance,
      backward: normalizedY > threshold / maxDistance,
      left: normalizedX < -threshold / maxDistance,
      right: normalizedX > threshold / maxDistance,
    });
  };

  return (
    <div className="touch-controls">
      <div 
        ref={joystickRef}
        className="virtual-joystick"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ opacity: active ? 1 : 0.7 }}
      >
        <div ref={knobRef} className="joystick-knob" />
      </div>
    </div>
  );
};

// タッチアクションボタンコンポーネント
const TouchActionButtons: React.FC = () => {
  const { updateInput, updatePlayer } = useGameStore();

  const handleAttack = () => {
    updateInput({ attack: true });
    updatePlayer({ isAttacking: true });
    console.log('Attack button pressed');
    setTimeout(() => {
      updateInput({ attack: false });
      updatePlayer({ isAttacking: false });
    }, 100);
  };

  const handleJump = () => {
    updateInput({ jump: true });
    console.log('Jump button pressed');
    setTimeout(() => {
      updateInput({ jump: false });
    }, 100);
  };

  return (
    <div className="action-buttons">
      <button 
        className="action-btn jump" 
        onTouchStart={(e) => {
          e.preventDefault();
          handleJump();
        }}
      >
        ⬆️
      </button>
      <button 
        className="action-btn"
        onTouchStart={(e) => {
          e.preventDefault();
          handleAttack();
        }}
      >
        🎯
      </button>
    </div>
  );
};

export default Game;
