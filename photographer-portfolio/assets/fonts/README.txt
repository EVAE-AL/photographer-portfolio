字体来源与更新说明
==================

来源
----
Google Fonts CSS API（Chrome UA）
https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600&display=swap
下载日期：2026-09-18
原始文件名为 Google 分配的哈希名，此处已重命名以便维护。

文件对照
--------
instrument-serif-400.woff2                  Instrument Serif 常规 400，latin 子集
instrument-serif-400-latin-ext.woff2        同上，latin-ext 子集
instrument-serif-italic-400.woff2           Instrument Serif 斜体 400，latin 子集
instrument-serif-italic-400-latin-ext.woff2 同上，latin-ext 子集
inter-300-600.woff2                         Inter 可变字体（fvar/gvar/avar），latin 子集
inter-300-600-latin-ext.woff2               同上，latin-ext 子集

为什么只保留 latin / latin-ext
------------------------------
站点中文走系统中文字体回退（PingFang SC / Microsoft YaHei / Songti SC），不嵌入中文字体，
因此不需要 cyrillic / greek / vietnamese 等子集。浏览器按 unicode-range 只下载实际用到的子集。

授权
----
SIL Open Font License 1.1，版权声明与许可全文见同目录 OFL.txt。

更新方式
--------
重新拉取上面的 CSS，按 unicode-range 首段为 U+0000-00FF（latin）或 U+0100-02BA（latin-ext）
识别目标 @font-face 块，下载对应 woff2 覆盖本目录文件，并同步更新 assets/fonts.css 里的 unicode-range。
注意：字体更新后需确认 OFL.txt 中的版权年份是否要一并更新。

中文字体提醒
------------
如需为中文单独配字体，请勿直接使用未授权的商业中文字体（方正、汉仪、字魂等）。
网页嵌入（@font-face）通常属于单独计价授权，很多“免费下载”只授权个人非商用。
可安全使用的开源中文方案：思源宋体 / 思源黑体（Source Han Serif / Sans，即 Noto CJK），同为 OFL 1.1。
