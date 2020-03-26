const path = require("path");
const fs = require("fs-extra");
const gulp = require("gulp");
const { log, info } = require("../../utils/logger");

const defaults = {
  clean: true,
  upload: false,
  open: false
};

module.exports = (api, userOptions) => {
  api.registerCommand(
    "serve",
    {
      description: "启用文件改动监听模式",
      usage: "cheers-mp-service serve [options] [entry]",
      options: {
        "--mode": `指定 env 文件模式 (默认: development)`,
        "--open": `编译后自动在开发者工具中打开项目(仅compiler.type为hard时生效)`
      }
    },
    async function serve(args) {
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

        rewriter: url => url
      };

      // 清空输出目录
      taskArr.push(require("../gulp/clean")(baseOpt.outputDir));

      // 切换appid
      if (process.env.APPID) {
        await require("../gulp/switchAppid")(baseOpt.context);
      }

      if (baseOpt.isUseOSS) {
        // 预处理图片
        let imageOperator, prepareImage;
        // 处理文件内匹配到的图片url
        baseOpt.rewriter = url => {
          if (/^(https?):\/\//.test(url) || url.indexOf("/LOCAL_") > -1) {
            return url;
          }
          if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(path.extname(url).toLocaleLowerCase())) {
            try {
              return imageOperator.getProxyURI(url);
            } catch (error) {
              return url;
            }
          }
          return url;
        };
        imageOperator = require("cheers-mp-images")({
          target: baseOpt.srcDir,
          proxy: {
            port: 8888
          },
          oss: userOptions.oss
        });
        prepareImage = imageOperator.proxy;
        prepareImage.displayName = "预处理图片";
        taskArr.push(prepareImage);
      }

      // 其他并行编译任务
      const compilerTask = [
        { name: "less", ext: ".less", enabled: true },
        { name: "sass", ext: ".{scss,sass}", enabled: true },
        { name: "wxss", ext: ".wxss", enabled: true },
        { name: "ts", ext: ".ts", enabled: fs.existsSync(baseOpt.tsConfig) },
        { name: "js", ext: ".js", enabled: true },
        { name: "wxml", ext: ".wxml", enabled: true },
        { name: "json", ext: ".json", enabled: true },
        { name: "wxs", ext: ".wxs", enabled: true },
        { name: "image", ext: ".{jpg,jpeg,png,gif,bmp,webp}", enabled: true }
      ]
        .filter(item => item.enabled)
        .map(({ name, ext }) => {
          const task = require("../gulp/" + name)(baseOpt, userOptions);
          // 监听模式
          gulp.watch(`src/**/*${ext}`, task);
          return task;
        });
      taskArr.push(gulp.parallel(...compilerTask));

      // 构建npm、上传代码
      if (userOptions.compiler.type === "hard") {
        const installAndBuilderTask = await require("../gulp/devToolsCI")(baseOpt, userOptions, args);
        taskArr.push(installAndBuilderTask);
      } else {
        const installAndBuilderTask = require("../gulp/miniprogramCI")(baseOpt, userOptions, args);
        taskArr.push(installAndBuilderTask);
      }

      await gulp.series(taskArr)(err => {
        err && process.exit(1);
        log();
        info("正在监听文件改动...");
      });
    }
  );
};

module.exports.defaultModes = {
  serve: "development"
};
