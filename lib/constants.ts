// API Configuration
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Instagram Configuration
export const INSTAGRAM_CONFIG = {
    appId: process.env.NEXT_PUBLIC_INSTAGRAM_APP_ID || '',
    redirectUri: process.env.NEXT_PUBLIC_INSTAGRAM_REDIRECT_URI || '',
};

// App Configuration
export const APP_CONFIG = {
    name: 'Postia',
    version: '1.0.0',
    tokenKey: 'postia_auth_token',
    refreshTokenKey: 'postia_refresh_token',
};

// Theme Colors
export const COLORS = {
    primary: '#ee3ec9',
    primaryDark: '#c31a9e',
    secondary: '#00ffff',
    accent: '#ff00ff',
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    background: '#0a0a1a',
    backgroundLight: '#1a1a2e',
    card: 'rgba(255, 255, 255, 0.05)',
    cardGlass: 'rgba(255, 255, 255, 0.08)',
    text: '#ffffff',
    textSecondary: '#a0a0b0',
    border: 'rgba(255, 255, 255, 0.1)',
    placeholder: '#6B7280',
    instagram: '#E4405F',
    linkedin: '#0077B5',
};

// Gradients
export const GRADIENTS = {
    primary: ['#ee3ec9', '#ff00ff'],
    secondary: ['#00ffff', '#00cccc'],
    accent: ['#ff00ff', '#ee3ec9', '#00ffff'],
    dark: ['#0a0a1a', '#1a1a2e'],
    card: ['rgba(238, 62, 201, 0.1)', 'rgba(0, 255, 255, 0.1)'],
};

// Screen Sizes
export const BREAKPOINTS = {
    mobile: 480,
    tablet: 768,
    desktop: 1024,
};
