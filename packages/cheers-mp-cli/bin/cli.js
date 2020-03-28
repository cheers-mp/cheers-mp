#!/usr/bin/env node

const semver = require("semver");
const requiredVersion = require("../package.json").engines.node;
if (!semver.satisfies(process.version, requiredVersion)) {
  error(
    `你正在使用 Node 版本是 ${process.version}, 想用我你得 ` + `需要 Node ${requiredVersion}.\n快去升级 node 版本吧.`
  );
  process.exit(1);
}

(async () => {
  const minimist = require("minimist");
  const lv = require("latest-version");
  const { logWithSpinner, stopSpinner, pauseSpinner } = require("../util/spinner");
  const { version: localVersion } = require("../package.json");
  const { version: consoleVersion, help: consoleHelp } = require("../util");

  const argv = minimist(process.argv.slice(2));
  const { h, help: _h, v, version: _v, f, force: _f } = argv;
  let latestVersion = 0;

  let hasNewVersion = false;

  logWithSpinner("最新版本检查");
  try {
    latestVersion = await lv("cheers-mp-cli");
  } catch (error) {
    pauseSpinner();
    throw new Error("当前无网络环境, 请稍后再试");
  }
  stopSpinner();
  hasNewVersion = consoleVersion(localVersion, latestVersion, v || _v);
  if (h || _h) {
    return consoleHelp();
  } else if (v || _v || (hasNewVersion && !f && !_f)) {
    return false;
  }

  const cli = require("cac")();

  cli.command("create <projectName>", "创建一个新的小程序项目").action(async projectName => {
    logWithSpinner("从仓库下载小程序项目模板： https://github.com/bigmeow/cheers-mp-template.git ");
    const sao = require("sao");
    const app = sao({
      generator: "direct:https://github.com/bigmeow/cheers-mp-template.git",
      clone: true,
      update: true,
      outDir: projectName
    });
    stopSpinner();
    await app.run().catch(sao.handleError);
  });

  cli.help();

  cli.parse();
})();
