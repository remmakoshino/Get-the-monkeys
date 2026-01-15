import React, { useEffect, useMemo, Suspense } from 'react';
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
  const { gameState, camera, player } = useGameStore();
  const [webglSupported, setWebglSupported] = React.useState(true);
  
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
      {/* デバッグ情報 */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        background: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '10px',
        fontSize: '12px',
        zIndex: 9999,
        pointerEvents: 'none'
      }}>
        <div>Game State: {gameState}</div>
        <div>WebGL: {webglSupported ? 'OK' : 'NG'}</div>
        <div>Screen: {window.innerWidth}x{window.innerHeight}</div>
        <div>Canvas Render: {(gameState === 'playing' || gameState === 'paused') ? 'YES' : 'NO'}</div>
      </div>

      {/* 3Dキャンバス */}
      {(gameState === 'playing' || gameState === 'paused') && (
        <>
          {/* テスト用の可視要素 */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'red',
            color: 'white',
            padding: '20px',
            zIndex: 1,
            pointerEvents: 'none'
          }}>
            Canvas Loading...
          </div>
          
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
        </>
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

      {/* タッチコントロール（モバイル用） */}
      <div className="touch-controls">
        <div className="virtual-joystick">
          <div className="joystick-knob" />
        </div>
      </div>
      <div className="action-buttons">
        <button className="action-btn">🎯</button>
        <button className="action-btn">⚡</button>
      </div>
    </div>
  );
};

export default Game;
