const gulp = require("gulp");
const fsx = require("fs-extra");
const traverse = require("@babel/traverse").default;
const writeJsonFile = require("write-json-file");
const parse = require("@babel/parser").parse;

module.exports = (api, userOptions) => {
  if (!userOptions.pluginOptions || !userOptions.pluginOptions.router) return;
  const routeConfigPath = userOptions.pluginOptions.router;
  function parseRoute() {
    const parseContext = fsx.readFileSync(routeConfigPath, { encoding: "utf-8" });
    // console.log("插件被加载了", );
    // gulp.src(routeConfigPath)
    const ast = parse(parseContext, {
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

    let allPath = [];
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
            allPath.push(prop.value.value);
          }
        }
      },
    });
    // console.log("变量：", paths);

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
        // console.log("子包名字：", packageName);
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
    // console.log("主包：", mainPackage);
    // console.log("子包：", [...subPkgMap.values()]);

    const appJSONPath = api.resolve("./src/app.json");

    const appJSON = fsx.readJSONSync(appJSONPath, { encoding: "utf-8" });

    appJSON.pages = mainPackage;
    appJSON.subpackages = [...subPkgMap.values()];
    // console.log(appJSON);
    writeJsonFile.sync(appJSONPath, appJSON, { detectIndent: true });
    // console.log("编译编译完成");
  }
  parseRoute();
  if (process.env.NODE_ENV === "development") {
    gulp.watch(routeConfigPath, parseRoute);
  }
};
