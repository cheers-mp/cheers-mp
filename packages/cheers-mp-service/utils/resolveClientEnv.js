const prefixRE = /^CHEERS_MP_/;
const systemEnvWhiteList = ["NODE_ENV", "APPID"];

module.exports = function resolveClientEnv() {
  const env = {};
  Object.keys(process.env).forEach((key) => {
    if (prefixRE.test(key) || systemEnvWhiteList.includes(key)) {
      env["process.env." + key] = JSON.stringify(process.env[key]);
    }
  });
  return env;
};
