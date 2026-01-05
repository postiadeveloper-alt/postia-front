'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import apiService from '@/lib/api.service';
import { User, Mail, Building2, Instagram, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ProfilePage() {
    const { user, logout } = useAuth();
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadInstagramAccounts();

        // Listen for messages from the OAuth popup
        const handleMessage = (event: MessageEvent) => {
            if (event.data?.type === 'instagram-connected') {
                if (event.data.success) {
                    alert('Instagram account connected successfully!');
                    loadInstagramAccounts();
                }
            } else if (event.data?.type === 'instagram-error') {
                alert('Failed to connect Instagram: ' + event.data.error);
            }
        };

        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

    const loadInstagramAccounts = async () => {
        try {
            const data = await apiService.getInstagramAccounts();
            setAccounts(data || []);
        } catch (error) {
            console.error('Failed to load accounts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRefreshAccount = async (accountId: string) => {
        try {
            await apiService.refreshInstagramAccount(accountId);
            alert('Account refreshed successfully!');
            loadInstagramAccounts();
        } catch (error: any) {
            console.error('Failed to refresh account:', error);
            alert('Failed to refresh account: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleDisconnect = async (accountId: string) => {
        if (!confirm('Are you sure you want to disconnect this Instagram account?')) return;

        try {
            await apiService.disconnectInstagramAccount(accountId);
            alert('Account disconnected successfully');
            loadInstagramAccounts();
        } catch (error: any) {
            console.error('Failed to disconnect account:', error);
            alert('Failed to disconnect account: ' + (error.response?.data?.message || error.message));
        }
    };

    const handleConnectAccount = async () => {
        try {
            const authUrl = await apiService.getInstagramAuthUrl();
            const width = 600;
            const height = 700;
            const left = window.screenX + (window.innerWidth - width) / 2;
            const top = window.screenY + (window.innerHeight - height) / 2;

            window.open(
                authUrl,
                'Connect Instagram',
                `width=${width},height=${height},left=${left},top=${top}`
            );
        } catch (error: any) {
            console.error('Failed to get auth URL:', error);
            alert('Failed to start Instagram connection: ' + (error.response?.data?.message || error.message));
        }
    };

    return (
        <div className="space-y-6 max-w-4xl">
            <div>
                <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-primary">
                    Profile Settings
                </h1>
                <p className="text-gray-400 mt-1">Manage your account and connected platforms</p>
            </div>

            {/* User Information */}
            <div className="glass-card p-6">
                <h3 className="text-xl font-semibold mb-6">Personal Information</h3>
                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                            <User className="w-4 h-4" />
                            Full Name
                        </label>
                        <Input value={user?.fullName || ''} disabled />
                    </div>
                    <div>
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                            <Mail className="w-4 h-4" />
                            Email
                        </label>
                        <Input value={user?.email || ''} disabled />
                    </div>
                    {user?.agencyName && (
                        <div>
                            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
                                <Building2 className="w-4 h-4" />
                                Agency Name
                            </label>
                            <Input value={user.agencyName} disabled />
                        </div>
                    )}
                </div>
            </div>

            {/* Connected Accounts */}
            <div className="glass-card p-6">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                        <Instagram className="w-5 h-5 text-pink-500" />
                        Connected Instagram Accounts
                    </h3>
                    <Button onClick={handleConnectAccount} className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600">
                        Connect New Account
                    </Button>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-gray-400">Loading accounts...</div>
                ) : accounts.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                        No Instagram accounts connected yet. Connect one to get started!
                    </div>
                ) : (
                    <div className="space-y-4">
                        {accounts.map((account: any) => (
                            <div key={account.id} className="flex items-center justify-between p-4 bg-white/5 hover:bg-white/10 rounded-lg transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                                        <Instagram className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="font-semibold">{account.username}</p>
                                        <p className="text-sm text-gray-400">{account.followers?.toLocaleString()} followers</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => handleRefreshAccount(account.id)} variant="outline" size="sm">
                                        Refresh
                                    </Button>
                                    <Button onClick={() => handleDisconnect(account.id)} variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                                        Disconnect
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Danger Zone */}
            <div className="glass-card p-6 border-red-500/20">
                <h3 className="text-xl font-semibold mb-4 text-red-400">Danger Zone</h3>
                <div className="space-y-3">
                    <Button
                        onClick={logout}
                        className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30"
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </div>
            </div>
        </div>
    );
}
