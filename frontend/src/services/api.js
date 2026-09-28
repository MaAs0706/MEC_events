import axios from "axios";

// #7: base URL comes from VITE_API_URL so the app can point at a
// deployed backend without a code change. Falls back to local dev.
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
})

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('accessToken')

    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }

    return config
})

// #5: automatic JWT-expiry handling. Any 401 from the API means the
// token is missing, invalid, or expired — clear it and send the user
// back to the login page. Login's own 401 (wrong password) is exempt.
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error.response?.status
        const url = error.config?.url || ''

        const isAuthCall =
            url.includes('/auth/login') ||
            url.includes('/auth/register')

        if (status === 401 && !isAuthCall) {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('userEmail')
            localStorage.removeItem('userName')
            localStorage.removeItem('userRole')

            if (window.location.pathname !== '/login') {
                window.location.href = '/login'
            }
        }

        return Promise.reject(error)
    }
)

export default api;
