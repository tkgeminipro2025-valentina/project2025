import React from 'react';
import { 
    DashboardIcon, 
    BuildingIcon, 
    UsersIcon, 
    DollarSignIcon, 
    ClipboardListIcon, 
    BriefcaseIcon, 
    PackageIcon,
    Users2Icon,
    SparklesIcon,
    BarChartIcon,
    UserIcon,
    BookIcon,
} from './icons';
import { View } from '../types';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
    canViewAnalytics?: boolean;
    canManageUsers?: boolean;
    canManageKnowledge?: boolean;
}

const NavItem: React.FC<{
    icon: React.ElementType, 
    label: string, 
    isActive: boolean, 
    onClick: () => void 
}> = ({ icon: Icon, label, isActive, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
            isActive 
            ? 'bg-primary text-white' 
            : 'text-text-secondary hover:bg-secondary hover:text-text-primary'
        }`}
    >
        <Icon className="h-5 w-5" />
        <span className="font-semibold">{label}</span>
    </button>
);

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate, canViewAnalytics = true, canManageUsers = false, canManageKnowledge = false }) => {
    const navItems: { id: View, label: string, icon: React.ElementType }[] = [
        { id: 'dashboard', label: 'Dashboard', icon: DashboardIcon },
        { id: 'organizations', label: 'Organizations', icon: BuildingIcon },
        { id: 'contacts', label: 'Contacts', icon: UsersIcon },
        { id: 'deals', label: 'Deals', icon: DollarSignIcon },
        { id: 'tasks', label: 'Tasks', icon: ClipboardListIcon },
        { id: 'projects', label: 'Projects', icon: BriefcaseIcon },
        { id: 'products', label: 'Products', icon: PackageIcon },
        { id: 'employees', label: 'Employees', icon: Users2Icon },
        { id: 'analytics', label: 'AI Analytics', icon: BarChartIcon },
    ];

    if (canManageUsers) {
        navItems.splice(navItems.length - 1, 0, { id: 'users', label: 'Users', icon: UserIcon });
    }

    if (canManageKnowledge) {
        navItems.splice(navItems.length - 1, 0, { id: 'knowledge-base', label: 'Knowledge Base', icon: BookIcon });
    }

    const filteredNavItems = canViewAnalytics
        ? navItems
        : navItems.filter(item => item.id !== 'analytics');
    
    return (
        <aside className="w-64 bg-surface-alt border-r border-border p-6 flex flex-col">
            <div className="flex items-center space-x-2 mb-10">
                <SparklesIcon className="h-8 w-8 text-primary" />
                <span className="text-xl font-bold">Stellar AI CRM</span>
            </div>
            <nav className="flex flex-col space-y-2">
                {filteredNavItems.map(item => (
                    <NavItem 
                        key={item.id}
                        icon={item.icon}
                        label={item.label}
                        isActive={currentView === item.id}
                        onClick={() => onNavigate(item.id)}
                    />
                ))}
            </nav>
        </aside>
    );
};

export default Sidebar;
