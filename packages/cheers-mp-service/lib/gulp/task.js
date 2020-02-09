const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");

const less = require("gulp-less");
const insert = require("gulp-insert");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");

const ts = require("gulp-typescript");
const replaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const gulpInstall = require("gulp-install");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const httpServer = require("../httpServer");

const logEvents = require("./events");
const { info, log, warn } = require("../../utils/logger");

logEvents(gulp);

const cleaner = path => {
  function clean() {
    return fs.remove(path);
  }
  clean.displayName = "清空输出目录";
  return clean;
};

const lessCompiler = (src, dist) => {
  function compileLess() {
    return (
      gulp
        .src(`${src}/**/*.less`)
        .pipe(sourcemaps.init())
        .pipe(less())
        // .pipe(postcss())
        .pipe(
          insert.transform((contents, file) => {
            if (!file.path.includes("src" + path.sep + "common")) {
              contents = `@import '/common/index.wxss';${contents}`;
            }
            return contents;
          })
        )
        .pipe(rename({ extname: ".wxss" }))
        .pipe(sourcemaps.write())
        .pipe(gulp.dest(dist))
    );
  }
  compileLess.displayName = "编译less";
  return compileLess;
};

const tsCompiler = (src, dist, config) => {
  function compileTs() {
    // await exec(`npx ../node_modules/typescript/lib/tsc.js -p ${config}`);
    // await exec(`npx tscpaths -p ${config} -s ../src -o ${dist}`);
    // TODO 如果ts 的target 是es5，则输出sourcemaps
    const env = replaces(resolveClientEnv());
    return (
      gulp
        .src(`${src}/**/*.ts`, { since: gulp.lastRun(tsCompiler) })
        // .pipe(sourcemaps.init())
        .pipe(ts.createProject(config)())
        .pipe(env)
        // .pipe(sourcemaps.write())
        .pipe(gulp.dest(dist))
    );
  }
  compileTs.displayName = "编译typescript";
  return compileTs;
};

const copier = (src, dist, ext) => {
  function copy() {
    return gulp.src(`${src}/**/*.${ext}`).pipe(gulp.dest(dist));
  }
  copy.displayName = "拷贝" + ext;
  return copy;
};

const staticCopier = (src, dist) => {
  return gulp.parallel(copier(src, dist, "wxml"), copier(src, dist, "wxs"), copier(src, dist, "wxss"), copier(src, dist, "json"));
};

function createTask(context, userOptions, args) {
  console.log(args);
  /** 源码所在目录 */
  const srcDir = path.join(context, "src");

  /** 编译后输出目录 */
  const outputDir = path.join(context, "dist");

  /** tsconfig.json 配置 */
  const tsConfig = path.join(context, "tsconfig.json");

  /**
   * 在输出目录下安装依赖包并构建npm
   */
  const installAndBuilder = () => {
    const packageJsonPath = path.join(outputDir, "package.json");
    const srcPackageJsonPath = path.join(context, "package.json");
    const projectRoot = context;
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

  const watch = async () => {
    gulp.watch("src/**/*.ts", tsCompiler(srcDir, outputDir, tsConfig));
    gulp.watch(`src/**/*.less`, lessCompiler(srcDir, outputDir));
    gulp.watch(`src/**/*.wxml`, copier(srcDir, outputDir, "wxml"));
    gulp.watch(`src/**/*.wxs`, copier(srcDir, outputDir, "wxs"));
    gulp.watch(`src/**/*.wxss`, copier(srcDir, outputDir, "wxs"));
    gulp.watch(`src/**/*.json`, copier(srcDir, outputDir, "json"));
    log();
    info("正在监听文件改动...");
  };
  const taskArr = [cleaner(outputDir), gulp.parallel(lessCompiler(srcDir, outputDir), tsCompiler(srcDir, outputDir, tsConfig), staticCopier(srcDir, outputDir)), installAndBuilder()];
  if (args.watch) {
    taskArr.push(watch);
  }
  const task = gulp.series(taskArr);
  return task;
}
module.exports = {
  createTask
};
