// QDII 区间收益率计算器 —— 小程序入口
const { DATA_URL, USE_CLOUD, CLOUD_ENV } = require("./config.js");

App({
  globalData: {
    // 数据端点：USE_CLOUD=false 时生效（开发期需在开发者工具勾选「不校验合法域名」；
    // 生产环境请改为你的自有已备案域名上的云函数地址，见 cloudflare-worker/README.md）
    dataUrl: DATA_URL,
    // 是否走微信云开发（免备案域名、免白名单，免费，推荐）
    useCloud: USE_CLOUD,
    cloudEnv: CLOUD_ENV,
    DATA: null
  },
  onLaunch() {
    if (this.globalData.useCloud && typeof wx !== "undefined" && wx.cloud) {
      wx.cloud.init({ env: this.globalData.cloudEnv, traceUser: true });
    }
  }
});
