import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Card,
  Input,
  Select,
  Button,
  message,
  Space,
  Upload,
  Modal,
} from 'antd'
import { UploadOutlined, ExclamationCircleOutlined } from '@ant-design/icons'
import MDEditor from '@uiw/react-md-editor'
import { postApi, boardApi } from '../../services/api'
import type { UploadFile } from 'antd'

const { confirm } = Modal

interface Board {
  id: number
  name: string
}

export function PostEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isEdit = Boolean(id)

  const [boards, setBoards] = useState<Board[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [boardId, setBoardId] = useState<number>()
  const [coverImage, setCoverImage] = useState<string>()
  const [loading, setLoading] = useState(false)
  const [fileList, setFileList] = useState<UploadFile[]>([])

  useEffect(() => {
    // 获取板块列表
    boardApi.getList().then((res) => {
      setBoards(res.data.items)
      if (res.data.items.length > 0 && !boardId) {
        setBoardId(res.data.items[0].id)
      }
    })

    // 如果是编辑模式，获取帖子详情
    if (id) {
      fetchPost(Number(id))
    }
  }, [id])

  const fetchPost = async (postId: number) => {
    try {
      const res = await postApi.getById(postId)
      const post = res.data.item
      setTitle(post.title)
      setContent(post.content)
      setBoardId(post.board.id)
      if (post.coverImage) {
        setCoverImage(post.coverImage)
        setFileList([{
          uid: '-1',
          name: 'cover',
          status: 'done',
          url: post.coverImage,
        }])
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取帖子失败')
      navigate('/')
    }
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      message.error('请输入标题')
      return
    }
    if (!content.trim()) {
      message.error('请输入内容')
      return
    }
    if (!boardId) {
      message.error('请选择板块')
      return
    }

    setLoading(true)
    try {
      const data = {
        title: title.trim(),
        content,
        boardId,
        coverImage,
      }

      if (isEdit) {
        await postApi.update(Number(id), data)
        message.success('更新成功')
      } else {
        await postApi.create(data)
        message.success('发布成功')
      }
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.message || (isEdit ? '更新失败' : '发布失败'))
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (title || content) {
      confirm({
        title: '确认离开',
        icon: <ExclamationCircleOutlined />,
        content: '当前内容未保存，确定要离开吗？',
        onOk: () => navigate('/'),
      })
    } else {
      navigate('/')
    }
  }

  const handleUpload = async (file: File) => {
    try {
      const res = await postApi.uploadImage(file)
      const imageUrl = res.data.url
      setCoverImage(imageUrl)
      setFileList([{
        uid: '-1',
        name: file.name,
        status: 'done',
        url: imageUrl,
      }])
      message.success('上传成功')
    } catch (error: any) {
      message.error(error.response?.data?.message || '上传失败')
    }
    return false
  }

  // 图片粘贴处理
  const handlePaste = async (event: React.ClipboardEvent) => {
    const items = event.clipboardData.items
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) {
          try {
            const res = await postApi.uploadImage(file)
            const imageUrl = res.data.url
            setContent((prev) => `${prev}\n![image](${imageUrl})\n`)
            message.success('图片已插入')
          } catch (error: any) {
            message.error('图片上传失败')
          }
        }
      }
    }
  }

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 16px' }}>
      <Card
        title={isEdit ? '编辑帖子' : '发布新帖'}
        extra={
          <Space>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" onClick={handleSubmit} loading={loading}>
              {isEdit ? '保存' : '发布'}
            </Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 标题 */}
          <Input
            placeholder="请输入标题"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            size="large"
            maxLength={200}
            showCount
          />

          {/* 板块选择 */}
          <Select
            placeholder="选择板块"
            value={boardId}
            onChange={setBoardId}
            style={{ width: 200 }}
            options={boards.map((board) => ({
              value: board.id,
              label: board.name,
            }))}
          />

          {/* 封面图上传 */}
          <div>
            <Upload
              fileList={fileList}
              beforeUpload={handleUpload}
              onRemove={() => {
                setCoverImage(undefined)
                setFileList([])
              }}
              maxCount={1}
              listType="picture"
            >
              <Button icon={<UploadOutlined />}>上传封面图</Button>
            </Upload>
          </div>

          {/* 内容编辑器 */}
          <div onPaste={handlePaste}>
            <MDEditor
              value={content}
              onChange={(value) => setContent(value || '')}
              height={500}
              preview="edit"
              textareaProps={{
                placeholder: '请输入内容，支持 Markdown 格式...\n可以直接粘贴图片',
              }}
            />
          </div>

          {/* 提示 */}
          <div style={{ color: '#999', fontSize: 12 }}>
            提示：支持 Markdown 语法，可直接粘贴图片
          </div>
        </Space>
      </Card>
    </div>
  )
}
