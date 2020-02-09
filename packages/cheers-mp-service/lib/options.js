const { createSchema, validate } = require("../utils/validate");

const schema = createSchema(joi =>
  joi.object({
    // 开发者工具安装目录
    developerToolsDirectory: joi.string().allow(""),

    // 是否在开发环境下通过 eslint 在每次保存时 lint 代码
    lintOnSave: joi.any().valid([true, false, "error"]),

    // 第三方插件自定义选项
    pluginOptions: joi.object()
  })
);

exports.validate = (options, cb) => {
  validate(options, schema, cb);
};

exports.defaults = () => ({
  developerToolsDirectory: "",

  lintOnSave: true
});
