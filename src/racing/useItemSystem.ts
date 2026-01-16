import { useCallback } from 'react';
import * as THREE from 'three';
import { RacingItemType, RacingMachine, PlacedItem, ITEM_PROBABILITY, RACING_CONFIG } from './types';

// アイテムの効果を定義
interface ItemEffect {
  type: RacingItemType;
  duration?: number;
  damage?: number;
  boost?: number;
  special?: string;
}

const ITEM_EFFECTS: Record<RacingItemType, ItemEffect> = {
  banana: {
    type: 'banana',
    special: 'place_trap',
  },
  missile: {
    type: 'missile',
    damage: 1,
    special: 'homing_projectile',
  },
  shield: {
    type: 'shield',
    duration: 8,
    special: 'invincible',
  },
  boost: {
    type: 'boost',
    boost: 1.5,
    duration: 3,
  },
  thunder: {
    type: 'thunder',
    special: 'shrink_all',
    duration: 5,
  },
  oil: {
    type: 'oil',
    special: 'place_oil',
  },
  banana3: {
    type: 'banana3',
    special: 'place_triple_banana',
  },
  goldBoost: {
    type: 'goldBoost',
    boost: 2,
    duration: 5,
    special: 'invincible',
  },
};

// アイテムを取得時にランダムで決定
export const useItemSystem = () => {
  // 順位に基づいてアイテムをランダムで取得
  const getRandomItem = useCallback((position: number, totalRacers: number): RacingItemType => {
    // 順位による確率テーブル選択
    let probabilityTable: typeof ITEM_PROBABILITY.first;
    
    if (position === 1) {
      probabilityTable = ITEM_PROBABILITY.first;
    } else if (position <= Math.ceil(totalRacers / 3)) {
      probabilityTable = ITEM_PROBABILITY.early;
    } else if (position <= Math.ceil(totalRacers * 2 / 3)) {
      probabilityTable = ITEM_PROBABILITY.middle;
    } else {
      probabilityTable = ITEM_PROBABILITY.last;
    }

    // ランダムでアイテム選択
    const rand = Math.random();
    let cumulative = 0;

    for (const [item, probability] of Object.entries(probabilityTable)) {
      cumulative += probability;
      if (rand <= cumulative) {
        return item as RacingItemType;
      }
    }

    return 'banana'; // デフォルト
  }, []);

  // アイテム使用
  const useItem = useCallback((
    machine: RacingMachine,
    allMachines: RacingMachine[],
    placedItems: PlacedItem[]
  ): {
    machineUpdates: Partial<RacingMachine>;
    newPlacedItems?: PlacedItem[];
    affectedMachines?: { id: string; updates: Partial<RacingMachine> }[];
  } => {
    if (!machine.currentItem) {
      return { machineUpdates: {} };
    }

    const effect = ITEM_EFFECTS[machine.currentItem];
    const machineUpdates: Partial<RacingMachine> = { currentItem: null };
    const affectedMachines: { id: string; updates: Partial<RacingMachine> }[] = [];
    let newPlacedItems: PlacedItem[] = [...placedItems];

    switch (effect.special) {
      case 'place_trap': {
        // バナナを後ろに配置
        const behindPosition = machine.position.clone();
        const backward = new THREE.Vector3(0, 0, -3).applyEuler(machine.rotation);
        behindPosition.add(backward);
        behindPosition.y = 0.5;

        newPlacedItems.push({
          id: `banana-${Date.now()}`,
          type: 'banana',
          position: behindPosition,
          rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
          ownerId: machine.id,
          createdAt: Date.now(),
        });
        break;
      }

      case 'place_triple_banana': {
        // 3つのバナナを配置
        for (let i = 0; i < 3; i++) {
          const offset = new THREE.Vector3((i - 1) * 2, 0, -3 - i * 2);
          offset.applyEuler(machine.rotation);
          const bananaPos = machine.position.clone().add(offset);
          bananaPos.y = 0.5;

          newPlacedItems.push({
            id: `banana-triple-${Date.now()}-${i}`,
            type: 'banana',
            position: bananaPos,
            rotation: new THREE.Euler(0, Math.random() * Math.PI * 2, 0),
            ownerId: machine.id,
            createdAt: Date.now(),
          });
        }
        break;
      }

      case 'place_oil': {
        // オイルを配置
        const oilPosition = machine.position.clone();
        const backward = new THREE.Vector3(0, 0, -4).applyEuler(machine.rotation);
        oilPosition.add(backward);
        oilPosition.y = 0.1;

        newPlacedItems.push({
          id: `oil-${Date.now()}`,
          type: 'oil',
          position: oilPosition,
          rotation: new THREE.Euler(-Math.PI / 2, 0, 0),
          ownerId: machine.id,
          createdAt: Date.now(),
        });
        break;
      }

      case 'homing_projectile': {
        // ホーミングミサイル
        const targetMachine = allMachines
          .filter(m => m.id !== machine.id && m.currentPosition < machine.currentPosition)
          .sort((a, b) => a.currentPosition - b.currentPosition)[0];

        if (targetMachine) {
          // ミサイルを発射（後で衝突検出で処理）
          newPlacedItems.push({
            id: `missile-${Date.now()}`,
            type: 'missile',
            position: machine.position.clone().add(new THREE.Vector3(0, 1, 2)),
            rotation: machine.rotation.clone(),
            ownerId: machine.id,
            createdAt: Date.now(),
            targetId: targetMachine.id,
          });
        }
        break;
      }

      case 'invincible': {
        // 無敵状態
        machineUpdates.isInvincible = true;
        machineUpdates.invincibleEndTime = Date.now() + (effect.duration || 5) * 1000;

        if (effect.boost) {
          machineUpdates.isBoosting = true;
          machineUpdates.boostEndTime = Date.now() + (effect.duration || 3) * 1000;
        }
        break;
      }

      case 'shrink_all': {
        // 自分以外を縮小
        allMachines.forEach(m => {
          if (m.id !== machine.id) {
            affectedMachines.push({
              id: m.id,
              updates: {
                isSpinning: true,
                speed: m.speed * 0.5,
              },
            });
          }
        });
        break;
      }

      default: {
        // 通常ブースト
        if (effect.boost) {
          machineUpdates.isBoosting = true;
          machineUpdates.boostEndTime = Date.now() + (effect.duration || 3) * 1000;
        }
        break;
      }
    }

    return {
      machineUpdates,
      newPlacedItems,
      affectedMachines,
    };
  }, []);

  // 配置アイテムとの衝突チェック
  const checkPlacedItemCollision = useCallback((
    machine: RacingMachine,
    placedItems: PlacedItem[]
  ): { hitItem: PlacedItem | null; effects: Partial<RacingMachine> } => {
    const collisionRadius = 1.5;

    for (const item of placedItems) {
      if (item.ownerId === machine.id && Date.now() - item.createdAt < 1000) {
        continue; // 自分が置いた直後のアイテムは無視
      }

      // ミサイルの場合はターゲットIDをチェック
      if (item.type === 'missile') {
        if (item.targetId === machine.id) {
          const distance = machine.position.distanceTo(item.position);
          if (distance < collisionRadius * 2) {
            return {
              hitItem: item,
              effects: {
                isSpinning: true,
                speed: 0,
              },
            };
          }
        }
        continue;
      }

      const distance = machine.position.distanceTo(item.position);
      if (distance < collisionRadius) {
        // 無敵状態なら無視
        if (machine.isInvincible) {
          return { hitItem: item, effects: {} };
        }

        // アイテム効果を適用
        switch (item.type) {
          case 'banana':
            return {
              hitItem: item,
              effects: {
                isSpinning: true,
                speed: machine.speed * 0.3,
              },
            };
          case 'oil':
            return {
              hitItem: item,
              effects: {
                isSpinning: true,
                speed: machine.speed * 0.5,
              },
            };
          default:
            return { hitItem: item, effects: {} };
        }
      }
    }

    return { hitItem: null, effects: {} };
  }, []);

  // 配置アイテムの更新（ミサイルの移動など）
  const updatePlacedItems = useCallback((
    placedItems: PlacedItem[],
    allMachines: RacingMachine[],
    delta: number
  ): PlacedItem[] => {
    return placedItems.map(item => {
      if (item.type === 'missile' && item.targetId) {
        // ミサイルはターゲットを追尾
        const target = allMachines.find(m => m.id === item.targetId);
        if (target) {
          const direction = new THREE.Vector3()
            .subVectors(target.position, item.position)
            .normalize();
          
          const newPosition = item.position.clone();
          newPosition.add(direction.multiplyScalar(RACING_CONFIG.MISSILE_SPEED * delta));

          const angle = Math.atan2(direction.x, direction.z);
          const newRotation = new THREE.Euler(0, angle, 0);

          return {
            ...item,
            position: newPosition,
            rotation: newRotation,
          };
        }
      }
      return item;
    }).filter(item => {
      // 古いアイテムを削除
      const age = Date.now() - item.createdAt;
      if (item.type === 'missile') {
        return age < 10000; // ミサイルは10秒で消滅
      }
      return age < 30000; // その他は30秒で消滅
    });
  }, []);

  return {
    getRandomItem,
    useItem,
    checkPlacedItemCollision,
    updatePlacedItems,
  };
};

// アイテムの3D表示用コンポーネント用のデータ
export const ITEM_VISUAL_DATA: Record<RacingItemType, { color: string; icon: string }> = {
  banana: { color: '#FFD700', icon: '🍌' },
  missile: { color: '#FF0000', icon: '🚀' },
  shield: { color: '#00BFFF', icon: '🛡️' },
  boost: { color: '#FF4500', icon: '🍄' },
  thunder: { color: '#FFFF00', icon: '⚡' },
  oil: { color: '#1a1a1a', icon: '🛢️' },
  banana3: { color: '#FFD700', icon: '🍌🍌🍌' },
  goldBoost: { color: '#FFD700', icon: '⭐' },
};

export default useItemSystem;
