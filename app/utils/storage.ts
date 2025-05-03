import AsyncStorage from '@react-native-async-storage/async-storage';
import { BreathingPattern, breathingPatterns } from '../types/breathingPatterns';

// Clé de stockage pour les patterns personnalisés
const CUSTOM_PATTERNS_STORAGE_KEY = 'relaxmax_custom_breathing_patterns';

/**
 * Récupère tous les patterns de respiration (prédéfinis + personnalisés)
 */
export const getAllBreathingPatterns = async (): Promise<BreathingPattern[]> => {
  try {
    // Récupérer les patterns personnalisés depuis le stockage
    const customPatterns = await getCustomBreathingPatterns();
    
    // Combiner avec les patterns prédéfinis
    return [...breathingPatterns, ...customPatterns];
  } catch (error) {
    console.error('Erreur lors de la récupération des patterns:', error);
    return breathingPatterns; // Retourner au moins les patterns prédéfinis
  }
};

/**
 * Récupère les patterns personnalisés
 */
export const getCustomBreathingPatterns = async (): Promise<BreathingPattern[]> => {
  try {
    const storedPatternsJson = await AsyncStorage.getItem(CUSTOM_PATTERNS_STORAGE_KEY);
    
    if (!storedPatternsJson) {
      return [];
    }
    
    return JSON.parse(storedPatternsJson);
  } catch (error) {
    console.error('Erreur lors de la récupération des patterns personnalisés:', error);
    return [];
  }
};

/**
 * Sauvegarde un nouveau pattern personnalisé
 */
export const saveCustomBreathingPattern = async (pattern: BreathingPattern): Promise<boolean> => {
  try {
    // Récupérer les patterns existants
    const existingPatterns = await getCustomBreathingPatterns();
    
    // Vérifier si le pattern existe déjà (mise à jour)
    const patternIndex = existingPatterns.findIndex(p => p.id === pattern.id);
    
    if (patternIndex >= 0) {
      // Mettre à jour le pattern existant
      existingPatterns[patternIndex] = pattern;
    } else {
      // Ajouter le nouveau pattern
      existingPatterns.push(pattern);
    }
    
    // Sauvegarder la liste mise à jour
    await AsyncStorage.setItem(
      CUSTOM_PATTERNS_STORAGE_KEY,
      JSON.stringify(existingPatterns)
    );
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la sauvegarde du pattern personnalisé:', error);
    return false;
  }
};

/**
 * Supprime un pattern personnalisé
 */
export const deleteCustomBreathingPattern = async (patternId: string): Promise<boolean> => {
  try {
    // Récupérer les patterns existants
    const existingPatterns = await getCustomBreathingPatterns();
    
    // Filtrer pour retirer le pattern à supprimer
    const updatedPatterns = existingPatterns.filter(p => p.id !== patternId);
    
    // Sauvegarder la liste mise à jour
    await AsyncStorage.setItem(
      CUSTOM_PATTERNS_STORAGE_KEY,
      JSON.stringify(updatedPatterns)
    );
    
    return true;
  } catch (error) {
    console.error('Erreur lors de la suppression du pattern personnalisé:', error);
    return false;
  }
};

// Exporter un objet vide par défaut pour éviter les avertissements d'Expo Router
// car ce fichier n'est pas une route
export default { __esModule: true }; 