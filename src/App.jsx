import { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ActionList from './components/ActionList';
import videoData from './data/videoData.json';
import './App.css';

function App() {
  const [currentFrame, setCurrentFrame] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  
  useEffect(() => {
    // In a real app, you might need to adjust this URL to where your video is hosted
    // For local development, you can put the video in the public folder
    setVideoUrl(`/${videoData.gts[0].url}`);
  }, []);

  const handleActionClick = (startFrame) => {
    setCurrentFrame(startFrame);
  };

  return (
    <div className="app">
      <header>
        <h1>视频动作播放器</h1>
      </header>
      <main>
        <div className="content">
          <div className="video-container">
            <VideoPlayer 
              videoUrl={videoUrl} 
              currentFrame={currentFrame} 
              fps={videoData.fps} 
            />
          </div>
          <div className="sidebar">
            <ActionList 
              actions={videoData.gts[0].actions} 
              onActionClick={handleActionClick} 
              fps={videoData.fps}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;