# 来源与许可

本技能封装 UI Skills 的 Floating dots 本地 Canvas 2D 实现，视觉参考 Google Antigravity 的下载区效果。它不是 Google 官方组件，不与 Google 存在隶属或背书关系，也不宣称与参考画面逐帧相同。

独立代码和文档采用随附 `LICENSE` 中的 MIT 许可证。`noise-field.js` 中的 3D simplex noise 保留 Ashima Arts 的版权和 MIT 许可；复制运行模块时保留这些通知。

独立预览随附 Google Sans Flex 字体，来源记录在 `assets/SOURCES.txt`，适用 SIL Open Font License 1.1，全文见 `assets/OFL.txt`。`runtime` 不输出字体、页面样式或调参面板。多色光标由 CSS 绘制。

本包不包含参考站的原始可执行脚本。新增素材和依赖使用各自适用的许可；上述说明不修改 MIT 许可证的条件。

本项目接入：从 `skills/floating-dots` 生成 runtime 副本。引擎的蓝色图集末端改为融入当前 `background`，背景变化时重建图集，以适配白色和深蓝色主题；运动与输入模块沿用技能实现。
