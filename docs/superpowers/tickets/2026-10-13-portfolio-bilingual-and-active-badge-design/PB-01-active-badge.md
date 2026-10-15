# PB-01：项目级 Active 显示开关

状态：实现与专项验收完成。阶段：Phase 1。依赖：无；先核对用户改动。规格：第 4 节；AC-01、AC-02。

配套：[已批准 spec](../../specs/2026-10-13-portfolio-bilingual-and-active-badge-design.md)；[实施计划与全局约束](../../plans/2026-10-13-portfolio-bilingual-and-active-badge.md)。执行前两者均须阅读。

## 目标与边界

首页和 Lab 共用徽章组件，现有项目全部显式关闭。Demo 与源码按钮保持；不修复 Demo 服务、不翻译整站。

## Files

- Modify：`src/types/index.ts`、`src/data/portfolio.ts`、`src/components/Portfolio.tsx`、`src/pages/LabPage.tsx`。
- Create：`src/components/ActiveBadge.tsx`。

## Interfaces

- `Project.showActiveBadge: boolean` 必填，不从 `demoUrl` 推导。
- `ActiveBadge({ visible, label = 'Active' }: { visible: boolean; label?: string }): React.ReactNode`。
- PB-02 继承元数据开关；PB-04 用 `label` 注入字典文案。

## 实现步骤

- [x] 搜索项目数据 caller、两处徽章和 Demo 分支，读取当前 diff；记录项目数、按钮数量和链接，保护用户 Portfolio 修改。

```bash
rg -n 'projects|Project|Active|demoUrl' src
git diff -- src/components/Portfolio.tsx src/data/portfolio.ts src/types/index.ts
```

- [x] 类型加字段，每个项目写 `showActiveBadge: false`；把现有徽章样式集中到共享组件，关闭时不占位。

```tsx
export default function ActiveBadge({ visible, label = 'Active' }: {
  visible: boolean; label?: string;
}) {
  if (!visible) return null;
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
    <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
    {label}
  </span>;
}
```

- [x] 首页传 `visible={currentProject.showActiveBadge}`，Lab 传 `visible={project.showActiveBadge}`；关闭时不输出外部定位容器。Demo/GitHub 分支不变。
- [x] 执行 `pnpm run build`、`pnpm run lint`；基线失败报告具体错误，不扩大此票修无关代码。
- [x] 本地浏览器检查全部首页卡片和 Lab：无徽章，按钮数量/链接一致。临时将一个有 Demo 和一个无 Demo 的项目分别设 true，确认两处只显示指定徽章；截图后全部还原 false，再检查 diff。

## 验收与交付

此票是低影响可逆开关，不单独引入测试框架。交付开/关浏览器证据、按钮对照与最终全部 false 的数据。未验证 Demo 服务可用性明确记录；AC-01/02 满足才关闭。

验收证据与既有 lint 问题见 [progress.md](progress.md#pb-01-验证)。未检查 Demo 后端服务存活。
