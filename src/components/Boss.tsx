import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { BossData, StageId } from '../types';
import { useGameStore } from '../hooks/useGameState';
import { distanceBetween, generateUniqueId } from '../utils/constants';

interface BossProps {
  stageId: StageId;
  bossData: BossData;
}

// ボス設定
const BOSS_CONFIGS = {
  1: {
    name: 'ジャングルキング',
    color: '#DC143C',
    scale: 2,
    maxHealth: 30,
    attacks: ['banana_throw', 'ground_pound', 'vine_charge'],
  },
  2: {
    name: 'フロストリーダー',
    color: '#E0FFFF',
    scale: 1.8,
    maxHealth: 40,
    attacks: ['ice_spike', 'ice_wall', 'snowball_roll'],
  },
  3: {
    name: 'テンプルガーディアン',
    color: '#FFD700',
    scale: 2.2,
    maxHealth: 50,
    attacks: ['laser_beam', 'summon_minions', 'teleport'],
  },
  4: {
    name: 'サイバーエイプ',
    color: '#4682B4',
    scale: 2.5,
    maxHealth: 60,
    attacks: ['missile', 'electric_shock', 'hover_attack', 'shield'],
  },
  5: {
    name: 'メガスペクター',
    color: '#8B0000',
    scale: 3,
    maxHealth: 100,
    attacks: ['energy_ball', 'shockwave', 'meteor', 'fire_pillar', 'all_laser'],
  },
};

export const Boss: React.FC<BossProps> = ({ stageId, bossData }) => {
  const { player, addEffect } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const animationTimeRef = useRef(0);
  const attackCooldownRef = useRef(0);

  const config = BOSS_CONFIGS[stageId];

  // ボスの攻撃処理
  useFrame((_, delta) => {
    if (!groupRef.current || bossData.state === 'captured') return;

    animationTimeRef.current += delta;

    // 位置更新
    groupRef.current.position.copy(bossData.position);

    // プレイヤーの方を向く
    const direction = new THREE.Vector3()
      .subVectors(player.position, bossData.position)
      .normalize();
    const targetAngle = Math.atan2(direction.x, direction.z);
    groupRef.current.rotation.y = targetAngle;

    // 攻撃クールダウン
    attackCooldownRef.current = Math.max(0, attackCooldownRef.current - delta);

    // ボス行動AI
    if (bossData.state !== 'stunned' && attackCooldownRef.current <= 0) {
      const distance = distanceBetween(bossData.position, player.position);

      // フェーズに応じた攻撃
      const phase = bossData.bossPhase || 1;
      const attackInterval = 3 - (phase - 1) * 0.5;

      if (distance < 15) {
        // 攻撃範囲内 - 攻撃エフェクト
        addEffect({
          id: generateUniqueId(),
          type: 'explosion',
          position: bossData.position.clone(),
          duration: 0.5,
          elapsed: 0,
          color: config.color,
        });

        attackCooldownRef.current = attackInterval;
      }
    }

    // スタン時の揺れ
    if (bossData.state === 'stunned') {
      groupRef.current.rotation.z = Math.sin(animationTimeRef.current * 10) * 0.2;
    } else {
      groupRef.current.rotation.z = 0;
    }

    // アイドルアニメーション
    groupRef.current.position.y =
      bossData.position.y + Math.sin(animationTimeRef.current * 2) * 0.2;
  });

  // フェーズによる見た目の変化
  const phaseColor = useMemo(() => {
    const phase = bossData.bossPhase || 1;
    switch (phase) {
      case 1:
        return config.color;
      case 2:
        return '#FF6600';
      case 3:
        return '#FF0000';
      default:
        return config.color;
    }
  }, [bossData.bossPhase, config.color]);

  const scale = config.scale;

  if (bossData.state === 'captured') return null;

  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* 頭 */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16]} />
        <meshStandardMaterial color={phaseColor} />
      </mesh>

      {/* 顔 */}
      <mesh position={[0, 0.75, 0.2]}>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial color="#FFDAB9" />
      </mesh>

      {/* 目（赤く光る） */}
      <mesh position={[0.1, 0.82, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#FF0000"
          emissive="#FF0000"
          emissiveIntensity={1}
        />
      </mesh>
      <mesh position={[-0.1, 0.82, 0.3]}>
        <sphereGeometry args={[0.06, 8, 8]} />
        <meshStandardMaterial
          color="#FF0000"
          emissive="#FF0000"
          emissiveIntensity={1}
        />
      </mesh>

      {/* 巨大ヘルメット */}
      <mesh position={[0, 0.95, 0]} castShadow>
        <sphereGeometry args={[0.35, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#4A4A4A"
          metalness={0.9}
          roughness={0.1}
        />
      </mesh>

      {/* ヘルメットのクリスタル */}
      <mesh position={[0, 1.15, 0]}>
        <octahedronGeometry args={[0.15]} />
        <meshStandardMaterial
          color={phaseColor}
          emissive={phaseColor}
          emissiveIntensity={1}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 王冠 / 角 */}
      {stageId >= 3 && (
        <>
          <mesh position={[0.2, 1.1, 0]} rotation={[0, 0, 0.3]}>
            <coneGeometry args={[0.05, 0.3, 4]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
          <mesh position={[-0.2, 1.1, 0]} rotation={[0, 0, -0.3]}>
            <coneGeometry args={[0.05, 0.3, 4]} />
            <meshStandardMaterial color="#FFD700" metalness={0.8} />
          </mesh>
        </>
      )}

      {/* 体 */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial color={phaseColor} />
      </mesh>

      {/* 胸当て */}
      <mesh position={[0, 0.35, 0.15]}>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color="#4A4A4A"
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* 腕（太い） */}
      <group position={[0.45, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.35, 4, 8]} />
          <meshStandardMaterial color={phaseColor} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" />
        </mesh>
      </group>
      <group position={[-0.45, 0.4, 0]}>
        <mesh position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.12, 0.35, 4, 8]} />
          <meshStandardMaterial color={phaseColor} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" />
        </mesh>
      </group>

      {/* 脚 */}
      <group position={[0.15, -0.1, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
          <meshStandardMaterial color={phaseColor} />
        </mesh>
      </group>
      <group position={[-0.15, -0.1, 0]}>
        <mesh position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.2, 4, 8]} />
          <meshStandardMaterial color={phaseColor} />
        </mesh>
      </group>

      {/* オーラエフェクト */}
      {bossData.bossPhase && bossData.bossPhase >= 2 && (
        <mesh position={[0, 0.5, 0]}>
          <sphereGeometry args={[0.8, 16, 16]} />
          <meshBasicMaterial
            color={phaseColor}
            transparent
            opacity={0.2}
            side={THREE.BackSide}
          />
        </mesh>
      )}

      {/* スタン時のエフェクト */}
      {bossData.state === 'stunned' && (
        <group position={[0, 1.5, 0]}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 5) * Math.PI * 2 + animationTimeRef.current * 2) * 0.5,
                0,
                Math.sin((i / 5) * Math.PI * 2 + animationTimeRef.current * 2) * 0.5,
              ]}
            >
              <octahedronGeometry args={[0.1]} />
              <meshStandardMaterial
                color="#FFFF00"
                emissive="#FFFF00"
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
};

// ボスの初期データを作成
export const createBossData = (stageId: StageId, position: THREE.Vector3): BossData => {
  const config = BOSS_CONFIGS[stageId];

  return {
    id: `boss-${stageId}`,
    type: 'black',
    position: position.clone(),
    rotation: new THREE.Euler(0, 0, 0),
    velocity: new THREE.Vector3(),
    state: 'idle',
    health: config.maxHealth,
    maxHealth: config.maxHealth,
    stunTime: 0,
    alertLevel: 1,
    targetPosition: null,
    patrolPoints: [],
    currentPatrolIndex: 0,
    isBoss: true,
    bossPhase: 1,
    name: config.name,
    phase: 1,
    maxPhase: stageId === 5 ? 3 : 2,
    attackPattern: config.attacks,
    currentAttack: '',
    attackCooldown: 0,
    isInvulnerable: false,
    specialAbility: config.attacks[0],
  };
};

export default Boss;
