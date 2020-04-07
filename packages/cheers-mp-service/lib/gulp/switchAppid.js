const fs = require("fs-extra");
const writeJsonFile = require("write-json-file");
const path = require("path");

module.exports = async (projectRootPath) => {
  const projectConfigJsonPath = path.join(projectRootPath, "project.config.json");
  const projectConfigJson = await fs.readJson(projectConfigJsonPath);
  projectConfigJson.appid = process.env.APPID;
  return writeJsonFile(projectConfigJsonPath, projectConfigJson);
};
