import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity, Vibration, ScrollView, Modal, Alert } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
  useAnimatedReaction,
  cancelAnimation,
  interpolateColor,
} from 'react-native-reanimated';

// Import des composants et utilitaires
import PatternSelector from './components/PatternSelector';
import PatternCustomizer from './components/PatternCustomizer';
import { breathingPatterns, getDefaultPattern, BreathingPattern, BreathingPhase } from './types/breathingPatterns';
import { createBreathingAnimation, stopBreathingAnimation } from './utils/breathingAnimation';
import { getAllBreathingPatterns, saveCustomBreathingPattern, deleteCustomBreathingPattern } from './utils/storage';

const { width, height } = Dimensions.get('window');
// Durée de la session en secondes (5 minutes)
const SESSION_DURATION = 5 * 60;
// Durée du compte à rebours de préparation en secondes
const PREPARATION_DURATION = 5;

// Patterns de vibration (en millisecondes)
const INHALE_VIBRATION = 10; // Vibration courte pour l'inspiration
const EXHALE_VIBRATION = [0, 30, 30, 30]; // Vibration en deux pulsations pour l'expiration
const COUNTDOWN_VIBRATION = 20; // Vibration pour le compte à rebours

export default function Home() {
  // Animation value for the breathing circle
  const scale = useSharedValue(0.5);
  // Track breathing state
  const [currentPhase, setCurrentPhase] = useState<BreathingPhase | null>(null);
  const [progress, setProgress] = useState(0);
  // Session state
  const [isSessionActive, setIsSessionActive] = useState(false);
  // Preparation countdown state
  const [isPreparing, setIsPreparing] = useState(false);
  const [preparationCountdown, setPreparationCountdown] = useState(PREPARATION_DURATION);
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(SESSION_DURATION);
  
  // État pour le pattern de respiration sélectionné
  const [selectedPattern, setSelectedPattern] = useState<BreathingPattern>(getDefaultPattern());
  // État pour l'ensemble des patterns disponibles (prédéfinis + personnalisés)
  const [availablePatterns, setAvailablePatterns] = useState<BreathingPattern[]>(breathingPatterns);
  
  // État pour le modal de personnalisation
  const [isCustomizerVisible, setIsCustomizerVisible] = useState(false);
  const [patternToEdit, setPatternToEdit] = useState<BreathingPattern | undefined>(undefined);
  
  // Refs
  interface SessionRefs {
    timer: NodeJS.Timeout | null;
    cleanupAnimation: (() => void) | null;
    preparationTimer: NodeJS.Timeout | null;
  }
  
  const sessionRefs = useRef<SessionRefs>({
    timer: null,
    cleanupAnimation: null,
    preparationTimer: null
  });
  
  // Charger tous les patterns au démarrage
  useEffect(() => {
    loadAllPatterns();
  }, []);
  
  // Fonction pour charger tous les patterns
  const loadAllPatterns = async () => {
    const patterns = await getAllBreathingPatterns();
    setAvailablePatterns(patterns);
  };
  
  // Format time en minutes:secondes
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Fonction pour changer l'état de respiration avec vibration
  const handlePhaseChange = (phase: BreathingPhase) => {
    setCurrentPhase(phase);
    
    // Annuler toute vibration en cours avant d'en lancer une nouvelle
    Vibration.cancel();
    
    // Déclencher la vibration appropriée selon l'état
    if (phase.name === 'Inspirez') {
      Vibration.vibrate(INHALE_VIBRATION);
    } else if (phase.name === 'Expirez') {
      Vibration.vibrate(EXHALE_VIBRATION);
    }
  };
  
  // Démarrer le compte à rebours de préparation
  const startPreparation = () => {
    // Réinitialiser le compte à rebours
    setPreparationCountdown(PREPARATION_DURATION);
    setIsPreparing(true);
    
    // Vibration de démarrage
    Vibration.vibrate(COUNTDOWN_VIBRATION);
    
    // Démarrer le timer de préparation
    if (sessionRefs.current.preparationTimer) {
      clearInterval(sessionRefs.current.preparationTimer);
    }
    
    sessionRefs.current.preparationTimer = setInterval(() => {
      setPreparationCountdown(prev => {
        const newValue = prev - 1;
        
        // Vibration à chaque seconde du compte à rebours
        if (newValue > 0) {
          Vibration.vibrate(COUNTDOWN_VIBRATION);
        }
        
        // Quand le compte à rebours se termine, démarrer la session
        if (newValue <= 0) {
          clearInterval(sessionRefs.current.preparationTimer!);
          sessionRefs.current.preparationTimer = null;
          setIsPreparing(false);
          startActualSession();
          return 0;
        }
        
        return newValue;
      });
    }, 1000);
  };
  
  // Démarrer réellement la session une fois le compte à rebours terminé
  const startActualSession = () => {
    // Reset state
    scale.value = 0.5;
    setCurrentPhase(null);
    setProgress(0);
    setTimeRemaining(SESSION_DURATION);
    
    // Annuler toute vibration résiduelle potentielle
    Vibration.cancel();
    
    // Nettoyer l'animation précédente si elle existe
    if (sessionRefs.current.cleanupAnimation) {
      sessionRefs.current.cleanupAnimation();
      sessionRefs.current.cleanupAnimation = null;
    }
    
    // Start animation with selected pattern
    const cleanupAnimation = createBreathingAnimation(scale, selectedPattern, handlePhaseChange);
    
    // Store cleanup function for phase changes
    if (cleanupAnimation) {
      sessionRefs.current.cleanupAnimation = cleanupAnimation;
    }
    
    // Start timer
    if (sessionRefs.current.timer) {
      clearInterval(sessionRefs.current.timer);
    }
    
    sessionRefs.current.timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          stopSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    setIsSessionActive(true);
  };
  
  // Start breathing session (initiates the preparation countdown)
  const startSession = () => {
    startPreparation();
  };
  
  // Stop breathing session
  const stopSession = () => {
    // Arrêter le compte à rebours de préparation s'il est en cours
    if (isPreparing && sessionRefs.current.preparationTimer) {
      clearInterval(sessionRefs.current.preparationTimer);
      sessionRefs.current.preparationTimer = null;
      setIsPreparing(false);
    }
    
    // Stop any ongoing vibration FIRST to ensure it stops immediately
    Vibration.cancel();
    
    // Clean up animation phase changes before stopping animation
    // pour éviter que de nouvelles vibrations ne soient programmées
    if (sessionRefs.current.cleanupAnimation) {
      sessionRefs.current.cleanupAnimation();
      sessionRefs.current.cleanupAnimation = null;
    }
    
    // Stop animation
    stopBreathingAnimation(scale);
    
    // Stop timer
    if (sessionRefs.current.timer) {
      clearInterval(sessionRefs.current.timer);
      sessionRefs.current.timer = null;
    }
    
    // Appeler Vibration.cancel() une deuxième fois pour s'assurer qu'aucune vibration résiduelle ne persiste
    setTimeout(() => {
      Vibration.cancel();
    }, 50);
    
    setIsSessionActive(false);
    setCurrentPhase(null);
  };

  // Clean up timer on component unmount
  useEffect(() => {
    return () => {
      if (sessionRefs.current.timer) {
        clearInterval(sessionRefs.current.timer);
      }
      
      if (sessionRefs.current.preparationTimer) {
        clearInterval(sessionRefs.current.preparationTimer);
      }
      
      // Clean up animation phase changes
      if (sessionRefs.current.cleanupAnimation) {
        sessionRefs.current.cleanupAnimation();
      }
      
      // Make sure to cancel any ongoing vibration when unmounting
      Vibration.cancel();
    };
  }, []);

  // Monitor the animation value to update progress
  useAnimatedReaction(
    () => scale.value,
    (currentValue, previousValue) => {
      if (previousValue === undefined || previousValue === null) return;
      
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

  // Determine color based on current phase
  const stateColor = currentPhase?.color || '#6ECBF5';

  // Sélectionner un nouveau pattern
  const handleSelectPattern = (pattern: BreathingPattern) => {
    setSelectedPattern(pattern);
    
    // Si une session est en cours, arrêter et redémarrer avec le nouveau pattern
    if (isSessionActive) {
      // Annuler toute vibration en cours
      Vibration.cancel();
      
      // Nettoyer l'animation précédente
      if (sessionRefs.current.cleanupAnimation) {
        sessionRefs.current.cleanupAnimation();
        sessionRefs.current.cleanupAnimation = null;
      }
      
      // Stopper l'ancienne animation
      stopBreathingAnimation(scale);
      
      // Démarrer la nouvelle animation avec le nouveau pattern
      const cleanupAnimation = createBreathingAnimation(scale, pattern, handlePhaseChange);
      
      // Stocker la fonction de nettoyage
      if (cleanupAnimation) {
        sessionRefs.current.cleanupAnimation = cleanupAnimation;
      }
    }
  };
  
  // Gérer les options du pattern (modifier, supprimer)
  const handlePatternOptions = (pattern: BreathingPattern, action: 'edit' | 'delete') => {
    // Ne pas permettre de modifier/supprimer les patterns prédéfinis
    const isPredefined = breathingPatterns.some(p => p.id === pattern.id);
    
    if (isPredefined) {
      Alert.alert(
        "Action non disponible",
        "Vous ne pouvez pas modifier ou supprimer un exercice prédéfini."
      );
      return;
    }
    
    if (action === 'edit') {
      setPatternToEdit(pattern);
      setIsCustomizerVisible(true);
    } else if (action === 'delete') {
      Alert.alert(
        "Supprimer l'exercice",
        `Êtes-vous sûr de vouloir supprimer l'exercice "${pattern.name}" ?`,
        [
          { text: "Annuler", style: "cancel" },
          { 
            text: "Supprimer", 
            style: "destructive",
            onPress: async () => {
              // Supprimer le pattern
              await deleteCustomBreathingPattern(pattern.id);
              
              // Rafraîchir la liste
              await loadAllPatterns();
              
              // Si c'était le pattern sélectionné, revenir au pattern par défaut
              if (selectedPattern.id === pattern.id) {
                setSelectedPattern(getDefaultPattern());
              }
            }
          }
        ]
      );
    }
  };
  
  // Ouvrir le modal pour créer un nouveau pattern
  const handleCreatePattern = () => {
    setPatternToEdit(undefined);
    setIsCustomizerVisible(true);
  };
  
  // Sauvegarder un pattern personnalisé
  const handleSavePattern = async (pattern: BreathingPattern) => {
    await saveCustomBreathingPattern(pattern);
    
    // Rafraîchir la liste
    await loadAllPatterns();
    
    // Sélectionner le pattern nouvellement créé/modifié
    setSelectedPattern(pattern);
    
    // Fermer le modal
    setIsCustomizerVisible(false);
  };

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
            `rgba(${parseInt(stateColor.substr(1, 2), 16)}, ${parseInt(stateColor.substr(3, 2), 16)}, ${parseInt(stateColor.substr(5, 2), 16)}, 0.2)`,
            `rgba(${parseInt(stateColor.substr(1, 2), 16)}, ${parseInt(stateColor.substr(3, 2), 16)}, ${parseInt(stateColor.substr(5, 2), 16)}, 0.4)`
          ]
        )
      : undefined;
        
    return {
      transform: [{ scale: scale.value }],
      backgroundColor: bgColor,
      shadowOpacity: isSessionActive ? glowOpacity : 0,
      shadowColor: stateColor,
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
    <ScrollView 
      style={styles.scrollView}
      contentContainerStyle={styles.scrollViewContent}
      bounces={false}
      showsVerticalScrollIndicator={false}
    >
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
        
        {/* Affichage du compte à rebours de préparation */}
        {isPreparing && (
          <View style={styles.preparationOverlay}>
            <View style={styles.preparationContainer}>
              <Text style={styles.preparationText}>Préparez-vous</Text>
              <Text style={styles.countdownText}>{preparationCountdown}</Text>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={stopSession}
              >
                <Text style={styles.cancelButtonText}>Annuler</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        
        {/* État de respiration au-dessus de la bulle */}
        {isSessionActive && currentPhase && !isPreparing && (
          <View style={styles.stateContainer}>
            <View 
              style={[
                styles.stateIndicator, 
                { backgroundColor: 'rgba(255, 255, 255, 0.15)' }
              ]}
            >
              <Text style={[styles.stateText, { color: currentPhase.color }]}>
                {currentPhase.name}
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
        {!isPreparing && (
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
        )}
        
        {isSessionActive && !isPreparing && (
          <Text style={styles.instructionText}>
            {selectedPattern.description}
          </Text>
        )}
        
        {/* Pattern Selector */}
        {!isSessionActive && !isPreparing && (
          <>
            <PatternSelector
              patterns={availablePatterns}
              selectedPatternId={selectedPattern.id}
              onSelectPattern={handleSelectPattern}
              onPatternOptions={handlePatternOptions}
            />
          </>
        )}
        
        {/* Modal pour le customizer de pattern */}
        <Modal
          visible={isCustomizerVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setIsCustomizerVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <PatternCustomizer
                initialPattern={patternToEdit}
                onSavePattern={handleSavePattern}
                onCancel={() => setIsCustomizerVisible(false)}
              />
            </View>
          </View>
        </Modal>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
    backgroundColor: '#3B5998',
  },
  scrollViewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  container: {
    flex: 1,
    backgroundColor: '#3B5998', // Bleu Facebook doux
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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
  preparationOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  preparationContainer: {
    padding: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 20,
    alignItems: 'center',
  },
  preparationText: {
    fontSize: 24,
    color: 'white',
    fontWeight: '300',
    marginBottom: 20,
  },
  countdownText: {
    fontSize: 60,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
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
    bottom: height * 0.15,
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
  createPatternButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 30,
  },
  createPatternText: {
    color: 'white',
    fontWeight: '500',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 600,
  },
});