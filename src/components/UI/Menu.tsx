import React, { useState } from 'react';
import { useGameStore } from '../../hooks/useGameState';
import { StageId } from '../../types';

export const Menu: React.FC = () => {
  const { gameState, setGameState, setCurrentStage, stages, loadGame } = useGameStore();
  const [showInstructions, setShowInstructions] = useState(false);
  const [showStageSelect, setShowStageSelect] = useState(false);

  React.useEffect(() => {
    loadGame();
  }, [loadGame]);

  const handleStartGame = () => {
    console.log('Game start button clicked');
    setCurrentStage(1);
    console.log('Stage set to 1');
    setGameState('playing');
    console.log('Game state set to playing');
  };

  const handleStageSelect = (stageId: StageId) => {
    console.log('Stage select clicked:', stageId);
    const stage = stages.find((s) => s.id === stageId);
    if (stage?.unlocked) {
      setCurrentStage(stageId);
      console.log('Stage set to:', stageId);
      setGameState('playing');
      console.log('Game state set to playing');
    } else {
      console.log('Stage is locked:', stageId);
    }
  };

  if (gameState !== 'menu') return null;

  return (
    <div className="menu-overlay">
      {!showInstructions && !showStageSelect ? (
        <>
          <h1 className="game-title">🐵 モンキーキャッチャー 🐵</h1>
          <p style={{ color: 'white', marginBottom: '30px', fontSize: '18px' }}>
            逃げる猿たちを捕まえて平和を取り戻せ！
          </p>
          
          <button className="menu-button" onClick={handleStartGame}>
            ゲームスタート
          </button>
          
          <button
            className="menu-button secondary"
            onClick={() => setShowStageSelect(true)}
          >
            ステージセレクト
          </button>
          
          <button
            className="menu-button secondary"
            onClick={() => setShowInstructions(true)}
          >
            操作方法
          </button>
        </>
      ) : showInstructions ? (
        <div className="instructions">
          <h2>🎮 操作方法</h2>
          <div className="instructions-grid">
            <div className="instruction-item">
              <span className="key">W A S D</span>
              <span>移動</span>
            </div>
            <div className="instruction-item">
              <span className="key">マウス</span>
              <span>カメラ操作</span>
            </div>
            <div className="instruction-item">
              <span className="key">スペース</span>
              <span>ジャンプ</span>
            </div>
            <div className="instruction-item">
              <span className="key">Shift</span>
              <span>ダッシュ</span>
            </div>
            <div className="instruction-item">
              <span className="key">左クリック</span>
              <span>攻撃 / 捕獲</span>
            </div>
            <div className="instruction-item">
              <span className="key">1 - 5</span>
              <span>ツール切り替え</span>
            </div>
            <div className="instruction-item">
              <span className="key">ESC</span>
              <span>ポーズ</span>
            </div>
          </div>
          
          <h3 style={{ color: '#f5a623', marginTop: '20px', marginBottom: '10px' }}>
            🔧 ツール説明
          </h3>
          <ul style={{ textAlign: 'left', lineHeight: '1.8' }}>
            <li><strong>🥅 キャプチャーネット:</strong> 気絶した猿を捕獲</li>
            <li><strong>⚡ スタンロッド:</strong> 猿を気絶させる</li>
            <li><strong>🚀 ブースター:</strong> 高速ダッシュ</li>
            <li><strong>🛸 ホバードローン:</strong> 空中浮遊</li>
            <li><strong>📡 レーダースキャナー:</strong> 隠れた猿を探知</li>
          </ul>
          
          <button
            className="menu-button"
            onClick={() => setShowInstructions(false)}
            style={{ marginTop: '20px' }}
          >
            戻る
          </button>
        </div>
      ) : (
        <>
          <h2 style={{ color: 'white', marginBottom: '30px' }}>ステージセレクト</h2>
          <div className="stage-select">
            {stages.map((stage) => (
              <div
                key={stage.id}
                className={`stage-card ${!stage.unlocked ? 'locked' : ''}`}
                onClick={() => handleStageSelect(stage.id)}
              >
                <div className="stage-number">
                  {stage.unlocked ? stage.id : '🔒'}
                </div>
                <div className="stage-name">{stage.name}</div>
                {stage.unlocked && (
                  <>
                    <div className="stage-status">
                      {stage.cleared ? '✅ クリア済み' : '⭕ 未クリア'}
                    </div>
                    {stage.bestRank && (
                      <div style={{ color: '#FFD700', marginTop: '5px' }}>
                        ベスト: {stage.bestRank}ランク
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>
          <button
            className="menu-button secondary"
            onClick={() => setShowStageSelect(false)}
            style={{ marginTop: '20px' }}
          >
            戻る
          </button>
        </>
      )}
    </div>
  );
};

// ポーズメニュー
export const PauseMenu: React.FC = () => {
  const { gameState, setGameState } = useGameStore();

  if (gameState !== 'paused') return null;

  return (
    <div className="pause-overlay">
      <h2 className="pause-title">⏸️ ポーズ</h2>
      
      <button
        className="menu-button"
        onClick={() => setGameState('playing')}
      >
        ゲームに戻る
      </button>
      
      <button
        className="menu-button secondary"
        onClick={() => setGameState('menu')}
      >
        タイトルに戻る
      </button>
    </div>
  );
};

// チュートリアル
export const Tutorial: React.FC = () => {
  const { gameState, setGameState, updateSettings } = useGameStore();
  const [step, setStep] = useState(0);

  const tutorialSteps = [
    {
      title: 'ようこそ！',
      content: 'モンキーキャッチャーへようこそ！このゲームでは、知能増幅ヘルメットを被った猿たちを捕まえます。',
    },
    {
      title: '移動方法',
      content: 'WASDキーで移動、マウスでカメラを操作します。スペースキーでジャンプ、Shiftキーでダッシュできます。',
    },
    {
      title: '猿の捕まえ方',
      content: 'まず「スタンロッド」で猿を気絶させ、その後「キャプチャーネット」で捕獲します。数字キーでツールを切り替えましょう。',
    },
    {
      title: '準備完了！',
      content: 'すべての猿を捕まえてステージをクリアしましょう。頑張って！',
    },
  ];

  if (gameState !== 'tutorial') return null;

  const handleNext = () => {
    if (step < tutorialSteps.length - 1) {
      setStep(step + 1);
    } else {
      updateSettings({ showTutorial: false });
      setGameState('playing');
    }
  };

  return (
    <div className="tutorial-overlay">
      <div className="tutorial-box">
        <h3>{tutorialSteps[step].title}</h3>
        <p>{tutorialSteps[step].content}</p>
        <button className="menu-button" onClick={handleNext}>
          {step < tutorialSteps.length - 1 ? '次へ' : 'ゲーム開始！'}
        </button>
        <div style={{ marginTop: '15px', color: '#888' }}>
          {step + 1} / {tutorialSteps.length}
        </div>
      </div>
    </div>
  );
};

export default Menu;
