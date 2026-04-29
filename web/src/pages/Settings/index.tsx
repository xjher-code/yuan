import { useState, useEffect } from 'react'
import {
  Card,
  Form,
  Input,
  Button,
  Avatar,
  Upload,
  message,
  Tabs,
  Divider,
} from 'antd'
import { UserOutlined, LockOutlined, UploadOutlined } from '@ant-design/icons'
import { userApi, authApi, postApi } from '../../services/api'
import { useAuthStore } from '../../stores/auth'

export function Settings() {
  const { user, updateUser } = useAuthStore()
  const [profileForm] = Form.useForm()
  const [passwordForm] = Form.useForm()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      profileForm.setFieldsValue({
        username: user.username,
      })
    }
  }, [user])

  const handleUpdateProfile = async (values: any) => {
    setLoading(true)
    try {
      await userApi.updateMe(values)
      updateUser(values)
      message.success('更新成功')
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: any) => {
    setLoading(true)
    try {
      await authApi.changePassword(values.oldPassword, values.newPassword)
      message.success('密码修改成功')
      passwordForm.resetFields()
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (info: any) => {
    if (info.file.status === 'done') {
      message.success('上传成功')
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px' }}>
      <Card title="个人设置">
        <Tabs
          items={[
            {
              key: 'profile',
              label: '基本资料',
              children: (
                <>
                  <div style={{ textAlign: 'center', marginBottom: 24 }}>
                    <Avatar
                      src={user?.avatarUrl}
                      size={80}
                      style={{ backgroundColor: '#1677ff', fontSize: 32 }}
                    >
                      {user?.username?.[0]}
                    </Avatar>
                    <div style={{ marginTop: 12 }}>
                      <Upload
                        customRequest={async ({ file, onSuccess }) => {
                          try {
                            const res = await postApi.uploadImage(file as File)
                            await userApi.updateMe({ avatarUrl: res.data.url })
                            updateUser({ avatarUrl: res.data.url })
                            onSuccess?.(res.data)
                          } catch (error: any) {
                            message.error('上传失败')
                          }
                        }}
                        showUploadList={false}
                        onChange={handleUpload}
                      >
                        <Button icon={<UploadOutlined />}>更换头像</Button>
                      </Upload>
                    </div>
                  </div>
                  <Divider />
                  <Form
                    form={profileForm}
                    layout="vertical"
                    onFinish={handleUpdateProfile}
                  >
                    <Form.Item
                      name="username"
                      label="昵称"
                      rules={[{ required: true, message: '请输入昵称' }]}
                    >
                      <Input prefix={<UserOutlined />} placeholder="昵称" />
                    </Form.Item>
                    <Form.Item
                      name="bio"
                      label="个人简介"
                    >
                      <Input.TextArea rows={3} placeholder="介绍一下自己..." />
                    </Form.Item>
                    <Form.Item>
                      <Button type="primary" htmlType="submit" loading={loading}>
                        保存修改
                      </Button>
                    </Form.Item>
                  </Form>
                </>
              ),
            },
            {
              key: 'password',
              label: '修改密码',
              children: (
                <Form
                  form={passwordForm}
                  layout="vertical"
                  onFinish={handleChangePassword}
                >
                  <Form.Item
                    name="oldPassword"
                    label="原密码"
                    rules={[{ required: true, message: '请输入原密码' }]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="原密码" />
                  </Form.Item>
                  <Form.Item
                    name="newPassword"
                    label="新密码"
                    rules={[
                      { required: true, message: '请输入新密码' },
                      { min: 8, message: '密码至少8位' },
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="新密码（至少8位）" />
                  </Form.Item>
                  <Form.Item
                    name="confirmPassword"
                    label="确认新密码"
                    dependencies={['newPassword']}
                    rules={[
                      { required: true, message: '请确认新密码' },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue('newPassword') === value) {
                            return Promise.resolve()
                          }
                          return Promise.reject(new Error('两次输入的密码不一致'))
                        },
                      }),
                    ]}
                  >
                    <Input.Password prefix={<LockOutlined />} placeholder="确认新密码" />
                  </Form.Item>
                  <Form.Item>
                    <Button type="primary" htmlType="submit" loading={loading}>
                      修改密码
                    </Button>
                  </Form.Item>
                </Form>
              ),
            },
          ]}
        />
      </Card>
    </div>
  )
}
