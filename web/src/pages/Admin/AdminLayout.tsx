import { Layout, Menu } from 'antd'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { UserOutlined, AppstoreOutlined, ArrowLeftOutlined } from '@ant-design/icons'

const { Sider, Content } = Layout

export function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()

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

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" style={{ borderRight: '1px solid #f0f0f0' }}>
        <div
          style={{
            padding: '16px',
            fontSize: 18,
            fontWeight: 'bold',
            borderBottom: '1px solid #f0f0f0',
            cursor: 'pointer',
          }}
          onClick={() => navigate('/')}
        >
          <ArrowLeftOutlined style={{ marginRight: 8 }} />
          缘圈子
        </div>
        <Menu
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems.map((item) => ({
            ...item,
            onClick: () => navigate(item.key),
          }))}
        />
      </Sider>
      <Content style={{ padding: 24, background: '#fff' }}>
        <Outlet />
      </Content>
    </Layout>
  )
}
