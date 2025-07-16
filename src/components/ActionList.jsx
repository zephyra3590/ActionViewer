import React, { useState } from 'react';
import './ActionList.css';

const ActionList = ({ gts, onActionClick, fps }) => {
  // 添加状态管理当前选中的Tab
  const [activeTab, setActiveTab] = useState(0);
  
  // 动作类型映射（与 RadarChart 中相同）
  const actionLabels = {
    "0": "サーブ",
    "1": "ロブ", 
    "2": "ネット",
    "3": "ヘアピン",
    "4": "プッシュ",
    "5": "ドライブ",
    "6": "スマッシュレシーブ",
    "7": "ドロップ",
    "8": "スマッシュ",
    "9": "クリアー",
    "10": "ディフェンス"
  };
  
  const handleClick = (startFrame) => {
    onActionClick(startFrame);
  };
  
  // Function to format frame to time
  const frameToTime = (frame) => {
    const totalSeconds = frame; // Math.floor(frame / fps) || Math.floor(frame);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  // 修正的动作成功判断逻辑
  const checkActionSuccess = (currentAction, currentPlayerIndex, allPlayers) => {
    const currentEndTime = currentAction.end_id;
    const twoSecondsLater = currentEndTime + 2;
    
    // 获取对手的动作（另一个选手）
    const opponentIndex = 1 - currentPlayerIndex; // 0变1，1变0
    const opponentActions = allPlayers[opponentIndex]?.actions || [];
    
    // 查找对手在2秒内的回应动作
    const opponentResponse = opponentActions.find(action => 
      action.start_id >= currentEndTime && action.start_id <= twoSecondsLater
    );
    
    if (opponentResponse) {
      // 对手在2秒内有回应，认为当前动作成功
      return true;
    }
    
    // 2秒内对手没有回应，查找2秒后对手的下一个动作
    const opponentNextAction = opponentActions.find(action => 
      action.start_id > twoSecondsLater
    );
    
    if (opponentNextAction) {
      // 检查对手的下一个动作是否是サーブ（发球）
      const nextActionLabelId = Object.keys(actionLabels).find(key => 
        actionLabels[key] === opponentNextAction.label_names[0]
      );
      return nextActionLabelId === "0"; // "0" 对应 "サーブ"，说明当前选手得分了
    }
    
    // 查找当前选手自己的下一个动作
    const currentPlayerActions = allPlayers[currentPlayerIndex]?.actions || [];
    const currentPlayerNextAction = currentPlayerActions.find(action => 
      action.start_id > currentEndTime
    );
    
    if (currentPlayerNextAction) {
      // 检查自己的下一个动作是否是サーブ
      const nextActionLabelId = Object.keys(actionLabels).find(key => 
        actionLabels[key] === currentPlayerNextAction.label_names[0]
      );
      return nextActionLabelId === "0"; // 自己发球，说明上一个动作得分了
    }
    
    // 没有后续动作，认为失败
    return false;
  };
  
  // 获取当前选中的选手的动作
  const getCurrentPlayerActions = () => {
    if (!gts || !gts[activeTab]) return [];
    return gts[activeTab].actions || [];
  };
  
  // 准备当前选手的动作数据
  const currentActions = getCurrentPlayerActions();
  
  return (
    <div className="action-list">
      <h2>Action List</h2>
      
      {/* Tab切换区域 */}
      <div className="tab-container">
        <div className="tabs">
          <button 
            className={`tab ${activeTab === 0 ? 'active' : ''}`}
            onClick={() => setActiveTab(0)}
          >
            近处选手
          </button>
          <button 
            className={`tab ${activeTab === 1 ? 'active' : ''}`}
            onClick={() => setActiveTab(1)}
          >
            远处选手
          </button>
        </div>
      </div>
      
      {/* 动作列表 */}
      <ul>
        {currentActions.map((action, index) => {
          // 判断动作是否成功
          let statusIcon;
          if (gts && gts.length >= 2) {
            const isSuccess = checkActionSuccess(action, activeTab, gts);
            statusIcon = isSuccess ? "🟢" : "❌";
          } else {
            // 如果没有足够的选手数据，不做判断
            statusIcon = "⭕";
          }
          
          return (
            <li 
              key={index}
              onClick={() => handleClick(action.start_id)}
              className="action-item"
            >
              <span className="action-name">
                {statusIcon} {action.label_names && action.label_names[0]}
              </span>
              <span className="action-time">
                {frameToTime(action.start_id)} - {frameToTime(action.end_id)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActionList;
