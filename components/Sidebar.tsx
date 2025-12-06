'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, TrendingUp, BarChart3, User, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const navItems = [
    { icon: Calendar, label: 'Calendar', href: '/dashboard/calendar' },
    { icon: BarChart3, label: 'Analytics', href: '/dashboard/analytics' },
    { icon: TrendingUp, label: 'Trending', href: '/dashboard/trending' },
    { icon: User, label: 'Profile', href: '/dashboard/profile' },
];

export function Sidebar() {
    const pathname = usePathname();

    return (
        <div className="w-64 h-screen glass-card border-r border-border flex flex-col p-4">
            <div className="mb-8">
                <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Postia
                </h1>
                <p className="text-xs text-gray-400 mt-1">Social Media Management</p>
            </div>

            <Link
                href="/dashboard/posts/create"
                className="w-full mb-6 px-4 py-3 bg-primary hover:bg-primary-hover text-white rounded-lg font-semibold transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2"
            >
                <PlusCircle className="w-5 h-5" />
                Create Post
            </Link>

            <nav className="flex-1 space-y-2">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={cn(
                                'flex items-center gap-3 px-4 py-3 rounded-lg transition-all relative',
                                isActive
                                    ? 'bg-primary/20 text-primary border border-primary/30'
                                    : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            )}
                        >
                            {isActive && (
                                <motion.div
                                    layoutId="sidebar-indicator"
                                    className="absolute inset-0 bg-primary/10 rounded-lg"
                                    transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                                />
                            )}
                            <Icon className="w-5 h-5 relative z-10" />
                            <span className="relative z-10 font-medium">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="pt-4 border-t border-border text-xs text-gray-500">
                <p>Version 1.0.0</p>
            </div>
        </div>
    );
}
