const chalk = require("chalk");
function getPadLength(obj) {
  let longest = 10;
  for (const name in obj) {
    if (name.length + 1 > longest) {
      longest = name.length + 1;
    }
  }
  return longest;
}

module.exports = (api) => {
  api.registerCommand("help", (args) => {
    const commandName = args._[0];
    if (!commandName) {
      logMainHelp();
    } else {
      logHelpForCommand(commandName, api.service.commands[commandName]);
    }
  });

  function logMainHelp() {
    console.log(`\n  使用: cheers-mp-service <命令> [选项]\n` + `\n  命令:\n`);
    const commands = api.service.commands;
    const padLength = getPadLength(commands);
    for (const name in commands) {
      if (name !== "help") {
        const opts = commands[name].opts || {};
        console.log(`    ${chalk.blue(name.padEnd(padLength))}${opts.description || ""}`);
      }
    }
    console.log(`\n  运行 ${chalk.green(`npx cheers-mp-service help [命令]`)} 查看具体命令选项用法.\n`);
  }

  function logHelpForCommand(name, command) {
    if (!command) {
      console.log(chalk.red(`\n  命令 "${name}" 不存在.`));
    } else {
      const opts = command.opts || {};
      if (opts.usage) {
        console.log(`\n  使用: ${opts.usage}`);
      }
      if (opts.options) {
        console.log(`\n  具体选项:\n`);
        const padLength = getPadLength(opts.options);
        for (const [flags, description] of Object.entries(opts.options)) {
          console.log(`    ${chalk.blue(flags.padEnd(padLength))}${description}`);
        }
      }
      if (opts.details) {
        console.log();
        console.log(
          opts.details
            .split("\n")
            .map((line) => `  ${line}`)
            .join("\n")
        );
      }
      console.log();
    }
  }
};
