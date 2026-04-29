import { Layout, Menu, Avatar, Dropdown, Button, Space, Badge, Input, Typography, Drawer } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  EditOutlined,
  UserOutlined,
  SettingOutlined,
  LogoutOutlined,
  BellOutlined,
  MenuOutlined,
  SearchOutlined,
} from '@ant-design/icons'
import { useAuthStore } from '../stores/auth'
import { authApi } from '../services/api'
import { useState, useEffect } from 'react'

const { Header, Content, Footer } = Layout

export function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, clearAuth } = useAuthStore()
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCount] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

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
      onClick: () => {
        navigate('/profile')
        setMobileMenuOpen(false)
      },
    },
    {
      key: 'notifications',
      icon: <BellOutlined />,
      label: '通知中心',
      onClick: () => {
        navigate('/notifications')
        setMobileMenuOpen(false)
      },
    },
    ...(user?.role === 'admin'
      ? [
          {
            key: 'admin',
            icon: <SettingOutlined />,
            label: '管理后台',
            onClick: () => {
              navigate('/admin')
              setMobileMenuOpen(false)
            },
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

  const mobileDrawerMenuItems = [
    ...menuItems,
    { type: 'divider' as const },
    ...userMenuItems.slice(0, -1), // exclude divider and logout
    {
      key: 'logout-mobile',
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
          padding: isMobile ? '0 12px' : '0 24px',
          height: isMobile ? 56 : 64,
        }}
      >
        {/* 左侧：汉堡按钮 + Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 24 }}>
          {isMobile && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 20 }} />}
              onClick={() => setMobileMenuOpen(true)}
              aria-label="菜单"
            />
          )}
          <Typography.Title
            level={1}
            style={{
              fontSize: isMobile ? 18 : 20,
              fontWeight: 'bold',
              color: '#1677ff',
              cursor: 'pointer',
              margin: 0,
              lineHeight: 1,
            }}
            onClick={() => navigate('/')}
          >
            缘圈子
          </Typography.Title>
          {!isMobile && (
            <Menu
              mode="horizontal"
              selectedKeys={[location.pathname]}
              items={menuItems}
              style={{ borderBottom: 'none', minWidth: 200 }}
            />
          )}
        </div>

        {/* 右侧：搜索 + 通知 + 用户 */}
        <Space size={isMobile ? 4 : 12}>
          {isMobile ? (
            <Input.Search
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 140 }}
              size="small"
            />
          ) : (
            <Input.Search
              placeholder="搜索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onSearch={handleSearch}
              style={{ width: 200 }}
            />
          )}
          <Badge count={unreadCount} size="small">
            <Button
              type="text"
              icon={<BellOutlined />}
              onClick={() => navigate('/notifications')}
              aria-label="通知"
              title="通知"
            />
          </Badge>
          {isMobile ? (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Avatar
                src={user?.avatarUrl}
                icon={<UserOutlined />}
                style={{ cursor: 'pointer' }}
                size={32}
              />
            </Dropdown>
          ) : (
            <Dropdown menu={{ items: userMenuItems }} placement="bottomRight">
              <Space style={{ cursor: 'pointer' }}>
                <Avatar src={user?.avatarUrl} icon={<UserOutlined />} />
                <span>{user?.username}</span>
              </Space>
            </Dropdown>
          )}
        </Space>
      </Header>

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="缘圈子"
        placement="left"
        onClose={() => setMobileMenuOpen(false)}
        open={mobileMenuOpen}
        width={260}
        styles={{ body: { padding: 0 } }}
      >
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={[
            {
              key: '/',
              icon: <HomeOutlined />,
              label: '首页',
              onClick: () => {
                navigate('/')
                setMobileMenuOpen(false)
              },
            },
            {
              key: '/post/new',
              icon: <EditOutlined />,
              label: '发布',
              onClick: () => {
                navigate('/post/new')
                setMobileMenuOpen(false)
              },
            },
            {
              key: 'divider-1',
              type: 'divider',
            },
            {
              key: '/profile',
              icon: <UserOutlined />,
              label: '个人中心',
              onClick: () => {
                navigate('/profile')
                setMobileMenuOpen(false)
              },
            },
            {
              key: '/notifications',
              icon: <BellOutlined />,
              label: '通知中心',
              onClick: () => {
                navigate('/notifications')
                setMobileMenuOpen(false)
              },
            },
            ...(user?.role === 'admin'
              ? [
                  {
                    key: '/admin',
                    icon: <SettingOutlined />,
                    label: '管理后台',
                    onClick: () => {
                      navigate('/admin')
                      setMobileMenuOpen(false)
                    },
                  } as const,
                ]
              : []),
            {
              key: 'divider-2',
              type: 'divider',
            },
            {
              key: 'logout',
              icon: <LogoutOutlined />,
              label: '退出登录',
              onClick: handleLogout,
            },
          ]}
        />
      </Drawer>

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
