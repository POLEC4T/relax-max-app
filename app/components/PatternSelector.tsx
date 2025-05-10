import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Platform,
} from "react-native";
import { BreathingPattern } from "../types/breathingPatterns";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.85;
const SPACING_FOR_CARD_INSET = width / 2 - CARD_WIDTH / 2;

interface PatternSelectorProps {
  patterns: BreathingPattern[];
  selectedPatternId: string;
  onSelectPattern: (pattern: BreathingPattern) => void;
  onPatternOptions?: (
    pattern: BreathingPattern,
    action: "edit" | "delete"
  ) => void;
}

const PatternSelector: React.FC<PatternSelectorProps> = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
  onPatternOptions,
}) => {
  const flatListRef = useRef<FlatList<BreathingPattern>>(null);
  const [activeIndex, setActiveIndex] = useState(
    patterns.findIndex((p) => p.id === selectedPatternId) || 0
  );

  // Effectuer le scroll initial vers le pattern sélectionné
  useEffect(() => {
    const selectedIndex = patterns.findIndex(p => p.id === selectedPatternId);
    if (selectedIndex !== -1 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: selectedIndex,
          animated: false,
          viewPosition: 0.5
        });
      }, 100);
    }
  }, []);

  const getPatternIcon = (pattern: BreathingPattern) => {
    // Assigner différents icônes en fonction du type de pattern
    if (pattern.id.includes("box")) {
      return "🔄";
    } else if (pattern.id.includes("478")) {
      return "🌊";
    } else if (pattern.id.includes("triangle")) {
      return "🔺";
    } else if (pattern.id.startsWith("custom_")) {
      return "✨";
    } else {
      return "🫁";
    }
  };

  const renderPatternItem = ({
    item,
    index,
  }: {
    item: BreathingPattern;
    index: number;
  }) => {
    const isSelected = item.id === selectedPatternId;
    const isCustom = !item.isDefault && item.id.startsWith("custom_");

    // Calculer la durée totale de toutes les phases
    const totalDuration = item.phases.reduce(
      (sum, phase) => sum + phase.durationSeconds,
      0
    );

    return (
      <View style={styles.patternItemContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => onSelectPattern(item)}
          style={styles.touchableContainer}
        >
          <View
            style={[
              styles.patternItem,
              isSelected
                ? styles.selectedPatternItem
                : styles.unselectedPatternItem,
            ]}
          >
            <View style={styles.patternHeader}>
              <View style={styles.patternNameContainer}>
                <Text style={styles.patternIcon}>{getPatternIcon(item)}</Text>
                <Text
                  style={[
                    styles.patternName,
                    isSelected && styles.selectedPatternText,
                  ]}
                >
                  {item.name}
                </Text>
              </View>

              {isCustom && onPatternOptions && (
                <View style={styles.optionsContainer}>
                  <TouchableOpacity
                    style={styles.optionButton}
                    onPress={() => onPatternOptions(item, "edit")}
                  >
                    <Text style={styles.optionButtonText}>✎</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.optionButton, styles.deleteButton]}
                    onPress={() => onPatternOptions(item, "delete")}
                  >
                    <Text style={styles.optionButtonText}>×</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <Text
              style={[
                styles.patternDesc,
                isSelected && styles.selectedPatternText,
              ]}
            >
              {item.description}
            </Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.phases.length}</Text>
                <Text style={styles.statLabel}>Phases</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{totalDuration}s</Text>
                <Text style={styles.statLabel}>Cycle</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>
                  {Math.round(60 / totalDuration)}
                </Text>
                <Text style={styles.statLabel}>BPM</Text>
              </View>
            </View>

            <View style={styles.phasesContainer}>
              {item.phases.map((phase, idx) => {
                // Calculer la largeur relative pour chaque phase
                const phaseWidth =
                  (phase.durationSeconds / totalDuration) * 100;

                return (
                  <View
                    key={idx}
                    style={[
                      styles.phaseIndicatorContainer,
                      { width: `${phaseWidth}%` },
                    ]}
                  >
                    <View
                      style={[
                        styles.phaseIndicator,
                        { backgroundColor: phase.color },
                      ]}
                    >
                      <Text style={styles.phaseText}>{phase.name}</Text>
                      <Text style={styles.phaseDuration}>
                        {phase.durationSeconds}s
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>

            {isSelected && <View style={styles.selectedIndicator} />}
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  const handleViewableItemsChanged = React.useRef(({ viewableItems }: { viewableItems: Array<ViewToken<BreathingPattern>> }) => {
    const firstVisibleItem = viewableItems.find(item => item.index !== null);
    if (firstVisibleItem && firstVisibleItem.index !== null) {
      setActiveIndex(firstVisibleItem.index);
    }
  }).current;

  const handleMomentumScrollEnd = () => {
    if (activeIndex >= 0 && patterns[activeIndex].id !== selectedPatternId) {
      onSelectPattern(patterns[activeIndex]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Exercices de respiration</Text>
        <Text style={styles.subtitle}>Choisissez votre technique</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={patterns}
        renderItem={renderPatternItem}
        keyExtractor={(item) => item.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: SPACING_FOR_CARD_INSET,
        }}
        snapToInterval={CARD_WIDTH}
        snapToAlignment="center"
        decelerationRate="fast"
        onViewableItemsChanged={handleViewableItemsChanged}
        viewabilityConfig={{
          itemVisiblePercentThreshold: 50
        }}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH,
          offset: CARD_WIDTH * index,
          index,
        })}
        onMomentumScrollEnd={handleMomentumScrollEnd}
      />

      <View style={styles.pagination}>
        {patterns.map((_, index) => (
          <View
            key={`dot-${index}`}
            style={[
              styles.dot,
              { opacity: activeIndex === index ? 1 : 0.4, 
                transform: [{ scale: activeIndex === index ? 1.2 : 0.8 }] }
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  headerContainer: {
    paddingHorizontal: 20,
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "white",
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
    marginBottom: 10,
  },
  patternItemContainer: {
    width: CARD_WIDTH,
    paddingHorizontal: 10,
  },
  touchableContainer: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  patternItem: {
    borderRadius: 20,
    padding: 20,
    height: "auto",
    minHeight: 220,
    justifyContent: "space-between",
  },
  selectedPatternItem: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  unselectedPatternItem: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
  },
  patternHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  patternNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  patternIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  patternName: {
    fontSize: 20,
    fontWeight: "700",
    color: "white",
    flex: 1,
  },
  optionsContainer: {
    flexDirection: "row",
  },
  optionButton: {
    marginLeft: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  deleteButton: {
    backgroundColor: "rgba(255, 107, 107, 0.3)",
  },
  optionButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
  },
  patternDesc: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 15,
    lineHeight: 20,
  },
  selectedPatternText: {
    color: "white",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.15)",
    padding: 10,
    borderRadius: 10,
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.6)",
  },
  phasesContainer: {
    flexDirection: "row",
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  phaseIndicatorContainer: {
    height: "100%",
  },
  phaseIndicator: {
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
    flex: 1,
    borderRadius: 0,
  },
  phaseText: {
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(0, 0, 0, 0.7)",
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 10,
  },
  phaseDuration: {
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(0, 0, 0, 0.5)",
    position: "absolute",
    bottom: 2,
    zIndex: 10,
  },
  selectedIndicator: {
    position: "absolute",
    bottom: -8,
    alignSelf: "center",
    width: 60,
    height: 3,
    borderRadius: 2,
    backgroundColor: "white",
  },
  pagination: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  dot: {
    height: 8,
    width: 8,
    borderRadius: 4,
    marginHorizontal: 4,
    backgroundColor: "white",
  },
});

export default PatternSelector;
