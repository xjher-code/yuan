# OpenClaw 外网访问配置指南：使用 Caddy + HTTPS 反向代理

> 本文以实际案例讲解如何让部署在云服务器上的 OpenClaw 支持外网 HTTPS 访问，使用 Caddy 自动管理 SSL 证书。

---

## 背景

OpenClaw 默认绑定到 `127.0.0.1`（loopback），只能本地访问。此外，OpenClaw 的 Control UI 依赖浏览器安全上下文（secure context），必须通过 HTTPS 或 localhost 访问才能正常使用设备配对等核心功能。

本文使用的环境：
- **服务器**: Ubuntu 24.04 LTS（京东云）
- **OpenClaw**: 2026.4.26
- **Caddy**: v2.11.2
- **域名**: `openclaw.dlovey.cn`

---

## 整体架构

```
用户浏览器
    │
    │ HTTPS (443)
    ▼
Caddy（反向代理 + 自动 HTTPS）
    │
    │ HTTP 反向代理
    ▼
OpenClaw Gateway（127.0.0.1:18789）
```

Caddy 负责：
1. 接收外部 HTTPS 请求
2. 自动申请和续期 Let's Encrypt 证书
3. 将请求转发到本地的 OpenClaw Gateway
4. 自动将 HTTP 请求重定向到 HTTPS

---

## 第一步：配置 OpenClaw

编辑 OpenClaw 配置文件（`~/.openclaw/openclaw.json`），修改以下关键项：

```json
{
  "gateway": {
    "bind": "lan",
    "port": 18789,
    "auth": {
      "mode": "token",
      "token": "your-token-here"
    },
    "controlUi": {
      "allowInsecureAuth": true,
      "allowedOrigins": [
        "http://localhost:18789",
        "http://127.0.0.1:18789",
        "https://openclaw.yourdomain.com"
      ]
    }
  }
}
```

**说明：**
- `bind: "lan"` — 绑定到所有网络接口（非 `0.0.0.0`，OpenClaw 使用命名绑定模式）
- `allowedOrigins` — 必须包含你最终访问的域名地址，否则会报 `origin not allowed`
- `auth.token` — 访问网关的认证令牌

修改后重启 OpenClaw Gateway：

```bash
# 没有 systemd 服务的情况下
pkill openclaw-gateway
nohup openclaw gateway run --allow-unconfigured > ~/.openclaw/gateway.log 2>&1 &
```

> **小知识：** OpenClaw 的 `bind` 支持以下模式：
> - `loopback` — 仅 127.0.0.1（最安全）
> - `lan` — 所有网络接口（可直接外网访问）
> - `tailnet` — Tailscale 网络
> - `auto` — OpenClaw 自动判断

---

## 第二步：开通云安全组端口

在云服务商控制台的安全组（Security Group）中，添加入方向规则：

| 协议 | 端口 | 来源 | 说明 |
|------|------|------|------|
| TCP | 80 | 0.0.0.0/0 | HTTP（用于 Let's Encrypt 域名验证） |
| TCP | 443 | 0.0.0.0/0 | HTTPS（对外访问） |

> **注意：** 云安全组是独立于服务器内部防火墙（iptables/ufw）的额外网络层，两者都需要配置正确。本例中服务器内部 iptables 策略为 ACCEPT，因此仅需配置云安全组。

---

## 第三步：DNS 解析

在域名 DNS 管理中添加 A 记录：

| 记录类型 | 主机记录 | 记录值 |
|---------|---------|--------|
| A | `openclaw`（或你想要的子域名） | 服务器公网 IP |

解析生效后可以用 `dig` 验证：

```bash
dig openclaw.yourdomain.com A +short
# 应返回你的服务器 IP
```

---

## 第四步：安装 Caddy

Caddy 是一个 Go 语言编写的 Web 服务器，最大的亮点是**自动 HTTPS**——它会自动申请和续期 Let's Encrypt 证书，无需手动配置。

在 Ubuntu/Debian 上安装：

```bash
# 安装依赖
apt-get update
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

# 添加 Caddy 软件源
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' -o /tmp/caddy-gpg.key
gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg /tmp/caddy-gpg.key
echo 'deb [signed-by=/usr/share/keyrings/caddy-stable-archive-keyring.gpg] https://dl.cloudsmith.io/public/caddy/stable/deb/debian any-version main' | tee /etc/apt/sources.list.d/caddy-stable.list

# 安装 Caddy
apt-get update
apt-get install -y caddy

# 验证安装
caddy version
```

安装完成后 Caddy 会自动启动并设置 systemd 自启。

---

## 第五步：配置 Caddy 反向代理

编辑 Caddy 配置文件 `/etc/caddy/Caddyfile`：

```caddyfile
openclaw.yourdomain.com {
    # 反向代理到本地 OpenClaw Gateway
    reverse_proxy 127.0.0.1:18789 {
        # 传递原始 Host 头
        header_up Host {host}
        header_up X-Real-IP {remote_host}
        header_up X-Forwarded-For {remote_host}
        header_up X-Forwarded-Proto {scheme}
    }

    # 访问日志（可选）
    log {
        output file /var/log/caddy/openclaw.log
    }
}
```

Caddyfile 的语法非常简洁，核心就是：
1. 第一行写域名
2. 花括号内写配置指令
3. `reverse_proxy` 指令指定后端地址

**Caddy 自动完成的魔法：**
- 自动为域名申请 Let's Encrypt 证书
- 自动将 HTTP（80）请求重定向到 HTTPS（443）
- 自动处理 WebSocket 升级（OpenClaw 需要）
- 每 60 天自动续期证书

重载配置：

```bash
caddy reload --config /etc/caddy/Caddyfile
```

查看 Caddy 日志确认证书申请成功：

```bash
journalctl -u caddy --no-pager -n 20 | grep -E 'certificate|succ'
# 应看到 "certificate obtained successfully"
```

---

## 第六步：设备配对

首次通过浏览器访问 `https://openclaw.yourdomain.com/#token=your-token` 时，可能会看到 "device pairing required" 错误。

这是 OpenClaw 的安全机制，需要在服务器上批准该设备：

```bash
# 查看待配对请求
openclaw devices list

# 批准配对（使用返回的 requestId）
openclaw devices approve <request-id>
```

批准后刷新浏览器页面即可正常使用。

---

## 完整配置检查清单

| 步骤 | 操作 | 验证方式 |
|------|------|---------|
| OpenClaw `bind: lan` | 修改 openclaw.json | `ss -tlnp \| grep 18789` 应显示 `0.0.0.0:18789` |
| allowedOrigins | 添加域名地址 | 浏览器访问不报 `origin not allowed` |
| 云安全组 80/443 | 添加入方向规则 | 外部 `curl` 到 80/443 端口有响应 |
| DNS A 记录 | 添加域名解析 | `dig` 命令返回服务器 IP |
| 安装 Caddy | 执行安装脚本 | `caddy version` 显示版本号 |
| Caddyfile 配置 | 编写反向代理配置 | `caddy reload` 不报错 |
| HTTPS 证书 | Caddy 自动申请 | 日志显示 `certificate obtained successfully` |
| 设备配对 | `openclaw devices approve` | 浏览器正常进入 OpenClaw 界面 |

---

## 踩坑记录

### 1. `origin not allowed`

**原因：** OpenClaw 的 `allowedOrigins` 中没有包含实际访问的域名地址。

**解决：** 在 `gateway.controlUi.allowedOrigins` 中添加 `https://你的域名`。

### 2. `Control UI requires device identity`

**原因：** 浏览器安全策略——设备身份 API 需要 HTTPS 安全上下文，通过 HTTP 访问公网 IP 会导致此错误。

**解决：** 配置 Caddy 反向代理提供 HTTPS 访问。

### 3. 证书申请失败

**原因：** Let's Encrypt 验证服务器无法访问服务器的 80 端口。

**解决：** 确保云安全组开放了 80 端口。Caddy 使用 HTTP-01 或 TLS-ALPN-01 验证域名所有权。

### 4. 安全组配置了但不生效

**原因：** 云平台可能有多个安全组，配置的安全组可能未关联到目标云服务器。

**解决：** 检查云服务器详情页中关联的安全组是否正确。

---

## 总结

通过 Caddy 配置 HTTPS 反向代理，你不仅解决了 OpenClaw 的外网访问问题，还免费获得了：

- ✅ 自动 Let's Encrypt SSL 证书
- ✅ 自动证书续期
- ✅ HTTP → HTTPS 重定向
- ✅ 简洁的配置文件
- ✅ 内置 WebSocket 支持

相比 Nginx，Caddy 的配置量大约只有 1/5，特别适合需要快速部署 HTTPS 的场景。
