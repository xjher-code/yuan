import { useEffect, useState } from 'react'
import {
  Card,
  List,
  Badge,
  Button,
  Empty,
  Typography,
  Space,
  Tabs,
  message,
} from 'antd'
import {
  MessageOutlined,
  LikeOutlined,
  UserAddOutlined,
  CheckCircleOutlined,
  BellOutlined,
  DeleteOutlined,
} from '@ant-design/icons'
import { notificationApi } from '../../services/api'
import dayjs from 'dayjs'

const { Text } = Typography

interface NotificationItem {
  id: number
  type: string
  title: string
  content: string
  isRead: boolean
  createdAt: string
  data?: Record<string, any>
}

export function Notifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activeTab, setActiveTab] = useState('all')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [activeTab])

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const res = await notificationApi.getMyNotifications({
        unreadOnly: activeTab === 'unread',
        limit: 50,
      })
      setNotifications(res.data.items)
      setUnreadCount(res.data.unreadCount)
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取通知失败')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id)
      setNotifications(
        notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      )
      setUnreadCount(Math.max(0, unreadCount - 1))
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead()
      setNotifications(notifications.map((n) => ({ ...n, isRead: true })))
      setUnreadCount(0)
      message.success('全部已读')
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.delete(id)
      setNotifications(notifications.filter((n) => n.id !== id))
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'comment':
      case 'reply':
        return <MessageOutlined style={{ color: '#1677ff' }} />
      case 'like_post':
      case 'like_comment':
        return <LikeOutlined style={{ color: '#ff4d4f' }} />
      case 'follow':
        return <UserAddOutlined style={{ color: '#52c41a' }} />
      case 'audit_result':
        return <CheckCircleOutlined style={{ color: '#faad14' }} />
      default:
        return <BellOutlined style={{ color: '#8c8c8c' }} />
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: isMobile ? '12px 8px' : '24px 16px' }}>
      <Card
        title={
          <Badge count={unreadCount} size={isMobile ? 'small' : 'default'}>
            <span style={{ fontSize: isMobile ? 16 : 18, fontWeight: 'bold' }}>通知中心</span>
          </Badge>
        }
        extra={
          unreadCount > 0 && (
            <Button type="link" size={isMobile ? 'small' : 'middle'} onClick={handleMarkAllAsRead}>
              全部已读
            </Button>
          )
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'all',
              label: '全部通知',
            },
            {
              key: 'unread',
              label: (
                <Space size={4}>
                  未读
                  {unreadCount > 0 && <Badge count={unreadCount} size="small" />}
                </Space>
              ),
            },
          ]}
        />

        <List
          loading={loading}
          dataSource={notifications}
          locale={{ emptyText: <Empty description="暂无通知" /> }}
          renderItem={(item) => (
            <List.Item
              style={{
                backgroundColor: item.isRead ? 'transparent' : '#f0f7ff',
                padding: isMobile ? '12px' : '16px',
                borderRadius: 8,
                marginBottom: 8,
              }}
              actions={[
                !item.isRead && (
                  <Button
                    type="link"
                    size="small"
                    onClick={() => handleMarkAsRead(item.id)}
                    style={isMobile ? { fontSize: 12, padding: '0 4px' } : undefined}
                  >
                    标记已读
                  </Button>
                ),
                <Button
                  type="text"
                  size="small"
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDelete(item.id)}
                />,
              ]}
            >
              <List.Item.Meta
                avatar={getIcon(item.type)}
                title={
                  <Space size={isMobile ? 4 : 8} wrap>
                    <Text strong={!item.isRead} style={{ fontSize: isMobile ? 14 : 15 }}>{item.title}</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {dayjs(item.createdAt).format('MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={
                  <Text
                    type={item.isRead ? 'secondary' : undefined}
                    style={{ marginTop: 4, fontSize: isMobile ? 13 : 14 }}
                  >
                    {item.content}
                  </Text>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
