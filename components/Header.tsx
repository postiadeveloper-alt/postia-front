'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, Bell } from 'lucide-react';
import { Button } from './ui/Button';

export function Header() {
    const { user, logout } = useAuth();

    return (
        <header className="h-16 glass-card border-b border-border px-6 flex items-center justify-between">
            <div>
                <h2 className="text-xl font-semibold">Panel de Control</h2>
            </div>

            <div className="flex items-center gap-4">
                <button className="relative p-2 hover:bg-white/5 rounded-lg transition-colors">
                    <Bell className="w-5 h-5 text-gray-400" />
                    <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full"></span>
                </button>

                <div className="flex items-center gap-3 pl-4 border-l border-border">
                    <div className="text-right">
                        <p className="text-sm font-medium">{user?.fullName || 'Usuario'}</p>
                        <p className="text-xs text-gray-400">{user?.email || ''}</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center text-white font-semibold">
                        {user?.fullName?.charAt(0) || 'U'}
                    </div>
                </div>

                <Button
                    variant="ghost"
                    size="icon"
                    onClick={logout}
                    className="text-gray-400 hover:text-white"
                >
                    <LogOut className="w-5 h-5" />
                </Button>
            </div>
        </header>
    );
}
