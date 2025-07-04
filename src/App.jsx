import { useState, useEffect } from 'react';
import VideoPlayer from './components/VideoPlayer';
import ActionList from './components/ActionList';
import RadarChart from './components/RadarChart';
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
  const [uploadStatusLog, setUploadStatusLog] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [extractionInProgress, setExtractionInProgress] = useState(false);
  const [predictionInProgress, setPredictionInProgress] = useState(false);
  const [processedFileName, setProcessedFileName] = useState('');
  const [predictionCompleted, setPredictionCompleted] = useState(false);
  const [canDownloadJson, setCanDownloadJson] = useState(false);

  // Define version and build time
  const VERSION = "1.2.0";
  const BUILD_TIME = new Date().toLocaleString();
  
  const setUploadStatus = (status) => {
    setUploadStatusLog(prevLog => [...prevLog, status]);
  };
  
  useEffect(() => {
    const triggerPrediction = async () => {
      if (extractionInProgress || !processedFileName || predictionInProgress || predictionCompleted) return;
      setPredictionInProgress(true);
      setUploadStatus('Starting prediction process...');
      try {
        const response = await fetch('/api/predict', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fileName: processedFileName })
        });
        
        if (response.ok) {
          const result = await response.json();
          setUploadStatus(`✓ Prediction completed for ${processedFileName}`);
          setPredictionCompleted(true);
          setCanDownloadJson(true); // Enable download JSON button
        } else {
          throw new Error('Prediction failed');
        }
      } catch (error) {
        console.error('Prediction error:', error);
        setUploadStatus(`Error during prediction: ${error.message}`);
      } finally {
        setPredictionInProgress(false);
      }
    };
    
    if (!extractionInProgress && processedFileName && !predictionInProgress && !predictionCompleted) {
      triggerPrediction();
    }
  }, [extractionInProgress, processedFileName, predictionInProgress, predictionCompleted]);
  
  useEffect(() => {
    let statusTimer;
    if (extractionInProgress && processedFileName) {
      setUploadStatus('Frame extraction in progress...');
      
      statusTimer = setInterval(() => {
        const messages = [
          'Extracting frames...',
          'Processing video content...',
          'Analyzing frames...',
          'Almost done...'
        ];
        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        setUploadStatus(`Frame extraction: ${randomMessage}`);
      }, 5000);
      
      // For demo purposes, simulate completion after 20 seconds
      setTimeout(() => {
        clearInterval(statusTimer);
        setExtractionInProgress(false);
        setUploadStatus('✓ Frame extraction completed successfully!');
      }, 20000);
    }
    
    return () => {
      if (statusTimer) clearInterval(statusTimer);
    };
  }, [extractionInProgress, processedFileName]);

  const handleVideoUpload = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('video/')) {
      setVideoFile(file);
      setVideoFileName(file.name);
      const url = URL.createObjectURL(file);
      setVideoUrl(url);
      setUploadStatus(`Video loaded: ${file.name}`);
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
    
    // Second format: { action_results: [...] } (without outer array)
    if (data.action_results && Array.isArray(data.action_results)) {
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
      // Transform action_results to match the expected format (without outer array)
      const transformedActions = data.action_results.map(action => ({
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
            setUploadStatus(`JSON loaded: ${file.name} (${format})`);
          } else {
            alert('Invalid JSON format, please check the data structure');
            setUploadStatus(`Error: Invalid JSON format in ${file.name}`);
          }
        } catch (error) {
          console.error('JSON parsing error:', error);
          alert('Invalid JSON file');
          setUploadStatus(`Error: JSON parsing failed for ${file.name}`);
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
  
  const analyzeVideo = async () => {
    if (!videoFile) {
      alert('Please select a video file first');
      return;
    }
    setIsUploading(true);
    setUploadStatus('Uploading file...');
    try {
      // Create a timestamp with milliseconds for the file name
      const now = new Date();
      const timestamp = `${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getDate().toString().padStart(2, '0')}_${now.getHours().toString().padStart(2, '0')}${now.getMinutes().toString().padStart(2, '0')}${now.getSeconds().toString().padStart(2, '0')}_${now.getMilliseconds().toString().padStart(3, '0')}`;
      const newFileName = `${timestamp}_${videoFileName}`;
      
      const formData = new FormData();
      formData.append('video', videoFile);
      formData.append('fileName', newFileName);
      
      setUploadStatus(`Processing: ${newFileName}`);
      
      // Real API call
      const response = await fetch('/api/upload-video', {
        method: 'POST',
        body: formData
      });
      
      if (response.ok) {
        const result = await response.json();
        setUploadStatus(`Success! ${newFileName} was saved to /home/work/datasets/EuroCup2016/mp4.`);
        
        // Start monitoring frame extraction process
        setProcessedFileName(newFileName);
        setExtractionInProgress(true);
        setUploadStatus('Starting frame extraction in PaddleVideo environment...');
      } else {
        throw new Error('File upload failed');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setUploadStatus(`Error uploading file: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleDownloadJson = async () => {
    if (!canDownloadJson || !processedFileName) {
      alert('No JSON file available for download');
      return;
    }

    try {
      // Remove .mp4 extension and replace with .json
      const jsonFileName = processedFileName.replace('.mp4', '.json');
      const response = await fetch(`/api/download-json?fileName=${jsonFileName}`);
      
      if (!response.ok) {
        throw new Error('Failed to download JSON');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = jsonFileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download JSON error:', error);
      setUploadStatus(`Error downloading JSON: ${error.message}`);
    }
  };
  
  return (
    <div className="app">
      <header>
        <h1>Video Action Player</h1>
      </header>
      <div className="upload-container">
        <div className="upload-button">
          <label htmlFor="video-upload">Select Video</label>
          <input 
            type="file" 
            id="video-upload" 
            accept="video/*" 
            onChange={handleVideoUpload} 
          />
          {videoFileName && <div className="file-name">{videoFileName}</div>}
        </div>
        <div className="upload-button">
          <button 
            onClick={analyzeVideo} 
            disabled={isUploading || !videoFile || extractionInProgress}
            className={isUploading || extractionInProgress ? "analyze-btn loading" : "analyze-btn"}
          >
            {isUploading ? "Uploading..." : extractionInProgress ? "Processing..." : "Analyze Video"}
          </button>
        </div>
        <div className="upload-button">
          <button
            onClick={handleDownloadJson}
            disabled={!canDownloadJson}
            className="analyze-btn"
          >
            Download JSON
          </button>
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
            {actions.length > 0 ? (
              <div className="sidebar">
                <ActionList 
                  actions={actions} 
                  onActionClick={handleActionClick} 
                  fps={fps}
                />
              </div>
            ) : (
              <div className="sidebar status-display">
                <h2>Status Log</h2>
                <div className="status-content">
                  {uploadStatusLog.map((status, index) => (
                    <p key={index} className={`status-line ${status.includes('Error') ? 'error' : status.includes('✓') ? 'success' : ''}`}>
                      {status}
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!videoUrl && (
          <div className="instructions">
            <p>Please upload a video file and JSON file to start</p>
          </div>
        )}
        
        {/* 添加雷达图显示区域 */}
        {actions.length > 0 && (
          <RadarChart actions={actions} />
        )}
      </main>
      <footer className="app-footer">
        <p>Version {VERSION} - Built on {BUILD_TIME}</p>
      </footer>
    </div>
  );
}

export default App;
