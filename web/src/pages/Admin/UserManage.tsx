import { useEffect, useState } from 'react'
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Select,
  message,
  Space,
  Tag,
  Popconfirm,
} from 'antd'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import { adminApi } from '../../services/api'

interface UserItem {
  id: number
  studentNo: string
  username: string
  role: string
  status: string
  createdAt: string
}

export function UserManage() {
  const [users, setUsers] = useState<UserItem[]>([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [form] = Form.useForm()
  const [pagination, setPagination] = useState({ current: 1, pageSize: 20, total: 0 })

  useEffect(() => {
    fetchUsers()
  }, [pagination.current])

  const fetchUsers = async () => {
    setLoading(true)
    try {
      const res = await adminApi.getUsers({
        page: pagination.current,
        limit: pagination.pageSize,
      })
      setUsers(res.data.items)
      setPagination({ ...pagination, total: res.data.pagination.total })
    } catch (error: any) {
      message.error(error.response?.data?.message || '获取用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async (values: any) => {
    try {
      await adminApi.createUser(values)
      message.success('创建成功')
      setModalVisible(false)
      form.resetFields()
      fetchUsers()
    } catch (error: any) {
      message.error(error.response?.data?.message || '创建失败')
    }
  }

  const handleUpdateStatus = async (id: number, status: string) => {
    try {
      await adminApi.updateUserStatus(id, status)
      message.success('更新成功')
      fetchUsers()
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    }
  }

  const handleUpdateRole = async (id: number, role: string) => {
    try {
      await adminApi.updateUserRole(id, role)
      message.success('更新成功')
      fetchUsers()
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    }
  }

  const handleResetPassword = async (id: number) => {
    try {
      const res = await adminApi.resetPassword(id)
      message.success(`密码已重置为: ${res.data}`)
    } catch (error: any) {
      message.error(error.response?.data?.message || '重置失败')
    }
  }

  const columns = [
    { title: 'ID', dataIndex: 'id', width: 80 },
    { title: '学号', dataIndex: 'studentNo' },
    { title: '昵称', dataIndex: 'username' },
    {
      title: '角色',
      dataIndex: 'role',
      render: (role: string) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '用户'}
        </Tag>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'default'}>
          {status === 'active' ? '正常' : '禁用'}
        </Tag>
      ),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
    },
    {
      title: '操作',
      render: (_: any, record: UserItem) => (
        <Space>
          <Select
            value={record.status}
            size="small"
            style={{ width: 80 }}
            options={[
              { value: 'active', label: '正常' },
              { value: 'inactive', label: '禁用' },
            ]}
            onChange={(value) => handleUpdateStatus(record.id, value)}
          />
          <Select
            value={record.role}
            size="small"
            style={{ width: 90 }}
            options={[
              { value: 'user', label: '用户' },
              { value: 'admin', label: '管理员' },
            ]}
            onChange={(value) => handleUpdateRole(record.id, value)}
          />
          <Popconfirm
            title="重置密码"
            description="确定要重置该用户的密码吗？"
            onConfirm={() => handleResetPassword(record.id)}
          >
            <Button size="small">重置密码</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
        <h2>用户管理</h2>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchUsers}>
            刷新
          </Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalVisible(true)}>
            添加用户
          </Button>
        </Space>
      </div>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={users}
        loading={loading}
        pagination={{
          ...pagination,
          onChange: (page) => setPagination({ ...pagination, current: page }),
        }}
      />

      <Modal
        title="添加用户"
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        onOk={() => form.submit()}
      >
        <Form form={form} layout="vertical" onFinish={handleCreate}>
          <Form.Item
            name="studentNo"
            label="学号"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input placeholder="学号" />
          </Form.Item>
          <Form.Item
            name="username"
            label="昵称"
            rules={[{ required: true, message: '请输入昵称' }]}
          >
            <Input placeholder="昵称" />
          </Form.Item>
          <Form.Item name="role" label="角色" initialValue="user">
            <Select
              options={[
                { value: 'user', label: '用户' },
                { value: 'admin', label: '管理员' },
              ]}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
