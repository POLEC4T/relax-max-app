import { BreathingPattern, BreathingPhase } from '../types/breathingPatterns';
import { withSequence, withTiming, withRepeat, Easing, SharedValue, cancelAnimation } from 'react-native-reanimated';

/**
 * Calcule la durée totale d'un cycle de respiration
 */
export const getTotalCycleDuration = (pattern: BreathingPattern): number => {
  return pattern.phases.reduce((total, phase) => total + phase.durationSeconds, 0);
};

/**
 * Crée une animation pour un pattern de respiration spécifique
 */
export const createBreathingAnimation = (
  scaleValue: SharedValue<number>,
  pattern: BreathingPattern,
  onPhaseChange?: (phase: BreathingPhase) => void
): (() => void) | undefined => {
  // Annuler toute animation en cours
  cancelAnimation(scaleValue);
  
  // Valider le pattern
  if (!pattern.phases || pattern.phases.length === 0) {
    console.error('Pattern de respiration invalide');
    return;
  }
  
  // Cas simple: le pattern classique inhale/exhale
  if (pattern.id === 'default') {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.5, {
          duration: 6000, 
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1, // Infinite repetitions
      false // Don't reverse the sequence
    );
  }
  // Cas spécial: le pattern carré
  else if (pattern.id === 'box') {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, { // Rétention poumons pleins
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.5, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.5, { // Rétention poumons vides
          duration: 4000, 
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );
  }
  // Cas spécial: le pattern 4-7-8
  else if (pattern.id === '478') {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(1, { // Rétention poumons pleins
          duration: 7000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.5, {
          duration: 8000, 
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );
  }
  // Fallback - utiliser le pattern par défaut
  else {
    scaleValue.value = withRepeat(
      withSequence(
        withTiming(1, {
          duration: 4000,
          easing: Easing.inOut(Easing.quad),
        }),
        withTiming(0.5, {
          duration: 6000, 
          easing: Easing.inOut(Easing.quad),
        })
      ),
      -1,
      false
    );
  }
  
  // Si une fonction de rappel pour le changement de phase est fournie,
  // mettre en place un système pour notifier les changements de phase
  if (onPhaseChange) {
    // Retourner la fonction de nettoyage pour que la fonction appelante puisse l'utiliser
    return setupPhaseNotifications(pattern, onPhaseChange);
  }
  
  return undefined;
};

/**
 * Configure les notifications de changement de phase
 */
const setupPhaseNotifications = (
  pattern: BreathingPattern,
  onPhaseChange: (phase: BreathingPhase) => void
): (() => void) => {
  // Notifier immédiatement la première phase
  onPhaseChange(pattern.phases[0]);
  
  let phaseIndex = 0;
  let phaseChangeTimer: NodeJS.Timeout | null = null;
  
  const scheduleNextPhase = () => {
    const currentPhase = pattern.phases[phaseIndex];
    const nextPhaseIndex = (phaseIndex + 1) % pattern.phases.length;
    const nextPhase = pattern.phases[nextPhaseIndex];
    const timeToNextPhase = currentPhase.durationSeconds * 1000;
    
    phaseChangeTimer = setTimeout(() => {
      onPhaseChange(nextPhase);
      phaseIndex = nextPhaseIndex;
      scheduleNextPhase();
    }, timeToNextPhase);
  };
  
  // Démarrer la programmation des phases
  scheduleNextPhase();
  
  // Retourner une fonction de nettoyage
  return () => {
    if (phaseChangeTimer) {
      clearTimeout(phaseChangeTimer);
      phaseChangeTimer = null;
    }
  };
};

/**
 * Arrête l'animation en cours et réinitialise la valeur d'échelle
 */
export const stopBreathingAnimation = (scaleValue: SharedValue<number>) => {
  cancelAnimation(scaleValue);
  scaleValue.value = withTiming(0.5, { 
    duration: 500,
    easing: Easing.inOut(Easing.quad)
  });
};

// Exporter un objet vide par défaut pour éviter les avertissements d'Expo Router
// car ce fichier n'est pas une route
export default { __esModule: true };