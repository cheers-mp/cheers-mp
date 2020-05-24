const content = `
import Router, { RouteConfig } from "cheers-mp-router";

const routeConfigList: RouteConfig[] = [
    { name: "entry", path: "pages/entry/index" },
    { name: "store-home", path: "pages/tabbar/store-home/index", isTab: true },
    { name: "update-address-for-order", path: "pages/user/update-address-for-order/index", meta: { authType: 2 } },
    { name: "order-confirmation", path: "pages/order/confirmation/index" },
    { name: "test", path: "packageA/pages/test/index" }
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

// router.afterEach((current, from) => {
//     console.log("跳转成功，当前路由:", current);
//     console.log("之前路由:", from);
// });
export default router;


`;
const ast = require("@babel/parser").parse(content, {
  experimentalDecorators: true,
  experimentalAsyncFunctions: true,
  sourceType: "module",
  plugins: [
    "typescript",
    ["decorators", { decoratorsBeforeExport: true }],
    "classProperties",
    "classPrivateProperties",
  ],
});

const traverse = require("@babel/traverse").default;
// TODO 支持子包分包
function getPath() {
  const paths = [];
  traverse(ast, {
    ArrayExpression: function (path) {
      // console.log(path);
      for (let index = 0; index < path.node.elements.length; index++) {
        const element = path.node.elements[index];
        if (element.type !== "ObjectExpression") {
          return;
        }
        const prop = element.properties.find((p) => {
          // console.log(p);
          return p.key.name === "path";
        });
        if (prop) {
          paths.push(prop.value.value);
        }
      }
    },
  });
  return paths;
  // console.log("变量：", paths);
}

let allPath = getPath();
// 去重
allPath = Array.from(new Set(allPath));

/** 子包前缀 */
const subPkgNamePrefix = "package";
/** 独立子包前缀 */
const ISubPkgNamePrefix = "ipackage";

const subPkgMap = new Map();
const mainPackage = allPath.filter((pagePath) => {
  const isSubPkg = pagePath.startsWith(subPkgNamePrefix);
  const isIndependentSubpkg = pagePath.startsWith(ISubPkgNamePrefix);
  if (isSubPkg || isIndependentSubpkg) {
    const packageName = pagePath.substr(0, pagePath.indexOf("/"));
    console.log("子包名字：", packageName);
    pagePath = pagePath.replace(packageName + "/", "");
    if (subPkgMap.get(packageName)) {
      subPkgMap.get(packageName).pages.push(pagePath);
    } else {
      subPkgMap.set(packageName, {
        root: packageName,
        pages: [pagePath],
        independent: isIndependentSubpkg,
      });
    }
    return false;
  }
  return true;
});
console.log("主包：", mainPackage);
console.log("子包：", [...subPkgMap.values()]);

const appJSONPath = "./src/app.json";
const appJSON = require(appJSONPath);
const writeJsonFile = require("write-json-file");
appJSON.pages = mainPackage;
appJSON.subpackages = [...subPkgMap.values()];
console.log(appJSON);
writeJsonFile(appJSONPath, appJSON, { detectIndent: true });
