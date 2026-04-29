import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  List,
  Typography,
  Tag,
  Space,
  Avatar,
  Button,
  Select,
  Pagination,
  Empty,
} from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  MessageOutlined,
} from '@ant-design/icons'
import { postApi, boardApi } from '../../services/api'
import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/zh-cn'

dayjs.extend(relativeTime)
dayjs.locale('zh-cn')

const { Title, Text } = Typography

interface Board {
  id: number
  name: string
  icon: string
}

interface Post {
  id: number
  title: string
  content: string
  author: {
    id: number
    username: string
    avatarUrl?: string
  }
  board: {
    id: number
    name: string
  }
  viewCount: number
  likeCount: number
  commentCount: number
  createdAt: string
  isTop?: boolean
  isEssence?: boolean
}

export function Home() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState<Post[]>([])
  const [boards, setBoards] = useState<Board[]>([])
  const [loading, setLoading] = useState(false)
  const [currentBoard, setCurrentBoard] = useState<number | undefined>()
  const [sort, setSort] = useState<'new' | 'hot'>('new')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)
  const scrollRef = useRef<HTMLDivElement>(null)
  const pageSize = 20

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 获取板块列表
  useEffect(() => {
    boardApi.getList().then((res) => {
      setBoards(res.data.items)
    })
  }, [])

  // 获取帖子列表
  useEffect(() => {
    fetchPosts()
  }, [currentBoard, sort, page])

  const fetchPosts = async () => {
    setLoading(true)
    try {
      const res = await postApi.getList({
        page,
        limit: pageSize,
        boardId: currentBoard,
        sort,
      })
      setPosts(res.data.items)
      setTotal(res.data.pagination.total)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Title level={2} style={{ marginBottom: 16 }}>最新帖子</Title>
      {/* 筛选栏 */}
      <Card style={{ marginBottom: 16 }} className="filter-card">
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: isMobile ? 'nowrap' : 'wrap',
          }}
        >
          <div
            ref={scrollRef}
            style={{
              display: 'flex',
              gap: 8,
              overflowX: 'auto',
              flex: 1,
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              paddingBottom: 4,
            }}
          >
            <Button
              size={isMobile ? 'small' : 'middle'}
              type={currentBoard === undefined ? 'primary' : 'default'}
              onClick={() => {
                setCurrentBoard(undefined)
                setPage(1)
              }}
              style={isMobile ? { flexShrink: 0 } : undefined}
            >
              全部
            </Button>
            {boards.map((board) => (
              <Button
                key={board.id}
                size={isMobile ? 'small' : 'middle'}
                type={currentBoard === board.id ? 'primary' : 'default'}
                onClick={() => {
                  setCurrentBoard(board.id)
                  setPage(1)
                }}
                style={isMobile ? { flexShrink: 0 } : undefined}
              >
                {board.icon} {board.name}
              </Button>
            ))}
          </div>

          <Select
            value={sort}
            onChange={(value) => {
              setSort(value)
              setPage(1)
            }}
            style={{ width: isMobile ? 80 : 100 }}
            size={isMobile ? 'small' : 'middle'}
            options={[
              { value: 'new', label: '最新' },
              { value: 'hot', label: '最热' },
            ]}
          />
        </div>
      </Card>

      {/* 帖子列表 */}
      <Card loading={loading && posts.length === 0}>
        <List
          dataSource={posts}
          locale={{
            emptyText: <Empty description="暂无帖子" />,
          }}
          renderItem={(post) => (
              <List.Item
                key={post.id}
                style={{
                  padding: isMobile ? '12px 0' : '16px 0',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                onClick={() => navigate(`/post/${post.id}`)}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar
                      src={post.author.avatarUrl}
                      size={isMobile ? 36 : 40}
                      style={{ backgroundColor: '#1677ff' }}
                    >
                      {post.author.username[0]}
                    </Avatar>
                  }
                  title={
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                      {post.isTop && (
                        <Tag color="red" style={{ marginRight: 0, fontSize: isMobile ? 11 : 12 }}>置顶</Tag>
                      )}
                      {post.isEssence && (
                        <Tag color="gold" style={{ marginRight: 0, fontSize: isMobile ? 11 : 12 }}>精华</Tag>
                      )}
                      <Text strong style={{ fontSize: isMobile ? 14 : 16, wordBreak: 'break-word' }}>
                        {post.title}
                      </Text>
                      <Tag style={{ fontSize: isMobile ? 11 : 12, marginLeft: 'auto' }}>{post.board.name}</Tag>
                    </div>
                  }
                  description={
                    <div>
                      <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                        {post.author.username} · {dayjs(post.createdAt).fromNow()}
                      </Text>
                      <div style={{ marginTop: 6 }}>
                        <Space size={isMobile ? 12 : 16}>
                          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                            <EyeOutlined /> {post.viewCount}
                          </Text>
                          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                            <LikeOutlined /> {post.likeCount}
                          </Text>
                          <Text type="secondary" style={{ fontSize: isMobile ? 12 : 14 }}>
                            <MessageOutlined /> {post.commentCount}
                          </Text>
                        </Space>
                      </div>
                    </div>
                  }
                />
              </List.Item>
          )}
        />

        {/* 分页 */}
        {total > pageSize && (
          <div style={{ textAlign: 'center', marginTop: 24 }}>
            <Pagination
              current={page}
              total={total}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
              showSizeChanger={false}
            />
          </div>
        )}
      </Card>
    </div>
  )
}
