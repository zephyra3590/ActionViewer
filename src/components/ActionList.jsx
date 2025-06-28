import './ActionList.css';

const ActionList = ({ actions, onActionClick, fps }) => {
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

  // 准备排序后的动作数据，用于成功率判断
  const sortedActions = [...actions].sort((a, b) => a.start_id - b.start_id);
  
  return (
    <div className="action-list">
      <h2>Action List</h2>
      <ul>
        {actions.map((action, index) => {
          // 找到当前动作在排序后数组中的索引
          const sortedIndex = sortedActions.findIndex(sortedAction => 
            sortedAction.start_id === action.start_id && 
            sortedAction.end_id === action.end_id &&
            sortedAction.label_names[0] === action.label_names[0]
          );
          
          // 判断动作是否成功
          const isSuccess = checkActionSuccess(action, sortedActions, sortedIndex);
          const statusIcon = isSuccess ? "⭕️" : "❌";
          
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
