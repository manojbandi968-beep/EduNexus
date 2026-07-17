'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Loader2, Trophy, ArrowRight, BrainCircuit } from 'lucide-react';
import { toast } from 'sonner';
import { useSocket } from '@/lib/socket/client';
import { SOCKET_EVENTS } from '@/lib/socket/events';
import { useAuth } from '@/contexts/AuthContext';

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswerIndex: number;
}

interface StudentScore {
  id: string;
  name: string;
  score: number;
  hasAnsweredCurrent: boolean;
}

const mockClassStudents = [
  { id: 's1', name: 'Rahul Sharma' },
  { id: 's2', name: 'Priya Patel' },
  { id: 's3', name: 'Amit Kumar' },
  { id: 's4', name: 'Neha Reddy' },
  { id: 's5', name: 'Vikram Singh' },
  { id: 's6', name: 'Anjali Desai' },
  { id: 's7', name: 'Karthik Iyer' },
  { id: 's8', name: 'Sneha Gupta' },
];

export default function LiveQuizPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const socket = useSocket();
  
  const topic = searchParams.get('topic') || 'General';
  const quizId = params.id;

  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [students, setStudents] = useState<StudentScore[]>(
    mockClassStudents.map(s => ({ ...s, score: 0, hasAnsweredCurrent: false }))
  );
  const [quizEnded, setQuizEnded] = useState(false);

  useEffect(() => {
    async function fetchQuestions() {
      try {
        const res = await fetch(`/api/quiz/generate?topic=${encodeURIComponent(topic)}`);
        const data = await res.json();
        setQuestions(data.questions);
      } catch (error) {
        console.error('Failed to fetch questions:', error);
        toast.error('Failed to load questions.');
      } finally {
        setLoading(false);
      }
    }
    fetchQuestions();
  }, [topic]);

  const markStudent = (studentId: string, isCorrect: boolean) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        if (s.hasAnsweredCurrent) {
          toast.info(`${s.name} has already answered this question.`);
          return s;
        }
        if (isCorrect) {
          toast.success(`+1 for ${s.name}!`);
        } else {
          toast.error(`Incorrect answer from ${s.name}.`);
        }
        return {
          ...s,
          score: isCorrect ? s.score + 1 : s.score,
          hasAnsweredCurrent: true
        };
      }
      return s;
    }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      // Reset answered status for the new question
      setStudents(prev => prev.map(s => ({ ...s, hasAnsweredCurrent: false })));
    } else {
      setQuizEnded(true);
      if (socket && user) {
        const istTime = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
        socket.emit(SOCKET_EVENTS.TEACHER_END_QUIZ, {
          teacherName: user.displayName || 'Teacher',
          teacherId: user.uid,
          topic: topic,
          totalStudents: students.length,
          timestamp: Date.now(),
          istTime: istTime
        });
      }
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="teacher" userName="Teacher">
        <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground animate-pulse">Generating questions for {topic}...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (quizEnded) {
    // Sort students by score descending
    const sortedStudents = [...students].sort((a, b) => b.score - a.score);
    
    return (
      <DashboardLayout role="teacher" userName="Teacher">
         <div className="mx-auto max-w-3xl space-y-6 pb-20 lg:pb-8">
            <PageHeader title="Quiz Complete!" description={`Topic: ${topic}`} />
            
            <Card className="glass-card border-0 overflow-hidden">
              <div className="bg-gradient-to-r from-primary/20 to-primary/5 p-6 flex flex-col items-center justify-center">
                <Trophy className="h-16 w-16 text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold">Final Leaderboard</h2>
              </div>
              <CardContent className="p-0">
                <div className="divide-y divide-border">
                  {sortedStudents.map((s, idx) => (
                    <motion.div 
                      key={s.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex h-8 w-8 items-center justify-center font-bold text-muted-foreground">
                          #{idx + 1}
                        </div>
                        <Avatar className="h-10 w-10 border border-primary/20">
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {s.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <span className="font-semibold">{s.name}</span>
                      </div>
                      <Badge variant="secondary" className="px-3 py-1 text-sm bg-primary/10 text-primary">
                        {s.score} Points
                      </Badge>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={() => router.push('/teacher/quiz')} className="rounded-xl gradient-primary border-0 text-white">
                Back to Quizzes
              </Button>
            </div>
         </div>
      </DashboardLayout>
    );
  }

  const currentQuestion = questions[currentIndex];

  return (
    <DashboardLayout role="teacher" userName="Teacher">
      <div className="space-y-6 pb-20 lg:pb-8 max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <PageHeader title="Live Quiz" description={`Topic: ${topic}`} />
          <Badge variant="outline" className="px-3 py-1.5 text-sm self-start sm:self-auto flex items-center gap-2">
            <BrainCircuit className="h-4 w-4 text-primary" />
            Question {currentIndex + 1} of {questions.length}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Question Panel */}
          <div className="lg:col-span-2 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="glass-card border-0 shadow-lg relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-blue-500" />
                  <CardHeader>
                    <CardTitle className="text-2xl leading-relaxed">
                      {currentQuestion.question}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {currentQuestion.options.map((option, idx) => {
                      const isCorrect = idx === currentQuestion.correctAnswerIndex;
                      return (
                        <div 
                          key={idx} 
                          className="flex items-center gap-4 p-4 rounded-xl border border-border bg-muted/20 hover:bg-muted/50 transition-colors"
                        >
                          <div className={`flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-full font-bold ${isCorrect ? 'bg-emerald-500/20 text-emerald-600' : 'bg-primary/10 text-primary'}`}>
                            {String.fromCharCode(65 + idx)}
                          </div>
                          <span className="text-lg">{option}</span>
                          {isCorrect && (
                            <Badge variant="outline" className="ml-auto bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                              Correct Answer
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            <div className="flex justify-end pt-4">
              <Button 
                onClick={nextQuestion} 
                className="gap-2 rounded-xl gradient-primary border-0 text-white px-6 py-6 text-lg"
              >
                {currentIndex === questions.length - 1 ? 'End Quiz' : 'Next Question'}
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Students Panel */}
          <div className="space-y-4">
            <Card className="glass-card border-0 h-full">
              <CardHeader className="pb-3 border-b border-border/50">
                <CardTitle className="text-lg">Class Roster</CardTitle>
                <p className="text-xs text-muted-foreground">Select a student to mark their answer</p>
              </CardHeader>
              <CardContent className="p-0 max-h-[500px] overflow-y-auto">
                <div className="divide-y divide-border/50">
                  {students.map((student) => (
                    <div key={student.id} className="p-4 flex flex-col gap-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9 border border-primary/20">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-semibold">{student.name}</p>
                            <p className="text-xs text-muted-foreground">Score: {student.score}</p>
                          </div>
                        </div>
                        {student.hasAnsweredCurrent && (
                          <Badge variant="outline" className="text-[10px] bg-muted/50">Answered</Badge>
                        )}
                      </div>
                      
                      {!student.hasAnsweredCurrent && (
                        <div className="flex gap-2 w-full">
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 gap-1 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border-emerald-200"
                            onClick={() => markStudent(student.id, true)}
                          >
                            <Check className="h-3 w-3" /> Correct
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="flex-1 gap-1 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                            onClick={() => markStudent(student.id, false)}
                          >
                            <X className="h-3 w-3" /> Wrong
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
