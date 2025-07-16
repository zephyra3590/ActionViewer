/**
 * 动作分析工具
 * 用于分析羽毛球选手的动作成功率和失误情况
 */

// 动作类型映射
export const ACTION_LABELS = {
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

// 动作结果类型
export const ACTION_RESULT = {
  SUCCESS: 'success',
  FAILURE: 'failure',
  NO_JUDGMENT: 'no_judgment'
};

/**
 * 分析单个动作的成功失败情况
 * @param {Object} currentAction - 当前动作对象
 * @param {Array} playerActions - 当前选手的所有动作列表
 * @returns {string} 返回 'success', 'failure', 或 'no_judgment'
 */
export const analyzeActionSuccess = (currentAction, playerActions) => {
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
    // 2秒内有下一个动作，认为成功
    return ACTION_RESULT.SUCCESS;
  }
  
  // 2秒内没有动作，查找2秒后的下一个动作
  const nextActionAfter2Sec = sortedActions.find((action, index) => 
    index > currentIndex && action.start_id > twoSecondsLater
  );
  
  if (nextActionAfter2Sec) {
    // 检查动作名称是否包含"サーブ"（广义的发球动作）
    const actionName = nextActionAfter2Sec.label_names[0];
    return actionName && actionName.includes("サーブ") ? ACTION_RESULT.SUCCESS : ACTION_RESULT.FAILURE;
  }
  
  // 没有后续动作，检查当前动作名称
  const currentActionName = currentAction.label_names[0];
  if (currentActionName && currentActionName.includes("誤")) {
    // 动作名称包含"误"，判定为失误
    return ACTION_RESULT.FAILURE;
  }
  
  // 没有后续动作且不包含"误"，不做判定
  return ACTION_RESULT.NO_JUDGMENT;
};

/**
 * 分析选手的所有动作，返回带有成功失败标记的动作列表
 * @param {Array} playerActions - 选手的动作列表
 * @returns {Array} 返回包含分析结果的动作列表
 */
export const analyzePlayerActions = (playerActions) => {
  if (!playerActions || !Array.isArray(playerActions)) {
    return [];
  }
  
  return playerActions.map(action => ({
    ...action,
    result: analyzeActionSuccess(action, playerActions)
  }));
};

/**
 * 分析所有选手的动作
 * @param {Array} allPlayersData - 所有选手的数据 [player1, player2, ...]
 * @returns {Array} 返回包含分析结果的选手数据
 */
export const analyzeAllPlayersActions = (allPlayersData) => {
  if (!allPlayersData || !Array.isArray(allPlayersData)) {
    return [];
  }
  
  return allPlayersData.map(playerData => ({
    ...playerData,
    actions: analyzePlayerActions(playerData.actions || [])
  }));
};

/**
 * 计算选手的成功率统计
 * @param {Array} playerActions - 选手的动作列表（已包含result字段）
 * @returns {Object} 返回统计结果
 */
export const calculateSuccessRate = (playerActions) => {
  if (!playerActions || !Array.isArray(playerActions)) {
    return {
      total: 0,
      success: 0,
      failure: 0,
      noJudgment: 0,
      successRate: 0
    };
  }
  
  const stats = playerActions.reduce((acc, action) => {
    acc.total++;
    switch (action.result) {
      case ACTION_RESULT.SUCCESS:
        acc.success++;
        break;
      case ACTION_RESULT.FAILURE:
        acc.failure++;
        break;
      case ACTION_RESULT.NO_JUDGMENT:
        acc.noJudgment++;
        break;
    }
    return acc;
  }, {
    total: 0,
    success: 0,
    failure: 0,
    noJudgment: 0
  });
  
  // 计算成功率（排除不做判定的动作）
  const judgmentTotal = stats.success + stats.failure;
  stats.successRate = judgmentTotal > 0 ? (stats.success / judgmentTotal * 100).toFixed(1) : 0;
  
  return stats;
};

/**
 * 按动作类型分组统计
 * @param {Array} playerActions - 选手的动作列表（已包含result字段）
 * @returns {Object} 返回按动作类型分组的统计结果
 */
export const calculateSuccessRateByAction = (playerActions) => {
  if (!playerActions || !Array.isArray(playerActions)) {
    return {};
  }
  
  const groupedActions = playerActions.reduce((acc, action) => {
    const actionType = action.label_names && action.label_names[0];
    if (!actionType) return acc;
    
    if (!acc[actionType]) {
      acc[actionType] = [];
    }
    acc[actionType].push(action);
    return acc;
  }, {});
  
  const result = {};
  for (const [actionType, actions] of Object.entries(groupedActions)) {
    result[actionType] = calculateSuccessRate(actions);
  }
  
  return result;
};

/**
 * 从JSON数据中提取选手动作数据
 * @param {Object} jsonData - JSON数据对象
 * @returns {Array} 返回选手数据数组
 */
export const extractPlayersFromJson = (jsonData) => {
  if (!jsonData || !Array.isArray(jsonData)) {
    console.warn('Invalid JSON data format');
    return [];
  }
  
  return jsonData.map((playerData, index) => ({
    playerId: index,
    playerName: `选手${index + 1}`,
    actions: playerData.actions || [],
    ...playerData
  }));
};

/**
 * 获取动作结果对应的显示图标
 * @param {string} result - 动作结果
 * @returns {string} 返回对应的图标
 */
export const getResultIcon = (result) => {
  switch (result) {
    case ACTION_RESULT.SUCCESS:
      return "🟢";
    case ACTION_RESULT.FAILURE:
      return "❌";
    case ACTION_RESULT.NO_JUDGMENT:
      return "⭕";
    default:
      return "⭕";
  }
};

/**
 * 时间格式化工具
 * @param {number} frame - 帧数
 * @param {number} fps - 帧率（可选，默认为1）
 * @returns {string} 返回格式化的时间字符串
 */
export const formatFrameToTime = (frame, fps = 1) => {
  const totalSeconds = Math.floor(frame / fps);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};
