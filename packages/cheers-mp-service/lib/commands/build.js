const { log } = require("../../utils/logger");
const { createTask } = require("../gulp/task");

const defaults = {
  clean: true,
  watch: false,
  upload: false
};

module.exports = (api, options) => {
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
    async function serve(args) {
      for (const key in defaults) {
        if (args[key] == null) {
          args[key] = defaults[key];
        }
      }

      log();
      const tasks = createTask(api.getCwd(), options, args, "build");
      tasks();
      log();
    }
  );
};

module.exports.defaultModes = {
  build: "production"
};
