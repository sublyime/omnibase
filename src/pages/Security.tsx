import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Shield,
  Filter
} from 'lucide-react';
import { cn } from '../lib/utils';

const ACCESS_LOGS = [
  { user: "Admin (SA)", action: "Login Successful", resource: "DOM-AUTH-INFRA", timestamp: "2024-05-20 14:02:11" },
  { user: "Sarah J.", action: "Write: CAD Engine", resource: "PRJ-MARS-PROP", timestamp: "2024-05-20 13:45:02" },
  { user: "Dev Ops", action: "Rotate KEK", resource: "HSM-CLUSTER-3", timestamp: "2024-05-20 12:30:55" },
  { user: "System", action: "Audit Snapshot", resource: "BKUP-GLOBAL-7", timestamp: "2024-05-20 12:00:00" },
];

export default function Security() {
  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-4xl font-serif font-bold tracking-tight text-white italic">Security <span className="text-enterprise-accent not-italic">& Compliance</span></h1>
        <p className="text-enterprise-muted text-sm uppercase tracking-widest font-bold">Hardened Governance & Cryptographic Integrity</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Authentication Control */}
        <section className="lg:col-span-2 space-y-8">
          <div className="glass-morphism rounded-2xl p-8 border border-enterprise-border">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-3">
              <Lock className="text-enterprise-accent" size={20} />
              Protocol Synchronization
            </h3>
            <div className="space-y-6">
              <SecurityToggle 
                title="Single Sign-On (OIDC/SAML)" 
                desc="Federated identity management via enterprise provider." 
                enabled={true} 
              />
              <SecurityToggle 
                title="FIDO2 / WebAuthn" 
                desc="Hardware-based cryptographic authentication protocols." 
                enabled={true} 
              />
              <SecurityToggle 
                title="Biometric Verification" 
                desc="Secure Enclave fingerprint and facial recognition." 
                enabled={false} 
              />
            </div>
          </div>

          <div className="glass-morphism rounded-2xl p-8 border border-enterprise-border">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-enterprise-accent" size={20} />
              Data Sovereignty & Encryption
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 bg-enterprise-bg/50 border border-enterprise-border rounded-xl group hover:border-enterprise-accent/30 transition-colors">
                <div className="text-[9px] font-bold text-enterprise-muted uppercase tracking-widest mb-2">Resting State</div>
                <div className="text-white font-mono text-sm">AES-256-GCM (FIPS 140-2)</div>
              </div>
              <div className="p-5 bg-enterprise-bg/50 border border-enterprise-border rounded-xl group hover:border-enterprise-accent/30 transition-colors">
                <div className="text-[9px] font-bold text-enterprise-muted uppercase tracking-widest mb-2">Transit Protocol</div>
                <div className="text-white font-mono text-sm">TLS 1.3 (Perfect Forward Secrecy)</div>
              </div>
            </div>
          </div>
        </section>

        {/* Compliance Sidebar */}
        <aside className="space-y-8">
          <div className="glass-morphism rounded-2xl p-8 border border-enterprise-border">
            <h3 className="text-lg font-bold text-white mb-6 tracking-tight">Audit Checklist</h3>
            <div className="space-y-4">
              <ComplianceItem label="FedRAMP High" status="Certified" />
              <ComplianceItem label="SOC2 Type II" status="Compliant" />
              <ComplianceItem label="ISO/IEC 27001" status="Active" />
              <ComplianceItem label="HIPAA BAA" status="Ready" />
            </div>
            <button className="w-full mt-8 py-3 bg-enterprise-input border border-enterprise-border text-white text-[10px] font-bold uppercase tracking-widest rounded-lg hover:bg-enterprise-accent/10 transition-all">
              Export Compliance Bundle
            </button>
          </div>

          <div className="p-6 bg-indigo-600 rounded-2xl shadow-2xl shadow-indigo-500/20 text-white relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-20">
                <Shield size={80} strokeWidth={1} />
             </div>
             <div className="relative z-10">
                <h4 className="font-serif italic text-xl mb-2">Threat Intelligence</h4>
                <p className="text-xs text-indigo-100/80 leading-relaxed mb-6">OmniBase Sentinel is actively monitoring for anomalous ingestion patterns.</p>
                <div className="inline-block px-3 py-1 bg-white/20 rounded text-[10px] font-bold uppercase tracking-widest">System Nominal</div>
             </div>
          </div>
        </aside>
      </div>

      {/* Access Logs */}
      <div className="glass-morphism rounded-2xl border border-enterprise-border overflow-hidden">
        <div className="p-8 border-b border-enterprise-border flex items-center justify-between">
          <h3 className="text-lg font-bold text-white tracking-tight">Unified Audit Stream</h3>
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-3 py-1.5 bg-enterprise-input border border-enterprise-border rounded text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">
                <Filter size={12} />
                Filter Logs
             </div>
             <button className="text-[10px] font-bold text-enterprise-accent uppercase tracking-widest underline underline-offset-4">Download TSV</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-enterprise-surface/50 border-b border-enterprise-border">
                <th className="p-4 text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Principal</th>
                <th className="p-4 text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Operation</th>
                <th className="p-4 text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Protocol</th>
                <th className="p-4 text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Outcome</th>
                <th className="p-4 text-[10px] font-bold text-enterprise-muted uppercase tracking-widest">Temporal Marker</th>
              </tr>
            </thead>
            <tbody>
              {ACCESS_LOGS.map((log, idx) => (
                <tr key={idx} className="border-b border-enterprise-border/50 hover:bg-white/[0.02] transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       <div className="w-6 h-6 rounded-full bg-enterprise-input border border-enterprise-border flex items-center justify-center text-[10px] font-bold text-white">
                          {log.user.charAt(0)}
                       </div>
                       <span className="text-sm font-medium text-white">{log.user}</span>
                    </div>
                  </td>
                  <td className="p-4 text-xs text-enterprise-text font-medium">{log.action}</td>
                  <td className="p-4 text-xs font-mono text-enterprise-muted">{log.resource}</td>
                  <td className="p-4">
                    <span className="status-badge bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]">VERIFIED</span>
                  </td>
                  <td className="p-4 text-[10px] font-mono text-enterprise-muted">{log.timestamp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SecurityToggle({ title, desc, enabled }: { title: string, desc: string, enabled: boolean }) {
  return (
    <div className="flex items-center justify-between group">
      <div className="space-y-1">
        <h4 className="text-sm font-bold text-white group-hover:text-enterprise-accent transition-colors">{title}</h4>
        <p className="text-xs text-enterprise-muted">{desc}</p>
      </div>
      <button className={cn(
        "w-12 h-6 rounded-full transition-all relative",
        enabled ? "bg-indigo-600" : "bg-enterprise-input border border-enterprise-border"
      )}>
        <div className={cn(
          "w-4 h-4 bg-white rounded-full absolute top-1 transition-all shadow-lg",
          enabled ? "right-1" : "left-1"
        )} />
      </button>
    </div>
  );
}

function ComplianceItem({ label, status }: { label: string, status: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-enterprise-bg/30 border border-enterprise-border rounded-lg">
      <span className="text-xs font-bold text-enterprise-text tracking-tight">{label}</span>
      <span className="status-badge bg-enterprise-accent/10 text-enterprise-accent border-enterprise-accent/20 text-[9px]">{status}</span>
    </div>
  );
}

