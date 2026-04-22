import React, { useState, useEffect } from 'react';
import { 
  Folder, 
  FileText, 
  Plus, 
  ChevronRight, 
  FileCode, 
  FileVideo, 
  FileBox, 
  HardDrive,
  MessageSquare,
  History,
  Info,
  Clock,
  User as UserIcon,
  Send,
  AlertCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { UnitType, KnowledgeUnit, Comment, Version } from '../types';
import { useCollaboration } from '../hooks/useCollaboration';

export default function Explorer() {
  const [units, setUnits] = useState<KnowledgeUnit[]>([]);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock current user for prototype
  const currentUser = { id: 'usr-1', name: 'Sublyime', role: 'admin' as const };

  useEffect(() => {
    fetchUnits();
  }, []);

  const fetchUnits = async (parentId: string | null = null) => {
    try {
      const res = await fetch(`/api/units${parentId ? `?parentId=${parentId}` : ''}`);
      const data = await res.json();
      setUnits(prev => {
        const next = [...prev];
        data.forEach((u: KnowledgeUnit) => {
          if (!next.find(item => item.id === u.id)) next.push(u);
        });
        return next;
      });
      setLoading(false);
    } catch (err) {
      console.error("Failed to fetch units", err);
    }
  };

  const toggleExpand = (id: string) => {
    if (!expanded.includes(id)) {
      fetchUnits(id);
      setExpanded(prev => [...prev, id]);
    } else {
      setExpanded(prev => prev.filter(i => i !== id));
    }
  };

  const renderTree = (parentId: string | null = null, level = 0) => {
    return units.filter(u => u.parent_id === parentId).map(unit => {
      const isExpanded = expanded.includes(unit.id);
      const isSelected = selected === unit.id;

      return (
        <div key={unit.id} className="select-none">
          <div 
            onClick={() => {
              if (unit.type === UnitType.DIRECTORY) toggleExpand(unit.id);
              setSelected(unit.id);
            }}
            style={{ paddingLeft: `${level * 1 + 0.5}rem` }}
            className={cn(
              "flex items-center gap-2 py-1.5 px-2 rounded-md cursor-pointer group transition-all text-sm",
              isSelected ? "bg-enterprise-accent/10 text-indigo-300" : "text-enterprise-muted hover:text-white"
            )}
          >
            {unit.type === UnitType.DIRECTORY ? (
              <span className="text-enterprise-muted/50">
                <Folder size={14} fill={isExpanded ? "currentColor" : "none"} className={isExpanded ? "text-indigo-400" : ""} />
              </span>
            ) : (
              <FileIcon type={unit.type} size={14} className="text-enterprise-muted/50" />
            )}
            
            <span className={cn("flex-1 truncate tracking-tight", isSelected ? "font-medium" : "")}>
              {unit.name}
            </span>
          </div>
          
          {isExpanded && (
            <div className={cn("ml-3 border-l border-enterprise-border pl-1 my-0.5")}>
               {renderTree(unit.id, level + 1)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="flex gap-6 h-full overflow-hidden">
      <aside className="w-72 bg-enterprise-surface border border-enterprise-border rounded-xl p-5 flex flex-col gap-6 shrink-0 h-full overflow-hidden">
        <div className="flex items-center justify-between">
          <h3 className="text-[11px] uppercase tracking-[0.2em] text-enterprise-muted font-bold">Registry Hierarchy</h3>
          <button className="p-1.5 hover:bg-white/5 rounded text-enterprise-muted hover:text-white transition-colors">
            <Plus size={14} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-1">
          {loading ? (
            <div className="flex items-center justify-center h-20 text-enterprise-muted">
              <span className="text-[10px] animate-pulse">Initializing Hierarchy...</span>
            </div>
          ) : renderTree()}
        </div>

        <div className="pt-4 mt-auto">
          <div className="bg-enterprise-bg/40 p-4 border border-enterprise-border rounded-xl">
             <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-enterprise-muted font-bold mb-2">
                <span>Volume Quota</span>
                <span className="text-white">14.2 / 50 TB</span>
             </div>
             <div className="w-full h-1 bg-enterprise-input rounded-full overflow-hidden">
                <div className="w-[28%] h-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
             </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 bg-enterprise-bg border border-enterprise-border rounded-xl flex flex-col overflow-hidden h-full">
        {selected ? (
          <UnitDetail unit={units.find(u => u.id === selected)!} user={currentUser} />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-12 gap-6">
            <div className="w-20 h-20 bg-enterprise-surface rounded-3xl border border-enterprise-border flex items-center justify-center text-enterprise-muted">
              <HardDrive size={40} strokeWidth={1} />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-serif text-white tracking-tight">Access Registry Node</h3>
              <p className="text-enterprise-muted max-w-sm text-sm">Initialize a knowledge node from the hierarchy to audit metadata and system documentation.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function FileIcon({ type, size, className }: { type: UnitType, size: number, className?: string }) {
  switch (type) {
    case UnitType.DIRECTORY: return <Folder className={cn("text-indigo-400", className)} size={size} />;
    case UnitType.DOCUMENT: return <FileText className={cn("text-blue-400", className)} size={size} />;
    case UnitType.CAD: return <FileCode className={cn("text-purple-400", className)} size={size} />;
    case UnitType.MODEL_3D: return <FileBox className={cn("text-indigo-400", className)} size={size} />;
    case UnitType.MEDIA: return <FileVideo className={cn("text-orange-400", className)} size={size} />;
    default: return <FileText className={cn("text-enterprise-muted", className)} size={size} />;
  }
}

function UnitDetail({ unit, user }: { unit: KnowledgeUnit, user: any }) {
  const [activeTab, setActiveTab] = useState<'preview' | 'history' | 'collaboration'>('preview');
  const [versions, setVersions] = useState<Version[]>([]);
  const [dbComments, setDbComments] = useState<Comment[]>([]);
  const [commentInput, setCommentInput] = useState('');
  
  const { comments: liveComments, editingUsers, sendComment, pingEdit } = useCollaboration(unit.id, user.id, user.name);

  useEffect(() => {
    if (activeTab === 'history') fetchVersions();
    if (activeTab === 'collaboration') fetchComments();
  }, [activeTab, unit.id]);

  const fetchVersions = async () => {
    const res = await fetch(`/api/units/${unit.id}/versions`);
    const data = await res.json();
    setVersions(data);
  };

  const fetchComments = async () => {
    const res = await fetch(`/api/units/${unit.id}/comments`);
    const data = await res.json();
    setDbComments(data);
  };

  const handleSendComment = async () => {
    if (!commentInput.trim()) return;
    const newComment = {
      id: crypto.randomUUID(),
      user_id: user.id,
      user_name: user.name,
      content: commentInput,
      timestamp: new Date().toISOString()
    };
    
    await fetch(`/api/units/${unit.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newComment)
    });

    sendComment(newComment);
    setCommentInput('');
    fetchComments();
  };

  const allComments = [...dbComments, ...liveComments.filter(lc => !dbComments.find(dc => dc.id === lc.id))];

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-2 duration-300">
      <header className="p-8 pb-6 flex flex-col gap-6 border-b border-enterprise-border">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <nav className="flex gap-2 text-[10px] text-enterprise-muted font-bold uppercase tracking-widest">
              <span>Root</span> <ChevronRight size={10} className="mt-0.5" /> 
              <span className="text-indigo-400/80">Repository</span> <ChevronRight size={10} className="mt-0.5" /> 
              <span className="text-indigo-400">{unit.name}</span>
            </nav>
            <h1 className="text-4xl font-serif text-white tracking-tight flex items-center gap-4">
              {unit.name}
              <span className="text-[10px] align-middle bg-enterprise-accent/10 text-enterprise-accent border border-enterprise-accent/20 px-2 py-0.5 rounded tracking-widest uppercase font-bold">
                {unit.type}
              </span>
            </h1>
          </div>
          <div className="flex gap-3">
            {editingUsers.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-[10px] text-amber-500 font-bold uppercase tracking-widest">
                <AlertCircle size={12} strokeWidth={3} />
                {Array.from(editingUsers).join(', ')} is editing
              </div>
            )}
            <button 
              onClick={() => {
                pingEdit();
                alert("Co-editing protocol initiated. Locking state for synchronization.");
              }}
              className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all uppercase tracking-widest"
            >
              Write Data
            </button>
          </div>
        </div>

        <nav className="flex gap-8 border-b border-enterprise-border">
          <TabButton active={activeTab === 'preview'} onClick={() => setActiveTab('preview')} icon={<Info size={14} />} label="Integrated Preview" />
          <TabButton active={activeTab === 'collaboration'} onClick={() => setActiveTab('collaboration')} icon={<MessageSquare size={14} />} label="Collaboration" />
          <TabButton active={activeTab === 'history'} onClick={() => setActiveTab('history')} icon={<History size={14} />} label="Audit & History" />
        </nav>
      </header>

      <div className="flex-1 overflow-hidden relative">
        {activeTab === 'preview' && (
          <div className="h-full flex flex-col">
            <div className="p-8 grid grid-cols-3 gap-6 shrink-0">
                <InfoStat label="Registry Integrity" value="SHA-256 Verified" />
                <InfoStat label="Author" value={unit.author_name || 'System'} />
                <InfoStat label="Timestamp" value={new Date(unit.updated_at).toLocaleString()} />
            </div>
            <div className="flex-1 p-8 pt-0 overflow-hidden">
              <div className="w-full h-full bg-enterprise-surface/30 rounded-2xl border border-enterprise-border border-dashed flex flex-col items-center justify-center text-center group">
                <div className="w-16 h-16 bg-enterprise-bg rounded-2xl border border-enterprise-border flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                   <FileIcon type={unit.type} size={24} />
                </div>
                <p className="font-mono text-xs text-enterprise-muted tracking-widest uppercase animate-pulse">[ Synchronizing Universal Viewer Engine ]</p>
                <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-sm">
                   {unit.tags?.map(tag => (
                     <span key={tag} className="px-2 py-1 bg-white/5 border border-enterprise-border rounded text-[9px] uppercase font-bold text-enterprise-muted">#{tag}</span>
                   ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'collaboration' && (
          <div className="h-full flex">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar flex flex-col gap-6">
              <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-2 flex items-center gap-2">
                <MessageSquare size={16} className="text-enterprise-accent" />
                Unified Discussion Stream
              </h3>
              
              <div className="space-y-6">
                {allComments.map((comment, idx) => (
                  <div key={idx} className="flex gap-4 group">
                    <div className="w-8 h-8 rounded-lg bg-enterprise-input border border-enterprise-border flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                      {comment.user_name.charAt(0)}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-white">{comment.user_name}</span>
                        <span className="text-[10px] text-enterprise-muted font-mono">{new Date(comment.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <p className="text-sm text-enterprise-text leading-relaxed bg-white/5 p-3 rounded-xl border border-enterprise-border/50">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="w-80 border-l border-enterprise-border p-6 bg-enterprise-surface/30 flex flex-col gap-6">
              <div className="space-y-4">
                <label className="text-[10px] font-bold text-enterprise-muted uppercase tracking-[0.2em]">Transmit Intelligence</label>
                <textarea 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  placeholder="Annotate node..."
                  className="w-full h-32 bg-enterprise-input border border-enterprise-border rounded-xl p-3 text-sm text-white focus:outline-none focus:border-enterprise-accent/50 transition-colors resize-none"
                />
                <button 
                  onClick={handleSendComment}
                  className="w-full py-3 bg-enterprise-input border border-enterprise-border text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:border-enterprise-accent hover:text-enterprise-accent transition-all flex items-center justify-center gap-2"
                >
                  <Send size={12} />
                  Post Comment
                </button>
              </div>

              <div className="mt-auto p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                 <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest mb-1">Collaboration Alert</p>
                 <p className="text-[10px] text-enterprise-muted leading-relaxed">Inline annotations are automatically synchronized with the global registry for all authorized principals.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="h-full p-8 overflow-y-auto custom-scrollbar">
            <div className="max-w-3xl mx-auto space-y-8">
              <header className="flex items-center justify-between">
                <h3 className="text-xl font-serif text-white tracking-tight italic">Registry <span className="text-enterprise-accent not-italic">Audit Log</span></h3>
                <span className="text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">{versions.length} Artifact Versions</span>
              </header>

              <div className="space-y-4">
                {versions.map((v, idx) => (
                  <div key={idx} className="glass-morphism p-5 rounded-2xl border border-enterprise-border group hover:border-enterprise-accent/30 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-enterprise-input border border-enterprise-border flex items-center justify-center font-mono text-sm text-white">
                          v{v.version_number}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-tight">{v.change_summary}</p>
                          <p className="text-[10px] text-enterprise-muted font-bold uppercase tracking-widest mt-0.5">{v.author_name} · {new Date(v.timestamp).toLocaleString()}</p>
                        </div>
                      </div>
                      <button className="px-3 py-1 border border-enterprise-border text-[9px] font-bold text-enterprise-muted rounded hover:text-white uppercase tracking-widest transition-colors">
                        Restore Archive
                      </button>
                    </div>
                    <div className="p-3 bg-enterprise-bg/50 rounded-lg border border-enterprise-border border-dashed">
                       <p className="text-[10px] font-mono text-enterprise-muted line-clamp-2">BLOCK_HASH: {crypto.randomUUID().slice(0, 32).toUpperCase()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 py-4 text-[10px] font-bold uppercase tracking-widest transition-all relative",
        active ? "text-white" : "text-enterprise-muted hover:text-white"
      )}
    >
      {icon}
      {label}
      {active && <div className="absolute bottom-[-1px] left-0 w-full h-[2px] bg-enterprise-accent shadow-[0_0_10px_rgba(99,102,241,0.8)]" />}
    </button>
  );
}

function InfoStat({ label, value }: { label: string, value: string }) {
  return (
    <div className="p-5 bg-enterprise-surface border border-enterprise-border rounded-xl">
      <div className="text-[9px] uppercase font-bold tracking-widest text-enterprise-muted mb-1">{label}</div>
      <div className="text-lg font-bold text-white tracking-tight">{value}</div>
    </div>
  );
}

