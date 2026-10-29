const $ = (s) => document.querySelector(s);
const app = $("#app");
const shuffle = (a) => [...a].sort(() => Math.random() - 0.5);
const pick = (a, n) => shuffle(a).slice(0, n);

// ---------- Trạng thái (lưu localStorage) ----------
const KEY = "chinese-app-v1";
let S = { xp: 0, streak: 0, lastDay: "", done: {}, showPinyin: true, learned: {}, cards: {}, talk: {} };
try { Object.assign(S, JSON.parse(localStorage.getItem(KEY) || "{}")); } catch (e) {}
const save = () => localStorage.setItem(KEY, JSON.stringify(S));
const today = () => new Date().toISOString().slice(0, 10);

// ---------- Phát âm ----------
const SVG = (inner) => `<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${inner}</svg>`;
const ICON = {
  spk: SVG('<path d="M11 5 6.5 9H3v6h3.5L11 19z" fill="currentColor"/><path d="M15 9a4 4 0 0 1 0 6"/><path d="M18 6a8 8 0 0 1 0 12"/>'),
  mic: SVG('<rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0"/><path d="M12 17.5V21"/>'),
  pen: SVG('<path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/><path d="M14 6l4 4"/>'),
  stop: SVG('<rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor"/>'),
  slow: '<span class="slowtxt">0.5×</span>',
};
// Giọng đọc: trong app Android dùng Text-to-Speech của máy (AndroidTTS), trên trình duyệt dùng speechSynthesis
let ttsSeq = 0, ttsLastWarn = 0; const ttsCb = {};
window.__ttsDone = (id) => { const f = ttsCb[id]; delete ttsCb[id]; if (f) f(); };
function ttsToast(st) {
  if (Date.now() - ttsLastWarn < 30000) return; ttsLastWarn = Date.now();
  const d = document.createElement("div"); d.className = "toast";
  d.innerHTML = st === "none" ? "🔇 Máy chưa có bộ đọc giọng nói. Bấm để mở cài đặt." : "🔇 Máy chưa có giọng đọc tiếng Trung. Bấm để cài giọng.";
  d.onclick = () => { try { AndroidTTS.openSettings(); } catch (e) {} d.remove(); };
  document.body.appendChild(d); setTimeout(() => d.remove(), 9000);
}
function nativeSpeak(text, rate, pitch, onend) {
  const st = AndroidTTS.status();
  if (st === "nodata" || st === "none") { ttsToast(st); if (onend) setTimeout(onend, 300); return; }
  const id = "u" + (++ttsSeq); if (onend) ttsCb[id] = onend;
  AndroidTTS.speak(text, rate, pitch, id);
}
function speak(text, rate = 0.8, onend) {
  if (window.AndroidTTS) return nativeSpeak(text, rate, 1.0, onend);
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN"; u.rate = rate;
  if (onend) u.onend = onend;
  speechSynthesis.speak(u);
}

// ---------- Ghi âm & chấm phát âm ----------
function listen(cb) {
  if (window.AndroidSpeech) {            // app Android: dùng bộ nhận diện giọng nói của máy
    window.__speechDone = (alts, err) => cb(alts && alts.length ? alts : null, err);
    AndroidSpeech.start();
    return;
  }
  if (!window.isSecureContext) return cb(null, "insecure");
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) return cb(null, "unsupported");
  try { window.speechSynthesis && speechSynthesis.cancel(); } catch (e) {}   // loa đang đọc sẽ làm micro bị ngắt (aborted)
  try { listen.cur && listen.cur.abort(); } catch (e) {}
  const run = (tries) => {
    const r = new SR(); listen.cur = r; let done = false, got = false;
    const fin = (alts, err) => { if (done) return; done = true; if (listen.cur === r) listen.cur = null; cb(alts, err); };
    r.lang = "zh-CN"; r.maxAlternatives = 3; r.interimResults = false; r.continuous = false;
    r.onresult = (e) => { got = true; fin([...e.results[0]].map((a) => a.transcript)); };
    r.onerror = (e) => {
      if (e.error === "aborted" && tries > 0 && !got) { done = true; return setTimeout(() => run(tries - 1), 350); }   // thử lại 1 lần
      fin(null, e.error);
    };
    r.onnomatch = () => fin(null, "no-speech");
    r.onend = () => fin(null, "no-speech");
    try { r.start(); } catch (e) { fin(null, "aborted"); }
  };
  setTimeout(() => run(1), 250);
}
// Ghi âm dự phòng: khi máy không có nhận diện giọng nói, ghi lại giọng bạn để nghe so với mẫu
const HELP = (err) => err === "aborted"
  ? "Trình duyệt trên máy này chưa cho nhận diện giọng nói liên tục (mã aborted). Tạm thời app ghi âm để bạn nghe lại so với mẫu."
  : /^language/.test(err || "")
  ? `Chưa chấm điểm được (mã ${err}): máy chưa có gói tiếng Trung cho nhận diện giọng nói. Vào Cài đặt → Ngôn ngữ & nhập liệu → Nhập liệu bằng giọng nói của Google → Ngôn ngữ → tải 中文. Tạm thời app ghi âm để bạn nghe lại.`
  : `Chưa chấm điểm được (mã ${err || "?"}): máy cần ứng dụng Google và "Dịch vụ giọng nói của Google" được bật. Tạm thời app ghi âm để bạn nghe lại.`;
const REC = {
  on: false, chunks: [], mr: null, url: null,
  async start() {
    if (window.AndroidRec) { AndroidRec.start(); this.on = true; return; }
    const st = await navigator.mediaDevices.getUserMedia({ audio: true });
    this.chunks = []; this.mr = new MediaRecorder(st);
    this.mr.ondataavailable = (e) => this.chunks.push(e.data);
    this.mr.onstop = () => { st.getTracks().forEach((t) => t.stop()); this.blob = new Blob(this.chunks, { type: this.mr.mimeType || "" }); this.url = URL.createObjectURL(this.blob); this.ready && this.ready(); };
    this.mr.start(); this.on = true;
  },
  stop(ready) {
    this.on = false; this.ready = ready;
    if (window.AndroidRec) { AndroidRec.stop(); ready(); } else this.mr.stop();
  },
  play() {
    if (window.AndroidRec) AndroidRec.play(); else if (this.url) new Audio(this.url).play();
  },
};
const han = (t) => t.replace(/[^\u4e00-\u9fff]/g, "");
// Mô hình AI hay trả chữ phồn thể (買, 錢...): đổi về giản thể trước khi so với câu mẫu
const T2S = (() => { const p = "裡里後后髮发幹干乾干隻只麵面瞭了係系繫系臺台檯台颱台製制準准鬆松鬥斗鬱郁籲吁著着佈布衹只萬万業业東东丟丢兩两嚴严個个為为麗丽麼么買买亂乱虧亏雲云產产從从們们價价優优會会傘伞傳传傷伤體体償偿兒儿兌兑關关興兴衝冲況况淨净涼凉幾几剛刚別别剎刹辦办務务動动醫医單单賣卖臥卧衛卫廳厅歷历厲厉廁厕廚厨參参雙双發发變变號号後后嗎吗聽听員员餵喂園园國国圖图場场壞坏塊块牆墙處处備备夠够頭头媽妈嬰婴學学寶宝實实宮宫賓宾對对導导嘗尝幣币師师帶带幫帮乾干廣广開开異异張张彎弯當当錄录戶户掃扫拋抛搶抢護护報报擔担掛挂擋挡損损換换據据攤摊舊旧時时曬晒暈晕暫暂機机條条來来櫃柜樣样橋桥檢检樓楼歡欢氣气匯汇湯汤沒没潔洁塗涂溫温濕湿滿满滅灭燈灯靈灵災灾點点煙烟煩烦燒烧熱热狀状現现電电盜盗著着碼码禮礼離离積积稱称竊窃築筑簽签緊紧紅红紀纪紙纸經经結结給给絡络統统續续維维綠绿網网罰罚聯联髒脏膩腻節节蘋苹薦荐藥药營营補补裝装見见觀观視视訂订讓让記记講讲設设證证詐诈訴诉診诊譯译試试話话誤误說说請请調调謝谢負负責责賬账貨货質质貴贵費费賠赔蹤踪車车轉转輪轮輛辆輸输邊边過过運运還还這这進进遠远違违連连遲迟適适鄰邻採采針针鈔钞鐘钟鑰钥錢钱鐵铁銀银鎖锁錯错錨锚鏡镜長长門门閃闪問问間间隊队陽阳陰阴際际險险難难霧雾靜静預预題题顏颜風风飛飞飯饭飲饮餃饺餓饿館馆馬马駕驾騎骑騙骗魚鱼鮮鲜雞鸡齊齐"; const m = {}; for (let i = 0; i < p.length; i += 2) m[p[i]] = p[i + 1]; return m; })();
const simp = (t) => t.replace(/[一-鿿]/g, (c) => T2S[c] || c);
let sttMod = null, aiDeclined = false;
const sttLoad = () => sttMod || (sttMod = import("./stt.js").catch((e) => { sttMod = null; throw e; }));
function showScore(res, zh, alts) {
  const sc = Math.max(...alts.map((a) => similarity(zh, a)));
  const pct = Math.round(sc * 100);
  const msg = pct >= 95 ? ["🌟 Tuyệt vời! Phát âm chuẩn", "#3c8a00"]
    : pct >= 60 ? ["👍 Gần đúng, cố thêm chút nữa", "#c78a00"] : ["❌ Chưa đúng, nghe mẫu rồi thử lại", "#c32b2b"];
  res.style.color = msg[1];
  res.innerHTML = `${msg[0]} <span class="score">(${pct}%)</span><br><span class="score">Máy nghe được: ${alts[0]}</span>`;
}
function similarity(target, heard) {      // LCS / độ dài câu mẫu
  const a = han(simp(target)), b = han(simp(heard));
  if (!a.length) return 0;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++)
    dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  return dp[a.length][b.length] / a.length;
}
const ERR = {
  "not-allowed": "🎤 Chưa được cấp quyền micro. Hãy cho phép micro rồi thử lại.",
  "no-speech": "🤔 Không nghe thấy giọng nói, hãy thử lại.",
  unsupported: "Thiết bị này chưa hỗ trợ nhận diện giọng nói.",
  network: "Cần kết nối mạng để nhận diện giọng nói.",
  insecure: "🎤 Trang đang chạy qua http nên trình duyệt chặn micro. Hãy dùng app Android (.apk) hoặc bản https để luyện nói.",
  denied: "Chưa được cấp quyền micro. Vào Cài đặt → Ứng dụng → 学中文 → Quyền → bật Micro.",
};
function practice(zh, py, vi) {
  return `<div class="prac" data-zh="${zh}"><div class="prac-t"><b>${zh}</b> <small>${S.showPinyin ? py : ""}</small>
    <button class="mini" data-say>${ICON.spk}</button><button class="mini rec" data-rec>${ICON.mic}</button></div>
    ${vi ? `<div class="prac-v">${vi}</div>` : ""}<div class="res"></div></div>`;
}
function bindPractice(root) {
  root.querySelectorAll(".prac").forEach((p) => {
    const zh = p.dataset.zh, rb = p.querySelector("[data-rec]"), res = p.querySelector(".res");
    p.querySelector("[data-say]").onclick = (ev) => { ev.stopPropagation(); speak(zh); };
    const slow = p.querySelector("[data-slow]");
    if (slow) slow.onclick = (ev) => { ev.stopPropagation(); speak(zh, 0.5); };
    const recordMode = async (why) => {        // chế độ ghi âm – nghe lại để so sánh
      try {
        if (!REC.on) {
          res.style.color = "";
          res.innerHTML = `🔴 Đang ghi âm... bấm ${ICON.stop} để dừng<br><span class="score">${why || ""}</span>`;
          rb.classList.add("on"); rb.innerHTML = ICON.stop;
          await REC.start();
        } else {
          rb.classList.remove("on"); rb.innerHTML = ICON.mic;
          REC.stop(() => {
            res.style.color = "#c78a00";
            res.innerHTML = "▶️ Nghe mẫu rồi nghe lại giọng bạn để so sánh";
            speak(zh, 0.8, () => setTimeout(() => REC.play(), 300));
          });
        }
      } catch (err) { REC.on = false; if (!window.isSecureContext && !window.AndroidRec) { res.style.color = "#c32b2b"; res.textContent = ERR.insecure; rb.classList.remove("on"); rb.innerHTML = ICON.mic; return; } rb.classList.remove("on"); rb.innerHTML = ICON.mic; res.style.color = "#c32b2b"; res.textContent = ERR.denied; }
    };
    let ai = false, aiTimer = null;
    const aiReset = () => { clearTimeout(aiTimer); rb.classList.remove("on"); rb.innerHTML = ICON.mic; };
    const aiStop = () => {
      ai = false; aiReset();
      REC.stop(async () => {
        res.style.color = ""; res.textContent = "⏳ Đang chấm điểm…";
        const files = {};
        try {
          const m = await sttLoad();
          const txt = await m.transcribe(REC.blob, (p) => {
            if (p.status === "progress" && p.total) {
              files[p.file] = [p.loaded, p.total]; const a = Object.values(files);
              const l = a.reduce((x, y) => x + y[0], 0), t = a.reduce((x, y) => x + y[1], 0);
              res.textContent = `⬇️ Đang tải mô hình AI (chỉ lần đầu) ${Math.round((100 * l) / t)}%`;
            } else if (p.status === "ready") res.textContent = "⏳ Đang chấm điểm…";
          });
          if (!han(simp(txt))) { res.style.color = "#c32b2b"; res.textContent = "🤔 Không nghe rõ giọng nói, hãy thử lại."; return; }
          showScore(res, zh, [txt]);
        } catch (e) {
          res.style.color = "#c32b2b";
          res.textContent = "Không tải được mô hình AI (lần đầu cần có mạng). Kiểm tra mạng rồi thử lại.";
        }
      });
    };
    const aiStart = async () => {
      ai = true; res.style.color = "";
      res.innerHTML = `🔴 Đang nghe... đọc to rồi bấm ${ICON.stop} để chấm điểm`;
      rb.classList.add("on"); rb.innerHTML = ICON.stop;
      try { await REC.start(); }
      catch (e) { ai = false; REC.on = false; aiReset(); res.style.color = "#c32b2b"; res.textContent = ERR.denied; return; }
      aiTimer = setTimeout(() => REC.on && aiStop(), 9000);
    };
    const offerAI = (err) => {
      if (window.AndroidSpeech || aiDeclined || !window.MediaRecorder) return recordMode(HELP(err));
      if (confirm("Trình duyệt trên máy này chưa hỗ trợ chấm phát âm trực tiếp.\n\nBạn có muốn tải mô hình AI (khoảng 77 MB, chỉ tải một lần, nên dùng Wi-Fi) để chấm điểm ngay trên máy không?")) { S.aiStt = true; save(); return aiStart(); }
      aiDeclined = true; recordMode(HELP(err));
    };
    rb.onclick = (ev) => {
      ev.stopPropagation();
      if (REC.on) return ai ? aiStop() : recordMode();
      if (S.aiStt === true && !window.AndroidSpeech) return aiStart();
      rb.classList.add("on"); res.style.color = ""; res.textContent = "🎙️ Đang nghe... hãy đọc to";
      listen((alts, err) => {
        rb.classList.remove("on");
        if (!alts) {
          const retry = ["unsupported", "network", "aborted", "audio-capture", "service-not-allowed"].includes(err) || /^(error|language|server|client)/.test(err || "");
          if (retry) return offerAI(err);
          res.style.color = "#c32b2b";
          res.textContent = ERR[err] || "Không nhận diện được (" + (err || "?") + "), thử lại."; return;
        }
        showScore(res, zh, alts);
      });
    };
  });
}


// ---------- Pinyin trên từng chữ Hán ----------
const VOW = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";
function syllables(py) {
  const out = [];
  for (const tok of py.toLowerCase().replace(/[.,?!，。？！]/g, "").split(/\s+/).filter(Boolean)) {
    const runs = tok.match(new RegExp(`[${VOW}]+|[^${VOW}]+`, "g")) || [];
    const syl = []; let init = "";
    runs.forEach((r, k) => {
      if (VOW.includes(r[0])) { syl.push(init + r); init = ""; return; }
      if (!syl.length) { init = r; return; }
      let coda = "", next = "";
      if (k === runs.length - 1) {                    // cuối từ: n / ng là vần cuối, r là 儿
        if (r.startsWith("ng")) { coda = "ng"; next = r.slice(2); }
        else if (r.startsWith("n")) { coda = "n"; next = r.slice(1); }
        else next = r;
        if (next === "r" && /^[eēéěè]$/.test(syl[syl.length - 1])) { syl[syl.length - 1] += "r"; next = ""; }   // 二 èr, 耳 ěr
        syl[syl.length - 1] += coda;
        if (next) syl.push(next);
        init = "";
        return;
      }
      if (r === "ng") { coda = "n"; next = "g"; }
      else if (r.startsWith("ng")) { coda = "ng"; next = r.slice(2); }
      else if (r === "n") next = "n";
      else if (r.startsWith("n")) { coda = "n"; next = r.slice(1); }
      else next = r;
      syl[syl.length - 1] += coda;
      init = next;
    });
    out.push(...syl);
  }
  return out;
}
const isHan = (c) => /[一-鿿]/.test(c);
function rubyHTML(zh, py, blank) {
  const chars = [...zh], syl = syllables(py);
  const hanN = chars.filter(isHan).length;
  const ok = syl.length === hanN;
  const start = blank ? zh.indexOf(blank) : -1, end = start + (blank ? [...blank].length : 0);
  let h = 0, cells = "";
  chars.forEach((c, i) => {
    if (blank && i >= start && i < end) { if (i === start) cells += `<div class="rc blank" id="blank" style="min-width:${[...blank].length * 1.3}em"><span class="rp"> </span><span class="rz"> </span></div>`; if (isHan(c)) h++; return; }
    if (!isHan(c) && cells.endsWith("</span></div>")) { cells = cells.slice(0, -13) + c + "</span></div>"; return; }  // dấu câu dính vào chữ trước
    cells += `<div class="rc"><span class="rp">${isHan(c) && ok ? syl[h] : ""}</span><span class="rz">${c}</span></div>`;
    if (isHan(c)) h++;
  });
  return `<div class="ruby">${cells}</div>` + (ok ? "" : `<div class="pinyin">${py}</div>`);
}

// Mỗi "phần" của một chủ đề là một bài học 12 từ
// Ảnh mèo: (1) từ nào có ảnh đúng nghĩa thì dùng ảnh đó, (2) còn lại dùng ảnh theo phần của chủ đề (mỗi phần một ảnh khác nhau)
const CAT_FILES = {
  airport: ["airport1", "airport2", "airport_wait"], hotel: ["hotel1", "hotel2", "hotel_desk"], house: ["house1", "house4", "house_leak"],
  transport: ["trans_metro", "transport1", "transport3"], rental: ["rental1", "rent_gas", "rent_fix"],
  food: ["food", "food_chop", "food_waiter"], shopping: ["shopping1", "shopping2", "shopping3"], market: ["market_veg", "market_stall", "denied"],
  money: ["money", "money_atm", "money2"], emergency: ["health1", "health2", "health3"], urgent: ["urgent_fire", "urgent_ext", "urgent_police"],
  toilet: ["toilet1", "toilet_wash", "toilet_sign"], sightseeing: ["sightseeing", "sight_hanfu"], weather: ["weather", "weather2", "weather5"],
};
const WORD_CAT = {
  // sân bay
  "请问": "n_question", "关": "n_door", "免费": "n_free", "吵": "n_noisy", "申请": "a_apply", "取车": "z_01", "右转": "z_02", "租": "z_03", "点": "z_04", "米饭": "z_05", "便宜": "z_06", "卖": "z_07", "合适": "z_08", "质量": "z_09", "贵": "z_10", "颜色": "z_11", "个": "z_12", "够": "z_13", "市场": "z_14", "要": "z_15", "可以": "z_16", "挂失": "z_17", "丢": "z_18", "麻烦": "z_19", "出去": "z_20", "呼吸": "z_21", "晕": "z_22", "求助": "z_23", "立刻": "z_24", "紧急": "z_25", "遇到": "z_26", "打开": "z_27", "有人": "z_28", "值得": "z_29", "感兴趣": "z_30", "特点": "z_31", "苹果": "g_apple", "西瓜": "g_watermelon", "取消": "g_cancel", "刹车": "g_brake", "微信": "g_chat", "支付宝": "g_alipay", "救护车": "g_ambulance", "地震": "g_quake", "饿": "g_hungry", "重": "g_heavy", "飞机": "g_plane", "方便": "r_convenient", "楼": "r_building", "条件": "n_form", "登机牌": "a_boarding", "票": "a_ticket", "转机": "a_transfer", "热水": "a_hotwater", "换": "a_change", "邻居": "a_neighbor", "维修": "a_repair", "左边": "a_left", "右边": "a_right", "入口": "a_enter", "下车": "a_getoff", "小": "n_small", "机场": "airport1", "行李": "airport1", "护照": "airport_ticket", "签证": "airport3", "座位": "airport2", "窗户": "airport2", "安全带": "airport2", 
  "海关": "airport_custom", "检查": "airport_security", "排队": "airport_queue", "延误": "airport_wait", 
  // khách sạn, thuê nhà
  "床": "hotel2", "洗澡": "hotel1", "毛巾": "hotel1", "门": "hotel3", "入住": "hotel3", "前台": "hotel_desk", "打扫": "hotel_clean", "空调": "hotel_ac", "早饭": "hotel_buffet", "电梯": "hotel_lift",
  "钥匙": "house1", "搬家": "house4", "袋子": "house2", "厨房": "house_kitchen", "阳台": "house_balcony", "冰箱": "house_fridge", "洗衣机": "house_washer",
  "合同": "house_contract", "签": "house_contract", "漏水": "house_leak", "装修": "house_paint",
  // giao thông, thuê xe
  "地铁": "trans_metro", "出租车": "trans_taxi", "红绿灯": "trans_light", "堵车": "trans_jam", "骑": "trans_bike", "火车站": "trans_station",
  "公共汽车": "transport0", "地图": "transport1", "迷路": "transport1", "导航": "transport3", "照相": "transport2",
  "开车": "rental1", "司机": "rental1", "快": "rental4", "超速": "rental4", "加油站": "rent_gas", "油": "rent_gas", "驾照": "rent_license",
  "修理": "rent_fix", "轮胎": "rent_fix", "事故": "rent_crash", "收费站": "rent_toll",
  // ăn uống, mua sắm, chợ
  "咖啡": "food", "饮料": "food2", "果汁": "food2", "面条": "food_noodle", "牛奶": "food_milk", "筷子": "food_chop", "辣": "food_spicy", "甜": "food_cake",
  "啤酒": "food_beer", "服务员": "food_waiter", "结账": "food_bill", "买单": "food_bill", "发票": "food_bill", "打包": "food_takeout",
  "买": "shopping1", "包": "shopping1", "礼物": "shopping1", "衣服": "shop_try", "试": "shop_try", "手机": "shopping3", "付款": "shopping3", "超市": "market1",
  "蔬菜": "market_veg", "水果": "market_fruit", "香蕉": "market_fruit", "鱼": "market_fish", "肉": "market_meat",
  "摊位": "market_stall", "老板": "market_stall", "砍价": "denied", "最低价": "denied", "成交": "approved",
  // tiền
  "钱包": "money", "美元": "money2", "现金": "money2", "假钞": "money2", "银行": "money_bank", "人民币": "money_rmb", "自动取款机": "money_atm",
  "信用卡": "money_card", "银行卡": "money_card", "转账": "money_transfer", "汇款": "money_transfer",
  // sức khỏe, khẩn cấp
  "药": "health3", "症状": "health3", "生病": "health1", "发烧": "health1", "感冒": "health1", "打针": "health2", "医生": "health2", "急救": "health2",
  "医院": "health_hospital", "头": "health_head", "疼": "health_head", "肚子": "health_belly", "拉肚子": "health_belly",
  "受伤": "urgent_bandage", "流血": "urgent_bandage", "摔倒": "urgent_bandage", "警察": "urgent_police", "报警": "urgent_police", "现场": "urgent_police", "记录": "urgent_police",
  "失踪": "urgent3", "火": "urgent_fire", "着火": "urgent_fire", "火灾": "urgent_fire", "灭火器": "urgent_ext", 
  "小偷": "urgent_thief", "盗窃": "urgent_thief", "抢劫": "urgent_thief", "抢": "urgent_thief", "危险": "urgent",
  // nhà vệ sinh
  "厕所": "toilet1", "洗手间": "toilet1", "马桶": "toilet1", "洗手": "toilet_wash", "肥皂": "toilet_soap", "洗手液": "toilet_soap", "镜子": "toilet_mirror",
  "垃圾桶": "toilet_bin", "乱扔": "toilet_bin", "纸": "toilet_paper", "卫生纸": "toilet_paper", "保洁员": "toilet_mop", "清洁": "toilet_mop",
  "暂停使用": "toilet_sign", "请勿": "toilet_sign", "锁": "toilet_lock",
  // thời tiết, tham quan
  "伞": "weather2", "下雨": "weather3", "暴雨": "weather5", "台风": "weather5", "打雷": "weather4", "闪电": "weather4",
  "冷": "weather_cold", "热": "weather_hot", "夏天": "weather_hot", "风": "weather_wind", "春天": "weather_sakura", "秋天": "weather_autumn", "冬天": "weather_scarf",
  "雾": "weather_fog", "防晒霜": "weather_sunscreen", "空气污染": "weather_mask", "太阳": "sightseeing2",
  "博物馆": "sight_museum", "公园": "sight_park", "古代": "sight_hanfu", "传统": "sight_hanfu", "景色": "sightseeing", "山": "sightseeing",
};
const catSrc = (tid, part = 1) => { const a = CAT_FILES[tid]; return a ? `cats/${a[(part - 1) % a.length]}.webp` : ""; };
const wordCatSrc = (u, w) => (WORD_CAT[w] ? `cats/${WORD_CAT[w]}.webp` : WORD_IMG[w] ? `cats/${WORD_IMG[w]}.webp` : catSrc(u.topic.id, u.part));
const avatar = (t) => (CAT_FILES[t.id] ? `<img class="av" src="${catSrc(t.id)}" alt="">` : `<span class="av em">${t.icon}</span>`);
const TINTS = ["#fff1e6", "#ffeaf3", "#eaf3ff", "#e9f9ef", "#f1ecff", "#fff8dd", "#e6fbf6", "#ffecec", "#edf1ff", "#fff0e0", "#f3fbe3", "#ffeef0", "#e8f7ff", "#f7ecff"];
const PRAISE = ["Chuẩn luôn! ✨", "Đỉnh quá! 🔥", "Xịn xò! 💖", "Quá đúng! 🎯", "Giỏi ghê! 🌟", "Hết sảy! 🙌"];
const praise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];
function confetti() {
  const box = document.createElement("div"); box.className = "confetti";
  for (let i = 0; i < 30; i++) {
    const s = document.createElement("span");
    s.textContent = ["🎉", "✨", "💖", "⭐", "🧡", "🌸"][i % 6];
    s.style.cssText = `left:${Math.random() * 100}%;animation-duration:${1.8 + Math.random() * 1.6}s;animation-delay:${Math.random() * 0.4}s;font-size:${16 + Math.random() * 16}px`;
    box.appendChild(s);
  }
  document.body.appendChild(box); setTimeout(() => box.remove(), 4000);
}
const LESSONS = TOPICS.flatMap((t) => t.parts.map((p, i) => ({
  key: `${t.id}_${i + 1}`, topic: t, part: i + 1, icon: t.icon, title: t.title, level: p.level, words: p.words, sentences: p.sentences,
})));
const allWords = LESSONS.flatMap((l) => l.words);
const lessonKey = (l) => l.key;
let level = "all";

// ---------- Màn hình chính ----------
let tab = "learn";
function render() {
  if (tab === "learn") home();
  else if (tab === "listen") listenHome();
  else if (tab === "review") review();
  else if (tab === "words") wordList();
  else settings();
}
function shell(inner) {
  app.innerHTML = `
    <div class="topbar"><span>🇨🇳 Chào Gấm !</span>
      <span class="stat"><button class="upd" id="upd" type="button">🔄 Cập nhật</button><span>🔥 ${S.streak}</span><span>⭐ ${S.xp} XP</span></span></div>
    ${inner}
    <nav class="tabs">
      ${[["learn", "📚 Học"], ["listen", "🎧 Nghe"], ["review", "🃏 Ôn tập"], ["words", "📖 Từ vựng"], ["set", "⚙️ Cài đặt"]]
        .map(([k, l]) => `<button data-tab="${k}" class="${tab === k ? "on" : ""}">${l}</button>`).join("")}
    </nav>`;
  app.querySelectorAll("[data-tab]").forEach((b) => (b.onclick = () => { tab = b.dataset.tab; render(); }));
  const upd = document.getElementById("upd");
  if (upd) upd.onclick = async () => {
    upd.textContent = "⏳ Đang tải…"; upd.disabled = true;
    try { if (navigator.serviceWorker) (await navigator.serviceWorker.getRegistrations()).forEach((r) => r.unregister()); } catch (e) {}
    try { if (window.caches) (await caches.keys()).filter((k) => k.startsWith("hoc-trung-")).forEach((k) => caches.delete(k)); } catch (e) {}
    const u = new URL(location.href); u.searchParams.set("v", Date.now());
    location.replace(u.toString());
  };
}
function home() {
  const total = LESSONS.length, done = LESSONS.filter((l) => S.done[lessonKey(l)]).length;
  const next = LESSONS.find((l) => !S.done[lessonKey(l)]);
  const topics = TOPICS.map((t) => ({ t, parts: LESSONS.filter((l) => l.topic === t && (level === "all" || l.level === level)) }))
    .filter((x) => x.parts.length);
  shell(`<div class="hero">
      <div><b>Học cấp tốc du lịch</b><small>${done}/${total} phần${next ? ` · tiếp theo: ${next.title} (P${next.part})` : ""}</small>
        <div class="bar thin"><i style="width:${(done / total) * 100}%"></i></div></div>
      ${next ? `<button class="btn go" id="go">Học tiếp ›</button>` : `<b>🎉 Hoàn thành tất cả!</b>`}
    </div>
    <div class="chips">${[["all", "Tất cả"], ["HSK2", "HSK 2"], ["HSK3", "HSK 3"], ["HSK4", "HSK 4"]]
      .map(([k, l]) => `<button class="chip ${level === k ? "on" : ""}" data-lv="${k}">${l}</button>`).join("")}</div>
    ${topics.map(({ t, parts }) => `<section class="tsec"><h2><span class="tt">${avatar(t)} ${t.title}</span>
        <small>${parts.filter((l) => S.done[lessonKey(l)]).length}/${parts.length}</small></h2>
      <div class="parts">${parts.map((l) => `<button class="part ${S.done[lessonKey(l)] ? "done" : ""}" data-k="${l.key}">
        <b>Phần ${l.part}</b><small>${l.level} · ${l.words.length} từ</small>${S.done[lessonKey(l)] ? `<i class="tick">✓</i>` : ""}</button>`).join("")}</div></section>`).join("")}`);
  app.querySelectorAll("[data-lv]").forEach((b) => (b.onclick = () => { level = b.dataset.lv; home(); }));
  app.querySelectorAll(".part").forEach((b) => (b.onclick = () => startLesson(LESSONS.find((l) => l.key === b.dataset.k))));
  if ($("#go")) $("#go").onclick = () => startLesson(next);
}

// ---------- Tạo bài tập ----------
function makeExercises(u) {
  const out = [], pool = allWords;
  const mk = (w) => {
    const others = (key) => pick(pool.filter((x) => x[key] !== w[key]), 3);
    const ex = EXAMPLES[w[0]];
    const q = [Math.random() < 0.5
      ? { type: "zh2vi", w, opts: shuffle([w, ...others(2)]) }
      : { type: "vi2zh", w, opts: shuffle([w, ...others(0)]) }];
    if (ex && ex[0].includes(w[0]))
      q.push({ type: "fill", w, ex, opts: shuffle([w, ...pick(pool.filter((x) => x[0] !== w[0] && !ex[0].includes(x[0])), 2)]) });
    else q.push({ type: "listen", w, opts: shuffle([w, ...others(0)]) });
    return q;
  };
  for (let i = 0; i < u.words.length; i += 4) {      // học 4 từ rồi luyện ngay 4 từ đó
    const g = u.words.slice(i, i + 4);
    g.forEach((w) => out.push({ type: "learn", w }));
    out.push(...shuffle(g.flatMap(mk)));
  }
  for (const s of u.sentences) out.push({ type: "order", s });
  return out;
}

// ---------- Bài học ----------
let L;
function startLesson(u) {
  L = { u, ex: makeExercises(u), i: 0, hearts: 5, correct: 0, sel: null, checked: false, page: 0 };
  L.graded = L.ex.filter((x) => x.type !== "learn").length;
  step();
}
function topBar() {
  const n = L.ex.length;
  return `<div class="lesson-top"><button class="x" id="quit">✕</button>
    <div class="bar"><i style="width:${(L.i / n) * 100}%"></i></div>
    <button class="x" id="pytog" title="Bật/tắt pinyin">拼</button><b>❤️ ${L.hearts}</b></div>`;
}
function bindTop() {
  $("#quit").onclick = () => { if (confirm("Thoát bài học?")) render(); };
  $("#pytog").onclick = () => { S.showPinyin = !S.showPinyin; save(); applyPy(); };
}
function applyPy() { document.body.classList.toggle("nopy", !S.showPinyin); }

function renderLearn(e) {
  const ex = EXAMPLES[e.w[0]], page = ex ? L.page : 0;
  const zh = page === 0 ? e.w[0] : ex[0];
  const main = page === 0
    ? `<div class="learn-py">${e.w[1]}</div><div class="learn-zh">${e.w[0]}</div><div class="learn-vi">${e.w[2]}</div>`
    : `${rubyHTML(ex[0], ex[1])}<div class="learn-vi">${ex[2]}</div>`;
  app.innerHTML = `${topBar()}
    <div class="illus ${wordCatSrc(L.u, e.w[0]) ? "cat" : ""}">${wordCatSrc(L.u, e.w[0]) ? `<img src="${wordCatSrc(L.u, e.w[0])}" alt="">` : `<span>${L.u.icon}</span>`}</div>
    <div class="learn">${main}</div>
    <div class="learn-bar prac" data-zh="${zh}">
      <div class="res"></div>
      <div class="tools">
        <button class="tool" data-say title="Nghe">${ICON.spk}</button>
        <button class="tool mic" data-rec title="Đọc thử">${ICON.mic}</button>
        <button class="tool" data-slow title="Nghe chậm">${ICON.slow}</button>
        ${page === 0 ? `<button class="tool" id="pen" title="Luyện viết">${ICON.pen}</button>` : ""}
      </div>
      <button class="next" id="next">›</button>
    </div>`;
  bindTop(); bindPractice(app);
  if ($("#pen")) $("#pen").onclick = () => writeScreen(e.w, () => renderLearn(e));
  else setTimeout(() => speak(zh), 250);
  if ($("#pen")) setTimeout(() => speak(zh), 250);
  $("#next").onclick = () => {
    if (page === 0 && ex) { L.page = 1; renderLearn(e); } else { L.page = 0; L.i++; step(); }
  };
}

function step() {
  if (L.i >= L.ex.length) return finish();
  L.sel = null; L.checked = false; L.built = [];
  const e = L.ex[L.i];
  if (e.type === "learn") return renderLearn(e);
  const py = (t) => (S.showPinyin ? t : "");
  let body = "";
  if (e.type === "zh2vi") {
    body = `<div class="prompt">Từ này nghĩa là gì?</div>
      <div class="big-zh">${e.w[0]}</div><div class="pinyin">${py(e.w[1])}</div>
      <div class="choices">${e.opts.map((o, k) => `<button class="choice" data-k="${k}">${o[2]}</button>`).join("")}</div>`;
    setTimeout(() => speak(e.w[0]), 200);
  } else if (e.type === "vi2zh") {
    body = `<div class="prompt">Chọn chữ Hán cho: "${e.w[2]}"</div>
      <div class="choices">${e.opts.map((o, k) => `<button class="choice" data-k="${k}"><span style="font-size:26px">${o[0]}</span><small>${py(o[1])}</small></button>`).join("")}</div>`;
  } else if (e.type === "listen") {
    body = `<div class="prompt">Bạn nghe được gì?</div>
      <button class="speak" id="spk">${ICON.spk}</button>
      <div class="choices">${e.opts.map((o, k) => `<button class="choice" data-k="${k}"><span style="font-size:26px">${o[0]}</span><small>${py(o[1])}</small></button>`).join("")}</div>`;
    setTimeout(() => speak(e.w[0]), 300);
  } else if (e.type === "fill") {
    body = `<div class="prompt">Nghe và chọn từ điền vào chỗ trống</div>
      <div class="speak-row"><button class="speak" id="spk">${ICON.spk}</button><button class="speak mini2" id="spkslow">${ICON.slow}</button></div>
      ${rubyHTML(e.ex[0], e.ex[1], e.w[0])}
      <div class="tiles">${e.opts.map((o, k) => `<button class="choice tl" data-k="${k}"><small>${o[1]}</small><span>${o[0]}</span></button>`).join("")}</div>`;
    setTimeout(() => speak(e.ex[0]), 300);
  } else {
    e.bank = e.bank || shuffle(e.s.zh.map((t, k) => ({ t, k })));
    body = `<div class="prompt">Dịch câu: "${e.s.vi}"</div>
      <div class="answer" id="ans"></div><div class="bank" id="bank"></div>`;
  }
  app.innerHTML = `${topBar()}
    ${body}
    <div style="height:280px"></div>
    <div class="footer" id="foot"><div class="in"><button class="btn" id="chk" disabled>Kiểm tra</button></div></div>`;
  bindTop();
  const say = e.type === "fill" ? e.ex[0] : e.w && e.w[0];
  if ($("#spk")) $("#spk").onclick = () => speak(say);
  if ($("#spkslow")) $("#spkslow").onclick = () => speak(say, 0.5);
  if (e.type === "order") setupOrder(e);
  else app.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
    if (L.checked) return;
    app.querySelectorAll(".choice").forEach((c) => c.classList.remove("sel"));
    b.classList.add("sel"); L.sel = +b.dataset.k; $("#chk").disabled = false;
    if (e.type === "fill") { const bl = $("#blank"); bl.classList.add("filled"); bl.querySelector(".rz").textContent = e.opts[L.sel][0]; bl.querySelector(".rp").textContent = e.opts[L.sel][1]; }
  }));
  $("#chk").onclick = check;
}
function setupOrder(e) {
  const draw = () => {
    $("#ans").innerHTML = L.built.map((x, n) => `<button class="tile" data-a="${n}">${x.t}</button>`).join("");
    $("#bank").innerHTML = e.bank.filter((x) => !L.built.includes(x)).map((x) => `<button class="tile" data-b="${x.k}">${x.t}</button>`).join("");
    $("#ans").querySelectorAll("[data-a]").forEach((b) => (b.onclick = () => { if (L.checked) return; L.built.splice(+b.dataset.a, 1); draw(); }));
    $("#bank").querySelectorAll("[data-b]").forEach((b) => (b.onclick = () => {
      if (L.checked) return;
      L.built.push(e.bank.find((x) => x.k === +b.dataset.b)); draw(); speak(b.textContent);
    }));
    $("#chk").disabled = L.built.length === 0;
  };
  draw();
}
function check() {
  const e = L.ex[L.i];
  if (L.checked) { L.i++; return step(); }
  let ok, shown;
  if (e.type === "order") {
    ok = L.built.map((x) => x.t).join("") === e.s.zh.join("");
    shown = e.s.zh.join("") + " — " + e.s.py;
    speak(e.s.zh.join(""));
  } else {
    ok = e.opts[L.sel][0] === e.w[0];
    shown = `${e.w[0]} (${e.w[1]}) = ${e.w[2]}`;
    if (e.type === "fill") speak(e.ex[0]);
    else if (e.type !== "listen") speak(e.w[0]);
  }
  L.checked = true;
  if (ok) L.correct++; else { L.hearts--; if (e.w) markCard(e.w[0], false); }
  if (e.w) S.learned[e.w[0]] = (S.learned[e.w[0]] || 0) + (ok ? 1 : -1);
  const foot = $("#foot");
  foot.className = "footer " + (ok ? "good" : "bad");
  let extra;
  if (e.type === "order") extra = practice(e.s.zh.join(""), e.s.py, e.s.vi);
  else {
    const ex = EXAMPLES[e.w[0]];
    extra = practice(e.w[0], e.w[1], e.w[2]) + (ex ? `<div class="exlabel">Ví dụ</div>` + practice(ex[0], ex[1], ex[2]) : "");
  }
  foot.innerHTML = `<div class="in"><p>${ok ? praise() : "Ối hụt rồi 🥲 Đáp án nè: " + shown}</p>${extra}
    <button class="btn" id="chk">${L.hearts <= 0 ? "Kết thúc" : "Tiếp tục"}</button></div>`;
  bindPractice(foot);
  $("#chk").onclick = () => { if (L.hearts <= 0) return fail(); L.i++; step(); };
}
function bumpStreak() {
  if (S.lastDay === today()) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
  S.streak = S.lastDay === y ? S.streak + 1 : 1;
  S.lastDay = today();
}
function finish() {
  const gain = 10 + L.correct * 2;
  S.xp += gain; S.done[lessonKey(L.u)] = true; bumpStreak(); save();
  app.innerHTML = `<div class="center"><img class="mood" src="cats/approved.webp" alt=""><h1>Xong rồi, đỉnh ghê! 🎉</h1>
    <p>Đúng ${L.correct}/${L.graded} câu · +${gain} XP</p>
    <button class="btn" id="home">Tiếp tục</button></div>`;
  $("#home").onclick = render; confetti();
}
function fail() {
  save();
  app.innerHTML = `<div class="center"><img class="mood" src="cats/denied.webp" alt=""><h1>Hết tim rồi 🥺</h1>
    <p>Đừng bỏ cuộc, thử lại nè! 💪</p><button class="btn" id="home">Về trang chính</button></div>`;
  $("#home").onclick = render;
}

// ---------- Ôn tập: kho "chưa nhớ" và kho "đã nhớ" ----------
// Nhớ rồi → vào kho đã nhớ, hiện lại sau 1 → 3 → 7 → 14 → 30 ngày. Chưa nhớ → vào kho học lại.
const GAP = [1, 3, 7, 14, 30];
const dayStr = (n = 0) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const wordOf = (h) => allWords.find((w) => w[0] === h);
const cardOf = (h) => S.cards[h] || { s: "new", box: 0, due: dayStr() };
function markCard(h, ok) {
  const c = cardOf(h);
  if (ok) { c.box = Math.min(c.box + 1, GAP.length); c.s = "known"; c.due = dayStr(GAP[c.box - 1]); }
  else { c.box = 0; c.s = "again"; c.due = dayStr(); }
  S.cards[h] = c; save();
}
function stores() {
  const seen = new Set(allWords.filter((w) => LESSONS.some((l) => S.done[lessonKey(l)] && l.words.includes(w))).map((w) => w[0]));
  Object.keys(S.cards).forEach((h) => wordOf(h) && seen.add(h));
  const pool = [...seen].map(wordOf), t = dayStr(), st = (w) => cardOf(w[0]);
  return {
    pool,
    again: pool.filter((w) => st(w).s === "again"),
    fresh: pool.filter((w) => st(w).s === "new"),
    known: pool.filter((w) => st(w).s === "known"),
    due: pool.filter((w) => st(w).s === "known" && st(w).due <= t),
  };
}
function review() {
  const k = stores();
  if (!k.pool.length) return shell(`<div class="center"><p>Hoàn thành một phần bài học để mở khóa ôn tập.</p></div>`);
  const today = [...k.again, ...k.fresh, ...k.due];
  shell(`<h2>Ôn tập</h2>
    <div class="stores">
      <button class="store bad" data-st="again"><b>📕 ${k.again.length}</b><span>Chưa nhớ</span></button>
      <button class="store" data-st="fresh"><b>🆕 ${k.fresh.length}</b><span>Từ mới</span></button>
      <button class="store good" data-st="known"><b>📗 ${k.known.length}</b><span>Đã nhớ</span></button>
    </div>
    <button class="btn" id="today" ${today.length ? "" : "disabled"}>${today.length ? `Ôn hôm nay (${today.length} thẻ)` : "Hôm nay không còn thẻ cần ôn 🎉"}</button>
    <div style="height:12px"></div>
    <button class="btn no" id="redo" ${k.again.length ? "" : "disabled"}>Học lại từ chưa nhớ (${k.again.length})</button>
    <p class="hint">Bấm "Nhớ rồi" → từ vào kho đã nhớ và sẽ hiện lại sau ít ngày để ôn.<br>Bấm "Chưa nhớ" (hoặc trả lời sai trong bài) → từ vào kho chưa nhớ để học lại.</p>`);
  $("#today").onclick = () => session(shuffle(today), "Ôn hôm nay");
  $("#redo").onclick = () => session(shuffle(k.again), "Học lại từ chưa nhớ");
  const names = { again: "Kho chưa nhớ", fresh: "Từ mới", known: "Kho đã nhớ" };
  app.querySelectorAll("[data-st]").forEach((b) => (b.onclick = () => {
    const list = k[b.dataset.st];
    if (!list.length) { b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 400); return; }
    session(shuffle(list), names[b.dataset.st]);
  }));
}
function storeList(kind) {
  const list = stores()[kind], names = { again: "📕 Kho chưa nhớ", fresh: "🆕 Từ mới", known: "📗 Kho đã nhớ" };
  shell(`<div class="lesson-top"><button class="x" id="back">‹</button><h2 style="margin:0">${names[kind]} (${list.length})</h2></div>
    ${list.length ? list.map((w) => `<div class="list-item"><span data-say="${w[0]}"><b>${w[0]}</b> <small>${w[1]}</small><br><small>${w[2]}</small></span>
      <span>${kind === "known" ? `<button class="chip" data-mv="${w[0]}" data-to="0">Chưa nhớ</button>` : `<button class="chip" data-mv="${w[0]}" data-to="1">Nhớ rồi</button>`}</span></div>`).join("") : `<p class="hint">Chưa có từ nào.</p>`}`);
  $("#back").onclick = review;
  app.querySelectorAll("[data-say]").forEach((r) => (r.onclick = () => speak(r.dataset.say)));
  app.querySelectorAll("[data-mv]").forEach((b) => (b.onclick = () => { markCard(b.dataset.mv, b.dataset.to === "1"); storeList(kind); }));
}
function session(deck, title) {
  let flipped = false, ok = 0, bad = 0;
  const draw = () => {
    if (!deck.length) {
      shell(`<div class="center"><div class="trophy">🎉</div><h2>Xong lượt ôn tập!</h2>
        <p>📗 Nhớ rồi: ${ok} · 📕 Chưa nhớ: ${bad}</p><button class="btn" id="fin">Về kho ôn tập</button></div>`);
      $("#fin").onclick = review; return;
    }
    const w = deck[0];
    shell(`<div class="lesson-top"><button class="x" id="back">‹</button><b>${title}</b></div>
      <div class="flash" id="card">${flipped
      ? `<div><div class="zh">${w[0]}</div><div class="pinyin">${w[1]}</div><h2>${w[2]}</h2>${EXAMPLES[w[0]] ? practice(...EXAMPLES[w[0]]) : ""}<button class="chip" data-write>${ICON.pen} Luyện viết</button></div>`
      : `<div class="zh">${w[0]}</div>`}</div>
      <p class="pinyin">Còn ${deck.length} thẻ · chạm vào thẻ để lật qua lại</p>
      ${flipped ? `<div class="row"><button class="btn no" id="again">Chưa nhớ</button><button class="btn" id="know">Nhớ rồi</button></div>` : ""}`);
    $("#back").onclick = review;
    $("#card").onclick = () => { flipped = !flipped; if (flipped) speak(w[0]); draw(); };
    bindPractice($("#card"));
    if (flipped) {
      $("#card [data-write]").onclick = (ev) => { ev.stopPropagation(); writeScreen(w, draw); };
      $("#again").onclick = () => { markCard(w[0], false); bad++; deck.push(deck.shift()); flipped = false; draw(); };
      $("#know").onclick = () => { markCard(w[0], true); ok++; deck.shift(); flipped = false; draw(); };
    }
  };
  draw();
}

// ---------- Luyện nét viết ----------
function writeScreen(w, back) {
  const chars = [...w[0]].filter(isHan);
  const size = Math.min(300, window.innerWidth - 48);
  let i = 0, hw = null, hint = true;
  const show = () => {
    app.innerHTML = `<div class="lesson-top"><button class="x" id="wback">✕</button><b>Luyện viết</b></div>
      <div class="w-head"><div class="learn-py">${w[1]}</div><div class="w-vi">${w[2]}</div>
        <div class="dots">${chars.map((c, k) => `<span class="dot ${k < i ? "ok" : k === i ? "cur" : ""}">${c}</span>`).join("")}</div></div>
      <div class="wbox" id="wbox" style="width:${size}px;height:${size}px"></div>
      <div class="wmsg" id="wmsg">Bấm "Xem nét" để xem thứ tự, rồi "Tập viết" để tự viết.</div>
      <div class="row"><button class="btn alt" id="wplay">▶ Xem nét</button><button class="btn" id="wquiz">${ICON.pen} Tập viết</button></div>
      <div class="wopts"><button class="chip" id="whint">Gợi ý: ${hint ? "bật" : "tắt"}</button><button class="chip" id="wreset">↺ Làm lại</button>
        ${i < chars.length - 1 ? `<button class="chip" id="wnext">Chữ sau ›</button>` : ""}</div>`;
    $("#wback").onclick = back;
    const msg = (t) => ($("#wmsg").innerHTML = t);
    try {
      hw = HanziWriter.create("wbox", chars[i], {
        width: size, height: size, padding: 14, showOutline: hint, strokeAnimationSpeed: 1.3, delayBetweenStrokes: 220,
        strokeColor: "#2b2b2b", outlineColor: "#e6e6e6", highlightColor: "#f5a000", drawingColor: "#f5a000",
        charDataLoader: (c, ok, err) => (STROKES[c] ? ok(STROKES[c]) : err()),
      });
    } catch (e) { msg("Không tải được dữ liệu nét chữ."); return; }
    $("#wplay").onclick = () => { hw.cancelQuiz(); hw.showCharacter(); hw.animateCharacter(); msg("▶ Đang vẽ từng nét theo thứ tự…"); speak(chars[i]); };
    $("#whint").onclick = () => { hint = !hint; hint ? hw.showOutline() : hw.hideOutline(); $("#whint").textContent = "Gợi ý: " + (hint ? "bật" : "tắt"); };
    $("#wreset").onclick = show;
    if ($("#wnext")) $("#wnext").onclick = () => { i++; show(); };
    $("#wquiz").onclick = () => {
      msg("✍ Viết nét đầu tiên bằng ngón tay (hoặc chuột)");
      hw.quiz({
        leniency: 1.3, showHintAfterMisses: 2, highlightOnComplete: true,
        onCorrectStroke: (s) => msg(`✅ Đúng! Nét ${s.strokeNum + 1}/${s.strokeNum + s.strokesRemaining + 1}`),
        onMistake: (s) => msg(`❌ Chưa đúng nét ${s.strokeNum + 1}, thử lại (sai ${s.mistakesOnStroke} lần)`),
        onComplete: (sum) => {
          S.xp += 2; save();
          const last = i >= chars.length - 1;
          msg(`🎉 Xong chữ ${chars[i]}! Sai ${sum.totalMistakes} nét.` + (last ? `<br><button class="btn" id="wfin">Hoàn thành</button>` : ""));
          if (last) $("#wfin").onclick = back; else setTimeout(() => { i++; show(); }, 1100);
        },
      });
    };
  };
  show();
}

// ---------- Luyện nghe hội thoại ----------
let talkToken = 0;
function stopTalk() { talkToken++; if (window.AndroidTTS) AndroidTTS.stop(); else if ("speechSynthesis" in window) speechSynthesis.cancel(); }
function sayAs(text, who, rate, onend) {      // A và B dùng giọng/cao độ khác nhau
  if (window.AndroidTTS) return nativeSpeak(text, rate, who === "B" ? 1.35 : 0.85, onend);
  if (!("speechSynthesis" in window)) return onend && onend();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = "zh-CN"; u.rate = rate; u.pitch = who === "B" ? 1.35 : 0.85;
  const vs = speechSynthesis.getVoices().filter((v) => /^zh/i.test(v.lang));
  if (vs.length) u.voice = vs[who === "B" && vs.length > 1 ? 1 : 0];
  let fired = false; const go = () => { if (!fired) { fired = true; onend && onend(); } };
  u.onend = go; u.onerror = go;
  speechSynthesis.speak(u);
}
function playLines(lines, rate, onLine, done) {
  stopTalk(); const my = talkToken;
  const next = (i) => {
    if (my !== talkToken) return;
    if (i >= lines.length) { onLine(-1); return done && done(); }
    onLine(i);
    sayAs(lines[i][1], lines[i][0], rate, () => setTimeout(() => next(i + 1), 350));
  };
  next(0);
}
function listenHome() {
  const done = DIALOGUES.filter((d) => S.talk[d.id] != null).length;
  shell(`<div class="hero"><div><b>Luyện nghe hội thoại</b><small>${done}/${DIALOGUES.length} đoạn đã làm</small>
      <div class="bar thin"><i style="width:${(done / DIALOGUES.length) * 100}%"></i></div></div></div>
    ${TOPICS.map((t) => {
      const ds = DIALOGUES.filter((d) => d.topic === t.id);
      return ds.length ? `<section class="tsec"><h2><span class="tt">${avatar(t)} ${t.title}</span></h2>${ds.map((d) => `
        <button class="dlg" data-id="${d.id}"><span class="play">${ICON.spk}</span>
          <span><b>${d.title}</b><small>${d.level} · ${d.lines.length} câu thoại ${S.talk[d.id] != null ? "· ✓ " + S.talk[d.id] + "/" + d.qs.length : ""}</small></span></button>`).join("")}</section>` : "";
    }).join("")}`);
  app.querySelectorAll(".dlg").forEach((b) => (b.onclick = () => dialogue(DIALOGUES.find((d) => d.id === b.dataset.id))));
}
function dialogue(d) {
  let sub = false, cur = -1;
  const exit = () => { stopTalk(); listenHome(); };
  const transcript = (withRun) => d.lines.map((l, i) => `<div class="tl ${l[0]} ${i === cur ? "on" : ""}" data-i="${i}"><i>${l[0]}</i>
      <span><b>${l[1]}</b><small>${l[2]}</small><em>${l[3]}</em></span></div>`).join("");
  const markCur = (i) => { cur = i; app.querySelectorAll(".tl").forEach((e) => e.classList.toggle("on", +e.dataset.i === i)); };

  const screenListen = () => {
    app.innerHTML = `<div class="lesson-top"><button class="x" id="dx">✕</button><b>${d.title}</b></div>
      <p class="hint" style="text-align:center">Nghe 2–3 lần, rồi trả lời ${d.qs.length} câu hỏi.</p>
      <div class="speak-row"><button class="speak" id="dplay">${ICON.spk}</button><button class="speak mini2" id="dslow">${ICON.slow}</button></div>
      <div class="row" style="margin:14px 0"><button class="chip ${sub ? "on" : ""}" id="dsub">${sub ? "Ẩn phụ đề" : "Xem phụ đề"}</button></div>
      <div class="transcript ${sub ? "" : "hide"}" id="tr">${sub ? transcript() : `<div class="hint" style="text-align:center">Phụ đề đang ẩn – hãy luyện nghe trước.</div>`}</div>
      <div style="height:90px"></div>
      <div class="learn-bar"><button class="btn" id="dgo">Làm bài (${d.qs.length} câu) ›</button></div>`;
    $("#dx").onclick = exit;
    const play = (rate) => playLines(d.lines, rate, markCur);
    $("#dplay").onclick = () => play(0.85); $("#dslow").onclick = () => play(0.6);
    $("#dsub").onclick = () => { sub = !sub; stopTalk(); screenListen(); };
    app.querySelectorAll(".tl").forEach((e) => (e.onclick = () => { stopTalk(); const l = d.lines[+e.dataset.i]; markCur(+e.dataset.i); sayAs(l[1], l[0], 0.8); }));
    $("#dgo").onclick = () => { stopTalk(); screenQuiz(0, 0); };
    setTimeout(() => play(0.85), 300);
  };

  const screenQuiz = (qi, score) => {
    const q = d.qs[qi]; let sel = null, checked = false;
    app.innerHTML = `<div class="lesson-top"><button class="x" id="dx">✕</button>
        <div class="bar"><i style="width:${(qi / d.qs.length) * 100}%"></i></div><b>${qi + 1}/${d.qs.length}</b></div>
      <div class="prompt">${q[0]}</div>
      <div class="row" style="margin-bottom:6px"><button class="chip" id="dre">${ICON.spk} Nghe lại</button><button class="chip" id="dres">${ICON.slow}</button></div>
      <div class="choices">${q[1].map((o, k) => `<button class="choice" data-k="${k}">${o}</button>`).join("")}</div>
      <div style="height:200px"></div>
      <div class="footer" id="foot"><div class="in"><button class="btn" id="chk" disabled>Kiểm tra</button></div></div>`;
    $("#dx").onclick = exit;
    $("#dre").onclick = () => playLines(d.lines, 0.85, () => {}); $("#dres").onclick = () => playLines(d.lines, 0.6, () => {});
    app.querySelectorAll(".choice").forEach((b) => (b.onclick = () => {
      if (checked) return; stopTalk();
      app.querySelectorAll(".choice").forEach((c) => c.classList.remove("sel")); b.classList.add("sel"); sel = +b.dataset.k; $("#chk").disabled = false;
    }));
    $("#chk").onclick = () => {
      if (!checked) {
        checked = true; const ok = sel === q[2]; if (ok) score++;
        app.querySelectorAll(".choice").forEach((c) => c.classList.toggle("sel", +c.dataset.k === q[2]));
        const foot = $("#foot"); foot.className = "footer " + (ok ? "good" : "bad");
        foot.innerHTML = `<div class="in"><p>${ok ? praise() : "Ối hụt rồi 🥲 Đáp án nè: " + q[1][q[2]]}</p>
          <button class="btn" id="chk">${qi + 1 < d.qs.length ? "Tiếp tục" : "Xem kết quả"}</button></div>`;
        $("#chk").onclick = () => (qi + 1 < d.qs.length ? screenQuiz(qi + 1, score) : screenResult(score));
      }
    };
  };

  const screenResult = (score) => {
    const best = Math.max(S.talk[d.id] ?? 0, score), gain = score * 5;
    S.talk[d.id] = best; S.xp += gain; bumpStreak(); save();
    sub = true;
    app.innerHTML = `<div class="center" style="margin-top:20px"><div class="trophy">${score === d.qs.length ? "🏆" : "👍"}</div>
        <h2>Đúng ${score}/${d.qs.length} câu · +${gain} XP</h2></div>
      <div class="transcript" id="tr">${transcript()}</div>
      <div style="height:90px"></div>
      <div class="learn-bar"><div class="row"><button class="btn alt" id="dagain">Nghe lại</button><button class="btn" id="dfin">Xong</button></div></div>`;
    app.querySelectorAll(".tl").forEach((e) => (e.onclick = () => { stopTalk(); const l = d.lines[+e.dataset.i]; markCur(+e.dataset.i); sayAs(l[1], l[0], 0.8); }));
    $("#dagain").onclick = () => playLines(d.lines, 0.85, markCur);
    $("#dfin").onclick = exit;
    if (score === d.qs.length) confetti();
  };
  screenListen();
}

// ---------- Từ vựng ----------
function wordList() {
  shell(LESSONS.map((u) => `<h2>${u.icon} ${u.title} · Phần ${u.part} <small>${u.level}</small></h2>` + u.words.map((w) =>
    `<div class="list-item" data-z="${w[0]}"><span><b>${w[0]}</b> <small>${w[1]}</small></span><span>${w[2]} ▾</span></div>
      <div class="detail" data-d="${w[0]}" hidden>${practice(w[0], w[1], "")}<button class="chip" data-write="${w[0]}">${ICON.pen} Luyện viết</button>${EXAMPLES[w[0]] ? `<div class="exlabel">Ví dụ</div>` + practice(...EXAMPLES[w[0]]) : ""}</div>`).join("")).join(""));
  app.querySelectorAll("[data-z]").forEach((r) => (r.onclick = () => {
    const d = app.querySelector(`[data-d="${r.dataset.z}"]`); d.hidden = !d.hidden;
    if (!d.hidden) speak(r.dataset.z);
  }));
  bindPractice(app);
  app.querySelectorAll("[data-write]").forEach((b) => (b.onclick = () => writeScreen(wordOf(b.dataset.write), wordList)));
}

// ---------- Cài đặt ----------
function settings() {
  shell(`<h2>Cài đặt</h2>
    <label class="toggle"><span>Hiện pinyin</span><input type="checkbox" id="py" ${S.showPinyin ? "checked" : ""}></label>
    <div style="margin-top:24px"><button class="btn no" id="reset">Xóa tiến độ</button></div>`);
  $("#py").onchange = (e) => { S.showPinyin = e.target.checked; save(); };
  $("#reset").onclick = () => { if (confirm("Xóa toàn bộ tiến độ?")) { localStorage.removeItem(KEY); location.reload(); } };
}

applyPy();
render();

if ("serviceWorker" in navigator) {
  if (location.protocol === "https:") navigator.serviceWorker.register("sw.js");
  else {            // chạy trong mạng nhà (http): không lưu đệm, luôn lấy bản mới
    navigator.serviceWorker.getRegistrations().then((rs) => rs.forEach((r) => r.unregister())).catch(() => {});
    if (window.caches) caches.keys().then((ks) => ks.filter((k) => k.startsWith("hoc-trung-")).forEach((k) => caches.delete(k))).catch(() => {});
  }
}
