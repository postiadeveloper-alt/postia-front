'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

function CallbackContent() {
    const searchParams = useSearchParams();
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
    const [message, setMessage] = useState('Conectando tu cuenta de Instagram...');
    const [accountInfo, setAccountInfo] = useState<any>(null);

    useEffect(() => {
        const handleCallback = async () => {
            const code = searchParams.get('code');
            const state = searchParams.get('state');
            const error = searchParams.get('error');
            const errorDescription = searchParams.get('error_description');

            if (error) {
                setStatus('error');
                setMessage(errorDescription || 'Autorización cancelada');
                if (window.opener) {
                    window.opener.postMessage({ type: 'instagram-error', error: errorDescription || 'Authorization failed' }, '*');
                    setTimeout(() => window.close(), 2000);
                }
                return;
            }

            if (!code || !state) {
                setStatus('error');
                setMessage('Parámetros de autorización faltantes');
                return;
            }

            try {
                // Call the backend callback endpoint via the API rewrite
                const response = await fetch(`/api/instagram/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`);
                const data = await response.json();

                if (!response.ok) {
                    throw new Error(data.message || 'Failed to connect Instagram');
                }

                setStatus('success');
                setMessage('¡Cuenta conectada exitosamente!');
                setAccountInfo(data);

                if (window.opener) {
                    window.opener.postMessage({
                        type: 'instagram-connected',
                        success: true,
                        account: {
                            id: data.id,
                            username: data.username,
                            name: data.name,
                            profilePictureUrl: data.profilePictureUrl,
                            followersCount: data.followersCount,
                            biography: data.biography,
                        }
                    }, '*');
                    setTimeout(() => window.close(), 2000);
                }
            } catch (err: any) {
                console.error('Instagram callback error:', err);
                setStatus('error');
                setMessage(err.message || 'Error al conectar la cuenta');
                if (window.opener) {
                    window.opener.postMessage({ type: 'instagram-error', error: err.message }, '*');
                    setTimeout(() => window.close(), 3000);
                }
            }
        };

        handleCallback();
    }, [searchParams]);

    return (
        <div className="py-10">
            <div className="bg-white/[0.08] backdrop-blur-lg border border-white/10 rounded-2xl p-10 text-center shadow-2xl">
                {status === 'loading' && (
                    <>
                        <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin mx-auto mb-6" />
                        <h1 className="text-2xl font-bold text-white mb-2">Conectando...</h1>
                        <p className="text-gray-400">{message}</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="text-6xl mb-4">✓</div>
                        <h1 className="text-2xl font-bold text-white mb-2">¡Instagram Conectado!</h1>
                        {accountInfo && (
                            <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4 my-4">
                                <p className="text-cyan-400 text-xl font-bold">@{accountInfo.username}</p>
                                <p className="text-gray-400 text-sm mt-1">
                                    {accountInfo.followersCount?.toLocaleString() || 0} seguidores
                                </p>
                            </div>
                        )}
                        <p className="text-gray-400">{message}</p>
                        <p className="text-gray-500 text-sm mt-2">Cerrando ventana automáticamente...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="text-6xl mb-4">✕</div>
                        <h1 className="text-2xl font-bold text-red-400 mb-2">Error de Conexión</h1>
                        <p className="text-gray-400">{message}</p>
                        <button
                            onClick={() => window.close()}
                            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 border border-white/10 rounded-lg text-white text-sm transition-colors"
                        >
                            Cerrar ventana
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default function CallbackPage() {
    return (
        <Suspense fallback={
            <div className="py-10 flex items-center justify-center">
                <div className="w-16 h-16 border-4 border-pink-500/30 border-t-pink-500 rounded-full animate-spin" />
            </div>
        }>
            <CallbackContent />
        </Suspense>
    );
}
