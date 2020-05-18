const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");
const gulpInstall = require("gulp-install");
const formatDate = require("../../utils/date");
const { warn } = require("../../utils/logger");

/**
 * 在输出目录下安装依赖包并构建npm
 */
const installAndBuilder = async (opt, userOptions, args) => {
  /** 输出目录下的package.json */
  const packageJsonPath = path.join(opt.outputDir, "package.json");

  /** 项目根目录下的package.json */
  const srcPackageJsonPath = path.join(opt.context, "package.json");

  const CLI = require("cheers-mp-devtools-ci");
  const instance = new CLI(userOptions.compiler.options.devToolsDir, userOptions.compiler.options.version);
  await instance.init();

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
    try {
      const res = await instance.buildNPM(opt.context);
      console.log(res.stderr);
      console.log(res.stdout);
    } catch (error) {
      warn("CI构建NPM失败，请手动点击开发者工具的“构建NPM”按钮。失败原因：" + JSON.stringify(error));
    }
  }
  buildNPM.displayName = "调用本地开发者工具的“构建NPM”服务";

  async function open() {
    try {
      const res = await instance.open(opt.context);
      console.log(res.stderr);
      console.log(res.stdout);
    } catch (error) {
      warn("打开失败，请手动进行操作。失败原因：" + JSON.stringify(error));
    }
  }
  open.displayName = "在本地开发者工具中打开项目";

  async function refreshFileCache() {
    try {
      const res = await instance.resetFileutils(opt.context);
      console.log(res.stderr);
      console.log(res.stdout);
    } catch (error) {
      warn("CI缓存清除失败,您可手动点击开发者工具的“清除文件缓存”按钮。失败原因：" + JSON.stringify(error));
    }
  }
  refreshFileCache.displayName = "重置工具内部文件缓存";

  async function upload() {
    const res = await instance.upload(opt.context, formatDate(new Date(), "yyyy.MM.ddhhmmss"), "自动构建上传测试");
    console.log(res.stderr);
    console.log(res.stdout);
  }
  upload.displayName = "调用本地开发者工具的“上传小程序代码”服务";

  const taskSync = [createPackageJSON, installDependencies, buildNPM];
  if (args.open) {
    taskSync.push(open);
  }
  if (args.upload) {
    taskSync.push(upload);
  }

  taskSync.push(refreshFileCache);

  return gulp.series(...taskSync);
};

module.exports = installAndBuilder;
