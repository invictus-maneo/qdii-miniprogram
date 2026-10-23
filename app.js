// QDII 区间收益率计算器 —— 小程序入口
const { DATA_URL } = require("./config.js");

App({
  globalData: {
    // 数据端点：默认复用 GitHub Pages 自动同步的 JSON（开发期需在开发者工具勾选「不校验合法域名」）
    // 生产环境请改为你的自有已备案域名上的云函数地址（见 cloudflare-worker/README.md）
    dataUrl: DATA_URL,
    DATA: null
  },
  onLaunch() {}
});
