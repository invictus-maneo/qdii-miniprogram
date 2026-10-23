# QDII 小程序 · 免域名免费方案（微信云开发）

没有已备案域名？用**微信云开发**即可完全绕开「域名备案 + request 白名单」限制，且基础版免费。

原理：小程序前端用 `wx.cloud.callFunction()` 调用云函数，请求走微信内网，**不计入 request 合法域名白名单**；
云函数**服务端**去拉 GitHub Pages 的 `data.json`（服务端请求不受备案限制），再把数据回传前端。

---

## 一、前置（均免费）
1. **注册一个真实小程序 AppID**（个人类型即可，免费，几分钟）：
   mp.weixin.qq.com → 注册 → 个人 → 拿到 AppID。
   ⚠️ 测试号（touristappid）**不能**开通云开发，必须用小程真正的 AppID。
2. 把 `project.config.json` 里的 `appid` 改成你的真实 AppID。
3. 开发者工具内「云开发」→ 开通（选免费/基础环境）→ 记下**环境 ID**。

## 二、部署云函数
1. 在 `miniprogram/config.js` 填入环境 ID：
   ```js
   USE_CLOUD: true,
   CLOUD_ENV: "你的云开发环境ID"
   ```
2. 在开发者工具左侧「云开发 → 云函数」→ 新建云函数 `getQdiiData`，把
   `miniprogram/cloudfunctions/getQdiiData/` 下的 `index.js` + `package.json` 复制进去，
   右键「上传并部署：云端安装依赖」。
   （或直接在 `cloudfunctions/getQdiiData/` 目录右键「上传并部署」。）
3. 验证：云函数测试调用，应返回 `{ ok: true, data: { products: {...}, items: [...] } }`。

## 三、编译运行
- 直接编译小程序即可。前端会自动 `wx.cloud.callFunction({ name: 'getQdiiData' })` 取数，
  **不再需要**「不校验合法域名」，可正常提审发布。

## 四、数据更新
云函数每次实时回源 GitHub Pages 的 `data.json`，而该文件由既有流水线每天随晨星自动刷新。
因此数据每天自动最新，云函数代码一次部署后无需改动。

## 五、费用与限额
- 云开发有**免费额度**（基础版），个人轻量访问通常 0 元。
- 建议在云开发控制台设置「余额告警」，避免极端流量产生费用。
- 若日后访问量很大，可改为「云函数定时把 data.json 同步进云数据库」，前端读数据库，进一步省云函数调用次数。

## 六、与「自有域名」方案的关系
- 本方案（云开发）**无需任何域名**，适合没域名、想免费合规上架的你。
- 若你以后有了已备案域名，可切到 `cloudflare-worker/README.md` 的「自有域名 + 云函数」方案：
  把 `config.js` 的 `USE_CLOUD` 改为 `false`、`DATA_URL` 改为你的云函数地址即可，前端代码无需再改。
