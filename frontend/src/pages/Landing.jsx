import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Camera, Users, Sparkles, Shield, ArrowRight, Image as ImageIcon, Video, CheckCircle2, Star } from 'lucide-react';

const Landing = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans selection:bg-rose-500/30">

      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full mix-blend-screen filter blur-[100px] opacity-70 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-[30rem] h-[30rem] bg-indigo-600/10 rounded-full mix-blend-screen filter blur-[120px] opacity-50" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
      </div>

      <nav className="relative z-10 border-b border-slate-800/50 glass-panel">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Camera className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              EventHub
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-300 hover:text-white transition-colors px-4 py-2">
              Log In
            </Link>
            <Link to="/register" className="text-sm font-bold bg-white text-slate-950 px-5 py-2.5 rounded-full hover:bg-slate-200 transition-all shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:-translate-y-0.5 duration-200">
              Sign Up Free
            </Link>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-20 pb-32 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 mb-8 animate-fade-in opacity-0" style={{ animationDelay: '0.1s', animationFillMode: 'forwards' }}>
            <Sparkles className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold text-slate-300 tracking-wide uppercase">AI-Powered Memory Hub</span>
          </div>
          
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[1.1] mb-8 animate-fade-in opacity-0" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
            Collect & Relive <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 via-fuchsia-500 to-indigo-500">
              Every Shared Moment
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 animate-fade-in opacity-0 leading-relaxed" style={{ animationDelay: '0.3s', animationFillMode: 'forwards' }}>
            Create private spaces for weddings, trips, and parties. Everyone uploads their photos, and our AI automatically organizes, tags, and creates a searchable gallery.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in opacity-0" style={{ animationDelay: '0.4s', animationFillMode: 'forwards' }}>
            <Link to="/register" className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-rose-500 to-indigo-600 rounded-full font-bold text-white flex items-center justify-center gap-2 hover:opacity-90 transition-opacity shadow-[0_0_40px_rgba(244,63,94,0.3)] hover:scale-105 duration-200">
              Start Your First Event
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="w-full sm:w-auto px-8 py-4 bg-slate-900 border border-slate-800 rounded-full font-bold text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-800 transition-colors">
              Explore Demo
            </Link>
          </div>
        </div>

        <div className="mt-24 max-w-6xl mx-auto relative h-[400px] hidden md:block animate-fade-in opacity-0" style={{ animationDelay: '0.6s', animationFillMode: 'forwards' }}>
          
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-[800px] h-[500px] rounded-3xl border border-slate-800/60 bg-slate-900/50 backdrop-blur-md shadow-2xl overflow-hidden glass-panel z-20 flex flex-col">
            <div className="h-12 border-b border-slate-800/50 flex items-center px-4 gap-2 bg-slate-950/50">
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
              <div className="w-3 h-3 rounded-full bg-slate-800" />
            </div>
            <div className="p-4 grid grid-cols-4 gap-3 h-full">
               <div className="col-span-2 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&q=80&w=800" alt="Wedding" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="col-span-1 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&q=80&w=400" alt="Party" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="col-span-1 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1530103862676-de8892d12fae?auto=format&fit=crop&q=80&w=400" alt="Celebration" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="col-span-1 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1527529482837-4698179dc6ce?auto=format&fit=crop&q=80&w=400" alt="Gathering" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="col-span-2 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&q=80&w=800" alt="Dinner" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
               <div className="col-span-1 h-full rounded-2xl overflow-hidden relative group">
                 <img src="https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&q=80&w=400" alt="Friends" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
               </div>
            </div>
          </div>

          <div className="absolute top-12 left-[10%] z-30 p-4 rounded-2xl glass-panel border border-slate-700 shadow-xl flex items-center gap-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Users className="w-6 h-6 text-indigo-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">42 Members</div>
              <div className="text-xs text-slate-400">Joined the Wedding event</div>
            </div>
          </div>

          <div className="absolute top-40 right-[10%] z-30 p-4 rounded-2xl glass-panel border border-slate-700 shadow-xl flex items-center gap-4 hover:-translate-y-2 transition-transform duration-300">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">+ 1,204 Photos</div>
              <div className="text-xs text-slate-400">Auto-tagged & Organized</div>
            </div>
          </div>
        </div>
      </main>

      <section className="relative z-10 py-32 bg-slate-950 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Designed for Shared Experiences</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Stop chasing friends for photos. Give them a beautiful, secure space to drop their memories.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Sparkles className="w-8 h-8 text-rose-400" />}
              title="Azure AI Auto-Tagging"
              desc="Our integration with Azure Vision automatically detects objects, themes, and activities in your photos to make them instantly searchable."
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-indigo-400" />}
              title="Collaborative Albums"
              desc="Generate unique invite links. Anyone with the link can join the event, view the public feed, and bulk upload their own photos."
            />
            <FeatureCard 
              icon={<Shield className="w-8 h-8 text-emerald-400" />}
              title="Private & Secure"
              desc="Control who sees what. Mark uploads as private, remove members, and keep your memories entirely under your command."
            />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-32 bg-slate-900/50 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">How It Works</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">Three simple steps to build your ultimate event gallery.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-12 relative">
            
            <div className="hidden md:block absolute top-12 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-transparent via-rose-500/50 to-transparent"></div>
            
            <StepCard number="1" title="Create an Event" desc="Give your event a name and generate a secure sharing link." />
            <StepCard number="2" title="Invite Friends" desc="Send the link to your guests. They can upload photos instantly without an account." />
            <StepCard number="3" title="Relive the Magic" desc="Watch as our AI automatically organizes, tags, and creates a searchable gallery." />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-32 bg-slate-950 border-t border-slate-900 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-indigo-600/5 rounded-full blur-3xl pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black tracking-tight mb-6">Loved by Thousands</h2>
            <p className="text-slate-400 max-w-2xl mx-auto text-lg">See how people are using EventHub to capture their memories.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <TestimonialCard name="Sarah Jenkins" event="Wedding" text="EventHub was a lifesaver for our wedding! We got over 800 photos from our guests that we would have never seen otherwise." />
            <TestimonialCard name="David Miller" event="Corporate Retreat" text="The AI auto-tagging is incredible. It automatically grouped all the photos of our team-building exercises." />
            <TestimonialCard name="Emily Chen" event="Birthday Party" text="So easy to use. My grandparents were able to upload their photos without any help. The gallery looks stunning." />
          </div>
        </div>
      </section>

      <section className="relative z-10 py-32 bg-slate-900 border-t border-slate-800">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-5xl font-black tracking-tight mb-8">Ready to Capture <span className="text-transparent bg-clip-text bg-gradient-to-r from-rose-400 to-indigo-500">Your Next Event?</span></h2>
          <p className="text-xl text-slate-400 mb-10">Join thousands of users who trust EventHub to store and organize their most precious memories.</p>
          <Link to="/register" className="inline-flex items-center gap-2 px-10 py-5 bg-white text-slate-950 rounded-full font-bold text-lg hover:scale-105 transition-transform duration-300 shadow-[0_0_40px_rgba(255,255,255,0.2)]">
            Create Your Free Account
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>

      <footer className="relative z-10 bg-slate-950 border-t border-slate-900 pt-20 pb-10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Camera className="w-6 h-6 text-rose-500" />
                <span className="font-extrabold text-2xl tracking-tight">EventHub</span>
              </div>
              <p className="text-slate-400 max-w-sm mb-6">The ultimate AI-powered memory hub for weddings, parties, and corporate events.</p>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Product</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-rose-400 transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Security</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-white mb-6">Legal</h4>
              <ul className="space-y-4 text-slate-400">
                <li><a href="#" className="hover:text-rose-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-rose-400 transition-colors">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} EventHub. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, desc }) => (
  <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/50 transition-all group hover:-translate-y-2 duration-300">
    <div className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
      {icon}
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400 leading-relaxed">{desc}</p>
  </div>
);

const StepCard = ({ number, title, desc }) => (
  <div className="relative text-center group">
    <div className="w-20 h-20 mx-auto rounded-full bg-slate-950 border-2 border-rose-500 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(244,63,94,0.2)] group-hover:scale-110 transition-transform duration-300">
      <span className="text-3xl font-black text-white">{number}</span>
    </div>
    <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
    <p className="text-slate-400">{desc}</p>
  </div>
);

const TestimonialCard = ({ name, event, text }) => (
  <div className="p-8 rounded-3xl bg-slate-900/50 border border-slate-800 glass-panel hover:-translate-y-2 transition-transform duration-300">
    <div className="flex gap-1 text-rose-500 mb-6">
      <Star className="w-5 h-5 fill-current" />
      <Star className="w-5 h-5 fill-current" />
      <Star className="w-5 h-5 fill-current" />
      <Star className="w-5 h-5 fill-current" />
      <Star className="w-5 h-5 fill-current" />
    </div>
    <p className="text-slate-300 italic mb-6 leading-relaxed">"{text}"</p>
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center font-bold text-rose-400">
        {name.charAt(0)}
      </div>
      <div>
        <div className="font-bold text-white text-sm">{name}</div>
        <div className="text-xs text-slate-500">{event}</div>
      </div>
    </div>
  </div>
);

export default Landing;
