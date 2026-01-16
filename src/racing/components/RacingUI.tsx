import React from 'react';
import { RacingMachine, RacingGameState, CourseData, CupType } from '../types';
import { ITEM_VISUAL_DATA } from '../useItemSystem';

// レースHUD（ヘッドアップディスプレイ）
interface RacingHUDProps {
  playerMachine: RacingMachine;
  allMachines: RacingMachine[];
  courseData: CourseData;
  raceTime: number;
  countdown: number;
  gameState: RacingGameState;
}

export const RacingHUD: React.FC<RacingHUDProps> = ({
  playerMachine,
  allMachines,
  courseData,
  raceTime,
  countdown,
  gameState,
}) => {
  // 時間フォーマット
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // 順位のサフィックス
  const getPositionSuffix = (pos: number): string => {
    if (pos === 1) return 'st';
    if (pos === 2) return 'nd';
    if (pos === 3) return 'rd';
    return 'th';
  };

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      pointerEvents: 'none',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      {/* カウントダウン表示 */}
      {gameState === 'countdown' && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '120px',
          color: countdown > 0 ? '#FF0000' : '#00FF00',
          textShadow: '0 0 20px rgba(0, 0, 0, 0.8)',
          animation: 'pulse 1s ease-in-out infinite',
        }}>
          {countdown > 0 ? countdown : 'GO!'}
        </div>
      )}

      {/* 順位表示（左上） */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        padding: '15px 25px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.8))',
        borderRadius: '10px',
        border: '3px solid #FFD700',
      }}>
        <div style={{
          fontSize: '48px',
          color: '#FFD700',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {playerMachine.currentPosition}
          <span style={{ fontSize: '24px' }}>
            {getPositionSuffix(playerMachine.currentPosition)}
          </span>
        </div>
        <div style={{
          fontSize: '14px',
          color: '#FFFFFF',
          marginTop: '5px',
        }}>
          / {allMachines.length}
        </div>
      </div>

      {/* ラップ表示（右上） */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        padding: '15px 25px',
        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(30, 30, 30, 0.8))',
        borderRadius: '10px',
        border: '3px solid #00BFFF',
      }}>
        <div style={{ fontSize: '14px', color: '#AAAAAA' }}>LAP</div>
        <div style={{
          fontSize: '32px',
          color: '#00BFFF',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {Math.min(playerMachine.currentLap + 1, courseData.laps)}/{courseData.laps}
        </div>
      </div>

      {/* タイム表示（上中央） */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '5px',
      }}>
        <div style={{ fontSize: '12px', color: '#AAAAAA', textAlign: 'center' }}>TIME</div>
        <div style={{ fontSize: '24px', color: '#FFFFFF' }}>{formatTime(raceTime)}</div>
      </div>

      {/* スピードメーター（右下） */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        right: '20px',
        width: '150px',
        height: '150px',
        background: 'radial-gradient(circle, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.8))',
        borderRadius: '50%',
        border: '4px solid #FF4500',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          fontSize: '32px',
          color: '#FF4500',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
        }}>
          {Math.round(playerMachine.speed * 10)}
        </div>
        <div style={{ fontSize: '12px', color: '#AAAAAA' }}>km/h</div>
      </div>

      {/* アイテム表示（左下） */}
      <div style={{
        position: 'absolute',
        bottom: '120px',
        left: '20px',
        width: '100px',
        height: '100px',
        background: 'rgba(0, 0, 0, 0.8)',
        borderRadius: '15px',
        border: '4px solid #FFD700',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {playerMachine.currentItem ? (
          <div style={{
            fontSize: '48px',
            animation: 'bounce 0.5s ease-in-out infinite',
          }}>
            {ITEM_VISUAL_DATA[playerMachine.currentItem].icon}
          </div>
        ) : (
          <div style={{ fontSize: '16px', color: '#666666' }}>NO ITEM</div>
        )}
      </div>

      {/* ミニマップ（右下スピードメーターの上） */}
      <div style={{
        position: 'absolute',
        bottom: '290px',
        right: '20px',
        width: '180px',
        height: '120px',
        background: 'rgba(0, 0, 0, 0.7)',
        borderRadius: '10px',
        border: '2px solid #FFFFFF',
        overflow: 'hidden',
      }}>
        <svg viewBox="-100 -70 200 140" style={{ width: '100%', height: '100%' }}>
          {/* コーストラック */}
          <ellipse
            cx="0"
            cy="0"
            rx="80"
            ry="50"
            fill="none"
            stroke="#404040"
            strokeWidth="8"
          />
          {/* 全レーサー表示 */}
          {allMachines.map(machine => {
            const x = (machine.position.x / 80) * 80;
            const y = (machine.position.z / 50) * 50;
            const isPlayer = machine.id === playerMachine.id;
            return (
              <circle
                key={machine.id}
                cx={x}
                cy={y}
                r={isPlayer ? 6 : 4}
                fill={isPlayer ? '#00FF00' : machine.color}
                stroke={isPlayer ? '#FFFFFF' : 'none'}
                strokeWidth="2"
              />
            );
          })}
        </svg>
      </div>

      {/* フォーム表示 */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '10px 20px',
        background: playerMachine.currentForm === 'long' 
          ? 'rgba(255, 100, 0, 0.8)' 
          : 'rgba(0, 100, 255, 0.8)',
        borderRadius: '20px',
        fontSize: '16px',
        color: '#FFFFFF',
      }}>
        {playerMachine.currentForm === 'long' ? 'LONG FORM' : 'NORMAL FORM'}
        {playerMachine.transformCooldown > 0 && (
          <span style={{ marginLeft: '10px', opacity: 0.7 }}>
            ({Math.ceil(playerMachine.transformCooldown)}s)
          </span>
        )}
      </div>

      {/* ブースト/ドリフト表示 */}
      {(playerMachine.isBoosting || playerMachine.isDrifting) && (
        <div style={{
          position: 'absolute',
          bottom: '60px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '5px 15px',
          background: playerMachine.isBoosting ? '#FF4500' : '#00BFFF',
          borderRadius: '15px',
          fontSize: '14px',
          color: '#FFFFFF',
          animation: 'pulse 0.3s ease-in-out infinite',
        }}>
          {playerMachine.isBoosting ? 'BOOST!' : `DRIFT LV.${playerMachine.driftLevel}`}
        </div>
      )}

      {/* スタイルの追加 */}
      <style>{`
        @keyframes pulse {
          0%, 100% { transform: translateX(-50%) scale(1); }
          50% { transform: translateX(-50%) scale(1.1); }
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
};

// カップ選択画面
interface CupSelectProps {
  onSelectCup: (cup: CupType) => void;
  unlockedCups: CupType[];
  onBack: () => void;
}

export const CupSelectScreen: React.FC<CupSelectProps> = ({
  onSelectCup,
  unlockedCups,
  onBack,
}) => {
  const cups: { type: CupType; name: string; color: string; icon: string }[] = [
    { type: 'monkey', name: 'モンキーカップ', color: '#FFD700', icon: '🐵' },
    { type: 'banana', name: 'バナナカップ', color: '#FFFF00', icon: '🍌' },
    { type: 'star', name: 'スターカップ', color: '#00BFFF', icon: '⭐' },
    { type: 'special', name: 'スペシャルカップ', color: '#FF00FF', icon: '👑' },
  ];

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'linear-gradient(180deg, #1a1a4a 0%, #0a0a2a 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      <h1 style={{
        fontSize: '36px',
        color: '#FFD700',
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
        marginBottom: '40px',
      }}>
        🏆 カップ選択 🏆
      </h1>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '20px',
        maxWidth: '600px',
      }}>
        {cups.map(cup => {
          const isUnlocked = unlockedCups.includes(cup.type);
          return (
            <button
              key={cup.type}
              onClick={() => isUnlocked && onSelectCup(cup.type)}
              disabled={!isUnlocked}
              style={{
                width: '250px',
                height: '120px',
                background: isUnlocked
                  ? `linear-gradient(135deg, ${cup.color}40, ${cup.color}20)`
                  : 'rgba(50, 50, 50, 0.8)',
                border: `4px solid ${isUnlocked ? cup.color : '#333333'}`,
                borderRadius: '15px',
                cursor: isUnlocked ? 'pointer' : 'not-allowed',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'transform 0.2s, box-shadow 0.2s',
                opacity: isUnlocked ? 1 : 0.5,
              }}
              onMouseEnter={(e) => {
                if (isUnlocked) {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = `0 0 20px ${cup.color}`;
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>
                {isUnlocked ? cup.icon : '🔒'}
              </div>
              <div style={{
                fontSize: '14px',
                color: isUnlocked ? '#FFFFFF' : '#666666',
              }}>
                {cup.name}
              </div>
              {!isUnlocked && (
                <div style={{ fontSize: '10px', color: '#FF0000', marginTop: '5px' }}>
                  前のカップをクリア
                </div>
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={onBack}
        style={{
          marginTop: '40px',
          padding: '15px 40px',
          background: 'rgba(100, 100, 100, 0.8)',
          border: '3px solid #FFFFFF',
          borderRadius: '10px',
          color: '#FFFFFF',
          fontSize: '16px',
          cursor: 'pointer',
          fontFamily: 'inherit',
        }}
      >
        ← もどる
      </button>
    </div>
  );
};

// レース結果画面
interface RaceResultProps {
  rankings: RacingMachine[];
  playerMachine: RacingMachine;
  raceTime: number;
  onNext: () => void;
  onRetry: () => void;
  isLastRace: boolean;
}

export const RaceResultScreen: React.FC<RaceResultProps> = ({
  rankings,
  playerMachine,
  raceTime,
  onNext,
  onRetry,
  isLastRace,
}) => {
  const formatTime = (ms: number): string => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  const playerRank = rankings.findIndex(m => m.id === playerMachine.id) + 1;
  const earnedCoins = Math.max(0, 7 - playerRank) * 10;

  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.9)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      <h1 style={{
        fontSize: '48px',
        color: playerRank <= 3 ? '#FFD700' : '#FFFFFF',
        textShadow: '3px 3px 6px rgba(0, 0, 0, 0.8)',
        marginBottom: '30px',
      }}>
        {playerRank === 1 ? '🏆 1ST PLACE! 🏆' :
         playerRank === 2 ? '🥈 2ND PLACE! 🥈' :
         playerRank === 3 ? '🥉 3RD PLACE! 🥉' :
         `${playerRank}TH PLACE`}
      </h1>

      <div style={{
        fontSize: '24px',
        color: '#FFFFFF',
        marginBottom: '20px',
      }}>
        TIME: {formatTime(raceTime)}
      </div>

      <div style={{
        fontSize: '20px',
        color: '#FFD700',
        marginBottom: '30px',
      }}>
        +{earnedCoins} コイン獲得！
      </div>

      {/* 順位表 */}
      <div style={{
        background: 'rgba(30, 30, 30, 0.9)',
        borderRadius: '15px',
        padding: '20px',
        marginBottom: '30px',
        minWidth: '400px',
      }}>
        {rankings.slice(0, 6).map((machine, index) => {
          const isPlayer = machine.id === playerMachine.id;
          return (
            <div
              key={machine.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '10px 15px',
                background: isPlayer ? 'rgba(0, 255, 0, 0.2)' : 'transparent',
                borderRadius: '8px',
                marginBottom: '5px',
              }}
            >
              <span style={{
                width: '40px',
                fontSize: '20px',
                color: index === 0 ? '#FFD700' : index === 1 ? '#C0C0C0' : index === 2 ? '#CD7F32' : '#FFFFFF',
              }}>
                {index + 1}.
              </span>
              <span style={{
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                background: machine.color,
                marginRight: '15px',
              }} />
              <span style={{
                flex: 1,
                color: isPlayer ? '#00FF00' : '#FFFFFF',
                fontSize: '14px',
              }}>
                {machine.name}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <button
          onClick={onRetry}
          style={{
            padding: '15px 30px',
            background: 'rgba(255, 100, 100, 0.8)',
            border: '3px solid #FF0000',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          リトライ
        </button>
        <button
          onClick={onNext}
          style={{
            padding: '15px 30px',
            background: 'rgba(100, 255, 100, 0.8)',
            border: '3px solid #00FF00',
            borderRadius: '10px',
            color: '#FFFFFF',
            fontSize: '16px',
            cursor: 'pointer',
            fontFamily: 'inherit',
          }}
        >
          {isLastRace ? 'カップ結果へ' : '次のレースへ →'}
        </button>
      </div>
    </div>
  );
};

// モバイル用タッチコントロール
interface RacingTouchControlsProps {
  onInput: (input: {
    accelerate: boolean;
    brake: boolean;
    left: boolean;
    right: boolean;
    drift: boolean;
    useItem: boolean;
    transform: boolean;
  }) => void;
}

export const RacingTouchControls: React.FC<RacingTouchControlsProps> = ({ onInput }) => {
  const [input, setInput] = React.useState({
    accelerate: false,
    brake: false,
    left: false,
    right: false,
    drift: false,
    useItem: false,
    transform: false,
  });

  const handleButtonPress = (key: keyof typeof input, pressed: boolean) => {
    const newInput = { ...input, [key]: pressed };
    setInput(newInput);
    onInput(newInput);
  };

  return (
    <div style={{
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '200px',
      pointerEvents: 'auto',
    }}>
      {/* 左側：ステアリング */}
      <div style={{
        position: 'absolute',
        left: '20px',
        bottom: '20px',
        display: 'flex',
        gap: '10px',
      }}>
        <button
          onTouchStart={() => handleButtonPress('left', true)}
          onTouchEnd={() => handleButtonPress('left', false)}
          onMouseDown={() => handleButtonPress('left', true)}
          onMouseUp={() => handleButtonPress('left', false)}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: input.left ? '#00BFFF' : 'rgba(0, 0, 0, 0.6)',
            border: '3px solid #FFFFFF',
            fontSize: '30px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          ◀
        </button>
        <button
          onTouchStart={() => handleButtonPress('right', true)}
          onTouchEnd={() => handleButtonPress('right', false)}
          onMouseDown={() => handleButtonPress('right', true)}
          onMouseUp={() => handleButtonPress('right', false)}
          style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: input.right ? '#00BFFF' : 'rgba(0, 0, 0, 0.6)',
            border: '3px solid #FFFFFF',
            fontSize: '30px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          ▶
        </button>
      </div>

      {/* 右側：アクションボタン */}
      <div style={{
        position: 'absolute',
        right: '20px',
        bottom: '20px',
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '10px',
      }}>
        {/* アクセル */}
        <button
          onTouchStart={() => handleButtonPress('accelerate', true)}
          onTouchEnd={() => handleButtonPress('accelerate', false)}
          onMouseDown={() => handleButtonPress('accelerate', true)}
          onMouseUp={() => handleButtonPress('accelerate', false)}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: input.accelerate ? '#00FF00' : 'rgba(0, 100, 0, 0.6)',
            border: '3px solid #00FF00',
            fontSize: '14px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          GAS
        </button>

        {/* ドリフト */}
        <button
          onTouchStart={() => handleButtonPress('drift', true)}
          onTouchEnd={() => handleButtonPress('drift', false)}
          onMouseDown={() => handleButtonPress('drift', true)}
          onMouseUp={() => handleButtonPress('drift', false)}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: input.drift ? '#FF4500' : 'rgba(100, 50, 0, 0.6)',
            border: '3px solid #FF4500',
            fontSize: '12px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          DRIFT
        </button>

        {/* アイテム */}
        <button
          onTouchStart={() => {
            handleButtonPress('useItem', true);
            setTimeout(() => handleButtonPress('useItem', false), 100);
          }}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(100, 100, 0, 0.6)',
            border: '3px solid #FFD700',
            fontSize: '12px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          ITEM
        </button>

        {/* フォームチェンジ */}
        <button
          onTouchStart={() => {
            handleButtonPress('transform', true);
            setTimeout(() => handleButtonPress('transform', false), 100);
          }}
          style={{
            width: '70px',
            height: '70px',
            borderRadius: '50%',
            background: 'rgba(100, 0, 100, 0.6)',
            border: '3px solid #FF00FF',
            fontSize: '10px',
            color: '#FFFFFF',
            cursor: 'pointer',
          }}
        >
          FORM
        </button>
      </div>
    </div>
  );
};

export default {
  RacingHUD,
  CupSelectScreen,
  RaceResultScreen,
  RacingTouchControls,
};
