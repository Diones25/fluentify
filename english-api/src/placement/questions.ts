export const QUESTIONS = [
  { id: 1, d: 1, q: 'Complete: I ___ a student.', options: ['am', 'is', 'are', 'be'], answer: 0 },
  { id: 2, d: 1, q: "Qual é a tradução de 'house'?", options: ['carro', 'casa', 'escola', 'rua'], answer: 1 },
  { id: 3, d: 2, q: 'She ___ to work every day.', options: ['go', 'goes', 'going', 'gone'], answer: 1 },
  { id: 4, d: 2, q: 'How ___ apples do you want?', options: ['much', 'many', 'few', 'any'], answer: 1 },
  { id: 5, d: 3, q: 'I ___ my keys yesterday.', options: ['lose', 'losed', 'lost', 'loosed'], answer: 2 },
  { id: 6, d: 3, q: 'If it rains, we ___ at home.', options: ['stay', 'will stay', 'stayed', 'would stay'], answer: 1 },
  { id: 7, d: 4, q: 'I wish I ___ more time.', options: ['have', 'had', 'will have', 'having'], answer: 1 },
  { id: 8, d: 4, q: 'By next year, she ___ here for ten years.', options: ['works', 'worked', 'will have worked', 'has worked'], answer: 2 },
  { id: 9, d: 5, q: 'Choose the correct sentence.', options: ['Hardly had he arrived when it started to rain.', 'Hardly he had arrived when it started to rain.', 'Hardly had he arrived than it started rain.', 'Hardly he arrived when rain started.'], answer: 0 },
  { id: 10, d: 5, q: 'The report, ___ findings were controversial, was withdrawn.', options: ['which', 'whose', 'that', 'of which'], answer: 1 },
];

export const LEVEL_ORDER = ['BEGINNER', 'ELEMENTARY', 'INTERMEDIATE', 'UPPER_INTERMEDIATE', 'ADVANCED'] as const;

export function levelFromCorrect(correct: number) {
  if (correct <= 2) return LEVEL_ORDER[0];
  if (correct <= 4) return LEVEL_ORDER[1];
  if (correct <= 6) return LEVEL_ORDER[2];
  if (correct <= 8) return LEVEL_ORDER[3];
  return LEVEL_ORDER[4];
}
