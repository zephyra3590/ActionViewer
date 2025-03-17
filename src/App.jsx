import { useState } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ActionList from './components/ActionList';
import './App.css';

function App() {
  const [currentFrame, setCurrentFrame] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [videoData, setVideoData] = useState(null);
  
  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
    } else {
      alert('请上传有效的视频文件');
    }
  };

  // Add this function to App.jsx
  const validateJsonData = (data) => {
    if (!data.fps || !data.gts || !Array.isArray(data.gts)) {
      return false;
    }
    
    if (data.gts.length === 0 || !data.gts[0].actions || !Array.isArray(data.gts[0].actions)) {
      return false;
    }
    
    return true;
  };

  // Then modify the handleJsonUpload function:
  const handleJsonUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type === 'application/json') {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          if (validateJsonData(data)) {
            setVideoData(data);
          } else {
            alert('JSON 格式不正确，请检查数据结构');
          }
        } catch (error) {
          console.error('JSON 解析错误:', error);
          alert('无效的 JSON 文件');
        }
      };
      reader.readAsText(file);
    } else {
      alert('请上传有效的 JSON 文件');
    }
  };  
  
  const handleActionClick = (startFrame) => {
    setCurrentFrame(startFrame);
  };
  
  return (
    <div className="app">
      <header>
        <h1>视频动作播放器</h1>
      </header>
      <div className="upload-container">
        <div className="upload-button">
          <label htmlFor="video-upload">上传视频</label>
          <input 
            type="file" 
            id="video-upload" 
            accept="video/*" 
            onChange={handleVideoUpload} 
          />
        </div>
        <div className="upload-button">
          <label htmlFor="json-upload">上传JSON</label>
          <input 
            type="file" 
            id="json-upload" 
            accept="application/json" 
            onChange={handleJsonUpload} 
          />
        </div>
      </div>
      <main>
        {videoUrl && (
          <div className="content">
            <div className="video-container">
              <VideoPlayer 
                videoUrl={videoUrl} 
                currentFrame={currentFrame} 
                fps={videoData?.fps || 30} 
              />
            </div>
            {videoData && (
              <div className="sidebar">
                <ActionList 
                  actions={videoData.gts[0].actions} 
                  onActionClick={handleActionClick} 
                  fps={videoData.fps}
                />
              </div>
            )}
          </div>
        )}
        {!videoUrl && !videoData && (
          <div className="instructions">
            <p>请上传视频文件和 JSON 文件以开始</p>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;