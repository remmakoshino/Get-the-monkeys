import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { MonkeyData, MONKEY_STATS } from '../types';
import { COLORS } from '../utils/constants';

interface MonkeyProps {
  data: MonkeyData;
}

// 猿キャラクターの3Dモデル
export const Monkey: React.FC<MonkeyProps> = ({ data }) => {
  const groupRef = useRef<THREE.Group>(null);
  const armLeftRef = useRef<THREE.Mesh>(null);
  const armRightRef = useRef<THREE.Mesh>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const animationTimeRef = useRef(Math.random() * Math.PI * 2);

  // 猿の色を取得
  const monkeyColor = useMemo(() => {
    const stats = MONKEY_STATS[data.type];
    return stats.color;
  }, [data.type]);

  // ヘルメットのライト色（警戒レベルに応じて変化）
  const helmetLightColor = useMemo(() => {
    if (data.state === 'stunned') return '#888888';
    if (data.alertLevel > 0.5) return '#FF0000';
    if (data.alertLevel > 0.2) return '#FFFF00';
    return '#00FF00';
  }, [data.alertLevel, data.state]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // 捕獲済みの場合は非表示
    if (data.state === 'captured') {
      groupRef.current.visible = false;
      return;
    }
    groupRef.current.visible = true;

    // 位置と回転を更新
    groupRef.current.position.copy(data.position);
    groupRef.current.rotation.copy(data.rotation);

    // アニメーション
    animationTimeRef.current += delta * (data.state === 'fleeing' ? 15 : 5);

    const isMoving = data.velocity.length() > 0.1;
    const swing = isMoving ? Math.sin(animationTimeRef.current) * 0.6 : Math.sin(animationTimeRef.current * 0.5) * 0.1;

    // 腕を振る
    if (armLeftRef.current) {
      armLeftRef.current.rotation.x = swing;
    }
    if (armRightRef.current) {
      armRightRef.current.rotation.x = -swing;
    }

    // 尻尾を揺らす
    if (tailRef.current) {
      tailRef.current.rotation.x = Math.sin(animationTimeRef.current * 0.5) * 0.3 - 0.5;
      tailRef.current.rotation.z = Math.sin(animationTimeRef.current * 0.7) * 0.2;
    }

    // スタン時の揺れ
    if (data.state === 'stunned') {
      groupRef.current.rotation.z = Math.sin(animationTimeRef.current * 3) * 0.1;
    } else {
      groupRef.current.rotation.z = 0;
    }
  });

  // 隠れている場合は半透明に
  const opacity = data.state === 'hidden' ? 0.3 : 1;

  return (
    <group ref={groupRef}>
      {/* 頭 */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
      </mesh>

      {/* 顔（明るい部分） */}
      <mesh position={[0, 0.65, 0.15]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
      </mesh>

      {/* 目 */}
      <mesh position={[0.08, 0.72, 0.25]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      <mesh position={[-0.08, 0.72, 0.25]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* 瞳 */}
      <mesh position={[0.08, 0.72, 0.28]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>
      <mesh position={[-0.08, 0.72, 0.28]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshStandardMaterial color="#000000" />
      </mesh>

      {/* 耳 */}
      <mesh position={[0.22, 0.75, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
      </mesh>
      <mesh position={[-0.22, 0.75, 0]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
      </mesh>

      {/* ヘルメット */}
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.22, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={COLORS.MONKEY.HELMET}
          metalness={0.8}
          roughness={0.2}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* ヘルメットのライト */}
      <mesh position={[0, 0.95, 0.1]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial
          color={helmetLightColor}
          emissive={helmetLightColor}
          emissiveIntensity={data.state === 'stunned' ? 0.2 : 1}
        />
      </mesh>

      {/* アンテナ */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.15, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0, 1.15, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial
          color={helmetLightColor}
          emissive={helmetLightColor}
          emissiveIntensity={0.5}
        />
      </mesh>

      {/* 体 */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
      </mesh>

      {/* お腹 */}
      <mesh position={[0, 0.3, 0.1]}>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
      </mesh>

      {/* 左腕 */}
      <group position={[0.28, 0.4, 0]}>
        <mesh ref={armLeftRef} position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
          <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
        </mesh>
      </group>

      {/* 右腕 */}
      <group position={[-0.28, 0.4, 0]}>
        <mesh ref={armRightRef} position={[0, -0.15, 0]} castShadow>
          <capsuleGeometry args={[0.06, 0.25, 4, 8]} />
          <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.35, 0]}>
          <sphereGeometry args={[0.07, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
        </mesh>
      </group>

      {/* 左脚 */}
      <group position={[0.1, 0.05, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.15, 4, 8]} />
          <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.25, 0.05]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
        </mesh>
      </group>

      {/* 右脚 */}
      <group position={[-0.1, 0.05, 0]}>
        <mesh position={[0, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.07, 0.15, 4, 8]} />
          <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
        </mesh>
        <mesh position={[0, -0.25, 0.05]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial color="#FFDAB9" transparent opacity={opacity} />
        </mesh>
      </group>

      {/* 尻尾 */}
      <mesh ref={tailRef} position={[0, 0.2, -0.25]} rotation={[-0.5, 0, 0]} castShadow>
        <coneGeometry args={[0.05, 0.5, 8]} />
        <meshStandardMaterial color={monkeyColor} transparent opacity={opacity} />
      </mesh>

      {/* スタンエフェクト（星） */}
      {data.state === 'stunned' && (
        <group position={[0, 1.3, 0]}>
          {[0, 1, 2].map((i) => (
            <mesh
              key={i}
              position={[
                Math.cos((i / 3) * Math.PI * 2 + animationTimeRef.current) * 0.3,
                0,
                Math.sin((i / 3) * Math.PI * 2 + animationTimeRef.current) * 0.3,
              ]}
              rotation={[0, 0, animationTimeRef.current]}
            >
              <octahedronGeometry args={[0.08]} />
              <meshStandardMaterial
                color="#FFFF00"
                emissive="#FFFF00"
                emissiveIntensity={0.5}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* 警戒マーク */}
      {data.alertLevel > 0.5 && data.state !== 'stunned' && (
        <mesh position={[0, 1.4, 0]}>
          <coneGeometry args={[0.1, 0.25, 3]} />
          <meshStandardMaterial
            color="#FF0000"
            emissive="#FF0000"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}
    </group>
  );
};

export default Monkey;
