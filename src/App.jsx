import { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ActionList from './components/ActionList';
import './App.css';

function App() {
  const [currentFrame, setCurrentFrame] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoData, setVideoData] = useState(null);
  const [videoFileName, setVideoFileName] = useState('');
  const [jsonFileName, setJsonFileName] = useState('');
  const [actions, setActions] = useState([]);
  const [fps, setFps] = useState(30);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoFileName(file.name);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      alert('Please upload a valid video file');
    }
  };

  const validateJsonData = (data) => {
    // First format: { fps, gts: [{ actions: [...] }] }
    if (data.fps && data.gts && Array.isArray(data.gts)) {
      if (data.gts.length > 0 && data.gts[0].actions && Array.isArray(data.gts[0].actions)) {
        return 'format1';
      }
    }
    
    // Second format: [{ action_results: [...] }]
    if (Array.isArray(data) && data.length > 0 && data[0].action_results && Array.isArray(data[0].action_results)) {
      return 'format2';
    }
    
    return false;
  };

  const processJsonData = (data, format) => {
    if (format === 'format1') {
      setFps(data.fps || 30);
      setActions(data.gts[0].actions);
      return data;
    } else if (format === 'format2') {
      // Transform action_results to match the expected format
      const transformedActions = data[0].action_results.map(action => ({
        start_id: action.start_time,
        end_id: action.end_time,
        label_names: [action.label_name],
        // Add any other required fields
        score: action.classify_score
      }));
      
      setFps(30); // Default fps if not provided
      setActions(transformedActions);
      
      // Create a compatible data structure
      return {
        fps: 30,
        gts: [{
          actions: transformedActions
        }]
      };
    }
    return null;
  };

  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      setJsonFileName(file.name);
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const format = validateJsonData(data);
          
          if (format) {
            const processedData = processJsonData(data, format);
            setVideoData(processedData);
          } else {
            alert('Invalid JSON format, please check the data structure');
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          alert('Invalid JSON file');
        }
      };
      reader.readAsText(file);
    } else {
      alert('Please upload a valid JSON file');
    }
  };
  
  const handleActionClick = (startFrame) => {
    setCurrentFrame(startFrame);
  };
  
  return (
    <div className="app">
      <header>
        <h1>Video Action Player</h1>
      </header>
      <div className="upload-container">
        <div className="upload-button">
          <label htmlFor="video-upload">Upload Video</label>
          <input 
            type="file" 
            id="video-upload" 
            accept="video/*" 
            onChange={handleVideoUpload} 
          />
          {videoFileName && <div className="file-name">{videoFileName}</div>}
        </div>
        <div className="upload-button">
          <label htmlFor="json-upload">Upload JSON</label>
          <input 
            type="file" 
            id="json-upload" 
            accept="application/json" 
            onChange={handleJsonUpload} 
          />
          {jsonFileName && <div className="file-name">{jsonFileName}</div>}
        </div>
      </div>
      <main>
        {videoUrl && (
          <div className="content">
            <div className="video-container">
              <VideoPlayer 
                videoUrl={videoUrl} 
                currentFrame={currentFrame} 
                fps={fps} 
              />
            </div>
            {actions.length > 0 && (
              <div className="sidebar">
                <ActionList 
                  actions={actions} 
                  onActionClick={handleActionClick} 
                  fps={fps}
                />
              </div>
            )}
          </div>
        )}
        {!videoUrl && (
          <div className="instructions">
            <p>Please upload a video file and JSON file to start</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;