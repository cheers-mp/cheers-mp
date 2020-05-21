# cheers-config.js

## productionSourceMap

- Type: `boolean`
- Default: `true`

  如果你不需要生产环境的 source map，可以将其设置为 false 以加速生产环境构建

## css.px2rpx

- Type: `Object`
- Default: `null`

将样式中的 px 单位转换成 rpx 单位，默认不开启。

开启示例：

```js
module.exports = {
  css: {
    px2rpx: {
      // 转换比例,公式 px:rpx = rpxUnit
      rpxUnit: 0.5,
      // 转换后精确到小数点后第几位
      rpxPrecision: 6,
    },
  },
};
```

开启后如果某个样式不想被转换，可在样式后加上 `/*no*/` 声明来避免：

```css
.selector {
  width: 350px;
  height: 60px;
  font-size: 20px;
  border: 1px solid #ddd; /*no*/
}
```

## oss

- Type: `String|Object`
- Default: `""`

配置阿里云、七牛云存储，默认不配置。如果配置，则会将项目中使用到的图片在编译发布模式时自动上传到对应的云存储空间，并替换项目内使用的引用。

定义：

```ts
interface OSSOptions {
  type: "ALI" | "QINIU";
  options: object;
}
```

#### 使用示例

阿里云存储配置[相关文档](https://help.aliyun.com/document_detail/31947.html?spm=a2c4g.11186623.6.1599.347dc06dHqttMF):

```js
module.exports = {
  oss: {
    type: "ALI",
    options: {
      /** 地域， 参考https://help.aliyun.com/document_detail/31837.html?spm=a2c4g.11186623.2.16.749469cb7oGBE5#concept-zt4-cvy-5db */
      region: "oss-cn-shanghai",
      accessKeyId: "abcd",
      /** 访问密钥 */
      accessKeySecret: "abcd",
      /** 存储空间 */
      bucket: "helloword",
      /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
      prefix: "miniapp",
      /** 访问域名(可选填) */
      domain: "cdn.xxx.com",
      /** 是否使用 https */
      https: true,
    },
  },
};
```

七牛云存储配置[相关文档](https://developer.qiniu.com/kodo/manual/3978/the-basic-concept):

```js
module.exports = {
  oss: {
    type: "QINIU",
    options: {
      /** 存储区域，参考 https://developer.qiniu.com/kodo/manual/1671/region-endpoint */
      zone: "Zone_z0",
      // 访问密钥
      accessKey: "abcd",
      secretKey: "abcded",
      /** 空间名称*/
      bucket: "cheers-mp",
      /** 访问路径前缀，可自行定义值，一般可以取项目名称，注意不要有特殊符号存在*/
      prefix: "miniapp",
      /** 访问域名必填 */
      domain: "cdn.xxx.com",
      /** 是否使用 https */
      https: true,
    },
  },
};
```

## compiler

- Type: `CompilerOptions`
- Default: `{ type: "", options: {} }`

编译器，调用小程序开发者工具或者官方提供 CI 命令进行`构建NPM`、`上传`等动作，必填。

我们将本地的微信开发者工具内置的编译器称之为“硬编译”;将官方提供的 NPM 编译包称之为“软编译”

定义：

```ts
/** 编译器选项 */
interface CompilerOptions {
  /** 编译类型，“硬编译”,"软编译" */
  type: "hard" | "soft";
  options: HardOptions | SoftOptions;
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
```

#### 使用示例:

```js
// 本地开发时用本地开发者工具编译器。远程CI用官方提供的CI编译器
if (process.env.NODE_ENV === "development") {
  // mac电脑和windows电脑上微信开发者工具所在的目录（windows上注意路径分割转义符）
  const devToolsDir =
    require("os").platform() === "darwin"
      ? "/Applications/wechatwebdevtools.app"
      : "C:\\Program Files (x86)\\Tencent\\微信web开发者工具";
  options.compiler = {
    type: "hard",
    options: {
      devToolsDir,
      version: "v2",
    },
  };
} else {
  options.compiler = {
    type: "soft",
    options: {
      privateKeyPath: `key/private.${process.env.APPID}.key`,
    },
  };
}

module.exports = options;
```
