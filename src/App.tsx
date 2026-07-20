import React, { useState, useEffect, useRef } from 'react';
import { 
  Monitor, 
  Cpu, 
  Layers, 
  Wifi, 
  Settings, 
  Key, 
  Lock, 
  Shield, 
  Plus, 
  RefreshCw, 
  Send, 
  Trash2, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Terminal, 
  ArrowRight, 
  ExternalLink, 
  Activity, 
  Sparkles, 
  Database, 
  LockKeyhole, 
  CircleDot, 
  Smartphone, 
  Laptop, 
  Cloud, 
  Server,
  Cable,
  Check,
  CheckCircle2,
  AlertTriangle,
  Info,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface Device {
  id: string;
  name: string;
  type: 'laptop' | 'rig' | 'cloud' | 'mac';
  specs: string;
  status: 'online' | 'offline' | 'connecting';
  latency: number;
  load: number;
  temp: number;
  loadedModel: string;
  supportedModels: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  latencyMs?: number;
  deviceUsed?: string;
  modelUsed?: string;
}

export default function App() {
  // Onboarding & Mesh Link State
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [meshName, setMeshName] = useState<string>("Personal AI Grid");
  const [isConnectingMesh, setIsConnectingMesh] = useState<boolean>(false);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [customKey, setCustomKey] = useState<string>("");
  const [keyError, setKeyError] = useState<string>("");

  // Devices State
  const [devices, setDevices] = useState<Device[]>([
    {
      id: 'dev-1',
      name: 'Mac Studio (Local Workspace)',
      type: 'mac',
      specs: 'Apple M3 Max (64GB Unified Memory)',
      status: 'online',
      latency: 5,
      load: 12,
      temp: 39,
      loadedModel: 'Llama 3.1 8B (GGUF Q4_K_M)',
      supportedModels: ['Llama 3.1 8B (GGUF Q4_K_M)', 'Mistral Nemo 12B (Q8_0)', 'Phi-3 Mini (Q4)']
    },
    {
      id: 'dev-2',
      name: 'Office LLM Rig (Remote)',
      type: 'rig',
      specs: '2x NVIDIA RTX 4090 (48GB VRAM)',
      status: 'online',
      latency: 18,
      load: 0,
      temp: 42,
      loadedModel: 'Mistral Nemo 12B (Q8_0)',
      supportedModels: ['Mistral Nemo 12B (Q8_0)', 'Gemma 2 9B (GGUF Q4)', 'Llama 3.1 8B (GGUF Q4_K_M)']
    },
    {
      id: 'dev-3',
      name: 'Cloud VM Node (AWS)',
      type: 'cloud',
      specs: 'NVIDIA H100 PCIe (80GB SXM5)',
      status: 'online',
      latency: 42,
      load: 0,
      temp: 34,
      loadedModel: 'Gemma 2 9B (GGUF Q4)',
      supportedModels: ['Gemma 2 9B (GGUF Q4)', 'Mistral Nemo 12B (Q8_0)', 'Llama 3.1 8B (GGUF Q4_K_M)']
    }
  ]);

  // Model Selection State
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-2');
  const [activeModel, setActiveModel] = useState<string>('Mistral Nemo 12B (Q8_0)');
  const [isSwappingModel, setIsSwappingModel] = useState<boolean>(false);
  const [swapProgress, setSwapProgress] = useState<number>(0);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Message[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      content: 'Hello! I am running on your Office LLM Rig. I can process your prompts remotely over your secure end-to-end encrypted Tailscale link. What can I help you build or code today?',
      timestamp: new Date(Date.now() - 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deviceUsed: 'Office LLM Rig (Remote)',
      modelUsed: 'Mistral Nemo 12B (Q8_0)',
      latencyMs: 18
    }
  ]);
  const [inputMessage, setInputMessage] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [dataPacketPulse, setDataPacketPulse] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");

  // Add Device Modal/Form state
  const [showAddDevice, setShowAddDevice] = useState<boolean>(false);
  const [newDeviceName, setNewDeviceName] = useState<string>("");
  const [newDeviceType, setNewDeviceType] = useState<'laptop' | 'rig' | 'cloud' | 'mac'>('laptop');
  const [newDeviceSpecs, setNewDeviceSpecs] = useState<string>("");
  const [isLinkingNewDevice, setIsLinkingNewDevice] = useState<boolean>(false);

  // FAQ Accordion State
  const [expandedFaq, setExpandedFaq] = useState<Record<string, boolean>>({
    'faq-1': true // First one open by default
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isGenerating]);

  // Tailscale tunnel setup log simulation
  const handleCreateMesh = () => {
    setIsConnectingMesh(true);
    setKeyError("");
    setMeshLogs([]);

    const logMessages = [
      "🔑 Initializing WireGuard credentials...",
      "🔒 Generating localized end-to-end encryption keys...",
      "📡 Contacting Tailscale mesh coordination server...",
      "🔗 Joining virtual overlay network interface 'utun4'...",
      "🛡️ Creating secure encrypted peer-to-peer route map...",
      "✅ Ephemeral private AI network established successfully!"
    ];

    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logMessages.length) {
        setMeshLogs(prev => [...prev, logMessages[currentLogIndex]]);
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setIsLinked(true);
          setIsConnectingMesh(false);
        }, 800);
      }
    }, 450);
  };

  // Model swap helper
  const handleModelSwap = (modelName: string) => {
    if (modelName === activeModel) return;
    setIsSwappingModel(true);
    setSwapProgress(0);
    
    // update current device state to 'connecting' load
    setDevices(prev => prev.map(d => {
      if (d.id === selectedDeviceId) {
        return { ...d, status: 'connecting', loadedModel: 'Loading...' };
      }
      return d;
    }));

    const interval = setInterval(() => {
      setSwapProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsSwappingModel(false);
          setActiveModel(modelName);
          
          // update device in state
          setDevices(devices => devices.map(d => {
            if (d.id === selectedDeviceId) {
              return { ...d, status: 'online', loadedModel: modelName };
            }
            return d;
          }));

          return 100;
        }
        return prev + 10;
      });
    }, 150);
  };

  // Remote chat submission
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || isGenerating) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: inputMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setChatMessages(prev => [...prev, userMsg]);
    setInputMessage("");
    setIsGenerating(true);
    setErrorMessage("");

    // Trigger visual packet flow animation
    setDataPacketPulse(true);
    setTimeout(() => setDataPacketPulse(false), 2000);

    // Find selected device details
    const activeDevice = devices.find(d => d.id === selectedDeviceId) || devices[0];

    // Simulate device loading metrics
    setDevices(prev => prev.map(d => {
      if (d.id === selectedDeviceId) {
        return { ...d, load: Math.floor(Math.random() * 20) + 75, temp: d.temp + 4 };
      }
      return d;
    }));

    try {
      // Prepare previous messages for context
      const apiMessages = chatMessages.concat(userMsg).map(m => ({
        role: m.role,
        content: m.content
      }));

      const res = await fetch('/api/lm-link/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          deviceName: activeDevice.name,
          modelName: activeModel
        })
      });

      if (!res.ok) {
        throw new Error('Mesh node did not respond in time.');
      }

      const data = await res.json();

      // update current device stats back to normal load
      setDevices(prev => prev.map(d => {
        if (d.id === selectedDeviceId) {
          return { ...d, load: Math.floor(Math.random() * 5) + 3, temp: Math.max(d.temp - 2, 40) };
        }
        return d;
      }));

      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}-res`,
        role: 'assistant',
        content: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deviceUsed: activeDevice.name,
        modelUsed: activeModel,
        latencyMs: activeDevice.latency + Math.floor(Math.random() * 12)
      }]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to establish Tunnel connection with the remote host. Please verify your Tailscale node configuration.");
      
      // reset load
      setDevices(prev => prev.map(d => {
        if (d.id === selectedDeviceId) {
          return { ...d, load: 2, temp: Math.max(d.temp - 4, 38) };
        }
        return d;
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  // Add custom device simulator
  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeviceName.trim()) return;

    setIsLinkingNewDevice(true);

    setTimeout(() => {
      const generatedId = `dev-${Date.now()}`;
      const defaultModels = newDeviceType === 'mac' 
        ? ['Mistral Nemo 12B (Q8_0)', 'Llama 3.1 8B (GGUF Q4_K_M)']
        : newDeviceType === 'rig'
        ? ['DeepSeek V3 671B (ExL2)', 'Mistral Nemo 12B (Q8_0)', 'Gemma 2 9B (GGUF Q4)']
        : ['Phi-3 Mini (Q4)', 'Llama 3.1 8B (GGUF Q4_K_M)'];

      const newDevice: Device = {
        id: generatedId,
        name: newDeviceName,
        type: newDeviceType,
        specs: newDeviceSpecs || (
          newDeviceType === 'mac' ? 'Apple M3 Pro (36GB Unified)' : 
          newDeviceType === 'rig' ? '1x RTX 4080 Super (16GB VRAM)' : 
          newDeviceType === 'cloud' ? 'A10G GPU Node (24GB VRAM)' : 'Local CPU Only Node (16GB RAM)'
        ),
        status: 'online',
        latency: newDeviceType === 'cloud' ? 38 : newDeviceType === 'rig' ? 15 : 8,
        load: 0,
        temp: 35,
        loadedModel: defaultModels[0],
        supportedModels: defaultModels
      };

      setDevices(prev => [...prev, newDevice]);
      setSelectedDeviceId(generatedId);
      setActiveModel(defaultModels[0]);
      setIsLinkingNewDevice(false);
      setShowAddDevice(false);
      setNewDeviceName("");
      setNewDeviceSpecs("");
    }, 1500);
  };

  // Delete/Unlink device
  const handleUnlinkDevice = (deviceId: string) => {
    if (devices.length <= 1) {
      alert("At least one local or remote mesh device is required to use LM Link.");
      return;
    }
    setDevices(prev => prev.filter(d => d.id !== deviceId));
    if (selectedDeviceId === deviceId) {
      const remaining = devices.filter(d => d.id !== deviceId);
      setSelectedDeviceId(remaining[0].id);
      setActiveModel(remaining[0].loadedModel);
    }
  };

  const toggleFaq = (faqId: string) => {
    setExpandedFaq(prev => ({
      ...prev,
      [faqId]: !prev[faqId]
    }));
  };

  // Determine icon type
  const getDeviceIcon = (type: Device['type']) => {
    switch (type) {
      case 'laptop': return <Laptop className="w-4 h-4" />;
      case 'mac': return <Monitor className="w-4 h-4" />;
      case 'cloud': return <Cloud className="w-4 h-4" />;
      case 'rig': return <Server className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-white font-sans antialiased relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      {/* Absolute abstract grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161a23_1px,transparent_1px),linear-gradient(to_bottom,#161a23_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Radiant glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header id="header-section" className="border-b border-white/5 bg-[#090b0f]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-[1px] shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#090b0f] rounded-[11px] flex items-center justify-center">
              <Cpu className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            {/* Glowing particle ring */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-tight text-white text-base">LM Studio</span>
              <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-amber-500/25 tracking-widest">Link</span>
            </div>
            <p className="text-[10px] text-white/40 font-mono">End-to-End Encrypted AI Network</p>
          </div>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a href="#how-it-works" className="text-xs text-white/60 hover:text-white transition-colors">How it works</a>
          <a href="#tailscale-integration" className="text-xs text-white/60 hover:text-white transition-colors">Security</a>
          <a href="#faq" className="text-xs text-white/60 hover:text-white transition-colors">Q&A</a>
          {isLinked && (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-mono">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              {devices.length} Nodes Active
            </div>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <a 
            href="#faq"
            className="hidden sm:inline-flex items-center gap-1 text-[11px] text-white/50 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg bg-white/5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Need help?
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative space-y-16">
        
        {/* Welcome Hero Grid */}
        <section id="hero-section" className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-4">
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs font-mono">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Available in preview</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-display font-extrabold tracking-tight text-white leading-[1.1]">
              Use your local models, <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300">
                remotely.
              </span>
            </h1>

            <p className="text-sm md:text-base text-white/70 max-w-2xl leading-relaxed">
              Introducing <span className="text-white font-bold">LM Link</span>. Load models on remote machines and use them as if they are local. End-to-end encrypted. Works beautifully for local devices, dedicated GPU rigs, or cloud VMs.
            </p>

            <div className="flex items-center gap-3 text-xs bg-[#0f121a] border border-white/5 p-3.5 rounded-xl max-w-xl">
              <Info className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-white/60 leading-normal">
                LM Link is in <span className="text-amber-400 font-semibold">Preview</span>. We are rolling out private access in batches. Start your simulation below to explore!
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-4">
              {!isLinked ? (
                <button
                  type="button"
                  onClick={handleCreateMesh}
                  disabled={isConnectingMesh}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95 transition-all disabled:opacity-50 cursor-pointer font-display"
                >
                  {isConnectingMesh ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Connecting Mesh Link...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4" />
                      Create your Link
                    </>
                  )}
                </button>
              ) : (
                <a
                  href="#dashboard-section"
                  className="px-6 py-3 rounded-xl bg-[#141824] hover:bg-[#1c2233] border border-white/10 text-white font-semibold text-xs flex items-center gap-2 active:scale-95 transition-all cursor-pointer font-display"
                >
                  <Activity className="w-4 h-4 text-amber-500" />
                  Open Live Mesh Dashboard
                </a>
              )}
              
              <a
                href="#how-it-works"
                className="px-5 py-3 rounded-xl hover:bg-white/5 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                Learn how it works
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Connected Illustration Banner / Static Box */}
          <div className="lg:col-span-5 relative flex items-center justify-center">
            <div className="w-full aspect-[4/3] rounded-2xl bg-gradient-to-b from-[#111420] to-[#0a0d14] border border-white/10 p-6 flex flex-col justify-between relative shadow-2xl overflow-hidden group">
              <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(245,158,11,0.03),transparent_70%) pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Network Topology Map</span>
                <span className="flex items-center gap-1 text-[9px] text-amber-500 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/15">
                  <Shield className="w-3 h-3" /> E2E SECURE
                </span>
              </div>

              {/* Central connecting node graphic */}
              <div className="flex-1 flex items-center justify-center relative py-6">
                
                {/* Simulated WireGuard connections */}
                <div className="absolute w-[80%] h-0.5 bg-dashed border-t border-dashed border-white/10 flex justify-between items-center">
                  <div className={`w-3 h-3 rounded-full bg-amber-500 ${isLinked ? 'animate-ping' : ''}`} />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30" />
                </div>

                <div className="grid grid-cols-3 gap-6 w-full max-w-sm relative z-10">
                  {/* Left node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:border-amber-500/30 transition-colors">
                      <Laptop className="w-5 h-5 text-white/80" />
                    </div>
                    <span className="text-[9px] font-mono text-white/50 text-center">Local Client</span>
                  </div>

                  {/* Center Node (Tailscale) */}
                  <div className="flex flex-col items-center gap-1 -translate-y-2">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${isLinked ? 'bg-amber-500/20 border-amber-500 shadow-lg shadow-amber-500/10 border-2' : 'bg-white/5 border border-white/10'}`}>
                      <Lock className={`w-6 h-6 ${isLinked ? 'text-amber-500' : 'text-white/40'}`} />
                    </div>
                    <span className="text-[9px] font-mono font-bold text-amber-500 text-center">Tailscale VPN</span>
                  </div>

                  {/* Right Node */}
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/70 group-hover:border-amber-500/30 transition-colors">
                      <Server className="w-5 h-5 text-white/80" />
                    </div>
                    <span className="text-[9px] font-mono text-white/50 text-center">Remote AI Rig</span>
                  </div>
                </div>

                {/* Animated beam pulse */}
                {isLinked && (
                  <motion.div 
                    animate={{ x: [-150, 150] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "linear" }}
                    className="absolute w-12 h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent z-0" 
                  />
                )}
              </div>

              <div className="border-t border-white/5 pt-3 flex justify-between items-center text-[10px] text-white/40 font-mono">
                <span>Coordination: WireGuard Mesh</span>
                <span className="text-white/60">Connected: {isLinked ? "YES" : "NO"}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Setup wizard console panel (conditional rendering to drive the interactive feel) */}
        <AnimatePresence>
          {isConnectingMesh && (
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full max-w-3xl mx-auto bg-[#0c0e14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl p-6 space-y-4 font-mono"
            >
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="text-[11px] text-amber-500 uppercase tracking-widest font-bold flex items-center gap-1.5">
                  <Terminal className="w-4 h-4 text-amber-500" />
                  Mesh Link Provisioning Controller
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                  <span className="text-[10px] text-white/40">Active link flow</span>
                </span>
              </div>

              <div className="space-y-2 text-xs text-white/80 max-h-52 overflow-y-auto min-h-36 py-2">
                <p className="text-white/40">Initialize LM Link Handshake Tunnel...</p>
                {meshLogs.map((log, index) => (
                  <p key={index} className="flex items-center gap-2 text-white/90">
                    <span className="text-amber-500">▶</span> {log}
                  </p>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-white/30">
                <span>Tunnel type: Overlay virtual hub</span>
                <span>Security protocol: Noise Protocol Framework (E2E)</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>


        {/* INTERACTIVE WORKSPACE (DASHBOARD & PLAYGROUND) */}
        <section id="dashboard-section" className="space-y-8 scroll-mt-20">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-white/5 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-display font-extrabold text-white">LM Link Private Workspace</h2>
                <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono border border-amber-500/15 uppercase font-bold tracking-widest">Interactive Simulator</span>
              </div>
              <p className="text-sm text-white/50">Manage remote nodes, load GGUF models, and test end-to-end encrypted inference streams.</p>
            </div>

            {/* Quick action triggers */}
            {!isLinked && (
              <button
                type="button"
                onClick={handleCreateMesh}
                className="px-4 py-2 bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/20 text-amber-400 hover:text-white rounded-xl text-xs font-bold font-display cursor-pointer transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Quick Connect Simulator Link
              </button>
            )}
          </div>

          {!isLinked ? (
            /* Locked Dashboard Overlay screen */
            <div className="w-full border border-white/10 rounded-2xl bg-gradient-to-b from-[#0f121a] to-[#080a0f] p-12 text-center flex flex-col items-center justify-center min-h-[400px] space-y-6 relative overflow-hidden shadow-xl">
              <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(245,158,11,0.02),transparent_70%)" />
              
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center relative">
                <LockKeyhole className="w-8 h-8 text-white/30" />
                <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-500 border-2 border-slate-950" />
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="text-xl font-display font-bold text-white">Create your Link to activate</h3>
                <p className="text-xs text-white/50">
                  Secure peer-to-peer connection is required. Link your machines under a custom virtual overlay network to load and run models remotely.
                </p>
              </div>

              <div className="w-full max-w-sm space-y-3 font-mono">
                <div className="space-y-1.5 text-left">
                  <label className="text-[10px] text-white/40 uppercase tracking-widest">Mesh Network Name</label>
                  <input 
                    type="text" 
                    value={meshName} 
                    onChange={(e) => setMeshName(e.target.value)}
                    placeholder="Enter mesh name..." 
                    className="w-full bg-[#0a0c12] border border-white/10 focus:border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors"
                  />
                </div>

                <div className="space-y-1.5 text-left">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-white/40 uppercase tracking-widest">Tailscale Mesh Key (Optional)</label>
                    <span className="text-[9px] text-white/30 italic">Autogenerated if empty</span>
                  </div>
                  <input 
                    type="password" 
                    value={customKey} 
                    onChange={(e) => setCustomKey(e.target.value)}
                    placeholder="tskey-auth-..." 
                    className="w-full bg-[#0a0c12] border border-white/10 focus:border-amber-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none transition-colors font-mono"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCreateMesh}
                  disabled={isConnectingMesh}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs flex items-center justify-center gap-2 active:scale-95 transition-all shadow-lg cursor-pointer"
                >
                  <Cable className="w-4 h-4 text-white/80" />
                  Provision Mesh & Generate Node Key
                </button>
              </div>
            </div>
          ) : (
            /* Active Dashboard Interface */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              
              {/* LEFT COLUMN: Node Monitors */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* Mesh Status info card */}
                <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4 flex flex-col justify-between space-y-4">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
                      <span className="text-[10px] uppercase font-mono tracking-widest font-bold text-white">Active Link Network</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsLinked(false)}
                      className="text-[9px] font-mono text-red-400 hover:text-red-300 transition-colors"
                      title="Disconnect Private Mesh"
                    >
                      Disconnect Mesh
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-[9px] text-white/40 uppercase font-mono">Mesh Domain Name</p>
                      <p className="text-xs font-mono font-bold text-white">{meshName.toLowerCase().replace(/\s+/g, '-')}.lm-link.net</p>
                    </div>
                    <div>
                      <p className="text-[9px] text-white/40 uppercase font-mono">Tunnel Coordination</p>
                      <p className="text-xs font-mono font-bold text-amber-500 flex items-center gap-1">
                        <Lock className="w-3 h-3 text-amber-500" /> Peer-to-Peer (P2P)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Linked Nodes List */}
                <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-xs font-mono uppercase tracking-widest font-bold text-white/80 flex items-center gap-1.5">
                      <Monitor className="w-4 h-4 text-amber-500" />
                      Linked Hardware Nodes ({devices.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddDevice(true)}
                      className="text-[10px] text-amber-500 hover:text-amber-400 font-bold font-mono flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Link Node
                    </button>
                  </div>

                  {/* Add node mini form */}
                  {showAddDevice && (
                    <motion.form 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      onSubmit={handleAddDevice}
                      className="bg-black/30 border border-white/10 p-4 rounded-xl space-y-3 font-mono text-xs"
                    >
                      <div className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span className="text-[10px] text-amber-500 font-bold">Configure Virtual Machine Node</span>
                        <button type="button" onClick={() => setShowAddDevice(false)} className="text-[9px] text-white/40 hover:text-white">Cancel</button>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[8px] text-white/40 uppercase">Node Human Name</label>
                        <input 
                          type="text" 
                          required
                          value={newDeviceName}
                          onChange={(e) => setNewDeviceName(e.target.value)}
                          placeholder="e.g. My RTX 4080 Rig, Home Mac Mini" 
                          className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none text-white focus:border-amber-500/30"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-1">
                          <label className="text-[8px] text-white/40 uppercase">Node Chassis Type</label>
                          <select 
                            value={newDeviceType}
                            onChange={(e) => setNewDeviceType(e.target.value as any)}
                            className="w-full bg-slate-900 border border-white/10 rounded-lg p-1.5 text-xs text-white outline-none focus:border-amber-500/30"
                          >
                            <option value="rig">GPU AI Rig</option>
                            <option value="mac">Mac Unified Memory</option>
                            <option value="cloud">Cloud Server VM</option>
                            <option value="laptop">Portable Laptop</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[8px] text-white/40 uppercase">GPU / Hardware Specs</label>
                          <input 
                            type="text" 
                            value={newDeviceSpecs}
                            onChange={(e) => setNewDeviceSpecs(e.target.value)}
                            placeholder="e.g. RTX 4080 (16GB), M3 Pro" 
                            className="w-full bg-slate-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs outline-none text-white focus:border-amber-500/30"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isLinkingNewDevice}
                        className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5 disabled:opacity-50 cursor-pointer"
                      >
                        {isLinkingNewDevice ? (
                          <>
                            <RefreshCw className="w-3 h-3 animate-spin" /> Pairing Tailscale Keys...
                          </>
                        ) : (
                          "Establish P2P Tunnel Link"
                        )}
                      </button>
                    </motion.form>
                  )}

                  {/* Device list cards */}
                  <div className="space-y-3">
                    {devices.map((device) => {
                      const isSelected = selectedDeviceId === device.id;
                      return (
                        <div
                          key={device.id}
                          onClick={() => {
                            setSelectedDeviceId(device.id);
                            setActiveModel(device.loadedModel);
                          }}
                          className={`border rounded-xl p-3.5 transition-all cursor-pointer relative group ${
                            isSelected 
                              ? 'bg-amber-500/[0.02] border-amber-500 shadow-md shadow-amber-500/5' 
                              : 'bg-black/30 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {/* Selected marker accent */}
                          {isSelected && (
                            <span className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500 rounded-l-xl" />
                          )}

                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg border ${isSelected ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                {getDeviceIcon(device.type)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">{device.name}</h4>
                                <span className="text-[10px] text-white/40 font-mono block">{device.specs}</span>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlinkDevice(device.id);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/5 text-white/30 hover:text-red-400 transition-all cursor-pointer"
                              title="Unlink remote node"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Node Health Metrics */}
                          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-[9px] font-mono text-white/40">
                            <div>
                              <span>Latency</span>
                              <span className={`block font-bold mt-0.5 ${device.latency < 10 ? 'text-green-400' : device.latency < 25 ? 'text-amber-400' : 'text-purple-400'}`}>
                                {device.latency}ms
                              </span>
                            </div>
                            <div>
                              <span>GPU load</span>
                              <span className="block font-bold mt-0.5 text-white">
                                {device.load}%
                              </span>
                            </div>
                            <div>
                              <span>Temp</span>
                              <span className="block font-bold mt-0.5 text-white">
                                {device.temp}°C
                              </span>
                            </div>
                            <div>
                              <span>Tunnel Link</span>
                              <span className="block text-green-400 font-bold mt-0.5">
                                SECURE
                              </span>
                            </div>
                          </div>

                          {/* Loaded Model block */}
                          <div className="mt-3 bg-black/40 border border-white/5 rounded-lg p-2 flex justify-between items-center text-[10px] font-mono">
                            <span className="text-white/40">Loaded:</span>
                            <span className="text-amber-500 font-bold truncate max-w-[200px]" title={device.loadedModel}>
                              {device.loadedModel}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Collaboration with Tailscale card banner */}
                <div id="tailscale-integration" className="bg-gradient-to-br from-[#120f26] to-[#0a0815] border border-indigo-500/10 rounded-2xl p-5 space-y-3 relative overflow-hidden shadow-lg shadow-indigo-950/10">
                  <div className="absolute top-0 right-0 p-3 opacity-15">
                    <Shield className="w-16 h-16 text-indigo-400" />
                  </div>

                  <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2 py-0.5 rounded-full inline-block">
                    Official Collaboration
                  </span>

                  <h3 className="text-sm font-display font-bold text-white">Launching in partnership with Tailscale</h3>
                  <p className="text-xs text-white/60 leading-normal">
                    LM Link is leveraging state-of-the-art Tailscale mesh VPN technology for secure, direct, peer-to-peer end-to-end encrypted connections. Your AI models and chat messages are never exposed to the public internet, nor routed through our servers.
                  </p>

                  <div className="flex items-center gap-1 text-[10px] font-mono text-indigo-400 font-bold pt-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Industry-trusted WireGuard security</span>
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: Active Model Loader & Decrypted Chat Playground */}
              <div className="lg:col-span-7 space-y-6">
                
                {/* Active Model Switcher Panel */}
                <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-5 space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">Target Node & Loaded Model</span>
                      <h3 className="text-sm font-bold text-white">
                        {devices.find(d => d.id === selectedDeviceId)?.name || 'Default Node'}
                      </h3>
                    </div>
                    <span className="flex items-center gap-1 text-[9px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> P2P ONLINE
                    </span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">Select remote GGUF model to load into VRAM:</label>
                    <div className="flex flex-wrap gap-2">
                      {devices.find(d => d.id === selectedDeviceId)?.supportedModels.map((model) => {
                        const isLoaded = activeModel === model;
                        return (
                          <button
                            key={model}
                            type="button"
                            onClick={() => handleModelSwap(model)}
                            disabled={isSwappingModel}
                            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border cursor-pointer ${
                              isLoaded 
                                ? 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/5' 
                                : 'bg-black/30 border-white/5 text-white/50 hover:border-white/10 hover:text-white'
                            }`}
                          >
                            {model}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Loading progress bar */}
                  {isSwappingModel && (
                    <div className="space-y-1.5 font-mono">
                      <div className="flex justify-between items-center text-[10px] text-white/40">
                        <span className="flex items-center gap-1.5 text-amber-500 font-semibold animate-pulse">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Instantiating model weights in remote GPU memory...
                        </span>
                        <span>{swapProgress}%</span>
                      </div>
                      <div className="w-full bg-[#161a23] rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          className="bg-amber-500 h-full rounded-full"
                          initial={{ width: '0%' }}
                          animate={{ width: `${swapProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* THE CHAT PLAYGROUND */}
                <div className="bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl relative">
                  
                  {/* Chat Panel Header */}
                  <div className="border-b border-white/5 px-5 py-4 bg-[#0a0c12] flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Terminal className="w-4 h-4 text-amber-500" />
                        <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">Private Link Decrypted Session</h4>
                        <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                          <Lock className="w-3 h-3 text-amber-500 inline" /> Direct peer-to-peer connection is encrypted end-to-end
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setChatMessages([])}
                      className="text-[9px] font-mono text-white/30 hover:text-white flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded"
                      title="Clear session history"
                    >
                      <Trash2 className="w-3 h-3" /> Clear Console
                    </button>
                  </div>

                  {/* Packet flow routing animation banner */}
                  <div className="bg-black/40 border-b border-white/5 px-5 py-1.5 text-[9px] font-mono text-white/30 flex justify-between items-center relative overflow-hidden">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      Client: Localhost
                    </span>
                    
                    {/* Tunnel line graphic */}
                    <div className="flex-1 mx-4 h-[1px] relative flex items-center bg-white/5">
                      <span className={`h-1 bg-amber-500 absolute rounded-full transition-all duration-1000 ${dataPacketPulse ? 'w-full animate-pulse' : 'w-0'}`} />
                    </div>

                    <span className="flex items-center gap-1 text-amber-500/80">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Remote: {devices.find(d => d.id === selectedDeviceId)?.name.split(' ')[0] || 'Node'}
                    </span>
                  </div>

                  {/* Chat Messages Log */}
                  <div className="flex-1 overflow-y-auto p-5 space-y-4">
                    {chatMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <Terminal className="w-10 h-10 text-white/10" />
                        <div className="space-y-1">
                          <p className="text-xs font-mono text-white/40">Secure P2P Console established.</p>
                          <p className="text-[11px] text-white/30">Your chats are processed strictly locally. Heavy parameters are computed on your linked hardware.</p>
                        </div>
                      </div>
                    ) : (
                      chatMessages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex flex-col space-y-1.5 ${
                            msg.role === 'user' ? 'items-end' : 'items-start'
                          }`}
                        >
                          {/* Message Metadata line */}
                          <div className="flex items-center gap-2 text-[9px] font-mono text-white/30 px-1">
                            <span>{msg.timestamp}</span>
                            {msg.role === 'assistant' && (
                              <>
                                <span>•</span>
                                <span className="text-amber-500 font-semibold">{msg.modelUsed}</span>
                                <span>•</span>
                                <span className="text-white/40 uppercase">{msg.deviceUsed?.split(' ')[0]}</span>
                              </>
                            )}
                          </div>

                          {/* Message bubble */}
                          <div
                            className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                              msg.role === 'user'
                                ? 'bg-amber-600/10 border border-amber-500/20 text-white'
                                : 'bg-white/[0.03] border border-white/5 text-white/90'
                            }`}
                          >
                            {msg.content}
                          </div>

                          {/* Connection Latency indicator */}
                          {msg.role === 'assistant' && msg.latencyMs && (
                            <span className="text-[8px] font-mono text-amber-500/60 px-1">
                              ⚡ Connection roundtrip: {msg.latencyMs}ms • End-to-end Encrypted Tunnel
                            </span>
                          )}
                        </div>
                      ))
                    )}

                    {/* Pending state */}
                    {isGenerating && (
                      <div className="flex flex-col space-y-1.5 items-start">
                        <div className="flex items-center gap-2 text-[9px] font-mono text-amber-500/60">
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          <span>Routing packets via Tailscale private mesh...</span>
                        </div>
                        <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs text-white/50 italic flex items-center gap-2">
                          <span className="flex gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce" style={{ animationDelay: '300ms' }} />
                          </span>
                          Remote inference executing...
                        </div>
                      </div>
                    )}
                    
                    <div ref={chatEndRef} />
                  </div>

                  {/* Error alerts inside chat box */}
                  {errorMessage && (
                    <div className="mx-5 mb-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 text-xs text-red-400">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                        <p className="font-semibold">Private Link Timeout Error</p>
                        <p className="text-[11px] text-red-400/80">{errorMessage}</p>
                      </div>
                    </div>
                  )}

                  {/* Message submission form */}
                  <form onSubmit={handleSendMessage} className="p-4 bg-[#0a0c12] border-t border-white/5 flex gap-2.5">
                    <input
                      type="text"
                      required
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      disabled={isGenerating || isSwappingModel}
                      placeholder={
                        isSwappingModel 
                          ? "Please wait for model load to complete..." 
                          : `Type a prompt to send securely to remote ${activeModel.split(' ')[0]}...`
                      }
                      className="flex-1 bg-[#090a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-amber-500/40 outline-none placeholder:text-white/20 font-mono disabled:opacity-40"
                    />
                    <button
                      type="submit"
                      disabled={!inputMessage.trim() || isGenerating || isSwappingModel}
                      className="p-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}
        </section>


        {/* VISUAL ILLUSTRATION: "How it works" */}
        <section id="how-it-works" className="border-t border-white/5 pt-16 space-y-12 scroll-mt-20">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/15">
              Secure AI Topology
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">Your LM Studio models, available anywhere you are.</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Link your machines securely under a virtual private mesh, and load remote models instantly as if they were running locally on your laptop or workstation.
            </p>
          </div>

          {/* Interactive Lmmy Paper Cup Phone Graphic */}
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center space-y-8 relative overflow-hidden shadow-xl">
            <div className="absolute inset-0 bg-radial-gradient(ellipse_at_center,rgba(245,158,11,0.015),transparent_70%) pointer-events-none" />
            
            <span className="text-[9px] font-mono uppercase tracking-wider text-white/30 uppercase text-center block">
              Illustration: Two lmmys talking through a private cup phone (End-to-End Encrypted AI link)
            </span>

            {/* Custom SVG/CSS illustration of the two adorable AI lmmys connected by a cup phone */}
            <div className="flex flex-col md:flex-row items-center justify-between w-full max-w-3xl gap-8 relative py-6">
              
              {/* Lmmy Node A: Local Client */}
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="relative">
                  {/* Visual Lmmy character container */}
                  <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-white/10 flex flex-col items-center justify-center p-3 relative group hover:border-amber-500/40 transition-colors shadow-lg">
                    {/* Character ears */}
                    <div className="absolute -top-1.5 -left-1 w-5 h-5 rounded-full bg-slate-800 border-t-2 border-l-2 border-white/10" />
                    <div className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-800 border-t-2 border-r-2 border-white/10" />
                    
                    {/* Character face */}
                    <div className="flex gap-4 mt-2">
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                    </div>
                    {/* Rosy cheeks */}
                    <div className="flex gap-6 mt-1.5">
                      <div className="w-1.5 h-1 rounded-full bg-pink-500/40" />
                      <div className="w-1.5 h-1 rounded-full bg-pink-500/40" />
                    </div>
                    {/* Cute mouth */}
                    <div className="w-1.5 h-1.5 border-b-2 border-white/60 rounded-full mt-1" />

                    {/* Paper Cup in hand */}
                    <div className="absolute -bottom-2 bg-amber-500/20 border border-amber-500/40 text-amber-400 rounded-lg px-2 py-0.5 text-[8px] font-mono font-bold">
                      Local Client
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Client Laptop</span>
                  <span className="text-[10px] text-white/40 font-mono block">Zero heavy parameters</span>
                </div>
              </div>

              {/* Secure encrypted telephone wire */}
              <div className="flex-1 w-full md:w-auto h-12 md:h-px flex items-center justify-center relative min-h-[40px]">
                
                {/* SVG glowing wavy telephone cord representing Tailscale encryption tunnel */}
                <svg className="absolute w-full h-12 overflow-visible" fill="none">
                  <path 
                    d="M 0 24 C 50 10, 150 10, 200 24 C 250 38, 350 38, 400 24" 
                    stroke="#f59e0b" 
                    strokeWidth="2" 
                    strokeDasharray="4,4"
                    className="animate-pulse"
                  />
                  {/* Flying data packets */}
                  <circle r="4" fill="#f59e0b" className="animate-pulse">
                    <animateMotion dur="3s" repeatCount="indefinite" path="M 0 24 C 50 10, 150 10, 200 24 C 250 38, 350 38, 400 24" />
                  </circle>
                  <circle r="4" fill="#a855f7" className="animate-pulse">
                    <animateMotion dur="3.5s" repeatCount="indefinite" path="M 400 24 C 350 38, 250 38, 200 24 C 150 10, 50 10, 0 24" />
                  </circle>
                </svg>

                <div className="absolute -translate-y-4 bg-slate-950 border border-white/10 px-2.5 py-1 rounded-full text-[9px] font-mono text-amber-500 font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3" /> E2E Encrypted Wire
                </div>
              </div>

              {/* Lmmy Node B: Remote Server AI */}
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="relative">
                  {/* Visual Lmmy character container */}
                  <div className="w-24 h-24 rounded-3xl bg-slate-800 border-2 border-white/10 flex flex-col items-center justify-center p-3 relative group hover:border-amber-500/40 transition-colors shadow-lg">
                    {/* Character ears */}
                    <div className="absolute -top-1.5 -left-1 w-5 h-5 rounded-full bg-slate-800 border-t-2 border-l-2 border-white/10" />
                    <div className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-slate-800 border-t-2 border-r-2 border-white/10" />
                    
                    {/* Character face */}
                    <div className="flex gap-4 mt-2">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                    </div>
                    {/* Rosy cheeks */}
                    <div className="flex gap-6 mt-1.5">
                      <div className="w-1.5 h-1 rounded-full bg-pink-500/40" />
                      <div className="w-1.5 h-1 rounded-full bg-pink-500/40" />
                    </div>
                    {/* Cute mouth */}
                    <div className="w-1.5 h-1.5 border-b-2 border-amber-500/60 rounded-full mt-1" />

                    {/* Paper Cup in hand */}
                    <div className="absolute -bottom-2 bg-purple-500/20 border border-purple-500/40 text-purple-400 rounded-lg px-2 py-0.5 text-[8px] font-mono font-bold">
                      Remote Host
                    </div>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white block">Dedicated GPU Rig</span>
                  <span className="text-[10px] text-white/40 font-mono block">Computing parameters in VRAM</span>
                </div>
              </div>

            </div>

            <p className="text-xs text-white/50 text-center max-w-2xl leading-relaxed">
              When you send a message, it is encrypted locally by your local client, travels through the secure P2P tunnel to your remote host, computes the heavy model inference in remote GPU memory, and streams back the encrypted response. The public internet never sees a single character.
            </p>
          </div>

          {/* Three columns grid of key product offerings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Feature 1 */}
            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Cpu className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Use models on remote devices</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                Access models from both your local and remote devices in the model loader. Your chat history remains safe and local, while heavy processing is routed to high-end devices you own.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Lock className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Your devices, linked together</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                All data and communication between nodes remain entirely private and encrypted. Your computers are never exposed to the public internet, because LM Link runs on top of Tailscale mesh VPNs.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-[#0e111a] border border-white/5 rounded-2xl p-6 space-y-3 hover:border-white/10 transition-all">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                <Shield className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-white">Industry-trusted security</h3>
              <p className="text-xs text-white/50 leading-relaxed">
                By leveraging Tailscale, LM Link guarantees enterprise-grade, peer-to-peer overlay security with direct paths, eliminating latency bottlenecking.
              </p>
            </div>

          </div>

        </section>

        {/* Q&A SECTION */}
        <section id="faq" className="border-t border-white/5 pt-16 space-y-8 scroll-mt-20">
          
          <div className="space-y-2">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold block">
              Frequently Asked Questions
            </span>
            <h2 className="text-2xl font-display font-extrabold text-white">LM Link Q&A</h2>
            <p className="text-sm text-white/50">Questions and answers about LM Link, how it works, and how to use it.</p>
          </div>

          {/* Accordion List */}
          <div className="border border-white/10 rounded-2xl overflow-hidden bg-[#0c0e14] divide-y divide-white/5">
            
            {/* QA Item 1 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-1')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">What is LM Link and how does it work?</span>
                {expandedFaq['faq-1'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-1'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed space-y-2">
                      <p>
                        LM Link connects your devices (laptops, LLM rigs, cloud VMs) into a secure, private AI network. By running on top of a peer-to-peer Tailscale mesh VPN, LM Link lets you discover and load models hosted on other devices seamlessly from within LM Studio.
                      </p>
                      <p>
                        The remote models appear alongside your local models in the model loader, allowing you to route heavy inference to powerful rigs while your chat history and prompts remain safely processed on your local device.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QA Item 2 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-2')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">Does LM Link open up my computer to the public internet?</span>
                {expandedFaq['faq-2'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-2'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed">
                      <p>
                        No. Your devices are never exposed to the public internet. LM Link uses custom Tailscale mesh VPN technology, which creates direct, peer-to-peer, end-to-end encrypted tunnels between your authorized machines. Only devices you explicitly pair with your link can communicate with each other. No port-forwarding or public IP addresses are required.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QA Item 3 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-3')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">Can I use remote models with LM Studio's local server and other tools?</span>
                {expandedFaq['faq-3'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-3'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed">
                      <p>
                        Yes! Once a remote model is linked, it behaves exactly like a local model. You can serve it via LM Studio's built-in local OpenAI-compatible API server (`localhost:1234`), use it with custom developer scripts, integrate it with SDKs, or run it inside the multi-model playground.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QA Item 4 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-4')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">Will LM Link interfere with my existing Tailscale VPN?</span>
                {expandedFaq['faq-4'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-4'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed">
                      <p>
                        No. LM Link runs on its own isolated, custom Tailscale virtual network interface. It operates side-by-side with any existing Tailscale installations, standard corporate VPNs, or network settings on your system without conflicts or performance degradation.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QA Item 5 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-5')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">Is LM Link free?</span>
                {expandedFaq['faq-5'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-5'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed">
                      <p>
                        LM Link is free for the duration of the Preview period. We will have both free as well as paid plans once the feature is released for General Availability. Stay tuned!
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* QA Item 6 */}
            <div className="transition-all">
              <button
                type="button"
                onClick={() => toggleFaq('faq-6')}
                className="w-full text-left px-6 py-4.5 flex justify-between items-center hover:bg-white/[0.01] transition-all cursor-pointer select-none"
              >
                <span className="text-xs font-bold text-white md:text-sm">I would like to use LM Link at my company. What are the options?</span>
                {expandedFaq['faq-6'] ? (
                  <ChevronUp className="w-4 h-4 text-amber-500" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-white/40" />
                )}
              </button>
              
              <AnimatePresence initial={false}>
                {expandedFaq['faq-6'] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed">
                      <p>
                        We are designing LM Link to support team and enterprise-wide private AI meshes. This includes single-sign-on (SSO), advanced access controls, dedicated cloud nodes, and audit logging. If you are interested in using LM Link with your company, please request enterprise early beta access via our preview channel or contact our solutions team.
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>

        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#07090d] py-12 px-6 mt-20 text-center font-mono text-[10px] text-white/30 space-y-4">
        <div className="flex justify-center items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span>LM Studio Dev Portal • Private Secure Overlay Services</span>
        </div>
        <p className="max-w-md mx-auto text-white/20">
          Tailscale is a trademark of Tailscale, Inc. WireGuard is a registered trademark of Jason A. Donenfeld. All data transfer is computed on device clusters.
        </p>
      </footer>
    </div>
  );
}
