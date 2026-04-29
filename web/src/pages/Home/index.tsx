import { useEffect, useState } from 'react'
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
  const pageSize = 20

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
      <Card style={{ marginBottom: 16 }}>
        <Space wrap style={{ width: '100%', justifyContent: 'space-between' }}>
          <Space>
            <Button
              type={currentBoard === undefined ? 'primary' : 'default'}
              onClick={() => {
                setCurrentBoard(undefined)
                setPage(1)
              }}
            >
              全部
            </Button>
            {boards.map((board) => (
              <Button
                key={board.id}
                type={currentBoard === board.id ? 'primary' : 'default'}
                onClick={() => {
                  setCurrentBoard(board.id)
                  setPage(1)
                }}
              >
                {board.icon} {board.name}
              </Button>
            ))}
          </Space>

          <Select
            value={sort}
            onChange={(value) => {
              setSort(value)
              setPage(1)
            }}
            style={{ width: 100 }}
            options={[
              { value: 'new', label: '最新' },
              { value: 'hot', label: '最热' },
            ]}
          />
        </Space>
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
                padding: '16px 0',
                borderBottom: '1px solid #f0f0f0',
                cursor: 'pointer',
              }}
              onClick={() => navigate(`/post/${post.id}`)}
            >
              <List.Item.Meta
                avatar={
                  <Avatar
                    src={post.author.avatarUrl}
                    style={{ backgroundColor: '#1677ff' }}
                  >
                    {post.author.username[0]}
                  </Avatar>
                }
                title={
                  <Space>
                    {post.isTop && (
                      <Tag color="red">置顶</Tag>
                    )}
                    {post.isEssence && (
                      <Tag color="gold">精华</Tag>
                    )}
                    <Text strong style={{ fontSize: 16 }}>
                      {post.title}
                    </Text>
                    <Tag>{post.board.name}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <Text type="secondary">
                      {post.author.username} · {dayjs(post.createdAt).fromNow()}
                    </Text>
                    <div style={{ marginTop: 8 }}>
                      <Space size={16}>
                        <Text type="secondary">
                          <EyeOutlined /> {post.viewCount}
                        </Text>
                        <Text type="secondary">
                          <LikeOutlined /> {post.likeCount}
                        </Text>
                        <Text type="secondary">
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
