import { createBrowserRouter, Navigate } from 'react-router-dom'
import { MainLayout } from './components/MainLayout'
import { Login } from './pages/Login'
import { Home } from './pages/Home'
import { PostDetail } from './pages/PostDetail'
import { PostEditor } from './pages/PostEditor'
import { Profile } from './pages/Profile'
import { Notifications } from './pages/Notifications'
import { Search } from './pages/Search'
import { Settings } from './pages/Settings'
import { AdminLayout } from './pages/Admin/AdminLayout'
import { UserManage } from './pages/Admin/UserManage'
import { BoardManage } from './pages/Admin/BoardManage'
import { useAuthStore } from './stores/auth'

// 路由守卫组件
function RequireAuth({ children, requireAdmin = false }: { children: React.ReactNode; requireAdmin?: boolean }) {
  const { user, accessToken } = useAuthStore()
  const isAuthenticated = !!accessToken

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (requireAdmin && user?.role !== 'admin') {
    return <Navigate to="/" replace />
  }

  return <>{children}</>
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: (
      <RequireAuth>
        <MainLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'post/:id',
        element: <PostDetail />,
      },
      {
        path: 'post/new',
        element: <PostEditor />,
      },
      {
        path: 'post/:id/edit',
        element: <PostEditor />,
      },
      {
        path: 'profile',
        element: <Profile />,
      },
      {
        path: 'profile/:id',
        element: <Profile />,
      },
      {
        path: 'notifications',
        element: <Notifications />,
      },
      {
        path: 'search',
        element: <Search />,
      },
      {
        path: 'settings',
        element: <Settings />,
      },
    ],
  },
  {
    path: '/admin',
    element: (
      <RequireAuth requireAdmin>
        <AdminLayout />
      </RequireAuth>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/admin/users" replace />,
      },
      {
        path: 'users',
        element: <UserManage />,
      },
      {
        path: 'boards',
        element: <BoardManage />,
      },
    ],
  },
])
