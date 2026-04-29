import { Layout, Menu, Button, Drawer } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { UserOutlined, AppstoreOutlined, ArrowLeftOutlined, MenuOutlined } from '@ant-design/icons'

const { Sider, Content } = Layout

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const menuItems = [
    {
      key: '/admin/users',
      icon: <UserOutlined />,
      label: '用户管理',
    },
    {
      key: '/admin/boards',
      icon: <AppstoreOutlined />,
      label: '板块管理',
    },
  ]

  const handleMenuClick = (key: string) => {
    navigate(key)
    setDrawerOpen(false)
  }

  const sidebarContent = (
    <>
      <div
        style={{
          padding: '16px',
          fontSize: 18,
          fontWeight: 'bold',
          borderBottom: '1px solid #f0f0f0',
          cursor: 'pointer',
        }}
        onClick={() => { navigate('/'); setDrawerOpen(false) }}
      >
        <ArrowLeftOutlined style={{ marginRight: 8 }} />
        缘圈子
      </div>
      <Menu
        mode="inline"
        selectedKeys={[location.pathname]}
        items={menuItems.map((item) => ({
          ...item,
          onClick: () => handleMenuClick(item.key),
        }))}
      />
    </>
  )

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {isMobile ? (
        <>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 16px',
            borderBottom: '1px solid #f0f0f0',
            background: '#fff',
          }}>
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: 18 }} />}
              onClick={() => setDrawerOpen(true)}
            />
            <span style={{ fontWeight: 'bold', fontSize: 16 }}>管理后台</span>
          </div>
          <Drawer
            title="管理后台"
            placement="left"
            onClose={() => setDrawerOpen(false)}
            open={drawerOpen}
            width={240}
            styles={{ body: { padding: 0 } }}
          >
            {sidebarContent}
          </Drawer>
        </>
      ) : (
        <Sider theme="light" width={200} style={{ borderRight: '1px solid #f0f0f0' }}>
          {sidebarContent}
        </Sider>
      )}
      <Content style={{ padding: isMobile ? 12 : 24, background: '#fff', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
