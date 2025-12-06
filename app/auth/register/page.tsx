'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { motion } from 'framer-motion';

export default function RegisterPage() {
    const router = useRouter();
    const { register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [agencyName, setAgencyName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await register(email, password, fullName, agencyName || undefined);
            router.push('/dashboard/calendar');
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to register. Please try again.');
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
                    Create Account
                </h1>
                <p className="text-gray-400">Get started with Postia today</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium text-gray-300">
                        Full Name
                    </label>
                    <Input
                        id="fullName"
                        type="text"
                        placeholder="John Doe"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                    />
                </div>

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

                <div className="space-y-2">
                    <label htmlFor="agencyName" className="text-sm font-medium text-gray-300">
                        Agency Name <span className="text-gray-500">(Optional)</span>
                    </label>
                    <Input
                        id="agencyName"
                        type="text"
                        placeholder="Your Agency"
                        value={agencyName}
                        onChange={(e) => setAgencyName(e.target.value)}
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
                    {loading ? 'Creating account...' : 'Create Account'}
                </Button>
            </form>

            <div className="text-center text-sm text-gray-400">
                Already have an account?{' '}
                <Link href="/auth/login" className="text-primary hover:text-primary-hover transition-colors">
                    Sign in
                </Link>
            </div>
        </motion.div>
    );
}
