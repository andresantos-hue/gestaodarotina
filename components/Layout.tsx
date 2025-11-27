import React from 'react';
import { User, UserRole } from '../types';
import { storageService } from '../services/storage';
import { useLanguage, Language } from '../contexts/LanguageContext';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Users, 
  Factory, 
  LogOut, 
  BrainCircuit,
  Menu,
  X,
  Globe
} from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  user: User;
  onNavigate: (page: string) => void;
  currentPage: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, user, onNavigate, currentPage }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const { t, language, setLanguage } = useLanguage();

  const handleLogout = () => {
    storageService.logout();
    window.location.reload();
  };

  const NavItem = ({ page, icon: Icon, labelKey, restrictedTo }: any) => {
    if (restrictedTo && user.role !== restrictedTo) return null;
    
    const isActive = currentPage === page;
    return (
      <button
        onClick={() => {
          onNavigate(page);
          setIsMobileMenuOpen(false);
        }}
        className={`flex items-center w-full px-4 py-3 mb-1 text-sm font-medium transition-colors rounded-lg group ${
          isActive 
            ? 'bg-blue-600 text-white shadow-lg' 
            : 'text-slate-600 hover:bg-slate-100'
        }`}
      >
        <Icon className={`w-5 h-5 mr-3 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
        {t(labelKey)}
      </button>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-slate-200 z-50 flex justify-between items-center p-4">
        <div className="font-bold text-xl text-blue-800">{t('app_name')}</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 transform transition-transform duration-200 ease-in-out
        md:relative md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-20 md:pt-0
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-100 hidden md:block">
            <h1 className="text-2xl font-bold text-blue-900 flex items-center gap-2">
              <Factory className="w-8 h-8 text-blue-600" />
              {t('app_name')}
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{t('app_subtitle')}</p>
          </div>

          <div className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
            <NavItem page="dashboard" icon={LayoutDashboard} labelKey="nav_dashboard" />
            <NavItem page="routine" icon={ClipboardList} labelKey="nav_routine" />
            <NavItem page="logs" icon={Factory} labelKey="nav_logs" />
            <NavItem page="admin" icon={Users} labelKey="nav_admin" restrictedTo={UserRole.ADMIN} />
            <NavItem page="insights" icon={BrainCircuit} labelKey="nav_insights" restrictedTo={UserRole.ADMIN} />
          </div>

          <div className="p-4 border-t border-slate-100 bg-slate-50 space-y-4">
            {/* Language Switcher */}
            <div className="flex items-center justify-between bg-white p-2 rounded-lg border border-slate-200">
                <div className="flex items-center gap-2 text-slate-600">
                    <Globe className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">{language}</span>
                </div>
                <div className="flex gap-1">
                    <button onClick={() => setLanguage('pt')} className={`text-xs px-2 py-1 rounded ${language === 'pt' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>PT</button>
                    <button onClick={() => setLanguage('en')} className={`text-xs px-2 py-1 rounded ${language === 'en' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>EN</button>
                    <button onClick={() => setLanguage('es')} className={`text-xs px-2 py-1 rounded ${language === 'es' ? 'bg-blue-100 text-blue-700 font-bold' : 'text-slate-400 hover:text-slate-600'}`}>ES</button>
                </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
                {user.name.charAt(0)}
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                <p className="text-xs text-slate-500">{user.title}</p>
              </div>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {t('nav_logout')}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto pt-20 md:pt-0">
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
