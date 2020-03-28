const chalk = require("chalk");

module.exports = () => {
  const h_m = `
使用: ${chalk.green("cheers")} [命令] <project-name>

命令选项:
    create                创建小程序项目
    -v, --version           输出版本
    -h, --help              输出更多帮助信息
    -f, --force             忽略更新提示

更多信息 https://bigmeow.github.com/cheers-mp
    `;
  console.log(h_m);
  return true;
};
