'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, type Variants, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import {
  GraduationCap,
  BookOpen,
  Users,
  Sun,
  Moon,
  Sparkles,
  CheckCircle,
  Star,
  BarChart3,
  Clock,
  Target,
  Award,
  Zap,
  Users2,
  BookMarked,
  TrendingUp,
  ShieldCheck,
  MessageSquare,
  Globe,
  MousePointer,
  ArrowUpRight,
  Quote,
  ArrowLeft,
  ArrowRight,
  Shield,
  Zap as ZapIcon,
  Heart,
  Brain,
  Rocket,
  Trophy,
  ArrowDown,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { FluidBackground } from '@/components/ui/fluid-background';
import { Magnetic, TiltCard } from '@/components/ui/magnetic';

const MetricIcons = {
  Clock,
  Brain,
  Zap: ZapIcon,
  Trophy,
  Award,
  Rocket,
  Shield,
  Heart,
} as const;

type MetricIconKey = keyof typeof MetricIcons;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 30, opacity: 0 },
  visible: {
    y: 0,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 100,
      damping: 15,
    },
  },
};

const statsVariants: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      stiffness: 150,
      damping: 15,
    },
  },
};

const stats = [
  { value: '500+', label: 'Active Educators', icon: Users2, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-500/10' },
  { value: '50K+', label: 'Students Managed', icon: GraduationCap, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-500/10' },
  { value: '99.9%', label: 'Uptime Guarantee', icon: ShieldCheck, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-500/10' },
  { value: '3', label: 'Streams Supported', icon: Target, color: 'text-primary dark:text-primary', bg: 'bg-primary/10' },
];

const features = [
  {
    icon: BookOpen,
    title: 'Smart Attendance',
    description: 'Mark attendance in seconds with QR codes. Real-time sync across all devices with offline support.',
    gradient: 'from-indigo-500 to-indigo-600',
    iconBg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
    delay: 0.1,
  },
  {
    icon: BarChart3,
    title: 'Live Analytics',
    description: 'Track student progress, attendance trends, and engagement metrics with beautiful dashboards.',
    gradient: 'from-emerald-500 to-emerald-600',
    iconBg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    delay: 0.2,
  },
  {
    icon: Zap,
    title: 'Instant Quizzes',
    description: 'Create and conduct live quizzes. Auto-grading with instant results and performance analytics.',
    gradient: 'from-amber-500 to-amber-600',
    iconBg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    delay: 0.3,
  },
  {
    icon: Clock,
    title: 'Study Hour Tracking',
    description: 'Monitor study hours, session logs, and mentor feedback. Keep students accountable and on track.',
    gradient: 'from-purple-500 to-purple-600',
    iconBg: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    delay: 0.4,
  },
  {
    icon: MessageSquare,
    title: 'Announcements Hub',
    description: 'Broadcast announcements to specific streams, sections, or the entire college instantly.',
    gradient: 'from-pink-500 to-pink-600',
    iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    delay: 0.5,
  },
  {
    icon: Award,
    title: 'Performance Reports',
    description: 'Generate detailed PDF reports for parents, principals, and accreditation bodies with one click.',
    gradient: 'from-blue-500 to-blue-600',
    iconBg: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    delay: 0.6,
  },
];

const testimonials = [
  {
    quote: '"EduNexus transformed how we manage attendance. What used to take 20 minutes now takes 30 seconds. Our teachers love it!"',
    author: 'Dr. Priya Sharma',
    role: 'Principal, Sri Chaitanya Jr College',
    stream: 'MPC',
    avatar: 'PS',
    bg: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    stars: 5,
    metric: '95% time saved',
    metricIcon: Clock,
  },
  {
    quote: '"The quiz feature is a game-changer. I can create a quiz in 2 minutes and get instant analytics on student understanding."',
    author: 'Prof. Rajesh Kumar',
    role: 'Physics Teacher, Narayana College',
    stream: 'BiPC',
    avatar: 'RK',
    bg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    stars: 5,
    metric: '3x faster grading',
    metricIcon: ZapIcon,
  },
  {
    quote: '"Study hour tracking has improved student accountability by 40%. Parents appreciate the transparency and regular updates."',
    author: 'Ms. Anita Reddy',
    role: 'Academic Mentor, MS Junior College',
    stream: 'CEC',
    avatar: 'AR',
    bg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    stars: 5,
    metric: '+40% accountability',
    metricIcon: Trophy,
  },
  {
    quote: '"Finally, a platform built for Indian junior colleges. Multi-stream support, bilingual interface, and works offline too!"',
    author: 'Mr. Venkatesh Rao',
    role: 'Director, Vivekananda Institutions',
    stream: 'All Streams',
    avatar: 'VR',
    bg: 'bg-primary/20 text-primary dark:text-primary',
    stars: 5,
    metric: '100% adoption',
    metricIcon: Rocket,
  },
  {
    quote: '"The analytics dashboard helped us identify struggling students early. Intervention success rate went up by 60% this semester."',
    author: 'Dr. Lakshmi Narayan',
    role: 'Academic Dean, Aakash Institute',
    stream: 'MPC',
    avatar: 'LN',
    bg: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    stars: 5,
    metric: '+60% intervention',
    metricIcon: Brain,
  },
  {
    quote: '"Switching from WhatsApp groups to EduNexus was the best decision. Communication is now structured, trackable, and professional."',
    author: 'Prof. Meera Krishnan',
    role: 'Chemistry HOD, Allen Career Institute',
    stream: 'BiPC',
    avatar: 'MK',
    bg: 'bg-pink-500/20 text-pink-600 dark:text-pink-400',
    stars: 5,
    metric: 'Zero missed messages',
    metricIcon: Shield,
  },
  {
    quote: '"Report generation that used to take days now takes minutes. Accreditation audits are stress-free with EduNexus."',
    author: 'Mr. Suresh Babu',
    role: 'Vice Principal, Narayana Group',
    stream: 'CEC',
    avatar: 'SB',
    bg: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    stars: 5,
    metric: '90% faster reports',
    metricIcon: Award,
  },
  {
    quote: '"Our mentors can now track every student\'s journey in real-time. The impact on student outcomes has been remarkable."',
    author: 'Dr. Kavitha Iyer',
    role: 'Director, FIITJEE South',
    stream: 'All Streams',
    avatar: 'KI',
    bg: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    stars: 5,
    metric: 'Real-time insights',
    metricIcon: Heart,
  },
];

const streams = [
  {
    code: 'MPC',
    full: 'Maths, Physics, Chemistry',
    exam: 'IIT-JEE / EAMCET',
    icon: BookOpen,
    color: 'indigo',
    gradient: 'from-indigo-500 to-indigo-600',
    bg: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    students: '25,000+',
  },
  {
    code: 'BiPC',
    full: 'Biology, Physics, Chemistry',
    exam: 'NEET / EAMCET',
    icon: Users,
    color: 'emerald',
    gradient: 'from-emerald-500 to-emerald-600',
    bg: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    students: '18,000+',
  },
  {
    code: 'CEC',
    full: 'Civics, Economics, Commerce',
    exam: 'CA Foundation / CLAT',
    icon: BookMarked,
    color: 'amber',
    gradient: 'from-amber-500 to-amber-600',
    bg: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    students: '12,000+',
  },
];

const impactQuotes = [
  {
    quote: '"EduNexus didn\'t just digitize our processes — it transformed how we teach. The time we save on admin goes straight back into the classroom."',
    author: 'Dr. Priya Sharma',
    role: 'Principal, Sri Chaitanya Jr College',
    stream: 'MPC',
    avatar: 'PS',
    bg: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400',
    metric: '95% time saved on attendance',
    metricIcon: 'Clock' as MetricIconKey,
    highlight: 'Transformed how we teach',
  },
  {
    quote: '"The analytics dashboard is like having a data scientist on staff. We spotted struggling students 3 weeks earlier than before — intervention success jumped 60%."',
    author: 'Dr. Lakshmi Narayan',
    role: 'Academic Dean, Aakash Institute',
    stream: 'MPC',
    avatar: 'LN',
    bg: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
    metric: '+60% intervention success',
    metricIcon: 'Brain' as MetricIconKey,
    highlight: 'Data scientist on staff',
  },
  {
    quote: '"Creating quizzes used to take 30 minutes. Now it takes 2. Auto-grading means I get instant insights while the concepts are still fresh in students\' minds."',
    author: 'Prof. Rajesh Kumar',
    role: 'Physics Teacher, Narayana College',
    stream: 'BiPC',
    avatar: 'RK',
    bg: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    metric: '15x faster quiz creation',
    metricIcon: 'Zap' as MetricIconKey,
    highlight: 'Instant insights',
  },
  {
    quote: '"Study hour tracking changed everything. Students know we\'re watching — in a good way. Accountability went up 40% and parents are finally in the loop."',
    author: 'Ms. Anita Reddy',
    role: 'Academic Mentor, MS Junior College',
    stream: 'CEC',
    avatar: 'AR',
    bg: 'bg-amber-500/20 text-amber-600 dark:text-amber-400',
    metric: '+40% student accountability',
    metricIcon: 'Trophy' as MetricIconKey,
    highlight: 'Parents finally in the loop',
  },
  {
    quote: '"Accreditation reports that took weeks now take hours. The auditors were impressed by our data transparency. EduNexus paid for itself in one audit cycle."',
    author: 'Mr. Suresh Babu',
    role: 'Vice Principal, Narayana Group',
    stream: 'CEC',
    avatar: 'SB',
    bg: 'bg-teal-500/20 text-teal-600 dark:text-teal-400',
    metric: '90% faster audit reports',
    metricIcon: 'Award' as MetricIconKey,
    highlight: 'Paid for itself in one audit',
  },
  {
    quote: '"Finally, a platform that understands Indian education. Multi-stream, bilingual, offline-ready, and built for our scale. Not a Silicon Valley afterthought."',
    author: 'Mr. Venkatesh Rao',
    role: 'Director, Vivekananda Institutions',
    stream: 'All Streams',
    avatar: 'VR',
    bg: 'bg-primary/20 text-primary dark:text-primary',
    metric: '100% India-ready',
    metricIcon: 'Rocket' as MetricIconKey,
    highlight: 'Built for India, by India',
  },
  {
    quote: '"Communication used to be chaos — WhatsApp, SMS, notice boards, missed messages. Now it\'s one platform, one message, everyone reached. Zero missed announcements."',
    author: 'Prof. Meera Krishnan',
    role: 'Chemistry HOD, Allen Career Institute',
    stream: 'BiPC',
    avatar: 'MK',
    bg: 'bg-pink-500/20 text-pink-600 dark:text-pink-400',
    metric: 'Zero missed messages',
    metricIcon: 'Shield' as MetricIconKey,
    highlight: 'One platform, one message',
  },
  {
    quote: '"Our mentors can now see every student\'s complete journey in real-time. Attendance, quizzes, study hours, progress — one screen. The impact on outcomes is undeniable."',
    author: 'Dr. Kavitha Iyer',
    role: 'Director, FIITJEE South',
    stream: 'All Streams',
    avatar: 'KI',
    bg: 'bg-orange-500/20 text-orange-600 dark:text-orange-400',
    metric: 'Real-time 360° view',
    metricIcon: 'Heart' as MetricIconKey,
    highlight: 'Complete student journey',
  },
];

const GRADIENT_COLORS = ['#8b5cf6', '#22d3ee', '#ff7a59', '#ec4899', '#a3e635', '#fbbf24'];

function AnimatedGradientText({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let frame: number;
    let pos = 0;
    const animate = () => {
      pos = (pos + 0.3) % 100;
      if (ref.current) {
        ref.current.style.backgroundPosition = `${pos}% 50%`;
      }
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <span
      ref={ref}
      className="bg-clip-text text-transparent"
      style={{
        backgroundImage: `linear-gradient(90deg, ${GRADIENT_COLORS.join(', ')})`,
        backgroundSize: '200% 100%',
      }}
    >
      {children}
    </span>
  );
}

const LandingPage = () => {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [scrollY, setScrollY] = useState(0);
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % impactQuotes.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const scrollToGetStarted = () => {
    document.getElementById('get-started')?.scrollIntoView({ behavior: 'smooth' });
  };

  const nextQuote = useCallback(() => {
    setCurrentQuote((prev) => (prev + 1) % impactQuotes.length);
  }, []);

  const prevQuote = useCallback(() => {
    setCurrentQuote((prev) => (prev - 1 + impactQuotes.length) % impactQuotes.length);
  }, []);

  return (
    <div className="relative min-h-screen bg-background font-sans antialiased">
      <FluidBackground />

      {/* Navigation */}
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(
          'fixed top-4 left-4 right-4 z-50 transition-all duration-300',
          scrollY > 20
            ? 'bg-background/90 backdrop-blur-md rounded-2xl shadow-lg border border-border px-6 py-3'
            : 'bg-transparent px-6 py-4'
        )}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => scrollToGetStarted()}
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
              <GraduationCap className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl text-foreground bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
              EduNexus
            </span>
          </motion.div>

          <div className="hidden md:flex items-center gap-6">
            <a
              href="#features"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Features
            </a>
            <a
              href="#testimonials"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Testimonials
            </a>
            <a
              href="#streams"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
            >
              Streams
            </a>

          </div>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              className="glass h-10 w-10 rounded-xl"
              aria-label="Toggle theme"
            >
              <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </div>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -left-40 top-1/4 h-96 w-96 rounded-full bg-primary/10 blur-3xl"
          />
          <motion.div
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute -right-40 bottom-1/4 h-96 w-96 rounded-full bg-chart-2/10 blur-3xl"
          />
          <div className="absolute inset-0 pattern-dots opacity-30" />
        </div>

        {/* Floating decorative elements */}
        <motion.div
          animate={{
            y: [0, -15, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-20 left-10 w-32 h-32 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 blur-xl"
        />
        <motion.div
          animate={{
            y: [0, 15, 0],
            x: [0, -10, 0],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-20 right-10 w-24 h-24 rounded-2xl bg-gradient-to-br from-chart-2/20 to-chart-2/5 border border-chart-2/20 blur-xl"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-4 py-20">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="text-center"
          >
            {/* Badge */}
            <motion.div
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-8"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>New: AI-Powered Analytics Dashboard Released 🚀</span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight text-foreground leading-[1.1] max-w-5xl mx-auto"
            >
              The Complete Coaching Management Platform
              <br />
              <AnimatedGradientText>
                Built for Indian Junior Colleges
              </AnimatedGradientText>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              variants={itemVariants}
              className="mt-6 text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Streamline attendance, quizzes, study hours & analytics for MPC, BiPC & CEC streams.
              No more WhatsApp groups. One platform. Every educator connected.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={itemVariants}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
            >
              <Magnetic strength={0.2}>
                <Button
                  size="lg"
                  className="group bg-gradient-to-r from-primary to-primary/80 hover:from-primary hover:to-primary/90 text-primary-foreground shadow-lg shadow-primary/25 px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:shadow-[0_0_30px_-5px_var(--primary)] hover:-translate-y-1 hover:scale-[1.02]"
                  onClick={() => router.push('/login')}
                >
                  <ShieldCheck className="mr-2 h-5 w-5" />
                  Sign In
                  <ArrowUpRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1 group-hover:translate-y-[-2px]" />
                </Button>
              </Magnetic>
              <Button
                variant="outline"
                size="lg"
                className="group border-border/50 hover:bg-accent hover:border-primary/50 hover:shadow-[0_0_25px_-8px_var(--primary)] px-10 py-4 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-[1.02]"
                onClick={() => router.push('/register')}
              >
                <Users className="mr-2 h-5 w-5" />
                Sign Up
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              variants={itemVariants}
              className="mt-16 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Cancel anytime</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>SOC 2 certified</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Hero Visual / Dashboard Preview */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8, ease: 'easeOut' }}
            className="mt-20 relative"
          >
            <div className="relative max-w-6xl mx-auto">
              {/* Glass card dashboard preview */}
              <div className="glass-card rounded-3xl p-2 shadow-2xl border border-white/10">
                <div className="bg-background/50 rounded-2xl p-6 md:p-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                    {/* Stat Card 1 */}
                    <div className="glass-card rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Today&apos;s Attendance</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                          <Users className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">94.2%</div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>+2.1% vs last week</span>
                      </div>
                    </div>

                    {/* Stat Card 2 */}
                    <div className="glass-card rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Active Quizzes</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                          <BookOpen className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">24</div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-muted-foreground">
                        <span>12 completed today</span>
                      </div>
                    </div>

                    {/* Stat Card 3 */}
                    <div className="glass-card rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-sm font-medium text-muted-foreground">Study Hours Logged</span>
                        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          <Clock className="h-4 w-4" />
                        </div>
                      </div>
                      <div className="text-4xl md:text-5xl font-bold text-foreground">1,247</div>
                      <div className="mt-2 flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                        <TrendingUp className="h-3.5 w-3.5" />
                        <span>+156 this week</span>
                      </div>
                    </div>
                  </div>

                  {/* Mini Charts */}
                  <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="glass-card rounded-2xl p-6 border border-white/10">
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Attendance Trend (7 days)</h4>
                      <div className="h-32 flex items-end justify-around gap-1">
                        {[92, 94, 91, 95, 93, 96, 94].map((val, i) => (
                          <motion.div
                            key={i}
                            initial={{ height: 0 }}
                            animate={{ height: `${val - 90}rem` }}
                            transition={{ delay: i * 0.1, type: 'spring', stiffness: 100 }}
                            className="flex-1 max-w-10 rounded-t bg-gradient-to-t from-primary to-primary/60"
                          />
                        ))}
                      </div>
                    </div>
                    <div className="glass-card rounded-2xl p-6 border border-white/10">
                      <h4 className="text-sm font-medium text-muted-foreground mb-4">Stream Distribution</h4>
                      <div className="flex items-center justify-around">
                        {streams.map((stream) => (
                          <div key={stream.code} className="text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl mx-auto mb-2" style={{ background: stream.gradient }}>
                              <stream.icon className="h-8 w-8 text-white" />
                            </div>
                            <div className="text-2xl font-bold" style={{ color: `var(--${stream.color}-600)` }}>{stream.code}</div>
                            <div className="text-xs text-muted-foreground">{stream.students}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating badges */}
              <motion.div
                animate={{
                  y: [0, -10, 0],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -top-4 -right-4 glass-card rounded-2xl px-4 py-2 shadow-xl border border-white/10"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-green-500/10 text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-semibold text-foreground">Live Demo Available</span>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-muted-foreground"
        >
          <MousePointer className="h-6 w-6" />
          <span className="text-xs">Scroll to explore</span>
        </motion.div>
      </section>

      {/* Stats Section */}
      <section className="relative py-16 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={statsVariants}
                className="text-center"
                style={{ transitionDelay: `${index * 100}ms` }}
              >
                <div className={cn('mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl', stat.bg)}>
                  <stat.icon className={cn('h-7 w-7', stat.color)} />
                </div>
                <div className="text-3xl md:text-4xl font-bold text-foreground">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Everything you need to run your college
            </motion.span>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Powerful features for <AnimatedGradientText>modern educators</AnimatedGradientText>
              </motion.h2>
            <motion.p variants={itemVariants} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              From attendance to analytics, quizzes to reports — EduNexus handles it all so you can focus on teaching.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
              {features.map((feature) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                style={{ transitionDelay: `${feature.delay}s` }}
                whileHover={{ y: -8 }}
              >
                <TiltCard maxTilt={6}>
                  <Card className="glass-card h-full border border-white/10 hover:border-primary/20 transition-all duration-300">
                    <CardHeader>
                      <div className={cn('flex h-14 w-14 items-center justify-center rounded-2xl mb-4', feature.iconBg)}>
                        <feature.icon className="h-7 w-7" />
                      </div>
                      <CardTitle className="text-xl font-bold text-foreground">{feature.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Impact Quotes Carousel */}
      <section id="testimonials" className="relative py-24 px-4 bg-gradient-to-b from-muted/20 to-transparent">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 pattern-dots opacity-10" />
          <motion.div
            className="absolute top-1/2 left-10 -translate-y-1/2 w-24 h-24 rounded-full bg-primary/5 blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
          />
          <motion.div
            className="absolute top-1/2 right-10 -translate-y-1/2 w-24 h-24 rounded-full bg-chart-2/5 blur-3xl"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          />
        </div>

        <div className="relative max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Quote className="h-3.5 w-3.5" />
              Real impact. Real educators. Real results.
            </motion.span>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                <AnimatedGradientText>Words that matter</AnimatedGradientText>{' '}
                from the frontlines of education
              </motion.h2>
            <motion.p variants={itemVariants} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Don&apos;t just take our word for it. Hear from 500+ colleges that transformed their academic management.
            </motion.p>
          </motion.div>

          {/* Carousel */}
          <div className="relative max-w-5xl mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentQuote}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                className="relative"
              >
                <Card className="glass-card border border-white/10 shadow-2xl overflow-hidden relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-chart-5 to-primary" />
                  
                  <CardContent className="p-8 md:p-12">
                    {/* Quote Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <Quote className="h-8 w-8 text-primary/60" />
                      </div>
                    </div>

                    {/* Quote Text */}
                    <motion.blockquote
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2, duration: 0.5 }}
                      className="text-center mb-8 relative"
                    >
                      <span className="text-foreground/20 absolute -top-8 left-1/2 -translate-x-1/2 text-7xl font-serif">
                        &ldquo;
                      </span>
                      <p className="text-xl md:text-2xl lg:text-3xl font-light leading-relaxed text-foreground relative z-10">
                        {impactQuotes[currentQuote].quote}
                      </p>
                    </motion.blockquote>

                    {/* Highlight Metric */}
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4, duration: 0.5, type: 'spring', stiffness: 150 }}
                      className="flex items-center justify-center gap-4 mb-8 p-4 md:p-6 rounded-2xl bg-primary/5 border border-primary/10"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                        {(() => {
                          const Icon = MetricIcons[impactQuotes[currentQuote].metricIcon];
                          return <Icon className="h-6 w-6" />;
                        })()}
                      </div>
                      <div className="text-left">
                        <p className="text-sm font-medium text-primary uppercase tracking-wider">
                          Key Impact
                        </p>
                        <p className="text-lg md:text-xl font-bold text-foreground">
                          {impactQuotes[currentQuote].metric}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {impactQuotes[currentQuote].highlight}
                        </p>
                      </div>
                    </motion.div>

                    {/* Author Info */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.6, duration: 0.5 }}
                      className="flex items-center justify-center gap-4"
                    >
                      <div className={cn('flex h-14 w-14 items-center justify-center rounded-xl font-bold text-xl', impactQuotes[currentQuote].bg)}>
                        {impactQuotes[currentQuote].avatar}
                      </div>
                      <div className="text-left">
                        <p className="font-semibold text-foreground">{impactQuotes[currentQuote].author}</p>
                        <p className="text-sm text-muted-foreground">{impactQuotes[currentQuote].role}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                            {impactQuotes[currentQuote].stream}
                          </span>
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  </CardContent>
                </Card>
              </motion.div>
            </AnimatePresence>

            {/* Navigation Arrows */}
            <div className="flex items-center justify-center gap-4 mt-8">
              <Button
                variant="outline"
                size="icon"
                onClick={prevQuote}
                className="h-12 w-12 rounded-full glass border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                aria-label="Previous testimonial"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              
              {/* Dots */}
              <div className="flex items-center gap-2">
                {impactQuotes.map((_, index) => (
                  <motion.button
                    key={index}
                    onClick={() => setCurrentQuote(index)}
                    className={cn(
                      'h-2.5 w-2.5 rounded-full transition-all duration-300',
                      index === currentQuote
                        ? 'bg-primary w-8'
                        : 'bg-muted-foreground/30 hover:bg-muted-foreground/60'
                    )}
                    aria-label={`Go to testimonial ${index + 1}`}
                    whileHover={{ scale: 1.2 }}
                    whileTap={{ scale: 0.9 }}
                  />
                ))}
              </div>

              <Button
                variant="outline"
                size="icon"
                onClick={nextQuote}
                className="h-12 w-12 rounded-full glass border-white/20 hover:border-primary/50 hover:bg-primary/5 transition-all duration-300"
                aria-label="Next testimonial"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
            </div>

            {/* Auto-play indicator */}
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 5, repeat: Infinity }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-xs text-muted-foreground"
            >
              <div className="h-1 w-16 bg-muted-foreground/20 rounded-full overflow-hidden">
                <motion.div
                  animate={{ width: ['0%', '100%'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'linear' }}
                  className="h-full bg-primary"
                />
              </div>
            </motion.div>
          </div>

          {/* All Testimonials Grid - Collapsed by default */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-16"
          >
            <div className="text-center mb-10">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                View all {testimonials.length} educator stories
                <ArrowDown className="ml-2 h-4 w-4" />
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {testimonials.map((testimonial, index) => (
                <motion.div
                  key={testimonial.author}
                  variants={itemVariants}
                  style={{ transitionDelay: `${index * 0.1}s` }}
                  whileHover={{ y: -8 }}
                >
                  <Card className="glass-card h-full border border-white/10 hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
                    <CardContent className="pt-6">
                      <div className="flex gap-1 mb-4">
                        {Array.from({ length: testimonial.stars }).map((_, i) => (
                          <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                        ))}
                      </div>
                      <p className="text-foreground mb-6 leading-relaxed">&ldquo;{testimonial.quote}&rdquo;</p>
                      <div className="flex items-center gap-4">
                        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl font-bold text-lg', testimonial.bg)}>
                          {testimonial.avatar}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-foreground truncate">{testimonial.author}</p>
                          <p className="text-sm text-muted-foreground truncate">{testimonial.role}</p>
                          <div className="mt-1 flex items-center gap-1">
                            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-primary/10 text-primary">
                              {testimonial.stream}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Streams Section */}
      <section id="streams" className="relative py-24 px-4">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="text-center mb-16"
          >
            <motion.span
              variants={itemVariants}
              className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary mb-6"
            >
              <Target className="h-3.5 w-3.5" />
              Designed for every stream
            </motion.span>
              <motion.h2 variants={itemVariants} className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight text-foreground">
                Specialized support for <AnimatedGradientText>MPC, BiPC & CEC</AnimatedGradientText>
              </motion.h2>
            <motion.p variants={itemVariants} className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
              Each stream has unique needs. EduNexus adapts with stream-specific timetables, subject mappings, and exam patterns.
            </motion.p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: '-100px' }}
            variants={containerVariants}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
              {streams.map((stream, index) => (
              <motion.div
                key={stream.code}
                variants={itemVariants}
                style={{ transitionDelay: `${index * 0.1}s` }}
                whileHover={{ y: -8 }}
              >
                <TiltCard maxTilt={6}>
                  <Card className="glass-card h-full border border-white/10 hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1" style={{ background: stream.gradient }} />
                    <CardHeader>
                      <div className={cn('flex h-16 w-16 items-center justify-center rounded-2xl mb-4', stream.bg.split(' ')[0] + ' text-white')}>
                        <stream.icon className="h-8 w-8" />
                      </div>
                      <div className="flex items-center gap-3 mb-2">
                        <CardTitle className="text-2xl font-bold text-foreground">{stream.code}</CardTitle>
                        <span className={cn('px-2 py-1 text-xs font-medium rounded-full', stream.bg)}>
                          {stream.students} students
                        </span>
                      </div>
                      <p className="text-muted-foreground">{stream.full}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: stream.gradient }}>
                            <Target className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-medium">Target Exams:</span>
                          <span className="text-muted-foreground">{stream.exam}</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: stream.gradient }}>
                            <BookOpen className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-medium">Subjects:</span>
                          <span className="text-muted-foreground">Physics, Chemistry, Maths/Biology/Civics/Economics</span>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <div className="flex h-8 w-8 items-center justify-center rounded-xl" style={{ background: stream.gradient }}>
                            <BarChart3 className="h-4 w-4 text-white" />
                          </div>
                          <span className="text-foreground font-medium">Analytics:</span>
                          <span className="text-muted-foreground">Stream-specific dashboards & reports</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>



      {/* Footer */}
      <footer className="relative border-t border-border bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 py-12 md:py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/80 shadow-lg shadow-primary/25">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <span className="font-bold text-xl text-foreground bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
                  EduNexus
                </span>
              </div>
              <p className="text-muted-foreground max-w-xs mb-6">
                The complete coaching management platform for Indian junior colleges.
                Streamline attendance, quizzes, study hours & analytics — all in one place.
              </p>
              <div className="flex gap-4">
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="Twitter">
                  <Globe className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="LinkedIn">
                  <Users className="h-5 w-5" />
                </a>
                <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" aria-label="GitHub">
                  <BookOpen className="h-5 w-5" />
                </a>
              </div>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors cursor-pointer">Features</a></li>
                <li><a href="#streams" className="hover:text-foreground transition-colors cursor-pointer">Streams</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Integrations</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">API Docs</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">About Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Blog</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Careers</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Press</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Terms of Service</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors cursor-pointer">Security</a></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} EduNexus. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm text-muted-foreground">
              <span>Made with ❤️ for Indian educators</span>
              <span className="flex items-center gap-1">
                <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
                Secure & Reliable
              </span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;