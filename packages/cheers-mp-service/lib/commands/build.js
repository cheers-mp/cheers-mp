const path = require("path");
const fs = require("fs-extra");
const gulp = require("gulp");
const { log, done } = require("../../utils/logger");

const defaults = {
  clean: true,
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
        "--mode": `指定 env 文件模式 (默认: development)`,
        "--clean": "是否每次编译前先清空处理掉输出目录(默认: true)",
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

      if (args.clean) {
        // 清空输出目录
        taskArr.push(require("../gulp/clean")(baseOpt.outputDir));
      }

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
            return null;
          }
          if ([".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"].includes(path.extname(url).toLocaleLowerCase())) {
            try {
              return imageOperator.getNetURI(path.join(baseOpt.srcDir, url));
            } catch (error) {
              return null;
            }
          }
          return null;
        };
        imageOperator = require("cheers-mp-images")({
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
        { name: "less", ext: ".less", enabled: true },
        { name: "sass", ext: ".{scss,sass}", enabled: true },
        { name: "wxss", ext: ".wxss", enabled: true },
        { name: "ts", ext: ".ts", enabled: fs.existsSync(baseOpt.tsConfig) },
        { name: "js", ext: ".js", enabled: true },
        { name: "wxml", ext: ".wxml", enabled: true },
        { name: "json", ext: ".json", enabled: true },
        { name: "wxs", ext: ".wxs", enabled: true },
        { name: "image", ext: ".{jpg,jpeg,png,gif,bmp,webp}", enabled: true },
      ]
        .filter((item) => item.enabled)
        .map(({ name, ext }) => {
          const task = require("../gulp/" + name)(baseOpt, userOptions);
          // 监听模式
          args.watch && gulp.watch(`src/**/*${ext}`, task);
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
