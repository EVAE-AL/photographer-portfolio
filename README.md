# photographer-portfolio

这是一个静态摄影作品集网站，发布目录为 `photographer-portfolio/`。

## GitHub Pages

`main` 分支每次更新后，GitHub Actions 会自动发布网站。首次使用时，在 GitHub 仓库的 `Settings → Pages` 中将发布源设置为 `GitHub Actions`。

默认地址通常是：

`https://evae-al.github.io/photographer-portfolio/`

当前网站仍包含演示图片、演示联系方式和外部视频地址，正式上线前需要替换。GitHub Pages 不会读取 Netlify 的 `_headers` 文件，因此生产环境的响应头策略需要后续按 GitHub Pages 的能力另行处理。

## 预约表单

预约表单提交后会通过 Cloudflare Worker 转发到手机群机器人。

```
浏览器表单 --POST--> Cloudflare Worker --转发--> 群机器人 --> 手机
```

机器人密钥只保存在 Worker 的加密环境变量中，前端代码和本仓库里都不包含密钥。

`worker/` 目录是 Worker 源码，部署步骤见 `worker/README.md`。

前端接入点在 `photographer-portfolio/assets/cinematic.js` 的 `FORM_ENDPOINT`：

- 留空：退回 `mailto:`，打开本机邮件客户端
- 填入 Worker 地址：改为直接推送到手机

表单带蜜罐字段拦截机器人，提交失败时会提示备用邮箱。
