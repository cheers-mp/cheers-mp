const { log } = require("../../utils/logger");
const { createTask } = require("../gulp/task");

module.exports = (api, options) => {
  api.registerCommand(
    "build",
    {
      description: "生产构建",
      usage: "cheers-mp-cli-service build [options] [entry]",
      options: {
        "--mode": `指定 env 文件模式 (默认: development)`
      }
    },
    async function serve(args) {
      log();
      const tasks = createTask(api.getCwd(), options, args);
      tasks();
      log();
    }
  );
};

module.exports.defaultModes = {
  build: "production"
};
