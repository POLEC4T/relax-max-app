// {
//   id: "coherence55",
//   name: "Cohérence 5‑5",
//   description: "Inspiration de 5 s, expiration de 5 s – 6 respirations/min ; utile pour HRV et gestion du stress",
//   phases: [
//     { name: "Inspirez", durationSeconds: 5, color: "#6ECBF5" },
//     { name: "Expirez", durationSeconds: 5, color: "#94D8B9" },
//   ],
// },

// // 2. Cyclic Sighing : double inspiration + longue expiration
// {
//   id: "cyclicSigh",
//   name: "Soupir cyclique",
//   description: "Inspiration 2 s, seconde petite inspiration 1 s, expiration 6 s – effet calmant immédiat",
//   phases: [
//     { name: "Inspirez (1)", durationSeconds: 2, color: "#6ECBF5" },
//     { name: "Inspirez (2)", durationSeconds: 1, color: "#6ECBF5" },
//     { name: "Expirez longuement", durationSeconds: 6, color: "#94D8B9" },
//   ],
// },

// // 3. Triangle breathing : 4‑4‑4
// {
//   id: "triangle",
//   name: "Triangle 4‑4‑4",
//   description: "Inspiration 4 s, rétention 4 s, expiration 4 s – bon pour concentration et contrôle respiratoire",
//   phases: [
//     { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
//     { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
//     { name: "Expirez", durationSeconds: 4, color: "#94D8B9" },
//   ],
// },

// // 4. 4‑6 (« relax ratio » : l’expiration plus longue)
// {
//   id: "relax46",
//   name: "4‑6 Relax",
//   description: "Inspiration 4 s, expiration 6 s – ratio 1:1,5 pour activer le système parasympathique",
//   phases: [
//     { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
//     { name: "Expirez", durationSeconds: 6, color: "#94D8B9" },
//   ],
// },

// // 5. Nadi Shodhana simplifié : 4‑4‑4‑4 (alternez narines à chaque cycle dans l’UI, si tu implémentes le guidage)
// {
//   id: "nadiShodhana",
//   name: "Nadi Shodhana 4‑4‑4‑4",
//   description: "Inspiration 4 s, rétention 4 s, expiration 4 s, rétention 4 s – traditionnel pranayama",
//   phases: [
//     { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
//     { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
//     { name: "Expirez", durationSeconds: 4, color: "#94D8B9" },
//     { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
//   ],
// },

// // 6. Respiration « 1 min » : 20‑20‑20 (avancée)
// {
//   id: "oneMinuteBreath",
//   name: "1‑Minute Breath",
//   description: "Inspiration 20 s, rétention 20 s, expiration 20 s – exercice avancé de kundalini pour calme profond",
//   phases: [
//     { name: "Inspirez", durationSeconds: 20, color: "#6ECBF5" },
//     { name: "Retenez", durationSeconds: 20, color: "#F5DD90" },
//     { name: "Expirez", durationSeconds: 20, color: "#94D8B9" },
//   ],
// },

export interface BreathingPhase {
  name: string;
  durationSeconds: number;
  color: string;
}

export interface BreathingPattern {
  id: string;
  name: string;
  description: string;
  phases: BreathingPhase[];
  isDefault?: boolean;
}

// Patterns de respiration prédéfinis
export const breathingPatterns: BreathingPattern[] = [
  {
    id: "default",
    name: "Classique",
    description: "Inspiration de 4s, expiration de 6s",
    phases: [
      { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
      { name: "Expirez", durationSeconds: 6, color: "#94D8B9" },
    ],
    isDefault: true,
  },
  {
    id: "box",
    name: "Carré",
    description: "Inspiration, rétention, expiration, rétention - 4s chacune",
    phases: [
      { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
      { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
      { name: "Expirez", durationSeconds: 4, color: "#94D8B9" },
      { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
    ],
  },
  {
    id: "478",
    name: "4-7-8",
    description: "Inspiration de 4s, rétention de 7s, expiration de 8s",
    phases: [
      { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
      { name: "Retenez", durationSeconds: 7, color: "#F5DD90" },
      { name: "Expirez", durationSeconds: 8, color: "#94D8B9" },
    ],
  },
  // {
  //   id: "triangle",
  //   name: "Triangle 4‑4‑4",
  //   description: "Inspiration 4 s, rétention 4 s, expiration 4 s – bon pour concentration et contrôle respiratoire",
  //   phases: [
  //     { name: "Inspirez", durationSeconds: 4, color: "#6ECBF5" },
  //     { name: "Retenez", durationSeconds: 4, color: "#F5DD90" },
  //     { name: "Expirez", durationSeconds: 4, color: "#94D8B9" },
  //   ],
  // },
];

// Fonction pour obtenir le pattern par défaut
export const getDefaultPattern = (): BreathingPattern => {
  return breathingPatterns.find(pattern => pattern.isDefault) || breathingPatterns[0];
};

// Exporter un objet vide par défaut pour éviter les avertissements d'Expo Router
// car ce fichier n'est pas une route
export default { __esModule: true }; 