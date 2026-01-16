import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { CourseData, Checkpoint, ItemBox as ItemBoxType } from '../types';

interface RacingCourseProps {
  courseData: CourseData;
  onItemBoxCollected?: (itemBox: ItemBoxType) => void;
}

// コースの道路セグメント
const RoadSegment: React.FC<{
  start: THREE.Vector3;
  end: THREE.Vector3;
  width: number;
  color?: string;
}> = ({ start, end, width, color = '#505050' }) => {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const center = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  const angle = Math.atan2(direction.x, direction.z);

  return (
    <group position={center} rotation={[0, angle, 0]}>
      {/* 道路本体 */}
      <mesh receiveShadow position={[0, 0.01, 0]}>
        <boxGeometry args={[width, 0.1, length]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* 白線（左） */}
      <mesh position={[(width / 2) - 0.1, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.1, length]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* 白線（右） */}
      <mesh position={[-(width / 2) + 0.1, 0.02, 0]}>
        <boxGeometry args={[0.2, 0.1, length]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    </group>
  );
};

// チェックポイント表示
const CheckpointMarker: React.FC<{ checkpoint: Checkpoint; isFinishLine: boolean }> = ({
  checkpoint,
  isFinishLine,
}) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (groupRef.current && !isFinishLine) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.5;
    }
  });

  return (
    <group ref={groupRef} position={checkpoint.position}>
      {isFinishLine ? (
        // フィニッシュライン
        <>
          {/* 左の柱 */}
          <mesh position={[-8, 4, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* 右の柱 */}
          <mesh position={[8, 4, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          {/* 上のバー */}
          <mesh position={[0, 8, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 16, 8]} />
            <meshStandardMaterial color="#FF0000" />
          </mesh>
          {/* チェッカーフラッグ模様 */}
          <mesh position={[0, 7, 0.1]}>
            <planeGeometry args={[14, 1.5]} />
            <meshBasicMaterial color="#000000" />
          </mesh>
          {Array.from({ length: 14 }).map((_, i) =>
            Array.from({ length: 3 }).map((_, j) =>
              (i + j) % 2 === 0 ? (
                <mesh key={`${i}-${j}`} position={[-6.5 + i, 6.5 + j * 0.5, 0.15]}>
                  <planeGeometry args={[1, 0.5]} />
                  <meshBasicMaterial color="#FFFFFF" />
                </mesh>
              ) : null
            )
          )}
        </>
      ) : (
        // 通常のチェックポイント（透明なゲート）
        <mesh>
          <torusGeometry args={[4, 0.2, 8, 24]} />
          <meshStandardMaterial color="#00FF00" transparent opacity={0.3} />
        </mesh>
      )}
    </group>
  );
};

// アイテムボックス
const ItemBox: React.FC<{ itemBox: ItemBoxType; onCollected?: () => void }> = ({
  itemBox,
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current && itemBox.isActive) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 2;
      meshRef.current.rotation.x = Math.sin(clock.getElapsedTime() * 3) * 0.2;
      meshRef.current.position.y = itemBox.position.y + Math.sin(clock.getElapsedTime() * 2) * 0.3;
    }
  });

  if (!itemBox.isActive) return null;

  return (
    <mesh ref={meshRef} position={itemBox.position} castShadow>
      <boxGeometry args={[1.5, 1.5, 1.5]} />
      <meshStandardMaterial
        color="#FFD700"
        emissive="#FF8C00"
        emissiveIntensity={0.3}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
};

// 最初のコース「モンキーパーク・サーキット」のデータ
export const createMonkeyParkCircuit = (): CourseData => {
  const waypoints: THREE.Vector3[] = [];
  const checkpoints: Checkpoint[] = [];

  // オーバル型のコースを作成
  const segments = 40;
  const radiusX = 80;
  const radiusZ = 50;

  for (let i = 0; i < segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = Math.cos(angle) * radiusX;
    const z = Math.sin(angle) * radiusZ;
    waypoints.push(new THREE.Vector3(x, 0, z));

    // チェックポイントを4つ配置
    if (i % 10 === 0) {
      checkpoints.push({
        id: `checkpoint-${checkpoints.length}`,
        position: new THREE.Vector3(x, 0, z),
        width: 16,
        rotation: new THREE.Euler(0, -angle + Math.PI / 2, 0),
        order: checkpoints.length,
      });
    }
  }

  // アイテムボックスを配置
  const itemBoxes: ItemBoxType[] = [];
  for (let i = 0; i < 20; i++) {
    const angle = (i / 20) * Math.PI * 2;
    const offsetX = (i % 3 - 1) * 3;
    const x = Math.cos(angle) * (radiusX + offsetX);
    const z = Math.sin(angle) * (radiusZ + offsetX * (radiusZ / radiusX));
    itemBoxes.push({
      id: `item-${i}`,
      position: new THREE.Vector3(x, 1.5, z),
      isActive: true,
      respawnTime: 10,
    });
  }

  return {
    id: 'monkey-park-circuit',
    name: 'モンキーパーク・サーキット',
    cup: 'monkey',
    laps: 3,
    waypoints,
    checkpoints,
    itemBoxes,
    obstacles: [],
    startPosition: new THREE.Vector3(0, 0, radiusZ + 5),
    startRotation: new THREE.Euler(0, 0, 0),
    environment: 'park',
  };
};

// コースコンポーネント
export const RacingCourse: React.FC<RacingCourseProps> = ({ courseData, onItemBoxCollected }) => {
  const roadSegments = useMemo(() => {
    const segments: { start: THREE.Vector3; end: THREE.Vector3 }[] = [];
    for (let i = 0; i < courseData.waypoints.length; i++) {
      const start = courseData.waypoints[i];
      const end = courseData.waypoints[(i + 1) % courseData.waypoints.length];
      segments.push({ start, end });
    }
    return segments;
  }, [courseData.waypoints]);

  return (
    <group>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>

      {/* 道路セグメント */}
      {roadSegments.map((segment, index) => (
        <RoadSegment
          key={index}
          start={segment.start}
          end={segment.end}
          width={14}
          color={index === 0 ? '#707070' : '#505050'}
        />
      ))}

      {/* チェックポイント */}
      {courseData.checkpoints.map((checkpoint, index) => (
        <CheckpointMarker
          key={checkpoint.id}
          checkpoint={checkpoint}
          isFinishLine={index === 0}
        />
      ))}

      {/* アイテムボックス */}
      {courseData.itemBoxes.map((itemBox) => (
        <ItemBox
          key={itemBox.id}
          itemBox={itemBox}
          onCollected={() => onItemBoxCollected?.(itemBox)}
        />
      ))}

      {/* 環境装飾：木 */}
      {Array.from({ length: 50 }).map((_, i) => {
        const angle = (i / 50) * Math.PI * 2;
        const distance = 100 + Math.random() * 30;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        const height = 5 + Math.random() * 5;
        return (
          <group key={`tree-${i}`} position={[x, 0, z]}>
            {/* 幹 */}
            <mesh position={[0, height / 4, 0]} castShadow>
              <cylinderGeometry args={[0.3, 0.5, height / 2, 8]} />
              <meshStandardMaterial color="#8B4513" />
            </mesh>
            {/* 葉 */}
            <mesh position={[0, height / 2 + 2, 0]} castShadow>
              <coneGeometry args={[3, 6, 8]} />
              <meshStandardMaterial color="#228B22" />
            </mesh>
          </group>
        );
      })}

      {/* バナナの木（装飾） */}
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2 + 0.1;
        const distance = 95 + Math.random() * 10;
        const x = Math.cos(angle) * distance;
        const z = Math.sin(angle) * distance;
        return (
          <group key={`banana-tree-${i}`} position={[x, 0, z]}>
            <mesh position={[0, 3, 0]} castShadow>
              <cylinderGeometry args={[0.4, 0.6, 6, 8]} />
              <meshStandardMaterial color="#8B7355" />
            </mesh>
            {/* バナナの葉 */}
            {Array.from({ length: 6 }).map((_, j) => (
              <mesh
                key={j}
                position={[
                  Math.cos((j / 6) * Math.PI * 2) * 2,
                  5.5,
                  Math.sin((j / 6) * Math.PI * 2) * 2,
                ]}
                rotation={[Math.PI / 4, (j / 6) * Math.PI * 2, 0]}
              >
                <boxGeometry args={[0.5, 0.1, 3]} />
                <meshStandardMaterial color="#32CD32" />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* 観客スタンド */}
      <group position={[0, 0, -70]}>
        <mesh position={[0, 3, 0]} castShadow receiveShadow>
          <boxGeometry args={[40, 6, 10]} />
          <meshStandardMaterial color="#4169E1" />
        </mesh>
        {/* 観客（簡易版） */}
        {Array.from({ length: 30 }).map((_, i) => (
          <mesh
            key={`spectator-${i}`}
            position={[-18 + i * 1.2, 6.5, -3 + (i % 3) * 1]}
          >
            <sphereGeometry args={[0.3, 8, 8]} />
            <meshStandardMaterial color={['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF'][i % 5]} />
          </mesh>
        ))}
      </group>

      {/* 空の雲 */}
      {Array.from({ length: 15 }).map((_, i) => {
        const x = (Math.random() - 0.5) * 400;
        const y = 30 + Math.random() * 30;
        const z = (Math.random() - 0.5) * 400;
        return (
          <group key={`cloud-${i}`} position={[x, y, z]}>
            <mesh>
              <sphereGeometry args={[5 + Math.random() * 3, 8, 8]} />
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
            </mesh>
            <mesh position={[4, -1, 0]}>
              <sphereGeometry args={[3 + Math.random() * 2, 8, 8]} />
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
            </mesh>
            <mesh position={[-4, -1, 0]}>
              <sphereGeometry args={[3 + Math.random() * 2, 8, 8]} />
              <meshStandardMaterial color="#FFFFFF" transparent opacity={0.9} />
            </mesh>
          </group>
        );
      })}

      {/* 環境光 */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={500}
        shadow-camera-left={-200}
        shadow-camera-right={200}
        shadow-camera-top={200}
        shadow-camera-bottom={-200}
      />

      {/* 空の色 */}
      <color attach="background" args={['#87CEEB']} />
    </group>
  );
};

export default RacingCourse;
