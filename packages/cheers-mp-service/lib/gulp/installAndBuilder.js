const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");
const gulpInstall = require("gulp-install");
const util = require("util");
const exec = util.promisify(require("child_process").exec);

const httpServer = require("../httpServer");

/**
 * 在输出目录下安装依赖包并构建npm
 */
const installAndBuilder = (opt, userOptions) => {
  /** 输出目录下的package.json */
  const packageJsonPath = path.join(opt.outputDir, "package.json");

  /** 项目根目录下的package.json */
  const srcPackageJsonPath = path.join(opt.context, "package.json");

  const projectRoot = opt.context;

  async function createPackageJSON() {
    const packageJson = await fs.readJson(srcPackageJsonPath);
    const dependencies = packageJson.dependencies || {};
    return fs.outputFile(packageJsonPath, JSON.stringify({ dependencies }, null, "\t"), { encoding: "UTF-8" });
  }
  createPackageJSON.displayName = "输出目录下生成 package.json";

  function installDependencies() {
    return gulp.src(packageJsonPath).pipe(gulpInstall({ production: true }));
  }
  installDependencies.displayName = "输出目录下安装依赖";

  async function buildNPM() {
    // 如果用户配置了 developerToolsDirectory 选项，则直接调用命令行编译，否则调用http server 编译
    // const result = await exec('"C:\\Program Files (x86)\\Tencent\\微信web开发者工具\\cli.bat" --build-npm "C:\\project\\com\\JK724.XCX.WechatShopping"')
    if (userOptions.developerToolsDirectory) {
      const isExists = await fs.pathExists(userOptions.developerToolsDirectory);
      if (!isExists) {
        warn("'developerToolsDirectory'选项配置的路径错误，无法调用cli构建NPM;将尝试使用http Server构建NPM...");
        return httpServer.buildNPM(projectRoot);
      } else {
        return exec(`"${userOptions.developerToolsDirectory + path.sep}cli.bat" --build-npm "${projectRoot}"`);
      }
    } else {
      return httpServer.buildNPM(projectRoot);
    }
  }
  buildNPM.displayName = "调用开发者工具的“构建NPM”服务";

  return gulp.series(createPackageJSON, installDependencies, buildNPM);
};

module.exports = installAndBuilder;
