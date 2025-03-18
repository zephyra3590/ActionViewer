import './ActionList.css';

const ActionList = ({ actions, onActionClick, fps }) => {
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
  
  return (
    <div className="action-list">
      <h2>Action List</h2>
      <ul>
        {actions.map((action, index) => (
          <li 
            key={index}
            onClick={() => handleClick(action.start_id)}
            className="action-item"
          >
            <span className="action-name">
              {action.label_names && action.label_names[0]}
            </span>
            <span className="action-time">
              {frameToTime(action.start_id)} - {frameToTime(action.end_id)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default ActionList;