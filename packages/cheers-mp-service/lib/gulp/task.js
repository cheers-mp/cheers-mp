const gulp = require("gulp");
const path = require("path");
const fs = require("fs-extra");

const less = require("gulp-less");
const insert = require("gulp-insert");
const rename = require("gulp-rename");
const sourcemaps = require("gulp-sourcemaps");

const cdnify = require("gulp-cdnify");

const gulpif = require("gulp-if");

const ts = require("gulp-typescript");
const replaces = require("gulp-replaces");
const resolveClientEnv = require("../../utils/resolveClientEnv");
const gulpInstall = require("gulp-install");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const httpServer = require("../httpServer");

const logEvents = require("./events");
const { info, log, warn, done } = require("../../utils/logger");

logEvents(gulp);

const IMAGE_EXT = "{jpg,jpeg,png,gif}";

const cleaner = path => {
  function clean() {
    return fs.remove(path);
  }
  clean.displayName = "清空输出目录";
  return clean;
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

function createTask(context, userOptions, args, command) {
  /** 源码所在目录 */
  const srcDir = path.join(context, "src");

  /** 编译后输出目录 */
  const outputDir = path.join(context, "dist");

  /** tsconfig.json 配置 */
  const tsConfig = path.join(context, "tsconfig.json");

  /** 项目根目录下的package.json */
  const srcPackageJsonPath = path.join(context, "package.json");

  const isUseOSS = userOptions.oss && userOptions.oss.options;
  let imageOperator, prepareImage;
  if (isUseOSS) {
    imageOperator = require("cheers-mp-images")({
      target: srcDir,
      proxy: {
        port: 8888
      },
      oss: userOptions.oss.options
    });
    prepareImage = command === "serve" ? imageOperator.proxy : imageOperator.upload;
    prepareImage.displayName = "预处理图片";
  }

  const rewriter = function(url) {
    if (/^(https?):\/\//.test(url) || url.indexOf("/LOCAL_")) {
      return url;
    }
    if ([".jpg", ".jpeg", ".png", ".gif"].includes(path.extname(url))) {
      try {
        return command === "serve" ? imageOperator.getProxyURI(url) : imageOperator.getNetURI(path.join(srcDir, url));
      } catch (error) {
        return url;
      }
    }
    return url;
  };

  const copier = (src, dist, ext) => {
    function copy() {
      return gulp
        .src(`${src}/**/*.${ext}`)
        .pipe(
          gulpif(
            "wxml" === ext && isUseOSS,
            cdnify({
              html: {
                "image[src]": "src"
              },
              rewriter
            })
          )
        )
        .pipe(gulp.dest(dist));
    }
    copy.displayName = "拷贝" + ext;
    return copy;
  };

  const copyLOCAL = () => {
    return gulp.src(`${srcDir}/**/LOCAL_*.${IMAGE_EXT}`).pipe(gulp.dest(outputDir));
  };
  copyLOCAL.displayName = "拷贝LOCAL_前缀的图片";

  const staticCopier = () => {
    const copyTask = [
      copier(srcDir, outputDir, "wxml"),
      copier(srcDir, outputDir, "wxs"),
      copier(srcDir, outputDir, "wxss"),
      copier(srcDir, outputDir, "json")
    ];
    // 不使用oss拷贝所有图片，开启oss则只拷贝文件名带有LOCAL_前缀的图片
    if (!isUseOSS) {
      copyTask.push(copier(srcDir, outputDir, IMAGE_EXT));
    } else {
      copyTask.push(copyLOCAL);
    }
    return gulp.parallel(...copyTask);
  };

  function compileLess() {
    return (
      gulp
        .src(`${srcDir}/**/*.less`)
        .pipe(less())
        // .pipe(postcss())
        // .pipe(
        //   insert.transform((contents, file) => {
        //     if (!file.path.includes("src" + path.sep + "common")) {
        //       contents = `@import '/common/index.wxss';${contents}`;
        //     }
        //     return contents;
        //   })
        // )
        .pipe(
          gulpif(
            isUseOSS,
            cdnify({
              rewriter
            })
          )
        )
        .pipe(rename({ extname: ".wxss" }))
        .pipe(gulp.dest(outputDir))
    );
  }
  compileLess.displayName = "编译less";

  /**
   * 在输出目录下安装依赖包并构建npm
   */
  const installAndBuilder = () => {
    const packageJsonPath = path.join(outputDir, "package.json");
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

  /** 通过小程序开发者工具上传 */
  const uploadPreviewVersion = async () => {
    const packageJson = await fs.readJson(srcPackageJsonPath);
    const resultPath = context + path.sep + "upload-result.json";
    await httpServer.upload(
      context,
      packageJson.version || "1.0.0",
      "自动上传版本" + new Date().toLocaleString(),
      resultPath
    );
    fs.readJson(resultPath).then(result => {
      fs.remove(resultPath);
      done(`本次上传: ${result.size.total} kb`);
    });
  };
  uploadPreviewVersion.displayName = "上传小程序代码";

  const watch = async () => {
    gulp.watch("src/**/*.ts", tsCompiler(srcDir, outputDir, tsConfig));
    gulp.watch(`src/**/*.less`, compileLess);
    gulp.watch(`src/**/*.wxml`, copier(srcDir, outputDir, "wxml"));
    gulp.watch(`src/**/*.wxs`, copier(srcDir, outputDir, "wxs"));
    gulp.watch(`src/**/*.wxss`, copier(srcDir, outputDir, "wxs"));
    gulp.watch(`src/**/*.json`, copier(srcDir, outputDir, "json"));
    if (!isUseOSS) {
      gulp.watch(`src/**/*.${IMAGE_EXT}`, copier(srcDir, outputDir, IMAGE_EXT));
    } else {
      gulp.watch(`src/**/LOCAL_*.${IMAGE_EXT}`, copyLOCAL);
    }
    log();
    info("正在监听文件改动...");
  };
  const taskArr = [
    cleaner(outputDir),
    gulp.parallel(compileLess, tsCompiler(srcDir, outputDir, tsConfig), staticCopier()),
    installAndBuilder()
  ];
  if (isUseOSS) {
    taskArr.splice(1, 0, prepareImage);
  }
  if (args.upload) {
    taskArr.push(uploadPreviewVersion);
  }
  if (args.watch) {
    taskArr.push(watch);
  }

  const task = gulp.series(taskArr);
  return task;
}
module.exports = {
  createTask
};
