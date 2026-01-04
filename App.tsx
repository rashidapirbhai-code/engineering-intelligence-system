
import React, { useState, useRef, useEffect } from 'react';
import { 
  Wrench, 
  Cpu, 
  Building, 
  FlaskConical, 
  Zap, 
  History, 
  Send, 
  Image as ImageIcon, 
  X, 
  Loader2, 
  CheckCircle2, 
  ChevronRight,
  Maximize2,
  Binary,
  AlertTriangle,
  Stethoscope,
  HelpCircle,
  ShieldAlert,
  Clock,
  ClipboardCheck,
  Calendar,
  Languages,
  ShoppingCart,
  ListOrdered,
  PackagePlus
} from 'lucide-react';
import { EngineeringField, ProblemSolution } from './types';
import { solveEngineeringProblem, extractBOM } from './services/geminiService';
import AnalysisChart from './components/AnalysisChart';

const FIELD_ICONS = {
  [EngineeringField.MECHANICAL]: <Wrench className="w-5 h-5" />,
  [EngineeringField.ELECTRICAL]: <Cpu className="w-5 h-5" />,
  [EngineeringField.CIVIL]: <Building className="w-5 h-5" />,
  [EngineeringField.CHEMICAL]: <FlaskConical className="w-5 h-5" />
};

// Helper to determine if a safety check string represents a real issue
const isSafetyCritical = (text?: string) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim().replace(/[.,]/g, ''); // Remove punctuation
  // Filter out common "no issue" responses
  if (['none', 'na', 'n/a', 'null', 'safe', 'no safety issues', 'no safety hazards'].includes(lower)) return false;
  // If it's very short, it's likely not a real protocol
  if (lower.length < 3) return false;
  return true;
};

const App: React.FC = () => {
  const [selectedField, setSelectedField] = useState<EngineeringField>(EngineeringField.MECHANICAL);
  const [query, setQuery] = useState('');
  const [isSolving, setIsSolving] = useState(false);
  const [isGeneratingBOM, setIsGeneratingBOM] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [history, setHistory] = useState<ProblemSolution[]>([]);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'solver' | 'history'>('solver');
  const [language, setLanguage] = useState<'en' | 'sw'>('en');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSolve = async (e?: React.FormEvent, forceLang?: 'en' | 'sw') => {
    if (e) e.preventDefault();
    if (!query.trim()) return;

    const targetLang = forceLang || language;
    setIsSolving(true);
    setError(null);
    setSolution(null);

    try {
      const result = await solveEngineeringProblem(query, selectedField, imagePreview || undefined, targetLang);
      
      const newSolution: ProblemSolution = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        field: selectedField,
        query,
        image: imagePreview || undefined,
        ...result,
      };

      setSolution(newSolution);
      setHistory(prev => [newSolution, ...prev]);
    } catch (err: any) {
      setError(err.message || 'Operational disruption. Could not connect to Controller.');
    } finally {
      setIsSolving(false);
    }
  };

  const handleGenerateBOM = async () => {
    if (!solution || isGeneratingBOM) return;

    setIsGeneratingBOM(true);
    try {
      const bomData = await extractBOM(solution.analysis, language);
      const updatedSolution = { ...solution, billOfMaterials: bomData };
      setSolution(updatedSolution);
      setHistory(prev => prev.map(item => item.id === solution.id ? updatedSolution : item));
    } catch (err: any) {
      setError(err.message || 'BOM Extraction failed.');
    } finally {
      setIsGeneratingBOM(false);
    }
  };

  const toggleLanguage = () => {
    const nextLang = language === 'en' ? 'sw' : 'en';
    setLanguage(nextLang);
    if (solution) {
      handleSolve(undefined, nextLang);
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-zinc-200">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-3 bg-zinc-900/95 backdrop-blur-md border-b border-zinc-800 z-10 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative h-12 w-12 bg-white rounded-lg p-0.5 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            <img 
              src="https://media.licdn.com/dms/image/v2/C4E0BAQE_VjR_vLzF_Q/company-logo_200_200/company-logo_200_200/0/1630646270420?e=2147483647&v=beta&t=7u7u0-6E1r_X_Y2N_p1_Y_vL_W_f_l_u_p_p_u_m_m_m" 
              alt="Burhani Power Logo" 
              className="h-full w-full object-contain"
            />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-white uppercase italic leading-none">
              Burhani <span className="text-emerald-500">Power</span>
            </h1>
            <p className="text-[10px] text-zinc-400 font-mono tracking-widest uppercase mt-0.5">
              Project Operations Controller
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <nav className="flex items-center gap-1 bg-zinc-800/40 p-1 rounded-full border border-zinc-700/50">
            <button 
              onClick={() => setActiveTab('solver')}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'solver' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {language === 'en' ? 'Ops Console' : 'Console ya Operesheni'}
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              className={`px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${activeTab === 'history' ? 'bg-emerald-600 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-200'}`}
            >
              {language === 'en' ? 'Work Log' : 'Rekodi za Kazi'}
            </button>
          </nav>

          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-4 py-2 bg-zinc-800/60 border border-zinc-700 rounded-full text-xs font-bold uppercase tracking-widest hover:bg-emerald-600/20 hover:border-emerald-500/50 transition-all text-emerald-400"
          >
            <Languages size={14} />
            {language === 'en' ? 'Translate to Swahili' : 'Tafsiri kwa Kiingereza'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex flex-col items-end gap-0.5 mr-2">
            <span className="text-[10px] font-mono text-emerald-500 uppercase font-bold animate-pulse">Controller Online</span>
            <span className="text-[9px] font-mono text-zinc-500 uppercase tracking-tighter">Ops Center Secure</span>
          </div>
          <div className="h-8 w-px bg-zinc-800"></div>
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-900/20 border border-emerald-500/30">
            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-12 bg-[#09090b]">
        {activeTab === 'solver' ? (
          <div className="max-w-6xl mx-auto space-y-8 pb-12">
            {/* Input Section */}
            <section className="bg-zinc-900/60 rounded-3xl border border-zinc-800 p-6 md:p-8 shadow-2xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                <Maximize2 size={120} className="text-emerald-500" />
              </div>
              
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3">
                  {Object.values(EngineeringField).map((field) => (
                    <button
                      key={field}
                      onClick={() => setSelectedField(field)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
                        selectedField === field 
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' 
                        : 'bg-zinc-800/40 border-zinc-700 text-zinc-400 hover:border-zinc-500'
                      }`}
                    >
                      {FIELD_ICONS[field]}
                      {field}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSolve} className="space-y-4">
                  <div className="relative group">
                    <textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder={language === 'en' ? "Report technical issue or maintenance request. Include specific assets and failure modes..." : "Ripoti tatizo la kiufundi au ombi la matengenezo. Jumuisha rasilimali maalum na hali za hitilafu..."}
                      className="w-full h-40 bg-zinc-950/80 border border-zinc-800 rounded-2xl p-6 text-zinc-100 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all resize-none font-mono text-sm leading-relaxed"
                    />
                    <div className="absolute bottom-4 right-4 flex items-center gap-3">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                      {imagePreview && (
                        <div className="relative group/img">
                          <img src={imagePreview} className="h-10 w-10 object-cover rounded-lg border border-zinc-700" alt="Preview" />
                          <button 
                            type="button"
                            onClick={() => setImagePreview(null)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all border border-zinc-700 shadow-sm"
                        title="Upload WO attachment or site photo"
                      >
                        <ImageIcon size={20} />
                      </button>
                      <button
                        type="submit"
                        disabled={isSolving || !query.trim()}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-xl font-semibold shadow-lg shadow-emerald-900/30 transition-all uppercase tracking-tighter"
                      >
                        {isSolving ? (
                          <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            {language === 'en' ? 'Processing...' : 'Inachakata...'}
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4" />
                            {language === 'en' ? 'Request Fix' : 'Omba Marekebisho'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            </section>

            {/* Error Message */}
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 p-4 rounded-xl flex items-center gap-3 text-red-400">
                <X className="w-5 h-5" />
                <span className="text-sm font-medium">{error}</span>
              </div>
            )}

            {/* Loading Indicator */}
            {isSolving && (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in zoom-in duration-500">
                <div className="w-20 h-20 relative flex items-center justify-center mb-8">
                   <div className="absolute inset-0 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
                   <img 
                    src="https://media.licdn.com/dms/image/v2/C4E0BAQE_VjR_vLzF_Q/company-logo_200_200/company-logo_200_200/0/1630646270420?e=2147483647&v=beta&t=7u7u0-6E1r_X_Y2N_p1_Y_vL_W_f_l_u_p_p_u_m_m_m" 
                    alt="Logo" 
                    className="w-10 h-10 object-contain grayscale opacity-50"
                  />
                </div>
                <h3 className="text-xl font-bold text-zinc-200 mb-2 font-mono uppercase tracking-widest italic text-center">
                  {language === 'en' ? 'Controller analyzing project parameters' : 'Kidhibiti kinachambua vigezo vya mradi'}
                </h3>
                <p className="text-zinc-400 text-sm max-w-md text-center font-mono uppercase text-[10px]">
                  {language === 'en' ? 'Verifying engineering fix, estimating budget, and drafting follow-up schedules...' : 'Kuhakiki marekebisho ya kiufundi, kukadiria bajeti, na kuandaa ratiba za ufuatiliaji...'}
                </p>
              </div>
            )}

            {/* Result Section */}
            {solution && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-10 duration-700">
                {/* Main Solution Column */}
                <div className="lg:col-span-2 space-y-6">
                  {isSafetyCritical(solution.safetyCheck) && (
                    <div className="bg-red-600/10 border border-red-500/50 p-6 rounded-3xl flex items-start gap-4 text-red-400 shadow-[0_0_20px_rgba(239,68,68,0.15)] animate-pulse">
                      <ShieldAlert className="w-8 h-8 shrink-0 mt-1" />
                      <div>
                        <h3 className="font-bold text-lg mb-1 uppercase tracking-tighter">{language === 'en' ? 'Safety Protocol Required' : 'Itifaki ya Usalama Inahitajika'}</h3>
                        <p className="text-sm font-mono leading-relaxed">{solution.safetyCheck}</p>
                      </div>
                    </div>
                  )}

                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-8 backdrop-blur-sm shadow-2xl">
                    <div className="flex items-center justify-between mb-8 border-b border-zinc-800 pb-6">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                        <h2 className="text-2xl font-bold text-white uppercase tracking-tighter italic">{language === 'en' ? 'Engineering Fix' : 'Marekebisho ya Kiufundi'}</h2>
                      </div>
                      <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-full border border-zinc-700">
                        <span className="text-xs font-mono text-zinc-400 uppercase tracking-tighter text-[9px]">{language === 'en' ? 'Fix Integrity:' : 'Uadilifu wa Marekebisho:'}</span>
                        <span className="text-xs font-mono font-bold text-emerald-400">{(solution.confidence * 100).toFixed(1)}%</span>
                      </div>
                    </div>

                    <div className="prose prose-invert max-w-none">
                      <div className="mb-8">
                        <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-3">{language === 'en' ? 'Analysis Summary' : 'Muhtasari wa Uchambuzi'}</h4>
                        <p className="text-zinc-300 leading-relaxed italic border-l-2 border-emerald-500 pl-4 bg-emerald-950/5 py-3">
                          {solution.analysis}
                        </p>
                      </div>

                      {solution.diagnosticTree && solution.diagnosticTree.length > 0 && (
                        <div className="mb-8 bg-zinc-950/60 rounded-2xl p-6 border border-zinc-800 shadow-inner">
                          <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                            <Stethoscope size={14} />
                            {language === 'en' ? 'Controller Diagnostics' : 'Utambuzi wa Kidhibiti'}
                          </h4>
                          <div className="space-y-4">
                            {solution.diagnosticTree.map((node, i) => (
                              <div key={i} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800">
                                  <span className="text-[10px] text-zinc-500 uppercase font-bold block mb-1 tracking-tighter">{language === 'en' ? 'Root Cause Hypothesis' : 'Dhana ya Sababu ya Msingi'}</span>
                                  <p className="text-xs text-zinc-300">{node.hypothesis}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-emerald-900/10 border border-emerald-900/30">
                                  <span className="text-[10px] text-emerald-500 uppercase font-bold block mb-1 tracking-tighter">{language === 'en' ? 'Field Verification Test' : 'Jaribio la Uhakiki wa Nyanjani'}</span>
                                  <p className="text-xs text-zinc-200">{node.test}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {solution.steps.length > 0 && (
                        <div className="mb-8">
                          <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">{language === 'en' ? 'Implementation Procedure' : 'Utaratibu wa Utekelezaji'}</h4>
                          <div className="space-y-4">
                            {solution.steps.map((step, idx) => (
                              <div key={idx} className="flex gap-4 group">
                                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-mono text-zinc-400 border border-zinc-700 group-hover:bg-emerald-900/30 group-hover:border-emerald-500/50 transition-all shadow-sm">
                                  {String(idx + 1).padStart(2, '0')}
                                </div>
                                <div className="flex-1 bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 font-mono text-sm text-zinc-300 group-hover:border-zinc-700 transition-colors">
                                  {step}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* BOM Section */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] flex items-center gap-2">
                            <ShoppingCart size={14} className="text-emerald-500" />
                            {language === 'en' ? 'Bill of Materials (Procurement)' : 'Orodha ya Nyenzo (Ununuzi)'}
                          </h4>
                          {!solution.billOfMaterials && (
                            <button
                              onClick={handleGenerateBOM}
                              disabled={isGeneratingBOM}
                              className="flex items-center gap-2 px-4 py-1.5 rounded-xl bg-emerald-600/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase hover:bg-emerald-600/20 transition-all disabled:opacity-50"
                            >
                              {isGeneratingBOM ? (
                                <>
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                  {language === 'en' ? 'Extracting...' : 'Inasoma...'}
                                </>
                              ) : (
                                <>
                                  <PackagePlus size={14} />
                                  {language === 'en' ? 'Generate BOM' : 'Tengeneza Orodha'}
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {solution.billOfMaterials && solution.billOfMaterials.length > 0 ? (
                          <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-inner animate-in fade-in slide-in-from-top-4 duration-500">
                            <table className="w-full text-left text-xs font-mono">
                              <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                  <th className="p-4 text-emerald-500 uppercase tracking-tighter">{language === 'en' ? 'Item' : 'Bidhaa'}</th>
                                  <th className="p-4 text-emerald-500 uppercase tracking-tighter">{language === 'en' ? 'Specification' : 'Maelezo'}</th>
                                  <th className="p-4 text-emerald-500 uppercase tracking-tighter">{language === 'en' ? 'Qty' : 'Kiasi'}</th>
                                  <th className="p-4 text-emerald-500 uppercase tracking-tighter">{language === 'en' ? 'Priority' : 'Kipaumbele'}</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-zinc-800">
                                {solution.billOfMaterials.map((item, i) => (
                                  <tr key={i} className="hover:bg-emerald-500/5 transition-colors">
                                    <td className="p-4 text-zinc-200 font-bold">{item.itemName}</td>
                                    <td className="p-4 text-zinc-400 italic">{item.specification}</td>
                                    <td className="p-4 text-emerald-400 font-bold">{item.quantity}</td>
                                    <td className="p-4">
                                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                                        item.priority === 'High' ? 'bg-red-500/20 text-red-500 border border-red-500/30' :
                                        item.priority === 'Medium' ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' :
                                        'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                                      }`}>
                                        {item.priority}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          !isGeneratingBOM && (
                            <div className="p-8 text-center bg-zinc-950/40 rounded-2xl border border-zinc-800 border-dashed">
                              <p className="text-zinc-500 text-[10px] font-mono uppercase tracking-widest">
                                {language === 'en' ? 'No procurement list found. Generate to view items.' : 'Hakuna orodha ya ununuzi. Tengeneza ili kuona bidhaa.'}
                              </p>
                            </div>
                          )
                        )}
                      </div>

                      <div className="bg-emerald-600/10 border border-emerald-500/30 rounded-2xl p-6 shadow-[inset_0_0_20px_rgba(16,185,129,0.05)] border-l-4">
                        <h4 className="text-emerald-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{language === 'en' ? 'Technical Verdict' : 'Uamuzi wa Kiufundi'}</h4>
                        <p className="text-xl font-bold text-white font-mono leading-tight tracking-tighter">
                          {solution.finalResult}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Follow-up Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
                      <h3 className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Calendar size={14} />
                        {language === 'en' ? '24-Hour Checklist' : 'Orodha ya Masaa 24'}
                      </h3>
                      <ul className="space-y-3">
                        {solution.followUp24h?.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
                      <h3 className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mb-4 flex items-center gap-2">
                        <History size={14} />
                        {language === 'en' ? '7-Day Verification' : 'Uhakiki wa Siku 7'}
                      </h3>
                      <ul className="space-y-3">
                        {solution.followUp7d?.map((item, i) => (
                          <li key={i} className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 text-xs text-zinc-300 font-mono">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Sidebar Project Controls */}
                <div className="space-y-6">
                  {/* Scope & Budget Section */}
                  <div className="bg-zinc-900/60 border border-emerald-500/20 rounded-3xl p-6 backdrop-blur-sm shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <ClipboardCheck size={40} className="text-emerald-500" />
                    </div>
                    <h3 className="text-emerald-500 text-[10px] font-bold uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">
                      {language === 'en' ? 'Project Controls' : 'Udhibiti wa Mradi'}
                    </h3>
                    
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                          <Maximize2 size={14} />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">{language === 'en' ? 'Scope Verification' : 'Uhakiki wa Upeo'}</span>
                        </div>
                        <p className="text-xs text-zinc-300 font-mono bg-zinc-950/60 p-3 rounded-xl border border-zinc-800 italic">
                          {solution.projectScopeConfirm || (language === 'en' ? "Verify against WO before proceeding." : "Hakiki dhidi ya WO kabla ya kuendelea.")}
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center gap-2 text-zinc-400 mb-2">
                          <Clock size={14} />
                          <span className="text-[10px] uppercase font-bold tracking-tighter">{language === 'en' ? 'Budget Estimate (Time)' : 'Makadirio ya Bajeti (Muda)'}</span>
                        </div>
                        <p className="text-lg font-bold text-emerald-400 font-mono px-3">
                          {solution.timeToComplete || (language === 'en' ? "Calculating..." : "Inakokotoa...")}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Parameter Register */}
                  {Object.keys(solution.variables).length > 0 && (
                    <div className="bg-zinc-900/60 border border-zinc-800 rounded-3xl p-6 backdrop-blur-sm">
                      <h3 className="text-zinc-500 text-[10px] font-bold uppercase tracking-widest mb-6 flex items-center gap-2">
                        <Binary size={14} className="text-emerald-500" />
                        {language === 'en' ? 'Asset Register' : 'Sajili ya Rasilimali'}
                      </h3>
                      <div className="space-y-3">
                        {Object.entries(solution.variables).map(([key, val]) => (
                          <div key={key} className="flex flex-col gap-1 p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 hover:border-emerald-500/30 transition-all shadow-sm">
                            <span className="text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-tighter">{key}</span>
                            <span className="text-zinc-300 text-xs font-mono">{val}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <AnalysisChart 
                    title={language === 'en' ? "Estimated Downtime Impact" : "Kadirio la Athari za Muda wa Kupungua"}
                    data={[
                      { name: language === 'en' ? 'Repair' : 'Matengenezo', value: 45 },
                      { name: language === 'en' ? 'Verify' : 'Hakiki', value: 20 },
                      { name: language === 'en' ? 'Return' : 'Rejea', value: 35 },
                    ]} 
                  />

                  {/* Action Bar */}
                  <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 flex justify-around shadow-lg">
                     <button className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-2 group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-emerald-500/50 transition-colors">
                          <ChevronRight className="rotate-90" />
                        </div>
                        WO PDF
                     </button>
                     <button className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-2 group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-emerald-500/50 transition-colors">
                          <Binary size={18} />
                        </div>
                        SCADA
                     </button>
                     <button className="text-[10px] font-bold uppercase tracking-tighter text-zinc-400 hover:text-emerald-400 transition-all flex flex-col items-center gap-2 group">
                        <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700 group-hover:border-emerald-500/50 transition-colors">
                          <Cpu size={18} />
                        </div>
                        ERP
                     </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto space-y-6 pb-12">
            <h2 className="text-2xl font-bold text-white mb-8 font-mono tracking-tighter uppercase italic border-b border-zinc-800 pb-4">
              {language === 'en' ? 'Ops History Log' : 'Rekodi ya Historia ya Operesheni'}
            </h2>
            {history.length === 0 ? (
              <div className="text-center py-20 bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl">
                <History className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
                <p className="text-zinc-500 font-mono uppercase text-[10px] tracking-widest">{language === 'en' ? 'Registry Clear // No logged interventions' : 'Daftari Safi // Hakuna uingiliaji uliorekodiwa'}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {history.map((item) => (
                  <div key={item.id} className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-6 hover:border-emerald-500/50 transition-all cursor-pointer group shadow-sm backdrop-blur-sm">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-0.5 rounded-md bg-emerald-900/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/20">
                            {item.field}
                          </span>
                          <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">
                            WO ID: {item.id.slice(-6)} // {new Date(item.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-zinc-100 font-medium line-clamp-2 mb-3 font-mono text-sm leading-relaxed group-hover:text-emerald-400 transition-colors">
                          {item.query}
                        </h3>
                        <div className="flex items-center gap-4 text-xs text-zinc-500">
                          {item.timeToComplete && (
                            <div className="flex items-center gap-1.5 text-emerald-500 font-bold uppercase text-[9px] font-mono">
                              <Clock size={10} />
                              {item.timeToComplete} Est.
                            </div>
                          )}
                          <div className="flex items-center gap-1.5 group-hover:text-emerald-500 transition-colors text-[10px] font-mono">
                            <CheckCircle2 size={10} />
                            {item.steps.length} {language === 'en' ? 'Task Steps' : 'Hatua za Kazi'}
                          </div>
                          {isSafetyCritical(item.safetyCheck) && (
                            <div className="flex items-center gap-1.5 text-red-500 font-bold uppercase text-[9px]">
                              <ShieldAlert size={10} />
                              {language === 'en' ? 'Safety Critical' : 'Muhimu kwa Usalama'}
                            </div>
                          )}
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setSolution(item);
                          setSelectedField(item.field);
                          setQuery(item.query);
                          setImagePreview(item.image || null);
                          setActiveTab('solver');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-zinc-800 rounded-lg text-zinc-400 hover:text-emerald-400 shadow-sm border border-zinc-700"
                      >
                        <ChevronRight />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer Branding */}
      <footer className="px-8 py-3 bg-zinc-950 border-t border-zinc-800 text-[10px] font-mono flex items-center justify-between text-zinc-600 uppercase tracking-widest">
        <span>© 2024 Burhani Power Engineers Ltd. // Operations Controller v5.0</span>
        <div className="flex gap-6">
          <span className="text-emerald-700 font-bold tracking-tighter">Ops Sync: Active</span>
          <span className="hidden sm:inline">Resource Optimization: Enabled</span>
          <span className="text-zinc-400 font-bold">WO-9912-CORE</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
