# Image to PPT

把一张扁平图片、截图、信息图、UI 示意图或单页视觉稿，拆解为多个独立 SVG 资产，并重建为可编辑、可复用的 PowerPoint `PPTX`。

这个仓库是一个 Codex Skill，技能名为 `image-to-ppt`。它的目标不是“把图片贴进 PPT”，而是把原图里的文本、形状、连线、图标、装饰元素分别重建成可编辑对象，方便后续继续修改和复用。

## 适用场景

- 需要把一张静态图片重做成可编辑 PPT
- 需要把信息图、架构图、UI 方案图拆成独立素材
- 需要保留文本可编辑、形状可调整、图标可替换的能力
- 需要交付结构化素材，而不是一张截图背景

## 不适用场景

- 只想把原图原样插进 PPT
- 原图本身就是可编辑源文件，比如已有 `pptx`、`fig`、`svg`、`ai`
- 需求是生成海报、插画或照片，而不是重建为编辑型演示文稿

## 核心原则

- 一个视觉素材，对应一个独立 SVG 文件
- 文本尽量使用 PowerPoint 原生文本框，不烘焙进 SVG
- 容器、卡片、条带、分隔线、箭头、连接关系尽量使用 PowerPoint 原生形状或线条
- 图标、插画、装饰图形、品牌图形分别作为独立 SVG 嵌入
- 最终 PPT 不能只是整张截图或整页扁平背景

## 输出约定

技能执行后，默认应交付以下文件：

- `output/<descriptive-name>.pptx`
- `output/svg-assets/*.svg`
- `output/svg-asset-manifest.json`
- `output/verification-report.json`

其中：

- `pptx` 是最终可编辑演示文稿
- `svg-assets/` 保存所有拆出的独立矢量素材
- `svg-asset-manifest.json` 记录素材名称、路径、用途和出现位置
- `verification-report.json` 记录结构化校验结果

## 仓库结构

```text
.
├─ SKILL.md
├─ README.md
├─ agents/
│  └─ openai.yaml
└─ scripts/
   └─ verify_pptx_assets.js
```

## 工作流

1. 分析原图尺寸、版式层级和重复元素
2. 先做素材清单，再开始重建
3. 将每个非文本视觉元素拆成独立 SVG
4. 用语义化文件名保存到 `svg-assets/`
5. 生成 `svg-asset-manifest.json`
6. 用 PowerPoint 原生对象重建版面
7. 运行校验脚本，确认素材分离和可编辑性成立

## 素材拆分规则

下表是最重要的约束：

| 原图元素 | 目标产物 |
|---|---|
| 图标 | 每个图标一个独立 SVG |
| 相同外观但语义不同的图标 | 分开导出，分别命名 |
| 装饰背景曲线、圆环、纹样 | 每个装饰单元一个 SVG |
| 简单箭头、分割线、容器 | 优先用 PPT 原生形状 |
| 图像化箭头或复杂装饰箭头 | 可单独做成 SVG |
| Logo、品牌标识、吉祥物 | 仅使用用户提供或可验证来源素材 |
| 文本 | 优先用 PPT 原生文本，不放进 SVG |

推荐命名方式：

```text
icon-01-user-command.svg
icon-02-business-flow.svg
flow-arrow-01-left-to-center.svg
bg-decoration-01-top-right-rings.svg
```

## SVG 要求

每个 SVG 都应该满足：

- 是独立可用的标准 `.svg` 文件
- 具有自己的 `viewBox`
- 文件内容只包含该文件名对应的单一素材
- 除非确实无法矢量化，否则不要嵌入位图
- 除非用户明确要求，否则不要把可编辑文本写进 SVG

## PPT 重建要求

重建后的 PPT 应满足：

- 文本可编辑
- 主要布局结构可编辑
- 连线关系可编辑
- 图标和装饰作为独立素材存在
- 素材与文本彼此分离，方便单独修改

明确禁止：

- 把整页导出成一个大 SVG 再塞进 PPT
- 把原始图片作为整页背景
- 为了省事把局部区域截图后嵌进去
- 把多个无关图标合并成一张 sprite 图

## 校验脚本

仓库自带 `scripts/verify_pptx_assets.js`，用于做基础结构校验，包括：

- `PPTX` 是否存在且非空
- 页数是否符合预期
- `svg-assets/` 数量是否与清单一致
- `PPTX` 内嵌 SVG 数量是否符合预期
- 是否疑似把原始源图嵌入到了最终 `PPTX`
- 是否检测到可编辑文本和可编辑形状

示例：

```bash
node scripts/verify_pptx_assets.js \
  --pptx output/ai-os-editable-rebuild.pptx \
  --asset-dir output/svg-assets \
  --manifest output/svg-asset-manifest.json \
  --expected-slides 1 \
  --expected-svg 38 \
  --source-name image_task_01KRRMGNBX1H2DPE4HX7DY1PF1_0
```

## 在 Codex 中使用

如果你希望把这个仓库作为本地 Skill 使用，可以将它放到 Codex 的技能目录中，例如：

```text
~/.codex/skills/image-to-ppt
```

然后在任务中显式调用：

```text
Use $image-to-svg-ppt to convert the provided image into separate SVG assets and rebuild it as an editable PowerPoint deck.
```

`agents/openai.yaml` 中已经提供了默认展示名与默认提示词配置。

## 设计目标

这个 Skill 的重点不是“高精度截图复刻”，而是“结构化重建”：

- 让演示文稿可编辑
- 让素材可复用
- 让图文结构可维护
- 让最终交付适合二次设计而不是一次性展示
