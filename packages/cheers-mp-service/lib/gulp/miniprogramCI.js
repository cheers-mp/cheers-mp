const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");
const gulpInstall = require("gulp-install");
const deepmerge = require("deepmerge");
const formatDate = require("../../utils/date");

/**
 * 在输出目录下安装依赖包并构建npm
 */
const installAndBuilder = (opt, userOptions, args, useCache, writeCacheIdentifier) => {
  /** 输出目录下的package.json 路径 */
  const distPackageJsonPath = path.join(opt.outputDir, "package.json");

  /** 项目根目录下的package.json */
  const srcPackageJson = require(path.join(opt.context, "package.json"));

  /** 项目根目录下的小程序开发者工具配置文件 */
  const projectConfigJson = require(path.join(opt.context, "project.config.json"));

  const uploadSetting = getUploadConfig(projectConfigJson);

  const ciOpt = userOptions.compiler.options;

  const ci = require("miniprogram-ci");
  if (!ciOpt.appid) {
    ciOpt.appid = projectConfigJson.appid;
  }
  if (!ciOpt.projectPath) {
    ciOpt.projectPath = opt.context;
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
    /*  const warning = await ci.packNpmManually({
      packageJsonPath: opt.outputDir,
      miniprogramNpmDistDir: opt.outputDir,
    });
    console.log("\n构建结果：", warning); */
    const warning = await ci.packNpm(project, {
      reporter: (infos) => {
        console.log(infos);
      },
    });
    if (args.cache && typeof writeCacheIdentifier === "function") {
      await writeCacheIdentifier();
    }
    return Promise.resolve(warning);
  }
  buildNPM.displayName = "调用CI包的“构建NPM”服务";

  async function upload() {
    return ci.upload({
      project,
      version: formatDate(new Date(), "yyyy.MM.ddhhmmss"),
      desc: "ci机器人自动上传于" + new Date().toLocaleString(),
      setting: uploadSetting,
    });
  }
  upload.displayName = "调用CI包的“上传代码”服务";

  const taskSync = [];
  if (!useCache) {
    taskSync.push(createPackageJSON, installDependencies, buildNPM);
  }
  if (args.upload) {
    taskSync.push(upload);
  }

  return taskSync.length ? gulp.series(...taskSync) : [];
};

/**
 * 从配置文件中读取出上传需要的配置
 */
function getUploadConfig(projectConfigJson) {
  const uploadSetting = {};
  /** project.config.json的的setting字段和 miniprogram-ci 上传配置映射*/
  const mapping = {
    /** "es6 转 es5" */
    es6: "es6",
    /** "增强编译" */
    enhance: "es7",
    /** "上传时样式自动补全"  */
    postcss: "autoPrefixWXSS",
    /** "上传时压缩代码" */
    minified: "minify",
    /** "上传时进行代码保护" */
    uglifyFileName: "codeProtect",
  };
  for (const m in mapping) {
    uploadSetting[mapping[m]] = projectConfigJson.setting[m];
  }

  return deepmerge(
    {
      es6: true,
      es7: true,
      /** 上传时压缩 JS 代码 */
      minifyJS: true,
      /** 上传时压缩 WXML 代码 */
      minifyWXML: true,
      /**上传时压缩 WXSS 代码 */
      minifyWXSS: true,
      minify: true,
      codeProtect: false,
      autoPrefixWXSS: true,
    },
    uploadSetting
  );
}

module.exports = installAndBuilder;
