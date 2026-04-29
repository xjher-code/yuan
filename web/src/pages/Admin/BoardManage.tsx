import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  message,
  Space,
  Popconfirm,
} from 'antd'
import { PlusOutlined, ReloadOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { boardApi } from '../../services/api'

interface BoardItem {
  id: number
  name: string
  description: string
  icon: string
  sortOrder: number
  createdAt: string
}

export function BoardManage() {
  const [boards, setBoards] = useState<BoardItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [editingBoard, setEditingBoard] = useState<BoardItem | null>(null)
  const [form] = Form.useForm()
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    fetchBoards()
  }, [])

  const fetchBoards = async () => {
    setLoading(true)
    try {
      const res = await boardApi.getList()
      setBoards(res.data.items)
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取板块列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    try {
      await boardApi.create(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      fetchBoards()
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleUpdate = async (values: any) => {
    if (!editingBoard) return
    try {
      await boardApi.update(editingBoard.id, values)
      message.success('更新成功')
      setModalVisible(false)
      setEditingBoard(null)
      form.resetFields()
      fetchBoards()
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await boardApi.delete(id)
      message.success('删除成功')
      fetchBoards()
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败')
    }
  }

  const openEditModal = (board: BoardItem) => {
    setEditingBoard(board)
    form.setFieldsValue(board)
    setModalVisible(true)
  }

  const openCreateModal = () => {
    setEditingBoard(null)
    form.resetFields()
    setModalVisible(true)
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '名称', dataIndex: 'name' },
    { title: '描述', dataIndex: 'description' },
    { title: '图标', dataIndex: 'icon' },
    { title: '排序', dataIndex: 'sortOrder', width: 80 },
    {
      title: '操作',
      render: (_: any, record: BoardItem) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEditModal(record)}>
            编辑
          </Button>
          <Popconfirm
            title="删除板块"
            description="确定要删除该板块吗？"
            onConfirm={() => handleDelete(record.id)}
          >
            <Button size="small" danger icon={<DeleteOutlined />}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{
        marginBottom: 16,
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'flex-start' : 'center',
        gap: 12,
        justifyContent: 'space-between',
      }}>
        <h2 style={{ margin: 0 }}>板块管理</h2>
        <Space wrap>
          <Button icon={<ReloadOutlined />} onClick={fetchBoards} size={isMobile ? 'small' : 'middle'}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreateModal} size={isMobile ? 'small' : 'middle'}>
            添加板块
          </Button>
        </Space>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={boards}
          loading={loading}
          scroll={isMobile ? { x: 'max-content' } : undefined}
          size={isMobile ? 'small' : 'middle'}
        />
      </div>

      <Modal
        title={editingBoard ? '编辑板块' : '添加板块'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false)
          setEditingBoard(null)
          form.resetFields()
        }}
        onOk={() => form.submit()}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={editingBoard ? handleUpdate : handleCreate}
        >
          <Form.Item
            name="name"
            label="名称"
            rules={[{ required: true, message: '请输入板块名称' }]}
          >
            <Input placeholder="板块名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} placeholder="板块描述" />
          </Form.Item>
          <Form.Item name="icon" label="图标">
            <Input placeholder="图标 emoji，如 💻" />
          </Form.Item>
          <Form.Item name="sortOrder" label="排序">
            <Input type="number" placeholder="排序数字，越小越靠前" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
