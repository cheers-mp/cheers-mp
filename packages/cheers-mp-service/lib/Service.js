const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const readPkg = require("read-pkg");
const dotenv = require("dotenv");
const dotenvExpand = require("dotenv-expand");
const defaultsDeep = require("lodash.defaultsdeep");
const { loadModule } = require("../utils/module");
const { isPlugin } = require("../utils/pluginResolution");
const { error } = require("../utils/logger");
const { defaults, validate } = require("./options");
const PluginAPI = require("./PluginAPI");

module.exports = class Service {
  constructor(context) {
    process.env.CHEERS_MP_CLI_CONTEXT = context;

    /** 确保Service只被初始化一次 */
    this.initialized = false;

    /** 程序执行的上下文目录，默认情况下是项目的根目录 */
    this.context = context;

    /** 存放插件中注册的命令、参数以及回调处理函数 */
    this.commands = {};

    /** 用户项目包含 package.json 的目录 */
    this.pkgContext = context;

    /** 用户项目的 package.json 内容 */
    this.pkg = this.resolvePkg();

    /** 待调用的插件对象数组 */
    this.plugins = this.resolvePlugins();

    /** 解析每个命令使用的默认模式,插件以module.exports.defaultmodes的形式提供,这样我们就可以在实际不执行插件的情况下获取信息 */
    this.modes = this.plugins.reduce((modes, { apply: { defaultModes } }) => {
      return Object.assign(modes, defaultModes);
    }, {});
  }

  resolvePkg(context = this.context) {
    if (fs.existsSync(path.join(context, "package.json"))) {
      const pkg = readPkg.sync({ cwd: context });
      return pkg;
    } else {
      return {};
    }
  }

  resolvePlugins() {
    const idToPlugin = (id) => ({
      id: id.replace(/^.\//, "built-in:"),
      apply: require(id),
    });

    let plugins;
    // 读取service内置插件名单
    const builtInPlugins = ["./commands/serve", "./commands/build", "./commands/help"].map(idToPlugin);
    // 读取用户package.json中devDependencies和dependencies依赖中的插件名单
    const projectPlugins = Object.keys(this.pkg.devDependencies || {})
      .concat(Object.keys(this.pkg.dependencies || {}))
      .filter(isPlugin)
      .map((id) => idToPlugin(id));
    plugins = builtInPlugins.concat(projectPlugins);

    // 项目本地的插件
    if (this.pkg.cheersPlugins && this.pkg.cheersPlugins.service) {
      const files = this.pkg.cheersPlugins.service;
      if (!Array.isArray(files)) {
        throw new Error(`无效的类型选项 'cheersPlugins.service', 期望得到 'array' 但是得到了 ${typeof files}.`);
      }
      plugins = plugins.concat(
        files.map((file) => ({
          id: `local:${file}`,
          apply: loadModule(file, this.pkgContext),
        }))
      );
    }

    return plugins;
  }

  /**
   * 加载用户配置的环境变量 (根目录下的.env 文件)
   * @param {String} mode 模式名
   * @description 同名环境变量优先级： .env.模式名.local > .env.模式名 > .env.local > .env
   */
  loadEnv(mode, commandName) {
    const basePath = path.resolve(this.context, `.env${mode ? `.${mode}` : ``}`);
    const localPath = `${basePath}.local`;

    const load = (path) => {
      try {
        const res = dotenv.config({ path });
        dotenvExpand(res);
      } catch (err) {
        // only ignore error if file is not found
        if (err.toString().indexOf("ENOENT") < 0) {
          error(err);
        }
      }
    };

    load(localPath);
    load(basePath);

    // 1.如果指定的模式是默认的三种模式之一，并且模式对应的.env文件里没有设置NODE_ENV,那么NODE_ENV=模式名;
    // 2.如果指定的模式不是默认的三种模式之一，并且模式对应的.env文件里没有设置NODE_ENV,那么NODE_ENV取决于命令，
    //  build命令NODE_ENV=production，serve命令NODE_ENV=development,其它命令NODE_ENV=development;
    if (mode) {
      const defaultNodeEnv = ["production", "test", "development"].includes(mode)
        ? mode
        : commandName === "build"
        ? "production"
        : "development";
      if (process.env.NODE_ENV == null) {
        process.env.NODE_ENV = defaultNodeEnv;
      }
      if (process.env.BABEL_ENV == null) {
        process.env.BABEL_ENV = defaultNodeEnv;
      }
    }
  }

  /**
   * 加载用户配置 (根目录下的 cheers.config.js 文件)
   * @return {Object} userOptions
   */
  loadUserOptions() {
    let fileConfig;
    const configPath = path.resolve(this.context, "cheers.config.js");
    if (fs.existsSync(configPath)) {
      try {
        fileConfig = require(configPath);

        if (typeof fileConfig === "function") {
          fileConfig = fileConfig();
        }

        if (!fileConfig || typeof fileConfig !== "object") {
          error(
            `Error loading ${chalk.bold(
              "cheers.config.js"
            )}: should export an object or a function that returns object.`
          );
          fileConfig = null;
        }
      } catch (e) {
        error(`Error loading ${chalk.bold("cheers.config.js")}:`);
        throw e;
      }
    }

    // 校验选项
    validate(fileConfig, (msg) => {
      error(`Invalid options in ${chalk.bold("cheers.config.js")}: ${msg}`);
    });

    return fileConfig;
  }

  init(mode, commandName) {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    this.mode = mode;
    // load mode .env
    if (mode) {
      this.loadEnv(mode, commandName);
    }
    // load base .env
    this.loadEnv();

    // load user config
    const userOptions = this.loadUserOptions();
    this.projectOptions = defaultsDeep(userOptions, defaults());

    // 挂载插件
    this.plugins.forEach(({ id, apply }) => {
      apply(new PluginAPI(id, this), this.projectOptions);
    });
  }

  async run(name, args = {}, rawArgv = []) {
    const mode = args.mode || (name === "build" && args.watch ? "development" : this.modes[name]);
    process.env.PLATFORM = args.platform || "wechat";
    args.platform = process.env.PLATFORM;

    // 载入环境变量、用户配置(cheers.config.js)、挂载插件
    this.init(mode, name);

    // 将用户输入的命令和插件注册命令匹配，如果存在则执行相应的回调函数
    args._ = args._ || [];
    let command = this.commands[name];
    if (!command && name) {
      error(`命令 "${name}" 不存在.`);
      process.exit(1);
    }
    if (!command || args.help || args.h) {
      command = this.commands.help;
    } else {
      args._.shift(); // remove command itself
      rawArgv.shift();
    }
    const { fn } = command;
    return fn(args, rawArgv);
  }
};
