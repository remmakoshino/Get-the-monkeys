import React from 'react';
import { useGameStore } from '../../hooks/useGameState';
import { formatTime } from '../../utils/constants';
import { ToolType } from '../../types';

// ツールのアイコン表示
const TOOL_ICONS: Record<ToolType, string> = {
  net: '🥅',
  rod: '⚡',
  booster: '🚀',
  hover: '🛸',
  radar: '📡',
};

export const HUD: React.FC = () => {
  const { player, monkeys, gameTime, boss, currentStage, stages } = useGameStore();

  const stageInfo = stages.find((s) => s.id === currentStage);
  const capturedCount = monkeys.filter((m) => m.state === 'captured').length;
  const totalMonkeys = monkeys.length;
  const healthPercent = (player.health / player.maxHealth) * 100;

  return (
    <div className="hud">
      {/* 体力バー */}
      <div className="health-bar">
        <div
          className="health-bar-fill"
          style={{
            width: `${healthPercent}%`,
            background: healthPercent > 50
              ? 'linear-gradient(90deg, #4CAF50 0%, #8BC34A 100%)'
              : healthPercent > 25
              ? 'linear-gradient(90deg, #FF9800 0%, #FFC107 100%)'
              : 'linear-gradient(90deg, #f44336 0%, #FF5722 100%)',
          }}
        />
      </div>

      {/* 猿カウンター */}
      <div className="monkey-counter">
        <span className="monkey-icon">🐵</span>
        <span>{capturedCount} / {totalMonkeys}</span>
      </div>

      {/* タイマー */}
      <div className="timer">
        ⏱️ {formatTime(gameTime)}
      </div>

      {/* ボスの体力バー */}
      {boss && boss.state !== 'captured' && (
        <div className="boss-health">
          <div className="boss-name">{boss.name}</div>
          <div className="boss-health-bar">
            <div
              className="boss-health-fill"
              style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }}
            />
          </div>
        </div>
      )}

      {/* ツールバー */}
      <div className="tool-bar">
        {player.tools.map((tool, index) => (
          <div
            key={tool.type}
            className={`tool-item ${player.currentTool === tool.type ? 'active' : ''}`}
            title={tool.description}
          >
            <span className="tool-icon">{TOOL_ICONS[tool.type]}</span>
            <span className="tool-key">{index + 1}</span>
          </div>
        ))}
      </div>

      {/* ミニマップ */}
      <div className="minimap">
        <div className="minimap-inner">
          {/* プレイヤー位置 */}
          <div className="minimap-player" />
          
          {/* 猿の位置 */}
          {monkeys
            .filter((m) => m.state !== 'captured')
            .map((monkey) => {
              // プレイヤーからの相対位置を計算
              const relX = (monkey.position.x - player.position.x) / 50 * 60 + 75;
              const relZ = (monkey.position.z - player.position.z) / 50 * 60 + 75;
              
              // 範囲外はクリップ
              if (relX < 0 || relX > 150 || relZ < 0 || relZ > 150) return null;
              
              return (
                <div
                  key={monkey.id}
                  className="minimap-monkey"
                  style={{
                    left: `${relX}px`,
                    top: `${relZ}px`,
                    background: monkey.alertLevel > 0.5 ? '#FF0000' : '#FFD700',
                  }}
                />
              );
            })}
          
          {/* ボス位置 */}
          {boss && boss.state !== 'captured' && (
            <div
              className="minimap-monkey"
              style={{
                left: `${(boss.position.x - player.position.x) / 50 * 60 + 75}px`,
                top: `${(boss.position.z - player.position.z) / 50 * 60 + 75}px`,
                width: '12px',
                height: '12px',
                background: '#FF0000',
                boxShadow: '0 0 5px #FF0000',
              }}
            />
          )}
        </div>
      </div>

      {/* クロスヘア */}
      <div className="crosshair" />

      {/* ステージ名 */}
      <div
        style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0, 0, 0, 0.7)',
          padding: '8px 20px',
          borderRadius: '20px',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
        }}
      >
        Stage {currentStage}: {stageInfo?.name}
      </div>
    </div>
  );
};

export default HUD;
