import React, { useState } from 'react';
import styles from './ActionList.module.css';
import { 
  analyzeActionSuccess, 
  getResultIcon, 
  formatFrameToTime 
} from '../utils/ActionAnalyzer';

const ActionList = ({ gts, onActionClick, fps }) => {
  // 添加状态管理当前选中的Tab
  const [activeTab, setActiveTab] = useState(0);
  
  const handleClick = (startFrame) => {
    onActionClick(startFrame);
  };
  
  // 新增：直接格式化秒数为时间显示的函数
  const formatSecondsToTime = (seconds) => {
    if (!seconds || seconds < 0) return "0:00";
    
    const totalSeconds = Math.floor(seconds);
    const minutes = Math.floor(totalSeconds / 60);
    const remainingSeconds = totalSeconds % 60;
    
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // 获取当前选中的选手的动作
  const getCurrentPlayerActions = () => {
    if (!gts || !gts[activeTab]) return [];
    return gts[activeTab].actions || [];
  };
  
  // 准备当前选手的动作数据
  const currentActions = getCurrentPlayerActions();
  
  return (
    <div className={styles['action-list']}>
      <h2>Action List</h2>
      
      {/* Tab切换区域 */}
      <div className={styles['tab-container']}>
        <div className={styles.tabs}>
          <button 
            className={`${styles.tab} ${activeTab === 0 ? styles.active : ''}`}
            onClick={() => setActiveTab(0)}
          >
            手前の選手
          </button>
          <button 
            className={`${styles.tab} ${activeTab === 1 ? styles.active : ''}`}
            onClick={() => setActiveTab(1)}
          >
            奥の選手
          </button>
        </div>
      </div>
      
      {/* 动作列表 */}
      <ul>
        {currentActions.map((action, index) => {
          // 使用工具函数判断动作是否成功
          const result = analyzeActionSuccess(action, currentActions);
          const statusIcon = getResultIcon(result);
          
          return (
            <li 
              key={index}
              onClick={() => handleClick(action.start_id)}
              className={styles['action-item']}
            >
              <span className={styles['action-name']}>
                {statusIcon} {action.label_names && action.label_names[0]}
              </span>
              <span className={styles['action-time']}>
                {formatSecondsToTime(action.start_id)} - {formatSecondsToTime(action.end_id)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default ActionList;
