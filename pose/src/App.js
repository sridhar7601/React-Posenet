import React, { useRef, useEffect, useState } from 'react';
import * as poseDetection from '@tensorflow-models/pose-detection';
import Webcam from 'react-webcam';

const App = () => {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [selectedBodyPart, setSelectedBodyPart] = useState('');
  const [bodyPartData, setBodyPartData] = useState([]);
  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);

  useEffect(() => {
    const runPoseDetection = async () => {
      const detector = await poseDetection.createDetector(poseDetection.SupportedModels.BlazePose);

      if (isRecording) {
        setCountdown(5);

        const intervalId = setInterval(() => {
          setCountdown((prevCount) => prevCount - 1);
        }, 1000);

        setTimeout(() => {
          clearInterval(intervalId);
          setIsRecording(false);
          console.log('Recording stopped!');
          alert('Recording stopped!');
        }, 6000);
      }

      setInterval(() => {
        detect(detector);
      }, 100);
    };

    const detect = async (detector) => {
      if (
        typeof webcamRef.current !== 'undefined' &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        // Get video properties
        const video = webcamRef.current.video;
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video dimensions
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        // Set canvas dimensions
        canvasRef.current.width = videoWidth;
        canvasRef.current.height = videoHeight;

        // Detect poses
        const poses = await detector.estimatePoses(video, {
          flipHorizontal: false,
          maxPoses: 1,
        });

        // Draw poses on canvas
        const ctx = canvasRef.current.getContext('2d');
        ctx.clearRect(0, 0, videoWidth, videoHeight);
        poses.forEach((pose) => {
          drawPose(pose, ctx);
        });

        // Extract selected body part data during recording
        if (isRecording && poses.length > 0 && poses[0].keypoints.length > 0) {
          const selectedKeypoint = poses[0].keypoints.find(
            (keypoint) => keypoint.name === selectedBodyPart
          );

          if (selectedKeypoint) {
            const data = {
              part: selectedKeypoint.name,
              position: { x: selectedKeypoint.x, y: selectedKeypoint.y },
            };

            setBodyPartData((prevData) => [...prevData, data]);
          }
        }
      }
    };

    runPoseDetection();
  }, [selectedBodyPart, isRecording]);

  const drawPose = (pose, ctx) => {
    pose.keypoints.forEach((keypoint) => {
      const x = keypoint.x;
      const y = keypoint.y;

      ctx.beginPath();
      ctx.arc(x, y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#000000';
      ctx.stroke();
      ctx.closePath();
    });
  };

  const startRecording = () => {
    setBodyPartData([]);
    setIsRecording(true);
  };

  return (
    <div className="App">
      <header className="App-header">
        <Webcam ref={webcamRef} />
        <canvas ref={canvasRef} />
        <div>
          <h2>Select Body Part:</h2>
          <select
            value={selectedBodyPart}
            onChange={(e) => setSelectedBodyPart(e.target.value)}
          >
            <option value="">--Select--</option>
            <option value="left_shoulder">Left Shoulder</option>
            <option value="right_shoulder">Right Shoulder</option>
            <option value="left_elbow">Left Elbow</option>
            <option value="right_elbow">Right Elbow</option>
            <option value="left_wrist">Left Wrist</option>
            <option value="right_wrist">Right Wrist</option>
          </select>
        </div>
        <div>
          <button onClick={startRecording}>Start Recording</button>
        </div>
        {isRecording && countdown > 0 && <h2>Recording starts in {countdown} seconds...</h2>}
        <div>
          <h2>Body Part Data:</h2>
          {bodyPartData.map((data, index) => (
            <div key={index}>
              <p>
                <strong>Body Part:</strong> {data.part}
              </p>
              <p>
                <strong>Position:</strong> {data.position.x}, {data.position.y}
              </p>
              <hr />
            </div>
          ))}
        </div>
      </header>
    </div>
  );
};

export default App;
