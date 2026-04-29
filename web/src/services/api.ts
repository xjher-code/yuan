import axios, { AxiosError } from 'axios'
import { useAuthStore } from '../stores/auth'

const API_BASE_URL = 'http://localhost:3000/api'

// 创建 axios 实例
export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加 Token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().accessToken
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器 - 处理 Token 刷新
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    // Token 过期，尝试刷新
    if (error.response?.status === 401) {
      const refreshToken = useAuthStore.getState().refreshToken
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh`, {
            refreshToken,
          })
          const { accessToken, refreshToken: newRefreshToken } = response.data
          useAuthStore.getState().setAuth({
            user: useAuthStore.getState().user!,
            accessToken,
            refreshToken: newRefreshToken,
          })
          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        } catch {
          // 刷新失败，清除登录状态
          useAuthStore.getState().clearAuth()
          window.location.href = '/login'
        }
      } else {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

// API 接口
export const authApi = {
  login: (studentNo: string, password: string) =>
    api.post('/auth/login', { studentNo, password }),
  changePassword: (oldPassword: string, newPassword: string) =>
    api.post('/auth/change-password', { oldPassword, newPassword }),
  forgotPassword: (studentNo: string) =>
    api.post('/auth/forgot-password', { studentNo }),
  register: (studentNo: string) =>
    api.post('/auth/register', { studentNo }),
  logout: () => api.post('/auth/logout'),
}

export const userApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: { username?: string; avatarUrl?: string; bio?: string }) =>
    api.patch('/users/me', data),
  getProfile: (id: number) => api.get(`/users/${id}/profile`),
  getStats: () => api.get('/users/me/stats'),
}

export const boardApi = {
  getList: () => api.get('/boards'),
  create: (data: { name: string; description?: string; icon?: string }) =>
    api.post('/boards', data),
  update: (id: number, data: Partial<{ name: string; description: string; icon: string }>) =>
    api.patch(`/boards/${id}`, data),
  delete: (id: number) => api.delete(`/boards/${id}`),
}

export const postApi = {
  getList: (params?: { page?: number; limit?: number; boardId?: number; authorId?: number; sort?: 'new' | 'hot' }) =>
    api.get('/posts', { params }),
  getById: (id: number) => api.get(`/posts/${id}`),
  create: (data: { title: string; content: string; boardId: number; coverImage?: string }) =>
    api.post('/posts', data),
  update: (id: number, data: Partial<{ title: string; content: string; boardId: number }>) =>
    api.patch(`/posts/${id}`, data),
  delete: (id: number) => api.delete(`/posts/${id}`),
  uploadImage: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post('/posts/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
}

export const commentApi = {
  getList: (postId: number, params?: { page?: number; limit?: number }) =>
    api.get('/comments', { params: { postId, ...params } }),
  create: (data: { postId: number; content: string; parentId?: number }) =>
    api.post('/comments', data),
  delete: (id: number) => api.delete(`/comments/${id}`),
}

export const likeApi = {
  like: (targetType: 'post' | 'comment', targetId: number) =>
    api.post(`/likes/${targetType}/${targetId}`),
  unlike: (targetType: 'post' | 'comment', targetId: number) =>
    api.delete(`/likes/${targetType}/${targetId}`),
  hasLiked: (targetType: 'post' | 'comment', targetId: number) =>
    api.get(`/likes/status/${targetType}/${targetId}`),
  getMyLikes: (type: 'post' | 'comment', params?: { page?: number; limit?: number }) =>
    api.get('/likes/my', { params: { type, ...params } }),
}

export const followApi = {
  follow: (targetType: string, targetId: number) =>
    api.post(`/follows/${targetType}/${targetId}`),
  unfollow: (targetType: string, targetId: number) =>
    api.delete(`/follows/${targetType}/${targetId}`),
  isFollowing: (targetType: string, targetId: number) =>
    api.get(`/follows/status/${targetType}/${targetId}`),
  getFollowings: (type?: string, params?: { page?: number; limit?: number }) =>
    api.get('/follows/my/followings', { params: { type, ...params } }),
  getFollowers: (params?: { page?: number; limit?: number }) =>
    api.get('/follows/my/followers', { params }),
  getFollowCounts: (userId: number) =>
    api.get(`/follows/counts/${userId}`),
}

export const collectionApi = {
  getMyCollections: (params?: { page?: number; limit?: number }) =>
    api.get('/collections', { params }),
  getById: (id: number) => api.get(`/collections/${id}`),
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    api.post('/collections', data),
  update: (id: number, data: Partial<{ name: string; description: string; isPublic: boolean }>) =>
    api.patch(`/collections/${id}`, data),
  delete: (id: number) => api.delete(`/collections/${id}`),
  addItem: (collectionId: number, postId: number) =>
    api.post(`/collections/${collectionId}/items`, { postId }),
  removeItem: (collectionId: number, itemId: number) =>
    api.delete(`/collections/${collectionId}/items/${itemId}`),
  hasCollected: (postId: number) =>
    api.get(`/collections/status/${postId}`),
}

export const notificationApi = {
  getMyNotifications: (params?: { page?: number; limit?: number; unreadOnly?: boolean }) =>
    api.get('/notifications', { params }),
  markAsRead: (id: number) => api.post(`/notifications/${id}/read`),
  markAllAsRead: () => api.post('/notifications/read-all'),
  delete: (id: number) => api.delete(`/notifications/${id}`),
}

export const draftApi = {
  getMyDrafts: (params?: { page?: number; limit?: number }) =>
    api.get('/drafts', { params }),
  getById: (id: number) => api.get(`/drafts/${id}`),
  create: (data: { boardId?: number; title?: string; content?: string; tags?: string[] }) =>
    api.post('/drafts', data),
  update: (id: number, data: Partial<{ boardId?: number; title?: string; content?: string; tags?: string[] }>) =>
    api.patch(`/drafts/${id}`, data),
  delete: (id: number) => api.delete(`/drafts/${id}`),
  publish: (id: number) => api.post(`/drafts/${id}/publish`),
}

export const searchApi = {
  searchPosts: (params: { q: string; boardId?: number; authorId?: number; page?: number; limit?: number }) =>
    api.get('/search', { params }),
  searchUsers: (params: { q: string; page?: number; limit?: number }) =>
    api.get('/search/users', { params }),
  getSuggestions: (q: string) =>
    api.get('/search/suggestions', { params: { q } }),
  getTrending: () => api.get('/search/trending'),
}

export const adminApi = {
  getUsers: (params?: { page?: number; limit?: number; search?: string }) =>
    api.get('/admin/users', { params }),
  createUser: (data: { studentNo: string; username: string; role?: string }) =>
    api.post('/admin/users', data),
  updateUserStatus: (id: number, status: string) =>
    api.patch(`/admin/users/${id}/status`, { status }),
  updateUserRole: (id: number, role: string) =>
    api.patch(`/admin/users/${id}/role`, { role }),
  resetPassword: (id: number) =>
    api.post(`/admin/users/${id}/reset-password`),
}
