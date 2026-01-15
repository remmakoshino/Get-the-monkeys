import React, { useMemo } from 'react';
import * as THREE from 'three';
import { StageId, MonkeyType, Platform, Obstacle } from '../types';
import { COLORS, randomRange, generateUniqueId } from '../utils/constants';

interface StageProps {
  stageId: StageId;
}

// ステージ環境設定
const STAGE_ENVIRONMENTS = {
  1: {
    name: 'ジャングルエリア',
    groundColor: COLORS.STAGE.JUNGLE.GROUND,
    skyColor: COLORS.STAGE.JUNGLE.SKY,
    fogColor: COLORS.STAGE.JUNGLE.FOG,
    fogNear: 30,
    fogFar: 100,
  },
  2: {
    name: 'アイスマウンテン',
    groundColor: COLORS.STAGE.ICE.GROUND,
    skyColor: COLORS.STAGE.ICE.SKY,
    fogColor: COLORS.STAGE.ICE.FOG,
    fogNear: 20,
    fogFar: 80,
  },
  3: {
    name: '遺跡ダンジョン',
    groundColor: COLORS.STAGE.RUINS.GROUND,
    skyColor: COLORS.STAGE.RUINS.SKY,
    fogColor: COLORS.STAGE.RUINS.FOG,
    fogNear: 25,
    fogFar: 70,
  },
  4: {
    name: 'メカニカルシティ',
    groundColor: COLORS.STAGE.MECHANICAL.GROUND,
    skyColor: COLORS.STAGE.MECHANICAL.SKY,
    fogColor: COLORS.STAGE.MECHANICAL.FOG,
    fogNear: 20,
    fogFar: 60,
  },
  5: {
    name: 'ボルケーノベース',
    groundColor: COLORS.STAGE.VOLCANO.GROUND,
    skyColor: COLORS.STAGE.VOLCANO.SKY,
    fogColor: COLORS.STAGE.VOLCANO.FOG,
    fogNear: 15,
    fogFar: 50,
  },
};

// ステージ固有のプラットフォームを生成
const generatePlatforms = (stageId: StageId): Platform[] => {
  const platforms: Platform[] = [];

  switch (stageId) {
    case 1: // ジャングル
      // 木の切り株プラットフォーム
      for (let i = 0; i < 8; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-30, 30),
            randomRange(2, 6),
            randomRange(-30, 30)
          ),
          size: new THREE.Vector3(3, 0.5, 3),
          type: 'static',
          color: '#8B4513',
        });
      }
      // 葉っぱプラットフォーム
      for (let i = 0; i < 5; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-25, 25),
            randomRange(8, 12),
            randomRange(-25, 25)
          ),
          size: new THREE.Vector3(4, 0.3, 4),
          type: 'static',
          color: '#228B22',
        });
      }
      break;

    case 2: // アイス
      // 氷のプラットフォーム
      for (let i = 0; i < 10; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            randomRange(1, 8),
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(4, 0.5, 4),
          type: 'ice',
          color: '#B0E0E6',
        });
      }
      break;

    case 3: // 遺跡
      // 石のプラットフォーム
      for (let i = 0; i < 12; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-30, 30),
            randomRange(2, 10),
            randomRange(-30, 30)
          ),
          size: new THREE.Vector3(3, 1, 3),
          type: 'static',
          color: '#A0A0A0',
        });
      }
      break;

    case 4: // メカニカル
      // 動くプラットフォーム
      for (let i = 0; i < 6; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            randomRange(3, 10),
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(4, 0.5, 4),
          type: 'moving',
          moveRange: new THREE.Vector3(10, 0, 0),
          moveSpeed: 2,
          color: '#4682B4',
        });
      }
      // 静止プラットフォーム
      for (let i = 0; i < 8; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            randomRange(2, 12),
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(3, 0.5, 3),
          type: 'static',
          color: '#708090',
        });
      }
      break;

    case 5: // 火山
      // 岩のプラットフォーム
      for (let i = 0; i < 10; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-40, 40),
            randomRange(2, 12),
            randomRange(-40, 40)
          ),
          size: new THREE.Vector3(3, 1, 3),
          type: 'static',
          color: '#4A4A4A',
        });
      }
      // 崩れるプラットフォーム
      for (let i = 0; i < 5; i++) {
        platforms.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            randomRange(4, 8),
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(3, 0.5, 3),
          type: 'falling',
          color: '#8B0000',
        });
      }
      break;
  }

  return platforms;
};

// ステージ固有の障害物を生成
const generateObstacles = (stageId: StageId): Obstacle[] => {
  const obstacles: Obstacle[] = [];

  switch (stageId) {
    case 1: // ジャングル
      // 木
      for (let i = 0; i < 20; i++) {
        const x = randomRange(-40, 40);
        const z = randomRange(-40, 40);
        if (Math.abs(x) > 5 || Math.abs(z) > 5) {
          obstacles.push({
            id: generateUniqueId(),
            position: new THREE.Vector3(x, 4, z),
            size: new THREE.Vector3(1.5, 8, 1.5),
            type: 'tree',
            color: '#8B4513',
            isDestructible: false,
          });
        }
      }
      // 岩
      for (let i = 0; i < 10; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            1,
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(2, 2, 2),
          type: 'rock',
          color: '#696969',
          isDestructible: false,
        });
      }
      break;

    case 2: // アイス
      // 氷柱
      for (let i = 0; i < 15; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-40, 40),
            3,
            randomRange(-40, 40)
          ),
          size: new THREE.Vector3(1, 6, 1),
          type: 'pillar',
          color: '#E0FFFF',
          isDestructible: true,
        });
      }
      // 雪の塊
      for (let i = 0; i < 8; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            1.5,
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(3, 3, 3),
          type: 'rock',
          color: '#FFFAFA',
          isDestructible: false,
        });
      }
      break;

    case 3: // 遺跡
      // 柱
      for (let i = 0; i < 16; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            4,
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(1.5, 8, 1.5),
          type: 'pillar',
          color: '#D2B48C',
          isDestructible: false,
        });
      }
      // 石像
      for (let i = 0; i < 6; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-30, 30),
            2,
            randomRange(-30, 30)
          ),
          size: new THREE.Vector3(2, 4, 2),
          type: 'block',
          color: '#8B8378',
          isDestructible: false,
        });
      }
      break;

    case 4: // メカニカル
      // 機械ブロック
      for (let i = 0; i < 15; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-40, 40),
            2,
            randomRange(-40, 40)
          ),
          size: new THREE.Vector3(3, 4, 3),
          type: 'block',
          color: '#4A4A4A',
          isDestructible: false,
        });
      }
      // パイプ
      for (let i = 0; i < 10; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-35, 35),
            1,
            randomRange(-35, 35)
          ),
          size: new THREE.Vector3(1, 2, 8),
          type: 'block',
          color: '#696969',
          isDestructible: false,
        });
      }
      break;

    case 5: // 火山
      // 溶岩岩
      for (let i = 0; i < 12; i++) {
        obstacles.push({
          id: generateUniqueId(),
          position: new THREE.Vector3(
            randomRange(-40, 40),
            2,
            randomRange(-40, 40)
          ),
          size: new THREE.Vector3(3, 4, 3),
          type: 'rock',
          color: '#2F2F2F',
          isDestructible: false,
        });
      }
      break;
  }

  return obstacles;
};

// 猿のスポーン位置を生成
export const generateMonkeySpawns = (stageId: StageId): { position: THREE.Vector3; type: MonkeyType }[] => {
  const spawns: { position: THREE.Vector3; type: MonkeyType }[] = [];

  const stageConfig = {
    1: { yellow: 12, blue: 3, red: 0, green: 0, black: 0 },
    2: { yellow: 8, blue: 6, red: 4, green: 0, black: 0 },
    3: { yellow: 6, blue: 4, red: 4, green: 4, black: 2 },
    4: { yellow: 5, blue: 3, red: 8, green: 2, black: 7 },
    5: { yellow: 8, blue: 5, red: 6, green: 5, black: 6 },
  };

  const config = stageConfig[stageId];
  const types: MonkeyType[] = ['yellow', 'blue', 'red', 'green', 'black'];

  types.forEach((type) => {
    const count = config[type];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = randomRange(10, 40);
      spawns.push({
        position: new THREE.Vector3(
          Math.cos(angle) * distance,
          1,
          Math.sin(angle) * distance
        ),
        type,
      });
    }
  });

  return spawns;
};

// ステージコンポーネント
export const Stage: React.FC<StageProps> = ({ stageId }) => {
  const environment = STAGE_ENVIRONMENTS[stageId];
  const platforms = useMemo(() => generatePlatforms(stageId), [stageId]);
  const obstacles = useMemo(() => generateObstacles(stageId), [stageId]);

  return (
    <group>
      {/* 地面 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color={environment.groundColor} />
      </mesh>

      {/* 地面のグリッド模様 */}
      <gridHelper args={[100, 50, '#444444', '#333333']} position={[0, 0.01, 0]} />

      {/* 境界壁（透明） */}
      {[-50, 50].map((x, i) => (
        <mesh key={`wall-x-${i}`} position={[x, 10, 0]}>
          <boxGeometry args={[1, 20, 100]} />
          <meshStandardMaterial color="#FF0000" transparent opacity={0.1} />
        </mesh>
      ))}
      {[-50, 50].map((z, i) => (
        <mesh key={`wall-z-${i}`} position={[0, 10, z]}>
          <boxGeometry args={[100, 20, 1]} />
          <meshStandardMaterial color="#FF0000" transparent opacity={0.1} />
        </mesh>
      ))}

      {/* プラットフォーム */}
      {platforms.map((platform) => (
        <mesh
          key={platform.id}
          position={platform.position}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[platform.size.x, platform.size.y, platform.size.z]} />
          <meshStandardMaterial
            color={platform.color}
            transparent={platform.type === 'ice'}
            opacity={platform.type === 'ice' ? 0.8 : 1}
          />
        </mesh>
      ))}

      {/* 障害物 */}
      {obstacles.map((obstacle) => (
        <group key={obstacle.id} position={obstacle.position}>
          {obstacle.type === 'tree' ? (
            <>
              {/* 幹 */}
              <mesh position={[0, -2, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.5, 4, 8]} />
                <meshStandardMaterial color={obstacle.color} />
              </mesh>
              {/* 葉 */}
              <mesh position={[0, 1, 0]} castShadow>
                <coneGeometry args={[2, 4, 8]} />
                <meshStandardMaterial color="#228B22" />
              </mesh>
              <mesh position={[0, 2.5, 0]} castShadow>
                <coneGeometry args={[1.5, 3, 8]} />
                <meshStandardMaterial color="#2E8B57" />
              </mesh>
            </>
          ) : obstacle.type === 'pillar' ? (
            <mesh castShadow>
              <cylinderGeometry args={[obstacle.size.x / 2, obstacle.size.x / 2, obstacle.size.y, 8]} />
              <meshStandardMaterial color={obstacle.color} />
            </mesh>
          ) : obstacle.type === 'rock' ? (
            <mesh castShadow>
              <dodecahedronGeometry args={[obstacle.size.x / 2, 0]} />
              <meshStandardMaterial color={obstacle.color} flatShading />
            </mesh>
          ) : (
            <mesh castShadow>
              <boxGeometry args={[obstacle.size.x, obstacle.size.y, obstacle.size.z]} />
              <meshStandardMaterial color={obstacle.color} />
            </mesh>
          )}
        </group>
      ))}

      {/* ステージ固有のデコレーション */}
      {stageId === 1 && <JungleDecorations />}
      {stageId === 2 && <IceDecorations />}
      {stageId === 3 && <RuinsDecorations />}
      {stageId === 4 && <MechanicalDecorations />}
      {stageId === 5 && <VolcanoDecorations />}
    </group>
  );
};

// ジャングルデコレーション
const JungleDecorations: React.FC = () => (
  <group>
    {/* つる */}
    {Array.from({ length: 10 }).map((_, i) => (
      <mesh
        key={`vine-${i}`}
        position={[randomRange(-40, 40), 8, randomRange(-40, 40)]}
      >
        <cylinderGeometry args={[0.05, 0.05, 10, 8]} />
        <meshStandardMaterial color="#228B22" />
      </mesh>
    ))}
  </group>
);

// 氷デコレーション
const IceDecorations: React.FC = () => (
  <group>
    {/* 雪の結晶パーティクル（簡易） */}
    {Array.from({ length: 30 }).map((_, i) => (
      <mesh
        key={`snow-${i}`}
        position={[
          randomRange(-40, 40),
          randomRange(1, 15),
          randomRange(-40, 40),
        ]}
      >
        <octahedronGeometry args={[0.1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
    ))}
  </group>
);

// 遺跡デコレーション
const RuinsDecorations: React.FC = () => (
  <group>
    {/* 壊れた柱 */}
    {Array.from({ length: 5 }).map((_, i) => (
      <mesh
        key={`broken-${i}`}
        position={[randomRange(-35, 35), 0.5, randomRange(-35, 35)]}
        rotation={[randomRange(-0.3, 0.3), 0, randomRange(-0.3, 0.3)]}
      >
        <cylinderGeometry args={[0.8, 1, 1, 8]} />
        <meshStandardMaterial color="#D2B48C" />
      </mesh>
    ))}
  </group>
);

// メカニカルデコレーション
const MechanicalDecorations: React.FC = () => (
  <group>
    {/* 光る床パネル */}
    {Array.from({ length: 8 }).map((_, i) => (
      <mesh
        key={`panel-${i}`}
        position={[randomRange(-40, 40), 0.02, randomRange(-40, 40)]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[3, 3]} />
        <meshStandardMaterial
          color="#00BFFF"
          emissive="#00BFFF"
          emissiveIntensity={0.3}
        />
      </mesh>
    ))}
  </group>
);

// 火山デコレーション
const VolcanoDecorations: React.FC = () => (
  <group>
    {/* 溶岩の光 */}
    {Array.from({ length: 6 }).map((_, i) => (
      <pointLight
        key={`lava-light-${i}`}
        position={[randomRange(-30, 30), 0.5, randomRange(-30, 30)]}
        color="#FF4500"
        intensity={2}
        distance={10}
      />
    ))}
    {/* 溶岩プール */}
    {Array.from({ length: 4 }).map((_, i) => (
      <mesh
        key={`lava-${i}`}
        position={[randomRange(-35, 35), 0.1, randomRange(-35, 35)]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[3, 16]} />
        <meshStandardMaterial
          color="#FF4500"
          emissive="#FF4500"
          emissiveIntensity={0.5}
        />
      </mesh>
    ))}
  </group>
);

export default Stage;
