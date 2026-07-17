import { NextResponse } from 'next/server';
import questionBank from '@/lib/data/question-bank.json';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface QuestionBankSubject {
  aliases: string[];
  questions: QuizQuestion[];
}

const typedQuestionBank = questionBank as Record<string, QuestionBankSubject>;

// Fallback questions if the topic really doesn't match anything
const genericQuestions: QuizQuestion[] = [
  { id: 'g1', question: 'Which of the following is a fundamental SI unit?', options: ['Newton', 'Joule', 'Kilogram', 'Watt'], correctAnswerIndex: 2 },
  { id: 'g2', question: 'What is the value of Pi to two decimal places?', options: ['3.12', '3.14', '3.16', '3.18'], correctAnswerIndex: 1 },
  { id: 'g3', question: 'Which of these is a scalar quantity?', options: ['Velocity', 'Force', 'Acceleration', 'Mass'], correctAnswerIndex: 3 },
  { id: 'g4', question: 'What is the square root of 144?', options: ['10', '12', '14', '16'], correctAnswerIndex: 1 },
  { id: 'g5', question: 'Which state of matter has a definite volume but no definite shape?', options: ['Solid', 'Liquid', 'Gas', 'Plasma'], correctAnswerIndex: 1 },
];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const topic = url.searchParams.get('topic') || '';
  
  const normalizedTopic = topic.toLowerCase().trim();
  
  // Smart Match Algorithm
  let matchedQuestions = null;
  let highestMatchScore = 0;

  for (const [subjectName, subjectData] of Object.entries(typedQuestionBank)) {
    for (const alias of subjectData.aliases) {
      // Exact match gets highest priority
      if (normalizedTopic === alias.toLowerCase()) {
        matchedQuestions = subjectData.questions;
        highestMatchScore = 100;
        break;
      }
      // Partial match (e.g. "Differential Calculus" includes "calculus")
      if (normalizedTopic.includes(alias.toLowerCase())) {
        if (highestMatchScore < 50) {
          matchedQuestions = subjectData.questions;
          highestMatchScore = 50;
        }
      }
    }
    if (highestMatchScore === 100) break;
  }

  // If we found a match, use it. Otherwise, fallback to generic.
  const questions = matchedQuestions || genericQuestions;

  // Simulate network delay to make it feel like real generation
  await new Promise(resolve => setTimeout(resolve, 1000));

  return NextResponse.json({ 
    questions,
    matchedScore: highestMatchScore,
    isFallback: matchedQuestions === null
  });
}
