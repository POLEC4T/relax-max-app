import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { BreathingPattern } from '../types/breathingPatterns';

const { width } = Dimensions.get('window');

interface PatternSelectorProps {
  patterns: BreathingPattern[];
  selectedPatternId: string;
  onSelectPattern: (pattern: BreathingPattern) => void;
  onPatternOptions?: (pattern: BreathingPattern, action: 'edit' | 'delete') => void;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
  onPatternOptions
}) => {
  const renderPatternItem = ({ item }: { item: BreathingPattern }) => {
    const isSelected = item.id === selectedPatternId;
    const isCustom = !item.isDefault && item.id.startsWith('custom_');
    
    return (
      <TouchableOpacity
        style={[
          styles.patternItem,
          isSelected && styles.selectedPatternItem
        ]}
        onPress={() => onSelectPattern(item)}
      >
        <View style={styles.patternHeader}>
          <Text style={[styles.patternName, isSelected && styles.selectedPatternText]}>
            {item.name}
          </Text>
          
          {isCustom && onPatternOptions && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity
                style={styles.optionButton}
                onPress={() => onPatternOptions(item, 'edit')}
              >
                <Text style={styles.optionButtonText}>✎</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.optionButton, styles.deleteButton]}
                onPress={() => onPatternOptions(item, 'delete')}
              >
                <Text style={styles.optionButtonText}>×</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        <Text style={[styles.patternDesc, isSelected && styles.selectedPatternText]}>
          {item.description}
        </Text>
        
        <View style={styles.phasesContainer}>
          {item.phases.map((phase, index) => (
            <View 
              key={index} 
              style={[
                styles.phaseIndicator, 
                { 
                  backgroundColor: phase.color,
                  width: 20 + (phase.durationSeconds * 5)
                }
              ]}
            >
              <Text style={styles.phaseText}>{phase.durationSeconds}s</Text>
            </View>
          ))}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Exercices de respiration</Text>
      <FlatList
        data={patterns}
        renderItem={renderPatternItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
    width: '100%',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    marginBottom: 10,
    paddingHorizontal: 15,
  },
  listContent: {
    paddingHorizontal: 10,
  },
  patternItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    padding: 15,
    marginHorizontal: 5,
    width: width * 0.8,
    maxWidth: 300,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  selectedPatternItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  patternHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  patternName: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
    flex: 1,
  },
  optionsContainer: {
    flexDirection: 'row',
  },
  optionButton: {
    marginLeft: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
  },
  optionButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  patternDesc: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
  },
  selectedPatternText: {
    color: 'white',
  },
  phasesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
    marginTop: 5,
  },
  phaseIndicator: {
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 5,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(0, 0, 0, 0.7)',
  },
});

export default PatternSelector; 