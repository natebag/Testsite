/**
 * Camera Screen for Content Creation
 * Handles photo/video capture with gaming-optimized UI
 */

import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  Platform,
} from 'react-native';
import {Camera, useCameraDevices, useFrameProcessor} from 'react-native-vision-camera';
import {useNavigation} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import {useTheme} from '@/components/theme/ThemeProvider';
import {GamingButton} from '@/components/gaming/GamingButton';

const {width, height} = Dimensions.get('window');
const CAPTURE_BUTTON_SIZE = 80;

interface CameraScreenProps {
  route?: {
    params?: {
      mode?: 'photo' | 'video';
    };
  };
}

export const CameraScreen: React.FC<CameraScreenProps> = ({route}) => {
  const navigation = useNavigation();
  const theme = useTheme();
  
  const [hasPermission, setHasPermission] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [cameraPosition, setCameraPosition] = useState<'front' | 'back'>('back');
  const [flashMode, setFlashMode] = useState<'on' | 'off' | 'auto'>('off');
  const [mode, setMode] = useState<'photo' | 'video'>(route?.params?.mode || 'photo');
  const [zoom, setZoom] = useState(1);

  const cameraRef = useRef<Camera>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout>();
  
  // Animation values
  const captureButtonScale = useSharedValue(1);
  const recordingPulse = useSharedValue(0);
  const zoomScale = useSharedValue(1);
  const flashOpacity = useSharedValue(0);

  const devices = useCameraDevices();
  const device = cameraPosition === 'front' ? devices.front : devices.back;

  useEffect(() => {
    checkPermissions();
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      startRecordingTimer();
      recordingPulse.value = withTiming(1, {duration: 1000});
    } else {
      stopRecordingTimer();
      recordingPulse.value = withTiming(0, {duration: 300});
    }
  }, [isRecording]);

  const checkPermissions = async () => {
    try {
      const cameraPermission = await Camera.getCameraPermissionStatus();
      const microphonePermission = await Camera.getMicrophonePermissionStatus();
      
      if (cameraPermission !== 'authorized') {
        const newCameraPermission = await Camera.requestCameraPermission();
        if (newCameraPermission !== 'authorized') {
          Alert.alert(
            'Permission Required',
            'Camera permission is required to capture content.',
            [{text: 'OK', onPress: () => navigation.goBack()}]
          );
          return;
        }
      }

      if (mode === 'video' && microphonePermission !== 'authorized') {
        const newMicrophonePermission = await Camera.requestMicrophonePermission();
        if (newMicrophonePermission !== 'authorized') {
          Alert.alert(
            'Permission Required',
            'Microphone permission is required for video recording.',
            [{text: 'OK'}]
          );
        }
      }

      setHasPermission(true);
    } catch (error) {
      console.error('Permission check failed:', error);
      Alert.alert('Error', 'Failed to check camera permissions');
    }
  };

  const handleCapture = async () => {
    if (!cameraRef.current) return;

    try {
      captureButtonScale.value = withSpring(0.8, {}, () => {
        captureButtonScale.value = withSpring(1);
      });

      if (mode === 'photo') {
        await capturePhoto();
      } else {
        if (isRecording) {
          await stopVideoRecording();
        } else {
          await startVideoRecording();
        }
      }
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('Error', 'Failed to capture content');
    }
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;

    try {
      // Flash effect
      flashOpacity.value = withTiming(1, {duration: 100}, () => {
        flashOpacity.value = withTiming(0, {duration: 200});
      });

      const photo = await cameraRef.current.takePhoto({
        flash: flashMode,
        enableAutoRedEyeReduction: true,
        enableAutoStabilization: true,
        enableShutterSound: true,
      });

      // Navigate to preview/edit screen with photo
      navigation.navigate('ContentPreview' as never, {
        type: 'photo',
        uri: `file://${photo.path}`,
      } as never);
    } catch (error) {
      console.error('Photo capture failed:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const startVideoRecording = async () => {
    if (!cameraRef.current) return;

    try {
      cameraRef.current.startRecording({
        flash: flashMode,
        onRecordingFinished: (video) => {
          runOnJS(handleVideoRecorded)(video);
        },
        onRecordingError: (error) => {
          runOnJS(handleRecordingError)(error);
        },
      });

      setIsRecording(true);
      setRecordingTime(0);
    } catch (error) {
      console.error('Video recording start failed:', error);
      Alert.alert('Error', 'Failed to start video recording');
    }
  };

  const stopVideoRecording = async () => {
    if (!cameraRef.current) return;

    try {
      await cameraRef.current.stopRecording();
      setIsRecording(false);
    } catch (error) {
      console.error('Video recording stop failed:', error);
      Alert.alert('Error', 'Failed to stop video recording');
    }
  };

  const handleVideoRecorded = (video: any) => {
    navigation.navigate('ContentPreview' as never, {
      type: 'video',
      uri: `file://${video.path}`,
      duration: recordingTime,
    } as never);
  };

  const handleRecordingError = (error: any) => {
    console.error('Recording error:', error);
    setIsRecording(false);
    Alert.alert('Recording Error', 'Video recording failed');
  };

  const startRecordingTimer = () => {
    recordingTimerRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopRecordingTimer = () => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
    }
  };

  const toggleCameraPosition = () => {
    setCameraPosition(prev => prev === 'front' ? 'back' : 'front');
  };

  const toggleFlash = () => {
    const modes: Array<'on' | 'off' | 'auto'> = ['off', 'on', 'auto'];
    const currentIndex = modes.indexOf(flashMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setFlashMode(modes[nextIndex]);
  };

  const toggleMode = () => {
    if (isRecording) return; // Don't allow mode change while recording
    setMode(prev => prev === 'photo' ? 'video' : 'photo');
  };

  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Gesture handling for zoom
  const zoomGesture = Gesture.Pinch()
    .onStart(() => {
      zoomScale.value = zoom;
    })
    .onUpdate((event) => {
      const newZoom = Math.min(Math.max(zoomScale.value * event.scale, 1), 10);
      setZoom(newZoom);
    });

  // Animated styles
  const captureButtonStyle = useAnimatedStyle(() => ({
    transform: [{scale: captureButtonScale.value}],
  }));

  const recordingIndicatorStyle = useAnimatedStyle(() => ({
    opacity: interpolate(recordingPulse.value, [0, 1], [0.3, 1]),
    transform: [{scale: interpolate(recordingPulse.value, [0, 1], [1, 1.1])}],
  }));

  const flashOverlayStyle = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  if (!hasPermission) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.permissionText, {color: theme.colors.text}]}>
          Camera permission required
        </Text>
        <GamingButton
          title="Grant Permission"
          onPress={checkPermissions}
          variant="primary"
        />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, {backgroundColor: theme.colors.background}]}>
        <Text style={[styles.permissionText, {color: theme.colors.text}]}>
          Camera not available
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      
      <GestureDetector gesture={zoomGesture}>
        <Camera
          ref={cameraRef}
          style={styles.camera}
          device={device}
          isActive={true}
          photo={mode === 'photo'}
          video={mode === 'video'}
          audio={mode === 'video'}
          zoom={zoom}
        />
      </GestureDetector>

      {/* Flash overlay */}
      <Animated.View style={[styles.flashOverlay, flashOverlayStyle]} />

      {/* Top controls */}
      <View style={styles.topControls}>
        <TouchableOpacity style={styles.controlButton} onPress={() => navigation.goBack()}>
          <Icon name="close" size={24} color="#fff" />
        </TouchableOpacity>
        
        <View style={styles.topRightControls}>
          {isRecording && (
            <Animated.View style={[styles.recordingIndicator, recordingIndicatorStyle]}>
              <Text style={styles.recordingText}>{formatRecordingTime(recordingTime)}</Text>
              <View style={styles.recordingDot} />
            </Animated.View>
          )}
          
          <TouchableOpacity style={styles.controlButton} onPress={toggleFlash}>
            <Icon 
              name={flashMode === 'on' ? 'flash-on' : flashMode === 'auto' ? 'flash-auto' : 'flash-off'} 
              size={24} 
              color="#fff" 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom controls */}
      <View style={styles.bottomControls}>
        {/* Mode toggle */}
        <TouchableOpacity 
          style={[styles.modeButton, {opacity: isRecording ? 0.5 : 1}]}
          onPress={toggleMode}
          disabled={isRecording}
        >
          <Text style={[styles.modeText, {color: mode === 'photo' ? theme.colors.primary : '#fff'}]}>
            PHOTO
          </Text>
          <Text style={[styles.modeText, {color: mode === 'video' ? theme.colors.primary : '#fff'}]}>
            VIDEO
          </Text>
        </TouchableOpacity>

        {/* Capture button */}
        <Animated.View style={captureButtonStyle}>
          <TouchableOpacity 
            style={[
              styles.captureButton,
              isRecording && styles.recordingButton,
              {borderColor: theme.colors.primary}
            ]}
            onPress={handleCapture}
          >
            {mode === 'photo' || !isRecording ? (
              <View style={[styles.captureInner, {backgroundColor: theme.colors.primary}]} />
            ) : (
              <View style={[styles.stopInner, {backgroundColor: theme.colors.error}]} />
            )}
          </TouchableOpacity>
        </Animated.View>

        {/* Camera flip */}
        <TouchableOpacity style={styles.flipButton} onPress={toggleCameraPosition}>
          <Icon name="flip-camera-ios" size={32} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Zoom indicator */}
      {zoom > 1 && (
        <View style={styles.zoomIndicator}>
          <Text style={styles.zoomText}>{zoom.toFixed(1)}x</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  flashOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#fff',
    pointerEvents: 'none',
  },
  topControls: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRightControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  recordingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 10,
  },
  recordingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff4757',
  },
  bottomControls: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 50 : 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modeButton: {
    alignItems: 'center',
  },
  modeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  captureButton: {
    width: CAPTURE_BUTTON_SIZE,
    height: CAPTURE_BUTTON_SIZE,
    borderRadius: CAPTURE_BUTTON_SIZE / 2,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  recordingButton: {
    borderColor: '#ff4757',
  },
  captureInner: {
    width: CAPTURE_BUTTON_SIZE - 20,
    height: CAPTURE_BUTTON_SIZE - 20,
    borderRadius: (CAPTURE_BUTTON_SIZE - 20) / 2,
  },
  stopInner: {
    width: 24,
    height: 24,
    borderRadius: 4,
  },
  flipButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomIndicator: {
    position: 'absolute',
    top: '50%',
    left: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  zoomText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  permissionText: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 20,
  },
});