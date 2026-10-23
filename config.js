// 数据端点配置
//
// 开发/兜底（默认）：复用现有 GitHub Pages 自动同步的 JSON。
//   注意：开发期在微信开发者工具「详情 → 本地设置」勾选「不校验合法域名…」后即可请求 github.io。
//
// 生产环境：把 DATA_URL 改为你自有已备案域名上的云函数地址，例如：
//   'https://api.你的域名.com/qdii-data'
// 然后在小程序后台「开发管理 → 服务器域名 → request 合法域名」加入该域名。
// 云函数代码与部署步骤见 cloudflare-worker/README.md（已内置 Cloudflare Workers 模板，
// 腾讯云 SCF / 阿里云 FC 等写法类似）。
module.exports = {
  DATA_URL: "https://invictus-maneo.github.io/qdii-return/data.json"
};
