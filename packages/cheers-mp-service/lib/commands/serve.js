const path = require("path");
const gulp = require("gulp");
const { log, info } = require("../../utils/logger");

const defaults = {
  clean: true,
  upload: false
};

module.exports = (api, userOptions) => {
  api.registerCommand(
    "serve",
    {
      description: "启用文件改动监听模式",
      usage: "cheers-mp-service serve [options] [entry]",
      options: {
        "--mode": `指定 env 文件模式 (默认: development)`
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
          oss: userOptions.oss.options
        });
        prepareImage = imageOperator.proxy;
        prepareImage.displayName = "预处理图片";
        taskArr.push(prepareImage);
      }

      // 其他并行编译任务
      const compilerTask = [
        { name: "less", ext: ".less" },
        { name: "wxss", ext: ".wxss" },
        { name: "ts", ext: ".ts" },
        { name: "js", ext: ".js" },
        { name: "wxml", ext: ".wxml" },
        { name: "json", ext: ".json" },
        { name: "wxs", ext: ".wxs" },
        { name: "image", ext: ".{jpg,jpeg,png,gif,bmp,webp}" }
      ].map(({ name, ext }) => {
        const task = require("../gulp/" + name)(baseOpt);
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
