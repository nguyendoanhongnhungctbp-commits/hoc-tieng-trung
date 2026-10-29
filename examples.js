// Câu ví dụ được lấy từ phần tử thứ 4 của mỗi từ trong data.js
const EXAMPLES = {};
for (const t of TOPICS) for (const p of t.parts) for (const w of p.words) if (w[3]) EXAMPLES[w[0]] = w[3];
