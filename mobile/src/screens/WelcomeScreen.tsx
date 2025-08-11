/**
 * Welcome Screen
 */

import React, {useEffect} from 'react';
import {View, Text, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';
import {GamingButton} from '@/components/gaming/GamingButton';
import {useTheme} from '@/components/theme/ThemeProvider';

const {width, height} = Dimensions.get('window');

export const WelcomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const theme = useTheme();

  // Animation values
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(50);
  const titleOpacity = useSharedValue(0);
  const descriptionOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Start entrance animations
    logoScale.value = withSpring(1, {damping: 15});
    logoOpacity.value = withTiming(1, {duration: 800});
    
    titleTranslateY.value = withDelay(300, withSpring(0, {damping: 15}));
    titleOpacity.value = withDelay(300, withTiming(1, {duration: 600}));
    
    descriptionOpacity.value = withDelay(600, withTiming(1, {duration: 600}));
    buttonOpacity.value = withDelay(900, withTiming(1, {duration: 600}));
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{scale: logoScale.value}],
    opacity: logoOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    transform: [{translateY: titleTranslateY.value}],
    opacity: titleOpacity.value,
  }));

  const descriptionStyle = useAnimatedStyle(() => ({
    opacity: descriptionOpacity.value,
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
  }));

  const handleGetStarted = () => {
    navigation.navigate('Auth' as never);
  };

  return (
    <LinearGradient
      colors={[theme.colors.background, theme.colors.surface]}
      style={styles.container}
    >
      <View style={styles.content}>
        {/* Logo */}
        <Animated.View style={[styles.logoContainer, logoStyle]}>
          <View style={[styles.logo, {backgroundColor: theme.colors.primary}]}>
            <Text style={styles.logoText}>MLG</Text>
          </View>
        </Animated.View>

        {/* Title */}
        <Animated.Text style={[styles.title, {color: theme.colors.text}, titleStyle]}>
          Welcome to MLG.clan
        </Animated.Text>

        {/* Description */}
        <Animated.Text style={[styles.description, {color: theme.colors.textSecondary}, descriptionStyle]}>
          Join the ultimate gaming community. Vote on content, participate in governance, 
          and earn rewards with your clan.
        </Animated.Text>

        {/* Features */}
        <Animated.View style={[styles.features, descriptionStyle]}>
          <FeatureItem
            icon="🏆"
            title="Competitive Gaming"
            description="Join tournaments and climb the leaderboards"
          />
          <FeatureItem
            icon="🗳️"
            title="Decentralized Governance"
            description="Vote on proposals and shape the platform"
          />
          <FeatureItem
            icon="💰"
            title="Earn Rewards"
            description="Get tokens for quality content and participation"
          />
        </Animated.View>

        {/* Get Started Button */}
        <Animated.View style={[styles.buttonContainer, buttonStyle]}>
          <GamingButton
            title="Get Started"
            onPress={handleGetStarted}
            variant="primary"
            size="large"
            fullWidth
            glowEffect
          />
        </Animated.View>
      </View>
    </LinearGradient>
  );
};

interface FeatureItemProps {
  icon: string;
  title: string;
  description: string;
}

const FeatureItem: React.FC<FeatureItemProps> = ({icon, title, description}) => {
  const theme = useTheme();

  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, {color: theme.colors.text}]}>{title}</Text>
        <Text style={[styles.featureDescription, {color: theme.colors.textSecondary}]}>
          {description}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    marginBottom: 32,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  logoText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#000',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 48,
    paddingHorizontal: 12,
  },
  features: {
    width: '100%',
    marginBottom: 48,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    paddingHorizontal: 12,
  },
  featureIcon: {
    fontSize: 32,
    marginRight: 16,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  buttonContainer: {
    width: '100%',
    paddingHorizontal: 12,
  },
});