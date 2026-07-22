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
  Users,
  Film,
  Play,
  Video,
  Image,
  Sliders,
  Flame,
  Wand2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import CinemaStudio from './components/CinemaStudio';
import SecurityDashboard from './components/SecurityDashboard';

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
  tokens?: {
    prompt: number;
    completion: number;
    total: number;
  };
  cost?: number;
  savedAmount?: number;
}

export default function App() {
  // Navigation Tabs & Copilot Mode
  const [activeTab, setActiveTab] = useState<'cinema-studio' | 'lm-link'>('cinema-studio');
  const [copilotMode, setCopilotMode] = useState<'forge-master' | 'lm-link'>('forge-master');
  const [chatModel, setChatModel] = useState<string>('gemini-2.5-flash');
  const [videoPrompt, setVideoPrompt] = useState<string>("");

  // Onboarding & Mesh Link State
  const [isLinked, setIsLinked] = useState<boolean>(false);
  const [meshName, setMeshName] = useState<string>("Personal AI Grid");
  const [isConnectingMesh, setIsConnectingMesh] = useState<boolean>(false);
  const [meshLogs, setMeshLogs] = useState<string[]>([]);
  const [customKey, setCustomKey] = useState<string>("");
  const [keyError, setKeyError] = useState<string>("");

  // Mode Selection State ('lm-link' = remote mesh, 'local' = local machine execution)
  const [currentMode, setCurrentMode] = useState<'lm-link' | 'local'>('lm-link');
  const [isSwitchingMode, setIsSwitchingMode] = useState<boolean>(false);
  const [targetMode, setTargetMode] = useState<'lm-link' | 'local' | null>(null);
  const [transitionProgress, setTransitionProgress] = useState<number>(0);
  const [transitionLog, setTransitionLog] = useState<string[]>([]);

  // Token & Cost Tracking Configuration
  const [modelRates, setModelRates] = useState<Record<string, { input: number; output: number }>>({
    'Mistral Nemo 12B (Q8_0)': { input: 0.15, output: 0.60 }, // Price in USD per 1,000,000 tokens
    'Llama 3.1 8B (GGUF Q4_K_M)': { input: 0.10, output: 0.40 },
    'Gemma 2 9B (GGUF Q4)': { input: 0.10, output: 0.40 },
    'DeepSeek V3 671B (ExL2)': { input: 2.00, output: 8.00 },
    'Phi-3 Mini (Q4)': { input: 0.05, output: 0.20 }
  });

  // Base historic metrics to simulate previous sessions (can be reset by the user)
  const [baselineMetrics, setBaselineMetrics] = useState({
    promptTokens: 4120,
    completionTokens: 8540,
    cost: 0.01254,
    saved: 0.03240
  });

  const [showTelemetryDetails, setShowTelemetryDetails] = useState<boolean>(false);
  const [isEditingRates, setIsEditingRates] = useState<boolean>(false);

  // Bottom Page Modals & Interaction States
  const [activeModal, setActiveModal] = useState<'pricing' | 'affiliate' | 'legal' | 'contact' | null>(null);
  const [affiliateCode, setAffiliateCode] = useState<string>("");
  const [copiedAffiliate, setCopiedAffiliate] = useState<boolean>(false);
  const [contactFormSubmitted, setContactFormSubmitted] = useState<boolean>(false);
  const [contactSubject, setContactSubject] = useState<string>("general");
  const [contactMessage, setContactMessage] = useState<string>("");
  const [contactEmail, setContactEmail] = useState<string>("");

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
      content: 'Greetings, Creator! I am the Video Forge Master, your cybernetic wizard and co-director. Embedded deep within the FLUX.CINEMA workstation, I am ready to help you forge majestic, photorealistic cinematic masterworks. Ask me for visual story ideas, character blueprints, camera directions, or prompt scripts (which I will provide in double quotes so you can apply them to the studio with 1 click!). What visual dream shall we materialize today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      deviceUsed: 'Forge Core Studio',
      modelUsed: 'Video Forge Master',
      latencyMs: 120,
      tokens: {
        prompt: 0,
        completion: 82,
        total: 82
      },
      cost: 0.000049,
      savedAmount: 0
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

  // Derived usage and cost statistics computed dynamically from session chatMessages
  const totalPromptTokens = baselineMetrics.promptTokens + chatMessages.reduce((sum, m) => sum + (m.tokens?.prompt || 0), 0);
  const totalCompletionTokens = baselineMetrics.completionTokens + chatMessages.reduce((sum, m) => sum + (m.tokens?.completion || 0), 0);
  const totalTokens = totalPromptTokens + totalCompletionTokens;

  const totalCost = baselineMetrics.cost + chatMessages.reduce((sum, m) => sum + (m.cost || 0), 0);
  const totalSaved = baselineMetrics.saved + chatMessages.reduce((sum, m) => sum + (m.savedAmount || 0), 0);

  // Local efficiency rate (percentage of tokens processed locally / at $0 cost)
  const localTokens = chatMessages.filter(m => m.savedAmount && m.savedAmount > 0).reduce((sum, m) => sum + (m.tokens?.total || 0), 0);
  const localComputeRatio = totalTokens > 0 
    ? ((localTokens + 6500) / (totalTokens + 6500)) * 100 
    : 100;

  const transactions = chatMessages
    .filter(m => m.tokens)
    .map(m => ({
      id: m.id,
      timestamp: m.timestamp,
      model: m.modelUsed,
      tokens: m.tokens,
      cost: m.cost,
      saved: m.savedAmount,
      isLocal: m.savedAmount !== undefined && m.savedAmount > 0
    }))
    .reverse();

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

  // Context mode switcher with highly detailed animated transition
  const handleModeSwitch = (mode: 'lm-link' | 'local') => {
    if (mode === currentMode) return;
    setIsSwitchingMode(true);
    setTargetMode(mode);
    setTransitionProgress(0);
    setTransitionLog([]);

    const lmLinkLogs = [
      "📡 Reading local mesh configuration handshake files...",
      "🔑 Loading Tailscale WireGuard cryptographic auth tokens...",
      "🔗 Initializing virtual overlay interface tunnel (utun4)...",
      "🛡️ Establishing secure E2E double-encrypted peer-to-peer tunnels...",
      "⚡ Pinging target GPU node: 'Office LLM Rig' [18ms latency]",
      "📂 Loading Mistral Nemo 12B model state dynamically in remote VRAM...",
      "✅ Context switch complete! Secure remote mesh environment linked."
    ];

    const localLogs = [
      "⚠️ Suspending remote mesh tunnels to reclaim network bandwidth...",
      "🔒 Flushing encrypted Tailscale VPN network packets from virtual buffer...",
      "💻 Initializing local memory subsystem (unified system memory map)...",
      "📦 Allocating local VRAM bounds for Llama 3.1 8B parameter weights...",
      "⚡ Initializing Apple Metal (MPS) compiler for hardware-accelerated execution...",
      "✅ Context switch complete! Bypassed network. Running strictly on Local Host."
    ];

    const logsToUse = mode === 'lm-link' ? lmLinkLogs : localLogs;
    let index = 0;

    const interval = setInterval(() => {
      if (index < logsToUse.length) {
        setTransitionLog(prev => [...prev, logsToUse[index]]);
        setTransitionProgress(prev => Math.min((index + 1) * 15, 95));
        index++;
      } else {
        clearInterval(interval);
        setTransitionProgress(100);
        setTimeout(() => {
          setCurrentMode(mode);
          // If switching to local, auto-select local device dev-1
          if (mode === 'local') {
            setSelectedDeviceId('dev-1');
            setActiveModel('Llama 3.1 8B (GGUF Q4_K_M)');
          } else {
            // If switching to lm-link, select remote rig dev-2
            setSelectedDeviceId('dev-2');
            setActiveModel('Mistral Nemo 12B (Q8_0)');
          }
          setIsSwitchingMode(false);
          setTargetMode(null);
        }, 500);
      }
    }, 450);
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

    try {
      // Prepare previous messages for context
      const apiMessages = chatMessages.concat(userMsg).map(m => ({
        role: m.role,
        content: m.content
      }));

      // Send to Video Forge Master Chat Proxy
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: apiMessages,
          model: chatModel,
          subscriptionPrice: '$5.50/month',
          videoModel: 'veo-3.1-fast-generate-preview'
        })
      });

      if (!res.ok) {
        throw new Error('The Forge Master core did not respond in time.');
      }
      const data = await res.json();

      // Calculate token counts and cost for this execution
      const promptToks = data.usage?.promptTokens || Math.ceil(userMsg.content.length / 3.8);
      const completionToks = data.usage?.completionTokens || Math.ceil((data.text || "").length / 3.8);
      const totalToks = promptToks + completionToks;

      const activeRate = { input: 0.15, output: 0.60 }; // Price of Gemini 2.5 Flash / Forge Core
      const computedCost = ((promptToks * activeRate.input) + (completionToks * activeRate.output)) / 1000000;

      setChatMessages(prev => [...prev, {
        id: `msg-${Date.now()}-res`,
        role: 'assistant',
        content: data.text || data.error || 'Connection established.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        deviceUsed: 'Forge Core Studio',
        modelUsed: chatModel === 'gemini-2.5-flash' ? 'Video Forge Master (Gemini 2.5 Flash)' :
                   chatModel === 'gemini-2.5-pro' ? 'Video Forge Master (Gemini 2.5 Pro)' :
                   chatModel === 'gemini-2.0-flash' ? 'Video Forge Master (Gemini 2.0 Flash)' :
                   chatModel === 'gemini-1.5-pro' ? 'Video Forge Master (Gemini 1.5 Pro)' :
                   `Video Forge Master (${chatModel})`,
        latencyMs: 120 + Math.floor(Math.random() * 50),
        tokens: {
          prompt: promptToks,
          completion: completionToks,
          total: totalToks
        },
        cost: computedCost,
        savedAmount: 0
      }]);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || "Failed to establish secure connection. Please try again.");
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

  const getPromptsFromText = (text: string): string[] => {
    const matches = text.match(/"([^"]{15,})"/g);
    if (!matches) return [];
    return matches.map(m => m.slice(1, -1));
  };

  const renderChatPlayground = () => {
    return (
      <div className="bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden flex flex-col h-[520px] shadow-2xl relative">
        
        {/* Chat Panel Header */}
        <div className="border-b border-white/5 px-5 py-3 bg-[#0a0c12] flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Terminal className="w-4 h-4 text-amber-500" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full animate-ping bg-amber-400" />
            </div>
            <div>
              <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                🧙‍♂️ Video Forge Master
              </h4>
              <span className="text-[10px] text-white/40 font-mono flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500 inline" /> Active: {chatModel}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* LLM Engine Swapping Dropdown */}
            <div className="flex items-center gap-1.5 bg-black/50 border border-white/10 rounded-lg px-2 py-1">
              <span className="text-[9px] font-mono text-white/40 uppercase">Brain:</span>
              <select
                value={chatModel}
                onChange={(e) => setChatModel(e.target.value)}
                className="bg-transparent border-none text-amber-400 font-mono text-[10px] font-bold outline-none cursor-pointer focus:ring-0 py-0 pl-1 pr-5"
                title="Swap LLM text generation model"
              >
                <option value="gemini-2.5-flash" className="bg-[#0e111a] text-white font-mono">Gemini 2.5 Flash</option>
                <option value="gemini-2.5-pro" className="bg-[#0e111a] text-white font-mono">Gemini 2.5 Pro</option>
                <option value="gemini-2.0-flash" className="bg-[#0e111a] text-white font-mono">Gemini 2.0 Flash</option>
                <option value="gemini-1.5-pro" className="bg-[#0e111a] text-white font-mono">Gemini 1.5 Pro</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => setChatMessages([])}
              className="text-[9px] font-mono text-white/30 hover:text-white flex items-center gap-1 hover:bg-white/5 px-2 py-1.5 rounded-lg transition-colors border border-transparent hover:border-white/5"
              title="Clear session history"
            >
              <Trash2 className="w-3 h-3" /> Clear Console
            </button>
          </div>
        </div>

        {/* Packet flow routing animation banner */}
        <div className="bg-black/40 border-b border-white/5 px-5 py-1.5 text-[9px] font-mono text-white/30 flex justify-between items-center relative overflow-hidden">
          <span className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Client: Localhost
          </span>
          
          {/* Tunnel line graphic */}
          <div className="flex-1 mx-4 h-[1px] relative flex items-center bg-white/5">
            <span className={`h-1 absolute rounded-full transition-all duration-1000 bg-amber-500 ${dataPacketPulse ? 'w-full animate-pulse' : 'w-0'}`} />
          </div>

          <span className="flex items-center gap-1 text-amber-500">
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-amber-400" />
            Direct Studio Pipe
          </span>
        </div>

        {/* Chat Messages Log */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <Terminal className="w-10 h-10 text-white/10" />
              <div className="space-y-1">
                <p className="text-xs font-mono text-white/40">Secure Console established.</p>
                <p className="text-[11px] text-white/30 leading-normal">
                  Welcome to the Forge Studio chat! Ask me anything about prompts, storytelling, character descriptions, lighting, or music cues.
                </p>
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
                      <span className="text-amber-400 font-semibold">
                        {msg.modelUsed || 'Video Forge Master'}
                      </span>
                    </>
                  )}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-amber-500/10 border border-amber-500/20 text-white'
                      : 'bg-white/[0.03] border border-white/5 text-white/90'
                  }`}
                >
                  {msg.content}

                  {/* Visual Prompt Action Button overlay inside bubble */}
                  {msg.role === 'assistant' && (
                    <>
                      {getPromptsFromText(msg.content).map((prompt, i) => (
                        <div key={i} className="mt-2.5 bg-amber-500/15 border border-amber-500/30 rounded-lg p-2.5 flex items-center justify-between gap-3 text-left">
                          <div className="flex-1 min-w-0 font-mono">
                            <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest block font-sans">Prompt Seed</span>
                            <span className="text-[10px] text-white/80 truncate block mt-0.5">"{prompt}"</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setVideoPrompt(prompt);
                              setTimeout(() => {
                                document.getElementById('video-generator-panel')?.scrollIntoView({ behavior: 'smooth' });
                              }, 150);
                            }}
                            className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-[9px] font-display flex items-center gap-1 transition-all shrink-0 cursor-pointer"
                          >
                            <Sparkles className="w-3 h-3 text-slate-950 animate-pulse" />
                            Apply Prompt
                          </button>
                        </div>
                      ))}
                    </>
                  )}
                </div>

                {/* Connection Latency indicator */}
                {msg.role === 'assistant' && (
                  <div className="flex flex-col space-y-0.5">
                    {msg.latencyMs !== undefined && (
                      <span className="text-[8px] font-mono px-1 text-amber-500/60">
                        ⚡ Connected directly via high-speed API Core Studio Pipe • Latency: {msg.latencyMs}ms
                      </span>
                    )}
                    
                    {msg.tokens && (
                      <div className="flex flex-wrap items-center gap-1.5 px-1 pt-0.5">
                        <span className="text-[8px] font-mono text-white/40 bg-white/[0.02] border border-white/5 px-1.5 py-0.5 rounded">
                          {msg.tokens.prompt} prompt tok • {msg.tokens.completion} reply tok
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {/* Pending state */}
          {isGenerating && (
            <div className="flex flex-col space-y-1.5 items-start">
              <div className="flex items-center gap-2 text-[9px] font-mono text-amber-500/60">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Streaming response from Video Forge Master Core...</span>
              </div>
              <div className="bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-xs text-white/50 italic flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-amber-500" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-amber-400" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 rounded-full animate-bounce bg-amber-500" style={{ animationDelay: '300ms' }} />
                </span>
                Wizard co-director formulating concepts...
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
              <p className="font-semibold">Support Error</p>
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
            disabled={isGenerating}
            placeholder="Ask Video Forge Master for storytelling concepts or prompt scripts..."
            className="flex-1 bg-[#090a0f] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white outline-none placeholder:text-white/20 font-sans focus:border-amber-500/40 disabled:opacity-40 transition-colors"
          />
          <button
            type="submit"
            disabled={!inputMessage.trim() || isGenerating}
            className="p-2.5 rounded-xl font-bold disabled:opacity-30 cursor-pointer transition-all active:scale-95 flex items-center justify-center shrink-0 bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#090b0f] text-white font-sans antialiased relative overflow-x-hidden selection:bg-amber-500/30 selection:text-white">
      {/* Absolute abstract grid background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161a23_1px,transparent_1px),linear-gradient(to_bottom,#161a23_1px,transparent_1px)] bg-[size:32px_32px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-35 pointer-events-none" />

      {/* Radiant glows */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-amber-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Navigation Header */}
      <header id="header-section" className="border-b border-white/5 bg-[#090b0f]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex flex-col sm:flex-row gap-4 justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 via-amber-500 to-amber-400 p-[1px] shadow-lg shadow-amber-500/10">
            <div className="w-full h-full bg-[#090b0f] rounded-[11px] flex items-center justify-center">
              <Film className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>
            {/* Glowing particle ring */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-display font-bold tracking-tight text-white text-base">FLUX.CINEMA</span>
              <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase font-bold px-1.5 py-0.5 rounded border border-amber-500/25 tracking-widest">Studio</span>
            </div>
            <p className="text-[10px] text-white/40 font-mono">Veo 3.1 &amp; Decentralized Compute Mesh</p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <a 
            href="#security-audit"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/50 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg bg-white/5"
          >
            <Shield className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
            Security Audit
          </a>
          <a 
            href="#faq"
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-white/50 hover:text-white transition-colors border border-white/10 px-3 py-1.5 rounded-lg bg-white/5"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            Help Guide
          </a>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 relative space-y-16">
        
        {/* CINEMA STUDIO SUITE */}
        <div className="space-y-16 w-full">
          {/* Cinematic Header Banner */}
          <div className="bg-gradient-to-r from-[#111420] via-[#0d0e15] to-[#090a0f] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative overflow-hidden shadow-2xl">
            <div className="absolute inset-0 bg-radial-gradient(ellipse_at_top_right,rgba(245,158,11,0.04),transparent_60%) pointer-events-none" />
            <div className="space-y-2 relative z-10">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono">
                <Film className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                <span>Veo 3.1 Fast Cinematic Generator Active</span>
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-extrabold text-white leading-tight">
                FLUX.CINEMA <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-yellow-300">Creator Suite</span>
              </h1>
              <p className="text-xs md:text-sm text-white/60 max-w-2xl leading-relaxed">
                Compose majestic video scripts and generate stunning high-fidelity preview frames. Use the Video Forge Master co-director below to brainstorm visual themes and write cinematic prompts.
              </p>
            </div>

            {/* Status metrics widget */}
            <div className="bg-black/40 border border-white/5 rounded-2xl p-4 flex gap-6 shrink-0 relative z-10 w-full md:w-auto font-mono text-xs">
              <div>
                <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-1">Subscribers Rate</span>
                <span className="text-amber-400 font-bold flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" /> $5.50/month
                </span>
              </div>
              <div className="border-l border-white/10 pl-6">
                <span className="text-white/40 block text-[9px] uppercase tracking-wider mb-1">Target Engine</span>
                <span className="text-white font-bold block truncate max-w-[150px]">
                  veo-3.1-fast-generate-preview
                </span>
              </div>
            </div>
          </div>

          {/* Video Studio Generator & AI Chat Side-by-Side Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Left Column: Visual Generator Studio */}
            <div className="lg:col-span-6 space-y-6" id="video-generator-panel">
              <CinemaStudio 
                activeVideoModel="veo-3.1-fast-generate-preview" 
                onAddMetrics={(tokens, cost, saved) => {
                  // Update telemetry metrics from video generation
                  setBaselineMetrics(prev => ({
                    ...prev,
                    promptTokens: prev.promptTokens + tokens,
                    completionTokens: prev.completionTokens + tokens,
                    cost: prev.cost + cost,
                    saved: prev.saved + saved
                  }));
                }}
                videoPrompt={videoPrompt}
                setVideoPrompt={setVideoPrompt}
              />
            </div>

            {/* Right Column: Video Forge Master AI Chat Assistant */}
            <div className="lg:col-span-6 space-y-6">
              {renderChatPlayground()}
            </div>

          </div>

          {/* SECURITY AUDIT SIMULATION DASHBOARD */}
          <section id="security-audit" className="border-t border-white/5 pt-16 space-y-8 scroll-mt-20">
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/15">
                Active Cyber Security
              </span>
              <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">Active Node Hardening & Security Audit</h2>
              <p className="text-sm text-white/50 leading-relaxed font-sans">
                Verify secure interface bindings, audit communication ports on computing clusters, rotate API key signatures, and keep your co-director pipelines secure from unauthorized public queries.
              </p>
            </div>
            <SecurityDashboard />
          </section>

          {/* Q&A SECTION */}
          <section id="faq" className="border-t border-white/5 pt-16 space-y-8 scroll-mt-20">
            
            <div className="space-y-2">
              <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold block">
                Frequently Asked Questions
              </span>
              <h2 className="text-2xl font-display font-extrabold text-white">Cinema Studio Q&A</h2>
              <p className="text-sm text-white/50 font-sans">Everything you need to know about generating cinematic preview frames and co-director chat parameters.</p>
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
                  <span className="text-xs font-bold text-white md:text-sm">How does FLUX.CINEMA generate video previews?</span>
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
                      <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed space-y-2 font-sans">
                        <p>
                          Our pipeline uses the bleeding-edge Veo 3.1 fast generation model. It renders high-fidelity starting and ending frames and bridges them with fluid temporal flow vectors. This gives creators a pristine, immediate feel of the visual output without waiting hours for raw rendering steps.
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
                  <span className="text-xs font-bold text-white md:text-sm">Is my generated media private?</span>
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
                      <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed font-sans">
                        <p>
                          Absolutely. Media generation uses end-to-end encrypted overlays. Your custom text prompts, storyboard configurations, and generated frame previews are routed through private, non-custodial cloud pipelines and compiled strictly within isolated temporary containers.
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
                  <span className="text-xs font-bold text-white md:text-sm">What is the $5.50/month tier?</span>
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
                      <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed font-sans">
                        <p>
                          The $5.50 Core subscription plan unlocks unlimited fast-rendering priority queues for Veo 3.1, raw 4K cinematic export, advanced co-director text-memory context, and secure multi-GPU cluster support for massive production pipelines.
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
                  <span className="text-xs font-bold text-white md:text-sm">Can I use custom music cues with Veo 3.1?</span>
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
                      <div className="px-6 pb-5 text-xs text-white/60 leading-relaxed font-sans">
                        <p>
                          Yes! Under the sound configuration drawer inside Cinema Studio, you can specify emotional descriptors, instruments, and BPM sync values. Our backend mixes these parameters to render perfectly synchronized high-fidelity background scores.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

          </section>
        </div>

        {false && (
          /* LM LINK MESH COORDINATOR MODE */
          <div className="space-y-16">
            
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
            <div className="space-y-6">
              
              {/* Context Mode Switcher Bar */}
              <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-4.5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#1c2133]/10 to-transparent opacity-50 pointer-events-none" />
                
                <div className="flex items-center gap-3.5 relative z-10">
                  <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${currentMode === 'lm-link' ? 'bg-amber-500/10 border-amber-500/30 text-amber-500 shadow-lg shadow-amber-500/5' : 'bg-purple-500/10 border-purple-500/30 text-purple-400 shadow-lg shadow-purple-500/5'}`}>
                    {currentMode === 'lm-link' ? <Wifi className="w-5 h-5 animate-pulse" /> : <Cpu className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-sm font-display font-extrabold text-white">
                        Active Execution Scope: {currentMode === 'lm-link' ? 'LM Link Peer Mesh' : 'Strict Local Host'}
                      </h3>
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-mono uppercase font-bold tracking-wider border ${
                        currentMode === 'lm-link' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                      }`}>
                        {currentMode === 'lm-link' ? 'P2P REMOTE' : 'METAL ACCELERATED'}
                      </span>
                    </div>
                    <p className="text-xs text-white/50 mt-1 max-w-2xl leading-relaxed">
                      {currentMode === 'lm-link' 
                        ? 'Routing AI prompts through secure WireGuard overlay tunnels to high-capacity rigs (48GB VRAM / AWS H100).' 
                        : 'Running model parameters directly on local Unified Memory (M3 Max / Mac Studio). Completely offline, zero network roundtrip.'
                      }
                    </p>
                  </div>
                </div>

                {/* Switcher Toggle Control */}
                <div className="bg-black/50 border border-white/5 rounded-xl p-1 flex gap-1 w-full md:w-auto shrink-0 relative z-10">
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('lm-link')}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentMode === 'lm-link' 
                        ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/10' 
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <Wifi className="w-3.5 h-3.5" />
                    LM Link Mode
                  </button>
                  <button
                    type="button"
                    onClick={() => handleModeSwitch('local')}
                    className={`flex-1 md:flex-initial px-4 py-2 rounded-lg text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                      currentMode === 'local' 
                        ? 'bg-purple-500 text-white shadow-md shadow-purple-500/10' 
                        : 'text-white/40 hover:text-white/80 hover:bg-white/5'
                    }`}
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    Local Mode
                  </button>
                </div>
              </div>

              {/* RESOURCE TELEMETRY & COST MONITOR DASHBOARD */}
              <div className="bg-[#0c0e16] border border-white/10 rounded-2xl overflow-hidden relative shadow-xl">
                <div className="absolute inset-0 bg-gradient-to-b from-[#161a2b]/20 to-transparent pointer-events-none" />
                
                {/* Dashboard Header Bar */}
                <div className="border-b border-white/5 p-4 md:p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 relative z-10">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl">
                      <Activity className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-extrabold text-white flex items-center gap-1.5">
                        Resource Telemetry & Cost Monitor
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </h3>
                      <p className="text-[11px] text-white/40 font-mono">Live bandwidth & token generation analytics</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 w-full sm:w-auto self-stretch sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        // Reset all to zero/defaults
                        setBaselineMetrics({ promptTokens: 0, completionTokens: 0, cost: 0, saved: 0 });
                        setChatMessages([]);
                      }}
                      className="flex-1 sm:flex-initial px-3 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/5 hover:border-red-500/20 text-[10px] font-mono font-bold rounded-lg text-white/60 hover:text-red-400 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Reset Metrics
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setShowTelemetryDetails(!showTelemetryDetails)}
                      className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/15 border border-amber-500/20 text-amber-400 text-[10px] font-mono font-bold rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-3.5 h-3.5" />
                      {showTelemetryDetails ? "Hide Analytics" : "Expand Analytics"}
                    </button>
                  </div>
                </div>

                {/* 4-Panel Overview Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 border-b border-white/5 divide-x divide-y lg:divide-y-0 divide-white/5">
                  
                  {/* Panel 1: Accumulated Cost */}
                  <div className="p-4 md:p-5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Session Cost (USD)</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold text-emerald-400 tracking-tight">
                        ${totalCost.toFixed(6)}
                      </span>
                      <span className="text-[10px] text-emerald-400/50 font-mono">USD</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-white/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{currentMode === 'local' ? 'Metal Loop: $0.00' : 'Remote API active'}</span>
                    </div>
                  </div>

                  {/* Panel 2: Total Tokens */}
                  <div className="p-4 md:p-5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Tokens Processed</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold text-white tracking-tight">
                        {totalTokens.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-white/40 font-mono">tok</span>
                    </div>
                    <p className="text-[10px] text-white/40 font-mono leading-none">
                      {totalPromptTokens.toLocaleString()} up • {totalCompletionTokens.toLocaleString()} down
                    </p>
                  </div>

                  {/* Panel 3: Unified Memory Savings */}
                  <div className="p-4 md:p-5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Local Mode Savings</span>
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-mono font-bold text-purple-400 tracking-tight">
                        ${totalSaved.toFixed(6)}
                      </span>
                      <span className="text-[10px] text-purple-400/50 font-mono">USD</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] text-purple-400/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
                      <span>{localComputeRatio.toFixed(0)}% Workloads Offloaded</span>
                    </div>
                  </div>

                  {/* Panel 4: Active Rate Bandwidth */}
                  <div className="p-4 md:p-5 space-y-1">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-white/40 block">Active Model Rate</span>
                    <div>
                      <div className="text-xs font-mono text-amber-500 font-bold leading-normal truncate">
                        {currentMode === 'local' ? 'Self-Hosted ($0.00)' : activeModel.split(' ')[0]}
                      </div>
                      <p className="text-[10px] text-white/40 font-mono mt-0.5">
                        {currentMode === 'local' 
                          ? 'Unified System Memory' 
                          : `$${(modelRates[activeModel]?.input || 0).toFixed(2)} in / $${(modelRates[activeModel]?.output || 0).toFixed(2)} out per M-tok`
                        }
                      </p>
                    </div>
                  </div>

                </div>

                {/* ADVANCED TELEMETRY ANALYTICS (EXPANDABLE PANEL) */}
                <AnimatePresence>
                  {showTelemetryDetails && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/5 bg-black/40 relative z-10"
                    >
                      <div className="p-5 grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT COLUMN: Token Distribution & Rates Simulator */}
                        <div className="lg:col-span-6 space-y-5">
                          
                          {/* Token IO Distribution Visualizer */}
                          <div className="bg-[#0e111a] border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/70">Prompt vs Reply Distribution</h4>
                              <span className="text-[9px] font-mono text-white/40">
                                IO Ratio: {totalTokens > 0 ? ((totalPromptTokens / totalTokens) * 100).toFixed(0) : "0"}% / {totalTokens > 0 ? ((totalCompletionTokens / totalTokens) * 100).toFixed(0) : "0"}%
                              </span>
                            </div>

                            {/* Customized Horizontal Bar Chart */}
                            <div className="space-y-1.5">
                              <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden flex">
                                <div 
                                  className="h-full bg-amber-500 transition-all duration-500" 
                                  style={{ width: `${totalTokens > 0 ? (totalPromptTokens / totalTokens) * 100 : 40}%` }}
                                  title={`Prompt Tokens: ${totalPromptTokens}`}
                                />
                                <div 
                                  className="h-full bg-emerald-400 transition-all duration-500" 
                                  style={{ width: `${totalTokens > 0 ? (totalCompletionTokens / totalTokens) * 100 : 60}%` }}
                                  title={`Completion Tokens: ${totalCompletionTokens}`}
                                />
                              </div>
                              <div className="flex justify-between text-[9px] font-mono text-white/30">
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                  Prompt: {totalPromptTokens.toLocaleString()} ({totalTokens > 0 ? ((totalPromptTokens / totalTokens) * 100).toFixed(1) : "0"}%)
                                </span>
                                <span className="flex items-center gap-1">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                  Reply: {totalCompletionTokens.toLocaleString()} ({totalTokens > 0 ? ((totalCompletionTokens / totalTokens) * 100).toFixed(1) : "0"}%)
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Interactive Rates Simulator Form */}
                          <div className="bg-[#0e111a] border border-white/5 rounded-xl p-4 space-y-3">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <div className="flex items-center gap-1.5">
                                <Settings className="w-3.5 h-3.5 text-amber-500" />
                                <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/80">API/Hosting Rates Simulator</h4>
                              </div>
                              <button
                                type="button"
                                onClick={() => setIsEditingRates(!isEditingRates)}
                                className="text-[9px] font-mono text-amber-500 hover:text-amber-400 font-bold"
                              >
                                {isEditingRates ? "Lock Pricing" : "Edit Pricing Matrix"}
                              </button>
                            </div>

                            <div className="space-y-2 max-h-[160px] overflow-y-auto font-mono text-[10px] scrollbar-none pr-1">
                              {Object.entries(modelRates).map(([model, rateObj]) => {
                                const rate = rateObj as { input: number; output: number };
                                return (
                                  <div key={model} className="flex justify-between items-center bg-black/20 p-2 rounded border border-white/5">
                                    <span className="text-white/70 font-semibold truncate max-w-[160px]" title={model}>{model.split(' ')[0]}</span>
                                    <div className="flex items-center gap-2">
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/30 text-[8px]">IN:</span>
                                        {isEditingRates ? (
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            value={rate.input}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              setModelRates(prev => ({
                                                ...prev,
                                                [model]: { ...prev[model], input: val }
                                              }));
                                            }}
                                            className="w-12 bg-slate-950 border border-white/15 px-1 py-0.5 rounded text-center text-white"
                                          />
                                        ) : (
                                          <span className="text-amber-500/80">${rate.input.toFixed(2)}</span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <span className="text-white/30 text-[8px]">OUT:</span>
                                        {isEditingRates ? (
                                          <input 
                                            type="number" 
                                            step="0.01"
                                            min="0"
                                            value={rate.output}
                                            onChange={(e) => {
                                              const val = parseFloat(e.target.value) || 0;
                                              setModelRates(prev => ({
                                                ...prev,
                                                [model]: { ...prev[model], output: val }
                                              }));
                                            }}
                                            className="w-12 bg-slate-950 border border-white/15 px-1 py-0.5 rounded text-center text-white"
                                          />
                                        ) : (
                                          <span className="text-emerald-400/80">${rate.output.toFixed(2)}</span>
                                        )}
                                      </div>
                                      <span className="text-white/20 text-[8px]">/M</span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <span className="text-[8px] text-white/30 block italic">Rates defined in USD per 1,000,000 processed tokens. All updates apply reactively.</span>
                          </div>

                        </div>

                        {/* RIGHT COLUMN: Query Transaction Ledger */}
                        <div className="lg:col-span-6 space-y-4">
                          <div className="bg-[#0e111a] border border-white/5 rounded-xl p-4 space-y-3 flex flex-col h-full min-h-[295px]">
                            <div className="flex justify-between items-center border-b border-white/5 pb-2">
                              <h4 className="text-[10px] font-mono uppercase tracking-widest text-white/80">Query Transaction Ledger</h4>
                              <span className="text-[9px] font-mono text-white/40">Showing last {transactions.length} operations</span>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 max-h-[220px] scrollbar-none pr-1">
                              {transactions.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center text-white/20 font-mono text-[10px] py-12">
                                  <span>No queries executed in current console session yet.</span>
                                </div>
                              ) : (
                                transactions.map((t, idx) => (
                                  <div key={t.id || idx} className="bg-black/20 border border-white/5 rounded p-2 flex justify-between items-center font-mono text-[9px]">
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-white/80 font-bold">{t.model?.split(' ')[0]}</span>
                                        <span className="text-white/20">•</span>
                                        <span className="text-white/40">{t.timestamp}</span>
                                      </div>
                                      <div className="text-white/30 text-[8px]">
                                        Tokens: {t.tokens?.prompt} prompt • {t.tokens?.completion} reply
                                      </div>
                                    </div>

                                    <div className="text-right">
                                      {t.isLocal ? (
                                        <span className="text-purple-400 font-bold block bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/15">
                                          Saved ${t.saved?.toFixed(6)}
                                        </span>
                                      ) : (
                                        <span className="text-emerald-400 font-bold block bg-emerald-400/10 px-1.5 py-0.5 rounded border border-emerald-500/15">
                                          Charged ${t.cost?.toFixed(6)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Existing grid layout */}
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
                      const isRemote = device.id !== 'dev-1';
                      const isSuspended = currentMode === 'local' && isRemote;
                      return (
                        <div
                          key={device.id}
                          onClick={() => {
                            if (isSuspended) {
                              handleModeSwitch('lm-link');
                              return;
                            }
                            setSelectedDeviceId(device.id);
                            setActiveModel(device.loadedModel);
                          }}
                          className={`border rounded-xl p-3.5 transition-all cursor-pointer relative group ${
                            isSuspended
                              ? 'bg-black/10 border-white/5 opacity-40 hover:opacity-70'
                              : isSelected 
                              ? currentMode === 'local'
                                ? 'bg-purple-500/[0.02] border-purple-500 shadow-md shadow-purple-500/5'
                                : 'bg-amber-500/[0.02] border-amber-500 shadow-md shadow-amber-500/5' 
                              : 'bg-black/30 border-white/5 hover:border-white/10'
                          }`}
                        >
                          {/* Selected marker accent */}
                          {isSelected && !isSuspended && (
                            <span className={`absolute top-0 bottom-0 left-0 w-1 rounded-l-xl ${currentMode === 'local' ? 'bg-purple-500' : 'bg-amber-500'}`} />
                          )}

                          {isSuspended && (
                            <span className="absolute top-2.5 right-2.5 text-[8px] font-mono uppercase bg-white/5 text-white/40 border border-white/10 px-1.5 py-0.5 rounded">
                              Mesh Suspended
                            </span>
                          )}

                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2.5">
                              <div className={`p-1.5 rounded-lg border ${
                                isSuspended
                                  ? 'bg-white/5 border-white/10 text-white/20'
                                  : isSelected 
                                  ? currentMode === 'local'
                                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                                  : 'bg-white/5 border-white/10 text-white/40'
                              }`}>
                                {getDeviceIcon(device.type)}
                              </div>
                              <div>
                                <h4 className="text-xs font-bold text-white">{device.name}</h4>
                                <span className="text-[10px] text-white/40 font-mono block">{device.specs}</span>
                              </div>
                            </div>

                            {!isSuspended && (
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
                            )}
                          </div>

                          {/* Node Health Metrics */}
                          <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-white/5 text-[9px] font-mono text-white/40">
                            <div>
                              <span>Latency</span>
                              <span className={`block font-bold mt-0.5 ${
                                isSuspended 
                                  ? 'text-white/20' 
                                  : device.latency < 10 
                                  ? 'text-green-400' 
                                  : device.latency < 25 
                                  ? 'text-amber-400' 
                                  : 'text-purple-400'
                              }`}>
                                {isSuspended ? '—' : `${device.latency}ms`}
                              </span>
                            </div>
                            <div>
                              <span>GPU load</span>
                              <span className={`block font-bold mt-0.5 ${isSuspended ? 'text-white/20' : 'text-white'}`}>
                                {isSuspended ? '—' : `${device.load}%`}
                              </span>
                            </div>
                            <div>
                              <span>Temp</span>
                              <span className={`block font-bold mt-0.5 ${isSuspended ? 'text-white/20' : 'text-white'}`}>
                                {isSuspended ? '—' : `${device.temp}°C`}
                              </span>
                            </div>
                            <div>
                              <span>Tunnel Link</span>
                              <span className={`block font-bold mt-0.5 ${isSuspended ? 'text-white/20' : 'text-green-400'}`}>
                                {isSuspended ? 'OFFLINE' : 'SECURE'}
                              </span>
                            </div>
                          </div>

                          {/* Loaded Model block */}
                          <div className="mt-3 bg-black/40 border border-white/5 rounded-lg p-2 flex justify-between items-center text-[10px] font-mono">
                            <span className="text-white/40">Loaded:</span>
                            <span className={`font-bold truncate max-w-[200px] ${
                              isSuspended 
                                ? 'text-white/25' 
                                : currentMode === 'local'
                                ? 'text-purple-400'
                                : 'text-amber-500'
                            }`} title={device.loadedModel}>
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
                      <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">
                        {currentMode === 'local' ? 'Local Compute Target' : 'Target Node & Loaded Model'}
                      </span>
                      <h3 className="text-sm font-bold text-white">
                        {devices.find(d => d.id === selectedDeviceId)?.name || 'Default Node'}
                      </h3>
                    </div>
                    {currentMode === 'local' ? (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-pulse" /> LOCAL CORE
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[9px] font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded border border-green-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" /> P2P ONLINE
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest block">
                      {currentMode === 'local' ? 'Select local GGUF model to load into Unified RAM:' : 'Select remote GGUF model to load into VRAM:'}
                    </label>
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
                                ? currentMode === 'local'
                                  ? 'bg-purple-500/15 border-purple-500 text-purple-400 shadow-sm shadow-purple-500/5'
                                  : 'bg-amber-500/15 border-amber-500 text-amber-400 shadow-sm shadow-amber-500/5' 
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
                        <span className={`flex items-center gap-1.5 font-semibold animate-pulse ${currentMode === 'local' ? 'text-purple-400' : 'text-amber-500'}`}>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> {currentMode === 'local' ? 'Instantiating model weights in local system RAM...' : 'Instantiating model weights in remote GPU memory...'}
                        </span>
                        <span>{swapProgress}%</span>
                      </div>
                      <div className="w-full bg-[#161a23] rounded-full h-1.5 overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${currentMode === 'local' ? 'bg-purple-500' : 'bg-amber-500'}`}
                          initial={{ width: '0%' }}
                          animate={{ width: `${swapProgress}%` }}
                          transition={{ duration: 0.15 }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* THE CHAT PLAYGROUND */}
                {renderChatPlayground()}

              </div>

            </div>
          </div>
          )}
        </section>
        </div>
        )}


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

        {/* SECURITY AUDIT SIMULATION DASHBOARD */}
        <section id="security-audit" className="border-t border-white/5 pt-16 space-y-8 scroll-mt-20">
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-[10px] uppercase font-mono tracking-widest text-amber-500 font-bold bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/15">
              Secure Guard Nodes
            </span>
            <h2 className="text-2xl md:text-3xl font-display font-extrabold text-white">Active Node Hardening & Security Audit</h2>
            <p className="text-sm text-white/50 leading-relaxed">
              Verify WireGuard interface bindings, audit open ports on active remote GPUs, rotate outdated credentials, and keep your peer-to-peer overlay secure from potential public discovery.
            </p>
          </div>
          <SecurityDashboard />
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
      <footer className="border-t border-white/5 bg-[#07090d] pt-16 pb-12 px-6 md:px-12 mt-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-gradient(circle_at_bottom,rgba(245,158,11,0.02),transparent_70%) pointer-events-none" />
        
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 relative z-10">
          
          {/* Column 1: Studio Info */}
          <div className="space-y-4 text-left">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-500" />
              <span className="text-sm font-display font-extrabold text-white tracking-tight">FLUX.CINEMA</span>
            </div>
            <p className="text-[11px] font-mono text-white/40 leading-relaxed">
              Decentralized video studio pipeline powered by Veo 3.1 & private mesh overlays. Forge high-fidelity cinematic assets directly on local and cluster hardware nodes.
            </p>
            <div className="flex items-center gap-2 pt-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[9px] font-mono text-emerald-400/80">All nodes online & decrypted</span>
            </div>
          </div>

          {/* Column 2: Licensing & Legals */}
          <div className="space-y-3 font-mono text-xs text-left">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Licensing & Terms</h4>
            <ul className="space-y-2 text-[10px] text-white/40">
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('legal'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  End User License (EULA)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('legal'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Asset Usage License
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('legal'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Privacy Policy & VPN Overlay
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('legal'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Terms of Overlay Operations
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Pricing & Affiliate */}
          <div className="space-y-3 font-mono text-xs text-left">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Plans & Programs</h4>
            <ul className="space-y-2 text-[10px] text-white/40">
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('pricing'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  Subscription Core ($5.50/mo)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('pricing'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Enterprise Cluster Pricing
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('affiliate'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left flex items-center gap-1.5"
                >
                  <Users className="w-3 h-3 text-purple-400" />
                  Referral/Affiliate Program
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('affiliate'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Earn 15% Recurring Payout
                </button>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact & Hotlines */}
          <div className="space-y-3 font-mono text-xs text-left">
            <h4 className="text-[11px] font-bold text-white uppercase tracking-wider">Contact & Support</h4>
            <ul className="space-y-2 text-[10px] text-white/40">
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('contact'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Support: support@fluxcinema.io
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('contact'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Solutions Desk (Enterprise)
                </button>
              </li>
              <li>
                <button 
                  type="button" 
                  onClick={() => { setActiveModal('contact'); }}
                  className="hover:text-amber-400 transition-colors cursor-pointer text-left"
                >
                  Submit Bug/Telemetry Report
                </button>
              </li>
              <li>
                <span className="text-white/20 select-none">
                  Filing Desk IP: 127.0.0.1 (Overlay)
                </span>
              </li>
            </ul>
          </div>

        </div>

        {/* Legal Filing Separator */}
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/5 space-y-4 text-center font-mono text-[10px]">
          <div className="flex justify-center items-center gap-2 text-white/40">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="font-bold">LM Studio Dev Portal • Private Secure Overlay Services</span>
          </div>
          
          <p className="max-w-2xl mx-auto text-white/20 leading-relaxed">
            Tailscale is a trademark of Tailscale, Inc. WireGuard is a registered trademark of Jason A. Donenfeld. All data transfer is computed on device clusters.
          </p>
          
          <div className="text-[9px] text-white/10">
            © 2026 FLUX.CINEMA Inc. All rights reserved. Encrypted mesh tunnel system v1.2.9-Preview.
          </div>
        </div>
      </footer>

      {/* Transition Modal Overlay */}
      <AnimatePresence>
        {isSwitchingMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090d]/90 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0e111a] border border-white/10 rounded-2xl w-full max-w-lg p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden text-center"
            >
              <div className="absolute inset-0 bg-radial-gradient(circle_at_top,rgba(168,85,247,0.05),transparent_70%) pointer-events-none" />
              
              <div className="space-y-4 relative z-10">
                {/* Mode indicators */}
                <div className="flex justify-center items-center gap-6">
                  <div className={`p-3 rounded-xl border flex items-center justify-center transition-all duration-300 ${
                    targetMode === 'lm-link' 
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-500' 
                      : 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                  }`}>
                    {targetMode === 'lm-link' ? <Wifi className="w-6 h-6 animate-pulse" /> : <Cpu className="w-6 h-6" />}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-mono uppercase tracking-widest text-white/40 block">Handshaking New Compute Target</span>
                  <h3 className="text-lg font-display font-extrabold text-white">
                    Switching to {targetMode === 'lm-link' ? 'LM Link Remote Mesh' : 'Strict Local Mode'}
                  </h3>
                </div>

                {/* Simulated log output stream */}
                <div className="bg-black/40 border border-white/5 rounded-xl p-4 h-[160px] overflow-y-auto text-left font-mono text-[10px] space-y-2 select-none scrollbar-none">
                  {transitionLog.map((log, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -5 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`${log.includes('✅') ? 'text-green-400 font-bold' : log.includes('⚠️') ? 'text-amber-400' : 'text-white/60'}`}
                    >
                      {log}
                    </motion.div>
                  ))}
                  {transitionProgress < 100 && (
                    <span className="inline-block w-1.5 h-3 bg-white/50 animate-pulse" />
                  )}
                </div>

                {/* Custom system hardware status bar */}
                <div className="space-y-1.5 font-mono">
                  <div className="flex justify-between items-center text-[10px] text-white/40">
                    <span>PROGRESS STATUS</span>
                    <span>{transitionProgress}%</span>
                  </div>
                  <div className="w-full bg-[#161a23] rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full transition-all duration-300 ${targetMode === 'lm-link' ? 'bg-amber-500' : 'bg-purple-500'}`}
                      style={{ width: `${transitionProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Interactive Bottom Modals */}
      <AnimatePresence>
        {activeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#07090d]/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
            onClick={() => setActiveModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-[#0e111a] border border-white/10 rounded-3xl w-full max-w-2xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Radial glow background effect */}
              <div className="absolute inset-0 bg-radial-gradient(circle_at_top,rgba(245,158,11,0.05),transparent_70%) pointer-events-none" />
              
              {/* Modal Header */}
              <div className="flex justify-between items-center pb-4 border-b border-white/5 relative z-10">
                <div className="flex items-center gap-2">
                  {activeModal === 'pricing' && <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />}
                  {activeModal === 'affiliate' && <Users className="w-5 h-5 text-purple-400" />}
                  {activeModal === 'legal' && <Shield className="w-5 h-5 text-blue-400" />}
                  {activeModal === 'contact' && <HelpCircle className="w-5 h-5 text-emerald-400" />}
                  <h3 className="text-xs md:text-sm font-mono font-bold uppercase tracking-wider text-white">
                    {activeModal === 'pricing' && 'Subscription Core & Pricing Options'}
                    {activeModal === 'affiliate' && 'Creator Affiliate & Referrals'}
                    {activeModal === 'legal' && 'Legal & Asset Licensing'}
                    {activeModal === 'contact' && 'Dev Portal Solutions Hotline'}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="text-white/40 hover:text-white font-mono text-[10px] uppercase hover:bg-white/5 px-2 py-1 rounded cursor-pointer transition-colors"
                >
                  [CLOSE]
                </button>
              </div>

              {/* Modal Body Content */}
              <div className="relative z-10 max-h-[60vh] overflow-y-auto pr-2 scrollbar-none">
                
                {/* PRICING MODAL CONTENT */}
                {activeModal === 'pricing' && (
                  <div className="space-y-6">
                    <p className="text-xs text-white/60 leading-relaxed font-mono">
                      FLUX.CINEMA runs on high-end device clusters to compute majestic video frames instantly. Choose the tier that matches your creative volume:
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                      {/* Tier 1 */}
                      <div className="bg-black/30 border border-white/5 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-white/40 uppercase">Starter Pack</span>
                          <h4 className="text-xs font-bold text-white uppercase">Preview Beta</h4>
                          <p className="text-xl font-extrabold text-white/50">$0.00 <span className="text-[10px] text-white/30 font-normal">/mo</span></p>
                          <ul className="space-y-1 text-[9px] text-white/40 pt-2 list-disc pl-3">
                            <li>720p Render Max</li>
                            <li>5 concurrent tasks</li>
                            <li>Standard queue wait</li>
                          </ul>
                        </div>
                        <span className="text-[9px] text-center bg-white/5 text-white/40 py-1 rounded-lg">Active Plan</span>
                      </div>

                      {/* Tier 2 */}
                      <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl flex flex-col justify-between space-y-4 relative">
                        <span className="absolute -top-2.5 right-4 bg-amber-500 text-slate-950 font-bold text-[8px] px-2 py-0.5 rounded-full uppercase font-mono">Popular</span>
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-amber-400 uppercase font-bold">Creator Core</span>
                          <h4 className="text-xs font-bold text-white uppercase">Veo 3.1 Suite</h4>
                          <p className="text-xl font-extrabold text-amber-400">$5.50 <span className="text-[10px] text-white/40 font-normal">/mo</span></p>
                          <ul className="space-y-1 text-[9px] text-white/60 pt-2 list-disc pl-3">
                            <li>1080p Cinematic HD</li>
                            <li>Priority GPU processing</li>
                            <li>Unlimited Forgebot assistance</li>
                            <li>First/Last Frame guidance</li>
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => alert("Creator Core Plan simulation activated successfully!")}
                          className="text-[9px] text-center bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Upgrade Now
                        </button>
                      </div>

                      {/* Tier 3 */}
                      <div className="bg-purple-500/5 border border-purple-500/20 p-4 rounded-2xl flex flex-col justify-between space-y-4">
                        <div className="space-y-1.5">
                          <span className="text-[9px] text-purple-400 uppercase font-bold font-mono">Enterprise Mesh</span>
                          <h4 className="text-xs font-bold text-white uppercase">Cluster Grid</h4>
                          <p className="text-xl font-extrabold text-purple-400">Custom <span className="text-[10px] text-white/30 font-normal">/mo</span></p>
                          <ul className="space-y-1 text-[9px] text-white/40 pt-2 list-disc pl-3">
                            <li>Custom local/remote meshes</li>
                            <li>Dedicated Cloud GPU cluster</li>
                            <li>SSO / Private VPN tunnel SLA</li>
                            <li>24/7 Priority support hotline</li>
                          </ul>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveModal('contact');
                            setContactSubject('enterprise');
                          }}
                          className="text-[9px] text-center bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-bold py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          Request Demo
                        </button>
                      </div>
                    </div>

                    <p className="text-[8px] text-white/30 italic font-mono text-center">
                      * All prices listed are in USD. Subscriptions are billed monthly. Access is secured instantly using our Private secure overlay nodes.
                    </p>
                  </div>
                )}

                {/* AFFILIATE MODAL CONTENT */}
                {activeModal === 'affiliate' && (
                  <div className="space-y-5 font-mono text-xs">
                    <p className="text-xs text-white/60 leading-relaxed">
                      Forge visual concepts, share the workspace link, and earn money! Get **15% recurring payouts** for every subscription referral that upgrades to our Creator plans.
                    </p>

                    <div className="bg-black/30 border border-white/5 rounded-2xl p-5 space-y-4">
                      <div className="space-y-1">
                        <label className="text-[9px] text-white/40 uppercase block font-bold">Configure Custom Referrer Handle</label>
                        <div className="flex gap-2">
                          <span className="bg-white/5 border border-white/10 px-3 py-2 rounded-xl text-white/30 flex items-center text-[10px]">
                            flux.cinema/ref?code=
                          </span>
                          <input
                            type="text"
                            placeholder="creatorname"
                            value={affiliateCode}
                            onChange={(e) => {
                              setAffiliateCode(e.target.value.replace(/[^a-zA-Z0-9_-]/g, ""));
                              setCopiedAffiliate(false);
                            }}
                            className="flex-1 bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-purple-500/40 text-[11px]"
                          />
                        </div>
                      </div>

                      {affiliateCode.trim() && (
                        <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl flex justify-between items-center">
                          <div className="space-y-0.5">
                            <span className="text-[8px] text-purple-300 uppercase block font-bold">Your Custom Invite Link</span>
                            <span className="text-[10px] text-white select-all">
                              https://flux.cinema/ref?code={affiliateCode}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(`https://flux.cinema/ref?code=${affiliateCode}`);
                              setCopiedAffiliate(true);
                              setTimeout(() => setCopiedAffiliate(false), 2000);
                            }}
                            className="bg-purple-500 hover:bg-purple-400 text-white font-bold text-[9px] px-3 py-1.5 rounded-lg transition-all active:scale-95 cursor-pointer"
                          >
                            {copiedAffiliate ? '✅ Copied!' : 'Copy Link'}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="space-y-3">
                      <h4 className="text-white font-bold text-xs uppercase">Program details & guidelines:</h4>
                      <ul className="space-y-1.5 text-[10px] text-white/50 list-disc pl-4 leading-relaxed">
                        <li>**15% Lifetime Recurring**: As long as your referred subscriber is active, you keep receiving 15% of their core fees month after month.</li>
                        <li>**Cookie Window**: We track visitor cookies for 60 full days. If they sign up anytime inside that window, you get credited.</li>
                        <li>**Cluster Dashboard**: Payout metrics update on the first business day of each month securely over the mesh. Payouts processed via secure wire transfer.</li>
                      </ul>
                    </div>
                  </div>
                )}

                {/* LEGAL MODAL CONTENT */}
                {activeModal === 'legal' && (
                  <div className="space-y-5 text-white/70 text-xs leading-relaxed font-mono">
                    
                    <div className="space-y-2">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5 text-blue-400" />
                        1. End User License Agreement (EULA)
                      </h4>
                      <p className="text-[10px] text-white/50 pl-5">
                        Subject to the terms and parameters specified inside the LM Studio Dev Portal, users are granted a non-exclusive, personal, and revocable overlay computation license. All generations computed on localized GPU device clusters are private and owned entirely by the generating party under MIT terms, provided no copyright-restricted source frames are passed.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Lock className="w-3.5 h-3.5 text-amber-500" />
                        2. Privacy Policy & VPN Overlays
                      </h4>
                      <p className="text-[10px] text-white/50 pl-5">
                        Privacy is the fundamental cornerstone of FLUX.CINEMA. Video assets, prompt workflows, and direct model parameters are routed exclusively via end-to-end encrypted peer-to-peer (P2P) VPN tunnels. Tailscale virtual network configurations and WireGuard network keys prevent any centralized visibility, ensuring your creative concepts and assets never hit third-party cloud data warehouses without explicit instructions.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400" />
                        3. Trademark and Technology Attribution
                      </h4>
                      <p className="text-[10px] text-white/50 pl-5 bg-black/20 p-3 rounded-xl border border-white/5">
                        Tailscale is a trademark of Tailscale, Inc. WireGuard is a registered trademark of Jason A. Donenfeld. All data transfer is computed securely on decentralized device clusters. We have no affiliation, direct partnership, or sponsorship with either trademark owner outside standard system implementations.
                      </p>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-white font-bold text-xs uppercase tracking-wider flex items-center gap-1.5">
                        <Key className="w-3.5 h-3.5 text-emerald-400" />
                        4. Secure Telemetry Regulations
                      </h4>
                      <p className="text-[10px] text-white/50 pl-5">
                        We periodically capture anonymized latency telemetry data to improve peer packet routing performance on overlay grids. All network diagnostic data is scrubbed of individual device metadata and stored securely in localized system storage configurations.
                      </p>
                    </div>

                  </div>
                )}

                {/* CONTACT MODAL CONTENT */}
                {activeModal === 'contact' && (
                  <div className="space-y-5 font-mono text-xs">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-white/60">
                      <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1.5">
                        <h4 className="text-white font-bold text-xs uppercase">General Solutions Desk</h4>
                        <p className="text-[10px]">Direct Support Email:</p>
                        <p className="text-amber-400 font-bold select-all text-[11px]">support@fluxcinema.io</p>
                        <p className="text-[8px] text-white/30">Average response: &lt; 2 hours</p>
                      </div>

                      <div className="bg-black/30 border border-white/5 p-4 rounded-xl space-y-1.5">
                        <h4 className="text-white font-bold text-xs uppercase text-left">Enterprise Overlay Hotline</h4>
                        <p className="text-[10px] text-left">Solutions Routing Partner:</p>
                        <p className="text-purple-400 font-bold select-all text-[11px] text-left">solutions@fluxcinema.io</p>
                        <p className="text-[8px] text-white/30 text-left">Referral Contact: ethinxsolutions.au@gmail.com</p>
                      </div>
                    </div>

                    {contactFormSubmitted ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center space-y-2"
                      >
                        <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto animate-bounce" />
                        <h4 className="text-white font-bold text-xs">Secure Ticket Transmitted!</h4>
                        <p className="text-[10px] text-emerald-300">
                          Your message has been compiled, encrypted, and filed securely inside our Support Desk database node.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setContactFormSubmitted(false);
                            setContactMessage("");
                          }}
                          className="text-[9px] bg-emerald-500/20 hover:bg-emerald-500/30 text-white font-bold px-3 py-1.5 rounded-lg mt-2 transition-colors cursor-pointer"
                        >
                          Send Another Message
                        </button>
                      </motion.div>
                    ) : (
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          setContactFormSubmitted(true);
                        }}
                        className="space-y-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="text-[9px] text-white/40 uppercase block">Your Email Address</label>
                            <input
                              type="email"
                              required
                              placeholder="creator@studio.com"
                              value={contactEmail}
                              onChange={(e) => setContactEmail(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500/40 text-[11px]"
                            />
                          </div>

                          <div className="space-y-1 text-left">
                            <label className="text-[9px] text-white/40 uppercase block">Inquiry Subject</label>
                            <select
                              value={contactSubject}
                              onChange={(e) => setContactSubject(e.target.value)}
                              className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-amber-500/40 text-[11px]"
                            >
                              <option value="general">General Client Support</option>
                              <option value="enterprise">Enterprise Custom Tunnel Mesh</option>
                              <option value="billing">Affiliate / Referrer Payout Query</option>
                              <option value="bug">Vulnerability / Bug Report</option>
                            </select>
                          </div>
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="text-[9px] text-white/40 uppercase block">Detailed Message</label>
                          <textarea
                            required
                            rows={3}
                            placeholder="Write your technical request or question here securely..."
                            value={contactMessage}
                            onChange={(e) => setContactMessage(e.target.value)}
                            className="w-full bg-slate-950 border border-white/10 rounded-xl px-4 py-2.5 text-white outline-none focus:border-amber-500/40 resize-none text-[11px]"
                          />
                        </div>

                        <button
                          type="submit"
                          className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all active:scale-[0.98] cursor-pointer text-center text-[11px] uppercase tracking-wider"
                        >
                          Send Secure Support Message
                        </button>
                      </form>
                    )}

                  </div>
                )}

              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
