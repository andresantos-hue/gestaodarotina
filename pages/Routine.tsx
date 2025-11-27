
import React, { useState, useEffect } from 'react';
import { storageService, getPeriodStart } from '../services/storage';
import { Task, User, TaskCompletion, Frequency, TaskType } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { Clock, CheckSquare, AlertCircle, MessageSquare, Ruler, Save } from 'lucide-react';

interface RoutineProps {
  currentUser: User;
}

export const Routine: React.FC<RoutineProps> = ({ currentUser }) => {
  const [myTasks, setMyTasks] = useState<Task[]>([]);
  const [completions, setCompletions] = useState<TaskCompletion[]>([]);
  const [noteMap, setNoteMap] = useState<{[key: string]: string}>({});
  const [valueMap, setValueMap] = useState<{[key: string]: string}>({}); // For numeric inputs
  const { t } = useLanguage();

  useEffect(() => {
    const allTasks = storageService.getTasks();
    const userTasks = allTasks.filter(t => t.assignedToIds.includes(currentUser.id));
    setMyTasks(userTasks);
    setCompletions(storageService.getCompletions());
  }, [currentUser.id]);

  const handleComplete = (taskId: string, type: TaskType) => {
    const measureVal = valueMap[taskId] ? parseFloat(valueMap[taskId]) : undefined;
    
    // Validate measurement if required
    if (type === TaskType.MEASUREMENT && isNaN(Number(measureVal))) {
        alert("Please enter a valid number.");
        return;
    }

    const completion: TaskCompletion = {
      id: Date.now().toString(),
      taskId,
      userId: currentUser.id,
      completedAt: Date.now(),
      status: 'COMPLETED',
      notes: noteMap[taskId] || '',
      measuredValue: measureVal
    };
    
    storageService.saveCompletion(completion);
    setCompletions([...completions, completion]);
    
    // Clear inputs
    const newNotes = { ...noteMap };
    delete newNotes[taskId];
    setNoteMap(newNotes);
    
    const newValues = { ...valueMap };
    delete newValues[taskId];
    setValueMap(newValues);
  };

  const getCompletion = (task: Task) => {
    const periodStart = getPeriodStart(task.frequency);
    return completions.find(c => 
      c.taskId === task.id && 
      c.userId === currentUser.id && 
      c.completedAt >= periodStart
    );
  };

  const isOverdue = (task: Task, completion: TaskCompletion | undefined) => {
      if (completion) return false;
      if (!task.dueTime) return false;
      
      const now = new Date();
      const [hours, minutes] = task.dueTime.split(':').map(Number);
      const dueDate = new Date();
      dueDate.setHours(hours, minutes, 0, 0);
      
      return now > dueDate;
  };

  const getFreqLabel = (f: Frequency) => {
      switch(f) {
          case Frequency.HOURLY: return t('freq_hourly');
          case Frequency.DAILY: return t('freq_daily');
          case Frequency.WEEKLY: return t('freq_weekly');
          case Frequency.MONTHLY: return t('freq_monthly');
          case Frequency.YEARLY: return t('freq_yearly');
          default: return f;
      }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">{t('routine_title')}</h2>
          <p className="text-slate-500">{t('routine_subtitle')} ({new Date().toLocaleDateString()})</p>
        </div>
        <div className="text-right">
            <span className="block text-3xl font-bold text-blue-600">
                {myTasks.filter(t => getCompletion(t)).length}/{myTasks.length}
            </span>
            <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">{t('routine_completed')}</span>
        </div>
      </div>

      <div className="space-y-4">
        {myTasks.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
                <p className="text-slate-500">{t('routine_empty')}</p>
            </div>
        )}

        {myTasks.map(task => {
          const completion = getCompletion(task);
          const completed = !!completion;
          const overdue = isOverdue(task, completion);
          
          // Check range for display if completed
          let rangeStatus = 'normal';
          if (completion && completion.measuredValue !== undefined && task.type === TaskType.MEASUREMENT) {
             if (task.minVal !== undefined && completion.measuredValue < task.minVal) rangeStatus = 'low';
             if (task.maxVal !== undefined && completion.measuredValue > task.maxVal) rangeStatus = 'high';
          }

          return (
            <div 
              key={task.id} 
              className={`
                relative bg-white rounded-xl p-6 border transition-all duration-200
                ${completed 
                    ? (rangeStatus !== 'normal' ? 'border-amber-200 bg-amber-50/30' : 'border-emerald-200 bg-emerald-50/30') 
                    : overdue 
                        ? 'border-red-200 shadow-red-100 shadow-lg' 
                        : 'border-slate-200 shadow-sm hover:shadow-md'
                }
              `}
            >
              {overdue && !completed && (
                 <div className="absolute top-0 right-0 -mt-2 -mr-2 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center shadow-sm animate-pulse">
                     <AlertCircle className="w-3 h-3 mr-1" />
                     {t('routine_overdue')}
                 </div>
              )}

              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded text-slate-500 bg-slate-100`}>
                        {getFreqLabel(task.frequency)}
                    </span>
                    {task.type === TaskType.MEASUREMENT && (
                        <span className="text-xs font-bold px-2 py-0.5 rounded text-blue-600 bg-blue-100 flex items-center gap-1">
                            <Ruler className="w-3 h-3" />
                            {task.unit || 'Data'}
                        </span>
                    )}
                    {task.dueTime && (
                        <span className="flex items-center text-xs font-medium text-slate-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {t('routine_until')} {task.dueTime}
                        </span>
                    )}
                  </div>
                  <h3 className={`text-lg font-semibold ${completed ? 'text-emerald-800' : 'text-slate-800'}`}>
                    {task.title}
                  </h3>
                  <p className="text-slate-600 text-sm mt-1">{task.description}</p>
                  
                  {/* Range Info */}
                  {task.type === TaskType.MEASUREMENT && (task.minVal !== undefined || task.maxVal !== undefined) && (
                      <p className="text-xs text-slate-400 mt-1 font-mono">
                          Range: {task.minVal ?? '-∞'} - {task.maxVal ?? '+∞'} {task.unit}
                      </p>
                  )}
                </div>

                {!completed ? (
                  <div className="flex flex-col gap-2 min-w-[220px]">
                    {task.type === TaskType.MEASUREMENT && (
                        <div className="relative">
                            <input 
                                type="number" 
                                placeholder={`${t('routine_value_ph')} (${task.unit || ''})`}
                                className="w-full px-3 py-2 text-lg font-bold text-blue-900 border border-blue-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                value={valueMap[task.id] || ''}
                                onChange={(e) => setValueMap({...valueMap, [task.id]: e.target.value})}
                            />
                        </div>
                    )}

                    <div className="relative">
                        <MessageSquare className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder={t('routine_placeholder')}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            value={noteMap[task.id] || ''}
                            onChange={(e) => setNoteMap({...noteMap, [task.id]: e.target.value})}
                        />
                    </div>
                    <button 
                      onClick={() => handleComplete(task.id, task.type)}
                      className="flex items-center justify-center w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                      {task.type === TaskType.MEASUREMENT ? <Save className="w-4 h-4 mr-2" /> : <CheckSquare className="w-4 h-4 mr-2" />}
                      {t('routine_btn_complete')}
                    </button>
                  </div>
                ) : (
                  <div className={`flex flex-col items-end px-4 py-2 rounded-lg ${rangeStatus !== 'normal' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                    <div className="flex items-center font-bold">
                        <CheckSquare className="w-5 h-5 mr-2" />
                        {t('routine_status_done')}
                    </div>
                    {completion.measuredValue !== undefined && (
                        <span className="text-sm font-mono mt-1">
                             {completion.measuredValue} {task.unit}
                             {rangeStatus !== 'normal' && <span className="ml-2 text-xs font-bold uppercase">({t('routine_out_of_range')})</span>}
                        </span>
                    )}
                    {completion.notes && (
                        <span className="text-xs italic mt-1 max-w-[150px] truncate text-right">
                            "{completion.notes}"
                        </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
