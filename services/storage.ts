
import { User, Task, TaskCompletion, OperationalLog, UserRole, Frequency, LogType, TaskType } from '../types';

const STORAGE_KEYS = {
  USERS: 'rm_users_v4', // Version bump
  TASKS: 'rm_tasks_v4',
  COMPLETIONS: 'rm_completions_v4',
  LOGS: 'rm_logs_v4',
  SESSION: 'rm_session',
};

// Seed Data
const INITIAL_USERS: User[] = [
  { id: '1', username: 'admin', email: 'admin@empresa.com', password: '123', name: 'Carlos Gestor', role: UserRole.ADMIN, title: 'Gerente Industrial', shift: 'Geral', department: 'Gestão' },
  { id: '2', username: 'tecnico', email: 'tecnico@empresa.com', password: '123', name: 'João Silva', role: UserRole.OPERATOR, title: 'Técnico de Processo', shift: 'Manhã', department: 'Produção' },
  { id: '3', username: 'mecanico', email: 'mecanico@empresa.com', password: '123', name: 'Pedro Santos', role: UserRole.OPERATOR, title: 'Mecânico Sr', shift: 'Tarde', department: 'Manutenção' },
  { id: '4', username: 'eletricista', email: 'eletro@empresa.com', password: '123', name: 'Ana Costa', role: UserRole.OPERATOR, title: 'Eletricista', shift: 'Noite', department: 'Manutenção' },
];

const INITIAL_TASKS: Task[] = [
  { 
    id: 't1', 
    title: 'Verificar Pressão Hidráulica', 
    description: 'Conferir manômetros da linha 1. Deve estar entre 10 e 15 bar.', 
    assignedToIds: ['2', '3'], 
    frequency: Frequency.DAILY, 
    type: TaskType.MEASUREMENT,
    unit: 'bar',
    minVal: 10,
    maxVal: 15,
    dueTime: '08:00', 
    createdAt: Date.now() 
  },
  { 
    id: 't2', 
    title: 'Lubrificação de Eixos', 
    description: 'Aplicar graxa nos pontos vermelhos', 
    assignedToIds: ['3', '4'], 
    frequency: Frequency.WEEKLY, 
    type: TaskType.CHECKLIST,
    dueTime: '10:00', 
    createdAt: Date.now() 
  },
  { 
    id: 't3', 
    title: 'Temperatura do Forno', 
    description: 'Registrar temperatura da zona 3', 
    assignedToIds: ['2'], 
    frequency: Frequency.HOURLY, 
    type: TaskType.MEASUREMENT,
    unit: '°C',
    minVal: 180,
    maxVal: 220,
    createdAt: Date.now() 
  },
];

export const getPeriodStart = (frequency: Frequency): number => {
  const now = new Date();
  switch (frequency) {
    case Frequency.HOURLY:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours(), 0, 0).getTime();
    case Frequency.DAILY:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
    case Frequency.WEEKLY: {
      const day = now.getDay();
      const diff = now.getDate() - day; // Sunday as start of week
      return new Date(now.getFullYear(), now.getMonth(), diff, 0, 0, 0).getTime();
    }
    case Frequency.MONTHLY:
      return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0).getTime();
    case Frequency.YEARLY:
      return new Date(now.getFullYear(), 0, 1, 0, 0, 0).getTime();
    default:
      return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0).getTime();
  }
};

export const storageService = {
  // Users
  getUsers: (): User[] => {
    const data = localStorage.getItem(STORAGE_KEYS.USERS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(INITIAL_USERS));
      return INITIAL_USERS;
    }
    return JSON.parse(data);
  },
  
  saveUser: (user: User) => {
    const users = storageService.getUsers();
    const existingIndex = users.findIndex(u => u.id === user.id);
    if (existingIndex >= 0) {
        users[existingIndex] = { ...users[existingIndex], ...user }; 
    } else {
        users.push(user);
    }
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  deleteUser: (userId: string) => {
    const users = storageService.getUsers().filter(u => u.id !== userId);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  },

  // Tasks
  getTasks: (): Task[] => {
    const data = localStorage.getItem(STORAGE_KEYS.TASKS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(INITIAL_TASKS));
      return INITIAL_TASKS;
    }
    return JSON.parse(data);
  },

  saveTask: (task: Task) => {
    const tasks = storageService.getTasks();
    const existingIndex = tasks.findIndex(t => t.id === task.id);
    if (existingIndex >= 0) {
      tasks[existingIndex] = task;
    } else {
      tasks.push(task);
    }
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  deleteTask: (taskId: string) => {
    const tasks = storageService.getTasks().filter(t => t.id !== taskId);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
  },

  // Completions
  getCompletions: (): TaskCompletion[] => {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLETIONS);
    return data ? JSON.parse(data) : [];
  },

  saveCompletion: (completion: TaskCompletion) => {
    const list = storageService.getCompletions();
    list.push(completion);
    localStorage.setItem(STORAGE_KEYS.COMPLETIONS, JSON.stringify(list));
  },

  // Logs
  getLogs: (): OperationalLog[] => {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveLog: (log: OperationalLog) => {
    const logs = storageService.getLogs();
    logs.push(log);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  deleteLog: (logId: string) => {
    const logs = storageService.getLogs().filter(l => l.id !== logId);
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  // Session & Auth
  login: (identifier: string, passwordAttempt: string): User | undefined => {
    const users = storageService.getUsers();
    const user = users.find(u => 
        (u.username === identifier || u.email === identifier) && 
        u.password === passwordAttempt
    );
    
    if (user) {
      localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(user));
    }
    return user;
  },

  logout: () => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem(STORAGE_KEYS.SESSION);
    return data ? JSON.parse(data) : null;
  }
};