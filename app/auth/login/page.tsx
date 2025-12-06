'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const router = useRouter();
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await login(email, password);
            console.log('Login successful, navigating to dashboard...');
            // Small delay to ensure localStorage is written
            await new Promise(resolve => setTimeout(resolve, 100));
            router.push('/dashboard/calendar');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.response?.data?.message || 'Failed to login. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="glass-card p-8 space-y-6"
        >
            <div className="text-center space-y-2">
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Welcome Back
                </h1>
                <p className="text-gray-400">Sign in to your Postia account</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-gray-300">
                        Email
                    </label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-gray-300">
                        Password
                    </label>
                    <Input
                        id="password"
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-md p-3">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full bg-primary hover:bg-primary-hover text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-primary/25"
                    disabled={loading}
                >
                    {loading ? 'Signing in...' : 'Sign In'}
                </Button>
            </form>

            <div className="text-center text-sm text-gray-400">
                Don't have an account?{' '}
                <Link href="/auth/register" className="text-primary hover:text-primary-hover transition-colors">
                    Sign up
                </Link>
            </div>
        </motion.div>
    );
}
