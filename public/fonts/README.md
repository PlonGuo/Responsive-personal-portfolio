# 本站字体子集

中英文标题、正文和控件统一使用 Noto Sans SC；常规 400、粗体 700，代码继续使用系统等宽字体。通过 `next/font/local` 从本站提供两个 WOFF2 文件，`display: swap`；下载失败回退到 PingFang SC / Microsoft YaHei / sans-serif。动态聊天中的未知字符及 emoji、代码绘图符号仍可用系统字体。

来源：[Google Fonts 的 Noto Sans SC](https://github.com/google/fonts/tree/a85815a42757630ce188fdad368c2dfc444d4773/ofl/notosanssc)，固定提交 `a85815a42757630ce188fdad368c2dfc444d4773`。上游 `NotoSansSC[wght].ttf` Git blob：`fb0637bafbcd804fe32152370a1225990745b4bc`；SHA-256：`a3041811a78c361b1de50f953c805e0244951c21c5bd412f7232ef0d899af0da`。文件保持 SIL Open Font License 1.1，完整版权与许可见 [OFL.txt](OFL.txt)。子集不使用保留字体名 Source。

字符来自两套作品集/字典、全部英文博客和页面/组件的静态源文字，并包含全部可打印 ASCII。`manifest.json` 保存实际子集 cmap（字符到字形的映射）与二进制 SHA-256；`pnpm content:check` 校验所有静态中文、拉丁字母、数字、标点均有字形，并验证文件哈希。新增未收录文案时构建明确失败，需重建子集，不能删改文案凑预算。Python 仅用于更新字体，正常构建与验收只需要 Node/pnpm。

重建步骤：

1. 从上述固定提交下载原始 TTF 到仓库外（如 `/tmp/NotoSansSC.ttf`），核对 SHA-256。
2. 运行 `pnpm fonts:characters /tmp/portfolio-characters.txt`。
3. 运行 `uv run scripts/subset-font.py /tmp/NotoSansSC.ttf /tmp/portfolio-characters.txt public/fonts --og-font lib/assets/noto-sans-sc-700.ttf`。脚本声明 FontTools/Brotli 固定版本，输出 400/700 子集、manifest，以及服务端分享图专用 TTF。`next/og` 不支持 WOFF2，该 TTF 与粗体网页字体字形一致，只由服务端读取，不加入页面预加载。
4. 运行 `pnpm content:check && pnpm build`，启动生产服务后运行 `BASE_URL=http://localhost:3000 pnpm fonts:check`。再运行 `FONT_BUDGET_BYTES=1 BASE_URL=http://localhost:3000 pnpm fonts:check`，应以非零状态退出。

预算脚本为每种语言分别建立全新浏览器上下文，禁用 HTTP 缓存和 service worker，等待 `document.fonts.ready`，汇总实际字体响应体 `encodedBodySize`。通过 Chrome 的实际渲染字体信息确认标题使用本站字体，不把零字节、字体加载失败或系统回退当作预算达标。正式上限为每种语言 500 KiB，环境参数只允许收紧上限。
