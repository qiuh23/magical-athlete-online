# 阿里云接入准备与实际状态

本记录区分账号查询、费用批准、资源创建、受控验证和公开上线。部署操作见 [双后端部署说明](dual-backend-deployment.md)。更新时间：2026-10-25（北京时间）。

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

## 创建与验证进度

- 费用确认：已完成。
- ECS：已实际创建 `magical-athlete-cn`，杭州 k 可用区，批准的配置，订单实付 **99 元**。API 复查 `AutoRenewEnabled=false`，当前账号一年续费报价也是 99 元；续费资格未来仍需再次核实。
- 配套 VPC、交换机、安全组和 SSH 密钥已创建，没有加购 EIP、数据库、负载均衡或其他付费服务。管理密钥及资源清单只保存在本机受保护目录，不提交仓库。
- 首次购买因余额不足未成功；用户充值后使用相同 `ClientToken` 成功创建一台，没有重复购买。
- 域名 `magical-athlete-online.cn` 查询为可注册，普通非溢价，首年 38 元。尚未注册或扣费；用户已提交联系人模板，API 状态为 `AUDITING`、邮箱已验证，等待注册局审核。账户实名不能替代域名模板实名。
- 初始安全组未开放公网入站，通过云助手进行初始化；确需 SSH/SCP 时仅对管理地址开放 22。
- 云端初始化进行中：Node 24、systemd、持久化目录、基本备份与受控验证仍需逐项实测，后续结果在此更新。
- 国内入口：在域名实名、备案和必要资质满足前保持“未部署/未开放”。受控验证只通过批准的管理通道进行，不当作公开上线。
- HTTPS、实时连接、资源独立加载、进程重启后持久化恢复：必须在实际实例上验证后记录结果；本地验证不代替云端验证。

## ICP 与公开上线待办

1. 域名完成注册和实名，主体信息与备案主体一致；核实域名在有效期内且满足对应省份要求。
2. 大陆服务器满足备案资源条件。轻量官方规则为累计购买时长至少三个月；本次 ECS 包年方案需在实际备案系统核验资源资格。
3. 用户准备证件、联系人、地址、网站信息等备案材料并亲自完成需要的实名/人脸/短信核验；不得将这些个人信息写入仓库。
4. 如项目被主管部门归为游戏运营、出版或其他前置审批类别，先取得对应要求的核实结果与必要资质。公开开放前完成备案及适用的审批；不得把普通网站备案推断成全部资格已满足。
5. 阿里云节点的 DNS 直接指向阿里云公网入口，避免再套 Cloudflare 代理。开放国内节点前先将 Cloudflare 真人房配额降至 15，并等待存量真人房占用不超过 15；保留已有对局，不强制关闭。

官方依据：[ICP 备案流程](https://www.alibabacloud.com/help/en/icp-filing/basic-icp-service/user-guide/icp-filing-application-overview)、[备案驳回与游戏类前置审批](https://help.aliyun.com/zh/icp-filing/basic-icp-service/support/for-the-record-to-dismiss-the-faq)、[轻量备案与带宽限制](https://help.aliyun.com/zh/simple-application-server/product-overview/limits)、[轻量规格及流量规则](https://help.aliyun.com/zh/simple-application-server/product-overview/instance-families/)、[ECS 99 计划](https://cn.aliyun.com/activity/ecs/99program)、[RunInstances 公网 IP 与购买参数](https://help.aliyun.com/zh/ecs/developer-reference/api-ecs-2014-05-26-runinstances)。

## 重复只读查询

在已安装 CLI 且本机配置好授权的环境中运行：

```powershell
pwsh -NoProfile -File scripts/deploy/cloud-inventory.ps1
# 或指定已安装的 CLI 和本机 profile 名：
pwsh -NoProfile -File scripts/deploy/cloud-inventory.ps1 -AliyunCli C:\path\aliyun.exe -Profile magical-athlete
```

脚本只查询数量、公共规格、镜像、库存和报价；不输出账号 ID、个人信息、账号下实例/VPC 等资源 ID 或密钥，不创建资源或订单，不修改续费设置。公共镜像和套餐 ID 用于复现报价。查询失败显示不可确认，不能当作资源数量为零。报价应在付款前重新核实。
