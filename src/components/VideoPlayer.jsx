import { useRef, useEffect } from 'react';
import styles from './VideoPlayer.module.css';

const VideoPlayer = ({ videoUrl, currentFrame, fps }) => {
  const videoRef = useRef(null);
  
  useEffect(() => {
    if (videoRef.current && currentFrame !== null) {
      // Convert frame to time in seconds
      const timeInSeconds = currentFrame; // / fps;
      videoRef.current.currentTime = timeInSeconds;
    }
  }, [currentFrame, fps]);

  return (
    <div className={styles['video-player']}>
      <video 
        ref={videoRef} 
        controls 
        width="100%"
        src={videoUrl}
      >
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoPlayer;
