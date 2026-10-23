// 数据端点配置
//
// 两种数据来源模式（见 CLOUD.md 与 cloudflare-worker/README.md）：
//   USE_CLOUD = true  -> 走微信云开发云函数（免备案域名、免白名单，基础版免费，推荐；见 CLOUD.md）
//   USE_CLOUD = false -> 走自有域名云函数 / 直接拉 Pages（需备案域名，或开发者工具勾选「不校验合法域名」）
module.exports = {
  // 是否走微信云开发（免备案域名、免白名单，免费，推荐）
  USE_CLOUD: true,

  // 微信云开发环境 ID（在开发者工具「云开发」控制台获取）；USE_CLOUD=true 时必填
  CLOUD_ENV: "你的云开发环境ID",

  // 非云开发模式下的数据端点（USE_CLOUD=false 时生效）
  //   开发期：在开发者工具「详情 → 本地设置」勾选「不校验合法域名…」即可请求 github.io
  //   生产期：改为你自有已备案域名上的云函数地址，例如 'https://api.你的域名.com/qdii-data'
  DATA_URL: "https://invictus-maneo.github.io/qdii-return/data.json"
};
