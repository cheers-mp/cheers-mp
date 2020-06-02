const path = require("path");
const fs = require("fs-extra");
const gulp = require("gulp");
const { log, done } = require("../../utils/logger");

const defaults = {
  cache: true,
  watch: false,
  upload: false,
};

module.exports = (api, userOptions) => {
  api.registerCommand(
    "build",
    {
      description: "生产构建",
      usage: "cheers-mp-cli-service build [options] [entry]",
      options: {
        "--mode": `指定 env 文件模式 (默认: production)`,
        "--no-cache": "不对输出目录做“安装依赖”、“构建NPM”操作的缓存，每次都启动编译都“安装依赖”，重新“构建NPM”",
        "--watch": "开启监听模式,默认关闭",
        "--upload": "编译结束后是否自动调用开发者工具上传，上传的小程序可在后台设置为体验版，默认关闭",
      },
    },
    async function build(args) {
      for (const key in defaults) {
        if (args[key] == null) {
          args[key] = defaults[key];
        }
      }

      const logEvents = require("../gulp/events");
      logEvents(gulp);
      log();

      const taskArr = [];
      const context = api.getCwd();
      const baseOpt = {
        context,

        /** 源码所在目录 */
        srcDir: path.join(context, "src"),

        /** 编译后输出目录 */
        outputDir: path.join(context, "dist"),

        /** tsconfig.json 配置 */
        tsConfig: path.join(context, "tsconfig.json"),

        isUseOSS: !!(userOptions.oss && userOptions.oss.options),

        rewriter: () => null,
      };

      // 判断是否启用缓存
      const srcPackageJson = api.getPkg();
      const { cacheDirectory, cacheIdentifier } = api.genCacheConfig("build-npm", srcPackageJson.dependencies || {});
      const result = await Promise.all([
        fs.pathExists(path.join(cacheDirectory, cacheIdentifier)),
        fs.pathExists(path.join(baseOpt.outputDir, "miniprogram_npm")),
        fs.pathExists(path.join(baseOpt.outputDir, "node_modules")),
      ]);
      const useCache = args.cache && !result.includes(false);
      /**
       * 创建缓存文件标志
       */
      const writeCacheIdentifier = async () => {
        await fs.emptyDir(cacheDirectory);
        await fs.createFile(path.join(cacheDirectory, cacheIdentifier));
      };

      // 清空输出目录
      taskArr.push(require("../gulp/clean")(baseOpt.outputDir, useCache));

      // 切换appid
      if (process.env.APPID) {
        await require("../gulp/switchAppid")(baseOpt.context);
      }

      if (baseOpt.isUseOSS) {
        // 预处理图片
        let imageOperator, prepareImage;
        // 处理文件内匹配到的图片url
        baseOpt.rewriter = (url) => {
          if (/^(https?):\/\//.test(url) || url.indexOf("/LOCAL_") > -1) {
            return url;
          }
          if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(path.extname(url).toLocaleLowerCase())) {
            try {
              return imageOperator.getNetURI(path.join(baseOpt.srcDir, url));
            } catch (error) {
              return url;
            }
          }
          return url;
        };
        imageOperator = await require("cheers-mp-images")({
          target: baseOpt.srcDir,
          proxy: {
            port: 8888,
          },
          oss: userOptions.oss,
        });
        prepareImage = imageOperator.upload;
        prepareImage.displayName = "上传项目中使用的图片到oss";
        taskArr.push(prepareImage);
      }

      // 其他并行编译任务
      const compilerTask = [
        { name: "less", ext: ".less", outputExt: ".wxss", enabled: true },
        { name: "sass", ext: ".{scss,sass}", outputExt: ".wxss", enabled: true },
        { name: "wxss", ext: ".wxss", enabled: true },
        { name: "ts", ext: ".ts", outputExt: ".js", enabled: fs.existsSync(baseOpt.tsConfig) },
        { name: "js", ext: ".js", enabled: true },
        { name: "wxml", ext: ".wxml", enabled: true },
        { name: "json", ext: ".json", enabled: true },
        { name: "wxs", ext: ".wxs", enabled: true },
        { name: "image", ext: ".{jpg,jpeg,png,gif,bmp,webp}", enabled: true },
      ]
        .filter((item) => item.enabled)
        .map(({ name, ext, outputExt }) => {
          const task = require("../gulp/" + name)(baseOpt, userOptions);
          function remove(file) {
            let willDeleteFile = file.replace("src", "dist");
            if (outputExt) {
              willDeleteFile = willDeleteFile.replace(/\.\w*$/, outputExt);
            }
            fs.remove(willDeleteFile);
          }
          // 监听模式
          gulp.watch(`src/**/*${ext}`).on("change", task).on("add", task).on("unlink", remove).on("unlinkDir", remove);
          return task;
        });
      taskArr.push(gulp.parallel(...compilerTask));

      // 构建npm、上传代码
      if (userOptions.compiler.type === "hard") {
        const installAndBuilderTask = await require("../gulp/devToolsCI")(
          baseOpt,
          userOptions,
          args,
          useCache,
          writeCacheIdentifier
        );
        taskArr.push(installAndBuilderTask);
      } else {
        const installAndBuilderTask = require("../gulp/miniprogramCI")(
          baseOpt,
          userOptions,
          args,
          useCache,
          writeCacheIdentifier
        );
        taskArr.push(installAndBuilderTask);
      }

      gulp.series(taskArr)((err) => {
        err && process.exit(1);
        log();
        done("任务完成~（＾∀＾）");
      });
    }
  );
};

module.exports.defaultModes = {
  build: "production",
};
