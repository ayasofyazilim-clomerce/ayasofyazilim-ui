'use client';

import * as React from 'react';
import { RefreshCw } from 'lucide-react';
import { useCallback, useRef, useState, useTransition, useEffect } from 'react';
import Webcam from 'react-webcam';
import * as Avatar from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import * as Dialog from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

export function WebcamCapture({
  handleImage,
  type,
  placeholder,
  allowCameraSwitch = false,
  capturedImage,
  classNames,
  languageData,
  onVideoReady,
  webcamRef: externalWebcamRef,
}: {
  type: 'document' | 'selfie';
  handleImage: (imageSrc: string | null) => void;
  allowCameraSwitch?: boolean;
  placeholder?: React.ReactElement;
  capturedImage?: string | null;
  classNames?: {
    placeholder?: string;
  };
  languageData: {
    ['Webcam.CapturedPhoto']: string;
    ['Webcam.SwitchCamera']: string;
    ['Webcam.Capture']: string;
  };
  onVideoReady?: (dimensions: { width: number; height: number }) => void;
  webcamRef?: React.RefObject<Webcam>;
}) {
  const [isPending, startTransition] = useTransition();
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>(
    type === 'selfie' ? 'user' : 'environment'
  );
  const [image, setImage] = useState<string | null>(capturedImage || null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [videoDimensions, setVideoDimensions] = useState({
    width: 0,
    height: 0,
  });
  const internalWebcamRef = useRef<Webcam>(null);
  const webcamRef = externalWebcamRef || internalWebcamRef;
  type Timeout = ReturnType<typeof setTimeout>;
  const videoCheckIntervalRef = useRef<Timeout | null>(null);
  const retryCountRef = useRef(0);

  // Cleanup function for intervals
  const clearVideoCheckInterval = useCallback(() => {
    if (videoCheckIntervalRef.current) {
      clearInterval(videoCheckIntervalRef.current);
      videoCheckIntervalRef.current = null;
    }
  }, []);

  // Check if video is ready and has valid dimensions
  const checkVideoReady = useCallback(() => {
    if (!webcamRef.current?.video) return false;

    const { video } = webcamRef.current;
    const isReady =
      video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0;

    if (isReady) {
      // Update video dimensions when ready
      const newDimensions = {
        width: video.videoWidth,
        height: video.videoHeight,
      };
      setVideoDimensions(newDimensions);

      // Notify parent component if callback provided
      if (onVideoReady) {
        onVideoReady(newDimensions);
      }
    }

    return isReady;
  }, [webcamRef, onVideoReady]);

  // Handle video initialization with continuous checking
  const handleUserMedia = useCallback(() => {
    // Clear any existing interval
    clearVideoCheckInterval();
    retryCountRef.current = 0;

    // Start checking video readiness
    videoCheckIntervalRef.current = setInterval(() => {
      if (checkVideoReady()) {
        setIsVideoReady(true);
        clearVideoCheckInterval();
      } else {
        retryCountRef.current++;

        // If we've tried too many times, let's refresh the component
        if (retryCountRef.current > 10) {
          clearVideoCheckInterval();

          const currentFacingMode = facingMode;
          setFacingMode('user'); // Tür zaten tanımlıysa burada ekstra casting gerekmez

          setTimeout(() => {
            setFacingMode(currentFacingMode);
          }, 100);
        }
      }
    }, 500);

    return () => {
      clearVideoCheckInterval();
    };
  }, [clearVideoCheckInterval, checkVideoReady, facingMode]);

  // Clean up intervals on unmount
  useEffect(
    () => () => {
      clearVideoCheckInterval();
    },
    [clearVideoCheckInterval]
  );

  // Track video element size changes
  useEffect(() => {
    if (!webcamRef.current?.video || !isVideoReady) return;

    const videoElement = webcamRef.current.video;

    // Set up resize observer to update dimensions when video size changes
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;

        // Only update if we have valid dimensions
        if (width > 0 && height > 0) {
          setVideoDimensions({
            width: videoElement.videoWidth,
            height: videoElement.videoHeight,
          });
        }
      }
    });

    resizeObserver.observe(videoElement);
    resizeObserver.disconnect();
  }, [webcamRef, isVideoReady]);

  // Use the built-in getScreenshot method instead of canvas-based capture
  const captureImageSafely = useCallback(
    () =>
      new Promise<string | null>((resolve) => {
        if (!webcamRef.current) {
          resolve(null);
        }

        // If video is not ready yet, wait for it
        if (!isVideoReady) {
          // Set a timeout in case the video never becomes ready
          const timeout = setTimeout(() => {
            resolve(null);
          }, 5000);

          const checkIntervalId = setInterval(() => {
            if (checkVideoReady()) {
              clearTimeout(timeout);
              clearInterval(checkIntervalId);

              // Try to get screenshot after video is ready
              const screenshot = webcamRef.current?.getScreenshot();
              resolve(screenshot || null);
            }
          }, 200);
        }

        // Video is already ready, capture directly
        const screenshot = webcamRef.current?.getScreenshot();
        resolve(screenshot || null);
      }),
    [webcamRef, isVideoReady, checkVideoReady]
  );

  // Replace the original capture function with our safer version
  const capture = useCallback(() => {
    startTransition(async () => {
      const imageSrc = await captureImageSafely();

      if (imageSrc) {
        handleImage(imageSrc);
        setImage(imageSrc);
      }
    });
  }, [captureImageSafely, handleImage]);

  // Create a ref for the webcam container
  const webcamContainerRef = useRef<HTMLDivElement>(null);

  // Create a ref for the webcam container
  return (
    <div className="webcam-container grid overflow-hidden rounded-md bg-black">
      <div className="webcam relative p-2">
        <div ref={webcamContainerRef} className="relative">
          <Webcam
            audio={false}
            className={cn('background-transparent h-auto w-full rounded-md')}
            mirrored={type === 'selfie'}
            onUserMedia={handleUserMedia}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={1}
            videoConstraints={{
              facingMode,
              width: 1080,
              height: 1080,
            }}
          />
          {placeholder && isVideoReady && (
            <div
              className={cn('absolute z-[3]', classNames?.placeholder)}
              style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: `${webcamRef.current?.video?.clientWidth || 0}px`,
                height: `${webcamRef.current?.video?.clientHeight || 0}px`,
                pointerEvents: 'auto', // Enable pointer events on the overlay
              }}
            >
              {React.cloneElement(placeholder as React.ReactElement, {
                videoDimensions,
              })}
            </div>
          )}
        </div>
      </div>
      <div className="actions grid grid-cols-3 items-center justify-center p-2 pt-0">
        <div className="captured size-10">
          <Dialog.Dialog>
            <Dialog.DialogTrigger>
              <Avatar.Avatar className="rounded-md">
                <Avatar.AvatarImage
                  className="rounded-md object-cover"
                  src={image || ''}
                />
                <Avatar.AvatarFallback className="rounded-md bg-white/10" />
              </Avatar.Avatar>
            </Dialog.DialogTrigger>
            <Dialog.DialogContent className="w-max justify-center">
              <img
                alt={languageData['Webcam.CapturedPhoto']}
                className="rounded-md"
                src={image || ''}
              />
            </Dialog.DialogContent>
          </Dialog.Dialog>
        </div>
        <div className="capture flex justify-center">
          <Button
            className="size-16 rounded-full border-4 border-white bg-white/10 p-0 text-white transition-all hover:bg-white hover:ring-4"
            disabled={isPending || !isVideoReady}
            onClick={capture}
          >
            <span className="sr-only">{languageData['Webcam.Capture']}</span>
          </Button>
        </div>
        <div className="switch flex justify-end">
          {allowCameraSwitch ? (
            <Button
              className="size-8 rounded-full bg-white/10 p-0 text-white"
              onClick={() => {
                setFacingMode((prev) =>
                  prev === 'user' ? 'environment' : 'user'
                );
                // Reset video ready state when switching cameras
                setIsVideoReady(false);
              }}
              variant="ghost"
            >
              <RefreshCw className="size-4" />
              <span className="sr-only">
                {languageData['Webcam.SwitchCamera']}
              </span>
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
