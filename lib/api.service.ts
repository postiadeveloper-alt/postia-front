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
    async getAccountOverview(accountId: string) {
        const response = await this.api.get(`/analytics/account/${accountId}/overview`);
        return response.data;
    }

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

    async getTrendingKeywords(accountId: string) {
        const response = await this.api.get(`/trending/keywords/${accountId}`);
        return response.data;
    }

    async getTrendingTechniques(accountId: string) {
        const response = await this.api.get(`/trending/techniques/${accountId}`);
        return response.data;
    }

    async getTrendingTechnologies(accountId: string) {
        const response = await this.api.get(`/trending/technologies/${accountId}`);
        return response.data;
    }

    async getInspiringPosts(accountId: string) {
        const response = await this.api.get(`/trending/inspiring-posts/${accountId}`);
        return response.data;
    }

    // Business Profile endpoints
    async getBusinessProfiles() {
        const response = await this.api.get('/business-profile');
        return response.data;
    }

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

    // Image Processing endpoints
    async uploadTemplate(file: File, businessProfileId?: string) {
        const formData = new FormData();
        formData.append('file', file);
        if (businessProfileId) formData.append('businessProfileId', businessProfileId);
        const response = await this.api.post('/image-processing/upload/template', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async uploadContent(file: File, businessProfileId?: string) {
        const formData = new FormData();
        formData.append('file', file);
        if (businessProfileId) formData.append('businessProfileId', businessProfileId);
        const response = await this.api.post('/image-processing/upload/content', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async generateImage(templatePath: string, contentPath: string) {
        const response = await this.api.post('/image-processing/generate', {
            templatePath,
            contentPath,
        });
        return response.data;
    }

    async generateImageWithFormat(
        templatePath: string,
        contentPath: string,
        formatSettings: {
            format: 'story' | 'reel' | 'post' | 'carousel';
            width: number;
            height: number;
            cropX: number;
            cropY: number;
            scale: number;
            overlayText?: string;
            overlayFont?: string;
            overlayColor?: string;
            overlayX?: number;
            overlayY?: number;
            overlaySize?: number;
            targetEmotion?: string;
        },
        businessProfileId?: string,
    ) {
        const response = await this.api.post('/image-processing/generate-with-format', {
            templatePath,
            contentPath,
            ...formatSettings,
            businessProfileId,
        });
        return response.data;
    }

    async listTemplates(businessProfileId?: string) {
        const params: any = {};
        if (businessProfileId) params.businessProfileId = businessProfileId;
        const response = await this.api.get('/image-processing/templates', { params });
        return response.data;
    }

    async listContent(businessProfileId?: string) {
        const params: any = {};
        if (businessProfileId) params.businessProfileId = businessProfileId;
        const response = await this.api.get('/image-processing/content', { params });
        return response.data;
    }

    async listOutputs(businessProfileId?: string) {
        const params: any = {};
        if (businessProfileId) params.businessProfileId = businessProfileId;
        const response = await this.api.get('/image-processing/outputs', { params });
        return response.data;
    }

    async updateAssetEmotion(assetId: string, targetEmotion: string) {
        const response = await this.api.patch(`/image-processing/${assetId}/emotion`, { targetEmotion });
        return response.data;
    }

    async uploadLogo(file: File, instagramAccountId: string, businessProfileId?: string) {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('instagramAccountId', instagramAccountId);
        if (businessProfileId) formData.append('businessProfileId', businessProfileId);
        const response = await this.api.post('/image-processing/upload/logo', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    async generateAITemplates(instagramAccountId: string, businessProfileId?: string) {
        const response = await this.api.post('/image-processing/generate-ai-templates', {
            instagramAccountId,
            businessProfileId,
        });
        return response.data;
    }

    // Returns base64 PNG previews for all 6 template types — no GCS upload
    async getTemplatesPreviews(primary: string, secondary: string): Promise<Array<{ name: string; label: string; dataUrl: string }>> {
        const response = await this.api.get('/image-processing/templates/preview', {
            params: { primary, secondary },
        });
        return response.data;
    }

    // Generate using an inline template blob (from a locally-generated preview template)
    async generateImageWithFormatInline(
        templateBlob: Blob,
        contentPath: string,
        formatSettings: {
            format: 'story' | 'reel' | 'post' | 'carousel';
            width: number;
            height: number;
            cropX: number;
            cropY: number;
            scale: number;
            overlayText?: string;
            overlayFont?: string;
            overlayColor?: string;
            overlayX?: number;
            overlayY?: number;
            overlaySize?: number;
            targetEmotion?: string;
        },
        businessProfileId?: string,
    ) {
        const formData = new FormData();
        formData.append('templateFile', templateBlob, 'template.png');
        formData.append('contentPath', contentPath);
        formData.append('format', formatSettings.format);
        formData.append('width', String(formatSettings.width));
        formData.append('height', String(formatSettings.height));
        formData.append('cropX', String(formatSettings.cropX));
        formData.append('cropY', String(formatSettings.cropY));
        formData.append('scale', String(formatSettings.scale));
        if (formatSettings.overlayText) formData.append('overlayText', formatSettings.overlayText);
        if (formatSettings.overlayFont) formData.append('overlayFont', formatSettings.overlayFont);
        if (formatSettings.overlayColor) formData.append('overlayColor', formatSettings.overlayColor);
        if (formatSettings.overlayX != null) formData.append('overlayX', String(formatSettings.overlayX));
        if (formatSettings.overlayY != null) formData.append('overlayY', String(formatSettings.overlayY));
        if (formatSettings.overlaySize) formData.append('overlaySize', String(formatSettings.overlaySize));
        if (formatSettings.targetEmotion) formData.append('targetEmotion', formatSettings.targetEmotion);
        if (businessProfileId) formData.append('businessProfileId', businessProfileId);

        const response = await this.api.post('/image-processing/generate-with-format-inline', formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
            timeout: 120000,
        });
        return response.data;
    }

    // Content Strategy endpoints
    async generateContentStrategy(data: {
        businessProfileId: string;
        selectedDates: string[];
        monthYear: string;
        formatDistribution?: {
            reels: number;
            stories: number;
            carousels: number;
            staticPosts: number;
        };
        goal?: string;
    }) {
        // Exclude 'goal' — not accepted by the backend DTO
        const { goal, ...payload } = data;
        const response = await this.api.post('/content-strategy/generate', payload);
        return response.data;
    }

    async getContentStrategies() {
        const response = await this.api.get('/content-strategy');
        return response.data;
    }

    async getContentStrategiesByMonth(monthYear: string, businessProfileId: string) {
        const response = await this.api.get(`/content-strategy/month/${monthYear}/profile/${businessProfileId}`);
        return response.data;
    }

    async getContentStrategiesByRange(startDate: string, endDate: string, businessProfileId: string) {
        const response = await this.api.get('/content-strategy/range', {
            params: { startDate, endDate, businessProfileId }
        });
        return response.data;
    }

    async getContentStrategy(id: string) {
        const response = await this.api.get(`/content-strategy/${id}`);
        return response.data;
    }

    async updateContentStrategy(id: string, data: any) {
        const response = await this.api.patch(`/content-strategy/${id}`, data);
        return response.data;
    }

    async deleteContentStrategy(id: string) {
        const response = await this.api.delete(`/content-strategy/${id}`);
        return response.data;
    }

    async deleteContentStrategiesByMonth(monthYear: string, businessProfileId: string) {
        const response = await this.api.delete(`/content-strategy/month/${monthYear}/profile/${businessProfileId}`);
        return response.data;
    }

    async convertContentStrategyToPost(id: string) {
        const response = await this.api.post(`/content-strategy/${id}/convert-to-post`);
        return response.data;
    }

    async generateCaption(businessProfileId: string, imageUrl?: string) {
        const response = await this.api.post('/content-strategy/generate-caption', {
            businessProfileId,
            imageUrl
        });
        return response.data;
    }
}


const apiService = new ApiService();
export default apiService;
