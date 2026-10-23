// 纯计算逻辑（与网页版 index.html 内嵌逻辑一致），不依赖小程序 API，便于复用与单测。
// 输入序列 rows：[[日期字符串 'YYYY-MM-DD', 数值], ...]（升序）。

function daysBetween(a, b) {
  const ms = new Date(b) - new Date(a);
  return Math.round(ms / 86400000);
}

// 在升序 rows 中定位：preferPast=true 取 <= target 的最近一条；否则取 >= target 的最近一条
function locate(rows, target, preferPast) {
  const n = rows.length;
  if (target <= rows[0][0]) return 0;
  if (target >= rows[n - 1][0]) return n - 1;
  let lo = 0, hi = n - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (rows[mid][0] < target) lo = mid + 1; else hi = mid;
  }
  if (rows[lo][0] === target) return lo;
  return preferPast ? (lo > 0 ? lo - 1 : lo) : lo;
}

function isoOf(dt) {
  const p = (n) => String(n).padStart(2, "0");
  return dt.getFullYear() + "-" + p(dt.getMonth() + 1) + "-" + p(dt.getDate());
}
function shiftMonths(iso, n) {
  const arr = iso.split("-").map(Number);
  const y = arr[0], m = arr[1], d = arr[2];
  const last = new Date(y, m + n, 0).getDate(); // 目标月最后一天，防 3/31 -> 2/31 溢出
  return isoOf(new Date(y, m - 1 + n, Math.min(d, last)));
}
function shiftYears(iso, n) {
  const arr = iso.split("-").map(Number);
  const y = arr[0], m = arr[1], d = arr[2];
  const last = new Date(y + n, m, 0).getDate();
  return isoOf(new Date(y + n, m - 1, Math.min(d, last)));
}

// 区间收益核心：r = 截止TRI / 起始TRI - 1
function computeReturn(rows, startRaw, endRaw) {
  const si = locate(rows, startRaw, true); // 起始：取不晚于起始日的最近净值（往前取）
  const ei = locate(rows, endRaw, true);   // 截止：取不晚于截止日的最近净值（往前取）
  const sd = rows[si][0], sv = rows[si][1];
  const ed = rows[ei][0], ev = rows[ei][1];
  const r = ev / sv - 1;
  const days = daysBetween(sd, ed);
  return { si, ei, sd, sv, ed, ev, r, days };
}

// 年化：a = (1+r)^(base/days) - 1；base='actual' 时取实际天数（年化即区间收益）
function annualized(r, days, baseVal) {
  if (days <= 0) return null;
  const base = baseVal === "actual" ? days : parseFloat(baseVal);
  return Math.pow(1 + r, base / days) - 1;
}

// 数值格式化：至少 4 位小数（跨引擎安全，不使用 toLocaleString 选项）
function fmtVal(v) {
  return (Math.round(v * 1e6) / 1e6).toFixed(4);
}
function fmtPct(x) {
  return (x >= 0 ? "+" : "") + (x * 100).toFixed(2) + "%";
}

module.exports = {
  daysBetween, locate, isoOf, shiftMonths, shiftYears,
  computeReturn, annualized, fmtVal, fmtPct
};
