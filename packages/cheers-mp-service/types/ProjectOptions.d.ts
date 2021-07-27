interface AliOSS {
  /** 阿里云 */
  type: "ALI";
  options: {
    accessKeyId: string;
    accessKeySecret: string;
    /** 存储空间 */
    bucket: string;
    /** 地域， 参考https://help.aliyun.com/document_detail/31837.html?spm=a2c4g.11186623.2.16.749469cb7oGBE5#concept-zt4-cvy-5db */
    region: string;
    /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
    prefix: string;
    /** 访问域名(选填) */
    domain: string;
    /** 是否使用 https */
    https: boolean;
  };
}

interface QiniuOSS {
  /** 七牛云 */
  type: "QINIU";
  options: {
    accessKey: string;
    secretKey: string;
    /** 存储区域，参考 https://developer.qiniu.com/kodo/manual/1671/region-endpoint */
    zone: string;
    /** 空间名称*/
    bucket: string;
    /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
    prefix: string;
    /** 访问域名必填 */
    domain: string;
    /** 是否使用 https */
    https: boolean;
  };
}

interface UcloudOSS {
  /** ucloud 云 */
  type: "UCLOUD";
  options: {
    accessKeyId: string;
    secretAccessKey: string;
    /** 空间/桶名称*/
    bucket: string;
    /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
    prefix: string;
    /** 空间/桶地址*/
    endpoint: string;
    /** 是否使用 https上传 */
    sslEnabled: false;
    /** 自定义访问域名 */
    accessDomain?: string;
  };
}

interface TencentOSS {
    /** 腾讯云 */
    type: "TENCENT";
    options: {
        secretId: string,
        secretKey: string,
        /** 空间/桶名称*/
        bucket: string,
        /** 存储区域 */
        region: string,
        /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
        prefix: string;
        /** 自定义访问域名 */
        accessDomain?: string;
        /** 是否使用 https 访问 */
        https?: boolean;
    }
}

/** “硬编译”配置 */
interface HardOptions {
  /** 硬编译 */
  type: "hard";
  options: {
    /** 开发者工具安装目录 */
    devToolsDir: string;
    /** 开发者工具命令行使用的版本 */
    version: string;
  };
}

/** “软编译”配置 */
interface SoftOptions {
  /** 软编译 */
  type: "soft";
  options: {
    /** 	小程序/小游戏项目的 appid（默认读取project.config.json中的appid字段） */
    appid?: string;
    /** 项目的路径（默认project.config.json所在目录路径） */
    projectPath?: string;
    /** 私钥，在获取项目属性和上传时用于鉴权使用(必填) */
    privateKeyPath: string;
    /** 项目的类型，有效值 miniProgram/miniProgramPlugin/miniGame/miniGamePlugin， 默认miniProgram */
    type: "miniProgram" | "miniProgramPlugin" | "miniGame" | "miniGamePlugin";
    /** 指定需要排除的规则 */
    ignores: string[];
  };
}

type CompilerOptions = HardOptions | SoftOptions;

export interface ProjectOptions {
  /** 编译器选项 */
  compiler: CompilerOptions;
  /** 图片上传到云存储配置 */
  oss?: AliOSS | QiniuOSS | UcloudOSS | TencentOSS;

  /** css 相关处理 */
  css?: {
    sass?: any;
    scss?: any;
    less?: any;
    /** postcss插件数组 */
    postcss?: any[];
    /** 将 rpx 单位转换成 px 单位*/
    px2rpx?: {
      /** 转换比例,公式 px:rpx = rpxUnit */
      rpxUnit: number;
      /** 转换后精确到小数点后第几位, 默认6 */
      rpxPrecision: number;
    };
  };
  /** 处理资源路径， 默认情况下处理的资源为：
   * @example
   * {
   *  image: "src",
   *  video: "poster",
   *  "cover-image": "src"
   * }
   *  */
  transformAssetUrls?: Record<string, any>;

  lintOnSave?: boolean | "default" | "warning" | "error";
  /** 插件配置选项 */
  pluginOptions?: object;
}

export type ConfigFunction = () => ProjectOptions;
