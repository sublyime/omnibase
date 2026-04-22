import React, { useState, useRef, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderTree, 
  Users, 
  Settings, 
  LogOut, 
  Search, 
  ChevronRight, 
  ShieldCheck,
  CreditCard,
  Database,
  Sparkles,
  Loader2,
  Filter,
  X,
  Calendar,
  Tag,
  User as UserIcon,
  FileType
} from 'lucide-react';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { basicSearch } from '../lib/gemini';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    type: '',
    author: '',
    tag: '',
    start: '',
    end: ''
  });
  const navigate = useNavigate();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setSearchResults(null);
    
    try {
      // 1. Fetch filtered context from API
      const filterParams = new URLSearchParams({ 
        q: searchQuery,
        ...Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))
      });
      const res = await fetch(`/api/search?${filterParams.toString()}`);
      const units = await res.json();
      
      if (units.length === 0) {
        setSearchResults("No assets found matching these criteria in the central registry.");
        return;
      }

      // 2. Format and display search results
      const result = await basicSearch(units);
      setSearchResults(result || "No results available for these parameters.");
    } catch (err) {
      console.error("Search failed", err);
      setSearchResults("Critical system error during intelligence retrieval.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="flex h-screen w-full overflow-hidden bg-enterprise-bg text-enterprise-text selection:bg-enterprise-accent/30">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        className="sidebar-gradient h-full flex flex-col transition-all duration-300"
        id="main-sidebar"
      >
        <div className="p-6 flex items-center justify-between h-16 border-b border-enterprise-border shrink-0">
          <div className={cn("flex items-center gap-3", !isSidebarOpen && "hidden")}>
            <div className="w-8 h-8 bg-enterprise-accent rounded flex items-center justify-center font-bold text-white uppercase text-sm">O</div>
            <span className="font-serif tracking-tight text-white text-lg lowercase">omni<span className="text-enterprise-accent">base</span></span>
          </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-1 hover:bg-white/5 rounded transition-colors text-enterprise-muted hover:text-white"
          >
            <ChevronRight className={cn("transition-transform", isSidebarOpen && "rotate-180")} size={18} />
          </button>
        </div>

        <nav className="flex-1 px-4 py-8 space-y-1 overflow-y-auto custom-scrollbar">
          <div className={cn("px-2 mb-4", !isSidebarOpen && "hidden")}>
             <h3 className="text-[10px] uppercase tracking-[0.2em] text-enterprise-muted font-bold">Domain Navigation</h3>
          </div>
          <SideItem to="/dashboard" icon={<LayoutDashboard size={18} />} label="Dashboard" expanded={isSidebarOpen} />
          <SideItem to="/explorer" icon={<FolderTree size={18} />} label="Knowledge Explorer" expanded={isSidebarOpen} />
          <SideItem to="/admin" icon={<Users size={18} />} label="Access Control" expanded={isSidebarOpen} />
          <SideItem to="/security" icon={<ShieldCheck size={18} />} label="Security & Audit" expanded={isSidebarOpen} />
          <SideItem to="/billing" icon={<CreditCard size={18} />} label="License & Billing" expanded={isSidebarOpen} />
          <SideItem to="/database" icon={<Database size={18} />} label="Cloud Infra" expanded={isSidebarOpen} />
          <SideItem to="/settings" icon={<Settings size={18} />} label="Global Config" expanded={isSidebarOpen} />
        </nav>

        <div className="p-4 mt-auto">
          {isSidebarOpen && (
            <div className="bg-enterprise-bg/50 p-3 border border-enterprise-border rounded-lg mb-4">
              <div className="text-[9px] font-mono text-enterprise-muted mb-2 uppercase tracking-widest">Security Token</div>
              <div className="flex justify-between text-[10px] mb-1">
                <span className="text-enterprise-muted">FedRAMP:</span> 
                <span className="text-emerald-500 font-bold uppercase tracking-tighter shadow-emerald-500/20 shadow-[0_0_8px]">Active</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-enterprise-muted">Encryption:</span> 
                <span className="text-white font-mono">AES-256</span>
              </div>
            </div>
          )}
          <button 
            onClick={() => navigate('/')}
            className={cn(
              "flex items-center gap-3 w-full p-2.5 hover:bg-red-500/10 text-enterprise-muted hover:text-red-400 rounded-lg transition-all text-sm",
              !isSidebarOpen && "justify-center"
            )}
            id="logout-button"
          >
            <LogOut size={18} />
            {isSidebarOpen && <span className="font-medium">Terminate Session</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="h-16 border-b border-enterprise-border bg-enterprise-surface/80 backdrop-blur-md flex items-center justify-between px-6 z-20 shrink-0">
          <div className="flex items-center gap-4 flex-1 max-w-xl relative">
            <form onSubmit={handleSearch} className="w-full relative group flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-enterprise-muted group-focus-within:text-enterprise-accent transition-colors" size={16} />
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search 14.2TB of Knowledge Assets..." 
                  className="w-full bg-enterprise-input border border-enterprise-border rounded-md py-1.5 pl-10 pr-4 focus:outline-none focus:ring-1 focus:ring-enterprise-accent transition-all text-sm text-white placeholder:text-enterprise-muted"
                />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 text-enterprise-accent animate-spin" size={16} />}
              </div>
              <button 
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2 border border-enterprise-border rounded-md transition-all hover:bg-white/5",
                  showFilters ? "bg-enterprise-accent/10 border-enterprise-accent text-enterprise-accent" : "text-enterprise-muted"
                )}
              >
                <Filter size={16} />
              </button>
            </form>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-6 glass-morphism rounded-xl shadow-2xl z-50 border border-enterprise-border text-xs"
                >
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-enterprise-border">
                    <span className="font-bold uppercase tracking-widest text-enterprise-accent">Advanced Filters</span>
                    <button onClick={() => setShowFilters(false)} className="text-enterprise-muted hover:text-white"><X size={14} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <FilterInput icon={<FileType size={12} />} label="Unit Type">
                        <select 
                          value={filters.type} 
                          onChange={e => setFilters({...filters, type: e.target.value})}
                          className="w-full bg-enterprise-bg border border-enterprise-border rounded p-1.5 focus:outline-none focus:border-enterprise-accent text-white"
                        >
                          <option value="">All Architectures</option>
                          <option value="DOCUMENT">Document (.pdf, .docx)</option>
                          <option value="CAD">Engineering (.cad)</option>
                          <option value="MODEL_3D">3D Assets (.3d, .obj)</option>
                        </select>
                      </FilterInput>
                      <FilterInput icon={<Calendar size={12} />} label="Temporal Range (Start)">
                        <input 
                          type="date" 
                          value={filters.start}
                          onChange={e => setFilters({...filters, start: e.target.value})}
                          className="w-full bg-enterprise-bg border border-enterprise-border rounded p-1.5 focus:outline-none focus:border-enterprise-accent text-white" 
                        />
                      </FilterInput>
                      <FilterInput icon={<Calendar size={12} />} label="Temporal Range (End)">
                        <input 
                          type="date" 
                          value={filters.end}
                          onChange={e => setFilters({...filters, end: e.target.value})}
                          className="w-full bg-enterprise-bg border border-enterprise-border rounded p-1.5 focus:outline-none focus:border-enterprise-accent text-white" 
                        />
                      </FilterInput>
                    </div>
                    <div className="space-y-4">
                      <FilterInput icon={<UserIcon size={12} />} label="Principal Architect">
                        <input 
                          type="text" 
                          placeholder="Author name..."
                          value={filters.author}
                          onChange={e => setFilters({...filters, author: e.target.value})}
                          className="w-full bg-enterprise-bg border border-enterprise-border rounded p-1.5 focus:outline-none focus:border-enterprise-accent text-white" 
                        />
                      </FilterInput>
                      <FilterInput icon={<Tag size={12} />} label="Metadata Tags">
                        <input 
                          type="text" 
                          placeholder="e.g. restricted, project-mars"
                          value={filters.tag}
                          onChange={e => setFilters({...filters, tag: e.target.value})}
                          className="w-full bg-enterprise-bg border border-enterprise-border rounded p-1.5 focus:outline-none focus:border-enterprise-accent text-white" 
                        />
                      </FilterInput>
                      <div className="flex gap-2 pt-2">
                        <button 
                          onClick={() => setFilters({ type: '', author: '', tag: '', start: '', end: '' })}
                          className="flex-1 py-2 border border-enterprise-border rounded text-[10px] font-bold uppercase tracking-widest text-enterprise-muted hover:text-white transition-colors"
                        >Clear</button>
                        <button 
                          onClick={() => setShowFilters(false)}
                          className="flex-1 py-2 bg-enterprise-accent text-white rounded text-[10px] font-bold uppercase tracking-widest transition-opacity hover:opacity-90"
                        >Apply</button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* AI Search Dropdown */}
            <AnimatePresence>
              {searchResults && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                  className="absolute top-full left-0 right-0 mt-2 p-6 glass-morphism rounded-xl shadow-2xl z-50 max-h-[400px] overflow-y-auto border-enterprise-accent/20"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <Sparkles className="text-enterprise-accent" size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-enterprise-accent">OmniRetriever System Output</span>
                    <button 
                      onClick={() => setSearchResults(null)}
                      className="ml-auto text-[10px] font-bold text-enterprise-muted hover:text-white uppercase tracking-widest"
                    >Dismiss</button>
                  </div>
                  <div className="text-sm leading-relaxed text-enterprise-text whitespace-pre-wrap">
                    {searchResults}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse"></div>
              <span className="text-[10px] font-mono tracking-wider text-enterprise-muted uppercase">Cloud Health: 100%</span>
            </div>
            <div className="h-8 w-px bg-enterprise-border" />
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-right">
                <span className="text-xs font-bold text-white leading-none">John Doe</span>
                <span className="text-[10px] text-enterprise-muted uppercase tracking-widest mt-1">Lead Architect</span>
              </div>
              <div className="w-9 h-9 rounded-full bg-enterprise-input border border-enterprise-border flex items-center justify-center text-xs font-bold text-white shadow-inner">JD</div>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 relative scroll-smooth custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={window.location.pathname}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="max-w-7xl mx-auto h-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function SideItem({ to, icon, label, expanded }: { to: string, icon: React.ReactNode, label: string, expanded: boolean }) {
  return (
    <NavLink 
      to={to} 
      className={({ isActive }) => cn(
        "flex items-center gap-3 p-2 rounded transition-all duration-200 group text-sm",
        isActive 
          ? "bg-enterprise-accent/10 text-indigo-300 shadow-sm" 
          : "text-enterprise-muted hover:bg-white/5 hover:text-white",
        !expanded && "justify-center"
      )}
    >
      {({ isActive }) => (
        <>
          <span className={cn("transition-transform", isActive ? "scale-100" : "group-hover:translate-x-0.5")}>{icon}</span>
          {expanded && <span className={cn("font-medium truncate tracking-tight", isActive && "text-white")}>{label}</span>}
        </>
      )}
    </NavLink>
  );
}

function FilterInput({ icon, label, children }: { icon: React.ReactNode, label: string, children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-[10px] uppercase font-bold text-enterprise-muted tracking-widest">
        {icon}
        {label}
      </div>
      {children}
    </div>
  );
}

