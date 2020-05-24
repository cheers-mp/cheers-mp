# `cheers-mp-plugin-router`

babal AST 解析路由配置，提取 path 到 app.json，搭配[cheers-mp-router](https://github.com/bigmeow/cheers-mp-router)使用

## 使用

在 `cheers-mp` 脚手架中安装即启用

```bash
npm i cheers-mp-plugin-router -D
```

## 示例

假设路由配置文件所在文件路径是: `src/service/router.ts`
router.ts 文件中有如下代码定义:

```ts
import Router, { RouteConfig } from "cheers-mp-router";

const routeConfigList: RouteConfig[] = [
  // 主包路由
  { name: "entry", path: "pages/entry/index" },
  { name: "store-home", path: "pages/tabbar/store-home/index", isTab: true },
  // 子包 packageA
  { name: "test", path: "packageA/pages/test/index" },
  { name: "test2", path: "packageA/pages/test2/index" },
  // 独立子包 ipackageB
  { name: "test3", path: "ipackageB/pages/test3/index" },
];

const router = new Router({ routes: routeConfigList });
// router.beforeEach((to, from, next) => {
//     // console.log("当前路由", from);
//     // console.log("即将前往的路由", to);
//     // console.log("beforeEach1");
//     // setTimeout(() => {
//     //   if (to.name === "product-details") {
//     //     console.log("拦截前往商品详情的请求，转到搜索页面");
//     //     next({
//     //       name: "test"
//     //     });
//     //   } else {
//     //     console.log("放行");
//     //     next();
//     //   }
//     // }, 1500);
//     next();
// });

export default router;
```

那么我们可以在`cheers-config.js`配置：

```js
modeule.export = {
  pluginOptions: {
    //  路由配置文件所在的路径
    router: "src/service/router.ts",
  },
};
```

最终本插件会解析出来`router.ts`文件中的 path 配置为:

```json
{
  "pages": ["pages/entry/index", "pages/tabbar/store-home/index"],
  "subpackages": [
    {
      "root": "packageA",
      "pages": ["pages/test/index", "pages/test2/index"],
      "independent": false
    },
    {
      "root": "ipackageB",
      "pages": ["pages/test3/index"],
      "independent": true
    }
  ]
}
```

插件会将此配置更新到`src/app.json`文件中.

按照约定大于配置的原则：

- 如果`path`路径名字以`package` 开头，则此目录视为`子包`,例如：`{ name: "test", path: "packageA/pages/test/index" }`
- 如果`path`路径名字以`ipackage` 开头，则此目录视为`独立子包`,例如： `{ name: "test3", path: "ipackageB/pages/test3/index" }`
- 其他路由视为主包，例如：`{ name: "entry", path: "pages/entry/index" }`
