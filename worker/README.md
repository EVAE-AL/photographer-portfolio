# 预约表单推送部署说明

表单提交后，会通过 Cloudflare Worker 转发到你手机的群机器人。
机器人密钥只存在 Worker 环境变量里，前端代码中不出现，可以安全公开。

```
浏览器表单 --POST--> Cloudflare Worker --转发--> 群机器人 --> 手机
```

## 一、先建一个机器人

### 方案 A：Telegram（推荐，最简单）

注意：Telegram 在中国大陆需要能访问外网才能用。

1. 在 Telegram 里搜 `@BotFather`，发送 `/newbot`，按提示起名
2. 拿到形如 `123456789:AAE...` 的 **token**
3. 把你自己的账号拉进这个 bot 的对话，然后给 bot 发一条消息
4. 浏览器打开 `https://api.telegram.org/bot<你的token>/getUpdates`
5. 在返回的 JSON 里找到 `"chat":{"id":123456789}`，这个数字就是 **chat_id**

### 方案 B：飞书（国内网络可用）

1. 打开飞书，进入一个群（可以只拉自己）→ 群设置 → 群机器人 → 添加机器人 → 自定义机器人
2. 复制生成的 **Webhook 地址**，形如 `https://open.feishu.cn/open-apis/bot/v2/hook/xxxx`
3. 安全设置里建议勾选「签名校验」以外的简单方式；若必须签名，需要额外改代码，先选「自定义关键词」，关键词填 `预约`

钉钉、企业微信同理，拿到 Webhook 地址即可，把 `WEBHOOK_KIND` 改成 `dingtalk` 或 `wecom`。

## 二、部署 Worker

在 `worker/` 目录下执行：

```
cd worker
npx wrangler login
npx wrangler deploy
```

然后写入密钥（按你选的方案二选一）：

**Telegram：**
```
npx wrangler secret put TELEGRAM_BOT_TOKEN
npx wrangler secret put TELEGRAM_CHAT_ID
```

**飞书 / 钉钉 / 企业微信：**
```
npx wrangler secret put WEBHOOK_URL
```

执行 `npx wrangler secret put` 时，终端会提示你粘贴值，粘贴后回车即可。密钥不会显示在配置文件中。

记得把 `wrangler.toml` 里的 `WEBHOOK_KIND` 改成你实际用的类型。

部署成功后会输出一个地址，形如：

```
https://booking-relay.<你的子域>.workers.dev
```

## 三、把地址填进前端

打开 `photographer-portfolio/assets/cinematic.js`，找到这一行：

```js
var FORM_ENDPOINT = "";
```

把 Worker 地址填进去：

```js
var FORM_ENDPOINT = "https://booking-relay.<你的子域>.workers.dev";
```

提交并推送，GitHub Actions 会自动重新发布。

## 四、验证

1. 打开 `https://evae-al.github.io/photographer-portfolio/booking.html`
2. 填写并提交，页面应显示「已收到你的预约信息」
3. 手机上应立刻收到机器人推送

若失败，页面会提示「发送失败了」，并显示备用邮箱。

## 五、免费额度

Cloudflare Workers 免费计划每天 10 万次请求，个人预约表单远远用不完，不需要绑卡。

## 六、安全说明

- 机器人密钥存在 Worker 的加密环境变量中，前端和 Git 仓库里都没有
- Worker 只接受来自 `ALLOWED_ORIGIN` 的请求
- 表单有蜜罐字段，机器人填写后会被静默丢弃
- 如果密钥不慎泄露，在机器人后台重置即可，不影响网站