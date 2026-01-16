import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RacingMachineModel } from './components/RacingMachine';
import { RacingCourse, createMonkeyParkCircuit } from './components/RacingCourse';
import { RacingHUD, CupSelectScreen, RaceResultScreen, RacingTouchControls } from './components/RacingUI';
import { useRacingStore, createPlayerMachine, createAIMachine } from './useRacingStore';
import { useRacingPhysics, useRacingAI, useRaceProgress, useRacingCollision, useRaceRanking } from './useRacingPhysics';
import { useItemSystem } from './useItemSystem';
import { RacingMachine, CourseData, CupType, AIMachineType } from './types';

// カメラ追従コンポーネント
const CameraFollow: React.FC<{ target: RacingMachine | null }> = ({ target }) => {
  const { camera } = useThree();
  const smoothPosition = useRef(new THREE.Vector3(0, 10, 20));
  const smoothLookAt = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!target) return;

    // カメラ位置を計算（プレイヤーの後方上方）
    const offset = new THREE.Vector3(0, 8, -15);
    offset.applyEuler(target.rotation);
    const targetPosition = target.position.clone().add(offset);

    // スムーズに追従
    smoothPosition.current.lerp(targetPosition, delta * 5);
    smoothLookAt.current.lerp(target.position, delta * 5);

    camera.position.copy(smoothPosition.current);
    camera.lookAt(smoothLookAt.current);
  });

  return null;
};

// 配置アイテム表示コンポーネント
const PlacedItemsDisplay: React.FC = () => {
  const placedItems = useRacingStore(state => state.placedItems);
  const animationRef = useRef(0);

  useFrame(({ clock }) => {
    animationRef.current = clock.getElapsedTime();
  });

  return (
    <>
      {placedItems.map(item => {
        if (item.type === 'banana') {
          return (
            <group key={item.id} position={item.position}>
              <mesh rotation={[0, animationRef.current * 2, Math.PI / 6]}>
                <capsuleGeometry args={[0.15, 0.5, 4, 8]} />
                <meshStandardMaterial color="#FFD700" />
              </mesh>
            </group>
          );
        }
        if (item.type === 'oil') {
          return (
            <mesh key={item.id} position={item.position} rotation={item.rotation}>
              <circleGeometry args={[2, 16]} />
              <meshStandardMaterial color="#1a1a1a" transparent opacity={0.8} />
            </mesh>
          );
        }
        if (item.type === 'missile') {
          return (
            <group key={item.id} position={item.position} rotation={item.rotation}>
              <mesh>
                <coneGeometry args={[0.3, 1, 8]} />
                <meshStandardMaterial color="#FF0000" emissive="#FF4500" emissiveIntensity={0.5} />
              </mesh>
              {/* 炎エフェクト */}
              <mesh position={[0, -0.7, 0]}>
                <coneGeometry args={[0.2, 0.5, 8]} />
                <meshBasicMaterial color="#FF4500" transparent opacity={0.8} />
              </mesh>
            </group>
          );
        }
        return null;
      })}
    </>
  );
};

// レースシーンコンポーネント
const RaceScene: React.FC<{
  courseData: CourseData;
  onItemBoxCollected: (itemBoxId: string) => void;
}> = ({ courseData, onItemBoxCollected }) => {
  const playerMachine = useRacingStore(state => state.playerMachine);
  const aiMachines = useRacingStore(state => state.aiMachines);
  const gameState = useRacingStore(state => state.gameState);
  const input = useRacingStore(state => state.input);
  const setPlayerMachine = useRacingStore(state => state.setPlayerMachine);
  const setAIMachines = useRacingStore(state => state.setAIMachines);
  const setPlacedItems = useRacingStore(state => state.setPlacedItems);
  const setRaceTime = useRacingStore(state => state.setRaceTime);
  const placedItems = useRacingStore(state => state.placedItems);
  const raceTime = useRacingStore(state => state.raceTime);

  const { updateMachinePhysics } = useRacingPhysics();
  const { updateAI } = useRacingAI();
  const { updateProgress } = useRaceProgress();
  const { checkMachineCollisions, checkItemBoxCollision } = useRacingCollision();
  const { calculateRankings } = useRaceRanking();
  const { getRandomItem, checkPlacedItemCollision, updatePlacedItems } = useItemSystem();

  const allMachines = playerMachine ? [playerMachine, ...aiMachines] : aiMachines;

  useFrame((_, delta) => {
    if (gameState !== 'racing' || !playerMachine) return;

    // レースタイム更新
    setRaceTime(raceTime + delta * 1000);

    // プレイヤーの物理更新
    const playerPhysicsUpdate = updateMachinePhysics(playerMachine, input, courseData, delta);
    const playerProgressUpdate = updateProgress(playerMachine, courseData);
    
    // アイテムボックス衝突チェック
    const itemBoxId = checkItemBoxCollision(playerMachine, courseData);
    if (itemBoxId && !playerMachine.currentItem) {
      onItemBoxCollected(itemBoxId);
      const rankings = calculateRankings(allMachines, courseData);
      const position = rankings.findIndex(m => m.id === playerMachine.id) + 1;
      playerPhysicsUpdate.currentItem = getRandomItem(position, allMachines.length);
    }

    // 配置アイテム衝突チェック
    const { hitItem, effects } = checkPlacedItemCollision(playerMachine, placedItems);
    if (hitItem) {
      setPlacedItems(placedItems.filter(item => item.id !== hitItem.id));
      Object.assign(playerPhysicsUpdate, effects);
    }

    // マシン同士の衝突
    const { collidedWith, pushDirection } = checkMachineCollisions(playerMachine, allMachines);
    if (collidedWith) {
      const newPos = playerMachine.position.clone().add(pushDirection.multiplyScalar(0.5));
      playerPhysicsUpdate.position = newPos;
      playerPhysicsUpdate.speed = playerMachine.speed * 0.8;
    }

    // プレイヤー更新
    setPlayerMachine({
      ...playerMachine,
      ...playerPhysicsUpdate,
      ...playerProgressUpdate,
    });

    // AI更新
    const updatedAIMachines = aiMachines.map(ai => {
      const aiInput = updateAI(ai, courseData, allMachines, delta);
      const aiPhysicsUpdate = updateMachinePhysics(ai, aiInput, courseData, delta);
      const aiProgressUpdate = updateProgress(ai, courseData);

      // AI アイテムボックス
      const aiItemBoxId = checkItemBoxCollision(ai, courseData);
      if (aiItemBoxId && !ai.currentItem) {
        onItemBoxCollected(aiItemBoxId);
        const rankings = calculateRankings(allMachines, courseData);
        const position = rankings.findIndex(m => m.id === ai.id) + 1;
        aiPhysicsUpdate.currentItem = getRandomItem(position, allMachines.length);
      }

      // AI 配置アイテム衝突
      const { hitItem: aiHitItem, effects: aiEffects } = checkPlacedItemCollision(ai, placedItems);
      if (aiHitItem) {
        setPlacedItems(placedItems.filter(item => item.id !== aiHitItem.id));
        Object.assign(aiPhysicsUpdate, aiEffects);
      }

      return {
        ...ai,
        ...aiPhysicsUpdate,
        ...aiProgressUpdate,
      };
    });

    setAIMachines(updatedAIMachines);

    // 配置アイテム更新
    const updatedPlacedItems = updatePlacedItems(placedItems, allMachines, delta);
    if (updatedPlacedItems.length !== placedItems.length) {
      setPlacedItems(updatedPlacedItems);
    }

    // 順位更新
    const rankings = calculateRankings([
      { ...playerMachine, ...playerPhysicsUpdate, ...playerProgressUpdate },
      ...updatedAIMachines
    ], courseData);
    
    rankings.forEach((machine, index) => {
      machine.currentPosition = index + 1;
    });

    const updatedPlayer = rankings.find(m => m.id === playerMachine.id);
    if (updatedPlayer) {
      setPlayerMachine({ ...updatedPlayer });
    }
    setAIMachines(rankings.filter(m => m.id !== playerMachine.id) as RacingMachine[]);
  });

  return (
    <>
      <RacingCourse courseData={courseData} />
      {playerMachine && (
        <RacingMachineModel machine={playerMachine} isPlayer={true} />
      )}
      {aiMachines.map(ai => (
        <RacingMachineModel key={ai.id} machine={ai} isPlayer={false} />
      ))}
      <PlacedItemsDisplay />
      <CameraFollow target={playerMachine} />
    </>
  );
};

// メインレースゲームコンポーネント
interface RacingGameProps {
  onBack: () => void;
}

export const RacingGame: React.FC<RacingGameProps> = ({ onBack }) => {
  const gameState = useRacingStore(state => state.gameState);
  const setGameState = useRacingStore(state => state.setGameState);
  const setCurrentCup = useRacingStore(state => state.setCurrentCup);
  const currentCourse = useRacingStore(state => state.currentCourse);
  const setCurrentCourse = useRacingStore(state => state.setCurrentCourse);
  const playerMachine = useRacingStore(state => state.playerMachine);
  const setPlayerMachine = useRacingStore(state => state.setPlayerMachine);
  const aiMachines = useRacingStore(state => state.aiMachines);
  const setAIMachines = useRacingStore(state => state.setAIMachines);
  const countdown = useRacingStore(state => state.countdown);
  const setCountdown = useRacingStore(state => state.setCountdown);
  const raceTime = useRacingStore(state => state.raceTime);
  const setRaceTime = useRacingStore(state => state.setRaceTime);
  const setInput = useRacingStore(state => state.setInput);
  const saveData = useRacingStore(state => state.saveData);
  const loadSaveData = useRacingStore(state => state.loadSaveData);
  const setPlacedItems = useRacingStore(state => state.setPlacedItems);

  const [courseData, setCourseData] = useState<CourseData | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // モバイル検出
  useEffect(() => {
    setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
  }, []);

  // セーブデータ読み込み
  useEffect(() => {
    loadSaveData();
  }, [loadSaveData]);

  // キーボード入力
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setInput({ accelerate: true });
          break;
        case 'ArrowDown':
        case 'KeyS':
          setInput({ brake: true });
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setInput({ left: true });
          break;
        case 'ArrowRight':
        case 'KeyD':
          setInput({ right: true });
          break;
        case 'Space':
          setInput({ drift: true });
          break;
        case 'KeyX':
          setInput({ useItem: true });
          break;
        case 'KeyZ':
          setInput({ transform: true });
          break;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'ArrowUp':
        case 'KeyW':
          setInput({ accelerate: false });
          break;
        case 'ArrowDown':
        case 'KeyS':
          setInput({ brake: false });
          break;
        case 'ArrowLeft':
        case 'KeyA':
          setInput({ left: false });
          break;
        case 'ArrowRight':
        case 'KeyD':
          setInput({ right: false });
          break;
        case 'Space':
          setInput({ drift: false });
          break;
        case 'KeyX':
          setInput({ useItem: false });
          break;
        case 'KeyZ':
          setInput({ transform: false });
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setInput]);

  // カップ選択
  const handleSelectCup = useCallback((cup: CupType) => {
    setCurrentCup(cup);
    setCurrentCourse(0);
    setGameState('course-select');
    startRace();
  }, [setCurrentCup, setCurrentCourse, setGameState]);

  // レース開始
  const startRace = useCallback(() => {
    // コースデータ生成（簡易版：最初のコースのみ）
    const course = createMonkeyParkCircuit();
    setCourseData(course);

    // プレイヤーマシン初期化
    const player = createPlayerMachine('heroMonkey');
    player.position.copy(course.startPosition);
    player.rotation.copy(course.startRotation);
    setPlayerMachine(player);

    // AIマシン初期化
    const aiTypes: AIMachineType[] = ['pipotronYellow', 'pipotronBlue', 'pipotronRed', 'pipotronBlack', 'devichMonkey'];
    const ais: RacingMachine[] = aiTypes.map((type, index) => {
      const ai = createAIMachine(type, index);
      const offsetX = ((index % 2) - 0.5) * 4;
      const offsetZ = -5 - Math.floor(index / 2) * 4;
      ai.position.set(
        course.startPosition.x + offsetX,
        0,
        course.startPosition.z + offsetZ
      );
      ai.rotation.copy(course.startRotation);
      return ai;
    });
    setAIMachines(ais);

    // 配置アイテムリセット
    setPlacedItems([]);

    // カウントダウン開始
    setGameState('countdown');
    setCountdown(3);
    setRaceTime(0);

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prev: number) => {
        if (prev <= 1) {
          clearInterval(countdownIntervalRef.current!);
          setGameState('racing');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [setPlayerMachine, setAIMachines, setGameState, setCountdown, setRaceTime, setPlacedItems]);

  // アイテムボックス収集
  const handleItemBoxCollected = useCallback((itemBoxId: string) => {
    if (!courseData) return;
    
    setCourseData({
      ...courseData,
      itemBoxes: courseData.itemBoxes.map(box =>
        box.id === itemBoxId ? { ...box, isActive: false } : box
      ),
    });

    // リスポーンタイマー
    setTimeout(() => {
      setCourseData(prev => prev ? {
        ...prev,
        itemBoxes: prev.itemBoxes.map(box =>
          box.id === itemBoxId ? { ...box, isActive: true } : box
        ),
      } : null);
    }, 10000);
  }, [courseData]);

  // レース完了チェック
  useEffect(() => {
    if (gameState === 'racing' && playerMachine && courseData) {
      if (playerMachine.currentLap >= courseData.laps) {
        setGameState('finished');
        setShowResult(true);
      }
    }
  }, [gameState, playerMachine, courseData, setGameState]);

  // タッチ入力ハンドラ
  const handleTouchInput = useCallback((touchInput: {
    accelerate: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    useItem: boolean;
    transform: boolean;
  }) => {
    setInput(touchInput);
  }, [setInput]);

  // リトライ
  const handleRetry = useCallback(() => {
    setShowResult(false);
    startRace();
  }, [startRace]);

  // 次のレースへ
  const handleNext = useCallback(() => {
    setShowResult(false);
    // 次のコースへ（簡易版：メニューに戻る）
    setGameState('menu');
  }, [setGameState]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {gameState === 'menu' && (
        <CupSelectScreen
          onSelectCup={handleSelectCup}
          unlockedCups={saveData.unlockedCups}
          onBack={onBack}
        />
      )}

      {(gameState === 'countdown' || gameState === 'racing' || gameState === 'finished') && courseData && (
        <>
          <Canvas shadows>
            <RaceScene
              courseData={courseData}
              onItemBoxCollected={handleItemBoxCollected}
            />
          </Canvas>

          {playerMachine && (
            <RacingHUD
              playerMachine={playerMachine}
              allMachines={[playerMachine, ...aiMachines]}
              courseData={courseData}
              raceTime={raceTime}
              countdown={countdown}
              gameState={gameState}
            />
          )}

          {isMobile && gameState === 'racing' && (
            <RacingTouchControls onInput={handleTouchInput} />
          )}

          {showResult && playerMachine && (
            <RaceResultScreen
              rankings={[playerMachine, ...aiMachines].sort((a, b) => a.currentPosition - b.currentPosition)}
              playerMachine={playerMachine}
              raceTime={raceTime}
              onNext={handleNext}
              onRetry={handleRetry}
              isLastRace={currentCourse >= 3}
            />
          )}
        </>
      )}
    </div>
  );
};

export default RacingGame;
