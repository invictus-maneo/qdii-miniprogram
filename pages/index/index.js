const calc = require("../../utils/calc.js");
const app = getApp();

const CHIP_DEFS = [
  { key: "1m", label: "近1月" }, { key: "3m", label: "近3月" }, { key: "6m", label: "近6月" },
  { key: "1y", label: "近1年" }, { key: "3y", label: "近3年" }, { key: "5y", label: "近5年" },
  { key: "ytd", label: "今年以来" }
];
const ANN_BASES = [
  { label: "年化基准：365 天（标准年）", value: "365" },
  { label: "年化基准：360 天", value: "360" },
  { label: "年化基准：实际区间天数（年化＝区间收益）", value: "actual" }
];

Page({
  data: {
    srcName: "TotalReturnIndex",
    cnt: "–", cntnav: "–",
    items: [], index: {},          // 轻量：下拉候选 + 代码->产品映射
    codeText: "", query: "", showList: false, hits: [], selectedLabel: "",
    prange: "",
    startDate: "", endDate: "", dateMin: "", dateMax: "",
    annOn: true, annBases: ANN_BASES, annBaseIdx: 0, annBase: "365",
    chips: CHIP_DEFS, activeChip: null,
    result: { show: false },
    loading: true, error: ""
  },

  // 净值序列（2.5MB）不进 setData/Storage（Storage 单键上限 1MB），仅留在 JS 内存
  _products: {},
  _chipNote: "",

  onLoad() {
    this.loadData();
  },

  loadData() {
    this.fetchData();
  },

  fetchData() {
    if (app.globalData.useCloud) {
      this.fetchViaCloud();
    } else {
      this.fetchViaRequest();
    }
  },

  fetchViaRequest() {
    const url = app.globalData.dataUrl;
    wx.request({
      url, method: "GET",
      success: (res) => {
        if (res.statusCode === 200 && res.data && res.data.products) {
          this.applyData(res.data);
          this.setData({ loading: false, error: "" });
        } else if (!Object.keys(this._products).length) {
          this.setData({ loading: false, error: "数据加载失败，请稍后重试。" });
        }
      },
      fail: () => {
        if (!Object.keys(this._products).length) {
          this.setData({
            loading: false,
            error: "网络请求失败：请检查网络，并在开发者工具勾选「不校验合法域名」后再试。"
          });
        }
      }
    });
  },

  fetchViaCloud() {
    if (typeof wx === "undefined" || !wx.cloud || !wx.cloud.callFunction) {
      if (!Object.keys(this._products).length) {
        this.setData({ loading: false, error: "未检测到云开发：请在开发者工具开通云开发，并在 config.js 填入 CLOUD_ENV。" });
      }
      return;
    }
    wx.cloud.callFunction({ name: "getQdiiData" })
      .then((res) => {
        const r = (res && res.result) || {};
        if (r.ok && r.data && r.data.products) {
          this.applyData(r.data);
          this.setData({ loading: false, error: "" });
        } else if (!Object.keys(this._products).length) {
          this.setData({ loading: false, error: "云函数返回异常：" + (r.err || "未知错误") });
        }
      })
      .catch((err) => {
        if (!Object.keys(this._products).length) {
          this.setData({ loading: false, error: "云函数调用失败：" + ((err && err.message) || err) + "（请确认已开通云开发并部署 getQdiiData 云函数）" });
        }
      });
  },

  applyData(d) {
    const items = (d.items && d.items.length)
      ? d.items.map((it) => ({
          code: it.code, name: it.name, mid: it.mid,
          text: (it.code + " " + it.name).toLowerCase()
        }))
      : Object.keys(d.products).sort().map((id) => ({
          code: id, name: d.products[id].name, mid: id,
          text: (id + " " + d.products[id].name).toLowerCase()
        }));
    const index = {};
    items.forEach((it) => { index[it.code] = it; });
    this._products = d.products; // 重序列仅在内存，避免 2.5MB 进入 setData
    this.setData({
      index, items, min: d.min, max: d.max,
      cnt: items.length, cntnav: Object.keys(d.products).length,
      srcName: "TotalReturnIndex"
    });
  },

  // ---------- 产品搜索 / 下拉 ----------
  onSearchInput(e) {
    const val = e.detail.value;
    this.setData({ codeText: val });
    this.renderList(val);
    this.onCodeChange();
  },
  onFocus() {
    this.renderList(this.data.codeText);
  },
  onBlur() {
    setTimeout(() => { this.setData({ showList: false }); }, 150);
  },
  renderList(val) {
    const q = (val || "").trim().toLowerCase();
    const hits = q
      ? this.data.items.filter((it) => it.text.indexOf(q) >= 0)
      : this.data.items.slice();
    this.setData({ hits, showList: true });
  },
  onPick(e) {
    const idx = e.currentTarget.dataset.index;
    const it = this.data.hits[idx];
    if (!it) return;
    const label = it.code + " — " + it.name;
    this.setData({ codeText: label, selectedLabel: label, showList: false });
    this.onCodeChange();
  },

  resolveInput(raw) {
    raw = (raw || "").trim();
    if (!raw) return null;
    if (raw.indexOf("—") >= 0) raw = raw.split("—")[0].trim();
    const it = this.data.index[raw];
    return it ? { mid: it.mid, item: it } : null;
  },

  onCodeChange() {
    const res = this.resolveInput(this.data.codeText);
    if (!res) { this.setData({ prange: "" }); return; }
    const rows = this._products[res.mid].d;
    const lo = rows[0][0], hi = rows[rows.length - 1][0];
    this.setData({
      prange: "（" + res.item.name + " · 数据区间 " + lo + " ~ " + hi + "）",
      dateMin: lo, dateMax: hi
    });
    if (this.data.activeChip) {
      this.applyRange(this.data.activeChip);
      if (this.resolveInput(this.data.codeText)) this.calc();
    } else {
      this.setData({ "result.show": false, error: "" });
    }
  },

  // ---------- 日期 ----------
  onStartChange(e) {
    this.setData({ startDate: e.detail.value, activeChip: null });
  },
  onEndChange(e) {
    this.setData({ endDate: e.detail.value, activeChip: null });
  },

  // ---------- 年化 ----------
  onAnnToggle(e) {
    this.setData({ annOn: e.detail.value });
  },
  onAnnBase(e) {
    const idx = e.detail.value;
    this.setData({ annBaseIdx: idx, annBase: this.data.annBases[idx].value });
  },

  // ---------- 快捷区间 ----------
  applyRange(kind) {
    const res = this.resolveInput(this.data.codeText);
    let base = this.data.max, floor = null;
    if (res) {
      const rows = this._products[res.mid].d;
      base = rows[rows.length - 1][0];
      floor = rows[0][0];
    }
    let want;
    if (kind === "ytd") want = base.slice(0, 4) + "-01-01";
    else if (kind.endsWith("m")) want = calc.shiftMonths(base, -parseInt(kind, 10));
    else want = calc.shiftYears(base, -parseInt(kind, 10));

    let start = want;
    let chipNote = "";
    if (floor && start < floor) {
      start = floor;
      const def = CHIP_DEFS.find((x) => x.key === kind);
      const label = def ? def.label : kind;
      chipNote = "所选「" + label + "」区间超出该产品数据范围，起始日期已自动调整为 "
        + floor + "（该产品最早数据日）。";
    }
    this.setData({ startDate: start, endDate: base, activeChip: kind });
    this._chipNote = chipNote;
  },

  onChip(e) {
    const kind = e.currentTarget.dataset.key;
    const res = this.resolveInput(this.data.codeText);
    if (!res) { this.setData({ error: "请先选择产品。" }); return; }
    this.applyRange(kind);
    this.calc();
  },

  // ---------- 计算 ----------
  calc() {
    this.setData({ error: "" });
    const res = this.resolveInput(this.data.codeText);
    if (!res) { this.setData({ error: "未找到该产品代码，请在搜索框中选择或检查输入。" }); return; }
    const rows = this._products[res.mid].d;
    const startRaw = this.data.startDate;
    if (!startRaw) { this.setData({ error: "请填写起始日期。" }); return; }
    const endRaw = this.data.endDate || rows[rows.length - 1][0];
    if (startRaw > endRaw) { this.setData({ error: "起始日期不能晚于截止日期。" }); return; }

    const o = calc.computeReturn(rows, startRaw, endRaw);
    const sd = o.sd, sv = o.sv, ed = o.ed, ev = o.ev, r = o.r, days = o.days;

    let annTxt = "";
    if (this.data.annOn && days > 0) {
      const a = calc.annualized(r, days, this.data.annBase);
      if (a !== null) {
        const baseLabel = this.data.annBase === "actual" ? "实际天数" : (this.data.annBase + "天");
        annTxt = "年化(" + baseLabel + ") " + calc.fmtPct(a);
      }
    }
    let note = this._chipNote || "";
    if (sd !== startRaw || ed !== endRaw) {
      note = (note ? note + " " : "")
        + "提示：所填日期无对应数据，已取不晚于该日的最近交易日数据（往前取）参与计算。";
    }
    this.setData({
      result: {
        show: true,
        name: res.item.name, code: res.item.code,
        rate: calc.fmtPct(r),
        rateClass: r >= 0 ? "up" : "down",
        ann: annTxt,
        days: days,
        sd: sd + (sd !== startRaw ? "（往前取用）" : ""),
        sv: calc.fmtVal(sv),
        ed: ed + (ed !== endRaw ? "（往前取用）" : ""),
        ev: calc.fmtVal(ev),
        note: note
      }
    });
  }
});
