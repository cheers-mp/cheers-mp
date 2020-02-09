const { log } = require("../../utils/logger");
const { createTask } = require("../gulp/task");

module.exports = (api, options) => {
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
      log();
      args.watch = true;
      const tasks = createTask(api.getCwd(), options, args);
      tasks();
      log();
    }
  );
};

module.exports.defaultModes = {
  serve: "development"
};
