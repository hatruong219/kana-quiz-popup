# Kana Quiz Popup

> Học kana tiếng Nhật mỗi vài phút — không cần mở app, không cần nhớ học.

Một popup nhỏ tự hiện lên định kỳ trong lúc bạn làm việc. Hiển thị nghĩa tiếng Việt, bạn gõ kana. Từ nào sai nhiều sẽ xuất hiện thường xuyên hơn; từ nào thuộc rồi sẽ dần biến mất.

---

## Tính năng

- **Popup tự động** — hiện mỗi N phút (mặc định 1.5 phút), không làm gián đoạn workflow
- **Weighted random** — từ sai được ưu tiên ôn lại, từ đúng nhiều lần ít xuất hiện hơn
- **Chọn bài** — lọc từ vựng theo từng bài học từ remote API
- **Cài đặt linh hoạt** — chỉnh khoảng cách quiz, thời gian đóng popup sau khi trả lời
- **Tray icon** — chạy ngầm, tạm dừng/tiếp tục bất cứ lúc nào, trigger quiz ngay
- **Fallback offline** — tự dùng `words.json` local nếu không có mạng
- **Cross-platform** — Linux (AppImage, .deb) và Windows (.exe)

---

## Cài đặt

Tải bản mới nhất tại [Releases](https://github.com/hatruong219/kana-quiz-popup/releases/latest):

| Platform | File |
|---|---|
| Linux | `kana-quiz-*.AppImage` hoặc `kana-quiz-*.deb` |
| Windows | `kana-quiz-*-setup.exe` |

**Linux — yêu cầu thêm:**

```bash
# Nếu tray icon không hiện
sudo apt install libappindicator3-1

# Wayland: cần XWayland hoặc GNOME AppIndicator extension
```

Cần cài **Japanese IME** (ibus-mozc hoặc fcitx-mozc) để gõ được kana.

---

## Cách dùng

App chạy ngầm sau khi khởi động. Sau mỗi khoảng thời gian cài đặt, một popup nhỏ hiện lên:

```
┌──────────────────────────────────┐
│  Thang máy                       │
│                                  │
│  [エレベーター        ] [Gửi]    │
│                                  │
│              [Chưa biết]         │
└──────────────────────────────────┘
```

- **Đúng** → popup tự đóng sau 1.5 giây, từ đó giảm dần độ ưu tiên
- **Sai** → hiện đáp án đúng, popup đóng sau 60 giây để bạn ghi nhớ
- **Chưa biết** → tương đương sai, từ sẽ được ưu tiên ôn lại

**Right-click tray icon** để truy cập nhanh: tạm dừng, quiz ngay, chọn bài, cài đặt.

---

## Thuật toán lặp

Mỗi từ có **weight** được tính theo lịch sử:

```
weight = max(1, 10 + wrongCount × 3 − correctCount × 3)
```

Từ mới hoặc không có lịch sử → weight = 10. Trả lời đúng nhiều lần liên tiếp → weight giảm. Trả lời sai → weight tăng ngay, đảm bảo từ đó xuất hiện nhiều hơn trong thời gian tới.

---

## Chạy từ source

```bash
# Yêu cầu Node.js 18+
npm install
npm start
```

## Build

```bash
npm run build
# Linux  → dist/*.AppImage, dist/*.deb
# Windows → dist/*-setup.exe
```

---

## Từ vựng

Từ vựng được load từ remote API (`admin.truongha.com`). Nếu muốn dùng từ vựng local, chỉnh `src/words.json`:

```json
[
  { "id": 1, "kana": "これ",       "meaning": "Cái này, đây" },
  { "id": 2, "kana": "それ",       "meaning": "Cái đó, đó" },
  { "id": 3, "kana": "ノート",     "meaning": "Vở" },
  { "id": 4, "kana": "エレベーター", "meaning": "Thang máy" }
]
```

- `kana`: hiragana hoặc katakana — người dùng phải gõ đúng loại
- `id`: unique, không trùng nhau

---

## Tech stack

- [Electron](https://www.electronjs.org/) — desktop app framework
- Vanilla JS — không có framework frontend
- SQLite-free — state lưu in-memory, settings lưu file JSON local
