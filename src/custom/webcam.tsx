/**
 * Webcam Component - Core Features
 *
 * Three main functionalities:
 * 1) Record Video - with interface controls, auto-start, max duration
 * 2) Capture Photo - with interface controls, quality settings
 * 3) Auto-capture Photo - with interface controls, intervals, quality
 *
 * Features:
 * - Customizable placeholder overlay
 * - Comprehensive feedback functions
 * - Camera switching support
 * - Internationalization support
 */

"use client";

import { Camera, Pause, Play, RefreshCw, Square, Video } from "lucide-react";
import * as React from "react";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import WebcamCore from "react-webcam";
import { cn } from "@repo/ayasofyazilim-ui/lib/utils";
import { Button } from "@repo/ayasofyazilim-ui/components/button";

// Types
export interface VideoDimensions {
  width: number;
  height: number;
}

// Core Feature Interfaces
export interface VideoRecordingConfig {
  hasInterface: boolean; // Show video recording UI controls
  autoStart?: boolean; // Auto-start recording when camera ready
  maxVideoDuration?: number; // Max duration in seconds (default: 60)
  quality?: "low" | "medium" | "high"; // Video quality
  mimeType?: string; // Video MIME type (default: 'video/webm')
}

export interface PhotoCaptureConfig {
  hasInterface: boolean; // Show photo capture UI controls
  quality?: number; // JPEG quality 0-1 (default: 0.95)
}

export interface AutoCaptureConfig {
  hasInterface: boolean; // Show auto-capture UI controls
  captureInterval: number; // Interval in seconds
  startOnReady?: boolean; // Auto-start when camera ready (only on initial load)
  quality?: number; // JPEG quality 0-1 (default: 0.95)
  stopOnCapture?: boolean; // Stop auto capture after first successful capture
}

// Feedback Functions
export interface WebcamCallbacks {
  onWebcamReady?: (dimensions: VideoDimensions) => void;
  onVideoStart?: () => void;
  onVideoEnd?: (videoBlob: Blob, duration: number) => void;
  onPhotoCaptured?: (imageData: string) => void;
  onAutoPhotoCaptured?: (imageData: string) => void;
  onAutoCaptureStart?: () => void;
  beforeStartAutoCapture?: () => void;
  onAutoCaptureStop?: () => void;
  onError?: (error: string) => void;
}

// Main Props Interface
export interface WebcamProps {
  // Core Features (at least one must be enabled)
  videoRecording?: VideoRecordingConfig;
  photoCapture?: PhotoCaptureConfig;
  autoCapture?: AutoCaptureConfig;

  // Camera Settings
  defaultCamera?: "front" | "back"; // Default camera (front='user', back='environment')
  allowCameraSwitch?: boolean; // Allow camera switching

  // UI Customization
  placeholder?: React.ReactElement; // Overlay that covers camera area
  showCapturedImage?: boolean; // Show last captured image preview
  capturedImage?: string | null; // Current captured image for preview
  forceHideInterface?: boolean; // Force hide interface controls (useful for manual capture mode)
  // Feedback Functions
  callbacks?: WebcamCallbacks;

  // Labels for Translation
  labels?: {
    // Video Recording
    startRecording?: string;
    stopRecording?: string;
    recording?: string;

    // Photo Capture
    capturePhoto?: string;

    // Auto Capture
    startAutoCapture?: string;
    stopAutoCapture?: string;
    autoCapturing?: string;

    // General
    switchCamera?: string;
    cameraReady?: string;
    cameraError?: string;
  };

  // Styling
  classNames?: {
    container?: string;
    webcam?: string;
    placeholder?: string;
    controls?: string;
    previewImage?: string;
  };

  // Technical Settings
  webcamRef?: React.RefObject<WebcamCore>;
  videoCheckInterval?: number; // default: 500ms
  maxRetryCount?: number; // default: 10
  interfaceLocation?: "static" | "absolute"; // Location of controls (default: 'bottom')
  showBorder?: boolean; // Show border around webcam area (default: true)
}

export type WebcamCaptureProps = WebcamProps;

// Legacy aliases for backward compatibility
export type WebcamAutoCapture = WebcamProps;
export type WebcamManualCapture = WebcamProps;

export function Webcam(props: WebcamProps) {
  const {
    videoRecording,
    photoCapture,
    autoCapture,
    defaultCamera = "front",
    allowCameraSwitch = false,
    placeholder,
    showCapturedImage = false,
    capturedImage,
    callbacks,
    labels = {},
    classNames,
    webcamRef: externalWebcamRef,
    videoCheckInterval = 500,
    maxRetryCount = 10,
    showBorder = false,
    forceHideInterface = false,
    interfaceLocation = "static",
  } = props;

  // Validation: At least one feature must be enabled
  if (!videoRecording && !photoCapture && !autoCapture) {
    throw new Error(
      "WebcamComponent: At least one core feature (videoRecording, photoCapture, or autoCapture) must be enabled"
    );
  }

  // Default labels
  const defaultLabels = {
    startRecording: "Start Recording",
    stopRecording: "Stop Recording",
    recording: "Recording...",
    capturePhoto: "Capture Photo",
    startAutoCapture: "Start Auto Capture",
    stopAutoCapture: "Stop Auto Capture",
    autoCapturing: "Auto Capturing...",
    switchCamera: "Switch Camera",
    cameraReady: "Camera Ready",
    cameraError: "Camera Error",
    ...labels,
  };

  // State
  const [isPending, startTransition] = useTransition();
  const [facingMode, setFacingMode] = useState<"user" | "environment">(
    defaultCamera === "front" ? "user" : "environment"
  );
  const [isWebcamReady, setIsWebcamReady] = useState(false);
  // Video Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);

  // Auto Capture State
  const [isAutoCapturing, setIsAutoCapturing] = useState(false);

  // Auto capture state to track if it has been initially started
  const [hasAutoStarted, setHasAutoStarted] = useState(false);

  // Refs
  const internalWebcamRef = useRef<WebcamCore>(null);
  const webcamRef = externalWebcamRef || internalWebcamRef;
  const videoCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoCapturIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  // Cleanup utilities
  const clearVideoCheckInterval = useCallback(() => {
    if (videoCheckIntervalRef.current) {
      clearInterval(videoCheckIntervalRef.current);
      videoCheckIntervalRef.current = null;
    }
  }, []);

  const clearAutoCapture = useCallback(() => {
    if (autoCapturIntervalRef.current) {
      clearInterval(autoCapturIntervalRef.current);
      autoCapturIntervalRef.current = null;
    }
  }, []);

  const clearRecordingInterval = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
  }, []);

  // Video Recording Functions
  const startVideoRecording = useCallback(() => {
    if (!webcamRef.current?.stream || isRecording || !videoRecording) return;

    try {
      const { stream } = webcamRef.current;
      const mimeType = videoRecording.mimeType || "video/webm";

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      recordedChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: mimeType });
        const duration = recordingDuration;

        callbacks?.onVideoEnd?.(blob, duration);
        setIsRecording(false);
        setRecordingDuration(0);
        clearRecordingInterval();
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();

      const startTime = Date.now();
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration tracking
      recordingIntervalRef.current = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setRecordingDuration(elapsed);

        // Auto-stop if max duration reached
        if (
          videoRecording.maxVideoDuration &&
          elapsed >= videoRecording.maxVideoDuration
        ) {
          stopVideoRecording();
        }
      }, 1000);

      callbacks?.onVideoStart?.();
    } catch (error) {
      callbacks?.onError?.(`Failed to start video recording: ${error}`);
    }
  }, [
    webcamRef,
    isRecording,
    videoRecording,
    callbacks,
    recordingDuration,
    clearRecordingInterval,
  ]);

  const stopVideoRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, [isRecording]);

  // Photo Capture Functions
  const captureHighQualityPhoto = useCallback((): string | null => {
    const video = webcamRef.current?.video;
    if (!video) return null;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const quality = photoCapture?.quality || 0.95;
    return canvas.toDataURL("image/jpeg", quality);
  }, [webcamRef, photoCapture]);

  const capturePhoto = useCallback(() => {
    if (!photoCapture) return;

    const imageData = captureHighQualityPhoto();
    if (imageData) {
      callbacks?.onPhotoCaptured?.(imageData);
    }
  }, [photoCapture, captureHighQualityPhoto, callbacks]);

  const stopAutoCapture = useCallback(() => {
    setIsAutoCapturing(false);
    callbacks?.onAutoCaptureStop?.();
    clearAutoCapture();
  }, [clearAutoCapture, callbacks]);

  // Auto Capture Functions
  const captureAutoPhoto = useCallback(() => {
    if (!autoCapture) return;

    const video = webcamRef.current?.video;
    if (!video) return;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const quality = autoCapture.quality || 0.95;
    const imageData = canvas.toDataURL("image/jpeg", quality);

    if (imageData) {
      callbacks?.onAutoPhotoCaptured?.(imageData);

      // Stop auto capture if stopOnCapture is enabled
      if (autoCapture.stopOnCapture) {
        stopAutoCapture();
      }
    }
  }, [webcamRef, autoCapture, callbacks, stopAutoCapture]);

  const startAutoCapture = useCallback(
    (isManual = false) => {
      if (!autoCapture || !isWebcamReady || isAutoCapturing) return;

      // If it's automatic start (startOnReady) and already started, don't start again
      if (!isManual && autoCapture.startOnReady && hasAutoStarted) return;

      setIsAutoCapturing(true);
      callbacks?.onAutoCaptureStart?.();

      // Set hasAutoStarted flag only for automatic starts
      if (!isManual && autoCapture.startOnReady) {
        setHasAutoStarted(true);
      }

      autoCapturIntervalRef.current = setInterval(() => {
        if (webcamRef.current && isWebcamReady) {
          captureAutoPhoto();
        }
      }, autoCapture.captureInterval * 1000);
    },
    [
      autoCapture,
      isWebcamReady,
      isAutoCapturing,
      captureAutoPhoto,
      webcamRef,
      callbacks,
      hasAutoStarted,
    ]
  );

  // Camera Management
  const switchCamera = useCallback(() => {
    const newFacingMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(newFacingMode);
    setIsWebcamReady(false);
    setHasAutoStarted(false); // Reset auto-start flag for new camera
    stopAutoCapture();
  }, [facingMode, stopAutoCapture]);

  // Add device detection for better browser compatibility
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile device on component mount
  useEffect(() => {
    const checkIsMobile = () =>
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    setIsMobile(checkIsMobile());
  }, []);

  // Video Readiness Check
  const checkVideoReady = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return false;

    const isReady =
      video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

    if (isReady) {
      const newDimensions: VideoDimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      callbacks?.onWebcamReady?.(newDimensions);
    }

    return isReady;
  }, [webcamRef, callbacks]);

  // Video Initialization
  const handleUserMedia = useCallback(() => {
    clearVideoCheckInterval();
    retryCountRef.current = 0;

    videoCheckIntervalRef.current = setInterval(() => {
      if (checkVideoReady()) {
        setIsWebcamReady(true);
        clearVideoCheckInterval();

        // Auto-start features if enabled
        if (videoRecording?.autoStart) {
          startVideoRecording();
        }

        if (autoCapture?.startOnReady && !hasAutoStarted) {
          setTimeout(() => {
            startAutoCapture(false); // Automatic start
          }, 100);
        }
      } else {
        retryCountRef.current++;

        if (retryCountRef.current > maxRetryCount) {
          clearVideoCheckInterval();
          callbacks?.onError?.(
            "Failed to initialize camera after maximum retries"
          );

          // Try with default constraints as a fallback
          const currentFacingMode = facingMode;
          setFacingMode("user");
          setTimeout(() => setFacingMode(currentFacingMode), 100);
        }
      }
    }, videoCheckInterval);

    return clearVideoCheckInterval;
  }, [
    clearVideoCheckInterval,
    checkVideoReady,
    videoRecording,
    autoCapture,
    startVideoRecording,
    startAutoCapture,
    maxRetryCount,
    videoCheckInterval,
    facingMode,
    callbacks,
  ]);

  // Handle camera initialization errors
  const handleUserMediaError = useCallback(
    (error: string | DOMException) => {
      callbacks?.onError?.(
        typeof error === "string" ? error : `Camera error: ${error.message}`
      );
      setIsWebcamReady(false);
    },
    [callbacks]
  );

  // Manual capture function
  const handleCapturePhoto = useCallback(() => {
    startTransition(() => {
      capturePhoto();
    });
  }, [capturePhoto, startTransition]);

  // Manual auto capture start function for button
  const handleStartAutoCapture = useCallback(() => {
    if (callbacks?.beforeStartAutoCapture) callbacks.beforeStartAutoCapture();
    startAutoCapture(true); // Manual start
  }, [startAutoCapture, callbacks]);

  // Effects
  useEffect(
    () => () => {
      clearVideoCheckInterval();
      stopAutoCapture();
      clearAutoCapture();
      clearRecordingInterval();
    },
    [
      clearVideoCheckInterval,
      stopAutoCapture,
      clearAutoCapture,
      clearRecordingInterval,
    ]
  );

  useEffect(() => {
    if (
      autoCapture?.startOnReady &&
      isWebcamReady &&
      !isAutoCapturing &&
      !hasAutoStarted
    ) {
      startAutoCapture(false); // Automatic start
    }
  }, [
    autoCapture,
    isWebcamReady,
    isAutoCapturing,
    hasAutoStarted,
    startAutoCapture,
  ]);

  // Render functions
  const renderVideoRecordingControls = () => {
    if (!videoRecording?.hasInterface || forceHideInterface) return null;

    return (
      <div
        className="flex flex-col items-center space-y-2"
        key="video-recording-controls"
      >
        {isRecording ? (
          <>
            <Button
              className="size-12 rounded-full border-2 border-red-500 bg-red-500 p-0 text-white"
              onClick={stopVideoRecording}
            >
              <Square className="size-4" />
            </Button>
            <div className="flex items-center space-x-2 text-white">
              <div className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs">
                {defaultLabels.recording} {Math.floor(recordingDuration / 60)}:
                {String(recordingDuration % 60).padStart(2, "0")}
              </span>
            </div>
          </>
        ) : (
          <Button
            className="size-12 rounded-full border-2 border-white bg-white/10 p-0 text-white"
            disabled={!isWebcamReady}
            onClick={startVideoRecording}
          >
            <Video className="size-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderPhotoCaptureControls = () => {
    if (!photoCapture?.hasInterface || forceHideInterface) return null;

    return (
      <Button
        key="photo-capture-controls"
        className="size-12 rounded-full border-2 border-white bg-white/10 p-0 text-white transition-all hover:bg-white hover:ring-4"
        disabled={isPending || !isWebcamReady}
        onClick={handleCapturePhoto}
      >
        <Camera className="size-4" />
        <span className="sr-only">{defaultLabels.capturePhoto}</span>
      </Button>
    );
  };

  const renderAutoCaptureControls = () => {
    if (!autoCapture?.hasInterface || forceHideInterface) return null;

    return (
      <div
        className="flex flex-col items-center space-y-2"
        key="auto-capture-controls"
      >
        {isAutoCapturing ? (
          <>
            <Button
              className="size-12 rounded-full border-2  p-0 text-white"
              variant="ghost"
              onClick={stopAutoCapture}
            >
              <Pause className="size-4" />
            </Button>
            <div className="flex items-center space-x-2 text-white">
              <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
              <span className="text-xs">{defaultLabels.autoCapturing}</span>
            </div>
          </>
        ) : (
          <Button
            className="size-12 rounded-full border-2 p-0 text-white"
            variant="ghost"
            disabled={!isWebcamReady}
            onClick={handleStartAutoCapture}
          >
            <Play className="size-4" />
            <span className="sr-only">{defaultLabels.startAutoCapture}</span>
          </Button>
        )}
      </div>
    );
  };

  const renderCameraSwitchButton = () => {
    if (!allowCameraSwitch || forceHideInterface) return null;

    return (
      <Button
        key="camera-switch-button"
        className="size-8 rounded-full bg-white/10 p-0 text-white"
        onClick={switchCamera}
        variant="ghost"
      >
        <RefreshCw className="size-4" />
        <span className="sr-only">{defaultLabels.switchCamera}</span>
      </Button>
    );
  };

  const renderCapturedImagePreview = () => {
    if (!showCapturedImage || !capturedImage) return null;

    return (
      <div className={cn("captured size-10", classNames?.previewImage)}>
        <img
          src={capturedImage}
          alt="Captured"
          className="size-10 rounded-md object-cover"
        />
      </div>
    );
  };

  const renderControls = () => {
    const controls = [];

    if (videoRecording?.hasInterface || forceHideInterface) {
      controls.push(renderVideoRecordingControls());
    }

    if (photoCapture?.hasInterface || forceHideInterface) {
      controls.push(renderPhotoCaptureControls());
    }

    if (autoCapture?.hasInterface || forceHideInterface) {
      controls.push(renderAutoCaptureControls());
    }

    return controls.filter(Boolean);
  };

  return (
    <div
      className={cn(
        "webcam-container overflow-hidden rounded-md bg-black relative",
        classNames?.container
      )}
    >
      <div
        className={cn(
          "webcam relative",
          showBorder && "p-2",
          classNames?.webcam
        )}
      >
        <div className="relative">
          <WebcamCore
            audio={false}
            className="background-transparent h-auto w-full rounded-md"
            mirrored={facingMode === "user"}
            onUserMedia={handleUserMedia}
            onUserMediaError={handleUserMediaError}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            videoConstraints={{
              facingMode,
              width: { ideal: 1920, min: 640 },
              height: { ideal: 1920, min: 640 },
              frameRate: { ideal: 30, min: 15 },
              aspectRatio: isMobile ? 1.0 : 4 / 3,
            }}
          />

          {placeholder && isWebcamReady && (
            <div
              className={cn(
                "absolute w-full h-full inset-0 z-3",
                classNames?.placeholder
              )}
            >
              {placeholder}
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "actions flex items-center justify-between p-2 pt-0",
          classNames?.controls,
          interfaceLocation === "absolute"
            ? "absolute bottom-0 left-0 p-4 z-10"
            : ""
        )}
      >
        {renderCapturedImagePreview()}

        <div className="flex items-center space-x-4">
          {renderControls()}
          {renderCameraSwitchButton()}
        </div>
      </div>
    </div>
  );
}
