import axios, { AxiosInstance } from 'axios';
import { API_BASE_URL, APP_CONFIG } from './constants';

class ApiService {
    private api: AxiosInstance;
    public baseURL: string;

    constructor() {
        this.baseURL = API_BASE_URL;
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 120000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        // Request interceptor to add auth token
        this.api.interceptors.request.use(
            async (config) => {
                if (typeof window !== 'undefined') {
                    const token = localStorage.getItem(APP_CONFIG.tokenKey);
                    console.log(`[API] Request to ${config.url}`, token ? 'with token' : 'NO TOKEN');
                    if (token) {
                        config.headers.Authorization = `Bearer ${token}`;
                    }
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        // Response interceptor for error handling
        this.api.interceptors.response.use(
            (response) => {
                console.log(`[API] Response from ${response.config.url}:`, response.status);
                return response;
            },
            async (error) => {
                console.error(`[API] Error from ${error.config?.url}:`, error.response?.status, error.message);
                if (error.response?.status === 401) {
                    console.log('[API] 401 Unauthorized - clearing token and redirecting');
                    // Token expired or invalid
                    if (typeof window !== 'undefined') {
                        localStorage.removeItem(APP_CONFIG.tokenKey);
                        window.location.href = '/auth/login';
                    }
                }
                return Promise.reject(error);
            }
        );
    }

    // Auth endpoints
    async register(email: string, password: string, fullName: string, agencyName?: string) {
        const response = await this.api.post('/auth/register', {
            email,
            password,
            fullName,
            agencyName,
        });
        return response.data;
    }

    async login(email: string, password: string) {
        const response = await this.api.post('/auth/login', { email, password });
        return response.data;
    }

    // Instagram endpoints
    async getInstagramAccounts() {
        const response = await this.api.get('/instagram/accounts');
        return response.data;
    }

    async getInstagramAuthUrl() {
        const response = await this.api.get('/instagram/auth-url');
        return response.data.authUrl;
    }

    async refreshInstagramAccount(accountId: string) {
        const response = await this.api.post(`/instagram/accounts/${accountId}/refresh`);
        return response.data;
    }

    async disconnectInstagramAccount(accountId: string) {
        const response = await this.api.post(`/instagram/accounts/${accountId}/disconnect`);
        return response.data;
    }

    async connectInstagramAccount(accessToken: string) {
        const response = await this.api.post('/instagram/connect', null, {
            params: { access_token: accessToken },
        });
        return response.data;
    }

    // Calendar endpoints
    async getPosts(accountId?: string) {
        const url = accountId ? `/calendar/posts/account/${accountId}` : '/calendar/posts';
        const response = await this.api.get(url);
        return response.data;
    }

    async getPostsByDateRange(accountId: string, startDate: string, endDate: string) {
        const response = await this.api.get(`/calendar/posts/account/${accountId}/range`, {
            params: { startDate, endDate },
        });
        return response.data;
    }

    async getUpcomingPosts(accountId: string, limit?: number) {
        const response = await this.api.get(`/calendar/posts/account/${accountId}/upcoming`, {
            params: { limit },
        });
        return response.data;
    }

    async createPost(postData: any) {
        const response = await this.api.post('/calendar/posts', postData);
        return response.data;
    }

    async updatePost(postId: string, postData: any) {
        const response = await this.api.patch(`/calendar/posts/${postId}`, postData);
        return response.data;
    }

    async deletePost(postId: string) {
        const response = await this.api.delete(`/calendar/posts/${postId}`);
        return response.data;
    }

    async publishPost(postId: string) {
        const response = await this.api.post(`/calendar/posts/${postId}/publish`);
        return response.data;
    }

    async publishPostNow(postId: string) {
        const response = await this.api.post(`/calendar/posts/${postId}/publish-now`, {}, {
            timeout: 180000 // 3 minutes timeout for video processing
        });
        return response.data;
    }

    async uploadMedia(formData: FormData) {
        const response = await this.api.post('/upload/media', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    // Analytics endpoints
    async getAccountInsights(accountId: string, period?: string, since?: string, until?: string) {
        const response = await this.api.get(`/analytics/account/${accountId}`, {
            params: { period, since, until },
        });
        return response.data;
    }

    async getEngagementRate(accountId: string) {
        const response = await this.api.get(`/analytics/account/${accountId}/engagement-rate`);
        return response.data;
    }

    async getFollowerDemographics(accountId: string) {
        const response = await this.api.get(`/analytics/account/${accountId}/demographics`);
        return response.data;
    }

    async getTopPosts(accountId: string, limit?: number) {
        const response = await this.api.get(`/analytics/account/${accountId}/top-posts`, {
            params: { limit },
        });
        return response.data;
    }

    async getPostInsights(accountId: string, postId: string) {
        const response = await this.api.get(`/analytics/post/${accountId}/${postId}`);
        return response.data;
    }

    // Trending endpoints
    async getTrendingTopics(accountId: string, limit?: number) {
        const response = await this.api.get(`/trending/topics/${accountId}`, {
            params: { limit },
        });
        return response.data;
    }

    async getTrendingHashtags(accountId: string, category?: string) {
        const response = await this.api.get(`/trending/hashtags/${accountId}`, {
            params: { category },
        });
        return response.data;
    }

    async getContentSuggestions(accountId: string, limit?: number) {
        const response = await this.api.get(`/trending/suggestions/${accountId}`, {
            params: { limit },
        });
        return response.data;
    }

    // Business Profile endpoints
    async getBusinessProfile(accountId: string) {
        const response = await this.api.get(`/business-profile/account/${accountId}`);
        return response.data;
    }

    async createBusinessProfile(profileData: any) {
        const response = await this.api.post('/business-profile', profileData);
        return response.data;
    }

    async updateBusinessProfile(profileId: string, profileData: any) {
        const response = await this.api.patch(`/business-profile/${profileId}`, profileData);
        return response.data;
    }

    async deleteBusinessProfile(profileId: string) {
        const response = await this.api.delete(`/business-profile/${profileId}`);
        return response.data;
    }
}

const apiService = new ApiService();
export default apiService;
