import { useEffect, useRef, useState, useCallback } from 'react';
import './PieChart.css';

const PieChart = ({ actions, onActionClick }) => {
  const canvasRef = useRef(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [selectedSlice, setSelectedSlice] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pieData, setPieData] = useState([]);
  const [colors, setColors] = useState([]);
  const [tooltipData, setTooltipData] = useState(null);

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

  // 检查动作是否成功（与 RadarChart 中相同的逻辑）
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

  // 计算失误组合统计
  const calculateFailureCombinations = (actions) => {
    if (!actions || actions.length === 0) return {};
    
    // 按时间排序动作
    const sortedActions = [...actions].sort((a, b) => a.start_id - b.start_id);
    
    const failureCombinations = {};
    
    // 分析每个动作
    sortedActions.forEach((action, index) => {
      // 获取动作标签名称
      const currentActionName = action.label_names && action.label_names[0];
      if (!currentActionName) return;
      
      // 检查是否是最后一个动作
      const isLastAction = index === sortedActions.length - 1;
      
      // 如果是最后一个动作，跳过失误统计（作为例外不做判断）
      if (isLastAction) {
        return;
      }
      
      // 检查当前动作是否失误
      const isSuccess = checkActionSuccess(action, sortedActions, index);
      
      if (!isSuccess) {
        // 当前动作是失误，检查前一个动作是否是成功的
        if (index > 0) {
          const prevAction = sortedActions[index - 1];
          
          // 检查前一个动作是否是最后一个动作
          const isPrevLastAction = (index - 1) === sortedActions.length - 1;
          
          let prevActionSuccess;
          if (isPrevLastAction) {
            // 如果前一个动作是最后一个，假设成功
            prevActionSuccess = true;
          } else {
            prevActionSuccess = checkActionSuccess(prevAction, sortedActions, index - 1);
          }
          
          // 只有当前一个动作是成功的时候，才记录失误组合
          if (prevActionSuccess) {
            const prevActionName = prevAction.label_names && prevAction.label_names[0];
            const combinationKey = `${prevActionName} → ${currentActionName}`;
            
            // 存储详细信息
            if (!failureCombinations[combinationKey]) {
              failureCombinations[combinationKey] = {
                count: 0,
                actions: []
              };
            }
            failureCombinations[combinationKey].count++;
            failureCombinations[combinationKey].actions.push({
              prevAction: prevAction,
              currentAction: action,
              isSuccess: false,
              isLastAction: false
            });
          }
          // 如果前一个动作也是失误，则不记录任何组合
        }
        // 如果是第一个动作且失误，也不记录组合
      }
    });
    
    return failureCombinations;
  };

  // 处理数据，合并小于5%的组合为【その他】
  const processDataForPieChart = (failureCombinations) => {
    const totalFailures = Object.values(failureCombinations).reduce((sum, item) => sum + item.count, 0);
    
    if (totalFailures === 0) return [];
    
    const processedData = [];
    let othersCount = 0;
    let othersActions = [];
    
    Object.entries(failureCombinations).forEach(([combination, data]) => {
      const percentage = (data.count / totalFailures) * 100;
      
      if (percentage >= 5) {
        processedData.push({
          label: combination,
          count: data.count,
          percentage: percentage,
          actions: data.actions
        });
      } else {
        othersCount += data.count;
        othersActions.push(...data.actions);
      }
    });
    
    // 如果有小于5%的组合，添加【その他】
    if (othersCount > 0) {
      const othersPercentage = (othersCount / totalFailures) * 100;
      processedData.push({
        label: 'その他',
        count: othersCount,
        percentage: othersPercentage,
        actions: othersActions
      });
    }
    
    // 按百分比排序
    return processedData.sort((a, b) => b.percentage - a.percentage);
  };

  // 生成颜色
  const generateColors = (count) => {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
      '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
      '#F8C471', '#82E0AA', '#F1948A', '#85C1E9', '#D7DBDD'
    ];
    
    return colors.slice(0, count);
  };

  // 颜色加亮函数
  const lightenColor = useCallback((color, percent) => {
    if (!color || typeof color !== 'string') {
      return '#000000';
    }
    
    const cleanColor = color.startsWith('#') ? color : '#' + color;
    const num = parseInt(cleanColor.replace("#", ""), 16);
    
    if (isNaN(num)) {
      return '#000000';
    }
    
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const B = (num >> 8 & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
  }, []);

  // 检测鼠标是否在某个扇形内
  const getSliceAtPoint = useCallback((x, y, centerX, centerY, radius, currentPieData) => {
    const dx = x - centerX;
    const dy = y - centerY;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance > radius) return null;
    
    let angle = Math.atan2(dy, dx) + Math.PI / 2;
    if (angle < 0) angle += 2 * Math.PI;
    
    let currentAngle = 0;
    for (let i = 0; i < currentPieData.length; i++) {
      const sliceAngle = (currentPieData[i].percentage / 100) * 2 * Math.PI;
      if (angle >= currentAngle && angle <= currentAngle + sliceAngle) {
        return i;
      }
      currentAngle += sliceAngle;
    }
    
    return null;
  }, []);

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
  };

  // 处理切片点击（固定显示该切片）
  const handleSliceClick = (sliceIndex, sliceData) => {
    console.log('Slice clicked:', sliceIndex, 'Current selected:', selectedSlice);
    
    if (selectedSlice === sliceIndex) {
      // 如果点击的是已选中的切片，则取消选择
      console.log('Deselecting current slice');
      setSelectedSlice(null);
      setTooltipData(null);
      setHoveredSlice(null);
    } else {
      // 选择新的切片
      console.log('Selecting new slice:', sliceIndex);
      setSelectedSlice(sliceIndex);
      setTooltipData(sliceData);
      setHoveredSlice(sliceIndex);
      
      // 设置固定tooltip的位置（屏幕中央偏右上）
      const fixedX = window.innerWidth * 0.76;
      const fixedY = window.innerHeight * 0.3;
      setMousePos({ x: fixedX, y: fixedY });
    }
  };

  // 处理鼠标移动
  const pieDataRef = useRef(pieData);
  pieDataRef.current = pieData;

  const handleMouseMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 如果有选中的切片，不处理悬停
    if (selectedSlice !== null) {
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
    
    const centerX = canvas.width * 0.35;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX * 0.8, centerY * 0.8);
    
    const sliceIndex = getSliceAtPoint(canvasX, canvasY, centerX, centerY, radius, pieDataRef.current);
    
    setHoveredSlice(sliceIndex);
    
    if (sliceIndex !== null) {
      setTooltipData(pieDataRef.current[sliceIndex]);
      
      // 智能调整tooltip位置，避免超出屏幕边界
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
    } else {
      setTooltipData(null);
    }
  }, [getSliceAtPoint, selectedSlice]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    if (selectedSlice === null) {
      setHoveredSlice(null);
      setTooltipData(null);
    }
  }, [selectedSlice]);

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
    
    const centerX = canvas.width * 0.35;
    const centerY = canvas.height / 2;
    const radius = Math.min(centerX * 0.8, centerY * 0.8);
    
    const clickedSliceIndex = getSliceAtPoint(canvasX, canvasY, centerX, centerY, radius, pieData);
    
    if (clickedSliceIndex !== null) {
      event.preventDefault();
      event.stopPropagation();
      handleSliceClick(clickedSliceIndex, pieData[clickedSliceIndex]);
    } else {
      // 点击空白区域，取消选择
      setSelectedSlice(null);
      setTooltipData(null);
      setHoveredSlice(null);
    }
  }, [pieData, getSliceAtPoint]);

  // 第一个 useEffect：只处理数据计算和设置
  useEffect(() => {
    const failureCombinations = calculateFailureCombinations(actions);
    const processedData = processDataForPieChart(failureCombinations);
    const generatedColors = generateColors(processedData.length);
    
    const safeColors = generatedColors.length >= processedData.length 
      ? generatedColors 
      : [...generatedColors, ...Array(processedData.length - generatedColors.length).fill('#CCCCCC')];
    
    setPieData(processedData);
    setColors(safeColors);
  }, [actions]);

  // 第二个 useEffect：处理事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    canvas.addEventListener('click', handleCanvasClick);
    
    // 添加键盘事件监听器
    const handleKeyPress = (event) => {
      if (event.key === 'Escape') {
        setSelectedSlice(null);
        setTooltipData(null);
        setHoveredSlice(null);
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

  // 第三个 useEffect：处理绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth * 0.35;
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX * 0.8, centerY * 0.8);
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (pieData.length === 0) {
      ctx.fillStyle = '#666';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('失误データがありません', centerX, centerY);
      return;
    }
    
    if (colors.length === 0) {
      return;
    }
    
    // 绘制饼图
    let currentAngle = -Math.PI / 2;
    
    pieData.forEach((data, index) => {
      const sliceAngle = (data.percentage / 100) * 2 * Math.PI;
      const isHovered = hoveredSlice === index;
      const isSelected = selectedSlice === index;
      
      const baseColor = colors[index] || '#CCCCCC';
      
      // 选中状态优先于悬停状态
      const currentRadius = (isSelected || isHovered) ? radius * 1.1 : radius;
      const offsetX = (isSelected || isHovered) ? Math.cos(currentAngle + sliceAngle / 2) * 8 : 0;
      const offsetY = (isSelected || isHovered) ? Math.sin(currentAngle + sliceAngle / 2) * 8 : 0;
      
      // 绘制扇形
      let fillColor;
      if (isSelected) {
        fillColor = lightenColor(baseColor, 30); // 选中状态更亮
      } else if (isHovered) {
        fillColor = lightenColor(baseColor, 20); // 悬停状态稍亮
      } else {
        fillColor = baseColor;
      }
      
      ctx.fillStyle = fillColor;
      ctx.beginPath();
      ctx.moveTo(centerX + offsetX, centerY + offsetY);
      ctx.arc(centerX + offsetX, centerY + offsetY, currentRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // 绘制边框
      ctx.strokeStyle = isSelected ? '#9C27B0' : (isHovered ? '#FF5722' : '#fff');
      ctx.lineWidth = isSelected ? 5 : (isHovered ? 4 : 3);
      ctx.stroke();
      
      // 只有当百分比大于10%时才显示百分比标签
      if (data.percentage >= 10) {
        const labelAngle = currentAngle + sliceAngle / 2;
        const labelRadius = currentRadius * 0.65;
        const labelX = centerX + offsetX + labelRadius * Math.cos(labelAngle);
        const labelY = centerY + offsetY + labelRadius * Math.sin(labelAngle);
        
        // 添加文字背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.font = 'bold 14px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        const text = `${data.percentage.toFixed(1)}%`;
        const metrics = ctx.measureText(text);
        const textWidth = metrics.width;
        const textHeight = 16;
        
        // 绘制背景矩形
        ctx.fillRect(labelX - textWidth/2 - 4, labelY - textHeight/2 - 2, textWidth + 8, textHeight + 4);
        
        // 绘制白色文字
        ctx.fillStyle = '#fff';
        ctx.fillText(text, labelX, labelY);
      }
      
      currentAngle += sliceAngle;
    });
    
    // 绘制改进的图例
    drawImprovedLegend(ctx, pieData, colors, canvasWidth, canvasHeight, hoveredSlice, selectedSlice);
    
  }, [pieData, colors, hoveredSlice, selectedSlice, lightenColor]);

  const drawImprovedLegend = (ctx, pieData, colors, canvasWidth, canvasHeight, hoveredSlice = null, selectedSlice = null) => {
    const legendStartX = canvasWidth * 0.65;
    const legendStartY = 40;
    const lineHeight = 28;
    const maxWidth = canvasWidth - legendStartX - 20;
    const maxLegendHeight = canvasHeight - 80;
    
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 绘制图例标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('失误組合', legendStartX, legendStartY - 10);
    
    ctx.font = 'bold 13px Arial';
    
    const availableHeight = maxLegendHeight - 50;
    const maxVisibleItems = Math.floor(availableHeight / lineHeight);
    const visibleData = pieData.slice(0, maxVisibleItems);
    const hiddenItemsCount = pieData.length - maxVisibleItems;
    
    visibleData.forEach((data, index) => {
      const y = legendStartY + 20 + index * lineHeight;
      const isHovered = hoveredSlice === index;
      const isSelected = selectedSlice === index;
      
      const baseColor = colors[index] || '#CCCCCC';
      
      // 绘制颜色方块
      let rectColor;
      if (isSelected) {
        rectColor = lightenColor(baseColor, 30);
      } else if (isHovered) {
        rectColor = lightenColor(baseColor, 20);
      } else {
        rectColor = baseColor;
      }
      
      const rectSize = (isSelected || isHovered) ? 18 : 16;
      const rectOffset = (isSelected || isHovered) ? -1 : 0;
      
      ctx.fillStyle = rectColor;
      ctx.fillRect(legendStartX + rectOffset, y - 8 + rectOffset, rectSize, rectSize);
      
      // 绘制方块边框
      ctx.strokeStyle = isSelected ? '#9C27B0' : (isHovered ? '#FF5722' : '#333');
      ctx.lineWidth = isSelected ? 3 : (isHovered ? 2 : 1);
      ctx.strokeRect(legendStartX + rectOffset, y - 8 + rectOffset, rectSize, rectSize);
      
      // 准备文本
      const percentage = `${data.percentage.toFixed(1)}%`;
      const count = `(${data.count}回)`;
      let labelText = data.label;
      
      const textX = legendStartX + 25;
      ctx.fillStyle = isSelected ? '#9C27B0' : (isHovered ? '#FF5722' : '#333');
      ctx.font = isSelected ? 'bold 14px Arial' : (isHovered ? 'bold 14px Arial' : 'bold 13px Arial');
      
      // 测量文本宽度并进行截断
      const fullText = `${labelText} ${percentage} ${count}`;
      const fullTextWidth = ctx.measureText(fullText).width;
      
      if (fullTextWidth <= maxWidth) {
        ctx.fillText(fullText, textX, y);
      } else {
        const maxLabelWidth = maxWidth - ctx.measureText(`${percentage} ${count}`).width - 10;
        let truncatedLabel = labelText;
        
        while (ctx.measureText(truncatedLabel + '...').width > maxLabelWidth && truncatedLabel.length > 3) {
          truncatedLabel = truncatedLabel.slice(0, -1);
        }
        
        if (truncatedLabel.length < labelText.length) {
          truncatedLabel += '...';
        }
        
        ctx.fillText(truncatedLabel, textX, y - 6);
        
        ctx.font = (isSelected || isHovered) ? '12px Arial' : '11px Arial';
        ctx.fillStyle = (isSelected || isHovered) ? '#666' : '#666';
        ctx.fillText(`${percentage} ${count}`, textX, y + 8);
        ctx.font = isSelected ? 'bold 14px Arial' : (isHovered ? 'bold 14px Arial' : 'bold 13px Arial');
        ctx.fillStyle = isSelected ? '#9C27B0' : (isHovered ? '#FF5722' : '#333');
      }
    });
    
    if (hiddenItemsCount > 0) {
      const moreY = legendStartY + 20 + visibleData.length * lineHeight;
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText(`... 还有 ${hiddenItemsCount} 个项目`, legendStartX + 25, moreY);
    }
    
    const totalFailures = pieData.reduce((sum, data) => sum + data.count, 0);
    const totalY = Math.min(
      legendStartY + 30 + visibleData.length * lineHeight + (hiddenItemsCount > 0 ? 20 : 0),
      canvasHeight - 30
    );
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.fillText(`総失误数: ${totalFailures}回`, legendStartX, totalY);
  };

  return (
    <div className="pie-chart">
      <h2>失误組合の分析</h2>
      
      {/* 使用说明 */}
      <div style={{
        backgroundColor: 'rgba(255, 107, 107, 0.1)',
        border: '1px solid rgba(255, 107, 107, 0.3)',
        borderRadius: '6px',
        padding: '8px 12px',
        marginBottom: '16px',
        fontSize: '12px',
        color: '#C62828'
      }}>
        <strong>使用方法:</strong> 
        切片にマウスを合わせると詳細表示 | 
        クリックすると固定表示 | 
        Escキーまたは×ボタンで閉じる
        
        <div style={{ marginTop: '4px', fontSize: '10px', color: '#666' }}>
          [Debug] 選択中: {selectedSlice !== null ? `切片${selectedSlice}` : 'なし'} | 
          Tooltip: {tooltipData ? 'あり' : 'なし'}
        </div>
      </div>
      
      <div style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600}
          className="pie-canvas"
          style={{ cursor: (hoveredSlice !== null || selectedSlice !== null) ? 'pointer' : 'default' }}
        />
        
        {/* 详细tooltip */}
        {tooltipData && (
          <div 
            className="pie-tooltip"
            style={{
              position: 'fixed',
              left: selectedSlice !== null ? mousePos.x : mousePos.x,
              top: selectedSlice !== null ? mousePos.y : mousePos.y,
              transform: selectedSlice !== null ? 'translate(-50%, -50%)' : 'none',
              backgroundColor: selectedSlice !== null ? 'rgba(255, 107, 107, 0.95)' : 'rgba(0, 0, 0, 0.95)',
              color: 'white',
              padding: '16px',
              borderRadius: '12px',
              fontSize: '13px',
              pointerEvents: selectedSlice !== null ? 'auto' : 'none',
              zIndex: 1000,
              boxShadow: selectedSlice !== null 
                ? '0 12px 48px rgba(255, 107, 107, 0.4)' 
                : '0 8px 32px rgba(0, 0, 0, 0.4)',
              minWidth: '280px',
              maxWidth: selectedSlice !== null ? '450px' : '380px',
              maxHeight: selectedSlice !== null ? '500px' : '450px',
              overflowY: 'auto',
              border: selectedSlice !== null 
                ? '3px solid rgba(255, 107, 107, 0.5)' 
                : '2px solid rgba(255, 87, 34, 0.3)',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              opacity: 1,
              visibility: 'visible'
            }}
          >
            {/* Debug信息 */}
            {selectedSlice !== null && (
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
                固定中: 切片{selectedSlice}
              </div>
            )}
            
            <div style={{ 
              fontWeight: 'bold', 
              marginBottom: '12px', 
              borderBottom: selectedSlice !== null ? '2px solid #FF6B6B' : '2px solid #FF5722', 
              paddingBottom: '8px',
              color: selectedSlice !== null ? '#FFB3B3' : '#FF5722',
              fontSize: selectedSlice !== null ? '18px' : '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <span>{tooltipData.label}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#ccc',
                  fontWeight: 'normal'
                }}>
                  {tooltipData.count}回
                </span>
                {selectedSlice !== null && (
                  <button
                    onClick={() => {
                      setSelectedSlice(null);
                      setTooltipData(null);
                      setHoveredSlice(null);
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
              color: '#FF6B6B',
              fontWeight: 'bold',
              textAlign: 'center',
              padding: '8px',
              backgroundColor: 'rgba(255, 107, 107, 0.1)',
              borderRadius: '6px',
              border: '1px solid rgba(255, 107, 107, 0.3)'
            }}>
              失误率: {tooltipData.percentage.toFixed(1)}% 
              <span style={{ color: '#ccc', fontWeight: 'normal', marginLeft: '8px' }}>
                ({tooltipData.count}回)
              </span>
            </div>
            
            {tooltipData.actions && tooltipData.actions.length > 0 && (
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
                  <span>失误組合リスト:</span>
                  {selectedSlice !== null && (
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
                  maxHeight: selectedSlice !== null ? '350px' : '280px', 
                  overflowY: 'auto',
                  paddingRight: '4px'
                }}>
                  {tooltipData.actions
                    .sort((a, b) => a.currentAction.start_id - b.currentAction.start_id)
                    .map((actionPair, index) => {
                      return (
                        <div 
                          key={index}
                          onClick={(e) => {
                            e.stopPropagation();
                            // 跳转到前一个动作的开始时间点
                            handleActionItemClick(actionPair.prevAction.start_id);
                          }}
                          style={{
                            padding: '10px',
                            marginBottom: '6px',
                            backgroundColor: 'rgba(255, 255, 255, 0.08)',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            fontSize: '12px',
                            transition: 'all 0.2s ease',
                            border: '1px solid rgba(255, 255, 255, 0.1)',
                            position: 'relative'
                          }}
                          onMouseEnter={(e) => {
                            const hoverColor = selectedSlice !== null ? '#FF6B6B' : '#FF5722';
                            e.currentTarget.style.backgroundColor = `rgba(${selectedSlice !== null ? '255, 107, 107' : '255, 87, 34'}, 0.2)`;
                            e.currentTarget.style.borderColor = hoverColor;
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
                            e.currentTarget.style.transform = 'translateX(0px)';
                          }}
                        >
                          <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            marginBottom: '6px',
                            fontWeight: 'bold',
                            color: '#FFF'
                          }}>
                            <span style={{ 
                              marginRight: '8px', 
                              fontSize: '14px',
                              color: '#F44336'
                            }}>
                              ❌
                            </span>
                            <span>{actionPair.prevAction.label_names[0]} → {actionPair.currentAction.label_names[0]}</span>
                          </div>
                          
                          <div style={{ 
                            fontSize: '11px',
                            color: '#bbb',
                            marginLeft: '22px',
                            lineHeight: '1.3'
                          }}>
                            <div>前動作: {frameToTime(actionPair.prevAction.start_id)} - {frameToTime(actionPair.prevAction.end_id)}</div>
                            <div>失误動作: {frameToTime(actionPair.currentAction.start_id)} - {frameToTime(actionPair.currentAction.end_id)}</div>
                            <div style={{ color: '#888', marginTop: '2px' }}>
                              間隔: {actionPair.currentAction.start_id - actionPair.prevAction.end_id}秒
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
              {selectedSlice !== null ? (
                <>
                  💡 クリックして録画の該当時間に移動 | 
                  <span style={{ color: '#FFB3B3' }}> クリックまたはEscで閉じる</span>
                </>
              ) : (
                <>
                  💡 クリックして録画の該当時間に移動 | 
                  <span style={{ color: '#FF8A65' }}> 切片をクリックで固定表示</span>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
