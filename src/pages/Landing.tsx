import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Search, 
  Globe, 
  Lock, 
  ChevronRight, 
  CheckCircle2, 
  FileBox, 
  Layers,
  ArrowRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Landing() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-enterprise-bg text-enterprise-text overflow-x-hidden font-sans selection:bg-enterprise-accent/30">
      {/* Navigation */}
      <nav className="max-w-7xl mx-auto px-8 h-20 flex items-center justify-between border-b border-enterprise-border/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-500 rounded flex items-center justify-center font-bold text-white text-sm uppercase">O</div>
          <span className="text-xl font-serif tracking-tight text-white uppercase italic">Omni<span className="text-indigo-400 not-italic">Base</span></span>
        </div>
        <div className="hidden md:flex items-center gap-10">
          <NavLink href="#features">Propocols</NavLink>
          <NavLink href="#security">Encryption</NavLink>
          <NavLink href="#pricing">Licensing</NavLink>
          <button 
            onClick={() => navigate('/login')}
            className="px-5 py-2.5 bg-indigo-600 text-white rounded font-bold text-xs uppercase tracking-widest hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95"
          >
            Terminal Access
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-8 pt-24 pb-40 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="space-y-10 text-center lg:text-left"
        >
          <div className="inline-flex items-center gap-3 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded text-[10px] font-bold tracking-[0.2em] uppercase">
            <Shield size={12} />
            FedRAMP v4.2 Deployment Ready
          </div>
          <h1 className="text-6xl md:text-8xl font-serif font-bold tracking-tighter leading-[0.85] text-white italic">
            Knowledge <br />
            <span className="text-indigo-500 not-italic">Refinement.</span>
          </h1>
          <p className="text-lg text-enterprise-muted max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
            Universal intelligence centralization for the world's most guarded organizations. 
            Unified ingestion for CAD, 3D assets, and encrypted media streams.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start pt-4">
            <button 
              onClick={() => navigate('/login')}
              className="px-8 py-4 bg-indigo-600 text-white rounded font-bold text-sm tracking-[0.15em] uppercase shadow-2xl shadow-indigo-500/20 flex items-center gap-3 transition-all hover:bg-indigo-500"
            >
              Initialize Node
              <ChevronRight size={16} />
            </button>
            <button className="px-8 py-4 bg-enterprise-surface text-white border border-enterprise-border rounded font-bold text-sm tracking-[0.15em] uppercase hover:bg-enterprise-input transition-all">
              Request Audit
            </button>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative group"
        >
          <div className="absolute -inset-10 bg-indigo-500/20 blur-[100px] opacity-20 pointer-events-none group-hover:opacity-40 transition-opacity" />
          <div className="relative bg-enterprise-surface rounded-2xl border border-enterprise-border shadow-2xl p-1 overflow-hidden">
            <div className="bg-enterprise-bg rounded-xl overflow-hidden aspect-square flex items-center justify-center relative">
               <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_transparent_0%,_#020617_70%)] opacity-50 z-10" />
               <div className="w-full h-full opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] pointer-events-none" />
               <div className="z-20 text-indigo-500/40 animate-pulse">
                  <Layers size={140} strokeWidth={0.5} />
               </div>
               
               {/* Floating elements */}
               <div className="absolute top-10 right-10 p-4 glass-morphism rounded-xl border-indigo-500/10 z-30 shadow-2xl">
                  <div className="w-20 h-2 bg-indigo-500/20 rounded-full mb-2 overflow-hidden">
                    <div className="w-1/2 h-full bg-indigo-500" />
                  </div>
                  <div className="w-12 h-1.5 bg-enterprise-muted/20 rounded-full" />
               </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Feature Grid */}
      <section className="bg-enterprise-surface border-y border-enterprise-border py-40" id="features">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center space-y-4 mb-24">
             <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em]">Integrated Subsystems</div>
            <h2 className="text-5xl font-serif text-white italic tracking-tight">Enterprise Infrastructure <span className="text-indigo-500 not-italic">Specs.</span></h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Search size={28} />} 
              title="Semantic Retrieval" 
              desc="Natural language interrogation of 14.2TB datasets. Our AI abstracts everything from legacy RTF to complex STEP CAD data."
            />
            <FeatureCard 
              icon={<Globe size={28} />} 
              title="Universal I/O" 
              desc="Virtualized viewing for MS Excel, Acrobat PDF, Unreal 3D, and high-fidelity video streams without binary extraction."
            />
            <FeatureCard 
              icon={<Lock size={28} />} 
              title="Auth Intelligence" 
              desc="Integrated FIDO2/Passkey protocols with per-asset granular RBAC. Designed for sub-millisecond encryption handshakes."
            />
          </div>
        </div>
      </section>

      {/* Subscription Terminal */}
      <section className="py-40 max-w-7xl mx-auto px-8">
        <div className="bg-enterprise-surface rounded-[2rem] p-16 border border-enterprise-border text-white flex flex-col md:flex-row items-center justify-between gap-16 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-full h-full pointer-events-none opacity-5">
             <div className="absolute top-0 right-0 w-full h-full bg-[linear-gradient(45deg,_transparent_25%,_rgba(99,102,241,0.2)_50%,_transparent_75%)] bg-[length:250%_250%] animate-[marquee_10s_linear_infinite]" />
          </div>
          
          <div className="space-y-8 relative z-10 max-w-xl text-center md:text-left">
             <div className="text-[10px] font-bold text-indigo-500 uppercase tracking-[0.3em]">Subscription Model</div>
            <h2 className="text-5xl md:text-6xl font-serif font-bold tracking-tighter leading-none italic">Infinite <br /><span className="text-indigo-500 not-italic">Organizational Span.</span></h2>
            <p className="text-enterprise-muted text-lg leading-relaxed font-medium">
              Scale your knowledge propagation with the enterprise gold standard. Structured hierarchy for the data-driven future.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500 shrink-0" size={16} />
                <span className="text-xs font-bold uppercase tracking-widest text-enterprise-text">Unlimited Assets</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-indigo-500 shrink-0" size={16} />
                <span className="text-xs font-bold uppercase tracking-widest text-enterprise-text">Dedicated HSM</span>
              </div>
            </div>
          </div>

          <div className="bg-enterprise-bg rounded-2xl p-12 border border-enterprise-accent/20 shadow-2xl relative z-10 w-full max-w-sm">
            <h3 className="text-lg font-bold text-white uppercase tracking-widest mb-2 italic">OmniBase <span className="text-indigo-500 not-italic">Infinite</span></h3>
            <div className="flex items-baseline gap-2 mt-8 mb-10">
              <span className="text-6xl font-serif font-bold tracking-tighter text-white">$499</span>
              <span className="text-enterprise-muted font-bold uppercase text-[10px] tracking-widest opacity-60">/ Month</span>
            </div>
            <button 
              onClick={() => navigate('/dashboard')}
              className="w-full py-4 bg-indigo-600 text-white rounded font-bold uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-3 hover:bg-white hover:text-black transition-all shadow-lg shadow-indigo-500/10"
            >
              Initialize Node
              <ArrowRight size={14} />
            </button>
            <p className="mt-6 text-[9px] text-center text-enterprise-muted font-bold uppercase tracking-[0.2em] leading-relaxed opacity-40">
              Licensed for Federal Use Under <br /> GSA Contract #OB-INT-400
            </p>
          </div>
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-8 py-20 border-t border-enterprise-border flex flex-col md:flex-row items-center justify-between gap-12">
        <div className="flex items-center gap-3 grayscale opacity-30">
          <div className="w-6 h-6 bg-white rounded flex items-center justify-center font-bold text-black text-[10px]">O</div>
          <span className="text-sm font-serif tracking-tight text-white uppercase italic">OmniBase</span>
        </div>
        <p className="text-[10px] text-enterprise-muted font-bold uppercase tracking-widest">© 2024 OmniBase Intelligence. Secure Data Centralization Systems.</p>
        <div className="flex gap-10">
          <FooterLink>Privacy.sec</FooterLink>
          <FooterLink>Terms.reg</FooterLink>
          <FooterLink>Contact.hsm</FooterLink>
        </div>
      </footer>
    </div>
  );
}


function NavLink({ href, children }: { href: string, children: React.ReactNode }) {
  return (
    <a href={href} className="text-sm font-bold text-gray-500 hover:text-enterprise-accent transition-colors tracking-tight">
      {children}
    </a>
  );
}

function FooterLink({ children }: { children: React.ReactNode }) {
  return (
    <a href="#" className="text-sm font-bold text-gray-400 hover:text-enterprise-blue transition-colors">
      {children}
    </a>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode, title: string, desc: string }) {
  return (
    <div className="p-10 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group hover:-translate-y-2">
      <div className="w-16 h-16 bg-enterprise-surface rounded-2xl flex items-center justify-center text-enterprise-accent group-hover:bg-enterprise-accent group-hover:text-white transition-all mb-8">
        {icon}
      </div>
      <h3 className="text-2xl font-bold mb-4 tracking-tight">{title}</h3>
      <p className="text-gray-500 leading-relaxed font-medium">{desc}</p>
    </div>
  );
}
