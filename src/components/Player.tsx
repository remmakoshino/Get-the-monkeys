import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGameStore } from '../hooks/useGameState';
import { COLORS } from '../utils/constants';

// プレイヤーキャラクターの3Dモデル
export const Player: React.FC = () => {
  const { player, gameState } = useGameStore();
  const groupRef = useRef<THREE.Group>(null);
  const armLeftRef = useRef<THREE.Mesh>(null);
  const armRightRef = useRef<THREE.Mesh>(null);
  const legLeftRef = useRef<THREE.Mesh>(null);
  const legRightRef = useRef<THREE.Mesh>(null);

  // アニメーション用の時間
  const animationTimeRef = useRef(0);

  // ツールの色
  const toolColors: Record<string, string> = {
    net: '#00FF00',
    rod: '#FFD700',
    booster: '#00BFFF',
    hover: '#9370DB',
    radar: '#FF6347',
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 位置と回転を更新
    groupRef.current.position.copy(player.position);
    groupRef.current.rotation.copy(player.rotation);

    // 歩行アニメーション
    const isMoving =
      Math.abs(player.velocity.x) > 0.1 || Math.abs(player.velocity.z) > 0.1;

    if (isMoving && gameState === 'playing') {
      animationTimeRef.current += delta * 10;
      const swing = Math.sin(animationTimeRef.current) * 0.5;

      // 腕を振る
      if (armLeftRef.current) {
        armLeftRef.current.rotation.x = swing;
      }
      if (armRightRef.current) {
        armRightRef.current.rotation.x = -swing;
      }

      // 脚を振る
      if (legLeftRef.current) {
        legLeftRef.current.rotation.x = -swing;
      }
      if (legRightRef.current) {
        legRightRef.current.rotation.x = swing;
      }
    } else {
      // アイドル状態
      animationTimeRef.current = 0;
      if (armLeftRef.current) armLeftRef.current.rotation.x = 0;
      if (armRightRef.current) armRightRef.current.rotation.x = 0;
      if (legLeftRef.current) legLeftRef.current.rotation.x = 0;
      if (legRightRef.current) legRightRef.current.rotation.x = 0;
    }

    // ダッシュ時の傾き
    if (player.isDashing) {
      groupRef.current.rotation.x = 0.3;
    } else {
      groupRef.current.rotation.x = 0;
    }

    // 無敵時の点滅
    if (player.invincibleTime > 0) {
      groupRef.current.visible = Math.floor(player.invincibleTime * 10) % 2 === 0;
    } else {
      groupRef.current.visible = true;
    }
  });

  const toolColor = toolColors[player.currentTool] || '#FFFFFF';

  return (
    <group ref={groupRef}>
      {/* 頭 */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color={COLORS.PLAYER.SKIN} />
      </mesh>

      {/* 髪 */}
      <mesh position={[0, 1.05, -0.05]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={COLORS.PLAYER.HAIR} />
      </mesh>

      {/* 目 */}
      <mesh position={[0.1, 0.95, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.1, 0.95, 0.25]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 体 */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <capsuleGeometry args={[0.25, 0.5, 8, 16]} />
        <meshStandardMaterial color={COLORS.PLAYER.BODY} />
      </mesh>

      {/* 左腕 */}
      <group position={[0.35, 0.5, 0]}>
        <mesh ref={armLeftRef} position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.BODY} />
        </mesh>
        <mesh position={[0, -0.45, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.SKIN} />
        </mesh>
      </group>

      {/* 右腕 */}
      <group position={[-0.35, 0.5, 0]}>
        <mesh ref={armRightRef} position={[0, -0.2, 0]} castShadow>
          <capsuleGeometry args={[0.08, 0.4, 4, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.BODY} />
        </mesh>
        {/* ツールを持つ手 */}
        <mesh position={[0, -0.45, 0.1]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.SKIN} />
        </mesh>
        {/* ツール表示 */}
        <mesh position={[0, -0.5, 0.3]} rotation={[Math.PI / 4, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.5, 8]} />
          <meshStandardMaterial color={toolColor} emissive={toolColor} emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* 左脚 */}
      <group position={[0.12, -0.1, 0]}>
        <mesh ref={legLeftRef} position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.BODY} />
        </mesh>
        {/* 足 */}
        <mesh position={[0, -0.6, 0.05]}>
          <boxGeometry args={[0.15, 0.1, 0.25]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>

      {/* 右脚 */}
      <group position={[-0.12, -0.1, 0]}>
        <mesh ref={legRightRef} position={[0, -0.3, 0]} castShadow>
          <capsuleGeometry args={[0.1, 0.4, 4, 8]} />
          <meshStandardMaterial color={COLORS.PLAYER.BODY} />
        </mesh>
        {/* 足 */}
        <mesh position={[0, -0.6, 0.05]}>
          <boxGeometry args={[0.15, 0.1, 0.25]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
      </group>

      {/* 攻撃エフェクト */}
      {player.isAttacking && (
        <mesh position={[0, 0.5, 1.5]} rotation={[0, 0, Math.PI / 4]}>
          <ringGeometry args={[0.3, 0.5, 8]} />
          <meshBasicMaterial
            color={toolColor}
            transparent
            opacity={0.7}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* ダッシュエフェクト */}
      {player.isDashing && (
        <>
          <mesh position={[0, 0.5, -0.5]}>
            <coneGeometry args={[0.3, 0.8, 8]} />
            <meshBasicMaterial color="#00BFFF" transparent opacity={0.5} />
          </mesh>
          <mesh position={[0, 0.5, -1]}>
            <coneGeometry args={[0.2, 0.5, 8]} />
            <meshBasicMaterial color="#00BFFF" transparent opacity={0.3} />
          </mesh>
        </>
      )}
    </group>
  );
};

export default Player;
