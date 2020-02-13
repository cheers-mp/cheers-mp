let OSS = require("ali-oss");
const chalk = require("chalk");
const glob = require("glob");
// interface Options {
//   bucket: string
//   region: string
//   publicPath: string
//   accessKeyId: string
//   accessKeySecret: string
//   fileType?: RegExp
// }

class Operator {
  constructor(config, target) {
    this.target = target;
    this.config = config;
    this.config.fileType = this.config.fileType || /\.(svg|png|jpe?g|gif)$/i;
    // 连接阿里云OSS
    this.client = new OSS(config);
    const bucket = config.bucket;
    // 指定操作的bucket
    this.client.useBucket(bucket);
    console.log(chalk.yellow.bold(`----当前bucket: ${bucket}----`));
    this.alreadyUpList = {
      ready: false,
      info: []
    };
    this.allReady = false;
  }
  // config: Options
  // client: any
  // alreadyUpList: {
  //   ready: boolean
  //   info: string[]
  // }
  // allReady: boolean = false
  // target: string
  // 文件上传队列
  getupFileQueue() {
    const { normalize } = require("./utils");
    const target = normalize(this.target);
    const patterns = `${target}/**/*.**`;
    const queue = glob
      .sync(patterns, { matchBase: true })
      .filter(file => this.config.fileType.test(file))
      .map(file => normalize(file)); // 路径规范化，避免不同的电脑操作系统产生差异
    return queue;
  }
  // 上传文件
  upFiles() {
    return new Promise(async resolve => {
      try {
        const relative = require("relative");
        const { normalize, getHash } = require("./utils");
        const queue = this.getupFileQueue();
        let count = queue.length;
        for (let i = 0; i < queue.length; i++) {
          const localFile = normalize(queue[i]);
          const ext = localFile.split(".").reverse()[0];
          const hash = getHash(localFile);
          const objectName = `${this.config.publicPath}/${hash}.${ext}`;
          const relativePath = normalize(relative(__dirname, localFile)).replace(/\.\.(\/)/g, "");
          const upStatus = await this.checkFileUpStatus(objectName);
          if (!upStatus) {
            console.log(chalk.yellow(`\n----${relativePath}没有在上传记录中，已进入上传队列...\n`));
            this.client.put(objectName, localFile).then(() => {
              console.log(chalk.green.bold(`\ntips: => ${relativePath} upload success!\n`));
              if (--count === 0) {
                this.allReady = true;
                // console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`))
                resolve();
              }
            });
          } else {
            if (--count === 0) {
              this.allReady = true;
              // console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`))
              resolve();
            }
          }
        }
      } catch (e) {
        console.log(e);
      }
    });
  }
  // 判断文件是否存在
  checkFileUpStatus(object) {
    return new Promise(resolve => {
      this.client
        .get(object)
        .then(result => {
          if (result.res.status === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch(e => {
          if (e.code === "NoSuchKey") {
            resolve(false);
          }
        });
    });
  }
  printStatus() {
    if (this.allReady) {
      console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`));
    } else {
      console.log(chalk.red.bold(`\nOSS图片资源状态未知！`));
    }
  }
}

// exports.UploadClientPlugin = class UploadClientPlugin {
//   constructor(config, target) {
//     this.target = target;
//     this.config = config;
//   }
//   // target: string
//   // config: Options
//   async apply() {
//     const operator = new Operator(this.config, this.target);
//     await operator.upFiles();
//     // 在 done 事件中回调 doneCallback
//     operator.printStatus();
//   }
// };

exports.UploadClient = async function(config, target) {
  const operator = new Operator(config, target);
  await operator.upFiles();
  // 在 done 事件中回调 doneCallback
  operator.printStatus();
};
