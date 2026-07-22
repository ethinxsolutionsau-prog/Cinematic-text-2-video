import React, { useState, useEffect, useRef } from 'react';
import { 
  Film, 
  Play, 
  Video, 
  Image as ImageIcon, 
  Sliders, 
  Flame, 
  Wand2, 
  RefreshCw, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Clock, 
  Download, 
  ArrowRight, 
  Upload, 
  Info,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface CinemaStudioProps {
  onAddMetrics: (promptTokens: number, completionTokens: number, cost: number, saved: number) => void;
  videoPrompt: string;
  setVideoPrompt: (prompt: string) => void;
  activeVideoModel: string;
}

interface VideoJob {
  id: string;
  prompt: string;
  aspectRatio: '16:9' | '9:16';
  resolution: '720p' | '1080p';
  durationSeconds: number;
  operationName: string;
  status: 'pending' | 'completed' | 'failed';
  createdAt: number;
  error?: string;
  videoUrl?: string;
  firstFrame?: { name?: string; mimeType: string; data: string };
  lastFrame?: { name?: string; mimeType: string; data: string };
}

export default function CinemaStudio({
  onAddMetrics,
  videoPrompt,
  setVideoPrompt,
  activeVideoModel
}: CinemaStudioProps) {
  // Video Generator State
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState<'16:9' | '9:16'>('16:9');
  const [resolution, setResolution] = useState<'720p' | '1080p'>('720p');
  const [durationSeconds, setDurationSeconds] = useState<number>(5);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string>("");

  // Keyframe Upload State
  const [firstFrame, setFirstFrame] = useState<{ name?: string; mimeType: string; data: string } | null>(null);
  const [lastFrame, setLastFrame] = useState<{ name?: string; mimeType: string; data: string } | null>(null);

  // Drag and drop states
  const [dragFirstActive, setDragFirstActive] = useState<boolean>(false);
  const [dragLastActive, setDragLastActive] = useState<boolean>(false);

  // File Input Refs
  const firstFrameInputRef = useRef<HTMLInputElement>(null);
  const lastFrameInputRef = useRef<HTMLInputElement>(null);

  // Simulated live rendering text stream for pending video generations
  const [renderProgress, setRenderProgress] = useState<number>(0);
  const [renderStepText, setRenderStepText] = useState<string>("Awaiting command...");

  const promptPresets = [
    "Cyberpunk street in heavy rain, volumetric golden neon highlights, reflection in puddles, cinematic wide tracking shot, 8k",
    "Slow-motion close-up of a high-tech cybernetic wizard holding floating sparks of golden creative energy, chiaroscuro lighting, vaporwave steam",
    "Fisheye drone-flyover across a lush primeval forest with massive waterfall, rays of morning sunshine breaking through thick foliage, photorealistic",
    "Epic orbital camera movement panning around a giant neon-ringed space station docking bays, star fields background, retro sci-fi style"
  ];

  // Fetch existing video jobs on mount
  const fetchJobs = async () => {
    try {
      const res = await fetch('/api/jobs');
      if (res.ok) {
        const data = await res.json();
        setVideoJobs(data.jobs || []);
        if (data.jobs && data.jobs.length > 0 && !selectedJobId) {
          setSelectedJobId(data.jobs[0].id);
        }
      }
    } catch (e) {
      console.error("Failed to fetch cinematic video jobs:", e);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  // Poll pending video jobs
  useEffect(() => {
    const pendingJobs = videoJobs.filter(j => j.status === 'pending');
    if (pendingJobs.length === 0) {
      setIsGeneratingVideo(false);
      return;
    }

    setIsGeneratingVideo(true);

    const interval = setInterval(async () => {
      let changed = false;
      const updatedJobs = await Promise.all(videoJobs.map(async (job) => {
        if (job.status === 'pending') {
          try {
            // Update simulated visual loader text & percentage dynamically
            setRenderProgress(prev => {
              if (prev >= 95) return 95;
              return prev + Math.floor(Math.random() * 8) + 2;
            });
            const steps = [
              "Parsing text visual prompts & syntax tags...",
              "Analyzing starting image keyframe structure...",
              "Initializing diffusion noise maps...",
              "Injecting spatial-temporal layers into latent grids...",
              "Iteratively denoising frame layers (Step 24/50)...",
              "Iteratively denoising frame layers (Step 48/50)...",
              "Synthesizing intermediate frame motion paths...",
              "Encoding compiled frames to high-fidelity H.264 video..."
            ];
            setRenderStepText(steps[Math.floor(Math.random() * steps.length)]);

            const res = await fetch('/api/video-status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ jobId: job.id, operationName: job.operationName })
            });

            if (res.ok) {
              const data = await res.json();
              if (data.done) {
                changed = true;
                if (data.error) {
                  return { 
                    ...job, 
                    status: 'failed' as const, 
                    error: data.error.message || 'Video render failed.' 
                  };
                } else {
                  // Video successfully created! Report metrics to parent cost tracker
                  // Veo 3 Video pricing estimate: $0.05 per video second generated (standard pricing reference)
                  // 1 video second is approx 10,000 prompt/completion tokens combined in processing weight
                  const generatedDuration = job.durationSeconds || 5;
                  const estimatedCost = generatedDuration * 0.05;
                  const estPromptTokens = 5000;
                  const estCompletionTokens = generatedDuration * 8000;
                  onAddMetrics(estPromptTokens, estCompletionTokens, estimatedCost, 0);

                  return { 
                    ...job, 
                    status: 'completed' as const, 
                    videoUrl: `/api/video-stream?operationName=${encodeURIComponent(job.operationName)}` 
                  };
                }
              }
            }
          } catch (e) {
            console.error("Error polling video render status:", e);
          }
        }
        return job;
      }));

      if (changed) {
        setVideoJobs(updatedJobs);
        // If our current selected job was pending and just finished, we want to stay selected on it
        fetchJobs();
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [videoJobs]);

  // Handle Drag & Drop
  const handleDrag = (e: React.DragEvent, target: 'first' | 'last', active: boolean) => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'first') setDragFirstActive(active);
    else setDragLastActive(active);
  };

  const handleDrop = (e: React.DragEvent, target: 'first' | 'last') => {
    e.preventDefault();
    e.stopPropagation();
    if (target === 'first') setDragFirstActive(false);
    else setDragLastActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file, target);
    }
  };

  // Convert File to Base64 (stripping headers for Gemini SDK inlineData)
  const processFile = (file: File, target: 'first' | 'last') => {
    if (!file.type.startsWith('image/')) {
      alert("Please upload image files only.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const commaIndex = base64String.indexOf(',');
      const cleanBase64 = commaIndex !== -1 ? base64String.substring(commaIndex + 1) : base64String;
      
      const payload = {
        name: file.name,
        mimeType: file.type,
        data: cleanBase64
      };

      if (target === 'first') setFirstFrame(payload);
      else setLastFrame(payload);
    };
    reader.readAsDataURL(file);
  };

  const handleFileSelectChange = (e: React.ChangeEvent<HTMLInputElement>, target: 'first' | 'last') => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file, target);
    }
  };

  const clearKeyframe = (target: 'first' | 'last') => {
    if (target === 'first') {
      setFirstFrame(null);
      if (firstFrameInputRef.current) firstFrameInputRef.current.value = "";
    } else {
      setLastFrame(null);
      if (lastFrameInputRef.current) lastFrameInputRef.current.value = "";
    }
  };

  // Trigger Video Generation POST
  const handleForgeVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!videoPrompt.trim() || isGeneratingVideo) return;

    setIsGeneratingVideo(true);
    setVideoError("");
    setRenderProgress(5);
    setRenderStepText("Dispatching visual request to Veo 3 engine...");

    try {
      const payload = {
        prompt: videoPrompt,
        aspectRatio,
        resolution,
        durationSeconds,
        model: activeVideoModel,
        firstFrame,
        lastFrame
      };

      const res = await fetch('/api/generate-video', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to launch video generation.");
      }

      const data = await res.json();
      const newJob = data.job;

      // Add to local job list and select it
      setVideoJobs(prev => [newJob, ...prev]);
      setSelectedJobId(newJob.id);

      // Clean keyframe inputs on successful dispatch
      setFirstFrame(null);
      setLastFrame(null);

    } catch (err: any) {
      console.error(err);
      setVideoError(err.message || "An error occurred while connecting to the render server.");
      setIsGeneratingVideo(false);
    }
  };

  const selectedJob = videoJobs.find(j => j.id === selectedJobId);

  return (
    <div id="video-generator-panel" className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COMPONENT: Cinematic Render Deck */}
        <div className="lg:col-span-6 bg-[#0e111a] border border-white/10 rounded-2xl p-5 md:p-6 space-y-6">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-xl">
                <Wand2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-display font-extrabold text-white">Video Studio</h3>
                <p className="text-[10px] text-white/40 font-mono uppercase tracking-wider">Powered by Veo 3.1</p>
              </div>
            </div>
            <span className="bg-amber-500/10 text-amber-400 font-mono text-[9px] uppercase font-bold px-2 py-0.5 rounded border border-amber-500/25 tracking-widest">
              HD READY
            </span>
          </div>

          <form onSubmit={handleForgeVideo} className="space-y-5">
            {/* Visual Prompt Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <span>Describe your video</span>
                  <div className="group relative inline-block">
                    <Info className="w-3.5 h-3.5 text-white/40 hover:text-amber-400 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/80 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-normal normal-case font-sans">
                      Type your creative concept. The AI turns your words into beautiful video clips. Include details about scenery, motion, style, lighting, or color.
                    </div>
                  </div>
                </label>
                <span className="text-amber-500/60 font-mono text-[9px] lowercase">Select a template below to get started</span>
              </div>
              <textarea
                required
                value={videoPrompt}
                onChange={(e) => setVideoPrompt(e.target.value)}
                disabled={isGeneratingVideo}
                rows={3}
                placeholder="A scenic mountain path during golden hour, camera tracking slowly..."
                className="w-full bg-black/40 border border-white/10 focus:border-amber-500/40 rounded-xl p-3.5 text-xs text-white outline-none placeholder:text-white/20 font-sans leading-relaxed resize-none transition-colors"
              />
              
              {/* Presets Grid */}
              <div className="space-y-1.5">
                <span className="text-[9px] font-mono text-white/30 block">Or select a creative seed to test:</span>
                <div className="grid grid-cols-2 gap-1.5">
                  {promptPresets.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      disabled={isGeneratingVideo}
                      onClick={() => setVideoPrompt(preset)}
                      className="text-left px-2 py-1.5 bg-white/[0.02] border border-white/5 rounded-lg text-[10px] text-white/50 hover:text-white hover:border-white/15 hover:bg-white/[0.04] transition-all truncate"
                      title={preset}
                    >
                      💡 Seed {idx + 1}: {preset.split(',')[0]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Visual Dimensions Grid */}
            <div className="grid grid-cols-2 gap-4">
              
              {/* Aspect Ratio Cards */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <span>Aspect Ratio</span>
                  <div className="group relative inline-block">
                    <Info className="w-3.5 h-3.5 text-white/40 hover:text-amber-400 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/80 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-normal normal-case font-sans">
                      Widescreen (16:9) is great for landscape screens and YouTube. Portrait (9:16) is ideal for mobile phones and social stories.
                    </div>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingVideo}
                    onClick={() => setAspectRatio('16:9')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aspectRatio === '16:9'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                    }`}
                  >
                    <div className="w-7 h-4 border border-current rounded-sm opacity-60 flex items-center justify-center text-[8px] font-bold">16:9</div>
                    <span className="text-[10px] font-bold font-mono">Landscape</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingVideo}
                    onClick={() => setAspectRatio('9:16')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      aspectRatio === '9:16'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                    }`}
                  >
                    <div className="w-4 h-7 border border-current rounded-sm opacity-60 flex items-center justify-center text-[8px] font-bold">9:16</div>
                    <span className="text-[10px] font-bold font-mono">Portrait</span>
                  </button>
                </div>
              </div>

              {/* Target Resolution */}
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                  <span>Resolution</span>
                  <div className="group relative inline-block">
                    <Info className="w-3.5 h-3.5 text-white/40 hover:text-amber-400 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/80 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-normal normal-case font-sans">
                      720p (Draft) is extremely fast and great for testing ideas. 1080p (HQ) renders maximum detail but takes a little longer to compute.
                    </div>
                  </div>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={isGeneratingVideo}
                    onClick={() => setResolution('720p')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      resolution === '720p'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-mono font-extrabold uppercase">720p</span>
                    <span className="text-[9px] font-mono text-white/40">Draft</span>
                  </button>
                  <button
                    type="button"
                    disabled={isGeneratingVideo}
                    onClick={() => setResolution('1080p')}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all cursor-pointer ${
                      resolution === '1080p'
                        ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                        : 'bg-black/20 border-white/5 text-white/40 hover:text-white/80 hover:border-white/10'
                    }`}
                  >
                    <span className="text-xs font-mono font-extrabold uppercase">1080p</span>
                    <span className="text-[9px] font-mono text-white/40">High Quality</span>
                  </button>
                </div>
              </div>

            </div>

            {/* Duration Slider */}
            <div className="space-y-2 bg-black/20 border border-white/5 p-3 rounded-xl">
              <div className="flex justify-between items-center text-[10px] font-mono uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="text-white/40">Video Duration</span>
                  <div className="group relative inline-block">
                    <Info className="w-3.5 h-3.5 text-white/40 hover:text-amber-400 cursor-help transition-colors" />
                    <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/80 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-normal normal-case font-sans">
                      Adjust the length of your video clip between 5 and 10 seconds.
                    </div>
                  </div>
                </div>
                <span className="text-amber-400 font-extrabold font-mono">{durationSeconds} seconds</span>
              </div>
              <input
                type="range"
                min={5}
                max={10}
                step={1}
                disabled={isGeneratingVideo}
                value={durationSeconds}
                onChange={(e) => setDurationSeconds(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
              />
              <div className="flex justify-between text-[8px] font-mono text-white/30 px-0.5">
                <span>5s (Standard)</span>
                <span>6s</span>
                <span>7s</span>
                <span>8s</span>
                <span>9s</span>
                <span>10s (Extended)</span>
              </div>
            </div>

            {/* Drag & Drop Keyframe Files Deck */}
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-white/40 uppercase tracking-widest flex items-center gap-1.5">
                <span>Start & End Images</span>
                <span className="text-white/20 lowercase font-normal">(optional)</span>
                <div className="group relative inline-block">
                  <Info className="w-3.5 h-3.5 text-white/40 hover:text-amber-400 cursor-help transition-colors" />
                  <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-white/10 text-[10px] text-white/80 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 leading-normal normal-case font-sans">
                    Optionally upload a start image, an end image, or both. The AI will seamlessly animate your prompt between them.
                  </div>
                </div>
              </label>
              
              <div className="grid grid-cols-2 gap-3">
                {/* First Frame Upload */}
                <div
                  onDragOver={(e) => handleDrag(e, 'first', true)}
                  onDragLeave={(e) => handleDrag(e, 'first', false)}
                  onDrop={(e) => handleDrop(e, 'first')}
                  onClick={() => !isGeneratingVideo && firstFrameInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-1.5 min-h-[95px] ${
                    firstFrame 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]' 
                      : dragFirstActive 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-white/5 bg-black/10 hover:border-white/10 hover:bg-black/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={firstFrameInputRef}
                    accept="image/*"
                    disabled={isGeneratingVideo}
                    onChange={(e) => handleFileSelectChange(e, 'first')}
                    className="hidden"
                  />
                  {firstFrame ? (
                    <div className="relative group w-full flex flex-col items-center">
                      <img 
                        src={`data:${firstFrame.mimeType};base64,${firstFrame.data}`} 
                        alt="Start Keyframe" 
                        className="w-12 h-12 object-cover rounded-md border border-white/10 shadow" 
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[8px] font-mono text-emerald-400 mt-1 truncate max-w-[120px]" title={firstFrame.name}>
                        {firstFrame.name || "start_frame.png"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearKeyframe('first');
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white/30" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-white/70 block">Start Image</span>
                        <span className="text-[8px] text-white/30 block">Begin video with</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Last Frame Upload */}
                <div
                  onDragOver={(e) => handleDrag(e, 'last', true)}
                  onDragLeave={(e) => handleDrag(e, 'last', false)}
                  onDrop={(e) => handleDrop(e, 'last')}
                  onClick={() => !isGeneratingVideo && lastFrameInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-3 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center gap-1.5 min-h-[95px] ${
                    lastFrame 
                      ? 'border-emerald-500/30 bg-emerald-500/[0.02] hover:bg-emerald-500/[0.04]' 
                      : dragLastActive 
                      ? 'border-amber-500 bg-amber-500/10' 
                      : 'border-white/5 bg-black/10 hover:border-white/10 hover:bg-black/20'
                  }`}
                >
                  <input
                    type="file"
                    ref={lastFrameInputRef}
                    accept="image/*"
                    disabled={isGeneratingVideo}
                    onChange={(e) => handleFileSelectChange(e, 'last')}
                    className="hidden"
                  />
                  {lastFrame ? (
                    <div className="relative group w-full flex flex-col items-center">
                      <img 
                        src={`data:${lastFrame.mimeType};base64,${lastFrame.data}`} 
                        alt="End Keyframe" 
                        className="w-12 h-12 object-cover rounded-md border border-white/10 shadow"
                        referrerPolicy="no-referrer"
                      />
                      <span className="text-[8px] font-mono text-emerald-400 mt-1 truncate max-w-[120px]" title={lastFrame.name}>
                        {lastFrame.name || "end_frame.png"}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearKeyframe('last');
                        }}
                        className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 text-white/30" />
                      <div className="space-y-0.5">
                        <span className="text-[10px] font-bold text-white/70 block">End Image</span>
                        <span className="text-[8px] text-white/30 block">Transition video to</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {videoError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex gap-2.5 text-xs text-red-400">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <p>{videoError}</p>
              </div>
            )}

            {/* Launch render button */}
            <button
              type="submit"
              disabled={isGeneratingVideo || !videoPrompt.trim()}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-slate-950 hover:text-black font-extrabold text-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-all shadow-lg shadow-amber-500/10 disabled:opacity-40 cursor-pointer font-display"
            >
              <Flame className={`w-4 h-4 text-slate-900 ${isGeneratingVideo ? 'animate-pulse' : ''}`} />
              {isGeneratingVideo ? "Active Render Forging..." : "Forge Cinematic Clip"}
            </button>
          </form>
        </div>

        {/* RIGHT COMPONENT: Cinema Projection Screen & Jobs list */}
        <div className="lg:col-span-6 space-y-6">
          
          {/* Cinema Room Card */}
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col relative">
            
            {/* Cinema Header */}
            <div className="border-b border-white/5 px-5 py-4 bg-[#0a0c12] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Film className="w-4 h-4 text-amber-500" />
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500 animate-ping" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                    Cinema Screening Room
                  </h4>
                  <span className="text-[10px] text-white/40 font-mono">Veo 3 high-fidelity visual preview frame</span>
                </div>
              </div>
              
              {selectedJob?.status === 'completed' && (
                <a
                  href={selectedJob.videoUrl}
                  download={`veo-forge-${selectedJob.id}.mp4`}
                  className="text-[9px] font-mono text-amber-400 hover:text-amber-300 flex items-center gap-1 hover:bg-white/5 px-2 py-1 rounded"
                  title="Download render file"
                >
                  <Download className="w-3 h-3" /> Save Clip
                </a>
              )}
            </div>

            {/* Projection Screen Screen Frame */}
            <div className="aspect-[16/9] bg-black flex items-center justify-center relative overflow-hidden group">
              <div className="absolute inset-0 bg-radial-gradient(circle_at_center,rgba(245,158,11,0.02),transparent_80%) pointer-events-none" />
              
              {selectedJob ? (
                <>
                  {selectedJob.status === 'completed' && selectedJob.videoUrl ? (
                    <video 
                      key={selectedJob.id}
                      src={selectedJob.videoUrl} 
                      controls 
                      autoPlay 
                      loop 
                      className={`w-full h-full object-contain rounded-xl relative z-10`}
                    />
                  ) : selectedJob.status === 'pending' ? (
                    /* Highly stylized terminal compiler logs loader */
                    <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 space-y-4 text-center select-none font-mono text-[10px] bg-black/95">
                      <RefreshCw className="w-10 h-10 text-amber-500 animate-spin" />
                      
                      <div className="space-y-1.5 w-full max-w-xs">
                        <div className="flex justify-between text-[9px] text-white/40 uppercase">
                          <span>FORGING LATENTS</span>
                          <span className="text-amber-500 font-bold">{renderProgress}%</span>
                        </div>
                        <div className="w-full bg-white/5 rounded-full h-1 relative overflow-hidden">
                          <div 
                            className="h-full bg-amber-500 rounded-full transition-all duration-300"
                            style={{ width: `${renderProgress}%` }}
                          />
                        </div>
                        <p className="text-[10px] text-amber-400/80 animate-pulse truncate font-bold">{renderStepText}</p>
                      </div>

                      <div className="w-full bg-[#0a0c12] border border-white/5 rounded p-3 text-left space-y-1 text-[8px] text-white/30 max-h-[85px] overflow-y-auto">
                        <p className="text-emerald-400 font-bold">✔ [VEO-3.1] API Client connection successful</p>
                        <p className="text-emerald-400">✔ [VEO-3.1] Parameter block verification parsed</p>
                        <p className="text-white/40">⚡ [VEO-3.1] Duration config: {selectedJob.durationSeconds}s @ {selectedJob.resolution}</p>
                        {selectedJob.firstFrame && <p className="text-purple-400 font-bold">▶ [KEYFRAME] Image 1 (FirstFrame) bound to timeline start</p>}
                        {selectedJob.lastFrame && <p className="text-purple-400 font-bold">▶ [KEYFRAME] Image 2 (LastFrame) bound to timeline end</p>}
                        <p className="animate-pulse text-white/50">⏳ [VEO-3.1] Generating frames via latent video diffusion model...</p>
                      </div>
                    </div>
                  ) : (
                    /* Failed */
                    <div className="flex flex-col items-center justify-center p-6 space-y-3 text-center text-red-400 bg-black/90 absolute inset-0 z-10">
                      <AlertTriangle className="w-10 h-10" />
                      <div className="space-y-1 max-w-sm">
                        <p className="font-bold font-mono uppercase text-xs tracking-wider">Video Render Failed</p>
                        <p className="text-[11px] text-red-400/70">{selectedJob.error || "The diffusion engine timed out."}</p>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                /* No selected video */
                <div className="flex flex-col items-center justify-center p-8 space-y-3 text-center text-white/20 select-none">
                  <Film className="w-12 h-12" />
                  <div className="space-y-1">
                    <p className="font-mono text-xs uppercase tracking-widest font-bold">Cinema Screen Idle</p>
                    <p className="text-[10px] max-w-xs text-white/30">Select a completed clip from the ledger below or forge a new visual prompt on the left to start screening.</p>
                  </div>
                </div>
              )}
            </div>

            {/* Projection screen sub-text */}
            <div className="bg-[#0a0c12] border-t border-white/5 px-4 py-2.5 text-[9px] font-mono text-white/30 flex justify-between items-center">
              <span className="flex items-center gap-1">
                <span className={`w-1.5 h-1.5 rounded-full ${selectedJob?.status === 'completed' ? 'bg-green-500 animate-pulse' : selectedJob?.status === 'pending' ? 'bg-amber-500 animate-spin' : 'bg-white/10'}`} />
                Status: {selectedJob?.status?.toUpperCase() || "IDLE"}
              </span>
              <span>Aspect: {selectedJob?.aspectRatio || "—"} • Resolution: {selectedJob?.resolution || "—"}</span>
            </div>

          </div>

          {/* Active Operations & Render queue ledger */}
          <div className="bg-[#0e111a] border border-white/10 rounded-2xl p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <h4 className="text-xs font-mono uppercase tracking-widest font-bold text-white/80">Cinematic Render Queue</h4>
              <span className="text-[10px] text-white/40 font-mono">Stored on Server</span>
            </div>

            <div className="space-y-2.5 max-h-[220px] overflow-y-auto scrollbar-none pr-1">
              {videoJobs.length === 0 ? (
                <div className="text-center py-8 text-white/20 font-mono text-[10px]">
                  <span>No visual renders in session yet. Describe a concept and hit Forge!</span>
                </div>
              ) : (
                videoJobs.map((job) => {
                  const isSelected = selectedJobId === job.id;
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => setSelectedJobId(job.id)}
                      className={`w-full text-left p-3 rounded-xl border font-mono text-[10px] transition-all flex justify-between items-center gap-4 cursor-pointer ${
                        isSelected 
                          ? 'bg-amber-500/10 border-amber-500 text-white' 
                          : 'bg-black/20 border-white/5 text-white/60 hover:bg-black/30 hover:border-white/10'
                      }`}
                    >
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded ${
                            job.status === 'completed' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/15' 
                              : job.status === 'pending' 
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/15 animate-pulse' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/15'
                          }`}>
                            {job.status.toUpperCase()}
                          </span>
                          <span className="text-white/30 text-[8px]">{new Date(job.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-[11px] text-white/80 font-bold truncate">"{job.prompt}"</p>
                        <p className="text-[9px] text-white/40">Specs: {job.aspectRatio} • {job.resolution} • {job.durationSeconds}s</p>
                      </div>

                      <div className="shrink-0">
                        {job.status === 'completed' ? (
                          <div className="w-6 h-6 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center text-green-400">
                            <Play className="w-3 h-3 fill-current" />
                          </div>
                        ) : job.status === 'pending' ? (
                          <RefreshCw className="w-4 h-4 text-amber-500 animate-spin" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        )}
                      </div>
                    </button>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
