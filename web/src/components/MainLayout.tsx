import { Layout, Menu, Avatar, Dropdown, Button, Space, Badge, Input, Typography } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  EditOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../services/api'
import { useState } from 'react'

const { Header, Content, Footer } = Layout

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount] = useState(0)

  const handleLogout = async () => {
    try {
      await authApi.logout()
    } finally {
      clearAuth()
      navigate('/login')
    }
  }

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`)
    }
  }

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => navigate('/'),
    },
    {
      key: '/post/new',
      icon: <EditOutlined />,
      label: '发布',
      onClick: () => navigate('/post/new'),
    },
  ]

  const userMenuItems = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: '个人中心',
      onClick: () => navigate('/profile'),
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      onClick: () => navigate('/notifications'),
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '管理后台',
            onClick: () => navigate('/admin'),
          },
        ]
      : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: handleLogout,
    },
  ]

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#fff',
          borderBottom: '1px solid #f0f0f0',
          padding: '0 24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Typography.Title
            level={1}
            style={{
              fontSize: 20,
              fontWeight: 'bold',
              color: '#1677ff',
              cursor: 'pointer',
              margin: 0,
            }}
            onClick={() => navigate('/')}
          >
            缘圈子
          </Typography.Title>
          <Menu
            mode="horizontal"
            selectedKeys={[location.pathname]}
            items={menuItems}
            style={{ borderBottom: 'none', minWidth: 200 }}
          />
        </div>

        <Space>
          <Input.Search
            placeholder="搜索..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onSearch={handleSearch}
            style={{ width: 200 }}
          />
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => navigate('/notifications')}
              aria-label="通知"
              title="通知"
            />
          </Badge>
          <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
            <Space style={{ cursor: 'pointer' }}>
              <Avatar src={user?.avatarUrl} icon={<UserOutlined />} />
              <span>{user?.username}</span>
            </Space>
          </Dropdown>
        </Space>
      </Header>

      <Content style={{ background: '#f5f5f5' }}>
        <Outlet />
      </Content>

      <Footer
        style={{
          textAlign: 'center',
          color: '#9ca3af',
          fontSize: 13,
          padding: '16px 24px',
          borderTop: '1px solid #f0f0f0',
        }}
      >
        缘圈子 &copy; {new Date().getFullYear()}
      </Footer>
    </Layout>
  )
}
