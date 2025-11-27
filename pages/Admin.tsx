import React, { useState, useEffect, useMemo } from 'react';
import { Frequency, Task, User, UserRole, OperationalLog, TaskType } from '../types';
import { storageService } from '../services/storage';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Trash2, Users, Calendar, FileBarChart, Filter, Download } from 'lucide-react';

export const Admin: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [logs, setLogs] = useState<OperationalLog[]>([]);
  
  // State for new user form including email and password
  const [newUser, setNewUser] = useState({ 
    name: '', 
    username: '', 
    email: '', 
    password: '', 
    role: UserRole.OPERATOR, 
    title: '', 
    shift: '',
    department: '' // New Field
  });

  const [newTask, setNewTask] = useState<Partial<Task>>({ 
      title: '', 
      description: '', 
      frequency: Frequency.DAILY, 
      type: TaskType.CHECKLIST, // Default
      assignedToIds: [] 
  });
  
  const [activeTab, setActiveTab] = useState<'tasks' | 'users' | 'reports'>('tasks');
  const { t } = useLanguage();

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setTasks(storageService.getTasks());
    setUsers(storageService.getUsers());
    setLogs(storageService.getLogs().sort((a, b) => b.timestamp - a.timestamp));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const user: User = {
        id: Date.now().toString(),
        ...newUser
    } as User;
    storageService.saveUser(user);
    setNewUser({ name: '', username: '', email: '', password: '', role: UserRole.OPERATOR, title: '', shift: '', department: '' });
    refreshData();
  };

  const handleDeleteUser = (userId: string) => {
      if(confirm(t('admin_confirm_user'))) {
          storageService.deleteUser(userId);
          refreshData();
      }
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTask.assignedToIds?.length) {
        alert("Selecione pelo menos um responsável.");
        return;
    }
    const task: Task = {
        id: Date.now().toString(),
        createdAt: Date.now(),
        ...newTask
    } as Task;
    storageService.saveTask(task);
    setNewTask({ title: '', description: '', frequency: Frequency.DAILY, type: TaskType.CHECKLIST, assignedToIds: [] });
    refreshData();
  };

  const handleDeleteTask = (taskId: string) => {
      if(confirm(t('admin_confirm_task'))) {
          storageService.deleteTask(taskId);
          refreshData();
      }
  };

  const toggleAssignee = (userId: string) => {
      const current = newTask.assignedToIds || [];
      if (current.includes(userId)) {
          setNewTask({ ...newTask, assignedToIds: current.filter(id => id !== userId) });
      } else {
          setNewTask({ ...newTask, assignedToIds: [...current, userId] });
      }
  };

  const exportLogsToCSV = () => {
      const headers = ["ID", "Date", "User", "Department", "Shift", "Type", "Value", "Description"];
      const rows = logs.map(l => {
          const user = users.find(u => u.id === l.userId);
          return [
            l.id,
            new Date(l.timestamp).toISOString(),
            user?.name || l.userId,
            user?.department || '',
            user?.shift || '',
            l.type,
            l.value,
            `"${l.description.replace(/"/g, '""')}"` // Escape quotes
        ]
      });
      
      const csvContent = "data:text/csv;charset=utf-8," 
          + [headers, ...rows].map(e => e.join(",")).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", `routine_master_logs_${new Date().toISOString().slice(0,10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
  };

  const getUserName = (id: string) => users.find(u => u.id === id)?.name || id;

  // Group users by department for task assignment
  const usersByDept = useMemo(() => {
      const grouped: {[key: string]: User[]} = {};
      users.filter(u => u.role !== UserRole.ADMIN).forEach(u => {
          const dept = u.department || 'Geral';
          if(!grouped[dept]) grouped[dept] = [];
          grouped[dept].push(u);
      });
      return grouped;
  }, [users]);

  return (
    <div>
        <div className="mb-6 flex space-x-4 border-b border-slate-200 overflow-x-auto">
            <button 
                onClick={() => setActiveTab('tasks')}
                className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'tasks' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="flex items-center gap-2"><Calendar className="w-4 h-4" /> {t('admin_tab_tasks')}</span>
                {activeTab === 'tasks' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('users')}
                className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'users' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="flex items-center gap-2"><Users className="w-4 h-4" /> {t('admin_tab_users')}</span>
                {activeTab === 'users' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
            <button 
                onClick={() => setActiveTab('reports')}
                className={`pb-3 px-4 font-medium text-sm transition-colors whitespace-nowrap relative ${activeTab === 'reports' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
            >
                <span className="flex items-center gap-2"><FileBarChart className="w-4 h-4" /> {t('admin_tab_reports')}</span>
                {activeTab === 'reports' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600"></div>}
            </button>
        </div>

        {activeTab === 'users' && (
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-4">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">{t('admin_new_user')}</h3>
                        <div className="space-y-4">
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_name')} value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required />
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_user')} value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} required />
                            
                            {/* New Fields: Email and Password */}
                            <input type="email" className="w-full p-2 border rounded" placeholder={t('admin_ph_email')} value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                            <input type="password" className="w-full p-2 border rounded" placeholder={t('admin_ph_pass')} value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required />
                            
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_title')} value={newUser.title} onChange={e => setNewUser({...newUser, title: e.target.value})} required />
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_shift')} value={newUser.shift} onChange={e => setNewUser({...newUser, shift: e.target.value})} required />
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_dept')} value={newUser.department} onChange={e => setNewUser({...newUser, department: e.target.value})} required />
                            
                            <select className="w-full p-2 border rounded" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}>
                                <option value={UserRole.OPERATOR}>{t('admin_role_op')}</option>
                                <option value={UserRole.ADMIN}>{t('admin_role_adm')}</option>
                            </select>
                            <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700">{t('admin_btn_add_user')}</button>
                        </div>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                    {users.map(u => (
                        <div key={u.id} className="bg-white p-4 rounded-lg border border-slate-200 flex justify-between items-center group">
                            <div>
                                <p className="font-bold text-slate-800">{u.name}</p>
                                <p className="text-sm text-slate-500 mb-1">{u.email} • {u.username}</p>
                                <p className="text-xs text-slate-400 bg-slate-100 inline-block px-2 py-0.5 rounded">{u.title} • {u.shift} • {u.department || 'N/A'}</p>
                            </div>
                            {u.role !== UserRole.ADMIN && (
                                <button 
                                    onClick={() => handleDeleteUser(u.id)}
                                    className="p-2 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Remover"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'tasks' && (
            <div className="grid md:grid-cols-3 gap-8">
                <div className="md:col-span-1">
                    <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky top-4">
                        <h3 className="font-bold text-lg mb-4 text-slate-800">{t('admin_new_task')}</h3>
                        <div className="space-y-4">
                            <input className="w-full p-2 border rounded" placeholder={t('admin_ph_task_title')} value={newTask.title} onChange={e => setNewTask({...newTask, title: e.target.value})} required />
                            <textarea className="w-full p-2 border rounded" placeholder={t('admin_ph_task_desc')} value={newTask.description} onChange={e => setNewTask({...newTask, description: e.target.value})} required />
                            
                            {/* Task Type Selection */}
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1 uppercase">{t('admin_type')}</label>
                                <select className="w-full p-2 border rounded" value={newTask.type} onChange={e => setNewTask({...newTask, type: e.target.value as TaskType})}>
                                    <option value={TaskType.CHECKLIST}>{t('admin_type_check')}</option>
                                    <option value={TaskType.MEASUREMENT}>{t('admin_type_meas')}</option>
                                </select>
                            </div>

                            {/* Measurement Config */}
                            {newTask.type === TaskType.MEASUREMENT && (
                                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded border border-slate-100">
                                    <input className="p-2 border rounded w-full text-xs" placeholder={t('admin_unit')} value={newTask.unit || ''} onChange={e => setNewTask({...newTask, unit: e.target.value})} />
                                    <input className="p-2 border rounded w-full text-xs" type="number" placeholder={t('admin_min')} value={newTask.minVal || ''} onChange={e => setNewTask({...newTask, minVal: parseFloat(e.target.value)})} />
                                    <input className="p-2 border rounded w-full text-xs" type="number" placeholder={t('admin_max')} value={newTask.maxVal || ''} onChange={e => setNewTask({...newTask, maxVal: parseFloat(e.target.value)})} />
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-2">
                                <select className="p-2 border rounded" value={newTask.frequency} onChange={e => setNewTask({...newTask, frequency: e.target.value as Frequency})}>
                                    {(Object.values(Frequency) as string[]).map(f => <option key={f} value={f}>{f}</option>)}
                                </select>
                                <input type="time" className="p-2 border rounded" value={newTask.dueTime || ''} onChange={e => setNewTask({...newTask, dueTime: e.target.value})} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-slate-700">{t('admin_label_assign')}</label>
                                <div className="max-h-60 overflow-y-auto space-y-4 border rounded p-2 bg-slate-50">
                                    {Object.entries(usersByDept).map(([dept, deptUsers]) => (
                                        <div key={dept}>
                                            <h5 className="text-xs font-bold text-slate-400 uppercase mb-1">{dept}</h5>
                                            <div className="space-y-1 pl-2">
                                                {deptUsers.map(u => (
                                                    <div key={u.id} className="flex items-center gap-2">
                                                        <input 
                                                            type="checkbox" 
                                                            id={`u-${u.id}`}
                                                            checked={newTask.assignedToIds?.includes(u.id)}
                                                            onChange={() => toggleAssignee(u.id)}
                                                        />
                                                        <label htmlFor={`u-${u.id}`} className="text-sm cursor-pointer select-none">{u.name}</label>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-emerald-600 text-white py-2 rounded font-medium hover:bg-emerald-700 flex items-center justify-center gap-2">
                                <Plus className="w-4 h-4" /> {t('admin_btn_add_task')}
                            </button>
                        </div>
                    </form>
                </div>
                <div className="md:col-span-2 space-y-3">
                    {tasks.map(t => (
                        <div key={t.id} className="bg-white p-4 rounded-lg border border-slate-200 group">
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        {t.type === TaskType.MEASUREMENT ? 
                                            <span className="text-[10px] uppercase font-bold bg-purple-100 text-purple-700 px-2 py-0.5 rounded">Data</span> :
                                            <span className="text-[10px] uppercase font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded">Check</span>
                                        }
                                        <h4 className="font-bold text-slate-800">{t.title}</h4>
                                    </div>
                                    <p className="text-sm text-slate-600">{t.description}</p>
                                    <div className="flex gap-2 mt-2">
                                        <span className="text-xs bg-slate-100 px-2 py-1 rounded font-medium text-slate-600">{t.frequency}</span>
                                        {t.dueTime && <span className="text-xs bg-amber-50 px-2 py-1 rounded font-medium text-amber-700">{t.dueTime}</span>}
                                        <span className="text-xs bg-blue-50 px-2 py-1 rounded font-medium text-blue-700">{t.assignedToIds.length} {t('admin_responsibles')}</span>
                                        {t.type === TaskType.MEASUREMENT && (
                                            <span className="text-xs bg-purple-50 px-2 py-1 rounded font-medium text-purple-700">
                                                {t.minVal ?? '?'} - {t.maxVal ?? '?'} {t.unit}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => handleDeleteTask(t.id)}
                                    className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                    title="Excluir"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )}

        {activeTab === 'reports' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex justify-end">
                    <button 
                        onClick={exportLogsToCSV}
                        className="flex items-center gap-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                        <Download className="w-4 h-4" />
                        {t('admin_export_csv')}
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-slate-500">
                        <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                            <tr>
                                <th className="px-6 py-3">{t('report_date')}</th>
                                <th className="px-6 py-3">{t('report_user')}</th>
                                <th className="px-6 py-3">{t('report_type')}</th>
                                <th className="px-6 py-3">{t('report_value')}</th>
                                <th className="px-6 py-3">{t('report_desc')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="bg-white border-b hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-900">
                                        {getUserName(log.userId)}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{log.type}</span>
                                    </td>
                                    <td className="px-6 py-4 font-bold">
                                        {log.value}
                                    </td>
                                    <td className="px-6 py-4">
                                        {log.description}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
    </div>
  );
};