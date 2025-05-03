import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { BreathingPattern, BreathingPhase } from '../types/breathingPatterns';

interface PatternCustomizerProps {
  onSavePattern: (pattern: BreathingPattern) => void;
  onCancel: () => void;
  initialPattern?: BreathingPattern;
}

const DEFAULT_COLORS = {
  inhale: '#6ECBF5',  // Bleu
  exhale: '#94D8B9',  // Vert
  hold: '#F5DD90',    // Jaune
};

const PatternCustomizer: React.FC<PatternCustomizerProps> = ({
  onSavePattern,
  onCancel,
  initialPattern
}) => {
  // Utilise un pattern initial ou crée un nouveau
  const [name, setName] = useState(initialPattern?.name || 'Mon exercice personnalisé');
  const [description, setDescription] = useState(initialPattern?.description || '');
  const [phases, setPhases] = useState<BreathingPhase[]>(
    initialPattern?.phases || [
      { name: 'Inspirez', durationSeconds: 4, color: DEFAULT_COLORS.inhale },
      { name: 'Expirez', durationSeconds: 6, color: DEFAULT_COLORS.exhale },
    ]
  );

  // Ajouter une nouvelle phase
  const addPhase = (type: 'inhale' | 'exhale' | 'hold') => {
    let newPhase: BreathingPhase;
    
    switch (type) {
      case 'inhale':
        newPhase = { name: 'Inspirez', durationSeconds: 4, color: DEFAULT_COLORS.inhale };
        break;
      case 'exhale':
        newPhase = { name: 'Expirez', durationSeconds: 4, color: DEFAULT_COLORS.exhale };
        break;
      case 'hold':
        newPhase = { name: 'Retenez', durationSeconds: 4, color: DEFAULT_COLORS.hold };
        break;
    }
    
    setPhases([...phases, newPhase]);
  };

  // Mettre à jour la durée d'une phase
  const updatePhaseDuration = (index: number, duration: string) => {
    const durationValue = parseInt(duration);
    
    if (isNaN(durationValue) || durationValue < 1) {
      return; // Ignorer les valeurs non valides
    }
    
    const updatedPhases = [...phases];
    updatedPhases[index] = { 
      ...updatedPhases[index], 
      durationSeconds: Math.min(durationValue, 15) // Limiter à 15 secondes max
    };
    
    setPhases(updatedPhases);
  };

  // Supprimer une phase
  const removePhase = (index: number) => {
    if (phases.length <= 1) {
      Alert.alert('Impossible de supprimer', 'Vous devez avoir au moins une phase.');
      return;
    }
    
    const updatedPhases = [...phases];
    updatedPhases.splice(index, 1);
    setPhases(updatedPhases);
  };

  // Réorganiser les phases (monter)
  const movePhaseUp = (index: number) => {
    if (index === 0) return;
    
    const updatedPhases = [...phases];
    [updatedPhases[index - 1], updatedPhases[index]] = [updatedPhases[index], updatedPhases[index - 1]];
    setPhases(updatedPhases);
  };

  // Réorganiser les phases (descendre)
  const movePhaseDown = (index: number) => {
    if (index === phases.length - 1) return;
    
    const updatedPhases = [...phases];
    [updatedPhases[index], updatedPhases[index + 1]] = [updatedPhases[index + 1], updatedPhases[index]];
    setPhases(updatedPhases);
  };

  // Sauvegarder le pattern
  const savePattern = () => {
    if (!name.trim()) {
      Alert.alert('Erreur', 'Veuillez donner un nom à votre exercice.');
      return;
    }
    
    const pattern: BreathingPattern = {
      id: initialPattern?.id || `custom_${Date.now()}`,
      name: name.trim(),
      description: description.trim() || `Pattern personnalisé avec ${phases.length} phases`,
      phases: phases,
    };
    
    onSavePattern(pattern);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Personnaliser un exercice</Text>
      
      {/* Informations générales */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Nom</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Nom de l'exercice"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={styles.input}
            value={description}
            onChangeText={setDescription}
            placeholder="Description brève de l'exercice"
            placeholderTextColor="rgba(255,255,255,0.5)"
          />
        </View>
      </View>
      
      {/* Liste des phases */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Phases</Text>
        
        {phases.map((phase, index) => (
          <View key={index} style={styles.phaseItem}>
            <View style={[styles.phaseColorIndicator, { backgroundColor: phase.color }]} />
            <Text style={styles.phaseName}>{phase.name}</Text>
            <TextInput
              style={styles.durationInput}
              value={phase.durationSeconds.toString()}
              onChangeText={(text) => updatePhaseDuration(index, text)}
              keyboardType="number-pad"
              maxLength={2}
            />
            <Text style={styles.secondsText}>sec</Text>
            
            <View style={styles.phaseActions}>
              <TouchableOpacity onPress={() => movePhaseUp(index)} disabled={index === 0}>
                <Text style={[styles.actionButton, index === 0 && styles.disabledButton]}>↑</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => movePhaseDown(index)} disabled={index === phases.length - 1}>
                <Text style={[styles.actionButton, index === phases.length - 1 && styles.disabledButton]}>↓</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removePhase(index)}>
                <Text style={styles.deleteButton}>×</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
        
        {/* Boutons d'ajout de phase */}
        <View style={styles.addPhaseContainer}>
          <TouchableOpacity 
            style={[styles.addPhaseButton, { backgroundColor: DEFAULT_COLORS.inhale }]}
            onPress={() => addPhase('inhale')}
          >
            <Text style={styles.addPhaseText}>+ Inspiration</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addPhaseButton, { backgroundColor: DEFAULT_COLORS.hold }]}
            onPress={() => addPhase('hold')}
          >
            <Text style={styles.addPhaseText}>+ Rétention</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.addPhaseButton, { backgroundColor: DEFAULT_COLORS.exhale }]}
            onPress={() => addPhase('exhale')}
          >
            <Text style={styles.addPhaseText}>+ Expiration</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Boutons de validation */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.buttonText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveButton} onPress={savePattern}>
          <Text style={styles.buttonText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    maxHeight: '80%',
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
    textAlign: 'center',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 8,
  },
  inputContainer: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 6,
    padding: 10,
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  phaseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  phaseColorIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  phaseName: {
    flex: 1,
    color: 'white',
    fontSize: 14,
  },
  durationInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 4,
    width: 40,
    padding: 6,
    textAlign: 'center',
    color: 'white',
    marginRight: 4,
  },
  secondsText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 12,
    marginRight: 10,
  },
  phaseActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    color: 'white',
    fontSize: 18,
    paddingHorizontal: 6,
  },
  disabledButton: {
    opacity: 0.3,
  },
  deleteButton: {
    color: '#ff6b6b',
    fontSize: 22,
    paddingHorizontal: 6,
  },
  addPhaseContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  addPhaseButton: {
    flex: 1,
    marginHorizontal: 4,
    borderRadius: 6,
    padding: 8,
    alignItems: 'center',
  },
  addPhaseText: {
    color: 'rgba(0, 0, 0, 0.7)',
    fontWeight: '600',
    fontSize: 12,
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 8,
    padding: 12,
    marginRight: 8,
    alignItems: 'center',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#5cb85c',
    borderRadius: 8,
    padding: 12,
    marginLeft: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontWeight: '600',
  },
});

export default PatternCustomizer; 