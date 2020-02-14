interface OSSOptions {
  type: "ALI" | "QINIU";
  options: object;
}
export interface ProjectOptions {
  developerToolsDirectory?: string;

  oss?: OSSOptions;

  lintOnSave?: boolean | "default" | "warning" | "error";

  pluginOptions?: object;
}

export type ConfigFunction = () => ProjectOptions;
