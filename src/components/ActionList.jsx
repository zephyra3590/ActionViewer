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
  const checkActionSuccess = (currentAction, currentPlayerActions) => {
    const currentEndTime = currentAction.end_id;
    const twoSecondsLater = currentEndTime + 2;
    
    // 按时间排序当前选手的所有动作
    const sortedActions = [...currentPlayerActions].sort((a, b) => a.start_id - b.start_id);
    
    // 找到当前动作在排序后数组中的索引
    const currentIndex = sortedActions.findIndex(action => 
      action.start_id === currentAction.start_id && 
      action.end_id === currentAction.end_id &&
      action.label_names[0] === currentAction.label_names[0]
    );
    
    // 查找当前选手自己在2秒内的下一个动作
    const nextActionWithin2Sec = sortedActions.find((action, index) => 
      index > currentIndex && action.start_id <= twoSecondsLater
    );
    
    if (nextActionWithin2Sec) {
      // 2秒内有下一个动作，认为成功
      return 'success';
    }
    
    // 2秒内没有动作，查找2秒后的下一个动作
    const nextActionAfter2Sec = sortedActions.find((action, index) => 
      index > currentIndex && action.start_id > twoSecondsLater
    );
    
    if (nextActionAfter2Sec) {
      // 检查动作名称是否包含"サーブ"（广义的发球动作）
      const actionName = nextActionAfter2Sec.label_names[0];
      return actionName && actionName.includes("サーブ") ? 'success' : 'failure';
    }
    
    // 没有后续动作，检查当前动作名称
    const currentActionName = currentAction.label_names[0];
    if (currentActionName && currentActionName.includes("誤")) {
      // 动作名称包含"误"，判定为失误
      return 'failure';
    }
    
    // 没有后续动作且不包含"误"，不做判定
    return 'no_judgment';
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
          const result = checkActionSuccess(action, currentActions);
          let statusIcon;
          
          switch(result) {
            case 'success':
              statusIcon = "🟢";
              break;
            case 'failure':
              statusIcon = "❌";
              break;
            case 'no_judgment':
              statusIcon = "⭕";
              break;
            default:
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
