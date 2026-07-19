// So đáp án quiz theo hướng "bỏ qua tiểu tiết":
// - bỏ mọi ký hiệu trang trí (～ 。 、 ？ / khoảng trắng...), chỉ giữ kana + kanji
// - KHÔNG quy đổi katakana ↔ hiragana: từ gốc katakana phải gõ katakana (てーぷ ≠ テープ)
// - "A / B" trong DB → chấp nhận A hoặc B
// - ngoặc tròn （B） = cách gọi khác → chấp nhận dạng không ngoặc hoặc riêng B
// - ngoặc vuông [B] = phần tùy chọn → chấp nhận cả dạng có và không có B
// - ngoặc vuông chứa ～ là chú thích ngữ cảnh, ～ đánh dấu vị trí từ chính:
//   とります [しゃしんを～] → chấp nhận とります hoặc しゃしんをとります

const NON_KANA_KANJI = /[^ぁ-ゖァ-ヺー一-鿿㐀-䶿]/g

function normalize(str) {
  return String(str || '').replace(NON_KANA_KANJI, '')
}

// fallback cho đáp án chứa chữ latin/số (vd ＣＤ): full-width → ASCII, thường hóa
function normalizeLatin(str) {
  return String(str || '')
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

const SQUARE = /[[［]([^\]］]*)[\]］]/ // [tùy chọn]
const ROUND = /[(（]([^)）]*)[)）]/ // （biến thể）

// Sinh mọi dạng chấp nhận được từ chuỗi đáp án gốc trong DB.
// "[カセット]テープ" → カセットテープ, テープ
// "だれ（どなた）"   → だれ, どなた
// "～ふん / ～ぷん"  → ふん, ぷん
function expandVariants(raw) {
  // chuỗi chứa chữ số hoặc chữ latin (２、３にち, IPSさいぼう…) không kana-hóa
  // trung thực được — bỏ qua, để nhánh reading kana sạch quyết định
  if (/[0-9０-９a-zA-ZＡ-Ｚａ-ｚ]/.test(String(raw || ''))) return []
  const expand = (v) => {
    const sq = v.match(SQUARE)
    if (sq) {
      const inner = sq[1]
      if (/[～〜]/.test(inner)) {
        // chú thích ngữ cảnh chứa ～/〜, sinh 3 dạng:
        // - riêng từ chính:        とります [しゃしんを～] → とります
        // - thế từ chính vào ～:   とります [しゃしんを～] → しゃしんをとります
        // - giữ vị trí, bỏ ～:     [〜を]ください          → をください
        const base = v.replace(sq[0], '').trim()
        return [
          ...expand(base),
          ...expand(inner.replace(/[～〜]/, base)),
          ...expand(v.replace(sq[0], inner.replace(/[～〜]/g, ''))),
        ]
      }
      return [...expand(v.replace(sq[0], sq[1])), ...expand(v.replace(sq[0], ''))]
    }
    const rd = v.match(ROUND)
    if (rd) return [...expand(v.replace(rd[0], '')), ...expand(rd[1])]
    return [v]
  }
  const variants = String(raw || '')
    .split(/[/／]/)
    .flatMap(expand)
  return [...new Set(variants.map(normalize).filter(Boolean))]
}

// dbAnswers: một hoặc nhiều dạng đáp án của cùng một từ (vd word có ngoặc + reading sạch)
function isCorrectAnswer(userInput, ...dbAnswers) {
  const input = normalize(userInput)
  if (input && dbAnswers.some((ans) => expandVariants(ans).includes(input))) return true
  // fallback latin: đáp án kiểu ＣＤ → gõ "CD"/"ｃｄ" vẫn đúng
  const latin = normalizeLatin(userInput)
  return !!latin && dbAnswers.some((ans) => normalizeLatin(ans) === latin)
}

module.exports = { isCorrectAnswer, expandVariants, normalize, normalizeLatin }
