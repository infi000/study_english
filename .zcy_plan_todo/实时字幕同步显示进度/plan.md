# 实时字幕同步显示进度 - 详细规划

## 📋 执行清单（按顺序执行）

### 第一步：基础组件和 Hook 搭建

- [x] **任务 1.1：创建 SyncedText 组件** (`components/synced-text.tsx`) ✅ 已完成
  - [x] 新建文件 `components/synced-text.tsx`
  - [x] 定义 `SyncedTextProps` 接口
  - [x] 实现核心逻辑：
    - 计算 `charIndex = Math.floor(text.length * progress)`
    - 分割文本为 `played` 和 `unplayed`
    - 用两个 `<span>` 分别渲染，颜色不同
  - [x] 用 `React.memo` 包装以优化性能
  - [x] 导出组件

- [x] **任务 1.2：扩展 useSpeechSynthesis hook** (`hooks/use-speech-synthesis.ts`) ✅ 已完成
  - [x] 添加新状态：
    - `elapsedTime: number` - 当前已播放时间
    - `estimatedDuration: number` - 估计总时长
  - [x] 在 `speak()` 中计算 `estimatedDuration`：
    - 公式：`charCount / (10 * rate)` （每秒 10 个字符）
  - [x] 实现时间更新机制（`requestAnimationFrame`）
  - [x] 在 `pause()` 时停止时间更新
  - [x] 在 `resume()` 时继续时间更新
  - [x] 在 `stop()` 中重置 `elapsedTime = 0` ⭐
  - [x] 计算 `progress = Math.min(elapsedTime / estimatedDuration, 1)`
  - [x] 返回：`{ ..., elapsedTime, estimatedDuration, progress }`

### 第二步：修改现有组件

- [x] **任务 2.1：修改 AudioPlayer 组件** (`components/audio-player.tsx`) ✅ 已完成
  - [x] 添加进度状态：`const [progress, setProgress] = useState(0)`
  - [x] 添加 `timeupdate` 事件处理：
    ```typescript
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        const p = audioRef.current.currentTime / audioRef.current.duration
        setProgress(p || 0)
      }
    }
    ```
  - [x] 在 `<audio>` 元素上绑定 `onTimeUpdate={handleTimeUpdate}`
  - [x] 添加 `onEnded` 事件处理，当播放完毕时重置进度 ⭐
  - [x] 如有必要，传递 `progress` 给父组件通过 callback

- [x] **任务 2.2：修改 ArticleClient 组件** (`app/article/[article]/page.client.tsx`) ✅ 已完成
  - [x] 导入 `SyncedText` 组件

  **Listening Mode 改进：**
  - [x] 添加进度状态：`const [listeningProgress, setListeningProgress] = useState(0)`
  - [x] 修改 `AudioPlayer` 调用，添加进度回调
  - [x] 用 `SyncedText` 替换中文翻译的静态文本
  - [x] 用 `SyncedText` 替换英文原文的静态文本
  - [x] 测试停止时进度重置 ⭐

  **Reading Mode 改进：**
  - [x] 从 hook 获取：`const { speak, progress, isPlaying, pause, resume, stop } = useSpeechSynthesis({ rate })`
  - [x] 用 `SyncedText` 替换英文文本
  - [x] 用 `SyncedText` 替换中文翻译
  - [x] 测试停止时颜色重置 ⭐

  **Memory Mode 改进：**
  - [x] 获取当前句子：`const currentSentence = article.sentences[currentSentenceIndex]`
  - [x] 用 `SyncedText` 替换英文句子
  - [x] 用 `SyncedText` 替换中文翻译
  - [x] 测试停止时进度重置 ⭐

### 第三步：测试和验证

- [ ] **任务 3.1：功能测试**
  - [ ] Listening Mode：
    - [ ] 播放时文本颜色实时变化
    - [ ] 进度条准确
    - [ ] 暂停时进度固定
    - [ ] 恢复时继续更新
    - [ ] **停止时文本全部回到灰色** ⭐

  - [ ] Reading Mode：
    - [ ] 播放时英文和中文都同步变色
    - [ ] 估算时长合理
    - [ ] **停止时全部回到灰色** ⭐

  - [ ] Memory Mode：
    - [ ] 句子内的进度同步显示
    - [ ] 切换句子时进度重置
    - [ ] **停止时文本回到灰色** ⭐

- [ ] **任务 3.2：边界情况测试**
  - [ ] 快速播放速度（2x）下是否准确
  - [ ] 超长文本是否流畅
  - [ ] 快速切换模式是否有遗留状态
  - [ ] 浏览器开发者工具检查是否有警告

- [ ] **任务 3.3：视觉检查**
  - [ ] 颜色对比度是否足够
  - [ ] 移动设备上是否响应式
  - [ ] 不同长度的句子是否都适用

---

## 待办清单（执行阶段用）

- [ ] **阶段 1：创建 SyncedText 组件**
  - [ ] 创建 `components/synced-text.tsx`
  - [ ] 实现基于进度的颜色分割逻辑
  - [ ] 支持自定义已播放/待播放颜色

- [ ] **阶段 2：扩展 useSpeechSynthesis hook**
  - [ ] 添加 `elapsedTime` 和 `estimatedDuration` 状态
  - [ ] 添加 `currentCharIndex` 计算逻辑
  - [ ] 实现时间更新机制（requestAnimationFrame）

- [ ] **阶段 3：修改 AudioPlayer 组件**
  - [ ] 添加 `timeupdate` 事件监听
  - [ ] 集成 SyncedText 组件
  - [ ] 高亮中英文文本

- [ ] **阶段 4：修改 ArticleClient**
  - [ ] Listening Mode：集成新的 AudioPlayer
  - [ ] Reading Mode：集成 SyncedText + 扩展的 hook
  - [ ] Memory Mode：改进句子级同步

- [ ] **阶段 5：测试和验证**
  - [ ] 测试各模式的文本同步
  - [ ] 验证暂停/恢复时的进度
  - [ ] 验证不同播放速度下的表现
  - [ ] **验证停止时进度和颜色重置为初始状态** ⭐ 用户需求

---

## 重置逻辑详细说明

### 停止时的重置行为

**当用户点击"停止"按钮时，应该发生：**

1. **Hook 层面** (`useSpeechSynthesis`)
   - `elapsedTime` 重置为 `0`
   - `estimatedDuration` 保持（用于下次播放计算）
   - `progress` 计算为 `0 / estimatedDuration = 0`
   - `isPlaying` → `false`
   - `isPaused` → `false`

2. **组件层面** (`ArticleClient` / `AudioPlayer`)
   - `progress` state 同步重置为 `0`
   - 所有 `SyncedText` 组件显示文本全部为 `unplayedColor`（灰色）

3. **HTML5 Audio 层面** (`AudioPlayer`)
   - 调用 `audioRef.current.currentTime = 0`
   - 调用 `audioRef.current.pause()`

### 代码层面的实现

**在 `useSpeechSynthesis` 的 `stop()` 方法中：**
```typescript
const stop = useCallback(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setElapsedTime(0)  // ← 新增：重置时间
  }
}, [])
```

**在 `AudioPlayer` 的停止逻辑中：**
```typescript
const handleStop = () => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0  // ← 重置音频位置
    audioRef.current.pause()
  }
  setProgress(0)  // ← 重置进度状态
}
```

**在 `ArticleClient` 中：**
```typescript
const handleStop = () => {
  stop()  // 调用 hook 的 stop
  setProgress(0)  // 确保组件级进度也重置
}
```

### 用户体验流程

```
用户点击"停止"
    ↓
所有播放状态清零（elapsedTime=0, progress=0）
    ↓
文本颜色全部回到灰色（全部待播放状态）
    ↓
下次点击"播放"时从 0 开始
```

### 边界情况处理

- **播放中停止**：正常重置
- **暂停状态下停止**：重置 `isPaused` 和 `elapsedTime`
- **已播放完整个文本后停止**：重置为开始位置

---

## 详细实现方案

### 方案概述

**核心理念：** 通过进度百分比计算当前播放的字符索引，动态生成带颜色的文本渲染

```
播放时间 currentTime
       ↓
计算进度百分比 progress = currentTime / totalDuration
       ↓
计算字符索引 charIndex = (progress) * textLength
       ↓
按索引分割文本：已播放部分 + 待播放部分
       ↓
已播放部分：紫色/蓝色（example: text-purple-900）
待播放部分：灰色（example: text-gray-600）
```

---

### 阶段 1：创建 SyncedText 组件

**文件路径：** `components/synced-text.tsx`

**职责：** 渲染带进度的文本，根据 `progress` 比例分割颜色

**Props 接口：**
```typescript
interface SyncedTextProps {
  text: string           // 要渲染的文本
  progress: number       // 0-1 之间的进度比例
  playedColor?: string   // 已播放部分的 Tailwind 类名（默认: text-purple-900）
  unplayedColor?: string // 待播放部分的 Tailwind 类名（默认: text-gray-600）
  className?: string     // 整个文本的容器类名
}
```

**核心逻辑：**
```typescript
// 计算已播放的字符索引
const charIndex = Math.floor(text.length * progress)

// 分割：已播放 + 待播放
const played = text.substring(0, charIndex)
const unplayed = text.substring(charIndex)

// 渲染为两个 <span>，颜色不同
```

**实现要点：**
- 处理边界情况（progress = 0 或 1）
- 保留原文本的换行符和空格
- 性能：避免频繁重新计算，用 React.memo 优化

---

### 阶段 2：扩展 useSpeechSynthesis hook

**文件路径：** `hooks/use-speech-synthesis.ts`

**新增状态：**
```typescript
interface UseSpeechSynthesisState {
  isPlaying: boolean
  isPaused: boolean
  elapsedTime: number      // 当前已播放时间（秒）
  estimatedDuration: number // 估计总时长（秒）
  progress: number          // 0-1 的进度比例（计算值）
}
```

**新增逻辑：**

1. **计算估计时长**
   ```
   // 基于文本长度和播放速率估算
   const charCount = text.length
   const avgCharsPerSecond = 10 * rate  // 调整系数（每秒读 10 个字符）
   estimatedDuration = charCount / avgCharsPerSecond
   ```

2. **时间更新机制**
   ```typescript
   // 在 speak() 中启动
   useEffect(() => {
     if (!isPlaying || isPaused) return

     const intervalId = setInterval(() => {
       setElapsedTime(prev => prev + 0.016) // ~60fps
     }, 16)

     return () => clearInterval(intervalId)
   }, [isPlaying, isPaused])

   // 播放结束时重置
   utterance.onend = () => {
     setElapsedTime(0)
     setIsPlaying(false)
   }
   ```

3. **暂停时的处理**
   ```typescript
   const pause = () => {
     // elapsedTime 保持不变，不继续增长
   }

   const resume = () => {
     // 继续增长 elapsedTime
   }
   ```

4. **计算 progress**
   ```typescript
   const progress = Math.min(elapsedTime / estimatedDuration, 1)
   ```

**返回值更新：**
```typescript
return {
  speak,
  stop,
  pause,
  resume,
  isPlaying,
  isPaused,
  elapsedTime,      // 新增
  estimatedDuration, // 新增
  progress           // 新增
}
```

**关键注意：**
- `estimatedDuration` 在 `speak()` 调用时计算，需要传入文本
- 当用户改变 `rate` 时，需要重新计算 `estimatedDuration`（可选优化）
- 暂停/恢复时保持 `elapsedTime` 的连贯性

---

### 阶段 3：修改 AudioPlayer 组件

**文件路径：** `components/audio-player.tsx`

**修改内容：**

1. **添加进度状态**
   ```typescript
   const [progress, setProgress] = useState(0)
   ```

2. **监听 timeupdate 事件**
   ```typescript
   const handleTimeUpdate = () => {
     if (audioRef.current) {
       const { currentTime, duration } = audioRef.current
       const p = duration ? currentTime / duration : 0
       setProgress(p)
     }
   }

   // 绑定事件
   <audio
     ref={audioRef}
     src={audioPath}
     onTimeUpdate={handleTimeUpdate}
     controls
   />
   ```

3. **修改 listening mode 的渲染**
   - 用 `SyncedText` 替换静态文本
   - 英文和中文都应该显示进度

4. **对于无 audioPath 的情况**
   - 保持现有逻辑（使用 SpeechSynthesis）
   - 可选：集成 hook 返回的 `progress` 来同步

---

### 阶段 4：修改 ArticleClient

**文件路径：** `app/article/[article]/page.client.tsx`

#### Listening Mode 修改

**当前状态：**
```typescript
const renderListeningMode = () => (
  <AudioPlayer audioPath={article.audioPath} text={article.english} ... />
  <Card>中文翻译: {article.chinese}</Card>
  <Card>英文原文: {article.english}</Card>
)
```

**修改为：**
```typescript
const [progress, setProgress] = useState(0)

const renderListeningMode = () => (
  <AudioPlayer
    audioPath={article.audioPath}
    text={article.english}
    onProgress={setProgress}  // 新增回调
    ...
  />

  <Card>
    <CardTitle>中文翻译</CardTitle>
    <SyncedText
      text={article.chinese}
      progress={progress}
      playedColor="text-purple-900"
      unplayedColor="text-gray-600"
    />
  </Card>

  <Card>
    <CardTitle>英文原文</CardTitle>
    <SyncedText
      text={article.english}
      progress={progress}
      playedColor="text-purple-900"
      unplayedColor="text-gray-600"
    />
  </Card>
)
```

#### Reading Mode 修改

**当前状态：**
```typescript
<Button onClick={() => speak(article.english)}>播放音频</Button>
<p>{article.english}</p>
<p>{article.chinese}</p>
```

**修改为：**
```typescript
const { speak, progress, isPlaying, ... } = useSpeechSynthesis({ rate })

const renderReadingMode = () => (
  <Card>
    <Button onClick={...}>播放</Button>
    <SyncedText
      text={article.english}
      progress={progress}
      playedColor="text-blue-900"
      unplayedColor="text-gray-700"
    />
  </Card>

  <Card>
    <SyncedText
      text={article.chinese}
      progress={progress}
      playedColor="text-blue-900"
      unplayedColor="text-gray-700"
    />
  </Card>
)
```

#### Memory Mode 修改

**当前实现问题：** 只显示一句，已经有播放/暂停，但没有句子内进度

**改进方案：**
```typescript
const currentSentence = article.sentences[currentSentenceIndex]
const { speak, progress, isPlaying, ... } = useSpeechSynthesis({ rate })

const renderMemoryMode = () => (
  <Card>
    <div>
      <SyncedText
        text={currentSentence.english}
        progress={progress}
        playedColor="text-purple-900"
        unplayedColor="text-purple-400"
        className="text-2xl font-semibold"
      />
    </div>

    <div>播放/暂停/停止按钮...</div>

    {showEnglish && (
      <SyncedText
        text={currentSentence.chinese}
        progress={progress}
        playedColor="text-purple-900"
        unplayedColor="text-gray-600"
      />
    )}
  </Card>
)
```

---

### 阶段 5：颜色方案设定

**推荐颜色搭配：**

| 模式 | 已播放 | 待播放 | 说明 |
|------|-------|-------|------|
| Listening | text-purple-900 | text-gray-600 | 深紫/灰，对比度好 |
| Reading | text-blue-900 | text-gray-700 | 深蓝/灰 |
| Memory | text-purple-900 | text-purple-400 | 深紫/浅紫 |

**使用 Tailwind 的标准颜色**，无需添加自定义 CSS。

---

## 技术细节

### 性能考虑

1. **SyncedText 组件**
   - 用 `React.memo` 包装
   - 只在 `text` 或 `progress` 变化时重新计算
   - 避免在渲染时创建新的对象/函数

2. **时间更新频率**
   - 使用 `requestAnimationFrame`（而不是 `setInterval`）以适应屏幕刷新率
   - 或保持 16ms 的 interval（60fps）

3. **Hook 优化**
   - `elapsedTime` 更新频率高，用 `useRef` 缓存避免过多渲染
   - 或用 `useCallback` 稳定函数引用

### 浏览器兼容性

- **HTML5 Audio**：所有现代浏览器都支持 ✅
- **Web Speech API**：所有现代浏览器都支持（虽然实现有差异）✅
- **requestAnimationFrame**：所有现代浏览器都支持 ✅

### 边界情况处理

1. **进度 = 0**：所有文本为 unplayed 颜色 ✅ 初始状态和停止后
2. **进度 = 1**：所有文本为 played 颜色
3. **暂停状态**：进度固定，不更新
4. **快速切换模式**：需要重置进度和时间状态
5. **停止时重置** ⭐ **新增：确保 progress 和 elapsedTime 都回到 0，文本全部为待播放颜色**

---

## 修改文件清单

| 文件 | 修改类型 | 优先级 |
|------|---------|-------|
| `components/synced-text.tsx` | 新建 | ⭐⭐⭐ |
| `hooks/use-speech-synthesis.ts` | 扩展 | ⭐⭐⭐ |
| `components/audio-player.tsx` | 修改 | ⭐⭐⭐ |
| `app/article/[article]/page.client.tsx` | 修改 | ⭐⭐⭐ |

---

## 权衡与假设

### 优点
✅ 用户能清晰看到播放进度，不需要时间条
✅ 两种播放方式都支持
✅ 不修改数据结构，无需迁移
✅ 纯前端实现，性能好

### 限制
⚠️ Web Speech API 的时长估算可能不精确（某些句子短，某些长）
⚠️ 快速播放速率下，估算误差可能更明显
⚠️ 暂停后恢复时，时间计算可能有偏差

### 后续优化机会
- 如果用户反馈估算不够精确，可以：
  1. 手动校准 `avgCharsPerSecond` 系数
  2. 根据语言特性调整（中文/英文的字速不同）
  3. 使用更精细的 NLP 来估算单词级别的边界

---

## 实现示例代码片段

### SyncedText 组件核心逻辑
```typescript
export const SyncedText = React.memo(({
  text,
  progress,
  playedColor = 'text-purple-900',
  unplayedColor = 'text-gray-600',
  className = ''
}: SyncedTextProps) => {
  const charIndex = Math.floor(text.length * Math.min(Math.max(progress, 0), 1))
  const played = text.substring(0, charIndex)
  const unplayed = text.substring(charIndex)

  return (
    <p className={`${className} leading-relaxed`}>
      <span className={playedColor}>{played}</span>
      <span className={unplayedColor}>{unplayed}</span>
    </p>
  )
})
```

### useSpeechSynthesis 时间更新
```typescript
useEffect(() => {
  if (!isPlaying || isPaused) return

  const startTime = Date.now() - (elapsedTime * 1000)
  const rafId = requestAnimationFrame(function update() {
    const elapsed = (Date.now() - startTime) / 1000
    setElapsedTime(elapsed)
    requestAnimationFrame(update)
  })

  return () => cancelAnimationFrame(rafId)
}, [isPlaying, isPaused])
```

### 停止时的重置（新增示例代码）

**在 Hook 中：**
```typescript
const stop = useCallback(() => {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel()
    setIsPlaying(false)
    setIsPaused(false)
    setElapsedTime(0)  // ← 重置时间为 0
  }
}, [])

// 返回的 progress 自动计算为 0
// const progress = Math.min(elapsedTime / estimatedDuration, 1) = 0 / x = 0
```

**在 ArticleClient 中调用停止：**
```typescript
const handleStop = () => {
  stop()              // 调用 hook 的 stop，会重置 elapsedTime
  setProgress(0)      // 同时重置组件级的 progress state
}

// 使用：
<Button onClick={handleStop}>停止</Button>

// 结果：所有 SyncedText 组件的 progress = 0
// 所有文本显示为 unplayedColor（全灰色）
```

**在 AudioPlayer 中（HTML5 Audio）：**
```typescript
const handleStop = () => {
  if (audioRef.current) {
    audioRef.current.currentTime = 0    // 重置音频位置
    audioRef.current.pause()            // 暂停播放
  }
  setProgress(0)                         // 重置进度显示
}
```

---

## 下一步

等待您的批注和确认。特别关注：
- [ ] 颜色方案是否满意
- [ ] 是否需要调整时长估算的逻辑
- [ ] 是否需要在特定模式中有不同的表现
- [ ] **停止时的重置逻辑是否完整（确保 progress 和颜色都重置）** ⭐ 新增
- [ ] 是否有其他 UI 细节需要调整
