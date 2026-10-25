# 临时 HTTP 入口与 HTTPS 切换

临时入口从阿里云公网 IP 独立提供网页、资源、API 和 Socket.IO，浏览器先打开 `http://实例IP`，再在该页面选择阿里云或 Cloudflare。HTTP 页面可以访问受信的 Cloudflare HTTPS/WSS 入口；Cloudflare 的 HTTPS 页面不能直接连接公网 HTTP/WS 后端。后端地址仍只由 `/backends.json` 决定，邀请码不会指定任意 URL。

**HTTP 与 IP 不会免除中国内地网站的 ICP 备案要求。** 这里保留尚在审核时的受控验证入口，仅允许明确批准的来源 IPv4 `/32`，不能标为已正式公开上线；免费备案申请继续审核。HTTP 传输不加密，房间凭据、聊天和游戏操作可能被链路上的人读取或篡改，临时验证请使用测试昵称和内容。

## 受控开放

1. 保留 Node 仅监听 `127.0.0.1:3000`，保留 `PUBLIC_ACCESS_ENABLED=false`。在 `/etc/magical-athlete/server.env` 设置 `CONTROLLED_VALIDATION=true`、`PUBLIC_ORIGIN=http://实例IP`、`DUAL_BACKEND_ENABLED=true`、`MULTIPLAYER_ROOM_LIMIT=15`；国内网页的运行时配置使用阿里云同源、Cloudflare 的实际 HTTPS origin。其他字段沿用现有服务器配置。
2. 先将 Cloudflare 静态配额改为 15，确认存量真人房不超过 15，再开放阿里云 15；不能强制结束旧房。脚本会实际复核 Cloudflare 的配额和占用，失败时不开放。
3. 使用本次明确批准的测试网络公网 IPv4，执行：

   ```sh
   sudo env PUBLIC_IP=实例公网IPv4 ACCESS_CIDRS=测试网络IPv4/32 HTTP_TRANSPORT_ACKNOWLEDGED=true bash scripts/deploy/publish-http.sh
   ```

   多个来源用逗号分隔，每项必须为单个 IPv4 `/32`。脚本验证配置、保留旧 nginx 文件、测试并重载 nginx，不修改云防火墙。云安全组仅为相同来源添加 TCP 80；3000 和公网 443 继续关闭。Nginx 再次限制相同来源并拒绝其他 Host，避免通过未备案域名打开此临时网页。
4. 从允许的实际浏览器网络验证静态资源、建房、加入、操作、聊天和恢复。网络公网 IP 变化后需要同步更新安全组与 nginx 白名单。其他网络不可达是受控入口的预期限制，不能报告为国内全网已可用。

如果内地实例无法直接访问 Cloudflare，默认的配额预检会失败并停止。可以由能访问 Cloudflare 的受信管理电脑实时读取 `/api/browser/rooms`，保存 `{ "origin": "实际Cloudflare的HTTPS来源", "capturedAt": "采集时的ISO时间", "capacity": { "used": 实际值, "limit": 实际值 } }`，立即通过已核验主机密钥的 SSH 上传，再在实例上以 root 安装为 `0600` 的普通文件。执行同一部署命令时追加 `CF_CAPACITY_FILE=/root/该文件.json`。必须保留 API 实际数值，不能手填较低占用或把采集时间延后；验证器检查文件非符号链接、属主和权限、精确来源、采集距今不超过五分钟（最多允许快三十秒），以及相同的 15 房间限制。文件过期后重新采集。该可选方式也适用于 HTTPS 发布，不会改变玩家日常访问阿里云的独立性。

关闭临时入口时先取消这些安全组 80 规则，将 `CONTROLLED_VALIDATION=false` 并重启 `magical-athlete`；保留 SQLite 和备份。之后保持阿里云部署配置未开放，直到完成下一次明确部署。

## 备案通过后切换

完成备案及必要资格确认后，DNS 仍直接指向阿里云。将 `CONTROLLED_VALIDATION=false`、`PUBLIC_ACCESS_ENABLED=true`，`PUBLIC_ORIGIN` 改为实际 `https://域名`。使用原有 `publish.sh`：

```sh
sudo env DOMAIN=实际备案域名 CERT_EMAIL=运维邮箱 ICP_CONFIRMED=true bash scripts/deploy/publish.sh
```

它会以 HTTPS 站点配置替换临时 IP 白名单配置并启用证书续期。届时安全组按公开 HTTPS 入口开放 80/443，更新两端受信 origin 白名单和 `/backends.json`，验证两种网页入口均能连接两个后端后再标为正式可用。不要继续使用 HTTP 后端地址，否则 HTTPS 页面仍会受到混合内容限制。

服务进程、数据目录、配额和房间码保持一致，不需要迁移规则或 SQLite。HTTP IP 与 HTTPS 域名的浏览器存储彼此隔离；切换前让当前临时房间自然结束，或先完成经过验证的凭据迁移，不能把数据库仍在误认为新域名自动拥有旧页面本地身份。更新、代码回滚和备份继续使用 [既有部署流程](dual-backend-deployment.md)。
