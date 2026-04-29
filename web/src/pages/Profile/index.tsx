import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Avatar,
  Typography,
  Tabs,
  List,
  Space,
  Tag,
  Button,
  Empty,
  Skeleton,
  message,
  Statistic,
  Row,
  Col,
} from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
  EditOutlined,
} from '@ant-design/icons'
import { userApi, postApi, followApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface UserProfile {
  id: number
  studentNo: string
  username: string
  avatarUrl?: string
  bio?: string
  role: string
  createdAt: string
}

interface PostItem {
  id: number
  title: string
  board: { name: string }
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
}

export function Profile() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user: currentUser } = useAuthStore()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [loading, setLoading] = useState(false)
  const [postLoading, setPostLoading] = useState(false)
  const [followCounts, setFollowCounts] = useState({ following: 0, followers: 0 })
  const [isFollowing, setIsFollowing] = useState(false)

  const userId = id ? Number(id) : currentUser?.id
  const isSelf = currentUser?.id === userId
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    if (userId) {
      fetchProfile(userId)
      fetchUserPosts(userId)
      fetchFollowCounts(userId)
      if (!isSelf) {
        checkFollowing(userId)
      }
    }
  }, [userId])

  const fetchProfile = async (uid: number) => {
    setLoading(true)
    try {
      const res = await userApi.getProfile(uid)
      setProfile(res.data)
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户信息失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUserPosts = async (uid: number) => {
    setPostLoading(true)
    try {
      const res = await postApi.getList({ authorId: uid, limit: 20 })
      setPosts(res.data.items)
    } catch {
      // 忽略错误
    } finally {
      setPostLoading(false)
    }
  }

  const fetchFollowCounts = async (uid: number) => {
    try {
      const res = await followApi.getFollowCounts(uid)
      setFollowCounts(res.data)
    } catch {
      // 忽略错误
    }
  }

  const checkFollowing = async (uid: number) => {
    try {
      const res = await followApi.isFollowing('user', uid)
      setIsFollowing(res.data.following)
    } catch {
      // 忽略错误
    }
  }

  const handleFollow = async () => {
    if (!userId) return
    try {
      if (isFollowing) {
        await followApi.unfollow('user', userId)
        setIsFollowing(false)
        setFollowCounts({ ...followCounts, followers: followCounts.followers - 1 })
      } else {
        await followApi.follow('user', userId)
        setIsFollowing(true)
        setFollowCounts({ ...followCounts, followers: followCounts.followers + 1 })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  if (loading || !profile) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '12px 8px' : '24px 16px' }}>
        <Skeleton active paragraph={{ rows: 6 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '12px 8px' : '24px 16px' }}>
      {/* 用户信息卡片 */}
      <Card>
        <div style={{
          display: 'flex',
          alignItems: isMobile ? 'center' : 'center',
          gap: isMobile ? 16 : 24,
          flexDirection: isMobile ? 'column' : 'row',
          textAlign: isMobile ? 'center' : 'left',
        }}>
          <Avatar
            src={profile.avatarUrl}
            size={isMobile ? 64 : 80}
            style={{ backgroundColor: '#1677ff', fontSize: isMobile ? 28 : 32, flexShrink: 0 }}
          >
            {profile.username[0]}
          </Avatar>
          <div style={{ flex: 1 }}>
            <Title level={isMobile ? 4 : 3} style={{ marginBottom: 8 }}>
              {profile.username}
              {profile.role === 'admin' && (
                <Tag color="red" style={{ marginLeft: 8 }}>
                  管理员
                </Tag>
              )}
            </Title>
            <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>学号: {profile.studentNo}</Text>
            <div style={{ marginTop: 8 }}>
              <Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>
                加入时间: {dayjs(profile.createdAt).format('YYYY-MM-DD')}
              </Text>
            </div>
            {profile.bio && (
              <div style={{ marginTop: 8 }}>
                <Text style={{ fontSize: isMobile ? 14 : 15 }}>{profile.bio}</Text>
              </div>
            )}
          </div>
          <div style={isMobile ? { marginTop: 0 } : undefined}>
            {!isSelf && (
              <Button type={isFollowing ? 'default' : 'primary'} onClick={handleFollow} size={isMobile ? 'small' : 'middle'}>
                {isFollowing ? '已关注' : '关注'}
              </Button>
            )}
            {isSelf && (
              <Button icon={<EditOutlined />} onClick={() => navigate('/settings')} size={isMobile ? 'small' : 'middle'}>
                编辑资料
              </Button>
            )}
          </div>
        </div>

        <Row style={{ marginTop: 24 }} gutter={isMobile ? 8 : 16}>
          <Col span={8}>
            <Statistic title="关注" value={followCounts.following} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Col>
          <Col span={8}>
            <Statistic title="粉丝" value={followCounts.followers} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Col>
          <Col span={8}>
            <Statistic title="文章" value={posts.length} valueStyle={{ fontSize: isMobile ? 20 : 24 }} />
          </Col>
        </Row>
      </Card>

      {/* 内容标签页 */}
      <Card style={{ marginTop: 16 }}>
        <Tabs
          items={[
            {
              key: 'posts',
              label: '发布的文章',
              children: (
                <List
                  loading={postLoading}
                  dataSource={posts}
                  locale={{ emptyText: <Empty description="暂无文章" /> }}
                  renderItem={(post) => (
                    <List.Item
                      key={post.id}
                      style={{ cursor: 'pointer', padding: isMobile ? '12px 0' : '16px 0' }}
                      onClick={() => navigate(`/post/${post.id}`)}
                    >
                      <List.Item.Meta
                        title={
                          <Space size={isMobile ? 4 : 8}>
                            <Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{post.title}</Text>
                            <Tag style={{ fontSize: isMobile ? 11 : 12 }}>{post.board.name}</Tag>
                          </Space>
                        }
                        description={
                          <Space size={isMobile ? 8 : 16} wrap>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                              <EyeOutlined /> {post.viewCount}
                            </Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                              <LikeOutlined /> {post.likeCount}
                            </Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                              <MessageOutlined /> {post.commentCount}
                            </Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                              {dayjs(post.createdAt).format('YYYY-MM-DD')}
                            </Text>
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
