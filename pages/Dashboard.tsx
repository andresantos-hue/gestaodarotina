
import React, { useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area } from 'recharts';
import { storageService, getPeriodStart } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Trophy, TrendingUp, AlertTriangle, CheckCircle, BarChart3, Filter } from 'lucide-react';
import { LogType } from '../types';

export const Dashboard: React.FC = () => {
  const users = storageService.getUsers();
  const completions = storageService.getCompletions();
  const tasks = storageService.getTasks();
  const logs = storageService.getLogs();
  const { t } = useLanguage();

  // Filter State
  const [selectedShift, setSelectedShift] = useState<string>('ALL');
  const [selectedDept, setSelectedDept] = useState<string>('ALL');

  // Extract unique shifts and departments
  const shifts = useMemo(() => {
      const s = new Set(users.map(u => u.shift).filter(Boolean));
      return Array.from(s);
  }, [users]);

  const departments = useMemo(() => {
    const d = new Set(users.map(u => u.department).filter(Boolean));
    return Array.from(d);
  }, [users]);

  const { stats, pendingCount, overallRate, productionData } = useMemo(() => {
    // Calculate Pending Tasks
    let pending = 0;
    tasks.forEach(task => {
        const periodStart = getPeriodStart(task.frequency);
        task.assignedToIds.forEach(userId => {
            const isCompleted = completions.some(c => 
                c.taskId === task.id && 
                c.userId === userId && 
                c.completedAt >= periodStart
            );
            if (!isCompleted) pending++;
        });
    });

    // Filter users based on selection
    const filteredUsers = users.filter(u => {
      const shiftMatch = selectedShift === 'ALL' || u.shift === selectedShift;
      const deptMatch = selectedDept === 'ALL' || u.department === selectedDept;
      return shiftMatch && deptMatch;
    });

    const userStats = filteredUsers.map(user => {
      const userTasks = tasks.filter(t => t.assignedToIds.includes(user.id));
      const userCompletions = completions.filter(c => c.userId === user.id);
      
      let tasksCompletedInPeriod = 0;
      let tasksAssigned = 0;
      
      userTasks.forEach(task => {
          tasksAssigned++;
          const periodStart = getPeriodStart(task.frequency);
          const isDone = completions.some(c => c.taskId === task.id && c.userId === user.id && c.completedAt >= periodStart);
          if (isDone) tasksCompletedInPeriod++;
      });

      const score = tasksAssigned > 0 ? (tasksCompletedInPeriod / tasksAssigned) * 100 : 0; 

      return {
        name: user.name.split(' ')[0],
        fullName: user.name,
        role: user.title,
        shift: user.shift,
        department: user.department,
        score: Math.round(score),
        completedTotal: userCompletions.length
      };
    }).sort((a, b) => b.score - a.score); 

    const rate = userStats.length > 0 
        ? Math.round(userStats.reduce((acc, curr) => acc + curr.score, 0) / userStats.length)
        : 0;

    // Production Data (Last 7 days)
    const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d;
    }).reverse();

    const chartData = last7Days.map(date => {
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
        const dayEnd = dayStart + 86400000;
        
        const dayLogs = logs.filter(l => l.timestamp >= dayStart && l.timestamp < dayEnd);
        const production = dayLogs.filter(l => l.type === LogType.PRODUCTION).reduce((acc, curr) => acc + curr.value, 0);
        const scrap = dayLogs.filter(l => l.type === LogType.SCRAP).reduce((acc, curr) => acc + curr.value, 0);
        
        return {
            date: date.toLocaleDateString(undefined, { day: '2-digit', month: '2-digit' }),
            production,
            scrap
        };
    });

    return { stats: userStats, pendingCount: pending, overallRate: rate, productionData: chartData };
  }, [users, completions, tasks, logs, selectedShift, selectedDept]);

  const mostDisciplined = stats[0];

  return (
    <div className="space-y-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-800">{t('dash_title')}</h2>
        <p className="text-slate-500">{t('dash_subtitle')}</p>
      </div>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <Trophy className="absolute right-4 top-4 w-16 h-16 text-white opacity-20" />
          <h3 className="text-lg font-semibold opacity-90">{t('dash_top_performer')}</h3>
          <div className="mt-4">
            <p className="text-3xl font-bold">{mostDisciplined?.score > 0 ? mostDisciplined.fullName : '---'}</p>
            <p className="text-sm opacity-80 mt-1">{mostDisciplined?.score > 0 ? `${mostDisciplined.role} • ${mostDisciplined.department}` : '---'}</p>
            <div className="mt-4 inline-flex items-center px-3 py-1 rounded-full bg-white/20 text-sm">
              <CheckCircle className="w-4 h-4 mr-2" />
              {mostDisciplined?.score || 0}% {t('dash_discipline')}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700">{t('dash_rate')}</h3>
            <TrendingUp className="w-6 h-6 text-blue-500" />
          </div>
          <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-slate-900">
              {overallRate}%
            </span>
            <span className="text-sm text-slate-500 mb-1">{t('dash_team')}</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 mt-4">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
              style={{ width: `${overallRate}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700">{t('dash_pending')}</h3>
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <div className="text-4xl font-bold text-slate-900">
             {pendingCount}
            </div>
            <p className="text-sm text-slate-500 mt-2">{t('dash_pending_sub')}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Production Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-5 h-5 text-indigo-500" />
                <h3 className="text-lg font-semibold text-slate-700">{t('dash_prod_chart')}</h3>
            </div>
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={productionData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorProd" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorScrap" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#f1f5f9" />
                    <Area type="monotone" dataKey="production" stroke="#3b82f6" fillOpacity={1} fill="url(#colorProd)" name={t('log_prod')} />
                    <Area type="monotone" dataKey="scrap" stroke="#ef4444" fillOpacity={1} fill="url(#colorScrap)" name={t('log_scrap')} />
                </AreaChart>
            </ResponsiveContainer>
            </div>
        </div>

        {/* Discipline Ranking Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
                <h3 className="text-lg font-semibold text-slate-700">{t('dash_ranking')}</h3>
                <div className="flex flex-wrap gap-2">
                    <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <select 
                            value={selectedDept} 
                            onChange={(e) => setSelectedDept(e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 text-slate-600 outline-none"
                        >
                            <option value="ALL">{t('dash_all_depts')}</option>
                            {departments.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                    </div>
                    <div className="flex items-center gap-1">
                        <Filter className="w-3 h-3 text-slate-400" />
                        <select 
                            value={selectedShift} 
                            onChange={(e) => setSelectedShift(e.target.value)}
                            className="text-xs border border-slate-200 rounded p-1 text-slate-600 outline-none"
                        >
                            <option value="ALL">{t('dash_all_shifts')}</option>
                            {shifts.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>
            <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" domain={[0, 100]} hide />
                <YAxis dataKey="name" type="category" width={100} tick={{fill: '#475569', fontSize: 14}} tickLine={false} axisLine={false} />
                <Tooltip 
                    cursor={{fill: 'transparent'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                />
                <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={24} name="%">
                    {stats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#cbd5e1'} />
                    ))}
                </Bar>
                </BarChart>
            </ResponsiveContainer>
            </div>
        </div>
      </div>
    </div>
  );
};
