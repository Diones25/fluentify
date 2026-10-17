/**
 * Seed de demonstração do Fluentify.
 *
 * Cria (ou atualiza) o usuário demo com perfil, plano de 7 dias, cartões de
 * revisão, histórico de fala, streak e conquistas — para que a aplicação já
 * abra com conteúdo em vez de uma tela vazia.
 *
 * Uso: `npm run db:seed` (ou `npx prisma db seed`).
 */
import 'dotenv/config';
import * as bcrypt from 'bcrypt';
import { PrismaClient } from '../src/generated/prisma/client.js';

const prisma = new PrismaClient();

const DEMO_EMAIL = 'demo@fluentify.app';
const DEMO_PASSWORD = 'demo12345';
const DAY = 24 * 60 * 60 * 1000;
const yesterday = () => new Date(Date.now() - DAY).toISOString().slice(0, 10);

type SeedDay = {
  theme: string;
  speaking: { phrase: string; translation: string; tip?: string };
  vocab: { word: string; translation: string; example: string }[];
  chat: { scenario: string; goal: string; starter: string };
};

const DAYS: SeedDay[] = [
  {
    theme: 'Apresentações e rotina',
    speaking: {
      phrase: 'I usually wake up at seven and have breakfast.',
      translation: 'Eu normalmente acordo às sete e tomo café da manhã.',
      tip: 'Ligue as palavras: "wake up" soa como "ueik ap".',
    },
    vocab: [
      { word: 'wake up', translation: 'acordar', example: 'I wake up early every day.' },
      { word: 'breakfast', translation: 'café da manhã', example: 'I have breakfast at seven.' },
      { word: 'usually', translation: 'normalmente', example: 'I usually go to the gym.' },
      { word: 'routine', translation: 'rotina', example: 'My morning routine is simple.' },
    ],
    chat: {
      scenario: 'Conhecendo um colega novo no trabalho',
      goal: 'Apresentar-se, falar da rotina e fazer uma pergunta',
      starter: 'Hi! I am new here. What is your name?',
    },
  },
  {
    theme: 'No restaurante',
    speaking: {
      phrase: 'Could I have the bill, please?',
      translation: 'Eu poderia pedir a conta, por favor?',
      tip: 'Em inglês, "the bill" é mais comum que "the check" no Reino Unido.',
    },
    vocab: [
      { word: 'menu', translation: 'cardápio', example: 'Can I see the menu?' },
      { word: 'waiter', translation: 'garçom', example: 'The waiter brought our drinks.' },
      { word: 'bill', translation: 'conta', example: 'Could I have the bill, please?' },
      { word: 'tip', translation: 'gorjeta', example: 'We left a tip on the table.' },
    ],
    chat: {
      scenario: 'Pedindo uma mesa e a conta em um restaurante',
      goal: 'Pedir mesa para duas pessoas, uma bebida e a conta',
      starter: 'Good evening! Welcome. How many people?',
    },
  },
  {
    theme: 'Viagem e aeroporto',
    speaking: {
      phrase: 'I am travelling for work and staying for three days.',
      translation: 'Estou viajando a trabalho e vou ficar três dias.',
      tip: 'Contraia "I am" para "I’m" para soar mais natural.',
    },
    vocab: [
      { word: 'flight', translation: 'voo', example: 'My flight leaves at noon.' },
      { word: 'luggage', translation: 'bagagem', example: 'Where can I pick up my luggage?' },
      { word: 'boarding pass', translation: 'cartão de embarque', example: 'Show your boarding pass, please.' },
      { word: 'delay', translation: 'atraso', example: 'There is a two-hour delay.' },
    ],
    chat: {
      scenario: 'Passando pela imigração em um aeroporto',
      goal: 'Dizer o motivo da viagem, quanto tempo vai ficar e onde vai se hospedar',
      starter: 'Next, please. What is the purpose of your visit?',
    },
  },
  {
    theme: 'Trabalho e reuniões',
    speaking: {
      phrase: 'I would like to share my ideas with the team.',
      translation: 'Eu gostaria de compartilhar minhas ideias com a equipe.',
      tip: 'Use "I would like to" para pedidos mais educados.',
    },
    vocab: [
      { word: 'deadline', translation: 'prazo', example: 'The deadline is next Friday.' },
      { word: 'meeting', translation: 'reunião', example: 'We have a meeting at 10.' },
      { word: 'feedback', translation: 'retorno/avaliação', example: 'Thanks for your feedback.' },
      { word: 'schedule', translation: 'agenda', example: 'Let us check the schedule.' },
    ],
    chat: {
      scenario: 'Reunião rápida para planejar uma entrega',
      goal: 'Dar uma opinião, concordar/discordar e combinar próximos passos',
      starter: 'Thanks for joining. What do you think about the new deadline?',
    },
  },
  {
    theme: 'Compras e preços',
    speaking: {
      phrase: 'How much does this jacket cost?',
      translation: 'Quanto custa esta jaqueta?',
      tip: '"Cost" pede sujeito: "it costs", não "it is cost".',
    },
    vocab: [
      { word: 'cheap', translation: 'barato', example: 'This shirt is cheap.' },
      { word: 'expensive', translation: 'caro', example: 'That watch is expensive.' },
      { word: 'size', translation: 'tamanho', example: 'Do you have this in a larger size?' },
      { word: 'discount', translation: 'desconto', example: 'Is there any discount?' },
    ],
    chat: {
      scenario: 'Comprando uma jaqueta em uma loja',
      goal: 'Perguntar o preço, pedir outro tamanho e perguntar sobre desconto',
      starter: 'Hi! Can I help you find something?',
    },
  },
  {
    theme: 'Saúde e academia',
    speaking: {
      phrase: 'I try to exercise three times a week.',
      translation: 'Eu tento me exercitar três vezes por semana.',
      tip: '"Exercise" tem três sílabas: EX-er-cise.',
    },
    vocab: [
      { word: 'workout', translation: 'treino', example: 'My workout lasts one hour.' },
      { word: 'healthy', translation: 'saudável', example: 'I try to eat healthy food.' },
      { word: 'pain', translation: 'dor', example: 'I have a pain in my back.' },
      { word: 'appointment', translation: 'consulta/agendamento', example: 'I have a doctor appointment.' },
    ],
    chat: {
      scenario: 'Marcando uma consulta no médico',
      goal: 'Explicar o problema, perguntar horários e confirmar a consulta',
      starter: 'Good morning, this is the clinic. How can I help you?',
    },
  },
  {
    theme: 'Planos e futuro',
    speaking: {
      phrase: 'Next year I am going to study abroad.',
      translation: 'No ano que vem eu vou estudar no exterior.',
      tip: 'Para planos, "going to" é mais natural que "will".',
    },
    vocab: [
      { word: 'abroad', translation: 'no exterior', example: 'She wants to live abroad.' },
      { word: 'goal', translation: 'objetivo', example: 'My goal is to speak fluently.' },
      { word: 'improve', translation: 'melhorar', example: 'I want to improve my English.' },
      { word: 'opportunity', translation: 'oportunidade', example: 'This is a great opportunity.' },
    ],
    chat: {
      scenario: 'Conversando sobre planos para o próximo ano',
      goal: 'Falar de planos, explicar motivos e fazer perguntas ao interlocutor',
      starter: 'So, what are your plans for next year?',
    },
  },
];

const ATTEMPTS = [
  { expected: 'I went to the store yesterday.', transcript: 'I goed to the store yesterday.', score: 62, wrong: ['went'] },
  { expected: 'She has two brothers.', transcript: 'She have two brothers.', score: 75, wrong: ['has'] },
  { expected: 'Could I have the bill, please?', transcript: 'Could I have the bill please', score: 88, wrong: [] },
  { expected: 'I would like a cup of coffee.', transcript: 'I would like a cup of coffee.', score: 100, wrong: [] },
  { expected: 'They are going to travel next week.', transcript: 'They is going to travel next week.', score: 70, wrong: ['are'] },
];

const CARDS = [
  { front: 'went', back: 'passado de "go": "I went home"' },
  { front: 'has', back: '3ª pessoa de "have": "She has two brothers"' },
  { front: 'are', back: 'plural de "to be": "They are happy"' },
  { front: 'bill', back: 'conta do restaurante' },
  { front: 'deadline', back: 'prazo para entregar algo' },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const user = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { name: 'Demo Student', passwordHash, xp: 250 },
    create: { email: DEMO_EMAIL, name: 'Demo Student', passwordHash, xp: 250 },
  });

  // Torna o seed idempotente: apaga somente os dados de estudo do usuário demo.
  await prisma.studyPlan.deleteMany({ where: { userId: user.id } });
  await prisma.reviewCard.deleteMany({ where: { userId: user.id } });
  await prisma.attempt.deleteMany({ where: { userId: user.id } });
  await prisma.userAchievement.deleteMany({ where: { userId: user.id } });

  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {
      level: 'INTERMEDIATE',
      goal: 'CONVERSATION',
      minutesPerDay: 10,
      daysPerWeek: 5,
      audioMode: 'ALWAYS',
      timezone: 'America/Sao_Paulo',
    },
    create: {
      userId: user.id,
      level: 'INTERMEDIATE',
      goal: 'CONVERSATION',
      minutesPerDay: 10,
      daysPerWeek: 5,
      audioMode: 'ALWAYS',
      timezone: 'America/Sao_Paulo',
    },
  });

  await prisma.streak.upsert({
    where: { userId: user.id },
    update: { current: 3, best: 5, freezes: 1, lastActiveDay: yesterday() },
    create: { userId: user.id, current: 3, best: 5, freezes: 1, lastActiveDay: yesterday() },
  });

  await prisma.studyPlan.create({
    data: {
      userId: user.id,
      status: 'ACTIVE',
      weeks: 4,
      days: {
        create: DAYS.map((d, i) => ({
          dayNumber: i + 1,
          theme: d.theme,
          completedAt: i === 0 ? new Date(Date.now() - 2 * DAY) : null,
          lessons: {
            create: [
              { type: 'SPEAKING', order: 1, content: d.speaking },
              { type: 'VOCAB', order: 2, content: { items: d.vocab } },
              { type: 'CHAT', order: 3, content: d.chat },
            ],
          },
        })),
      },
    },
  });

  await prisma.attempt.createMany({
    data: ATTEMPTS.map((a) => ({
      userId: user.id,
      expected: a.expected,
      transcript: a.transcript,
      score: a.score,
      feedback: {
        words: a.expected
          .replace(/[.,!?]/g, '')
          .split(/\s+/)
          .map((word) => ({ word: word.toLowerCase(), ok: !a.wrong.includes(word.toLowerCase()) })),
        tip: null,
      },
      createdAt: new Date(Date.now() - ATTEMPTS.indexOf(a) * DAY),
    })),
  });

  await prisma.reviewCard.createMany({
    data: CARDS.map((c) => ({
      userId: user.id,
      front: c.front,
      back: c.back,
      dueAt: new Date(Date.now() - DAY),
    })),
    skipDuplicates: true,
  });

  await prisma.userAchievement.createMany({
    data: [
      { userId: user.id, code: 'FIRST_DAY' },
      { userId: user.id, code: 'PERFECT_SPEECH' },
    ],
    skipDuplicates: true,
  });

  console.log('\n✅ Seed concluído');
  console.log(`   E-mail: ${DEMO_EMAIL}`);
  console.log(`   Senha:  ${DEMO_PASSWORD}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Falha no seed:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
