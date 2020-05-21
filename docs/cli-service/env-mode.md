# 环境变量和模式

你可以替换你的项目根目录中的下列文件来指定环境变量：

```bash
.env                # 在所有的环境中被载入
.env.local          # 在所有的环境中被载入，但会被 git 忽略
.env.[mode]         # 只在指定的模式中被载入
.env.[mode].local   # 只在指定的模式中被载入，但会被 git 忽略
```

一个环境文件只包含环境变量的“键=值”对：

```
APPID=bar
CHEERS_MP_SECRET=secret
```

被载入的变量将会对 `cheers-mp-service` 的所有命令、插件和依赖以及`cheers-config.js`中可用。

::: tip 环境加载属性

为一个特定模式准备的环境文件 (例如 `.env.production`) 将会比一般的环境文件 (例如 `.env`) 拥有更高的优先级。

此外，cheers-mp-service 服务 启动时已经存在的环境变量拥有最高优先级，并不会被 `.env` 文件覆写。
:::

::: warning NODE_ENV
如果在环境中有默认的 `NODE_ENV`，你应该移除它或在运行 `cheers-mp-service` 命令的时候明确地设置 `NODE_ENV`。
:::

## 模式

**模式**是 cheers-mp 项目中一个重要的概念。默认情况下，一个 cheers-mp 项目有两个模式：

- `development` 模式用于 `cheers-mp-service serve`
- `production` 模式用于 `cheers-mp-service build`

注意模式不同于 `NODE_ENV`，一个模式可以包含多个环境变量。

也就是说，每个模式都会将 `NODE_ENV` 的值设置为模式的名称——比如在 development 模式下会去读取`.development` 文件，如果文件里设置了 `NODE_ENV=development` 的环境变量，则`NODE_ENV`会被设置为 `"development"`；如果没有设置，则看命令名字，`serve`命令对应`"development"`, `build` 命令对应 `"production"`.

你可以通过为 `.env` 文件增加后缀来设置某个模式下特有的环境变量。比如，如果你在项目根目录创建一个名为 `.env.development` 的文件，那么在这个文件里声明过的变量就只会在 development 模式下被载入。

你可以通过传递 `--mode` 选项参数为命令行覆写默认的模式。例如，如果你想要在构建命令中使用开发环境变量，请在你的 `package.json` 脚本中加入：

```
"build:uat": "cheers-mp-service build --mode uat",
```

## 示例：Staging 模式

假设我们有一个应用包含以下 `.env` 文件：

```
CHEERS_MP_TITLE=My App
```

和 `.env.staging` 文件：

```
NODE_ENV=production
CHEERS_MP_TITLE=My App (staging)
```

- `cheers-mp-service build` 会加载可能存在的 `.env`、`.env.production` 和 `.env.production.local` 文件然后构建出生产环境应用；

- `cheers-mp-service build --mode staging` 会在 staging 模式下加载可能存在的 `.env`、`.env.staging` 和 `.env.staging.local` 文件然后构建出生产环境应用。

这两种情况下，根据 `NODE_ENV`，构建出的应用都是生产环境应用，但是在 staging 版本中，`process.env.CHEERS_MP_TITLE` 被覆写成了另一个值。

## 在客户端侧代码中使用环境变量

除了特殊的环境变量`NODE_ENV`、`APPID` 以外，其它只有以 `CHEERS_MP_` 开头的变量会被脚手架静态嵌入到客户端侧的包中。你可以在应用的代码中这样访问它们：

```js
console.log(process.env.CHEERS_MP_SECRET);
console.log(process.env.NODE_ENV);
console.log(process.env.APPID);
```

在构建过程中，`process.env.CHEERS_MP_SECRET` 将会被相应的值所取代。在 `CHEERS_MP_SECRET=secret` 的情况下，它会被替换为 `"secret"`。

除了 `CHEERS_MP_*` 变量之外，在你的应用代码中始终可用的还有两个特殊的变量：

- `NODE_ENV` - 会是 `"development"`、`"production"` 中的一个。具体的值取决于应用运行的[模式](#模式)和命令。
- `APPID` - 是小程序的 appid,如果你的开发会在多个小程序之中切换，你可在环境变量中定义它，它会自动替换`project.config.json`中的`appid`的值。

所有解析出来的环境变量都可以在客户端和 nodejs 代码中访问到

::: tip 提示
你可以在 `cheers.config.js` 文件中计算环境变量。它们仍然需要以 `CHEERS_MP_` 前缀开头。这可以用于版本信息:

```js
process.env.CHEERS_MP_VERSION = require("./package.json").version;

module.exports = {
  // config
};
```

:::
