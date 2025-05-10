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
  
  // Créer une séquence d'animation dynamique basée sur les phases du pattern
  const animationSequence = [];
  
  for (const phase of pattern.phases) {
    const durationMs = phase.durationSeconds * 1000;
    
    // Déterminer la valeur d'échelle en fonction du nom de la phase
    let targetScale = 0.5; // Taille par défaut (expiration)
    
    if (phase.name.toLowerCase().includes('inspir')) {
      // Phase d'inspiration: agrandir le cercle
      targetScale = 1;
    } else if (phase.name.toLowerCase().includes('reten')) {
      // Phase de rétention: maintenir la taille actuelle
      // Si c'est après une inspiration, garder le cercle grand
      // Si c'est après une expiration, garder le cercle petit
      
      // Trouver l'index de la phase actuelle
      const currentIndex = pattern.phases.findIndex(p => p === phase);
      const previousIndex = currentIndex > 0 ? currentIndex - 1 : pattern.phases.length - 1;
      const previousPhase = pattern.phases[previousIndex];
      
      // Si la phase précédente était une inspiration, on reste grand (1)
      // Sinon on reste petit (0.5)
      if (previousPhase.name.toLowerCase().includes('inspir')) {
        targetScale = 1;
      } else {
        targetScale = 0.5;
      }
    }
    // Pour les phases d'expiration, on utilise targetScale = 0.5 (défini par défaut)
    
    // Ajouter cette étape à la séquence d'animation
    animationSequence.push(
      withTiming(targetScale, {
        duration: durationMs,
        easing: Easing.inOut(Easing.quad),
      })
    );
  }
  
  // Créer et appliquer l'animation complète
  if (animationSequence.length > 0) {
    scaleValue.value = withRepeat(
      withSequence(...animationSequence),
      -1, // Répétitions infinies
      false // Ne pas inverser la séquence
    );
  } else {
    // Fallback si aucune phase n'est définie
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