# 实时字幕同步显示进度 - 深度研究

## 当前架构理解

### 1. 播放系统现状

**两种播放模式：**

#### a) Web Speech API（使用 useSpeechSynthesis）
- 用于**记忆模式**和**阅读模式**的文本朗读
- 位置：`hooks/use-speech-synthesis.ts`
- 关键状态：`isPlaying`, `isPaused`
- 生命周期事件：`onstart`, `onend`, `onerror`
- **关键限制**：Web Speech API 的 `SpeechSynthesisUtterance` **不提供逐字符或逐单词的进度事件**
  - 标准规范定义的事件只有：`start`, `end`, `error`, `pause`, `resume`
  - 没有 `onboundary` 类事件来获取当前播放到的字符位置
  - 某些浏览器实验性支持 `onboundary` 事件（仅 Chrome），但不稳定、不跨浏览器

#### b) HTML5 Audio（用于听力模式）
- 位置：`components/audio-player.tsx` 的 `<audio>` 元素
- 事件丰富：`timeupdate`, `progress`, `loadedmetadata` 等
- **可以准确获得当前播放时间**
- 适配外部音频文件（如 BV1eBkYB9EQJ.m4a）

### 2. 当前组件结构

**ArticleClient** (`app/article/[article]/page.client.tsx`)
- 三种学习模式：`listening` | `reading` | `memory`
- 使用 `useSpeechSynthesis` hook 用于 reading/memory
- 使用 `AudioPlayer` 组件用于 listening
- 状态管理：局部 useState，没有统一的播放进度状态

**AudioPlayer** (`components/audio-player.tsx`)
- 两种渲染：
  - 有 `audioPath`：使用原生 `<audio controls>`（HTML5）
  - 无 `audioPath`：使用 SpeechSynthesis

### 3. Tailwind 配置

- 支持 Tailwind 的标准颜色系统（text-blue-500, text-red-500 等）
- 支持渐进式颜色（text-blue-50 到 text-blue-900）
- 支持动画：`accordion-down`, `accordion-up`

### 4. 数据结构

**Article 类型**（`types/index.ts`）
```typescript
interface Article {
  english: string      // 完整英文文本
  chinese: string      // 完整中文文本
  sentences: Sentence[] // 句子级别的分解
  audioPath?: string
}

interface Sentence {
  english: string
  chinese: string
}
```
- 当前没有字符级别的时间戳映射
- 有句子级别的分解，但没有句子的时间位置信息

## 技术可行性分析

### 挑战 1：获取播放进度

| 播放方式 | 进度精度 | 可行性 | 说明 |
|---------|--------|--------|------|
| Web Speech API | 无精度 | ❌ 差 | API 不提供逐字符事件，即使 Chrome 的 `onboundary` 也不稳定 |
| HTML5 Audio | 毫秒级 | ✅ 好 | `timeupdate` 事件精确 |

### 挑战 2：字符位置映射

**问题：** 知道音频播放时间 ≠ 知道对应的字符位置
- 需要"音频时间"→"文本字符索引"的映射
- 当前数据结构中没有这个映射
- 句子级别的映射可以推断，但字符级别很难

**解决方案：**
1. **对于 HTML5 Audio**（listening mode）：
   - 使用句子级分解 + 估算方法
   - 假设每个字符播放时间相等：`charIndex = (currentTime / totalTime) * textLength`
   - 优点：简单，无需修改数据结构
   - 缺点：不够精确，特别是停顿位置

2. **对于 Web Speech API**（reading/memory mode）：
   - **方案 A**：使用估算法（同上）
   - **方案 B**：使用句子级视觉同步（当前选哪个句子，就高亮那个句子）
   - **方案 C**：每个句子分开播放，使用句子的开始/结束事件作为边界

### 挑战 3：视觉设计

- 高亮已播放部分（例如前 40% 的文本用 purple-900，后 60% 用 gray-600）
- 用颜色标识"已播放"vs"待播放"
- 需要动态计算每个字符的样式

## 推荐方案

### 对于 Listening Mode（HTML5 Audio）
✅ **最可行** - 优先实现

**实现思路：**
1. 在 `<audio>` 元素上监听 `timeupdate` 事件
2. 获取 `currentTime` 和 `duration`
3. 计算播放进度比例：`progress = currentTime / duration`
4. 根据进度计算已播放的字符索引
5. 用 `<span>` 分割文本，动态应用颜色

**修改文件：**
- `components/audio-player.tsx`：添加进度同步逻辑
- 可能需要创建新组件 `SyncedText` 用于渲染带颜色的文本

### 对于 Reading Mode（Web Speech API）
⚠️ **有限度可行** - 使用估算法

**实现思路：**
1. 扩展 `useSpeechSynthesis` hook，添加 `elapsedTime` 和 `totalDuration` 状态
2. 使用 `setInterval` 或 `requestAnimationFrame` 估算已播放时间
3. 计算进度比例
4. 同样用 `<span>` 分割文本，动态上色

**局限性：**
- 无法精确知道句子/单词边界
- 暂停时时间计算会不准确
- 不同语言/速率影响精度

### 对于 Memory Mode（Web Speech API 逐句）
✅ **最佳实现** - 替换当前实现

**实现思路：**
1. 当前记忆模式只显示一句
2. 每句单独播放，使用 `onstart` / `onend` 作为完整的播放周期
3. 在一句内部，使用估算法同步显示进度
4. 句子间切换时，自动重置进度

**优势：**
- 边界清晰（句子间断）
- 估算误差被限制在单句内
- 用户体验更好

## 推荐实现顺序

1. **第一阶段**：Listening Mode（HTML5 Audio）
   - 实现最直接，精度最高
   - 影响用户最明显

2. **第二阶段**：Memory Mode（Web Speech API）
   - 改进当前记忆模式
   - 需要修改 `useSpeechSynthesis` 和 `ArticleClient`

3. **第三阶段**：Reading Mode（Web Speech API）
   - 可选的增强（不是必须）
   - 精度最低但可以改进用户体验

## 数据结构补充

**可选优化**（不是必须实现）：
如果后续想精确映射，可扩展 Article 结构：
```typescript
interface ArticleTimingMap {
  sentences: Array<{
    english: string
    startTime: number   // 秒
    endTime: number
  }>
}
```
但目前不需要，因为可以用估算法。
