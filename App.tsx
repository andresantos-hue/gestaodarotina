
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Routine } from './pages/Routine';
import { Logs } from './pages/Logs';
import { Admin } from './pages/Admin';
import { Insights } from './pages/Insights';
import { storageService } from './services/storage';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { User, UserRole } from './types';
import { Factory, Lock } from 'lucide-react';

const LoginPage: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { t } = useLanguage();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Use the storage service to authenticate properly
    const user = storageService.login(username, password);
    
    if (user) {
      onLogin();
    } else {
      setError(t('login_error_auth'));
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-4">
                <Factory className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">{t('app_name')}</h1>
            <p className="text-slate-500">{t('login_title')}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('login_user')}</label>
            <input 
                type="text" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="email@empresa.com"
                value={username}
                onChange={e => setUsername(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('login_pass')}</label>
            <input 
                type="password" 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
            />
          </div>
          
          {error && <div className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</div>}

          <button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center">
            <Lock className="w-4 h-4 mr-2" /> {t('login_btn')}
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-slate-400">
            {t('login_demo')}<br/>
            admin@empresa.com / 123<br/>
            tecnico@empresa.com / 123
        </div>
      </div>
    </div>
  );
};

const MainApp = () => {
  const [user, setUser] = useState<User | null>(null);
  const [page, setPage] = useState('dashboard');
  const { language } = useLanguage();

  useEffect(() => {
    const currentUser = storageService.getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, []);

  if (!user) {
    return <LoginPage onLogin={() => setUser(storageService.getCurrentUser())} />;
  }

  const renderPage = () => {
    switch (page) {
      case 'dashboard': return <Dashboard />;
      case 'routine': return <Routine currentUser={user} />;
      case 'logs': return <Logs user={user} />;
      case 'admin': return user.role === UserRole.ADMIN ? <Admin /> : <Dashboard />;
      case 'insights': return user.role === UserRole.ADMIN ? <Insights /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout user={user} onNavigate={setPage} currentPage={page}>
      {renderPage()}
    </Layout>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <MainApp />
    </LanguageProvider>
  );
}
