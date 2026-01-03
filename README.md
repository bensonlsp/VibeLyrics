# 日文解析器 📚

> 一個現代化的日文學習工具，提供智能文本解析、生字簿管理和互動式複習功能

## ✨ 功能特點

### 📝 智能日文解析
- **自動振假名標註**：使用 Kuromoji 形態素分析引擎自動為漢字添加讀音
- **平假名/片假名切換**：一鍵切換振假名顯示方式
- **即時查詢**：點擊任意單詞彈出詳細釋義對話框
- **多源字典整合**：結合 Jisho.org API 和內建基本字典

### 📖 生字簿系統
- **快速收藏**：一鍵將單詞加入個人生字簿
- **卡片翻轉**：互動式卡片設計，翻轉查看釋義
- **語音發音**：支援 Web Speech API 日文發音
- **本地存儲**：使用 localStorage 永久保存學習資料

### 🎴 閃卡複習遊戲
- **3D 翻轉動畫**：精美的閃卡翻轉效果
- **智能追蹤**：記錄每個單詞的複習次數和熟練度
- **進度可視化**：實時顯示複習進度條
- **自動建議移除**：達到 5 次熟練度後智能提示移除
- **彈性選擇**：「再看一次」或「記住了」兩種回饋選項

## 🛠️ 技術棧

- **前端框架**：原生 JavaScript (ES6+)
- **UI 框架**：Tailwind CSS
- **日文分析**：Kuromoji.js (形態素分析) - 使用本地字典檔案
- **API 整合**：Jisho.org Dictionary API
- **語音合成**：Web Speech API
- **數據存儲**：localStorage

## 📁 項目結構

```
VibeLyrics/
├── index.html          # 主頁面
├── debug.html          # 診斷工具頁面
├── css/
│   └── styles.css      # 樣式表
├── js/
│   ├── app.js          # 主要應用邏輯
│   └── dictionary.js   # 基本字典數據
├── dict/               # Kuromoji 字典檔案（約 15MB）
│   ├── base.dat.gz
│   ├── check.dat.gz
│   └── ... (共 13 個檔案)
├── TESTING.md          # 測試和調試指南
└── README.md           # 項目說明
```

## 🚀 快速開始

### 安裝使用

1. **克隆項目**
```bash
git clone <repository-url>
cd VibeLyrics
```

2. **直接開啟**
```bash
# 使用瀏覽器開啟 index.html
open index.html
```

或者使用本地服務器：
```bash
# Python 3
python -m http.server 8000

# Node.js (需安裝 http-server)
npx http-server
```

3. **訪問應用**
```
打開瀏覽器訪問 http://localhost:8000
```

### 使用說明

1. **解析日文**
   - 在文本框中貼上或輸入日文內容
   - 點擊「解析日文」按鈕
   - 系統自動添加振假名標註

2. **查詢單詞**
   - 點擊任意單詞
   - 彈出對話框顯示詳細資訊
   - 可查看讀音、詞性、釋義

3. **加入生字簿**
   - 在單詞詳情對話框中點擊「加入生字簿」
   - 單詞會被保存到右側生字簿
   - 可隨時翻轉卡片查看釋義

4. **開始複習**
   - 點擊「🎴 開始複習」按鈕
   - 使用閃卡模式複習單詞
   - 選擇「再看一次」或「記住了」
   - 系統自動追蹤學習進度

5. **掌握移除**
   - 當單詞熟練度達到 5 次時
   - 系統會在複習結束後提示
   - 確認後自動從生字簿移除

## 🎯 核心功能詳解

### 振假名切換
- 位於「已解析日文」區域右上角
- 支援平假名（ひらがな）和片假名（カタカナ）
- 即時切換，無需重新解析

### 學習進度追蹤
每個單詞記錄：
- **reviewCount**：總複習次數
- **masteryLevel**：熟練度等級
- **lastReviewed**：複習歷史（時間戳和結果）

### 智能移除機制
- 連續點擊「記住了」5 次達到熟練
- 複習結束後彈出確認對話框
- 列出所有已掌握單詞
- 用戶確認後批量移除

## 🎨 設計特色

- **極簡美學**：清爽的界面設計，專注學習體驗
- **響應式布局**：完美支援桌面和手機設備
- **流暢動畫**：3D 翻轉、淡入淡出等精美動效
- **色彩搭配**：漸層按鈕和卡片，視覺舒適

## 🌐 瀏覽器支援

- ✅ Chrome/Edge (推薦)
- ✅ Firefox
- ✅ Safari
- ⚠️ 需要支援 ES6+ 和 Web Speech API

## 📝 注意事項

1. **首次載入**：使用本地字典檔案（約 15MB），首次載入需要幾秒鐘，之後會被瀏覽器快取
2. **API 限制**：Jisho.org API 可能有速率限制，內建字典作為後備
3. **語音支援**：日文發音需要系統安裝日文語音包
4. **數據存儲**：使用 localStorage，清除瀏覽器數據會丟失生字簿
5. **線上版本**：https://bensonlsp.github.io/VibeLyrics/

## 🔧 技術細節

### Kuromoji 形態素分析
```javascript
// 使用本地字典檔案進行日文分詞（更快更可靠）
kuromoji.builder({
    dicPath: 'dict/'  // 使用本地字典檔案，避免依賴外部 CDN
}).build((err, tokenizer) => {
    const tokens = tokenizer.tokenize(text);
});
```

**為什麼使用本地字典？**
- ✅ 更快的載入速度（從 GitHub Pages 載入）
- ✅ 更高的可靠性（不依賴第三方 CDN）
- ✅ 避免 CORS 和網路問題
- ✅ 支援離線使用（如果被快取）

### 閃卡複習算法
- 「再看一次」：將卡片移到隊列末尾，確保重複複習
- 「記住了」：增加熟練度，記錄學習進度
- 達到閾值（5 次）時標記為已掌握

### 數據持久化
```javascript
// 保存到 localStorage
localStorage.setItem('vibelyrics_vocab', JSON.stringify(vocabularyData));

// 讀取數據
vocabularyData = JSON.parse(localStorage.getItem('vibelyrics_vocab') || '[]');
```

## 🤝 貢獻

歡迎提交 Issue 和 Pull Request！

### 開發流程
1. Fork 本項目
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📄 授權

本項目採用 MIT 授權條款

## 👨‍💻 作者

開發於 VibeCodingCamp

---

**🌟 如果這個項目對你有幫助，請給一個 Star！**
