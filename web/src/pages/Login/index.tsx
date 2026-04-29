import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Card,
  Form,
  Input,
  Button,
  Typography,
  message,
  Modal,
} from 'antd'
import { UserOutlined, LockOutlined } from '@ant-design/icons'
import { authApi, api } from '../../services/api'
import { useAuthStore } from '../../stores/auth'

const { Title } = Typography

export function Login() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [changePasswordVisible, setChangePasswordVisible] = useState(false)
  const [forgotPasswordVisible, setForgotPasswordVisible] = useState(false)
  const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false)
  const [forgotPasswordStudentNo, setForgotPasswordStudentNo] = useState('')
  const [registerVisible, setRegisterVisible] = useState(false)
  const [registerLoading, setRegisterLoading] = useState(false)
  const [registerStudentNo, setRegisterStudentNo] = useState('')
  const [loginForm] = Form.useForm()
  const [loginData, setLoginData] = useState<{
    user: any
    accessToken: string
    refreshToken: string
    oldPassword: string
  } | null>(null)
  const [changePasswordForm] = Form.useForm()

  const handleLogin = async (values: { studentNo: string; password: string }) => {
    setLoading(true)
    try {
      const response = await authApi.login(values.studentNo, values.password)
      const { user, accessToken, refreshToken } = response.data

      if (user.isFirstLogin) {
        // 首次登录，需要修改密码
        setLoginData({ user, accessToken, refreshToken, oldPassword: values.password })
        setChangePasswordVisible(true)
        message.info('首次登录，请修改初始密码')
      } else {
        // 正常登录
        setAuth({ user, accessToken, refreshToken })
        message.success('登录成功')
        navigate('/')
      }
    } catch (error: any) {
      message.error(error.response?.data?.message || '登录失败')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async (values: {
    newPassword: string
    confirmPassword: string
  }) => {
    if (!loginData) return

    if (values.newPassword !== values.confirmPassword) {
      message.error('两次输入的密码不一致')
      return
    }

    setLoading(true)
    try {
      // 使用临时 token 修改密码
      await api.post('/auth/change-password', {
        oldPassword: loginData.oldPassword,
        newPassword: values.newPassword,
      }, {
        headers: { Authorization: `Bearer ${loginData.accessToken}` },
      })

      // 重新登录
      const response = await authApi.login(loginData.user.studentNo, values.newPassword)
      const { user, accessToken, refreshToken } = response.data

      setAuth({ user, accessToken, refreshToken })
      message.success('密码修改成功，已自动登录')
      setChangePasswordVisible(false)
      navigate('/')
    } catch (error: any) {
      message.error(error.response?.data?.message || '密码修改失败')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!registerStudentNo.trim()) {
      message.warning('请输入学号')
      return
    }

    setRegisterLoading(true)
    try {
      await authApi.register(registerStudentNo.trim())
      message.success('注册成功，初始密码为学号+yuan')
      setRegisterVisible(false)
      setRegisterStudentNo('')
      loginForm.setFieldsValue({ studentNo: registerStudentNo.trim(), password: '' })
    } catch (error: any) {
      message.error(error.response?.data?.message || '注册失败')
    } finally {
      setRegisterLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    if (!forgotPasswordStudentNo.trim()) {
      message.warning('请输入学号')
      return
    }

    setForgotPasswordLoading(true)
    try {
      await authApi.forgotPassword(forgotPasswordStudentNo.trim())
      message.success('密码已重置为学号+yuan，请使用新密码登录')
      setForgotPasswordVisible(false)
      setForgotPasswordStudentNo('')
      loginForm.setFieldValue('password', '')
    } catch (error: any) {
      message.error(error.response?.data?.message || '重置失败')
    } finally {
      setForgotPasswordLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={1} style={{ margin: 0, fontSize: 28 }}>
            缘圈子
          </Title>
          <Typography.Text type="secondary">内部学习论坛</Typography.Text>
        </div>

        <Form
          name="login"
          size="large"
          onFinish={handleLogin}
          autoComplete="off"
        >
          <Form.Item
            name="studentNo"
            rules={[{ required: true, message: '请输入学号' }]}
          >
            <Input
              prefix={<UserOutlined />}
              placeholder="学号"
              autoFocus
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              prefix={<LockOutlined />}
              placeholder="密码"
            />
          </Form.Item>

          <div style={{ textAlign: 'right', marginBottom: 24, marginTop: -16 }}>
            <Button
              type="link"
              style={{ padding: 0 }}
              onClick={() => {
                setForgotPasswordStudentNo('')
                setForgotPasswordVisible(true)
              }}
            >
              忘记密码？
            </Button>
          </div>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              block
            >
              登录
            </Button>
          </Form.Item>
        </Form>

        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            初始密码：学号 + yuan
          </Typography.Text>
        </div>
        <div style={{ textAlign: 'center', marginTop: 12 }}>
          <Button
            type="link"
            style={{ padding: 0 }}
            onClick={() => {
              setRegisterStudentNo('')
              setRegisterVisible(true)
            }}
          >
            注册账号
          </Button>
        </div>
      </Card>

      {/* 修改密码弹窗 */}
      <Modal
        title="首次登录 - 修改密码"
        open={changePasswordVisible}
        closable={false}
        mask={{ closable: false }}
        footer={null}
      >
        <Typography.Paragraph type="warning">
          为了账户安全，首次登录需要修改初始密码
        </Typography.Paragraph>

        <Form
          form={changePasswordForm}
          layout="vertical"
          onFinish={handleChangePassword}
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 8, message: '密码至少8位' },
              {
                pattern: /^(?=.*[a-zA-Z])(?=.*\d)/,
                message: '密码需包含字母和数字',
              },
            ]}
          >
            <Input.Password placeholder="新密码（至少8位，含字母和数字）" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
            rules={[{ required: true, message: '请确认密码' }]}
          >
            <Input.Password placeholder="再次输入新密码" />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              修改密码并登录
            </Button>
          </Form.Item>
        </Form>
      </Modal>

      {/* 忘记密码确认弹窗 */}
      <Modal
        title="重置密码"
        open={forgotPasswordVisible}
        onCancel={() => {
          setForgotPasswordVisible(false)
          setForgotPasswordStudentNo('')
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setForgotPasswordVisible(false)
            setForgotPasswordStudentNo('')
          }}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            loading={forgotPasswordLoading}
            onClick={handleForgotPassword}
          >
            确认重置
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="学号" required>
            <Input
              placeholder="请输入你的学号"
              value={forgotPasswordStudentNo}
              onChange={(e) => setForgotPasswordStudentNo(e.target.value)}
              autoFocus
              onPressEnter={handleForgotPassword}
            />
          </Form.Item>
        </Form>
        <Typography.Paragraph type="warning" style={{ marginBottom: 0 }}>
          重置后的密码为：学号 + yuan
        </Typography.Paragraph>
      </Modal>

      {/* 注册弹窗 */}
      <Modal
        title="注册账号"
        open={registerVisible}
        onCancel={() => {
          setRegisterVisible(false)
          setRegisterStudentNo('')
        }}
        footer={[
          <Button key="cancel" onClick={() => {
            setRegisterVisible(false)
            setRegisterStudentNo('')
          }}>
            取消
          </Button>,
          <Button
            key="confirm"
            type="primary"
            loading={registerLoading}
            onClick={handleRegister}
          >
            注册
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="学号" required>
            <Input
              placeholder="请输入你的学号"
              value={registerStudentNo}
              onChange={(e) => setRegisterStudentNo(e.target.value)}
              autoFocus
              onPressEnter={handleRegister}
            />
          </Form.Item>
        </Form>
        <Typography.Paragraph type="warning" style={{ marginBottom: 0 }}>
          注册后默认密码为：学号 + yuan
        </Typography.Paragraph>
      </Modal>
    </div>
  )
}
