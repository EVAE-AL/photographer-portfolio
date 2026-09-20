# photographer-portfolio

这是一个静态摄影作品集网站，发布目录为 `photographer-portfolio/`。

## GitHub Pages

`main` 分支每次更新后，GitHub Actions 会自动发布网站。首次使用时，在 GitHub 仓库的 `Settings → Pages` 中将发布源设置为 `GitHub Actions`。

默认地址通常是：

`https://evae-al.github.io/photographer-portfolio/`

当前网站仍包含演示图片、演示联系方式和外部视频地址，正式上线前需要替换。GitHub Pages 不会读取 Netlify 的 `_headers` 文件，因此生产环境的响应头策略需要后续按 GitHub Pages 的能力另行处理。
