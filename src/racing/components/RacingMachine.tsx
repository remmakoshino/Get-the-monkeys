import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RacingMachine } from '../types';

interface RacingMachineProps {
  machine: RacingMachine;
  isPlayer?: boolean;
}

// 猿マシン3Dモデル
export const RacingMachineModel: React.FC<RacingMachineProps> = ({ machine, isPlayer = false }) => {
  const groupRef = useRef<THREE.Group>(null);
  const wheelRefs = useRef<THREE.Mesh[]>([]);
  const bodyRef = useRef<THREE.Group>(null);
  const animationTimeRef = useRef(0);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    animationTimeRef.current += delta;

    // 位置と回転を更新
    groupRef.current.position.copy(machine.position);
    groupRef.current.rotation.copy(machine.rotation);

    // ホイール回転（速度に応じて）
    const wheelSpeed = machine.speed * 0.1;
    wheelRefs.current.forEach((wheel) => {
      if (wheel) {
        wheel.rotation.x += wheelSpeed * delta;
      }
    });

    // ロングフォーム時のボディ変形
    if (bodyRef.current) {
      const targetScaleZ = machine.currentForm === 'long' ? 1.5 : 1;
      const targetScaleX = machine.currentForm === 'long' ? 0.8 : 1;
      bodyRef.current.scale.z = THREE.MathUtils.lerp(bodyRef.current.scale.z, targetScaleZ, delta * 5);
      bodyRef.current.scale.x = THREE.MathUtils.lerp(bodyRef.current.scale.x, targetScaleX, delta * 5);
    }

    // スピン時の回転
    if (machine.isSpinning) {
      groupRef.current.rotation.y += delta * 15;
    }

    // 無敵時の点滅
    if (machine.isInvincible) {
      groupRef.current.visible = Math.floor(animationTimeRef.current * 10) % 2 === 0;
    } else {
      groupRef.current.visible = true;
    }

    // ドリフト時の傾き
    if (machine.isDrifting && machine.driftDirection) {
      const tiltAmount = machine.driftDirection === 'left' ? 0.2 : -0.2;
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, tiltAmount, delta * 5);
    } else {
      groupRef.current.rotation.z = THREE.MathUtils.lerp(groupRef.current.rotation.z, 0, delta * 5);
    }
  });

  // ドリフトレベルに応じた色
  const getDriftColor = () => {
    if (!machine.isDrifting) return null;
    switch (machine.driftLevel) {
      case 1: return '#FFFFFF';
      case 2: return '#00BFFF';
      case 3: return '#FFA500';
      default: return null;
    }
  };

  const driftColor = getDriftColor();

  return (
    <group ref={groupRef}>
      {/* メインボディ（猿の体） */}
      <group ref={bodyRef}>
        {/* 体 */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <capsuleGeometry args={[0.4, 0.6, 8, 16]} />
          <meshStandardMaterial color={machine.color} />
        </mesh>

        {/* 頭 */}
        <mesh position={[0, 1, 0]} castShadow>
          <sphereGeometry args={[0.35, 16, 16]} />
          <meshStandardMaterial color="#F5DEB3" />
        </mesh>

        {/* ピポヘル（ヘルメット） */}
        <mesh position={[0, 1.15, 0]} castShadow>
          <sphereGeometry args={[0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#FF0000" />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFFF00" emissive="#FFFF00" emissiveIntensity={0.5} />
        </mesh>

        {/* 目 */}
        <mesh position={[0.12, 1, 0.28]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>
        <mesh position={[-0.12, 1, 0.28]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#000000" />
        </mesh>

        {/* 耳 */}
        <mesh position={[0.35, 1, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#F5DEB3" />
        </mesh>
        <mesh position={[-0.35, 1, 0]} castShadow>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color="#F5DEB3" />
        </mesh>
      </group>

      {/* タイヤ（4つ） */}
      {/* 前左タイヤ */}
      <group position={[0.5, 0, 0.5]}>
        <mesh ref={(el) => { if (el) wheelRefs.current[0] = el; }} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* タイヤのリム */}
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.16, 8]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
      </group>

      {/* 前右タイヤ */}
      <group position={[-0.5, 0, 0.5]}>
        <mesh ref={(el) => { if (el) wheelRefs.current[1] = el; }} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.25, 0.25, 0.15, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.15, 0.15, 0.16, 8]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
      </group>

      {/* 後左タイヤ */}
      <group position={[0.5, 0, -0.5]}>
        <mesh ref={(el) => { if (el) wheelRefs.current[2] = el; }} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.21, 8]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
      </group>

      {/* 後右タイヤ */}
      <group position={[-0.5, 0, -0.5]}>
        <mesh ref={(el) => { if (el) wheelRefs.current[3] = el; }} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.18, 0.18, 0.21, 8]} />
          <meshStandardMaterial color="#C0C0C0" />
        </mesh>
      </group>

      {/* エンジン（後部） */}
      <mesh position={[0, 0.3, -0.7]} castShadow>
        <boxGeometry args={[0.6, 0.4, 0.4]} />
        <meshStandardMaterial color="#404040" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* 排気管 */}
      <mesh position={[0.25, 0.2, -0.9]} rotation={[Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[-0.25, 0.2, -0.9]} rotation={[Math.PI / 6, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#2F2F2F" metalness={0.9} roughness={0.1} />
      </mesh>

      {/* ブーストエフェクト */}
      {machine.isBoosting && (
        <>
          <mesh position={[0.25, 0.2, -1.2]}>
            <coneGeometry args={[0.15, 0.5, 8]} />
            <meshBasicMaterial color="#FF4500" transparent opacity={0.8} />
          </mesh>
          <mesh position={[-0.25, 0.2, -1.2]}>
            <coneGeometry args={[0.15, 0.5, 8]} />
            <meshBasicMaterial color="#FF4500" transparent opacity={0.8} />
          </mesh>
        </>
      )}

      {/* ドリフトエフェクト */}
      {driftColor && (
        <>
          <mesh position={[0.5, 0, -0.5]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color={driftColor} transparent opacity={0.6} />
          </mesh>
          <mesh position={[-0.5, 0, -0.5]}>
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshBasicMaterial color={driftColor} transparent opacity={0.6} />
          </mesh>
        </>
      )}

      {/* 無敵エフェクト */}
      {machine.isInvincible && (
        <mesh>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshBasicMaterial color="#FFD700" transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* アイテム表示 */}
      {machine.currentItem && (
        <mesh position={[0, 1.8, 0]}>
          <boxGeometry args={[0.3, 0.3, 0.3]} />
          <meshStandardMaterial color="#00FF00" />
        </mesh>
      )}

      {/* プレイヤー識別用の矢印 */}
      {isPlayer && (
        <mesh position={[0, 2.2, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.2, 0.4, 4]} />
          <meshBasicMaterial color="#00FF00" />
        </mesh>
      )}
    </group>
  );
};

export default RacingMachineModel;
