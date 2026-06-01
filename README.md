# Kana Quiz

Popup nhỏ xuất hiện mỗi 2 phút, hiển thị nghĩa tiếng Việt — bạn điền kana. Từ trả lời đúng nhiều lần sẽ xuất hiện ít hơn; từ sai hoặc nhấn "Chưa biết" sẽ được ưu tiên ôn lại.

## Prerequisites

- Node.js 18+
- Linux: cài `libappindicator3-1` nếu tray icon không hiện
  ```
  sudo apt install libappindicator3-1
  ```
- Japanese IME là **optional** — app tích hợp sẵn `wanakana` để chuyển romaji → kana khi gõ

## Run

```bash
npm install
npm start
```

## Build

```bash
npm run build
# Windows: dist/*.exe
# Linux: dist/*.AppImage
```

## Thêm từ vựng

Chỉnh sửa `src/words.json`. Mỗi entry gồm `id` (unique), `kana` (đáp án), và `meaning` (gợi ý hiển thị):

```json
[
  { "id": 1, "kana": "これ", "meaning": "Cái này, đây" },
  { "id": 2, "kana": "それ", "meaning": "Cái đó, đó" },
  { "id": 3, "kana": "ノート", "meaning": "Vở" },
  { "id": 4, "kana": "エレベーター", "meaning": "Thang máy" }
]
```

- `kana`: có thể là hiragana, katakana, hoặc romaji — app chấp nhận cả ba khi trả lời
- `id`: không được trùng, tăng dần là đủ

## Notes

- Linux Wayland: cần XWayland hoặc GNOME AppIndicator extension để tray hoạt động
- Progress reset khi restart app (phase 1 — phase 2 sẽ thêm DB)
- Right-click tray icon → "Quiz ngay" để hiện popup ngay lập tức
