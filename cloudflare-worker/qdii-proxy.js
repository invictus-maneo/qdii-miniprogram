// Cloudflare Worker —— QDII 数据代理（绕开小程序 request 域名白名单限制）
//
// 原理：
//   小程序只能请求「小程序后台白名单内的已备案 HTTPS 域名」。github.io 未备案，无法加入白名单。
//   解法：把数据请求改到你自有已备案域名下的云函数；云函数再去拉 GitHub Pages 的 data.json 并原样返回。
//   小程序 -> https://你的域名/qdii-data（白名单内）-> Worker -> github.io/data.json -> 返回 JSON。
//
// 部署：见同目录 README.md（wrangler deploy + 绑自有域名 + 小程序后台加白名单）。

// 数据源：复用现有 GitHub Pages 自动同步的 JSON（每天随晨星数据更新，零额外数据源）
const SRC = "https://invictus-maneo.github.io/qdii-return/data.json";

export default {
  async fetch(request) {
    // 仅允许 GET
    if (request.method !== "GET") {
      return new Response("Method Not Allowed", { status: 405 });
    }
    try {
      // cf.cacheTtl 让边缘节点缓存 1 小时，降低回源压力
      const upstream = await fetch(SRC, { cf: { cacheTtl: 3600 } });
      if (!upstream.ok) {
        return new Response("upstream error: " + upstream.status, { status: 502 });
      }
      const body = await upstream.text();
      return new Response(body, {
        status: 200,
        headers: {
          "Content-Type": "application/json; charset=utf-8",
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=300"
        }
      });
    } catch (e) {
      return new Response("proxy error: " + e.message, { status: 500 });
    }
  }
};
