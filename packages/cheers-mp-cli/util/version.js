const chalk = require("chalk");
const compareVersions = require("compare-versions");
const banner = `
       _                                               
      | |                                              
   ___| |__   ___  ___ _ __ ___ ______ _ __ ___  _ __  
  / __| '_ \\ / _ \\/ _ \\ '__/ __|______| '_ \` _ \\| '_ \\ 
 | (__| | | |  __/  __/ |  \\__ \\      | | | | | | |_) |
  \\___|_| |_|\\___|\\___|_|  |___/      |_| |_| |_| .__/ 
                                                | |    
                                                |_|    
`;

module.exports = (localVersion = "0", latestVersion = "0", showVersion = false) => {
  const hasNewVersion = compareVersions(latestVersion, localVersion) > 0;
  const _v_m = `
-----------------------------------------------------
    当前版本:    ${localVersion}
-----------------------------------------------------
    `;
  const _nv_m = `
-----------------------------------------------------
    当前版本:    ${localVersion}
    有新版本:    ${chalk.green(latestVersion)}
    建议你创建项目前先更新版本.
    ${chalk.yellow("npm i -g cheers-mp-cli@latest")}
-----------------------------------------------------
-   运行 cheers -h 获得更多使用帮助.
    `;
  console.log(chalk.green(banner));
  hasNewVersion ? console.log(_nv_m) : showVersion && console.log(_v_m);
  return hasNewVersion;
};
