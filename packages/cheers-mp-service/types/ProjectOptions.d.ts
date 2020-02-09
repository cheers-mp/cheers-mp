export interface ProjectOptions {
  developerToolsDirectory?: string;

  lintOnSave?: boolean | "default" | "warning" | "error";

  pluginOptions?: object;
}

export type ConfigFunction = () => ProjectOptions;
