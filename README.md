# Bogʻbon: hamma uchun ochiq versiya

Bu papka tayyor sayt. Uni internetga qoʻyganingizda **hisobsiz, har kim** telefon yoki kompyuterdan ochib, oʻsimlikni skaner qila oladi.
Skaner xarajati **sizning Anthropic API hisobingizdan** chiqadi (foydalanuvchilardan emas).

## Papka tarkibi
- `index.html` — sayt (dizayn, bazalar, soʻrov oynasi)
- `api/scan.js` — server funksiyasi (API kalit shu yerda yashirin ishlatiladi)
- `lib/prompt.js` — Claude uchun koʻrsatmalar va baza (Shelkovo, oʻgʻitlar, NPK)
- `vercel.json`, `package.json` — sozlamalar

## 1-qadam. API kalit olish
1. https://console.anthropic.com ga kiring va roʻyxatdan oʻting (Oʻzbekiston Anthropic qoʻllab-quvvatlaydigan davlatlar roʻyxatida bor).
2. Toʻlov kartasini ulang (xalqaro Visa/Mastercard kerak boʻlishi mumkin, mahalliy kartalar qabul qilinishini oldindan tekshiring).
3. **Oylik xarajat limitini** oʻrnating. Bu juda muhim: kutilmagan xarajatdan saqlaydi.
4. "API keys" boʻlimida kalit yarating va nusxalab saqlang. U faqat bir marta koʻrinadi. Hech kimga bermang va saytga yozmang.

## 2-qadam. Fayllarni GitHub'ga yuklash
1. https://github.com da hisob oching va yangi repozitoriy yarating (**Private** tanlang).
2. "uploading an existing file" havolasini bosing.
3. Shu papkadagi **hamma narsani** (`api` va `lib` papkalari, `index.html`, `vercel.json`, `package.json`) sudrab tashlang va "Commit changes" bosing.

## 3-qadam. Vercel'ga joylash
1. https://vercel.com ga GitHub hisobingiz bilan kiring.
2. "Add New" → "Project" → repozitoriyingizni tanlang → "Import".
3. **Environment Variables** boʻlimida qoʻshing:
   - Nomi: `ANTHROPIC_API_KEY`, qiymati: 1-qadamdagi kalit
4. "Deploy" bosing. 1–2 daqiqadan soʻng `https://loyiha-nomi.vercel.app` koʻrinishidagi **ochiq havola** tayyor boʻladi.

## 4-qadam. Domen ulash (ixtiyoriy)
1. Domenni registratordan sotib oling (`.uz` uchun Oʻzbekistondagi akkreditatsiyalangan registratorlar).
2. Vercel loyihasida **Settings → Domains** ga domeningizni yozing.
3. Vercel koʻrsatgan DNS yozuvlarini registrator panelida kiriting. HTTPS avtomatik yoqiladi.

## Qoʻshimcha sozlamalar (Environment Variables)
| Nomi | Maʼnosi | Standart |
|---|---|---|
| `HOURLY_LIMIT` | Bitta IP manzildan soatiga nechta skaner | 12 |
| `CLAUDE_MODEL` | Ishlatiladigan model | `claude-sonnet-5-5` |

Sozlamani oʻzgartirgach, Vercel'da loyihani qayta "Redeploy" qiling.

## Bilib qoʻying
- Soatlik limit serverning xotirasida hisoblanadi va taxminiy ishlaydi. Asosiy himoya: Anthropic panelidagi **xarajat limiti**.
- Har bir skaner API hisobingizdan pul sarflaydi. Narxni Anthropic narxlar sahifasidan tekshiring va xarajatni panelda kuzating.
- Server funksiyasi 60 soniyagacha ishlashga sozlangan. Vercel tarifingiz bunday davomiylikni qoʻllamasa, tarif cheklovlarini tekshiring.
- Natija taxminiy: ishonchli tashxis uchun agronom (Javlon Kamolov) yoki laboratoriya kerak.
- Saytda foydalanuvchiga "suratlar Anthropic (Claude) xizmatiga yuboriladi" deb yozilgan. Agar maxfiylik siyosatingiz boʻlsa, qoʻshib qoʻying.

## Muammo boʻlsa
- Sahifada "Xizmat hali sozlanmagan" chiqsa: `ANTHROPIC_API_KEY` kiritilmagan yoki Deploy qayta qilinmagan.
- Skaner xato bersa: Vercel → loyiha → **Logs** boʻlimida sababni koʻrasiz (kalit, balans yoki model nomi).
