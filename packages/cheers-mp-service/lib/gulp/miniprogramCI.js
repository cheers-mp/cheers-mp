const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");
const gulpInstall = require("gulp-install");
const formatDate = require("../../utils/date");

/**
 * 在输出目录下安装依赖包并构建npm
 */
const installAndBuilder = (opt, userOptions, args) => {
  /** 输出目录下的package.json 路径 */
  const distPackageJsonPath = path.join(opt.outputDir, "package.json");

  /** 项目根目录下的package.json */
  const srcPackageJson = require(path.join(opt.context, "package.json"));

  /** 项目根目录下的小程序开发者工具配置文件 */
  const projectConfigJson = require(path.join(opt.context, "project.config.json"));

  const ciOpt = userOptions.compiler.options;

  const ci = require("miniprogram-ci");
  if (!ciOpt.appid) {
    ciOpt.appid = projectConfigJson.appid;
  }
  if (!ciOpt.projectPath) {
    ciOpt.projectPath = opt.outputDir;
  }
  const project = new ci.Project(ciOpt);

  async function createPackageJSON() {
    const dependencies = srcPackageJson.dependencies || {};
    return fs.outputFile(distPackageJsonPath, JSON.stringify({ dependencies }, null, "\t"), { encoding: "UTF-8" });
  }
  createPackageJSON.displayName = "输出目录下生成 package.json";

  function installDependencies() {
    return gulp.src(distPackageJsonPath).pipe(gulpInstall({ production: true }));
  }
  installDependencies.displayName = "输出目录下安装依赖";

  async function buildNPM() {
    const warning = await ci.packNpm(project, {
      reporter: infos => {
        console.log(infos);
      }
    });
    return Promise.resolve(warning);
  }
  buildNPM.displayName = "调用CI包的“构建NPM”服务";

  async function upload() {
    return ci.upload({
      project,
      version: formatDate(new Date(), "yyyy.MM.ddhhmmss"),
      desc: "ci机器人自动上传于" + new Date().toLocaleString(),
      setting: projectConfigJson.setting,
      onProgressUpdate: console.log
    });
  }
  upload.displayName = "调用CI包的“上传代码”服务";

  const taskSync = [createPackageJSON, installDependencies, buildNPM];
  if (args.upload) {
    taskSync.push(upload);
  }

  return gulp.series(...taskSync);
};

module.exports = installAndBuilder;
