# 阿里云接入准备与实际状态

本记录区分账号查询、费用批准、资源创建、受控验证和公开上线。部署操作见 [双后端部署说明](dual-backend-deployment.md)。更新时间：2026-10-25（北京时间）。

## 本次临时 HTTP 接入

用户希望尽快通过阿里云独立网页选择两个后端。新增直接 IP 的 HTTP 页面与 Socket.IO 支持，以及 HTTPS 页面上的明确入口切换提示。浏览器 UUID 使用安全随机字节回退；没有把 HTTP 地址静默注入 HTTPS 请求，也不将恢复凭据放入跳转 URL。

- HTTP 测试入口：`http://115.29.188.62`；已实际部署并从批准网络验证，仅允许安全组及 Nginx 中已批准的来源 IPv4 `/32`。
- 正式域名：`https://magical-athlete-online.cn`；仍待 ICP 完成后申请正式 HTTPS 并开放。
- Cloudflare：`https://magical-athlete.qiuh23.workers.dev`；保留正式服务，已实际降至 15，阿里云为 15；切换时原服真人房为 0，没有结束既有对局。
- 无新增付费项目，既有 ECS 99 元 + 域名 38 元，总计 137 元，均关闭自动续费。
- 阿里云应用实际版本 `734791023b182a0760f2bfab9fe2a05460bc3c17`；Cloudflare 版本 `5977d248-c9c8-4f89-be7d-7cb12fbe3604`，源 `9f3d3cf` 与 `7347910` 的源码树完全一致（后者基于已合并的最新 main）。原 PR #22 已由外部合并，本次新增改动见 [PR #23](https://github.com/qiuh23/magical-athlete-online/pull/23)，不自动合并。
- 实际 HTTP 双入口 14 项通过：各后端双会话、HTTPS 邀请切 HTTP、私密目录、准备、双向聊天、断线和刷新身份恢复、桌面/手机、练习合法掷骰及 AI 启动；4 个测试房关闭，页面异常为 0。随后真实 HTTP 服务重启测试验证两身份、准备状态、聊天和建房回执全部恢复，测试房也关闭。
- ECS 无法直连 CF 的部署配额接口，已通过管理端实时读取实际配额并经 SSH 传入 root/0600、5 分钟有效的来源绑定快照完成前置检查；未跳过配额验证，阿里云运行时查房不依赖 CF。

HTTP/IP 不豁免备案；[阿里云官方要求](https://help.aliyun.com/zh/icp-filing/basic-icp-service/product-overview/icp-filing-requirements-for-a-regular-website) 同时说明 IP 和 HTTP 的备案要求。临时入口属于受控验证，不宣称国内全网公开上线。备案继续审核，本人留意审核电话及短信即可。具体操作、关闭和切换 HTTPS 见 [HTTP 过渡说明](http-transition.md)。
## 已核实与已批准

- 中国站账号已完成实名，现有 Alibaba Cloud CLI OAuth 配置可执行只读查询。配置和凭据保留在本机，不提交仓库。
- 用户已批准：杭州 ECS 首年 99 元，加 `.cn` 域名首年不超过 38 元，总额不超过 **137 元**，自动续费关闭。费用批准不表示订单已经支付或资源已经创建。
- 同一账号的杭州、上海初次只读盘点：ECS 各 0 台、轻量服务器各 0 台；杭州 VPC 0 个、安全组 0 个。后续创建会改变这些数量，应以最新查询和实际订单为准。
- 15:55 北京时间重复运行只读脚本时，杭州已出现 VPC 1 个、安全组 1 个；ECS 和轻量仍各 0 台。该查询只证明资源数量，创建和付款结果由实际执行记录确认。

## 2026-10-25 实际账号报价

| 方案 | 地域与配置 | 首期报价 | 续费与限制 |
| --- | --- | --- | --- |
| ECS 经济型 e | 杭州 `ecs.e-c1m1.large`，2 核 2 GiB，3 Mbps 固定带宽，40 GiB ESSD Entry，Linux，一年 | **99 元**；API 原价 1561.73 元，活动规则 20906709 | 官方 99 计划说明新购续费同价、每年一次；活动期与配置资格以实际续费页面为准。未购买前无法调用需要实例 ID 的续费报价 API。 |
| 轻量通用型 | 杭州/上海 `swas.s.c2m2s40b1.linux`，2 核 2 GiB，最高 200 Mbps 峰值，40 GiB ESSD，一年 | **68 元**；原价 540 元，API 返回新用户优惠；三个月报价 135 元 | 不承诺按 68 元续费；续费报价 API 需要已有实例 ID。200 Mbps 是峰值上限，非固定保障带宽。 |

报价来自账号实时 `ecs DescribePrice`、`swas-open DescribePrice`，不以宣传最低价代替实际报价。轻量首年更低；已批准的 ECS 方案使用固定带宽，且有官方活动续费规则。两个套餐的上述带宽方案均不另按流量收取费用；额外付费资源不在本次批准范围内。

杭州 ECS 查询时 `cn-hangzhou-b/g/h/i/j/k` 均有库存。已核实可用的纯 Ubuntu 24.04 x86_64 官方镜像：`ubuntu_24_04_x64_20G_alibase_20260916.vhd`。创建时仍需复核库存和订单金额。

## 此前资源创建与受控验证记录（HTTP 变更前）

- 费用确认：已完成。
- ECS：已实际创建 `magical-athlete-cn`，杭州 k 可用区，批准的配置，订单实付 **99 元**。API 复查 `AutoRenewEnabled=false`，当前账号一年续费报价也是 99 元；续费资格未来仍需再次核实。
- 配套 VPC、交换机、安全组和 SSH 密钥已创建，没有加购 EIP、数据库、负载均衡或其他付费服务。管理密钥及资源清单只保存在本机受保护目录，不提交仓库。
- 首次购买因余额不足未成功；用户充值后使用相同 `ClientToken` 成功创建一台，没有重复购买。
- 域名 `magical-athlete-online.cn` 已注册成功，注册期 2026-10-25 至 2027-10-25。注册任务成功，账务流水确认实付 **38 元**；与 ECS 合计 **137 元**。取消自动续费后再次查询 `AutoRenewEnabled=false`。
- 域名联系人模板及域名自身实名均已通过；最后 `QueryDomainByDomainName` 确认 `RealNameStatus=SUCCEED`、`DomainNameVerificationStatus=SUCCEED`。这些审核与 ICP 备案不同，**ICP备案已由本人提交，目前阿里云初审中**。用户确认主体为“个人”，省份为“北京”。
- 免费阿里云 DNS 的 `@` A 记录直接指向本次 ECS，TTL 600，没有经过 Cloudflare 代理。正式域名为 `https://magical-athlete-online.cn`，**尚未开放**，不能作为正常公网服务使用。
- 安全组仅对管理地址 `/32` 开放 SSH 22；没有公网 80/443/3000 入站。云助手初始化，严格校验主机公钥后建立 SSH 隧道验证。
- 已实际安装 Ubuntu 24.04、官方 Node 24.22.1（SHA 校验）、pnpm 11.25.0、nginx、SQLite、certbot，配置 2 GiB swap、systemd、持久化目录和每日备份。
- 应用代码 `a8c43bd8e49ac50f57827a2c57e743d15b8ff787` 已云端类型检查、两种构建、生产依赖打包与校验后部署。首次稀疏源码遗漏前端引用的规则文档，补取同一提交的文件后构建成功；没有修改游戏规则。
- 受控验证通过：两个 TLS 实时客户端建/入房、17 次动作至合法掷骰、聊天、同 ID 建房重试和重连；服务重启及进程被终止后自动恢复均保留身份、局面、骰面、聊天及回执；SQLite 在线备份 `integrity_check=ok`，目录 0750、备份 0600。
- 真实 ECS 网页、JS、配置和模型独立加载通过；两个独立浏览器从另一 Worker 网页入口加入 ECS 房间、操作、聊天、断线/刷新恢复、练习及 AI 启动通过。
- 国内入口：在域名实名、备案和必要资质满足前保持“未部署/未开放”。受控验证只通过批准的管理通道进行，不当作公开上线。
- HTTPS 验证使用仅回环监听的 **受控自签证书**，客户端显式信任该测试 CA，没有忽略证书错误。浏览器走 SSH 内 HTTP。正式可信域名 HTTPS、ICP备案和国内真实网络仍未验收，不能把受控验证当作公开上线。
- 验证完成后已关闭 `CONTROLLED_VALIDATION`，`PUBLIC_ACCESS_ENABLED=false`，Aliyun 在配置中禁用。再次实测房间 API 返回 503，原有效身份的普通实时连接被拒绝，health 报告两个开关均为 false。服务及持久数据保留，测试房间继续按原生命周期处理；管理 SSH 隧道已关闭，未开放公网游戏。

## ICP 与公开上线待办

1. 域名实名和个人材料已本人完成，免费标准 ICP 申请已于 2026-10-25 17:09 提交；最新确认阶段为阿里云初审，留意审核电话及后续短信。域名证书不写入仓库，无需再填联系人模板。
2. 本次 ECS 实查中国内地、PrePaid 年包、公网 IP、3 Mbps 带宽，满足官方列出的技术条件；这是依据条件的推断，仍需备案控制台最终核验可备案实例。同一账号会自动关联，不编造或购买额外服务码。
3. 如审核要求补充材料，由本人在官方系统完成；不得将证件、联系方式等个人信息写入仓库。
4. 如项目被主管部门归为游戏运营、出版或其他前置审批类别，先取得对应要求的核实结果与必要资质。公开开放前完成备案及适用的审批；不得把普通网站备案推断成全部资格已满足。
5. 阿里云节点的 DNS 直接指向阿里云公网入口，避免再套 Cloudflare 代理。开放国内节点前先将 Cloudflare 真人房配额降至 15，并等待存量真人房占用不超过 15；保留已有对局，不强制关闭。

官方依据：[ICP 备案流程](https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)、[备案驳回与游戏类前置审批](https://help.aliyun.com/zh/icp-filing/basic-icp-service/support/for-the-record-to-dismiss-the-faq)、[轻量备案与带宽限制](https://help.aliyun.com/zh/simple-application-server/product-overview/limits)、[轻量规格及流量规则](https://help.aliyun.com/zh/simple-application-server/product-overview/instance-families/)、[ECS 99 计划](https://cn.aliyun.com/activity/ecs/99program)、[RunInstances 公网 IP 与购买参数](https://help.aliyun.com/zh/ecs/developer-reference/api-ecs-2014-05-26-runinstances)。

## 本人已提交备案的内容依据

主体类型：个人；主体省份：北京。网站拟用名称：胡闹运动会（待备案审核确认名称适用性）。域名：`magical-athlete-online.cn`。接入商：阿里云，杭州 ECS 包年实例。

服务内容如实填写为：提供多人在线桌游对战、房间聊天、个人练习和 AI 对战。实际收费情况和运营方式由用户确认，不能擅自填写为普通博客或签署“不涉及游戏”承诺以规避审核。游戏相关前置审批及个人主体是否适用，须取得接入商/主管部门对实际形态的核实结果。

个人姓名、证件、联系方式、详细地址仅在阿里云官方备案系统中由本人填写；人脸、短信、真实性承诺及最终提交由用户亲自完成。本人已于 2026-10-25 提交免费标准 ICP 申请，当前阿里云初审中；未加购代办或其他付费服务。

北京材料核对：个人需年满 18 周岁，中国公民使用身份证；身份证有效期应大于 1 个月，域名有效期应大于 30 天，域名持有者与主办人一致，并由网站负责人完成人脸核验。网站名称和内容应真实符合个人服务规则，不能借改成博客名称隐藏实际游戏内容。这些条件来自 [阿里云北京备案规则（2026-09-14更新）](https://help.aliyun.com/zh/icp-filing/icp-filing-regulations-for-beijing/) 和 [信息填写规则](https://help.aliyun.com/zh/icp-filing/basic-icp-service/user-guide/fill-in-website-information)，不是已取得备案许可。

可复制至备案咨询的内容：本人拟以北京个人主体开办“胡闹运动会”，域名 magical-athlete-online.cn，服务包括多人在线桌游对战、房间聊天、个人练习和 AI 对战。请核实该实际形态能否使用个人主体备案、需哪些游戏/出版等前置审批，以及对应材料。收费及运营模式由本人如实补充。该咨询内容仅为历史准备记录；实际网站备注由本人确认并提交。

正式开放后最短国内实测：用手机移动网络直接打开国内域名；另一设备通过 A- 房间链接加入，发送一条聊天并刷新恢复。当前端口关闭期间不要求执行此步骤，也不把模拟断网或管理隧道当作国内真实网络结果。

## 重复只读查询

在已安装 CLI 且本机配置好授权的环境中运行：

```powershell
pwsh -NoProfile -File scripts/deploy/cloud-inventory.ps1
# 或指定已安装的 CLI 和本机 profile 名：
pwsh -NoProfile -File scripts/deploy/cloud-inventory.ps1 -AliyunCli C:\path\aliyun.exe -Profile magical-athlete
```

脚本只查询数量、公共规格、镜像、库存和报价；不输出账号 ID、个人信息、账号下实例/VPC 等资源 ID 或密钥，不创建资源或订单，不修改续费设置。公共镜像和套餐 ID 用于复现报价。查询失败显示不可确认，不能当作资源数量为零。报价应在付款前重新核实。
