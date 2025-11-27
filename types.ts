
export enum UserRole {
  ADMIN = 'ADMIN', // Manager/Owner
  OPERATOR = 'OPERATOR', // Technician, Mechanic, etc.
}

export enum Frequency {
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export enum TaskType {
  CHECKLIST = 'CHECKLIST',
  MEASUREMENT = 'MEASUREMENT', // Requires numeric input
}

export interface User {
  id: string;
  username: string;
  email: string;
  password?: string;
  name: string;
  role: UserRole;
  title: string;
  shift: string;
  department: string; // New field for Sector/Department
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedToIds: string[];
  frequency: Frequency;
  type: TaskType;
  unit?: string;
  minVal?: number;
  maxVal?: number;
  dueTime?: string;
  createdAt: number;
}

export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: number;
  status: 'COMPLETED' | 'MISSED' | 'LATE';
  measuredValue?: number;
  notes?: string;
}

export enum LogType {
  PRODUCTION = 'PRODUCTION',
  SCRAP = 'SCRAP',
  DOWNTIME = 'DOWNTIME',
  OCCURRENCE = 'OCCURRENCE',
}

export interface OperationalLog {
  id: string;
  userId: string;
  type: LogType;
  value: number;
  description: string;
  timestamp: number;
}

export interface ActionPlan {
  title: string;
  content: string;
  generatedAt: number;
}