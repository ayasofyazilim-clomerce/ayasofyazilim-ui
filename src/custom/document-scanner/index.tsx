import { useCallback, useMemo, useState } from 'react';
import { Loader } from 'lucide-react';
import { cn } from '@repo/ayasofyazilim-ui/lib/utils';
import { Webcam } from '../webcam';
import {
  DEFAULT_CAPTURE_INTERVAL,
  DEFAULT_IMAGE_QUALITY,
  DEFAULT_MAX_DOCUMENT_SIZE,
  DEFAULT_MIN_DOCUMENT_SIZE,
} from './consts';
import { CornerAdjustment } from './corner-adjustment';
import { useDocumentCapture } from './hooks/use-document-capture';
import { useDocumentScanner } from './hooks/use-document-scanner';
import { usePerspectiveCrop } from './hooks/use-perspective-crop';
import { DocumentScannerProps, ScannerStatus } from './types';
import { Skeleton } from '@repo/ayasofyazilim-ui/components/skeleton';

export function DocumentScanner({
  // Core callbacks
  onDocumentCropped,
  onDocumentDetected,
  onCornersChanged,
  onError,
  onStatusChange,
  onCameraReady,
  onScanAttempt,
  onImageCapture,

  // Basic configuration
  className = '',
  captureInterval = DEFAULT_CAPTURE_INTERVAL,

  // Feature toggles
  allowCrop = true,
  allowRetry = true,
  allowCornerAdjustment = true,
  allowCameraSwitch = true,
  showWebcamControls = false,

  // UI Text customization
  cropButtonText = 'Crop',
  retryButtonText = 'Scan Again',

  // Visual styling
  cornerColor = 'bg-white/80',
  cornerTouchAreaSize = 20,

  // Detection settings
  minDocumentSize = DEFAULT_MIN_DOCUMENT_SIZE,
  maxDocumentSize = DEFAULT_MAX_DOCUMENT_SIZE,
  detectionConfidence = 0.8,

  // Image processing
  imageQuality = DEFAULT_IMAGE_QUALITY,

  // Magnifier settings
  showMagnifier = true,
  magnifierSize = 60,
  zoomLevel = 2,

  // Advanced settings
  customDetectionAlgorithm,

  // Custom components
  customControls,
  customOverlay,

  // Webcam interface
  interfaceLocation = 'absolute',
  showBorder = true,
}: DocumentScannerProps) {
  const [webCamKey, setWebCamKey] = useState(() => Date.now().toString());
  const [status, setStatus] = useState<ScannerStatus>('scanning');

  // Combine callbacks for hooks
  const callbacks = useMemo(
    () => ({
      onDocumentCropped,
      onDocumentDetected,
      onCornersChanged,
      onError,
      onStatusChange: (newStatus: ScannerStatus) => {
        setStatus(newStatus);
        onStatusChange?.(newStatus);
      },
      onCameraReady,
      onScanAttempt,
      onImageCapture,
    }),
    [
      onDocumentCropped,
      onDocumentDetected,
      onCornersChanged,
      onError,
      onStatusChange,
      onCameraReady,
      onScanAttempt,
      onImageCapture,
    ]
  );

  // Detection settings
  const detectionSettings = useMemo(
    () => ({
      minDocumentSize,
      maxDocumentSize,
      detectionConfidence,
    }),
    [minDocumentSize, maxDocumentSize, detectionConfidence]
  );

  // Main document scanner state
  const {
    videoDimensions,
    detectedCorners,
    capturedImage,
    handleVideoReady,
    handleCornersChange,
    handleError,
    handleImageCrop,
    handleRetry: originalHandleRetry,
    setCapturedImage,
    setDetectedCorners,
  } = useDocumentScanner(callbacks);

  // Enhanced retry handler that resets webcam
  const handleRetry = useCallback(() => {
    originalHandleRetry();
    setWebCamKey(Date.now().toString());
  }, [originalHandleRetry]);

  // Document capture logic
  const handleCapture = useDocumentCapture({
    videoDimensions,
    callbacks,
    customDetectionAlgorithm,
    detectionSettings,
    setCapturedImage,
    setDetectedCorners,
    handleError,
  });

  // Perspective cropping logic
  const handleCrop = usePerspectiveCrop({
    videoDimensions,
    imageQuality,
    handleImageCrop,
    handleError,
  });

  // Webcam configuration
  const webcamCallbacks = useMemo(
    () => ({
      onWebcamReady: handleVideoReady,
      onAutoPhotoCaptured: handleCapture,
    }),
    [handleVideoReady, handleCapture]
  );

  const webcamClassNames = useMemo(
    () => ({
      placeholder: 'block',
    }),
    []
  );

  const webcamAutoCapture = useMemo(
    () => ({
      captureInterval,
      hasInterface: showWebcamControls,
      startOnReady: true,
      quality: imageQuality,
      stopOnCapture: true,
    }),
    [captureInterval, imageQuality, showWebcamControls]
  );

  const webcamPlaceholder = useMemo(() => {
    if (status === 'scanning') {
      return (
        <Skeleton className="w-full h-full bg-white/50 flex items-center justify-center">
          <Loader className="size-4 animate-spin" />
        </Skeleton>
      );
    }
    if (detectedCorners && capturedImage && allowCornerAdjustment) {
      return (
        <CornerAdjustment
          capturedImage={capturedImage}
          detectedCorners={detectedCorners}
          videoDimensions={videoDimensions}
          onCornersChange={handleCornersChange}
          onCrop={() => handleCrop(capturedImage, detectedCorners)}
          onRetry={handleRetry}
          cornerColor={cornerColor}
          cornerTouchAreaSize={cornerTouchAreaSize}
          allowCrop={allowCrop}
          allowRetry={allowRetry}
          cropButtonText={cropButtonText}
          retryButtonText={retryButtonText}
          showMagnifier={showMagnifier}
          magnifierSize={magnifierSize}
          zoomLevel={zoomLevel}
        />
      );
    }

    return undefined;
  }, [
    status,
    detectedCorners,
    allowCornerAdjustment,
    videoDimensions,
    capturedImage,
    cornerTouchAreaSize,
    cornerColor,
    handleCornersChange,
    handleCrop,
    handleRetry,
    allowCrop,
    allowRetry,
    cropButtonText,
    retryButtonText,
    showMagnifier,
    magnifierSize,
    zoomLevel,
  ]);

  const isInCornerAdjustmentMode =
    (detectedCorners && capturedImage && allowCornerAdjustment) || false;

  return (
    <div
      className={cn(
        'container relative mx-auto max-w-3xl overflow-hidden p-4',
        className
      )}
    >
      {customOverlay}
      <Webcam
        key={webCamKey}
        classNames={webcamClassNames}
        callbacks={webcamCallbacks}
        defaultCamera="back"
        autoCapture={webcamAutoCapture}
        allowCameraSwitch={allowCameraSwitch}
        placeholder={webcamPlaceholder}
        interfaceLocation={interfaceLocation}
        showBorder={showBorder}
        forceHideInterface={isInCornerAdjustmentMode}
      />
      {customControls && <div className="mt-4">{customControls}</div>}
    </div>
  );
}
