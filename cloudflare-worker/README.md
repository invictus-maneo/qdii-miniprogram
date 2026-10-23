# QDII 小程序 · 生产部署（自有域名 + 云函数）

小程序要求：所有 `wx.request` 的目标域名，必须是**已 ICP 备案的 HTTPS 域名**，且在**小程序后台白名单**内。
`github.io` 未备案，无法加入白名单——这就是需要"自有域名 + 云函数"的原因。

本目录给出 **Cloudflare Workers** 模板（免费、全球 CDN、绑域名最简单、代码平台无关）。
腾讯云 SCF / 阿里云 FC / Vercel Functions 写法类似（都是"拉 data.json + 返回 JSON + 绑域名"），核心逻辑见 `qdii-proxy.js`。

---

## 一、前置条件
1. 一个**已 ICP 备案**的域名（如 `你的域名.com`）。
2. 该域名的 DNS 能托管到 Cloudflare（免费版即可），或你用其他云商的域名+函数服务。
3. 安装 Node 与 Wrangler：`npm i -g wrangler`，并 `wrangler login`。

## 二、部署云函数
```bash
cd miniprogram/cloudflare-worker
# 编辑 wrangler.toml，填入 account_id，并启用 routes（改成你的域名）
wrangler deploy
```
部署后你会得到一个 `https://qdii-proxy.<sub>.workers.dev` 临时地址，先验证：
```bash
curl https://qdii-proxy.<sub>.workers.dev   # 应返回 data.json 内容（39 个产品等）
```

## 三、绑定自有域名
- 在 Cloudflare 控制台「Workers → qdii-proxy → Triggers → Custom Domains」添加 `api.你的域名.com`；
  或在 `wrangler.toml` 启用 `routes` 后重新 `wrangler deploy`。
- 验证：`curl https://api.你的域名.com/qdii-data` 返回 JSON。

## 四、小程序侧切换
1. 打开 `miniprogram/config.js`，把 `DATA_URL` 改为：
   ```js
   DATA_URL: "https://api.你的域名.com/qdii-data"
   ```
2. 微信公众平台 →「开发管理 → 开发设置 → 服务器域名 → request 合法域名」加入：
   ```
   https://api.你的域名.com
   ```
3. 重新编译小程序即可。此时**不再需要**勾选「不校验合法域名」，可正常提审发布。

## 五、数据更新
云函数实时回源 GitHub Pages 的 `data.json`，而 `data.json` 由既有流水线每天随晨星数据自动更新。
因此：数据每天自动最新，无需你维护云函数内容；只在新产品上线时重新 `wrangler deploy` 一次（代码本身不变）。

## 六、其他云平台等价实现
- **腾讯云 SCF**：建一个 Web 函数，入口拉 `SRC` 并 `return { statusCode:200, headers:{...}, body }`；绑 API 网关自定义域名（需备案）。
- **阿里云 FC**：同上，函数计算 + 自定义域名。
- **Vercel**：`/api/qdii-data.js` 导出 `export default async (req,res)=>{...}`；项目域名天然可用且无需备案（若面向国内用户仍建议备案域名）。
