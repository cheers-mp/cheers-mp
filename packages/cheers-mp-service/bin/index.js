#!/usr/bin/env node

const semver = require("semver");
const { error } = require("../utils/logger");
const requiredVersion = require("../package.json").engines.node;
if (!semver.satisfies(process.version, requiredVersion)) {
  error(`你当前Node版本是 ${process.version}, 运行本程序需要 Node ${requiredVersion}.\n请升级node版本.`);
  process.exit(1);
}
// process.env.CHEERS_MP_CLI_CONTEXT = path.resolve(__dirname, "../../");
const Service = require("../lib/Service.js");
const service = new Service(process.env.CHEERS_MP_CLI_CONTEXT || process.cwd());

const rawArgv = process.argv.slice(2);
const args = require("minimist")(process.argv.slice(2), {
  boolean: [
    // build
    "no-clean",
    "no-watch",
    "upload",
    // serve
    "open",
  ],
});
const command = args._[0];

service.run(command, args, rawArgv).catch((err) => {
  error(err);
  process.exit(1);
});
