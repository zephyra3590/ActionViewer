import React, { useState } from 'react';
import './PieChart2.css';

const PieChart2 = ({ gts, onActionClick, fps }) => {
  const [actionPanel, setActionPanel] = useState({
    visible: false,
    content: null,
    chartId: null,
    isHovered: false,
    position: { x: 0, y: 0 },
    isFixed: false // 新增：标识浮窗是否已被固定
  });
  
  // 提取动作名称的主要部分（括号前的部分）
  const extractActionType = (actionName) => {
    if (!actionName) return 'その他';
    
    // 移除括号及其内容
    const cleanName = actionName.split('(')[0].trim();
    return cleanName || 'その他';
  };
  
  // 检查一个动作是否是失分动作 - 使用ActionAnalyzer的逻辑
  const isLosingAction = (currentAction, playerActions) => {
    const currentEndTime = currentAction.end_id;
    const twoSecondsLater = currentEndTime + 2;
    
    // 按时间排序当前选手的所有动作
    const sortedActions = [...playerActions].sort((a, b) => a.start_id - b.start_id);
    
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
      // 2秒内有下一个动作，认为成功，不是失分
      return false;
    }
    
    // 2秒内没有动作，查找2秒后的下一个动作
    const nextActionAfter2Sec = sortedActions.find((action, index) => 
      index > currentIndex && action.start_id > twoSecondsLater
    );
    
    if (nextActionAfter2Sec) {
      // 检查动作名称是否包含"サーブ"（广义的发球动作）
      const actionName = nextActionAfter2Sec.label_names[0];
      // 如果下一个动作是发球，说明这个动作得分了，不是失分
      // 如果下一个动作不是发球，说明这个动作失分了
      return !(actionName && actionName.includes("サーブ"));
    }
    
    // 没有后续动作，检查当前动作名称
    const currentActionName = currentAction.label_names[0];
    if (currentActionName && currentActionName.includes("誤")) {
      // 动作名称包含"误"，判定为失误
      return true;
    }
    
    // 没有后续动作且不包含"误"，不算失分
    return false;
  };
  
  // 获取某个动作类型的所有失分动作详情
  const getLosingActionDetails = (actionType, actions) => {
    if (!actions || actions.length === 0) return [];
    
    // 找出所有失分动作
    const losingActions = actions.filter(action => {
      if (!isLosingAction(action, actions)) return false;
      if (!action.label_names || !action.label_names[0]) return false;
      
      const currentActionType = extractActionType(action.label_names[0]);
      return currentActionType === actionType;
    });
    
    return losingActions.map(action => ({
      ...action,
      timeInSeconds: action.start_id ? Math.round(action.start_id * 10) / 10 : 0,
      fullName: action.label_names[0]
    }));
  };
  
  // 关闭面板的处理函数
  const handlePanelClose = () => {
    setActionPanel({
      visible: false,
      content: null,
      chartId: null,
      isHovered: false,
      position: { x: 0, y: 0 },
      isFixed: false // 重置固定状态
    });
  };
  
  // ESC键关闭面板
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape' && actionPanel.visible) {
        handlePanelClose();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [actionPanel.visible]);
  
  // 动作项点击处理函数
  const handleActionItemClick = (action, event) => {
    event.stopPropagation(); // 阻止事件冒泡
    if (onActionClick) {
      onActionClick(action.start_id);
    }
  };
  
  // 计算选手的失分动作分布
  const calculateLosingActionDistribution = (actions) => {
    if (!actions || actions.length === 0) return [];
    
    // 找出所有失分动作
    const losingActions = actions.filter(action => isLosingAction(action, actions));
    
    if (losingActions.length === 0) return [];
    
    // 按动作类型分组统计
    const actionCounts = {};
    losingActions.forEach(action => {
      if (action.label_names && action.label_names[0]) {
        const actionType = extractActionType(action.label_names[0]);
        actionCounts[actionType] = (actionCounts[actionType] || 0) + 1;
      }
    });
    
    // 转换为饼图数据格式
    const total = losingActions.length;
    const pieData = Object.entries(actionCounts).map(([actionType, count]) => ({
      label: actionType,
      value: count,
      percentage: Math.round((count / total) * 100)
    }));
    
    // 按数量排序
    return pieData.sort((a, b) => b.value - a.value);
  };
  
  // 生成失分动作饼图颜色（使用和得分图表一样的颜色）
  const generateLosingColors = (count) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#A55EEA', '#26DE81', '#FD79A8', '#FDCB6E', '#6C5CE7'
    ];
    return colors.slice(0, count);
  };
  
  // 创建SVG路径
  const createPieSlice = (centerX, centerY, radius, startAngle, endAngle, color) => {
    const start = polarToCartesian(centerX, centerY, radius, endAngle);
    const end = polarToCartesian(centerX, centerY, radius, startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";
    
    const d = [
      "M", centerX, centerY,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ");
    
    return d;
  };
  
  // 极坐标转笛卡尔坐标
  const polarToCartesian = (centerX, centerY, radius, angleInDegrees) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0;
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    };
  };
  
  // 如果没有数据，显示空状态
  if (!gts || gts.length < 2) {
    return (
      <div className="pie-charts2">
        <h2>失点動作分布</h2>
        <div className="empty-state">
          データがありません
        </div>
      </div>
    );
  }
  
  const player1Actions = gts[0].actions || [];
  const player2Actions = gts[1].actions || [];
  
  const player1LosingData = calculateLosingActionDistribution(player1Actions);
  const player2LosingData = calculateLosingActionDistribution(player2Actions);
  
  const renderPieChart = (data, title, playerId) => {
    if (!data || data.length === 0) {
      return (
        <div className="pie-chart-container2">
          <h3>{title}</h3>
          <div className="no-data">失点データなし</div>
        </div>
      );
    }
    
    const colors = generateLosingColors(data.length);
    const centerX = 213; // 320 * 2/3 ≈ 213
    const centerY = 213; // 320 * 2/3 ≈ 213
    const radius = 160;  // 240 * 2/3 = 160
    
    let currentAngle = 0;
    
    const handleMouseEnter = (item, event) => {
      // 如果浮窗已被固定，则不响应鼠标悬停
      if (actionPanel.isFixed) return;
      
      // 获取鼠标位置
      const rect = event.currentTarget.getBoundingClientRect();
      const mouseX = event.clientX;
      const mouseY = event.clientY;
      
      // 获取该动作类型的所有失分动作详情
      const playerActions = playerId === 'player1' ? gts[0].actions : gts[1].actions;
      const actionDetails = getLosingActionDetails(item.label, playerActions);
      
      setActionPanel({
        visible: true,
        content: {
          actionType: item.label,
          actions: actionDetails,
          playerTitle: playerId === 'player1' ? '手前の選手' : '奥の選手',
          summary: {
            value: item.value,
            percentage: item.percentage,
            total: data.reduce((sum, d) => sum + d.value, 0)
          }
        },
        chartId: playerId,
        isHovered: true,
        position: { x: mouseX, y: mouseY },
        isFixed: false // 悬停状态下不是固定的
      });
    };

    const handleMouseMove = (item, event) => {
      // 如果浮窗已被固定，则不响应鼠标移动
      if (actionPanel.isFixed) return;
      
      // 只有在悬停状态下才更新位置
      if (actionPanel.isHovered && actionPanel.visible && !actionPanel.isFixed) {
        const mouseX = event.clientX;
        const mouseY = event.clientY;
        
        setActionPanel(prev => ({
          ...prev,
          position: { x: mouseX, y: mouseY }
        }));
      }
    };
    
    const handleMouseLeave = () => {
      // 如果浮窗已被固定，则不响应鼠标离开
      if (actionPanel.isFixed) return;
      
      // 只有在悬停状态下才隐藏面板
      if (actionPanel.isHovered && !actionPanel.isFixed) {
        setActionPanel({
          visible: false,
          content: null,
          chartId: null,
          isHovered: false,
          position: { x: 0, y: 0 },
          isFixed: false
        });
      }
    };
    
    const handleSliceClick = (item, event) => {
      event.stopPropagation();
      
      // 获取该动作类型的所有失分动作详情
      const playerActions = playerId === 'player1' ? gts[0].actions : gts[1].actions;
      const actionDetails = getLosingActionDetails(item.label, playerActions);
      
      setActionPanel({
        visible: true,
        content: {
          actionType: item.label,
          actions: actionDetails,
          playerTitle: playerId === 'player1' ? '手前の選手' : '奥の選手',
          summary: {
            value: item.value,
            percentage: item.percentage,
            total: data.reduce((sum, d) => sum + d.value, 0)
          }
        },
        chartId: playerId,
        isHovered: false, // 点击状态
        position: { x: 0, y: 0 }, // 点击时使用固定位置
        isFixed: true // 点击后设置为固定状态
      });
    };
    
    return (
      <div className="pie-chart-container2">
        <h3>{title}</h3>
        <div className="pie-chart-content2">
          <div className="pie-chart-wrapper2">
            <svg width="427" height="427" className="pie-chart-svg2">
              {data.map((item, index) => {
                const sliceAngle = (item.percentage / 100) * 360;
                const startAngle = currentAngle;
                const endAngle = currentAngle + sliceAngle;
                
                const path = createPieSlice(
                  centerX, centerY, radius, 
                  startAngle, endAngle, colors[index]
                );
                
                currentAngle += sliceAngle;
                
                return (
                  <path
                    key={index}
                    d={path}
                    fill={colors[index]}
                    stroke="#fff"
                    strokeWidth="3"
                    className="pie-slice2"
                    onMouseEnter={(e) => handleMouseEnter(item, e)}
                    onMouseMove={(e) => handleMouseMove(item, e)}
                    onMouseLeave={handleMouseLeave}
                    onClick={(e) => handleSliceClick(item, e)}
                  />
                );
              })}
            </svg>
          </div>
          
          <div className="total-losses">
            総失点: {data.reduce((sum, item) => sum + item.value, 0)}回
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <div className="pie-charts2" onClick={() => {
      // 点击外部区域关闭动作面板（仅当不是悬停状态时）
      if (!actionPanel.isHovered) {
        setActionPanel({
          visible: false,
          content: null,
          chartId: null,
          isHovered: false,
          position: { x: 0, y: 0 },
          isFixed: false
        });
      }
    }}>
      <h2>失点動作分布</h2>
      <div className="usage-instructions2">
        切片にマウスを合わせると詳細表示 | 
        クリックすると固定表示 | 
        Escキーまたは×ボタンで閉じる
      </div>
      <div className="charts-container2">
        {renderPieChart(player1LosingData, "手前の選手", "player1")}
        {renderPieChart(player2LosingData, "奥の選手", "player2")}
      </div>
      
      {/* 动态位置的面板 */}
      {actionPanel.visible && actionPanel.content && (
        <div 
          className={actionPanel.isHovered ? "action-panel-hover2" : "action-panel-fixed2"}
          style={actionPanel.isHovered ? {
            position: 'fixed',
            left: `${Math.min(actionPanel.position.x + 10, window.innerWidth - 320)}px`,
            top: `${Math.min(actionPanel.position.y + 10, window.innerHeight - 400)}px`,
            zIndex: 1002
          } : {}}
        >
          <div className="action-panel-header2">
            <h4>{actionPanel.content.playerTitle} - {actionPanel.content.actionType} (失点)</h4>
            <button className="close-btn2" onClick={handlePanelClose}>×</button>
          </div>
          
          <div className="action-panel-summary2">
            <div className="summary-stats2">
              <span>失点回数: {actionPanel.content.summary.value}回</span>
              <span>割合: {actionPanel.content.summary.percentage}%</span>
              <span>総失点: {actionPanel.content.summary.total}回</span>
            </div>
            {actionPanel.isHovered && !actionPanel.isFixed && (
              <div className="hover-hint2">クリックで固定表示</div>
            )}
          </div>
          
          <div className="action-panel-content2">
            {actionPanel.content.actions.length > 0 ? (
              <div className="action-list2">
                {actionPanel.content.actions.map((action, index) => (
                  <div 
                    key={index}
                    className="action-item2"
                    onClick={(e) => handleActionItemClick(action, e)}
                  >
                    <div className="action-time">{Math.floor(action.timeInSeconds / 60)}:{String(Math.floor(action.timeInSeconds % 60)).padStart(2, '0')}</div>
                    <div className="action-name2">{action.fullName}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-actions2">この動作の失点データがありません</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PieChart2;
