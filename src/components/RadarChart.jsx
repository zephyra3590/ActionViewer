import { useEffect, useRef, useState, useCallback } from 'react';
import './RadarChart.css';

const RadarChart = ({ actions, onActionClick }) => {
  const canvasRef = useRef(null);
  const [hoveredPoint, setHoveredPoint] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [tooltipData, setTooltipData] = useState(null);
  const [selectedActionType, setSelectedActionType] = useState(null);
  
  // 动作类型映射
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

  // 状态变化监控（用于调试）
  useEffect(() => {
    console.log('State changed - selectedActionType:', selectedActionType, 'tooltipData:', !!tooltipData);
  }, [selectedActionType, tooltipData]);

  // 计算动作成功率
  const calculateSuccessRates = (actions) => {
    if (!actions || actions.length === 0) return {};
    
    // 按时间排序动作
    const sortedActions = [...actions].sort((a, b) => a.start_id - b.start_id);
    
    const actionStats = {};
    
    // 初始化统计
    Object.keys(actionLabels).forEach(key => {
      actionStats[key] = { 
        total: 0, 
        success: 0, 
        rate: 0,
        actions: [] // 存储该类型的所有动作
      };
    });
    
    // 分析每个动作
    sortedActions.forEach((action, index) => {
      // 获取动作标签ID
      let labelId = null;
      if (action.label_names && action.label_names[0]) {
        // 通过标签名称找到对应的ID
        labelId = Object.keys(actionLabels).find(key => 
          actionLabels[key] === action.label_names[0]
        );
      }
      
      if (!labelId) return;
      
      // 检查是否是最后一个动作
      const isLastAction = index === sortedActions.length - 1;
      
      // 将动作添加到对应类型的列表中（包括最后一个动作，用于显示）
      actionStats[labelId].actions.push({
        ...action,
        isSuccess: isLastAction ? null : checkActionSuccess(action, sortedActions, index),
        isLastAction: isLastAction
      });
      
      // 如果是最后一个动作，完全不计入统计
      if (isLastAction) {
        return;
      }
      
      // 只有非最后一个动作才计入总数和成功数统计
      actionStats[labelId].total++;
      
      // 检查是否成功
      const isSuccess = checkActionSuccess(action, sortedActions, index);
      if (isSuccess) {
        actionStats[labelId].success++;
      }
    });
    
    // 计算成功率
    Object.keys(actionStats).forEach(key => {
      if (actionStats[key].total > 0) {
        actionStats[key].rate = (actionStats[key].success / actionStats[key].total) * 100;
      }
    });
    
    return actionStats;
  };
  
  // 检查动作是否成功
  const checkActionSuccess = (currentAction, allActions, currentIndex) => {
    const currentEndTime = currentAction.end_id;
    const twoSecondsLater = currentEndTime + 2;
    
    // 查找2秒内的下一个动作
    const nextActionWithin2Sec = allActions.find((action, index) => 
      index > currentIndex && action.start_id <= twoSecondsLater
    );
    
    if (nextActionWithin2Sec) {
      // 2秒内有下一个动作，认为成功
      return true;
    }
    
    // 2秒内没有动作，查找2秒后的下一个动作
    const nextActionAfter2Sec = allActions.find((action, index) => 
      index > currentIndex && action.start_id > twoSecondsLater
    );
    
    if (nextActionAfter2Sec) {
      // 检查是否是サーブ动作
      const nextActionLabelId = Object.keys(actionLabels).find(key => 
        actionLabels[key] === nextActionAfter2Sec.label_names[0]
      );
      return nextActionLabelId === "0"; // "0" 对应 "サーブ"
    }
    
    // 没有后续动作，认为失败
    return false;
  };

  // 检测鼠标是否在数据点附近
  const getHoveredPoint = useCallback((mouseX, mouseY, centerX, centerY, radius, successRates) => {
    const actionKeys = Object.keys(actionLabels);
    const angleStep = (2 * Math.PI) / actionKeys.length;
    const hoverRadius = 15; // 悬停检测半径
    
    for (let i = 0; i < actionKeys.length; i++) {
      const key = actionKeys[i];
      const angle = i * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      const distance = Math.sqrt((mouseX - x) ** 2 + (mouseY - y) ** 2);
      
      if (distance <= hoverRadius) {
        return {
          index: i,
          key: key,
          actionName: actionLabels[key],
          rate: rate,
          total: successRates[key] ? successRates[key].total : 0,
          success: successRates[key] ? successRates[key].success : 0,
          actions: successRates[key] ? successRates[key].actions : []
        };
      }
    }
    
    return null;
  }, []);

  // 处理鼠标移动
  const handleMouseMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    console.log('Mouse move, selectedActionType:', selectedActionType);
    
    // 如果有选中的动作类型，不处理悬停
    if (selectedActionType) {
      console.log('Selected action type exists, skipping hover logic');
      return;
    }
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // 调整坐标以匹配canvas的实际尺寸
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 120;
    
    const successRates = calculateSuccessRates(actions);
    const hoveredPoint = getHoveredPoint(canvasX, canvasY, centerX, centerY, radius, successRates);
    
    setHoveredPoint(hoveredPoint);
    setTooltipData(hoveredPoint);
    
    // 智能调整tooltip位置，避免超出屏幕边界
    if (hoveredPoint) {
      const tooltipWidth = 350;
      const tooltipHeight = 400;
      let tooltipX = event.clientX + 15;
      let tooltipY = event.clientY - 10;
      
      // 防止tooltip超出右边界
      if (tooltipX + tooltipWidth > window.innerWidth) {
        tooltipX = event.clientX - tooltipWidth - 15;
      }
      
      // 防止tooltip超出底部边界
      if (tooltipY + tooltipHeight > window.innerHeight) {
        tooltipY = event.clientY - tooltipHeight + 10;
      }
      
      // 防止tooltip超出顶部边界
      if (tooltipY < 0) {
        tooltipY = 10;
      }
      
      setMousePos({ x: tooltipX, y: tooltipY });
    }
  }, [actions, getHoveredPoint, selectedActionType]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    console.log('Mouse left canvas, selectedActionType:', selectedActionType);
    if (!selectedActionType) {
      setHoveredPoint(null);
      setTooltipData(null);
    }
    // 如果有选中状态，保持tooltip显示
  }, [selectedActionType]);

  // 时间格式化函数
  const frameToTime = (frame) => {
    const totalSeconds = frame;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // 处理动作点击
  const handleActionItemClick = (startFrame) => {
    if (onActionClick) {
      onActionClick(startFrame);
    }
    // 注意：点击动作项时不隐藏tooltip，保持固定状态
  };

  // 处理数据点点击（固定显示该动作类型）
  const handleDataPointClick = (pointData) => {
    console.log('Data point clicked:', pointData.actionName, 'Current selected:', selectedActionType);
    
    if (selectedActionType === pointData.key) {
      // 如果点击的是已选中的点，则取消选择
      console.log('Deselecting current action type');
      setSelectedActionType(null);
      setTooltipData(null);
      setHoveredPoint(null);
    } else {
      // 选择新的动作类型
      console.log('Selecting new action type:', pointData.key);
      setSelectedActionType(pointData.key);
      setTooltipData(pointData);
      setHoveredPoint(pointData); // 保持悬停状态以便绘制高亮
      
      // 设置固定tooltip的位置（屏幕中央偏右上）
      const fixedX = window.innerWidth * 0.76;
      const fixedY = window.innerHeight * 0.3;
      setMousePos({ x: fixedX, y: fixedY });
      console.log('Tooltip fixed at:', fixedX, fixedY);
    }
  };

  // 处理点击事件
  const handleCanvasClick = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const canvasX = x * scaleX;
    const canvasY = y * scaleY;
    
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 120;
    
    const successRates = calculateSuccessRates(actions);
    const clickedPoint = getHoveredPoint(canvasX, canvasY, centerX, centerY, radius, successRates);
    
    if (clickedPoint) {
      event.preventDefault();
      event.stopPropagation();
      handleDataPointClick(clickedPoint);
    } else {
      // 点击空白区域，取消选择
      setSelectedActionType(null);
      setTooltipData(null);
      setHoveredPoint(null);
    }
  }, [actions, getHoveredPoint]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 添加事件监听器
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);

    // 添加键盘事件监听器
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        setSelectedActionType(null);
        setTooltipData(null);
        setHoveredPoint(null);
      }
    };
    
    document.addEventListener('keydown', handleKeyPress);

    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      canvas.removeEventListener('click', handleCanvasClick);
      document.removeEventListener('keydown', handleKeyPress);
    };
  }, [handleMouseMove, handleMouseLeave, handleCanvasClick]);
  
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX, centerY) - 120; // 增加边距为标签留出更多空间
    
    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 获取成功率数据
    const successRates = calculateSuccessRates(actions);
    const actionKeys = Object.keys(actionLabels);
    const angleStep = (2 * Math.PI) / actionKeys.length;
    
    // 绘制背景网格
    drawGrid(ctx, centerX, centerY, radius, actionKeys.length);
    
    // 绘制改进的标签
    drawImprovedLabels(ctx, centerX, centerY, radius, actionKeys, angleStep, successRates);
    
    // 绘制数据
    drawData(ctx, centerX, centerY, radius, successRates, actionKeys, angleStep, hoveredPoint, selectedActionType);
    
  }, [actions, hoveredPoint, selectedActionType]);
  
  const drawGrid = (ctx, centerX, centerY, radius, numAxes) => {
    ctx.strokeStyle = '#ddd';
    ctx.lineWidth = 1;
    
    // 绘制同心圆
    for (let i = 1; i <= 5; i++) {
      ctx.beginPath();
      ctx.arc(centerX, centerY, (radius * i) / 5, 0, 2 * Math.PI);
      ctx.stroke();
    }
    
    // 绘制轴线
    const angleStep = (2 * Math.PI) / numAxes;
    for (let i = 0; i < numAxes; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
      ctx.stroke();
    }
    
    // 绘制百分比标记
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    for (let i = 1; i <= 5; i++) {
      const percentage = (i * 20) + '%';
      ctx.fillText(percentage, centerX + 5, centerY - (radius * i) / 5 + 3);
    }
  };
  
  const drawImprovedLabels = (ctx, centerX, centerY, radius, actionKeys, angleStep, successRates) => {
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      
      // 动态调整标签距离，避免重叠
      let labelRadius = radius + 60;
      
      // 对于顶部和底部的标签，增加更多距离
      if (Math.abs(Math.sin(angle)) > 0.7) {
        labelRadius = radius + 80;
      }
      
      // 对于左右两侧的标签，稍微增加距离
      if (Math.abs(Math.cos(angle)) > 0.7) {
        labelRadius = radius + 70;
      }
      
      const x = centerX + labelRadius * Math.cos(angle);
      const y = centerY + labelRadius * Math.sin(angle);
      
      // 获取该动作的总次数
      const totalCount = successRates[key] ? successRates[key].total : 0;
      
      // 动作名称和次数
      const actionName = actionLabels[key];
      const countText = `(${totalCount})`;
      
      // 智能对齐方式，根据标签位置调整
      let textAlign = 'center';
      let textBaseline = 'middle';
      let xOffset = 0;
      let yOffset = 0;
      
      // 根据角度调整对齐方式和偏移
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      
      if (cosAngle > 0.5) {
        // 右侧标签
        textAlign = 'left';
        xOffset = 5;
      } else if (cosAngle < -0.5) {
        // 左侧标签
        textAlign = 'right';
        xOffset = -5;
      }
      
      if (sinAngle > 0.5) {
        // 下方标签
        textBaseline = 'top';
        yOffset = 5;
      } else if (sinAngle < -0.5) {
        // 上方标签
        textBaseline = 'bottom';
        yOffset = -5;
      }
      
      // 设置文本对齐
      ctx.textAlign = textAlign;
      ctx.textBaseline = textBaseline;
      
      // 先测量完整文本的宽度来绘制背景
      ctx.font = 'bold 13px Arial';
      const actionNameMetrics = ctx.measureText(actionName);
      ctx.font = '11px Arial';
      const countMetrics = ctx.measureText(countText);
      
      // 计算总宽度（动作名称 + 空格 + 括号）
      const totalWidth = actionNameMetrics.width + 3 + countMetrics.width;
      const textHeight = 16;
      
      // 计算背景矩形的位置
      let bgX = x + xOffset;
      let bgY = y + yOffset;
      
      if (textAlign === 'center') {
        bgX = bgX - totalWidth / 2;
      } else if (textAlign === 'right') {
        bgX = bgX - totalWidth;
      }
      
      if (textBaseline === 'middle') {
        bgY = bgY - textHeight / 2;
      } else if (textBaseline === 'bottom') {
        bgY = bgY - textHeight;
      }
      
      // 绘制白色半透明背景
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.fillRect(bgX - 4, bgY - 2, totalWidth + 8, textHeight + 4);
      
      // 绘制边框
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
      ctx.lineWidth = 1;
      ctx.strokeRect(bgX - 4, bgY - 2, totalWidth + 8, textHeight + 4);
      
      // 计算动作名称的起始位置
      let actionNameX = x + xOffset;
      if (textAlign === 'center') {
        actionNameX = x + xOffset - totalWidth / 2;
      } else if (textAlign === 'right') {
        actionNameX = x + xOffset - totalWidth;
      }
      
      // 绘制动作名称
      ctx.fillStyle = '#333';
      ctx.font = 'bold 13px Arial';
      ctx.textAlign = 'left'; // 强制左对齐来精确控制位置
      ctx.fillText(actionName, actionNameX, y + yOffset);
      
      // 绘制次数（紧跟在动作名称后面）
      ctx.fillStyle = '#666';
      ctx.font = '11px Arial';
      const countX = actionNameX + actionNameMetrics.width + 3;
      ctx.fillText(countText, countX, y + yOffset);
    });
  };
  
  const drawData = (ctx, centerX, centerY, radius, successRates, actionKeys, angleStep, hoveredPoint, selectedActionType) => {
    // 绘制数据多边形
    ctx.strokeStyle = '#4CAF50';
    ctx.fillStyle = 'rgba(76, 175, 80, 0.2)';
    ctx.lineWidth = 2;
    
    ctx.beginPath();
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // 绘制数据点和数值
    actionKeys.forEach((key, index) => {
      const angle = index * angleStep - Math.PI / 2;
      const rate = successRates[key] ? successRates[key].rate : 0;
      const dataRadius = (radius * rate) / 100;
      const x = centerX + dataRadius * Math.cos(angle);
      const y = centerY + dataRadius * Math.sin(angle);
      
      // 检查是否是悬停点或选中点
      const isHovered = hoveredPoint && hoveredPoint.index === index;
      const isSelected = selectedActionType === key;
      
      // 绘制数据点
      if (isSelected) {
        // 选中状态：紫色大圆点
        ctx.fillStyle = '#9C27B0';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, 2 * Math.PI);
        ctx.fill();
        
        // 外圈动画效果
        ctx.strokeStyle = '#9C27B0';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, 2 * Math.PI);
        ctx.stroke();
      } else if (isHovered) {
        // 悬停状态：橙色圆点
        ctx.fillStyle = '#FF5722';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, 2 * Math.PI);
        ctx.fill();
        
        // 外圈
        ctx.strokeStyle = '#FF5722';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(x, y, 10, 0, 2 * Math.PI);
        ctx.stroke();
      } else {
        // 普通状态：绿色圆点
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
      
      // 显示数值（只有当数值大于0时才显示）
      if (rate > 0) {
        // 为数值添加背景以提高可读性
        const valueText = rate.toFixed(1) + '%';
        ctx.font = '11px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const valueMetrics = ctx.measureText(valueText);
        const valueWidth = valueMetrics.width;
        const valueHeight = 12;
        
        // 计算数值标签的位置，避免与轴线重叠
        let valueX = x;
        let valueY = y - 15;
        
        // 如果数据点靠近中心，将标签向外移动
        if (dataRadius < radius * 0.3) {
          const labelOffset = 20;
          valueX = x + labelOffset * Math.cos(angle);
          valueY = y + labelOffset * Math.sin(angle);
        }
        
        // 绘制数值背景
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(valueX - valueWidth/2 - 3, valueY - valueHeight/2 - 1, valueWidth + 6, valueHeight + 2);
        
        // 绘制数值边框
        ctx.strokeStyle = 'rgba(76, 175, 80, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(valueX - valueWidth/2 - 3, valueY - valueHeight/2 - 1, valueWidth + 6, valueHeight + 2);
        
        // 绘制数值文本
        let textColor = '#2E7D32';
        if (isSelected) {
          textColor = '#9C27B0';
        } else if (isHovered) {
          textColor = '#FF5722';
        }
        
        ctx.fillStyle = textColor;
        ctx.fillText(valueText, valueX, valueY);
        
        // 恢复样式
        ctx.fillStyle = '#4CAF50';
      }
    });
  };
  
  return (
    <div className="radar-chart">
      <h2>動作成功率の分析</h2>
      
      {/* 使用说明 */}
      <div style={{
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        border: '1px solid rgba(76, 175, 80, 0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#2E7D32'
      }}>
        <strong>使用方法:</strong> 
        データポイントにマウスを合わせると詳細表示 | 
        クリックすると固定表示 | 
        Escキーまたは×ボタンで閉じる
        
        {/* Debug状态显示 */}
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
          [Debug] 選択中: {selectedActionType || 'なし'} | 
          Tooltip: {tooltipData ? 'あり' : 'なし'}
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={700} 
          height={600}
          className="radar-canvas"
          style={{ cursor: hoveredPoint || selectedActionType ? 'pointer' : 'default' }}
        />
        
        {/* 悬停tooltip */}
        {tooltipData && (
          <div 
            className="radar-tooltip"
            style={{
              position: 'fixed',
              left: selectedActionType ? mousePos.x : mousePos.x,
              top: selectedActionType ? mousePos.y : mousePos.y,
              transform: selectedActionType ? 'translate(-50%, -50%)' : 'none',
              backgroundColor: selectedActionType ? 'rgba(156, 39, 176, 0.95)' : 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13px',
              pointerEvents: selectedActionType ? 'auto' : 'none', // 只有在固定时才允许交互
              zIndex: 1000,
              boxShadow: selectedActionType 
                ? '0 12px 48px rgba(156, 39, 176, 0.4)' 
                : '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '280px',
              maxWidth: selectedActionType ? '450px' : '380px',
              maxHeight: selectedActionType ? '500px' : '450px',
              overflowY: 'auto',
              border: selectedActionType 
                ? '3px solid rgba(156, 39, 176, 0.5)' 
                : '2px solid rgba(255, 87, 34, 0.3)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              // 添加一些额外的样式确保可见性
              opacity: 1,
              visibility: 'visible'
            }}
          >
            {/* Debug信息 */}
            {selectedActionType && (
              <div style={{ 
                position: 'absolute', 
                top: '-20px', 
                left: '0', 
                fontSize: '10px', 
                color: '#4CAF50',
                backgroundColor: 'rgba(0,0,0,0.8)',
                padding: '2px 6px',
                borderRadius: '3px'
              }}>
                固定中: {selectedActionType}
              </div>
            )}
            
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '12px', 
              borderBottom: selectedActionType ? '2px solid #9C27B0' : '2px solid #FF5722', 
              paddingBottom: '8px',
              color: selectedActionType ? '#E1BEE7' : '#FF5722',
              fontSize: selectedActionType ? '18px' : '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{tooltipData.actionName}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#ccc',
                  fontWeight: 'normal'
                }}>
                  {tooltipData.actions.length}回
                </span>
                {selectedActionType && (
                  <button
                    onClick={() => {
                      setSelectedActionType(null);
                      setTooltipData(null);
                      setHoveredPoint(null);
                    }}
                    style={{
                      background: 'none',
                      border: '1px solid #ccc',
                      color: '#ccc',
                      borderRadius: '50%',
                      width: '24px',
                      height: '24px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="閉じる (Esc)"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
            
            <div style={{ 
              marginBottom: '12px', 
              fontSize: '14px', 
              color: '#4CAF50',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'rgba(76, 175, 80, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(76, 175, 80, 0.3)'
            }}>
              成功率: {tooltipData.rate.toFixed(1)}% 
              <span style={{ color: '#ccc', fontWeight: 'normal', marginLeft: '8px' }}>
                ({tooltipData.success}/{tooltipData.total})
              </span>
            </div>
            
            {tooltipData.actions.length > 0 && (
              <>
                <div style={{ 
                  fontWeight: 'bold', 
                  marginBottom: '8px', 
                  fontSize: '13px',
                  color: '#FFF',
                  borderBottom: '1px solid #444',
                  paddingBottom: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>動作リスト:</span>
                  {selectedActionType && (
                    <span style={{ 
                      fontSize: '11px', 
                      color: '#999',
                      fontWeight: 'normal'
                    }}>
                      クリックで固定表示中
                    </span>
                  )}
                </div>
                <div style={{ 
                  maxHeight: selectedActionType ? '350px' : '280px', 
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {tooltipData.actions
                    .sort((a, b) => a.start_id - b.start_id) // 按时间排序
                    .map((action, index) => {
                    let statusIcon;
                    let statusColor;
                    if (action.isLastAction) {
                      statusIcon = "⭕";
                      statusColor = "#FFC107";
                    } else {
                      statusIcon = action.isSuccess ? "🟢" : "❌";
                      statusColor = action.isSuccess ? "#4CAF50" : "#F44336";
                    }
                    
                    return (
                      <div 
                        key={index}
                        onClick={(e) => {
                          e.stopPropagation(); // 防止事件冒泡
                          handleActionItemClick(action.start_id);
                        }}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          padding: '8px 10px',
                          marginBottom: '4px',
                          backgroundColor: 'rgba(255, 255, 255, 0.08)',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          transition: 'all 0.2s ease',
                          border: '1px solid rgba(255, 255, 255, 0.1)',
                          position: 'relative'
                        }}
                        onMouseEnter={(e) => {
                          const hoverColor = selectedActionType ? '#9C27B0' : '#FF5722';
                          e.currentTarget.style.backgroundColor = `rgba(${selectedActionType ? '156, 39, 176' : '255, 87, 34'}, 0.2)`;
                          e.currentTarget.style.borderColor = hoverColor;
                          e.currentTarget.style.transform = 'translateX(4px)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                          e.currentTarget.style.transform = 'translateX(0px)';
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                          <span style={{ 
                            marginRight: '8px', 
                            fontSize: '14px',
                            filter: `drop-shadow(0 0 2px ${statusColor})`
                          }}>
                            {statusIcon}
                          </span>
                          <span style={{ 
                            fontWeight: '500',
                            color: '#FFF'
                          }}>
                            {action.label_names && action.label_names[0]}
                          </span>
                        </div>
                        <div style={{ 
                          color: '#bbb', 
                          fontSize: '11px',
                          textAlign: 'right',
                          lineHeight: '1.2'
                        }}>
                          <div>{frameToTime(action.start_id)} - {frameToTime(action.end_id)}</div>
                          <div style={{ color: '#888', fontSize: '10px' }}>
                            {action.end_id - action.start_id}秒
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            
            <div style={{ 
              marginTop: '12px', 
              fontSize: '11px', 
              color: '#888',
              borderTop: '1px solid #444',
              paddingTop: '8px',
              textAlign: 'center',
              fontStyle: 'italic'
            }}>
              {selectedActionType ? (
                <>
                  💡 クリックして録画の該当時間に移動 | 
                  <span style={{ color: '#E1BEE7' }}> クリックまたはEscで閉じる</span>
                </>
              ) : (
                <>
                  💡 クリックして録画の該当時間に移動 | 
                  <span style={{ color: '#FF8A65' }}> データポイントをクリックで固定表示</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RadarChart;
