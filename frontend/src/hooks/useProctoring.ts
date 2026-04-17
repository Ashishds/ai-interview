import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface ProctoringStatus {
  facesDetected: number;
  isWarning: boolean;
  message: string;
}

export function useProctoring(videoRef: React.RefObject<HTMLVideoElement>, active: boolean) {
  const [status, setStatus] = useState<ProctoringStatus>({
    facesDetected: 0,
    isWarning: false,
    message: 'Vision AI: Synchronizing...'
  });
  
  const faceLandmarkerRef = useRef<FaceLandmarker | null>(null);
  const requestRef = useRef<number>();

  useEffect(() => {
    if (!active) return;

    async function initMediaPipe() {
      try {
        if (faceLandmarkerRef.current) return;
        
        console.log("AI Proctoring: Loading MediaPipe Face Landmarker (0.10.34)...");
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.34/wasm"
        );
        
        console.log("AI Proctoring: Initializing Face Landmarker...");
        faceLandmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "CPU"
          },
          runningMode: "VIDEO",
          numFaces: 2
        });
        
        console.log("AI Proctoring: MediaPipe Face Landmarker READY. Starting loop...");
        setStatus(prev => ({ ...prev, message: 'AI Proctoring Active' }));
        
        requestRef.current = requestAnimationFrame(detect);
        
      } catch (err) {
        console.error("AI Proctoring: Initialization FAILED", err);
        setStatus(prev => ({ ...prev, isWarning: true, message: 'AI Proctoring Offline' }));
      }
    }

    initMediaPipe();

    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
      faceLandmarkerRef.current?.close();
      faceLandmarkerRef.current = null;
    };
  }, [active]);

  const detect = async () => {
    if (!faceLandmarkerRef.current || !videoRef.current || videoRef.current.readyState < 2) {
      if (active) requestRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const startTimeMs = performance.now();
      if (videoRef.current.videoWidth === 0) {
        if (active) requestRef.current = requestAnimationFrame(detect);
        return;
      }

      const result = faceLandmarkerRef.current.detectForVideo(videoRef.current, startTimeMs);
      const faceCount = result.faceLandmarks.length;
      
      let warning = false;
      let msg = `AI Shield: Active (${faceCount} Face discovered)`;

      if (faceCount === 0) {
        msg = 'SECURITY ALERT: NO FACE DETECTED';
        warning = true;
      } else if (faceCount > 1) {
        msg = `SECURITY ALERT: ${faceCount} FACES DETECTED`;
        warning = true;
      } else {
        // Gaze Detection Logic (Phase 8 Upgrade)
        // We check relative iris positions if available, or head orientation via landmarks
        // Simplified Gaze: Check if nose tip (L4) is centered between eyes
        const landmarks = result.faceLandmarks[0];
        const nose = landmarks[4]; // Nose tip
        const leftEye = landmarks[33]; // Left eye
        const rightEye = landmarks[263]; // Right eye
        
        const eyeMidX = (leftEye.x + rightEye.x) / 2;
        const noseDeviation = Math.abs(nose.x - eyeMidX);
        
        if (noseDeviation > 0.05) { // Threshold for "Looking Away"
          msg = 'SECURITY ALERT: FOCUS LOSS DETECTED';
          warning = true;
        }
      }

      setStatus({
        facesDetected: faceCount,
        isWarning: warning,
        message: msg
      });

    } catch (err) {
      console.error("AI Proctoring: Detection error", err);
    }

    if (active) requestRef.current = requestAnimationFrame(detect);
  };

  return status;
}
