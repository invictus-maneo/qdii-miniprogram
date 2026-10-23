// 微信云开发云函数：拉取 QDII data.json 并返回给小程序前端
//
// 关键点：云函数「服务端」发起的请求不受小程序「request 合法域名」白名单与备案限制，
//         因此用此方案可免备案域名、免白名单，且云开发基础版免费。
// 前端通过 wx.cloud.callFunction({ name: 'getQdiiData' }) 调用，结果在 res.result 中。
const cloud = require("wx-server-sdk");
cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

// 数据源：复用现有 GitHub Pages 自动同步的 JSON（每天随晨星数据更新，零额外数据源）
const SRC = "https://invictus-maneo.github.io/qdii-return/data.json";

exports.main = async (event, context) => {
  try {
    // 云函数运行环境（Node 18+）自带 fetch；若运行环境较旧，请 npm i node-fetch 后 require
    const res = await fetch(SRC);
    if (!res.ok) return { ok: false, err: "upstream http " + res.status };
    const data = await res.json();
    return { ok: true, data };
  } catch (e) {
    return { ok: false, err: e.message };
  }
};
