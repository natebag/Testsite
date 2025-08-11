/**
 * Gaming-Optimized Card Component with Gesture Support
 */

import React, {useRef} from 'react';
import {View, Text, StyleSheet, Dimensions, Alert} from 'react-native';
import {PanGestureHandler, TapGestureHandler, PinchGestureHandler, State} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedGestureHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import {useTheme} from '../theme/ThemeProvider';
import LinearGradient from 'react-native-linear-gradient';

const {width: screenWidth} = Dimensions.get('window');

interface GamingCardProps {
  title: string;
  description: string;
  imageUrl?: string;
  onPress?: () => void;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onLongPress?: () => void;
  onDoubleTap?: () => void;
  enableGestures?: boolean;
}

export const GamingCard: React.FC<GamingCardProps> = ({
  title,
  description,
  imageUrl,
  onPress,
  onSwipeLeft,
  onSwipeRight,
  onLongPress,
  onDoubleTap,
  enableGestures = true,
}) => {
  const theme = useTheme();
  
  // Animated values
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(1);
  
  // Refs for gesture handlers
  const doubleTapRef = useRef(null);
  const singleTapRef = useRef(null);

  // Pan gesture handler
  const panGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      if (!enableGestures) return;
      
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
      
      // Add rotation based on horizontal movement
      rotation.value = (event.translationX / screenWidth) * 30;
      
      // Add opacity effect when swiping
      const swipeDistance = Math.abs(event.translationX);
      opacity.value = Math.max(0.3, 1 - swipeDistance / (screenWidth * 0.8));
    },
    onEnd: (event) => {
      if (!enableGestures) return;
      
      const swipeThreshold = screenWidth * 0.3;
      
      if (event.translationX > swipeThreshold && onSwipeRight) {
        // Swipe right - animate off screen then trigger callback
        translateX.value = withTiming(screenWidth, {duration: 300});
        opacity.value = withTiming(0, {duration: 300});
        runOnJS(onSwipeRight)();
      } else if (event.translationX < -swipeThreshold && onSwipeLeft) {
        // Swipe left - animate off screen then trigger callback
        translateX.value = withTiming(-screenWidth, {duration: 300});
        opacity.value = withTiming(0, {duration: 300});
        runOnJS(onSwipeLeft)();
      } else {
        // Return to center
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
        opacity.value = withSpring(1);
      }
    },
  });

  // Pinch gesture handler
  const pinchGestureEvent = useAnimatedGestureHandler({
    onStart: (_, context) => {
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      if (!enableGestures) return;
      scale.value = Math.max(0.5, Math.min(2, context.startScale * event.scale));
    },
    onEnd: () => {
      scale.value = withSpring(1);
    },
  });

  // Single tap handler
  const onSingleTap = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && onPress) {
      // Add tap animation
      scale.value = withSpring(0.95, {}, () => {
        scale.value = withSpring(1);
      });
      onPress();
    }
  };

  // Double tap handler
  const onDoubleTapEvent = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && onDoubleTap) {
      // Add double tap animation
      scale.value = withSpring(1.1, {}, () => {
        scale.value = withSpring(1);
      });
      onDoubleTap();
    }
  };

  // Long press handler
  const onLongPressEvent = (event: any) => {
    if (event.nativeEvent.state === State.ACTIVE && onLongPress) {
      // Add haptic feedback if available
      // HapticFeedback.trigger('impactMedium');
      onLongPress();
    }
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
      {rotate: `${rotation.value}deg`},
    ],
    opacity: opacity.value,
  }));

  return (
    <PinchGestureHandler onGestureEvent={pinchGestureEvent}>
      <Animated.View>
        <PanGestureHandler onGestureEvent={panGestureEvent}>
          <Animated.View>
            <TapGestureHandler
              ref={doubleTapRef}
              onHandlerStateChange={onDoubleTapEvent}
              numberOfTaps={2}
            >
              <Animated.View>
                <TapGestureHandler
                  ref={singleTapRef}
                  onHandlerStateChange={onSingleTap}
                  waitFor={doubleTapRef}
                  onLongPress={onLongPressEvent}
                >
                  <Animated.View style={[styles.container, animatedStyle]}>
                    <LinearGradient
                      colors={[theme.colors.surface, theme.colors.background]}
                      style={styles.gradient}
                    >
                      {imageUrl && (
                        <View style={[styles.imageContainer, {borderColor: theme.colors.border}]}>
                          {/* Image would go here */}
                          <View style={[styles.imagePlaceholder, {backgroundColor: theme.colors.primary}]} />
                        </View>
                      )}
                      
                      <View style={styles.content}>
                        <Text style={[styles.title, {color: theme.colors.text}]}>{title}</Text>
                        <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
                          {description}
                        </Text>
                      </View>
                      
                      {/* Gaming accent border */}
                      <View style={[styles.accentBorder, {backgroundColor: theme.colors.primary}]} />
                    </LinearGradient>
                  </Animated.View>
                </TapGestureHandler>
              </Animated.View>
            </TapGestureHandler>
          </Animated.View>
        </PanGestureHandler>
      </Animated.View>
    </PinchGestureHandler>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  gradient: {
    flex: 1,
    position: 'relative',
  },
  imageContainer: {
    height: 120,
    margin: 12,
    borderRadius: 8,
    borderWidth: 1,
    overflow: 'hidden',
  },
  imagePlaceholder: {
    flex: 1,
    opacity: 0.1,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  accentBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: '100%',
  },
});