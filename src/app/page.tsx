import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Activity, Brain, ShieldCheck, Heart } from "lucide-react";
import { getSession } from "@/lib/session";

export default async function Home() {
  const session = await getSession();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Navbar */}
      <nav className="border-b border-border/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-primary filled-icon" />
            <span className="font-bold text-xl tracking-tight">PsychSupport</span>
          </div>
          <div className="flex items-center gap-4">
            {session ? (
              <Link href="/dashboard">
                <Button variant="default">Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <Button variant="ghost">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 md:py-32 px-4 max-w-7xl mx-auto text-center space-y-8">
          <div className="space-y-4 max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-sky-400 bg-clip-text text-transparent pb-2 animate-gradient-x">
              Your Mental Health Companion for Academic Success
            </h1>
            <p className="text-xl text-muted-foreground md:leading-relaxed">
              Track your mood, assess your mental well-being, and discover focus tools designed specifically for students.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            {session ? (
              <Link href="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  Go to Dashboard <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <Link href="/register">
                <Button size="lg" className="h-12 px-8 text-lg gap-2 cursor-pointer shadow-lg shadow-primary/20 hover:scale-105 transition-all">
                  Start Your Journey <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            )}
            <Link href="/community">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                View Community
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 bg-secondary/5 border-y border-border/50">
          <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <Activity className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-bold mb-2">Mood Tracking</h3>
              <p className="text-muted-foreground">
                Daily micro-checkins to visualize your energy and emotional trends over time.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-indigo-500/10 flex items-center justify-center mb-4">
                <Brain className="w-6 h-6 text-indigo-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">DASS-21 Assessment</h3>
              <p className="text-muted-foreground">
                Clinical-grade self-assessment to monitor Depression, Anxiety, and Stress levels.
              </p>
            </div>
            <div className="p-6 rounded-2xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-lg bg-emerald-500/10 flex items-center justify-center mb-4">
                <ShieldCheck className="w-6 h-6 text-emerald-500" />
              </div>
              <h3 className="text-xl font-bold mb-2">Privacy First</h3>
              <p className="text-muted-foreground">
                Your data is encrypted and private. We prioritize your confidentiality above all.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40 text-center text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} CHATGPT Team Support Web. Built for Students.</p>
      </footer>
    </div>
  );
}
