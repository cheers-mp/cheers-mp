const { createSchema, validate } = require("../utils/validate");

const schema = createSchema(joi =>
  joi.object({
    // 开发者工具安装目录
    developerToolsDirectory: joi.string().allow(""),

    /** 配置阿里云、七牛云存储 */
    oss: joi
      .object({
        type: joi.any().valid(["ALI", "QINIU"]),
        options: joi.object()
      })
      .allow(""),

    // 是否在开发环境下通过 eslint 在每次保存时 lint 代码
    lintOnSave: joi.any().valid([true, false, "error"]),

    ci: joi.object({
      /** 	小程序/小游戏项目的 appid */
      appid: joi.string(),
      /** 项目的路径 */
      projectPath: joi.string(),
      /** 私钥，在获取项目属性和上传时用于鉴权使用 */
      privateKeyPath: joi.string(),
      /** 项目的类型，有效值 miniProgram/miniProgramPlugin/miniGame/miniGamePlugin */
      type: joi.string().valid(["miniProgram", "miniProgramPlugin", "miniGame", "miniGamePlugin"]),
      /** 指定需要排除的规则 */
      ignores: joi.array().items(joi.string())
    }),

    // 第三方插件自定义选项
    pluginOptions: joi.object()
  })
);

exports.validate = (options, cb) => {
  validate(options, schema, cb);
};

exports.defaults = () => ({
  developerToolsDirectory: "",
  oss: "",
  ci: {
    type: "miniProgram",
    ignores: []
  },
  lintOnSave: true
});
