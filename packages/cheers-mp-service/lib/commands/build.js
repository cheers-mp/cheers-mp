const path = require("path");
const gulp = require("gulp");
const { log, done } = require("../../utils/logger");

const defaults = {
  clean: true,
  watch: false,
  upload: false
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
        "--upload": "编译结束后是否自动调用开发者工具上传，上传的小程序可在后台设置为体验版，默认关闭"
      }
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

        rewriter: url => url
      };

      if (args.clean) {
        // 清空输出目录
        taskArr.push(require("../gulp/clean")(baseOpt.outputDir));
      }

      // 预处理图片
      let imageOperator, prepareImage;
      if (baseOpt.isUseOSS) {
        // 处理文件内匹配到的图片url
        baseOpt.rewriter = url => {
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
        imageOperator = require("cheers-mp-images")({
          target: baseOpt.srcDir,
          proxy: {
            port: 8888
          },
          oss: userOptions.oss.options
        });
        prepareImage = imageOperator.upload;
        prepareImage.displayName = "上传项目中使用的图片到oss";
      }
      taskArr.push(prepareImage);

      // 其他并行编译任务
      const compilerTask = [
        { name: "less", ext: ".less" },
        { name: "wxss", ext: ".wxss" },
        { name: "ts", ext: ".ts" },
        { name: "wxml", ext: ".wxml" },
        { name: "json", ext: ".json" },
        { name: "wxs", ext: ".wxs" },
        { name: "image", ext: ".{jpg,jpeg,png,gif,bmp,webp}" }
      ].map(({ name, ext }) => {
        const task = require("../gulp/" + name)(baseOpt);
        // 监听模式
        args.watch && gulp.watch(`src/**/*${ext}`, task);
        return task;
      });
      taskArr.push(gulp.parallel(...compilerTask));

      // 构建npm
      const installAndBuilderTask = require("../gulp/miniprogramCI")(baseOpt, userOptions);
      taskArr.push(installAndBuilderTask);

      gulp.series(taskArr)();

      log();
      done("编译完成");
    }
  );
};

module.exports.defaultModes = {
  build: "production"
};
