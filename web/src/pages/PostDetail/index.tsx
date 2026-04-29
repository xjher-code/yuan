import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Typography,
  Space,
  Avatar,
  Button,
  Tag,
  Skeleton,
  message,
  Dropdown,
  Modal,
  Input,
  List,
  Divider,
} from 'antd'
import {
  EyeOutlined,
  LikeOutlined,
  LikeFilled,
  MessageOutlined,
  StarOutlined,
  StarFilled,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  ExclamationCircleOutlined,
  SendOutlined,
} from '@ant-design/icons'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import { postApi, commentApi, likeApi, collectionApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth'
import dayjs from 'dayjs'

const { Title, Text } = Typography
const { TextArea } = Input
const { confirm } = Modal

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
  collectCount: number
  coverImage?: string
  createdAt: string
  updatedAt: string
  isTop?: boolean
  isEssence?: boolean
}

interface CommentItem {
  id: number
  content: string
  author: {
    id: number
    username: string
    avatarUrl?: string
  }
  likeCount: number
  createdAt: string
  replies?: CommentItem[]
}

export function PostDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(false)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentContent, setCommentContent] = useState('')
  const [replyTo, setReplyTo] = useState<number | null>(null)
  const [replyContent, setReplyContent] = useState('')
  const [liked, setLiked] = useState(false)
  const [collected, setCollected] = useState(false)

  useEffect(() => {
    if (id) {
      fetchPost(Number(id))
      fetchComments(Number(id))
      checkLikeStatus(Number(id))
      checkCollectStatus(Number(id))
    }
  }, [id])

  const fetchPost = async (postId: number) => {
    setLoading(true)
    try {
      const res = await postApi.getById(postId)
      setPost(res.data.item)
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取帖子失败')
      navigate('/')
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async (postId: number) => {
    setCommentLoading(true)
    try {
      const res = await commentApi.getList(postId)
      setComments(res.data.items)
    } catch {
      // 忽略错误
    } finally {
      setCommentLoading(false)
    }
  }

  const checkLikeStatus = async (postId: number) => {
    try {
      const res = await likeApi.hasLiked('post', postId)
      setLiked(res.data.liked)
    } catch {
      // 忽略错误
    }
  }

  const checkCollectStatus = async (postId: number) => {
    try {
      const res = await collectionApi.hasCollected(postId)
      setCollected(res.data.collected)
    } catch {
      // 忽略错误
    }
  }

  const handleLike = async () => {
    if (!post) return
    try {
      if (liked) {
        await likeApi.unlike('post', post.id)
        setLiked(false)
        setPost({ ...post, likeCount: post.likeCount - 1 })
      } else {
        await likeApi.like('post', post.id)
        setLiked(true)
        setPost({ ...post, likeCount: post.likeCount + 1 })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleCollect = async () => {
    if (!post) return
    try {
      if (collected) {
        // 简化处理：取消收藏需要知道 collectionId 和 itemId，这里仅演示
        message.info('请到收藏夹管理中取消收藏')
      } else {
        // 这里简化处理，实际应该弹出选择收藏夹
        message.info('请先创建收藏夹，再到收藏夹中添加')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败')
    }
  }

  const handleDelete = () => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await postApi.delete(Number(id))
          message.success('删除成功')
          navigate('/')
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  const handleComment = async () => {
    if (!commentContent.trim()) {
      message.warning('请输入评论内容')
      return
    }
    try {
      await commentApi.create({
        postId: Number(id),
        content: commentContent,
      })
      message.success('评论成功')
      setCommentContent('')
      fetchComments(Number(id))
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '评论失败')
    }
  }

  const handleReply = async (parentId: number) => {
    if (!replyContent.trim()) {
      message.warning('请输入回复内容')
      return
    }
    try {
      await commentApi.create({
        postId: Number(id),
        content: replyContent,
        parentId,
      })
      message.success('回复成功')
      setReplyContent('')
      setReplyTo(null)
      fetchComments(Number(id))
      if (post) {
        setPost({ ...post, commentCount: post.commentCount + 1 })
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '回复失败')
    }
  }

  const handleDeleteComment = async (commentId: number) => {
    confirm({
      title: '确认删除',
      icon: <ExclamationCircleOutlined />,
      content: '删除后无法恢复，是否继续？',
      onOk: async () => {
        try {
          await commentApi.delete(commentId)
          message.success('删除成功')
          fetchComments(Number(id!))
          if (post) {
            setPost({ ...post, commentCount: post.commentCount - 1 })
          }
        } catch (error: any) {
          message.error(error.response?.data?.message || '删除失败')
        }
      },
    })
  }

  const isAuthor = user?.id === post?.author.id
  const isAdmin = user?.role === 'admin'
  const canEdit = isAuthor || isAdmin

  if (loading || !post) {
    return (
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
        <Skeleton active paragraph={{ rows: 10 }} />
      </div>
    )
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
      <Card>
        {/* 标题区域 */}
        <div style={{ marginBottom: 24 }}>
          <Space wrap style={{ marginBottom: 16 }}>
            {post.isTop && <Tag color="red">置顶</Tag>}
            {post.isEssence && <Tag color="gold">精华</Tag>}
            <Tag>{post.board.name}</Tag>
          </Space>

          <Title level={2} style={{ marginBottom: 16 }}>
            {post.title}
          </Title>

          <Space split={<Text type="secondary">·</Text>}>
            <Space>
              <Avatar
                src={post.author.avatarUrl}
                size="small"
                style={{ backgroundColor: '#1677ff' }}
              >
                {post.author.username[0]}
              </Avatar>
              <Text>{post.author.username}</Text>
            </Space>
            <Text type="secondary">
              {dayjs(post.createdAt).format('YYYY-MM-DD HH:mm')}
            </Text>
            <Text type="secondary">
              <EyeOutlined /> {post.viewCount}
            </Text>
            {canEdit && (
              <Dropdown
                menu={{
                  items: [
                    {
                      key: 'edit',
                      icon: <EditOutlined />,
                      label: '编辑',
                      onClick: () => navigate(`/post/${post.id}/edit`),
                    },
                    {
                      key: 'delete',
                      icon: <DeleteOutlined />,
                      label: '删除',
                      danger: true,
                      onClick: handleDelete,
                    },
                  ],
                }}
              >
                <Button type="text" icon={<MoreOutlined />} />
              </Dropdown>
            )}
          </Space>
        </div>

        {/* 封面图 */}
        {post.coverImage && (
          <div style={{ marginBottom: 24 }}>
            <img
              src={post.coverImage}
              alt="cover"
              style={{ width: '100%', maxHeight: 400, objectFit: 'cover', borderRadius: 8 }}
            />
          </div>
        )}

        {/* 内容区域 */}
        <div className="markdown-body" style={{ fontSize: 16, lineHeight: 1.8 }}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            rehypePlugins={[rehypeRaw]}
            components={{
              code({ node, inline, className, children, ...props }: any) {
                const match = /language-(\w+)/.exec(className || '')
                return !inline && match ? (
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    {...props}
                  >
                    {String(children).replace(/\n$/, '')}
                  </SyntaxHighlighter>
                ) : (
                  <code className={className} {...props}>
                    {children}
                  </code>
                )
              },
              img({ src, alt }) {
                return (
                  <img
                    src={src}
                    alt={alt}
                    style={{ maxWidth: '100%', borderRadius: 4 }}
                  />
                )
              },
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* 底部互动区 */}
        <div
          style={{
            marginTop: 32,
            paddingTop: 24,
            borderTop: '1px solid #f0f0f0',
          }}
        >
          <Space size={24}>
            <Button
              icon={liked ? <LikeFilled /> : <LikeOutlined />}
              type={liked ? 'primary' : 'default'}
              onClick={handleLike}
            >
              点赞 {post.likeCount > 0 && `(${post.likeCount})`}
            </Button>
            <Button
              icon={collected ? <StarFilled /> : <StarOutlined />}
              type={collected ? 'primary' : 'default'}
              onClick={handleCollect}
            >
              收藏 {post.collectCount > 0 && `(${post.collectCount})`}
            </Button>
            <Button icon={<MessageOutlined />}>
              评论 {post.commentCount > 0 && `(${post.commentCount})`}
            </Button>
          </Space>
        </div>
      </Card>

      {/* 评论区 */}
      <Card style={{ marginTop: 16 }}>
        <Title level={4}>评论 ({post.commentCount})</Title>

        {/* 发表评论 */}
        <div style={{ marginBottom: 24 }}>
          <TextArea
            rows={3}
            placeholder="发表你的评论..."
            value={commentContent}
            onChange={(e) => setCommentContent(e.target.value)}
            style={{ marginBottom: 12 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleComment}
          >
            发表评论
          </Button>
        </div>

        <Divider />

        {/* 评论列表 */}
        <List
          loading={commentLoading}
          dataSource={comments}
          locale={{ emptyText: '暂无评论，快来抢沙发吧！' }}
          renderItem={(comment) => (
            <List.Item
              key={comment.id}
              actions={[
                <Button
                  type="link"
                  size="small"
                  onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                >
                  回复
                </Button>,
                (user?.id === comment.author.id || isAdmin) && (
                  <Button
                    type="link"
                    size="small"
                    danger
                    onClick={() => handleDeleteComment(comment.id)}
                  >
                    删除
                  </Button>
                ),
              ]}
            >
              <List.Item.Meta
                avatar={
                  <Avatar src={comment.author.avatarUrl} style={{ backgroundColor: '#1677ff' }}>
                    {comment.author.username[0]}
                  </Avatar>
                }
                title={
                  <Space>
                    <Text strong>{comment.author.username}</Text>
                    <Text type="secondary" style={{ fontSize: 12 }}>
                      {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
                    </Text>
                  </Space>
                }
                description={
                  <div>
                    <div style={{ marginTop: 8, marginBottom: 8 }}>{comment.content}</div>
                    <Text type="secondary">
                      <LikeOutlined /> {comment.likeCount}
                    </Text>

                    {/* 回复输入框 */}
                    {replyTo === comment.id && (
                      <div style={{ marginTop: 12 }}>
                        <TextArea
                          rows={2}
                          placeholder={`回复 ${comment.author.username}...`}
                          value={replyContent}
                          onChange={(e) => setReplyContent(e.target.value)}
                          style={{ marginBottom: 8 }}
                        />
                        <Space>
                          <Button type="primary" size="small" onClick={() => handleReply(comment.id)}>
                            回复
                          </Button>
                          <Button size="small" onClick={() => setReplyTo(null)}>
                            取消
                          </Button>
                        </Space>
                      </div>
                    )}

                    {/* 子评论 */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div style={{ marginTop: 12, paddingLeft: 24, borderLeft: '2px solid #f0f0f0' }}>
                        {comment.replies.map((reply) => (
                          <div key={reply.id} style={{ marginBottom: 12 }}>
                            <Space>
                              <Avatar src={reply.author.avatarUrl} size="small" style={{ backgroundColor: '#1677ff' }}>
                                {reply.author.username[0]}
                              </Avatar>
                              <Text strong style={{ fontSize: 14 }}>{reply.author.username}</Text>
                              <Text type="secondary" style={{ fontSize: 12 }}>
                                {dayjs(reply.createdAt).format('YYYY-MM-DD HH:mm')}
                              </Text>
                            </Space>
                            <div style={{ marginTop: 4, marginLeft: 32 }}>{reply.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </div>
  )
}
