import React, { useState, useEffect } from 'react';
import { LogType, OperationalLog, User } from '../types';
import { storageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Save, AlertOctagon, TrendingDown, Hammer, Clipboard, Trash2, Clock } from 'lucide-react';

export const Logs: React.FC<{ user: User }> = ({ user }) => {
  const [type, setType] = useState<LogType>(LogType.PRODUCTION);
  const [value, setValue] = useState<string>('');
  const [description, setDescription] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [recentLogs, setRecentLogs] = useState<OperationalLog[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
    refreshLogs();
  }, [user.id]);

  const refreshLogs = () => {
      const allLogs = storageService.getLogs();
      // Filter logs by user and sort by date desc
      const myLogs = allLogs
        .filter(l => l.userId === user.id)
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, 5); // Take last 5
      setRecentLogs(myLogs);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const log: OperationalLog = {
      id: Date.now().toString(),
      userId: user.id,
      type,
      value: Number(value),
      description,
      timestamp: Date.now()
    };
    storageService.saveLog(log);
    setSuccessMsg(t('log_success'));
    setValue('');
    setDescription('');
    refreshLogs();
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDelete = (id: string) => {
    if (confirm(t('admin_confirm_log'))) {
        storageService.deleteLog(id);
        refreshLogs();
    }
  };

  const getTypeStyles = (t: LogType) => {
    switch (t) {
        case LogType.PRODUCTION: return 'border-blue-500 bg-blue-50 text-blue-700';
        case LogType.SCRAP: return 'border-red-500 bg-red-50 text-red-700';
        case LogType.DOWNTIME: return 'border-amber-500 bg-amber-50 text-amber-700';
        default: return 'border-slate-500 bg-slate-50 text-slate-700';
    }
  };

  const getLogLabel = (type: LogType) => {
      switch(type) {
          case LogType.PRODUCTION: return t('log_prod');
          case LogType.SCRAP: return t('log_scrap');
          case LogType.DOWNTIME: return t('log_stop');
          case LogType.OCCURRENCE: return t('log_maint');
          default: return '';
      }
  };

  const getValueLabel = () => {
    if (type === LogType.DOWNTIME) return t('log_label_time');
    if (type === LogType.SCRAP) return t('log_label_qty');
    return t('log_label_val');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{t('logs_title')}</h2>
        <p className="text-slate-500">{t('logs_subtitle')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 md:p-8 mb-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
                { id: LogType.PRODUCTION, icon: Clipboard },
                { id: LogType.SCRAP, icon: TrendingDown },
                { id: LogType.DOWNTIME, icon: AlertOctagon },
                { id: LogType.OCCURRENCE, icon: Hammer },
            ].map((opt) => (
                <button
                    key={opt.id}
                    onClick={() => setType(opt.id)}
                    className={`
                        flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all
                        ${type === opt.id ? getTypeStyles(opt.id) : 'border-slate-100 hover:border-slate-200 text-slate-500'}
                    `}
                >
                    <opt.icon className="w-6 h-6 mb-1" />
                    <span className="text-xs font-bold">{getLogLabel(opt.id)}</span>
                </button>
            ))}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                    {getValueLabel()}
                </label>
                <input 
                    type="number" 
                    required
                    min="0"
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-lg font-mono"
                    placeholder="0"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">{t('log_label_desc')}</label>
                <textarea 
                    required
                    rows={3}
                    className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder={t('log_place_desc')}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
            </div>

            <button 
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
            >
                <Save className="w-5 h-5" />
                {t('log_btn_save')}
            </button>
        </form>

        {successMsg && (
            <div className="mt-4 p-3 bg-green-100 text-green-700 rounded-lg text-center font-medium animate-fade-in">
                {successMsg}
            </div>
        )}
      </div>

      {/* History */}
      <div className="space-y-4">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
            <Clock className="w-4 h-4" /> {t('log_history')}
        </h3>
        {recentLogs.length === 0 && <p className="text-slate-400 text-sm">No recent logs.</p>}
        {recentLogs.map(log => (
            <div key={log.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                            log.type === LogType.PRODUCTION ? 'bg-blue-100 text-blue-700' :
                            log.type === LogType.SCRAP ? 'bg-red-100 text-red-700' :
                            log.type === LogType.DOWNTIME ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700'
                        }`}>
                            {getLogLabel(log.type)}
                        </span>
                        <span className="text-xs text-slate-400">
                            {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                    </div>
                    <div className="font-medium text-slate-800">
                        {log.value} — <span className="text-slate-500 font-normal text-sm">{log.description}</span>
                    </div>
                </div>
                <button 
                    onClick={() => handleDelete(log.id)}
                    className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                    title={t('log_btn_delete')}
                >
                    <Trash2 className="w-4 h-4" />
                </button>
            </div>
        ))}
      </div>
    </div>
  );
};