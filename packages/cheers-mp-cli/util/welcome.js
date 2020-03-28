const chalk = require("chalk");
const consoleVersion = require("./version");
const { version } = require("../package.json");

console.log(`
Ladies and gentlemen ~ Welcome to`);
consoleVersion();
console.log(`
                                                          version: ${chalk.green(version)}
=========================================================================
你可以使用 \`cheers -h\` 命令获得更多帮助
`);
