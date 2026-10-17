export type Mission = {
  id: string;
  title: string;
  emoji: string;
  minLevel: number; // índice em LEVEL_ORDER (0 = BEGINNER ... 4 = ADVANCED)
  role: string;
  setup: string;
  goals: string[];
  starter: string;
};

export const MISSIONS: Mission[] = [
  {
    id: 'restaurant', title: 'Pedir uma mesa e a conta', emoji: '🍽️', minLevel: 0,
    role: 'a friendly waiter at a restaurant', setup: 'The student has just arrived at the restaurant.',
    goals: ['Pedir uma mesa para duas pessoas', 'Pedir uma bebida', 'Pedir a conta'],
    starter: 'Good evening! Welcome to our restaurant. How can I help you?',
  },
  {
    id: 'hotel', title: 'Fazer check-in no hotel', emoji: '🏨', minLevel: 1,
    role: 'a hotel receptionist', setup: 'The student arrives at the hotel to check in.',
    goals: ['Dizer que tem uma reserva', 'Perguntar o horário do café da manhã', 'Pedir o Wi-Fi'],
    starter: 'Hello, welcome to the Grand Hotel. Do you have a reservation?',
  },
  {
    id: 'immigration', title: 'Passar pela imigração', emoji: '🛂', minLevel: 1,
    role: 'an immigration officer at a US airport', setup: 'The student is at the immigration counter.',
    goals: ['Dizer o motivo da viagem', 'Dizer quanto tempo vai ficar', 'Dizer onde vai ficar hospedado'],
    starter: 'Next, please. What is the purpose of your visit?',
  },
  {
    id: 'interview', title: 'Entrevista de emprego', emoji: '💼', minLevel: 3,
    role: 'a hiring manager at a tech company', setup: 'The student is in a job interview.',
    goals: ['Se apresentar', 'Descrever uma experiência profissional', 'Fazer uma pergunta sobre a vaga'],
    starter: "Hi, thanks for coming in today. Could you tell me a little about yourself?",
  },
];
