const util = require("util");
const exec = util.promisify(require("child_process").exec);
const os = require("os");
const path = require("path");
const fs = require("fs-extra");
const chalk = require("chalk");

function IF(condition, result) {
  return condition ? " " + result : "";
}

/**
 * 通过命令行调用安装完成的工具可执行文件，完成打开开发工具、构建NPM、上传等操作。
 */
class CLI {
  constructor(devToolsInstallPath, version = "v2") {
    /** 微信小程序开发者工具安装路径 */
    this.devToolsInstallPath = devToolsInstallPath;

    /** 命令行工具所在路径 */
    this.cliPath = path.join(devToolsInstallPath, os.platform() === "win32" ? "/cli.bat" : "/Contents/MacOS/cli");

    if (!["v1", "v2"].includes(version)) {
      throw new Error(
        "仅支持v1和v2两个版本，详情可查询文档:https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html"
      );
    }
    this.version = version;
  }

  async init() {
    if (this.initialized) {
      return;
    }
    this.initialized = true;

    // 检查安装路径是否存在
    if (!(await fs.pathExists(this.devToolsInstallPath)))
      throw new Error(
        `微信开发者工具安装路径“${this.devToolsInstallPath}”不存在,请在"cheers.config.js"文件中配置“compiler.options.devToolsDir”属性`
      );

    // 检查是否开启了命令行
    /**
     新版端口号文件是否开启配置
        macOS : ~/Library/Application Support/微信开发者工具/<开发者工具安装路径的MD5>/Default/.ide-status
        Windows : ~/AppData/Local/微信开发者工具/User Data/<开发者工具安装路径的MD5>/Default/.ide-status
      */
    let ideStatusFile = path.join(
      os.homedir(),
      os.platform() === "win32"
        ? "/AppData/Local/微信开发者工具/User Data/Default/.ide-status"
        : "/Library/Application Support/微信开发者工具/Default/.ide-status"
    );

    const errMesg = `工具的服务端口已关闭。要使用命令行调用工具，请打开工具 -> 设置 -> 安全设置，将服务端口开启。
  详细信息: https://developers.weixin.qq.com/miniprogram/dev/devtools/cli.html`;
    if (!(await fs.pathExists(ideStatusFile))) {
      const installPath =
        os.platform() === "win32" ? this.devToolsInstallPath : `${this.devToolsInstallPath}/Contents/MacOS`;
      const md5 = require("crypto").createHash("md5").update(installPath).digest("hex");
      ideStatusFile = path.join(
        os.homedir(),
        os.platform() === "win32"
          ? `/AppData/Local/微信开发者工具/User Data/${md5}/Default/.ide-status`
          : `/Library/Application Support/微信开发者工具/${md5}/Default/.ide-status`
      );
      if (!(await fs.pathExists(ideStatusFile))) {
        throw new Error(errMesg);
      }
    }
    const ideStatus = await fs.readFile(ideStatusFile, "utf-8");
    if (ideStatus === "Off") throw new Error(errMesg);

    if (!(await fs.pathExists(this.cliPath))) throw new Error(`命令行工具路径“${this.cliPath}”不存在`);
  }

  async _exec(commandStr) {
    console.log(chalk.bgBlue.white(" 执行命令 "), chalk.bgBlackBright.white.dim(` ${commandStr} `));
    // console.info("命令：", commandStr);
    const result = await exec(`"${this.cliPath}" ${commandStr}`);
    // console.log("结果：", result);
    // 由于开发者工具返回结果信息不规范且版本多变，暂无更好的办法解析出返回的可能存在的json信息
    return JSON.stringify(result).indexOf("error") > -1 ? Promise.reject(result) : Promise.resolve(result);
  }

  /**
   * 打开工具，如果不带 projectpath，只是打开工具。如果带 project path，则打开路径中的项目，每次执行都会自动编译刷新，并且自动打开模拟器和调试器。projectpath 不能是相对路径。项目路径中必须含正确格式的 project.config.json 且其中有 appid 和 projectname 字段。
   * @param {String} projectPath
   */
  open(projectPath) {
    const commandStr =
      this.version === "v1"
        ? ["--open", IF(projectPath, `"${projectPath}"`)].join("")
        : ["open", IF(projectPath, `--project "${projectPath}"`)].join("");
    return this._exec(commandStr);
  }

  buildNPM(projectPath) {
    const commandStr =
      this.version === "v1"
        ? ["--build-npm", IF(projectPath, `"${projectPath}"`)].join("")
        : ["build-npm", IF(projectPath, `--project "${projectPath}"`)].join("");
    return this._exec(commandStr);
  }

  upload(projectPath, version, remark) {
    const commandStr =
      this.version === "v1"
        ? ["--upload", IF(projectPath, `${version}@"${projectPath}"`), IF(remark, `--upload-desc "${remark}"`)].join("")
        : [
            "upload",
            IF(projectPath, `--project "${projectPath}"`),
            IF(version, `-v ${version}`),
            IF(remark, `-d "${remark}"`),
          ].join("");
    return this._exec(commandStr);
  }

  /**
   * 重置工具内部文件缓存，重新监听项目文件。
   * @param {string} projectPath
   */
  resetFileutils(projectPath) {
    if (this.version === "v1") {
      console.warn("仅v2版本支持 reset-fileutils 命令，当前 v1 版本将不执行");
      return Promise.resolve({
        stdout: "",
        stderr: "",
      });
    }
    const commandStr = ["reset-fileutils", IF(projectPath, `--project "${projectPath}"`)].join("");
    return this._exec(commandStr);
  }

  /**
   * 清除文件编译缓存
   * @param {string} projectPath
   */
  cleanCompileCache(projectPath) {
    if (this.version === "v1") {
      console.warn("仅v2版本支持 cache 命令，当前 v1 版本将不执行");
      return Promise.resolve({
        stdout: "",
        stderr: "",
      });
    }
    const commandStr = ["cache", IF(projectPath, `--clean compile --project "${projectPath}"`)].join("");
    return this._exec(commandStr);
  }

  close(projectPath) {
    const commandStr =
      this.version === "v1"
        ? ["--close", IF(projectPath, `"${projectPath}"`)].join("")
        : ["close", IF(projectPath, `--project "${projectPath}"`)].join("");
    return this._exec(commandStr);
  }

  quit() {
    return this._exec(this.version === "v1" ? "--quit" : "quit");
  }
}

module.exports = CLI;
