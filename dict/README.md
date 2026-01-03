# Kuromoji 字典檔案

此目錄包含 Kuromoji 日文形態素分析器所需的字典檔案。

## 檔案列表

- `base.dat.gz` - 基礎字典檔案
- `check.dat.gz` - 檢查檔案
- `tid.dat.gz` - 詞 ID 檔案
- `tid_pos.dat.gz` - 詞性標記檔案
- `tid_map.dat.gz` - 詞 ID 映射檔案
- `unk.dat.gz` - 未知詞檔案
- `unk_pos.dat.gz` - 未知詞詞性檔案
- `unk_map.dat.gz` - 未知詞映射檔案
- `unk_char.dat.gz` - 未知詞字符檔案
- `unk_compat.dat.gz` - 未知詞兼容性檔案
- `unk_invoke.dat.gz` - 未知詞調用檔案
- `char.dat.gz` - 字符檔案
- `connection.dat.gz` - 連接檔案

## 總大小

約 15MB（壓縮後）

## 來源

這些檔案來自 Kuromoji npm 包 v0.1.2：
https://www.npmjs.com/package/kuromoji

## 為什麼使用本地字典？

使用本地字典檔案有以下優點：

1. **更快的載入速度** - 從 GitHub Pages 載入比從外部 CDN 快
2. **更高的可靠性** - 不依賴第三方 CDN 的可用性
3. **離線支援** - 如果 GitHub Pages 被緩存，可以離線使用
4. **避免 CORS 問題** - 不需要擔心跨域請求限制

## 更新字典

如需更新到新版本的 Kuromoji 字典，執行以下命令：

```bash
# 下載最新版本字典檔案
curl -L -o base.dat.gz https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/base.dat.gz
curl -L -o check.dat.gz https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/check.dat.gz
# ... 下載其他檔案
```

或使用提供的下載腳本（如果有）。
