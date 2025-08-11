/**
 * Gaming-Style Button Component with Animations
 */

import React from 'react';
import {Text, StyleSheet, ViewStyle, TextStyle, Pressable} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useTheme} from '../theme/ThemeProvider';

interface GamingButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | 'outline';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
  glowEffect?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const GamingButton: React.FC<GamingButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
  glowEffect = true,
}) => {
  const theme = useTheme();
  
  // Animation values
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  
  const getColors = () => {
    switch (variant) {
      case 'primary':
        return [theme.colors.primary, theme.colors.primary];
      case 'secondary':
        return [theme.colors.secondary, theme.colors.secondary];
      case 'accent':
        return [theme.colors.accent, theme.colors.accent];
      case 'danger':
        return [theme.colors.error, theme.colors.error];
      case 'outline':
        return ['transparent', 'transparent'];
      default:
        return [theme.colors.primary, theme.colors.primary];
    }
  };

  const getTextColor = () => {
    if (variant === 'outline') {
      return theme.colors.primary;
    }
    return variant === 'primary' ? '#000' : '#fff';
  };

  const getSizeStyle = () => {
    switch (size) {
      case 'small':
        return {
          paddingHorizontal: 12,
          paddingVertical: 8,
          fontSize: 14,
        };
      case 'medium':
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
        };
      case 'large':
        return {
          paddingHorizontal: 24,
          paddingVertical: 16,
          fontSize: 18,
        };
      default:
        return {
          paddingHorizontal: 16,
          paddingVertical: 12,
          fontSize: 16,
        };
    }
  };

  const handlePressIn = () => {
    if (disabled || loading) return;
    
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 300,
    });
    
    if (glowEffect) {
      glowOpacity.value = withTiming(0.3, {
        duration: 150,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 300,
    });
    
    if (glowEffect) {
      glowOpacity.value = withTiming(0, {
        duration: 300,
        easing: Easing.out(Easing.quad),
      });
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    
    // Press animation
    scale.value = withSpring(0.9, {
      damping: 15,
      stiffness: 300,
    }, () => {
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 300,
      });
    });
    
    onPress();
  };

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{scale: scale.value}],
    opacity: disabled ? 0.5 : opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const sizeStyle = getSizeStyle();
  const colors = getColors();

  return (
    <AnimatedPressable
      style={[
        styles.container,
        {
          width: fullWidth ? '100%' : undefined,
        },
        animatedStyle,
        style,
      ]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled || loading}
    >
      {/* Glow effect background */}
      {glowEffect && (
        <Animated.View
          style={[
            styles.glowBackground,
            {
              backgroundColor: colors[0],
            },
            glowStyle,
          ]}
        />
      )}
      
      {/* Main button */}
      <LinearGradient
        colors={colors}
        style={[
          styles.button,
          {
            paddingHorizontal: sizeStyle.paddingHorizontal,
            paddingVertical: sizeStyle.paddingVertical,
            borderColor: variant === 'outline' ? theme.colors.primary : 'transparent',
            borderWidth: variant === 'outline' ? 2 : 0,
          },
        ]}
        start={{x: 0, y: 0}}
        end={{x: 1, y: 1}}
      >
        {loading ? (
          <Text style={[
            styles.text,
            {
              color: getTextColor(),
              fontSize: sizeStyle.fontSize,
            },
            textStyle,
          ]}>
            Loading...
          </Text>
        ) : (
          <>
            {icon && icon}
            <Text style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: sizeStyle.fontSize,
                marginLeft: icon ? 8 : 0,
              },
              textStyle,
            ]}>
              {title}
            </Text>
          </>
        )}
      </LinearGradient>
      
      {/* Border highlight */}
      <Animated.View
        style={[
          styles.borderHighlight,
          {
            borderColor: colors[0],
          },
          glowStyle,
        ]}
      />
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  text: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  glowBackground: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 10,
    zIndex: -1,
  },
  borderHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 8,
    borderWidth: 2,
    pointerEvents: 'none',
  },
});