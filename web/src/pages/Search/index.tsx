import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Card,
  Input,
  List,
  Typography,
  Space,
  Tag,
  Avatar,
  Empty,
  Tabs,
  message,
} from 'antd'
import { SearchOutlined, EyeOutlined, LikeOutlined, MessageOutlined, FireOutlined } from '@ant-design/icons'
import { searchApi } from '../../services/api'
import dayjs from 'dayjs'

const { Title, Text } = Typography

interface PostItem {
  id: number
  title: string
  author: { id: number; username: string; avatarUrl?: string }
  board: { name: string }
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
}

export function Search() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''

  const [query, setQuery] = useState(initialQuery)
  const [searchQuery, setSearchQuery] = useState(initialQuery)
  const [posts, setPosts] = useState<PostItem[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [trending, setTrending] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('posts')
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchTrending()
  }, [])

  useEffect(() => {
    if (searchQuery) {
      if (activeTab === 'posts') {
        fetchPosts(searchQuery)
      } else {
        fetchUsers(searchQuery)
      }
    }
  }, [searchQuery, activeTab])

  const fetchPosts = async (q: string) => {
    setLoading(true)
    try {
      const res = await searchApi.searchPosts({ q })
      setPosts(res.data.items)
    } catch (error: any) {
      message.error(error.response?.data?.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchUsers = async (q: string) => {
    setLoading(true)
    try {
      const res = await searchApi.searchUsers({ q })
      setUsers(res.data.items)
    } catch (error: any) {
      message.error(error.response?.data?.message || '搜索失败')
    } finally {
      setLoading(false)
    }
  }

  const fetchTrending = async () => {
    try {
      const res = await searchApi.getTrending()
      setTrending(res.data.items)
    } catch {
      // 忽略错误
    }
  }

  const handleSearch = () => {
    if (!query.trim()) return
    setSearchParams({ q: query })
    setSearchQuery(query)
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: isMobile ? '12px 8px' : '24px 16px' }}>
      <Card>
        <Input.Search
          placeholder="搜索文章、用户..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onSearch={handleSearch}
          enterButton={isMobile ? undefined : <><SearchOutlined /> 搜索</>}
          size={isMobile ? 'middle' : 'large'}
        />

        {!searchQuery && (
          <div style={{ marginTop: 24 }}>
            <Title level={5}>
              <FireOutlined /> 热门内容
            </Title>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {trending.map((item) => (
                <Tag
                  key={item.id}
                  style={{ cursor: 'pointer', padding: '4px 12px', fontSize: isMobile ? 13 : 14 }}
                  onClick={() => {
                    setQuery(item.title)
                    setSearchQuery(item.title)
                    setSearchParams({ q: item.title })
                  }}
                >
                  {item.title}
                </Tag>
              ))}
            </div>
          </div>
        )}
      </Card>

      {searchQuery && (
        <Card style={{ marginTop: 16 }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={[
              { key: 'posts', label: '文章' },
              { key: 'users', label: '用户' },
            ]}
          />

          {activeTab === 'posts' && (
            <List
              loading={loading}
              dataSource={posts}
              locale={{ emptyText: <Empty description="未找到相关文章" /> }}
              renderItem={(post) => (
                <List.Item
                  key={post.id}
                  style={{ cursor: 'pointer', padding: isMobile ? '12px 0' : '16px 0' }}
                  onClick={() => navigate(`/post/${post.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={post.author.avatarUrl} size={isMobile ? 36 : 40} style={{ backgroundColor: '#1677ff' }}>
                        {post.author.username[0]}
                      </Avatar>
                    }
                    title={<Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{post.title}</Text>}
                    description={
                      <div>
                        <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                          {post.author.username} · {post.board.name} · {dayjs(post.createdAt).format('MM-DD')}
                        </Text>
                        <div style={{ marginTop: 4 }}>
                          <Space size={isMobile ? 12 : 16}>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}><EyeOutlined /> {post.viewCount}</Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}><LikeOutlined /> {post.likeCount}</Text>
                            <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}><MessageOutlined /> {post.commentCount}</Text>
                          </Space>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              )}
            />
          )}

          {activeTab === 'users' && (
            <List
              loading={loading}
              dataSource={users}
              locale={{ emptyText: <Empty description="未找到相关用户" /> }}
              renderItem={(user) => (
                <List.Item
                  key={user.id}
                  style={{ cursor: 'pointer', padding: isMobile ? '12px 0' : '16px 0' }}
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar src={user.avatarUrl} size={isMobile ? 36 : 40} style={{ backgroundColor: '#1677ff' }}>
                        {user.username[0]}
                      </Avatar>
                    }
                    title={<Text strong style={{ fontSize: isMobile ? 14 : 16 }}>{user.username}</Text>}
                    description={<Text type="secondary" style={{ fontSize: isMobile ? 13 : 14 }}>学号: {user.studentNo}</Text>}
                  />
                </List.Item>
              )}
            />
          )}
        </Card>
      )}
    </div>
  )
}
