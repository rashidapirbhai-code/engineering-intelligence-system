
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
  PackagePlus,
  ArrowRight,
  FileText,
  Activity
} from 'lucide-react';
import { EngineeringField, ProblemSolution } from './types';
import { solveEngineeringProblem, extractBOM } from './services/geminiService';
import AnalysisChart from './components/AnalysisChart';

const FIELD_ICONS = {
  [EngineeringField.MECHANICAL]: <Wrench className="w-4 h-4" />,
  [EngineeringField.ELECTRICAL]: <Cpu className="w-4 h-4" />,
  [EngineeringField.CIVIL]: <Building className="w-4 h-4" />,
  [EngineeringField.CHEMICAL]: <FlaskConical className="w-4 h-4" />
};

// Helper to determine if a safety check string represents a real issue
const isSafetyCritical = (text?: string) => {
  if (!text) return false;
  const lower = text.toLowerCase().trim();
  
  // Immediate dismissal of common non-risk indicators
  if (['none', 'n/a', 'na', 'null', 'nil', '-', '.'].includes(lower)) return false;

  // Remove punctuation for phrase matching
  const cleanText = lower.replace(/[.,\-:;]/g, '');
  
  // List of phrases indicating no specific risk
  const noRiskPhrases = [
    'no safety issues', 
    'no safety hazards', 
    'no hazards detected',
    'no specific safety protocols',
    'none required',
    'not applicable',
    'safe to proceed',
    'standard precautions', 
    'standard safety protocols apply'
  ];

  if (noRiskPhrases.some(phrase => cleanText.includes(phrase.replace(/[.,\-:;]/g, '')))) return false;

  // Check if it starts with negative confirmation
  if (lower.startsWith('no safety') || lower.startsWith('none')) return false;

  // If text is very short (e.g. "Safe"), assume no protocol needed
  if (cleanText.length < 5) return false;

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
    <div className="flex flex-col h-screen overflow-hidden text-slate-200">
      {/* Professional Header */}
      <header className="flex items-center justify-between px-6 py-3 bg-slate-900/80 backdrop-blur-md border-b border-slate-800 z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded p-1">
             <img 
              src="https://media.licdn.com/dms/image/v2/C4E0BAQE_VjR_vLzF_Q/company-logo_200_200/company-logo_200_200/0/1630646270420?e=2147483647&v=beta&t=7u7u0-6E1r_X_Y2N_p1_Y_vL_W_f_l_u_p_p_u_m_m_m" 
              alt="OmniENG53 Logo" 
              className="h-8 w-8 object-contain"
            />
          </div>
          <div className="flex flex-col">
            <h1 className="text-lg font-bold tracking-tight text-white leading-none">
              OmniENG53
            </h1>
            <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">
              Operations Intelligence
            </span>
          </div>
        </div>

        <div className="flex items-center bg-slate-800/50 p-1 rounded-lg border border-slate-700/50">
          <button 
            onClick={() => setActiveTab('solver')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'solver' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {language === 'en' ? 'Diagnostic Console' : 'Jopo la Utambuzi'}
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === 'history' ? 'bg-slate-700 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200'}`}
          >
            {language === 'en' ? 'Intervention Log' : 'Kumbukumbu'}
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={toggleLanguage}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white transition-colors"
          >
            <Languages size={14} />
            <span className="uppercase">{language}</span>
          </button>
          
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isSolving ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
              {isSolving ? 'Processing' : 'System Ready'}
            </span>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto bg-transparent">
        <div className="max-w-7xl mx-auto px-6 py-8">
          
          {activeTab === 'solver' ? (
            <div className="space-y-8 pb-12">
              
              {/* Professional Input Form */}
              <section className="glass-panel rounded-xl p-1 shadow-lg">
                <div className="bg-slate-900/50 rounded-lg p-6">
                  <div className="flex flex-col md:flex-row gap-6">
                    
                    {/* Field Selector - Vertical on Desktop */}
                    <div className="flex md:flex-col gap-2 min-w-[140px]">
                      <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 px-1">Discipline</label>
                      {Object.values(EngineeringField).map((field) => (
                        <button
                          key={field}
                          onClick={() => setSelectedField(field)}
                          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium border transition-all text-left ${
                            selectedField === field 
                            ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-400' 
                            : 'bg-transparent border-transparent text-slate-400 hover:bg-slate-800'
                          }`}
                        >
                          {FIELD_ICONS[field]}
                          {field}
                        </button>
                      ))}
                    </div>

                    {/* Main Input Area */}
                    <div className="flex-1 space-y-4">
                      <form onSubmit={handleSolve} className="flex flex-col h-full">
                         <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Technical Description</label>
                         <div className="relative flex-1">
                          <textarea
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={language === 'en' 
                              ? "Describe the technical fault, asset ID, and observed symptoms..." 
                              : "Elezea hitilafu ya kiufundi, kitambulisho cha rasilimali, na dalili zilizoonekana..."}
                            className="w-full min-h-[120px] bg-slate-950 border border-slate-700 rounded-lg p-4 text-slate-200 text-sm placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 focus:border-emerald-500 transition-all font-sans resize-y"
                          />
                          
                          {/* Attachments Preview */}
                          {imagePreview && (
                            <div className="absolute bottom-3 left-3 flex items-center gap-2 bg-slate-900 pr-2 rounded-md border border-slate-700">
                               <img src={imagePreview} className="h-8 w-8 object-cover rounded-l-md" alt="Preview" />
                               <span className="text-[10px] text-slate-400">Attached</span>
                               <button 
                                type="button"
                                onClick={() => setImagePreview(null)}
                                className="text-slate-500 hover:text-red-400"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between mt-4">
                           <div className="flex items-center gap-2">
                              <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleImageUpload}
                              />
                              <button
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                                className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-slate-800 text-slate-400 text-xs hover:bg-slate-700 hover:text-slate-200 transition-colors border border-slate-700"
                              >
                                <ImageIcon size={14} />
                                {language === 'en' ? 'Attach Media' : 'Ambatanisha Picha'}
                              </button>
                           </div>

                           <button
                              type="submit"
                              disabled={isSolving || !query.trim()}
                              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-md text-sm font-medium shadow-sm transition-all"
                            >
                              {isSolving ? (
                                <>
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                  {language === 'en' ? 'Analyzing...' : 'Inachakata...'}
                                </>
                              ) : (
                                <>
                                  {language === 'en' ? 'Run Diagnostics' : 'Anzisha Utambuzi'}
                                  <ArrowRight className="w-4 h-4" />
                                </>
                              )}
                            </button>
                        </div>
                      </form>
                    </div>
                  </div>
                </div>
              </section>

              {/* Error Banner */}
              {error && (
                <div className="bg-red-500/10 border-l-4 border-red-500 p-4 rounded-r-md flex items-center gap-3 text-red-400">
                  <AlertTriangle className="w-5 h-5" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}

              {/* Solution View */}
              {solution && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4 duration-500">
                  
                  {/* Left Column: Analysis & Steps */}
                  <div className="lg:col-span-2 space-y-6">
                    
                    {/* Safety Banner - Only if Critical */}
                    {isSafetyCritical(solution.safetyCheck) && (
                      <div className="bg-amber-950/40 border border-amber-500/30 rounded-lg overflow-hidden">
                        <div className="bg-amber-600/20 px-4 py-2 border-b border-amber-500/30 flex items-center gap-2">
                           <ShieldAlert className="w-4 h-4 text-amber-500" />
                           <h3 className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                             {language === 'en' ? 'Mandatory Safety Protocols' : 'Itifaki za Usalama'}
                           </h3>
                        </div>
                        <div className="p-4">
                           <p className="text-sm text-amber-100/90 leading-relaxed font-medium">
                             {solution.safetyCheck}
                           </p>
                        </div>
                      </div>
                    )}

                    {/* Main Technical Report Card */}
                    <div className="glass-panel rounded-xl overflow-hidden">
                      <div className="border-b border-slate-800 bg-slate-900/50 px-6 py-4 flex items-center justify-between">
                         <div className="flex items-center gap-3">
                           <Activity className="w-5 h-5 text-emerald-500" />
                           <h2 className="text-base font-semibold text-slate-100">
                             {language === 'en' ? 'Technical Assessment' : 'Tathmini ya Kiufundi'}
                           </h2>
                         </div>
                         <div className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded text-[10px] font-mono font-bold text-emerald-400">
                           CONFIDENCE: {(solution.confidence * 100).toFixed(0)}%
                         </div>
                      </div>

                      <div className="p-6 space-y-8">
                        
                        {/* Summary */}
                        <div>
                          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Analysis</h4>
                          <p className="text-slate-300 text-sm leading-6 border-l-2 border-slate-700 pl-4">
                            {solution.analysis}
                          </p>
                        </div>

                        {/* Diagnostic Tree */}
                        {solution.diagnosticTree && solution.diagnosticTree.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                               <Stethoscope size={12} /> Diagnostic Logic
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                               {solution.diagnosticTree.map((node, i) => (
                                 <div key={i} className="bg-slate-900/50 border border-slate-800 p-3 rounded-lg">
                                    <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Hypothesis</div>
                                    <div className="text-xs text-slate-300 mb-2">{node.hypothesis}</div>
                                    <div className="text-[10px] text-emerald-500 font-bold uppercase mb-1">Verification</div>
                                    <div className="text-xs text-slate-300">{node.test}</div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        {/* Action Plan */}
                        {solution.steps.length > 0 && (
                          <div>
                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Remediation Steps</h4>
                            <div className="space-y-0">
                               {solution.steps.map((step, idx) => (
                                 <div key={idx} className="flex gap-4 p-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 transition-colors rounded-lg">
                                    <div className="font-mono text-slate-500 text-xs font-bold pt-0.5">
                                      {String(idx + 1).padStart(2, '0')}
                                    </div>
                                    <div className="text-sm text-slate-300">
                                      {step}
                                    </div>
                                 </div>
                               ))}
                            </div>
                          </div>
                        )}

                        {/* BOM Section */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Bill of Materials</h4>
                              {!solution.billOfMaterials && (
                                <button
                                  onClick={handleGenerateBOM}
                                  disabled={isGeneratingBOM}
                                  className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1 disabled:opacity-50"
                                >
                                  {isGeneratingBOM ? <Loader2 size={12} className="animate-spin"/> : <PackagePlus size={12} />}
                                  {language === 'en' ? 'Generate List' : 'Tengeneza Orodha'}
                                </button>
                              )}
                            </div>

                            {solution.billOfMaterials && solution.billOfMaterials.length > 0 ? (
                              <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-900/50">
                                <table className="w-full text-left text-xs">
                                  <thead>
                                    <tr className="bg-slate-950 border-b border-slate-800 text-slate-500 font-semibold uppercase">
                                      <th className="p-3 pl-4">Item</th>
                                      <th className="p-3">Spec</th>
                                      <th className="p-3">Qty</th>
                                      <th className="p-3">Priority</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-800/50">
                                    {solution.billOfMaterials.map((item, i) => (
                                      <tr key={i} className="hover:bg-slate-800/50 transition-colors">
                                        <td className="p-3 pl-4 font-medium text-slate-200">{item.itemName}</td>
                                        <td className="p-3 text-slate-400 font-mono text-[10px]">{item.specification}</td>
                                        <td className="p-3 text-slate-300 font-mono">{item.quantity}</td>
                                        <td className="p-3">
                                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide border ${
                                            item.priority === 'High' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                                            item.priority === 'Medium' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                                            'bg-slate-700/30 text-slate-400 border-slate-600/30'
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
                                !isGeneratingBOM && <div className="p-4 bg-slate-900/30 border border-slate-800 border-dashed rounded text-center text-xs text-slate-500">No BOM generated yet.</div>
                            )}
                        </div>

                      </div>
                    </div>

                    {/* Verdict Card */}
                    <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-6">
                        <h4 className="text-xs font-bold text-emerald-500 uppercase tracking-wider mb-2">
                           {language === 'en' ? 'Final Determination' : 'Uamuzi wa Mwisho'}
                        </h4>
                        <p className="text-lg font-medium text-emerald-100">
                          {solution.finalResult}
                        </p>
                    </div>

                  </div>

                  {/* Right Column: Project Data */}
                  <div className="space-y-6">
                    
                    {/* Project Controls Card */}
                    <div className="glass-panel rounded-xl p-5 space-y-6">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <ClipboardCheck className="w-4 h-4 text-slate-400" />
                        <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Project Controls</h3>
                      </div>

                      <div className="space-y-4">
                        <div className="bg-slate-900/50 rounded p-3 border border-slate-800">
                          <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Scope Check</span>
                          <p className="text-xs text-slate-300 leading-tight">
                            {solution.projectScopeConfirm || "Pending verification."}
                          </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                           <div className="bg-slate-900/50 rounded p-3 border border-slate-800">
                             <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1 flex items-center gap-1"><Clock size={10}/> Est. Time</span>
                             <span className="text-sm font-mono text-emerald-400 font-medium">
                               {solution.timeToComplete || "--"}
                             </span>
                           </div>
                           <div className="bg-slate-900/50 rounded p-3 border border-slate-800">
                             <span className="text-[10px] text-slate-500 uppercase font-bold block mb-1">Steps</span>
                             <span className="text-sm font-mono text-slate-300 font-medium">
                               {solution.steps.length}
                             </span>
                           </div>
                        </div>
                      </div>
                    </div>

                    {/* Chart */}
                    <AnalysisChart 
                      title={language === 'en' ? "Resource Impact" : "Athari za Rasilimali"}
                      data={[
                        { name: 'Fix', value: 45 },
                        { name: 'Test', value: 20 },
                        { name: 'Doc', value: 35 },
                      ]} 
                    />

                    {/* Asset Data */}
                    {Object.keys(solution.variables).length > 0 && (
                      <div className="glass-panel rounded-xl p-5">
                         <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                            <Binary className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wide">Detected Assets</h3>
                          </div>
                          <div className="space-y-2">
                            {Object.entries(solution.variables).map(([key, val]) => (
                              <div key={key} className="flex justify-between items-center text-xs border-b border-slate-800/50 pb-2 last:border-0">
                                 <span className="text-slate-500 font-mono">{key}</span>
                                 <span className="text-slate-300 font-medium text-right">{val}</span>
                              </div>
                            ))}
                          </div>
                      </div>
                    )}

                    {/* Checklists */}
                    <div className="glass-panel rounded-xl p-5 space-y-6">
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">24h Follow-up</h4>
                          <ul className="space-y-2">
                             {solution.followUp24h?.map((item, i) => (
                               <li key={i} className="flex gap-2 text-xs text-slate-400">
                                 <span className="w-1 h-1 bg-emerald-500 rounded-full mt-1.5 shrink-0" />
                                 {item}
                               </li>
                             ))}
                          </ul>
                        </div>
                        <div>
                          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">7-Day Verification</h4>
                          <ul className="space-y-2">
                             {solution.followUp7d?.map((item, i) => (
                               <li key={i} className="flex gap-2 text-xs text-slate-400">
                                 <span className="w-1 h-1 bg-slate-500 rounded-full mt-1.5 shrink-0" />
                                 {item}
                               </li>
                             ))}
                          </ul>
                        </div>
                    </div>

                  </div>
                </div>
              )}
            </div>
          ) : (
            // History View
            <div className="max-w-4xl mx-auto pb-12">
               <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-semibold text-white">Operational History</h2>
                  <span className="text-xs text-slate-500">{history.length} records found</span>
               </div>
               
               {history.length === 0 ? (
                 <div className="text-center py-20 bg-slate-900/30 border border-dashed border-slate-800 rounded-xl">
                   <History className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                   <p className="text-slate-500 text-sm">No intervention logs available.</p>
                 </div>
               ) : (
                 <div className="space-y-3">
                   {history.map((item) => (
                     <div key={item.id} className="bg-slate-900/50 border border-slate-800 rounded-lg p-5 hover:border-emerald-500/30 transition-all cursor-pointer group"
                          onClick={() => {
                            setSolution(item);
                            setSelectedField(item.field);
                            setQuery(item.query);
                            setImagePreview(item.image || null);
                            setActiveTab('solver');
                          }}
                     >
                       <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                             <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700 uppercase">{item.field}</span>
                             <span className="text-[10px] text-slate-500 font-mono">ID: {item.id.slice(-8)}</span>
                          </div>
                          <span className="text-[10px] text-slate-500">{new Date(item.timestamp).toLocaleDateString()}</span>
                       </div>
                       <h3 className="text-slate-200 font-medium text-sm mb-3 line-clamp-1">{item.query}</h3>
                       <div className="flex items-center gap-4 text-xs text-slate-500">
                          <span className="flex items-center gap-1"><Clock size={12}/> {item.timeToComplete || 'N/A'}</span>
                          {isSafetyCritical(item.safetyCheck) && <span className="flex items-center gap-1 text-amber-500"><ShieldAlert size={12}/> Risk Identified</span>}
                       </div>
                     </div>
                   ))}
                 </div>
               )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
