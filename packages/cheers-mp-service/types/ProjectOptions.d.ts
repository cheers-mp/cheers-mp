interface OSSOptions {
  type: "ALI" | "QINIU";
  options: object;
}

/** “硬编译”配置 */
interface HardOptions {
  /** 开发者工具安装目录 */
  devToolsDir: string;
  /** 开发者工具命令行使用的版本 */
  version: string;
}

/** “软编译”配置 */
interface SoftOptions {
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
}

/** 编译器选项 */
interface CompilerOptions {
  /** 编译类型，“硬编译”,"软编译" */
  type: "hard" | "soft";
  options: HardOptions | SoftOptions;
}
export interface ProjectOptions {
  oss?: OSSOptions;

  lintOnSave?: boolean | "default" | "warning" | "error";

  pluginOptions?: object;
}

export type ConfigFunction = () => ProjectOptions;
