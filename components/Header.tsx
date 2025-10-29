import React from 'react';
import { PlusIcon } from './icons';

interface HeaderProps {
    title: string;
    onAddClick: () => void;
    showAddButton: boolean;
    userName?: string;
    userRole?: string;
    onSignOut?: () => void;
}

const formatTitle = (value: string) => {
    const cleaned = value.replace(/[_-]/g, ' ');
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
};

const Header: React.FC<HeaderProps> = ({ title, onAddClick, showAddButton, userName, userRole, onSignOut }) => {
    const displayTitle = formatTitle(title);
    const addLabel = formatTitle(title.endsWith('s') ? title.slice(0, -1) : title);

    return (
        <header className="flex justify-between items-center p-6 border-b border-border">
            <h1 className="text-2xl font-bold capitalize">{displayTitle}</h1>
            <div className="flex items-center space-x-4">
                {showAddButton && (
                    <button 
                        onClick={onAddClick}
                        className="flex items-center space-x-2 bg-primary hover:bg-primary-hover text-white font-semibold py-2 px-4 rounded-lg"
                    >
                        <PlusIcon className="h-5 w-5" />
                        <span>Add {addLabel}</span>
                    </button>
                )}
                {(userName || userRole || onSignOut) && (
                    <div className="flex items-center space-x-3">
                        {(userName || userRole) && (
                            <div className="text-right leading-tight">
                                {userName && <div className="text-sm font-semibold">{userName}</div>}
                                {userRole && <div className="text-xs uppercase tracking-wide text-text-secondary">{userRole}</div>}
                            </div>
                        )}
                        {onSignOut && (
                            <button
                                onClick={onSignOut}
                                className="text-sm font-semibold text-text-secondary hover:text-text-primary border border-border rounded-lg px-3 py-1 transition-colors"
                            >
                                Sign out
                            </button>
                        )}
                    </div>
                )}
            </div>
        </header>
    );
};

export default Header;
