const { createSchema, validate } = require("../utils/validate");

const schema = createSchema((joi) =>
  joi.object({
    /** 配置阿里云、七牛云存储、优刻得、腾讯云存储 */
    oss: joi
      .object({
        type: joi.any().valid(["ALI", "QINIU", "UCLOUD", "TENCENT"]).required(),
        options: joi.object().required(),
      })
      .allow(""),

    compiler: joi
      .object({
        type: joi.string().valid(["hard", "soft"]).required(),
        options: joi
          .alternatives()
          .try(
            /** 当compiler.type为hard时生效 */
            joi.object({
              /** 开发者工具安装目录 */
              devToolsDir: joi.string().required(),
              /** 开发者工具命令行使用的版本 */
              version: joi.string().valid(["v1", "v2"]).required(),
            }),
            /** 当compiler.type为soft时生效 */
            joi.object({
              /** 	小程序/小游戏项目的 appid（默认读取project.config.json中的appid字段） */
              appid: joi.string(),
              /** 项目的路径（默认project.config.json所在目录路径） */
              projectPath: joi.string(),
              /** 私钥，在获取项目属性和上传时用于鉴权使用(必填) */
              privateKeyPath: joi.string().required(),
              /** 项目的类型，有效值 miniProgram/miniProgramPlugin/miniGame/miniGamePlugin， 默认miniProgram */
              type: joi.string().valid(["miniProgram", "miniProgramPlugin", "miniGame", "miniGamePlugin"]),
              /** 指定需要排除的规则 */
              ignores: joi.array().items(joi.string().required()),
            })
          )
          .required(),
      })
      .required(),

    // 是否在开发环境下通过 eslint 在每次保存时 lint 代码(未实现)
    lintOnSave: joi.any().valid([true, false, "error"]),

    // css预处理器
    css: joi.object({
      sass: joi.object(),
      scss: joi.object(),

      /** 这里选项将传给 less http://lesscss.org/usage/#command-line-usage-options */
      less: joi.object(),

      /** postcss 插件数组 */
      postcss: joi.array(),

      /** px单位转rpx单位 */
      px2rpx: joi.object({
        rpxUnit: joi.number(),
        rpxPrecision: joi.number().integer(),
      }),
    }),

    transformAssetUrls: joi.object(),

    // 如果你不需要生产环境的js source map，可以将其设置为 false 以加速生产环境构建。
    productionSourceMap: joi.boolean(),

    // 第三方插件自定义选项
    pluginOptions: joi.object(),
  })
);

exports.validate = (options, cb) => {
  validate(options, schema, cb);
};

exports.defaults = () => ({
  oss: "",
  compiler: {
    type: "",
    options: {},
  },
  css: {},
  lintOnSave: true,
  productionSourceMap: true,
  pluginOptions: {},
});
