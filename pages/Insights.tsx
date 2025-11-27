import React, { useState } from 'react';
import { generateAIInsights } from '../services/gemini';
import { storageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Sparkles, FileText, Loader2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const Insights: React.FC = () => {
    const [plan, setPlan] = useState<string>('');
    const [loading, setLoading] = useState(false);
    const { t, language } = useLanguage();

    const handleGenerate = async () => {
        setLoading(true);
        const logs = storageService.getLogs();
        const completions = storageService.getCompletions();
        const users = storageService.getUsers();
        
        const result = await generateAIInsights(logs, completions, users, language);
        setPlan(result);
        setLoading(false);
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-8 text-white mb-8 shadow-xl">
                <div className="flex items-start justify-between">
                    <div>
                        <h2 className="text-3xl font-bold flex items-center gap-3">
                            <Sparkles className="w-8 h-8 text-yellow-300" />
                            {t('insights_title')}
                        </h2>
                        <p className="mt-2 opacity-90 text-lg">
                            {t('insights_intro')}
                        </p>
                    </div>
                    <button 
                        onClick={handleGenerate}
                        disabled={loading}
                        className="bg-white text-indigo-700 px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-opacity-90 transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
                        {loading ? t('insights_btn_loading') : t('insights_btn')}
                    </button>
                </div>
            </div>

            {plan && (
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 animate-fade-in">
                    <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                        <FileText className="w-6 h-6 text-slate-400" />
                        <h3 className="text-xl font-bold text-slate-800">{t('insights_result_title')}</h3>
                    </div>
                    
                    <div className="prose prose-slate max-w-none prose-headings:font-bold prose-h2:text-blue-700 prose-strong:text-slate-900">
                        <ReactMarkdown>{plan}</ReactMarkdown>
                    </div>
                </div>
            )}

            {!plan && !loading && (
                <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                    <Sparkles className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">{t('insights_empty')}</p>
                </div>
            )}
        </div>
    );
};
