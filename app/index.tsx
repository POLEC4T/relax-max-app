import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Vibration } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  withRepeat,
  withSequence,
  runOnJS,
  useAnimatedReaction,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');
// Durée de la session en secondes (5 minutes)
const SESSION_DURATION = 5 * 60;

// Patterns de vibration (en millisecondes)
const INHALE_VIBRATION = 10; // Vibration courte pour l'inspiration
const EXHALE_VIBRATION = [0, 30, 30, 30]; // Vibration en deux pulsations pour l'expiration

export default function Home() {
  // Animation value for the breathing circle
  const scale = useSharedValue(0.5);
  // Track breathing state (inhale/exhale)
  const [breathingState, setBreathingState] = useState('Inspirez');
  const [progress, setProgress] = useState(0);
  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Format time en minutes:secondes
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour changer l'état de respiration avec vibration
  const changeBreathingState = (state: string) => {
    setBreathingState(state);
    
    // Déclencher la vibration appropriée selon l'état
    if (state === 'Inspirez') {
      Vibration.vibrate(INHALE_VIBRATION);
    } else if (state === 'Expirez') {
      Vibration.vibrate(EXHALE_VIBRATION);
    }
  };
  
  // Start breathing session
  const startSession = () => {
    // Reset state
    scale.value = 0.5;
    setBreathingState('Inspirez');
    setProgress(0);
    setTimeRemaining(SESSION_DURATION);
    
    // Start animation
    scale.value = withRepeat(
      withSequence(
        // Inhale (expand) - 4 seconds
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        // Exhale (contract) - 6 seconds
        withTiming(0.5, {
          duration: 6000,
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1, // Infinite repetitions
      false // Don't reverse the sequence
    );
    
    // Start timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setIsSessionActive(true);
    
    // Vibration initiale pour l'inspiration
    Vibration.vibrate(INHALE_VIBRATION);
  };
  
  // Stop breathing session
  const stopSession = () => {
    // Stop animation
    cancelAnimation(scale);
    scale.value = withTiming(0.5, { 
      duration: 500,
      easing: Easing.inOut(Easing.quad)
    });
    
    // Stop timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    // Stop any ongoing vibration
    Vibration.cancel();
    
    setIsSessionActive(false);
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      // Make sure to cancel any ongoing vibration when unmounting
      Vibration.cancel();
    };
  }, []);

  // Monitor the animation value to update breathing state
  useAnimatedReaction(
    () => scale.value,
    (currentValue, previousValue) => {
      if (previousValue === undefined || previousValue === null) return;
      
      // When we're in the first half of the animation (scale increasing)
      if (currentValue > previousValue) {
        // If we just switched from exhaling to inhaling
        if (currentValue < 0.55 && previousValue <= 0.5) {
          runOnJS(changeBreathingState)('Inspirez');
        }
      } 
      // When we're in the second half (scale decreasing)
      else if (currentValue < previousValue) {
        // If we just switched from inhaling to exhaling
        if (currentValue > 0.95 && previousValue >= 1) {
          runOnJS(changeBreathingState)('Expirez');
        }
      }
      
      // Calculate approximate progress
      if (currentValue <= 0.5) {
        runOnJS(setProgress)(0);
      } else if (currentValue >= 1) {
        runOnJS(setProgress)(100);
      } else if (currentValue > 0.5 && currentValue < 1 && previousValue < currentValue) {
        // During inhale
        const inhaleProgress = Math.floor(((currentValue - 0.5) / 0.5) * 100);
        runOnJS(setProgress)(inhaleProgress);
      } else if (currentValue > 0.5 && currentValue < 1 && previousValue > currentValue) {
        // During exhale
        const exhaleProgress = Math.floor(((1 - currentValue) / 0.5) * 100);
        runOnJS(setProgress)(100 - exhaleProgress);
      }
    }
  );

  // Determine color based on breathing state
  const stateColor = breathingState === 'Inspirez' ? '#6ECBF5' : '#94D8B9';

  // Animated style for the breathing circle
  const animatedStyle = useAnimatedStyle(() => {
    // Calculate glow intensity based on scale
    const glowOpacity = (scale.value - 0.5) * 0.8 + 0.2;
    
    // Interpolate colors for gradient effect
    const bgColor = isSessionActive 
      ? interpolateColor(
          scale.value,
          [0.5, 0.75, 1],
          [
            'rgba(255, 255, 255, 0.1)', 
            breathingState === 'Inspirez' ? 'rgba(110, 203, 245, 0.2)' : 'rgba(148, 216, 185, 0.2)',
            breathingState === 'Inspirez' ? 'hsla(199, 87.10%, 69.60%, 0.40)' : 'rgba(148, 216, 185, 0.4)'
          ]
        )
      : undefined;
        
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bgColor,
      shadowOpacity: isSessionActive ? glowOpacity : 0,
      shadowColor: breathingState === 'Inspirez' ? '#6ECBF5' : '#94D8B9',
    };
  });

  // Animated style for inner circle
  const innerCircleStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - (scale.value - 0.5) * 0.3 }],
      opacity: isSessionActive ? 0.7 : 0.4,
    };
  });

  // Calculer la progression du timer (pour la barre de progression)
  const timerProgress = (SESSION_DURATION - timeRemaining) / SESSION_DURATION * 100;

  return (
    <View style={styles.container}>
      <Text style={styles.guideText}>
        RelaxMax
      </Text>
      
      {/* Timer display */}
      {isSessionActive && (
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeRemaining)}</Text>
          <View style={styles.progressBarContainer}>
            <View 
              style={[
                styles.progressBar, 
                { width: `${timerProgress}%` }
              ]} 
            />
          </View>
        </View>
      )}
      
      {/* État de respiration au-dessus de la bulle */}
      {isSessionActive && (
        <View style={styles.stateContainer}>
          <View 
            style={[
              styles.stateIndicator, 
              { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
            ]}
          >
            <Text style={[styles.stateText, { color: stateColor }]}>
              {breathingState}
            </Text>
          </View>
        </View>
      )}
      
      <View style={styles.animationContainer}>
        {/* Outer glow effect */}
        <View style={styles.glowContainer}>
          <Animated.View 
            style={[
              styles.glowEffect, 
              { backgroundColor: stateColor, opacity: isSessionActive ? 0.15 : 0 }
            ]} 
          />
        </View>
        
        {/* Main breathing circle */}
        <Animated.View style={[
          styles.circle, 
          animatedStyle, 
          { 
            borderColor: isSessionActive ? stateColor : 'rgba(255, 255, 255, 0.3)',
            borderWidth: isSessionActive ? 3 : 1,
          }
          
        ]}>
          {/* Inner decorative circles */}
          <Animated.View style={[styles.innerCircle, innerCircleStyle]}>
            <View style={[
              styles.decorCircle, 
              { backgroundColor: isSessionActive ? stateColor : 'rgba(255, 255, 255, 0.4)' }
            ]} />
          </Animated.View>
        </Animated.View>
      </View>
      
      {/* Start/Stop button */}
      <TouchableOpacity 
        style={[
          styles.button, 
          { backgroundColor: isSessionActive ? '#d9534f' : '#5cb85c' }
        ]} 
        onPress={isSessionActive ? stopSession : startSession}
      >
        <Text style={styles.buttonText}>
          {isSessionActive ? 'Arrêter' : 'Commencer'}
        </Text>
      </TouchableOpacity>
      
      {isSessionActive && (
        <Text style={styles.instructionText}>
          Inspirez 4s • Expirez 6s
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3B5998', // Bleu Facebook doux
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: {
    fontSize: 30,
    color: 'white',
    fontWeight: '300',
    position: 'absolute',
    top: height * 0.10,
  },
  timerContainer: {
    position: 'absolute',
    top: height * 0.18,
    alignItems: 'center',
    width: width * 0.6,
  },
  timerText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
    marginBottom: 5,
  },
  progressBarContainer: {
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: 'white',
  },
  stateContainer: {
    position: 'absolute',
    top: height * 0.28,
    alignItems: 'center',
  },
  animationContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowEffect: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.425,
    opacity: 0.2,
  },
  circle: {
    width: width * 0.7,
    height: width * 0.7,
    borderRadius: width * 0.35,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 15,
    elevation: 6,
  },
  innerCircle: {
    width: width * 0.55,
    height: width * 0.55,
    borderRadius: width * 0.275,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  decorCircle: {
    width: width * 0.25,
    height: width * 0.25,
    borderRadius: width * 0.125,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  centerDot: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'white',
  },
  instructionText: {
    fontSize: 16,
    color: 'white',
    fontWeight: '300',
    position: 'absolute',
    bottom: height * 0.10,
    opacity: 0.8,
  },
  stateIndicator: {
    paddingVertical: 6,
    paddingHorizontal: 24,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  stateText: {
    fontWeight: '600',
    fontSize: 18,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  button: {
    position: 'absolute',
    bottom: height * 0.20,
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#5cb85c',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
}); 