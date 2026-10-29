// Nhận diện giọng nói tiếng Trung ngay trên máy (Whisper chạy bằng WebAssembly), dùng khi trình duyệt không có Web Speech.
// Mô hình tải một lần (~77 MB) rồi lưu trong bộ nhớ trình duyệt; giọng nói không rời khỏi máy.
import { pipeline, env } from "https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1";

env.allowLocalModels = false;
env.useBrowserCache = true;

const MODEL = "onnx-community/whisper-base";
let asrP = null;

export function load(onProgress) {
  if (!asrP) {
    asrP = pipeline("automatic-speech-recognition", MODEL, {
      device: "wasm",
      dtype: { encoder_model: "q8", decoder_model_merged: "q8" },
      progress_callback: (p) => onProgress && onProgress(p),
    }).catch((e) => { asrP = null; throw e; });
  }
  return asrP;
}

async function toPcm16k(blob) {
  const buf = await blob.arrayBuffer();
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const ctx = new Ctx();
  const audio = await new Promise((ok, bad) => ctx.decodeAudioData(buf.slice(0), ok, bad));
  ctx.close && ctx.close();
  const len = Math.max(1, Math.ceil(audio.duration * 16000));
  const off = new OfflineAudioContext(1, len, 16000);
  const src = off.createBufferSource(); src.buffer = audio; src.connect(off.destination); src.start();
  return (await off.startRendering()).getChannelData(0);
}

export async function transcribe(blob, onProgress) {
  const asr = await load(onProgress);
  const pcm = await toPcm16k(blob);
  let peak = 0, sum = 0;
  for (let i = 0; i < pcm.length; i++) { const v = Math.abs(pcm[i]); if (v > peak) peak = v; sum += v * v; }
  const rms = Math.sqrt(sum / Math.max(1, pcm.length));
  if (peak < 0.01 || rms < 0.002) return "";                    // gần như im lặng: không đưa cho mô hình đoán bừa
  const g = Math.min(30, 0.9 / peak);                           // nâng âm lượng lên cho mô hình nghe rõ
  if (g > 1.2) for (let i = 0; i < pcm.length; i++) pcm[i] *= g;
  const out = await asr(pcm, { language: "chinese", task: "transcribe" });
  const t = (out && out.text || "").trim();
  // Whisper hay "ảo giác" khi chỉ có tiếng ồn: 叮叮, 字幕..., hoặc một chữ lặp lại
  if (/叮|字幕|订阅|訂閱|观看|觀看|感谢|謝謝觀看|点赞|按赞/.test(t) && t.replace(/[^\u4e00-\u9fff]/g, "").length <= 8) return "";
  return t;
}
