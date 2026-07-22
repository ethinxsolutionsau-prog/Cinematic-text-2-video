import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Activity, 
  RefreshCw, 
  Play, 
  Lock, 
  Key, 
  Server,
  Info,
  Sliders,
  Check,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Vulnerability {
  id: string;
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  title: string;
  location: string;
  description: string;
  recommendation: string;
  status: 'open' | 'patching' | 'patched';
}

export default function SecurityDashboard() {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [securityScore, setSecurityScore] = useState<number>(74);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'HIGH' | 'MEDIUM' | 'LOW'>('ALL');
  
  const [logs, setLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [SYSTEM] Security Audit interface initialized. Press "Run Audit Scan" to audit P2P mesh network topology.`,
    `[${new Date().toLocaleTimeString()}] [INFO] Virtual Tunneling layer: Tailscale & WireGuard. Current active nodes: 3.`
  ]);

  const [vulnerabilities, setVulnerabilities] = useState<Vulnerability[]>([
    {
      id: 'vuln-1',
      severity: 'HIGH',
      title: 'Exposed Model API Listener (TCP Port 1234)',
      location: 'Office LLM Rig (Remote)',
      description: 'The local LM Studio listener allows incoming connections from non-interface addresses without tunnel enforcement. This risks direct unauthorized access to your remote 4090 GPUs.',
      recommendation: 'Enforce exclusive binding of port 1234 to the local loopback interface (127.0.0.1) and allow access strictly through the encrypted P2P Tailscale interface (100.x.x.x).',
      status: 'open'
    },
    {
      id: 'vuln-2',
      severity: 'MEDIUM',
      title: 'Overdue Peer VPN Key Rotation',
      location: 'Cloud VM Node (AWS)',
      description: 'The pre-authorized peer authentication key for the remote high-memory AWS Node has exceeded its 90-day expiration epoch, increasing the surface area for compromised keys.',
      recommendation: 'Revoke current persistent node authentication key, issue a new Ephemeral peer key, and enforce a strict 90-day automatic key expiration policies.',
      status: 'open'
    },
    {
      id: 'vuln-3',
      severity: 'LOW',
      title: 'ICMP Echo Probe Response Enabled',
      location: 'All Active Nodes',
      description: 'Active overlay nodes respond to global ICMP Echo request packets, allowing public internet scanners to fingerprint and locate active compute hardware.',
      recommendation: 'Configure host firewalls (ufw on Linux, pf on macOS) to drop incoming ICMP echo/ping requests on public network cards.',
      status: 'open'
    }
  ]);

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll terminal log to bottom
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const handleRunAudit = () => {
    if (isScanning) return;
    
    setIsScanning(true);
    setScanProgress(0);
    setLogs([]);
    
    // Staggered log outputs simulating a real port/handshake audit
    const scanSteps = [
      { prg: 0, msg: '[SYSTEM] Initiating P2P overlay security scan...' },
      { prg: 12, msg: '[INFO] Querying active peer configuration over Tailscale network interface...' },
      { prg: 25, msg: '[OK] Resolved peer Mac Studio (Local Workspace) -> 100.74.12.1. Encryption: AES-256-GCM.' },
      { prg: 38, msg: '[ALERT] Scanning Remote Node Office LLM Rig -> 100.82.204.14. Found exposed port 1234/TCP.' },
      { prg: 55, msg: '[OK] Cryptographic WireGuard overlay handshake validated. Virtual VPN layer is functioning correctly.' },
      { prg: 68, msg: '[WARN] Scanning Cloud VM Node (AWS) -> 100.95.81.33. Ephemeral peer auth key was last rotated 104 days ago.' },
      { prg: 80, msg: '[INFO] Testing ICMP ping responses on public interfaces...' },
      { prg: 90, msg: '[WARN] ICMP echo probe responses active on all devices. Fingerprinting vulnerability confirmed.' },
      { prg: 100, msg: '[SYSTEM] Scan complete. Found 1 HIGH risk, 1 MEDIUM risk, and 1 LOW risk vulnerability. Health rating: 74/100.' }
    ];

    let stepIndex = 0;
    const interval = setInterval(() => {
      setScanProgress(prev => {
        const next = prev + 2;
        
        // Push logs matching the current progress tier
        if (stepIndex < scanSteps.length && next >= scanSteps[stepIndex].prg) {
          addLog(scanSteps[stepIndex].msg);
          stepIndex++;
        }

        if (next >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          return 100;
        }
        return next;
      });
    }, 50);
  };

  const handleMitigate = (id: string) => {
    const vuln = vulnerabilities.find(v => v.id === id);
    if (!vuln || vuln.status !== 'open') return;

    setVulnerabilities(prev => prev.map(v => v.id === id ? { ...v, status: 'patching' } : v));
    
    let actionLog = '';
    let successLog = '';
    let points = 0;

    if (id === 'vuln-1') {
      actionLog = '[SYSTEM] Enforcing secure bind rules... binding port 1234 exclusively to loopback interface 127.0.0.1 on "Office LLM Rig".';
      successLog = '[SUCCESS] Port 1234 successfully bound to 127.0.0.1. Tunnel traffic routed exclusively over authenticated Wireguard network.';
      points = 15;
    } else if (id === 'vuln-2') {
      actionLog = '[SYSTEM] Revoking expired peer auth token on AWS Cloud Node... generating fresh 90-day Ephemeral key pair...';
      successLog = '[SUCCESS] Ephemeral Wireguard keys rotated securely. Key epoch updated to #04. Auto-rotation policy applied.';
      points = 8;
    } else if (id === 'vuln-3') {
      actionLog = '[SYSTEM] Injecting iptables rule to drop ICMP echo-request packets on all interface card chains...';
      successLog = '[SUCCESS] public-facing ping responses disabled. ICMP scan fingerprint protection is now active.';
      points = 3;
    }

    addLog(actionLog);

    setTimeout(() => {
      setVulnerabilities(prev => prev.map(v => v.id === id ? { ...v, status: 'patched' } : v));
      setSecurityScore(prev => Math.min(prev + points, 100));
      addLog(successLog);
    }, 1500);
  };

  const filteredVulns = vulnerabilities.filter(v => {
    if (selectedFilter === 'ALL') return true;
    return v.severity === selectedFilter;
  });

  return (
    <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl relative overflow-hidden" id="security-audit-dashboard">
      <div className="absolute inset-0 bg-radial-gradient(circle_at_top_right,rgba(245,158,11,0.03),transparent_75%) pointer-events-none" />
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-white/5 relative z-10">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] font-mono">
            <Shield className="w-3.5 h-3.5" />
            <span>P2P Overlay Audit Mode</span>
          </div>
          <h3 className="text-lg font-display font-bold text-white flex items-center gap-2">
            Secure Mesh <span className="text-amber-400">Audit Dashboard</span>
          </h3>
          <p className="text-xs text-white/40 font-mono">
            Audit and harden local models, remote GPU nodes, and encrypted VPN mesh tunnels.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Audit Action Button */}
          <button
            type="button"
            disabled={isScanning}
            onClick={handleRunAudit}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all active:scale-95 cursor-pointer shadow-md ${
              isScanning 
                ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' 
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10'
            }`}
          >
            {isScanning ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Auditing {scanProgress}%</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5" />
                <span>Run Mesh Audit Scan</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid: Health Status & Real-time scan logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 relative z-10">
        
        {/* Left Widget: Current Security Score */}
        <div className="lg:col-span-4 bg-black/30 border border-white/5 rounded-xl p-5 flex flex-col justify-between space-y-4">
          <div className="space-y-2 text-center md:text-left">
            <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest block">Mesh Health Index</span>
            <div className="flex items-baseline justify-center md:justify-start gap-1">
              <span className={`text-4xl font-display font-extrabold transition-all duration-500 ${
                securityScore >= 90 ? 'text-emerald-400' : securityScore >= 80 ? 'text-amber-400' : 'text-red-400'
              }`}>
                {securityScore}
              </span>
              <span className="text-white/30 text-sm font-mono">/100</span>
            </div>
            <p className="text-[10px] text-white/50 leading-relaxed font-mono">
              {securityScore === 100 
                ? 'Excellent. All local and remote GPU node interfaces are fully locked down, using loopback-only APIs and rotated cryptographic keys.' 
                : 'Action required. Resolve the highlighted vulnerabilities to close active public port listeners and rotate expiring tunnel keys.'}
            </p>
          </div>

          {/* Visual health bar graph representation */}
          <div className="space-y-2 pt-2">
            <div className="w-full bg-[#111420] rounded-full h-2 overflow-hidden border border-white/5">
              <motion.div 
                className={`h-full rounded-full transition-all duration-500 ${
                  securityScore >= 90 ? 'bg-emerald-400' : securityScore >= 80 ? 'bg-amber-400' : 'bg-red-400'
                }`}
                initial={{ width: '0%' }}
                animate={{ width: `${securityScore}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-[9px] font-mono text-white/30">
              <span>Unsecure (60)</span>
              <span>Fully Hardened (100)</span>
            </div>
          </div>
        </div>

        {/* Right Widget: Simulated Live Scanning Terminal Logs */}
        <div className="lg:col-span-8 flex flex-col h-[180px] lg:h-auto min-h-[160px] bg-black/60 border border-white/5 rounded-xl overflow-hidden font-mono text-[10px] relative">
          {/* Log Window Header */}
          <div className="bg-[#0c0e14] border-b border-white/5 px-4 py-2.5 flex justify-between items-center">
            <span className="text-white/40 flex items-center gap-1.5 font-bold uppercase tracking-wider text-[9px]">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              Scan & Tunnel Handshake Logs
            </span>
            <span className="text-[8px] bg-white/5 text-white/40 px-2 py-0.5 rounded uppercase">
              Mode: Telemetry
            </span>
          </div>

          {/* Logs scrollable panel */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2 scrollbar-none max-h-[140px] text-left">
            {logs.map((log, index) => {
              let logColor = 'text-white/60';
              if (log.includes('[SYSTEM]')) logColor = 'text-amber-400 font-bold';
              else if (log.includes('[ALERT]')) logColor = 'text-red-400 font-bold animate-pulse';
              else if (log.includes('[WARN]')) logColor = 'text-amber-500/90';
              else if (log.includes('[SUCCESS]')) logColor = 'text-emerald-400 font-bold';
              else if (log.includes('[OK]')) logColor = 'text-emerald-500/80';
              
              return (
                <div key={index} className={`leading-relaxed break-all ${logColor}`}>
                  {log}
                </div>
              );
            })}
            <div ref={terminalEndRef} />
          </div>

          {/* Scanning Overlay indicator */}
          {isScanning && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center">
              <div className="text-center space-y-1.5">
                <RefreshCw className="w-6 h-6 text-amber-500 animate-spin mx-auto" />
                <p className="text-[10px] text-amber-400 font-mono tracking-wider animate-pulse">PROBING MESH HANDSHAKES...</p>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Vulnerabilities & Mitigation Controls */}
      <div className="space-y-4 pt-2 relative z-10">
        <div className="flex justify-between items-center pb-2 border-b border-white/5">
          <span className="text-[10px] font-mono text-white/40 uppercase tracking-wider font-bold">Detected Vulnerabilities & Action items</span>
          
          {/* Category Filters */}
          <div className="flex gap-1.5 font-mono text-[9px]">
            {(['ALL', 'HIGH', 'MEDIUM', 'LOW'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedFilter(f)}
                className={`px-2.5 py-1 rounded transition-colors cursor-pointer ${
                  selectedFilter === f 
                    ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' 
                    : 'text-white/40 hover:text-white/60 border border-transparent'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Vulnerabilities listing with motion */}
        <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-none">
          <AnimatePresence initial={false}>
            {filteredVulns.length === 0 ? (
              <div className="p-8 text-center bg-black/20 border border-white/5 rounded-xl space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-mono text-white/50">All scanned vulnerability criteria are clean.</p>
              </div>
            ) : (
              filteredVulns.map(vuln => {
                const isHigh = vuln.severity === 'HIGH';
                const isMedium = vuln.severity === 'MEDIUM';
                const isLow = vuln.severity === 'LOW';

                return (
                  <motion.div
                    key={vuln.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className={`p-4 rounded-xl border transition-all ${
                      vuln.status === 'patched'
                        ? 'bg-emerald-500/[0.02] border-emerald-500/25'
                        : isHigh 
                          ? 'bg-red-500/[0.02] border-red-500/15 hover:border-red-500/25'
                          : isMedium
                            ? 'bg-amber-500/[0.02] border-amber-500/15 hover:border-amber-500/25'
                            : 'bg-white/[0.01] border-white/10 hover:border-white/15'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row justify-between items-start gap-4">
                      <div className="space-y-2 flex-1 text-left">
                        
                        {/* Title and Badge row */}
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded-sm ${
                            vuln.status === 'patched'
                              ? 'bg-emerald-400/10 text-emerald-400 border border-emerald-500/20'
                              : isHigh 
                                ? 'bg-red-500/15 text-red-400 border border-red-500/25 animate-pulse'
                                : isMedium
                                  ? 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                                  : 'bg-white/10 text-white/50 border border-white/5'
                          }`}>
                            {vuln.status === 'patched' ? 'RESOLVED' : vuln.severity}
                          </span>
                          
                          <h4 className={`text-xs font-bold font-mono ${vuln.status === 'patched' ? 'text-white/40 line-through' : 'text-white'}`}>
                            {vuln.title}
                          </h4>

                          <span className="text-[9px] text-white/30 font-mono">
                            • Node: {vuln.location}
                          </span>
                        </div>

                        {/* Description */}
                        <p className={`text-[10px] font-mono leading-relaxed ${vuln.status === 'patched' ? 'text-white/30' : 'text-white/60'}`}>
                          {vuln.description}
                        </p>

                        {/* Recommendation */}
                        {vuln.status !== 'patched' && (
                          <div className="p-2.5 bg-black/40 rounded-lg border border-white/5 space-y-1">
                            <span className="text-[8px] text-amber-400 uppercase font-bold tracking-wider block">Recommended Hardening Step:</span>
                            <p className="text-[9.5px] text-white/70 leading-relaxed font-mono">
                              {vuln.recommendation}
                            </p>
                          </div>
                        )}

                      </div>

                      {/* Hardening CTA */}
                      <div className="shrink-0 pt-1 self-center w-full md:w-auto">
                        {vuln.status === 'patched' ? (
                          <div className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-xl">
                            <Check className="w-3.5 h-3.5" />
                            <span>Node Hardened</span>
                          </div>
                        ) : (
                          <button
                            type="button"
                            disabled={vuln.status === 'patching'}
                            onClick={() => handleMitigate(vuln.id)}
                            className={`w-full md:w-auto px-3.5 py-2 rounded-xl text-[10px] font-mono font-bold flex items-center justify-center gap-1.5 transition-all active:scale-95 cursor-pointer border ${
                              vuln.status === 'patching'
                                ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
                                : isHigh 
                                  ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/25'
                                  : isMedium
                                    ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-amber-500/25'
                                    : 'bg-white/5 hover:bg-white/10 text-white border-white/10'
                            }`}
                          >
                            {vuln.status === 'patching' ? (
                              <>
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                <span>Hardening...</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3" />
                                <span>Auto-Harden Node</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>

                    </div>
                  </motion.div>
                );
              })
            )}
          </AnimatePresence>
        </div>
      </div>
      
      <span className="text-[8px] text-white/20 italic block font-mono text-right">
        * Autogenerated telemetry based on standard OWASP API security benchmarks and P2P VPN node configs.
      </span>
    </div>
  );
}
