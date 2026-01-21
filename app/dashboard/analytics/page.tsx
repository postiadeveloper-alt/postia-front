'use client';

import { useState, useEffect } from 'react';
import apiService from '@/lib/api.service';
import { TrendingUp, BarChart3, Sparkles } from 'lucide-react';

export default function AnalyticsPage() {
    const [insights, setInsights] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Analíticas
                </h1>
                <p className="text-gray-400 mt-1">Rastrea tu rendimiento e ideas</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Alcance Total', value: '12.5K', change: '+12%', icon: TrendingUp, color: 'text-cyan-400' },
                    { label: 'Tasa de Interacción', value: '3.2%', change: '+0.5%', icon: BarChart3, color: 'text-primary' },
                    { label: 'Seguidores', value: '2.4K', change: '+45', icon: Sparkles, color: 'text-purple-400' },
                    { label: 'Publicaciones Este Mes', value: '24', change: '+8', icon: BarChart3, color: 'text-green-400' },
                ].map((stat, index) => (
                    <div key={index} className="glass-card p-6 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between items-start mb-4">
                            <stat.icon className={`w-8 h-8 ${stat.color}`} />
                            <span className="text-sm text-green-400 bg-green-400/10 px-2 py-1 rounded">
                                {stat.change}
                            </span>
                        </div>
                        <h3 className="text-3xl font-bold mb-1">{stat.value}</h3>
                        <p className="text-sm text-gray-400">{stat.label}</p>
                    </div>
                ))}
            </div>

            {/* Performance Chart */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-4">Resumen de Rendimiento</h3>
                <div className="h-64 flex items-center justify-center text-gray-400">
                    <p>Conecta tu cuenta de Instagram para ver analíticas detalladas</p>
                </div>
            </div>

            {/* Top Posts */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-4">Publicaciones con Mejor Rendimiento</h3>
                <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                            <div className="w-16 h-16 bg-gradient-to-br from-primary to-purple-600 rounded-lg" />
                            <div className="flex-1">
                                <p className="font-medium">Publicación de Ejemplo {i}</p>
                                <p className="text-sm text-gray-400">1.2K me gusta · 45 comentarios</p>
                            </div>
                            <div className="text-right">
                                <p className="text-primary font-semibold">4.5%</p>
                                <p className="text-xs text-gray-400">Interacción</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
