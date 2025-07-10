import { useEffect, useRef, useState, useCallback } from 'react';
import './PieChart.css';

const PieChart = ({ actions }) => {
  const canvasRef = useRef(null);
  const [hoveredSlice, setHoveredSlice] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [pieData, setPieData] = useState([]);
  const [colors, setColors] = useState([]);
  
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
            
            failureCombinations[combinationKey] = (failureCombinations[combinationKey] || 0) + 1;
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
    const totalFailures = Object.values(failureCombinations).reduce((sum, count) => sum + count, 0);
    
    if (totalFailures === 0) return [];
    
    const processedData = [];
    let othersCount = 0;
    
    Object.entries(failureCombinations).forEach(([combination, count]) => {
      const percentage = (count / totalFailures) * 100;
      
      if (percentage >= 5) {
        processedData.push({
          label: combination,
          count: count,
          percentage: percentage
        });
      } else {
        othersCount += count;
      }
    });
    
    // 如果有小于5%的组合，添加【その他】
    if (othersCount > 0) {
      const othersPercentage = (othersCount / totalFailures) * 100;
      processedData.push({
        label: 'その他',
        count: othersCount,
        percentage: othersPercentage
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
    // 添加安全检查
    if (!color || typeof color !== 'string') {
      return '#000000'; // 返回默认颜色
    }
    
    // 确保颜色格式正确
    const cleanColor = color.startsWith('#') ? color : '#' + color;
    const num = parseInt(cleanColor.replace("#", ""), 16);
    
    // 检查是否为有效的十六进制颜色
    if (isNaN(num)) {
      return '#000000'; // 返回默认颜色
    }
    
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const B = (num >> 8 & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;
    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 + (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 + (G < 255 ? G < 1 ? 0 : G : 255)).toString(16).slice(1);
  }, []);

  // 检测鼠标是否在某个扇形内 - 移除对 pieData 的依赖
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

  // 处理鼠标移动 - 使用 useRef 来避免依赖 pieData
  const pieDataRef = useRef(pieData);
  pieDataRef.current = pieData;

  const handleMouseMove = useCallback((event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
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
    setMousePos({ x: event.clientX, y: event.clientY });
  }, [getSliceAtPoint]);

  // 处理鼠标离开
  const handleMouseLeave = useCallback(() => {
    setHoveredSlice(null);
  }, []);

  // 第一个 useEffect：只处理数据计算和设置，不处理事件监听器
  useEffect(() => {
    // 获取失误组合数据
    const failureCombinations = calculateFailureCombinations(actions);
    const processedData = processDataForPieChart(failureCombinations);
    const generatedColors = generateColors(processedData.length);
    
    // 确保颜色数组和数据数组长度匹配
    const safeColors = generatedColors.length >= processedData.length 
      ? generatedColors 
      : [...generatedColors, ...Array(processedData.length - generatedColors.length).fill('#CCCCCC')];
    
    setPieData(processedData);
    setColors(safeColors);
  }, [actions]); // 只依赖 actions

  // 第二个 useEffect：只处理事件监听器
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // 添加事件监听器
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);
    
    return () => {
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [handleMouseMove, handleMouseLeave]); // 这些回调现在是稳定的

  // 第三个 useEffect：处理绘制
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 使用更大的画布尺寸，调整布局
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const centerX = canvasWidth * 0.35; // 将饼图向左移动
    const centerY = canvasHeight / 2;
    const radius = Math.min(centerX * 0.8, centerY * 0.8); // 减小半径避免重叠
    
    // 清空画布
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    
    if (pieData.length === 0) {
      // 没有失误数据时显示提示
      ctx.fillStyle = '#666';
      ctx.font = '18px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('失误データがありません', centerX, centerY);
      return;
    }
    
    // 确保 colors 数组有足够的元素
    if (colors.length === 0) {
      return; // 等待颜色数据加载
    }
    
    // 绘制饼图
    let currentAngle = -Math.PI / 2; // 从顶部开始
    
    pieData.forEach((data, index) => {
      const sliceAngle = (data.percentage / 100) * 2 * Math.PI;
      const isHovered = hoveredSlice === index;
      
      // 安全获取颜色，如果索引超出范围则使用默认颜色
      const baseColor = colors[index] || '#CCCCCC';
      
      // 如果是悬停状态，稍微向外扩展
      const currentRadius = isHovered ? radius * 1.1 : radius;
      const offsetX = isHovered ? Math.cos(currentAngle + sliceAngle / 2) * 8 : 0;
      const offsetY = isHovered ? Math.sin(currentAngle + sliceAngle / 2) * 8 : 0;
      
      // 绘制扇形
      ctx.fillStyle = isHovered ? lightenColor(baseColor, 20) : baseColor;
      ctx.beginPath();
      ctx.moveTo(centerX + offsetX, centerY + offsetY);
      ctx.arc(centerX + offsetX, centerY + offsetY, currentRadius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // 绘制边框
      ctx.strokeStyle = isHovered ? '#333' : '#fff';
      ctx.lineWidth = isHovered ? 4 : 3;
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
    drawImprovedLegend(ctx, pieData, colors, canvasWidth, canvasHeight, hoveredSlice);
    
  }, [pieData, colors, hoveredSlice, lightenColor]);

  const drawImprovedLegend = (ctx, pieData, colors, canvasWidth, canvasHeight, hoveredSlice = null) => {
    const legendStartX = canvasWidth * 0.65; // 图例位置向右移动
    const legendStartY = 40;
    const lineHeight = 28;
    const maxWidth = canvasWidth - legendStartX - 20;
    const maxLegendHeight = canvasHeight - 80; // 为图例设置最大高度，留出底部空间
    
    ctx.font = 'bold 13px Arial';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // 绘制图例标题
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.fillText('失误組合', legendStartX, legendStartY - 10);
    
    ctx.font = 'bold 13px Arial';
    
    // 计算最多可以显示的项目数
    const availableHeight = maxLegendHeight - 50; // 减去标题和总计信息的空间
    const maxVisibleItems = Math.floor(availableHeight / lineHeight);
    const visibleData = pieData.slice(0, maxVisibleItems);
    const hiddenItemsCount = pieData.length - maxVisibleItems;
    
    visibleData.forEach((data, index) => {
      const y = legendStartY + 20 + index * lineHeight;
      const isHovered = hoveredSlice === index;
      
      // 安全获取颜色
      const baseColor = colors[index] || '#CCCCCC';
      
      // 绘制颜色方块 - 使用更大的方块，悬停时高亮
      ctx.fillStyle = isHovered ? lightenColor(baseColor, 30) : baseColor;
      const rectSize = isHovered ? 18 : 16;
      const rectOffset = isHovered ? -1 : 0;
      ctx.fillRect(legendStartX + rectOffset, y - 8 + rectOffset, rectSize, rectSize);
      
      // 绘制方块边框
      ctx.strokeStyle = isHovered ? '#000' : '#333';
      ctx.lineWidth = isHovered ? 2 : 1;
      ctx.strokeRect(legendStartX + rectOffset, y - 8 + rectOffset, rectSize, rectSize);
      
      // 准备文本
      const percentage = `${data.percentage.toFixed(1)}%`;
      const count = `(${data.count}回)`;
      let labelText = data.label;
      
      // 如果标签太长，进行截断处理
      const textX = legendStartX + 25;
      ctx.fillStyle = isHovered ? '#000' : '#333';
      ctx.font = isHovered ? 'bold 14px Arial' : 'bold 13px Arial';
      
      // 测量文本宽度并进行截断
      const fullText = `${labelText} ${percentage} ${count}`;
      const fullTextWidth = ctx.measureText(fullText).width;
      
      if (fullTextWidth <= maxWidth) {
        // 一行可以放下
        ctx.fillText(fullText, textX, y);
      } else {
        // 需要截断标签文本
        const maxLabelWidth = maxWidth - ctx.measureText(`${percentage} ${count}`).width - 10;
        let truncatedLabel = labelText;
        
        while (ctx.measureText(truncatedLabel + '...').width > maxLabelWidth && truncatedLabel.length > 3) {
          truncatedLabel = truncatedLabel.slice(0, -1);
        }
        
        if (truncatedLabel.length < labelText.length) {
          truncatedLabel += '...';
        }
        
        // 分行显示
        ctx.fillText(truncatedLabel, textX, y - 6);
        
        ctx.font = isHovered ? '12px Arial' : '11px Arial';
        ctx.fillStyle = isHovered ? '#333' : '#666';
        ctx.fillText(`${percentage} ${count}`, textX, y + 8);
        ctx.font = isHovered ? 'bold 14px Arial' : 'bold 13px Arial';
        ctx.fillStyle = isHovered ? '#000' : '#333';
      }
    });
    
    // 如果有隐藏的项目，显示提示
    if (hiddenItemsCount > 0) {
      const moreY = legendStartY + 20 + visibleData.length * lineHeight;
      ctx.fillStyle = '#999';
      ctx.font = '12px Arial';
      ctx.fillText(`... 还有 ${hiddenItemsCount} 个项目`, legendStartX + 25, moreY);
    }
    
    // 绘制总计信息
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
      <div style={{ position: 'relative' }}>
        <canvas 
          ref={canvasRef} 
          width={800} 
          height={600} // 增加画布高度来容纳更多图例项目
          className="pie-canvas"
          style={{ cursor: hoveredSlice !== null ? 'pointer' : 'default' }}
        />
        {hoveredSlice !== null && pieData[hoveredSlice] && (
          <div 
            className="tooltip"
            style={{
              position: 'fixed',
              left: mousePos.x + 10,
              top: mousePos.y - 10,
              backgroundColor: 'rgba(0, 0, 0, 0.9)',
              color: 'white',
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: 'bold',
              pointerEvents: 'none',
              zIndex: 1000,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
              whiteSpace: 'nowrap'
            }}
          >
            <div>{pieData[hoveredSlice].label}</div>
            <div style={{ fontSize: '12px', color: '#ccc', marginTop: '2px' }}>
              {pieData[hoveredSlice].percentage.toFixed(1)}% ({pieData[hoveredSlice].count}回)
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PieChart;
