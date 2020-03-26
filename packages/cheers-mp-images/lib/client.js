const chalk = require("chalk");
const glob = require("glob");
/*
interface Options {
  type: "ALI" | "QINIU",
  options: {
    // 阿里
    bucket: string
    region: string
    prefix: string
    accessKeyId: string
    accessKeySecret: string
    fileType?: RegExp
    // 七牛
    zone: string,
    accessKey: string,
    secretKey: string,
    bucket: string,
    prefix: string,
    domain: string,
    https: false
  }
}
*/

class Operator {
  constructor(config, target) {
    this.type = config.type;
    this.prefix = config.options.prefix;
    this.fileType = config.options.fileType || /\.(svg|png|jpe?g|gif|bmp|webp)$/i;
    this.target = target;
    if (config.type === "ALI") {
      this.client = new ALIOSS(config.options);
      this.spliter = "/";
    } else if (config.type === "QINIU") {
      this.client = new QINIUOSS(config.options);
      this.spliter = "_";
    }
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
    const path = require("path");
    const { normalize } = require("./utils");
    const target = normalize(this.target);
    const patterns = `${target}/**/*.**`;
    const queue = glob
      .sync(patterns, { matchBase: true })
      .filter(file => {
        // 排除LOCAL_开头的文件
        return this.fileType.test(file) && /^[^LOCAL_]/g.test(path.basename(file));
      })
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
        if (count === 0) {
          resolve();
        }
        for (let i = 0; i < queue.length; i++) {
          const localFile = normalize(queue[i]);
          const ext = localFile.split(".").reverse()[0];
          const hash = getHash(localFile);
          const objectName = `${this.prefix}${this.spliter}${hash}.${ext}`;
          const relativePath = normalize(relative(__dirname, localFile)).replace(/\.\.(\/)/g, "");
          const upStatus = await this.client.checkFileUpStatus(objectName);
          if (!upStatus) {
            console.log(chalk.yellow(`\n----${relativePath}没有在上传记录中，已进入上传队列...\n`));

            await this.client.upload(objectName, localFile);
            console.log(chalk.green.bold(`\ntips: => ${relativePath} upload success!\n`));
            if (--count === 0) {
              this.allReady = true;
              // console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`))
              resolve();
            }
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
  printStatus() {
    if (this.allReady) {
      console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`));
    } else {
      console.log(chalk.red.bold(`\nOSS图片资源状态未知！`));
    }
  }
}

exports.UploadClient = async function(config, target) {
  const operator = new Operator(config, target);
  await operator.upFiles();
  // 在 done 事件中回调 doneCallback
  operator.printStatus();
};

class ALIOSS {
  constructor(config) {
    const Alioss = require("ali-oss");
    // 连接阿里云OSS
    this.client = new Alioss(config);
    const bucket = config.bucket;
    // 指定操作的bucket
    this.client.useBucket(bucket);
    console.log(chalk.yellow.bold(`----当前阿里云bucket: ${bucket} ----`));
  }

  /** 检查文件是否在云存储空间已经存在  */
  checkFileUpStatus(objectName) {
    return new Promise(resolve => {
      this.client
        .get(objectName)
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
          } else {
            throw new Error(JSON.stringify(e));
          }
        });
    });
  }

  /** 上传文件 */
  upload(objectName, localFile) {
    return this.client.put(objectName, localFile);
    /* 
    {
      name: '',
      url: '',
      res: {
        status: 200,
        statusCode: 200,
        statusMessage: 'OK'
    }
    } */
    // console.log("上传结果", res);
  }
}

class QINIUOSS {
  constructor(options) {
    const qiniu = require("qiniu");
    const config = new qiniu.conf.Config();
    // 空间对应的机房
    config.zone = qiniu.zone[options.zone];
    // 是否使用https域名
    config.useHttpsDomain = options.https || false;
    // 上传是否使用cdn加速
    config.useCdnDomain = true;

    // 初始化上传凭证
    const mac = new qiniu.auth.digest.Mac(options.accessKey, options.secretKey);
    const putPolicy = new qiniu.rs.PutPolicy({
      scope: options.bucket
    });
    /** 上传凭证 */
    this.uploadToken = putPolicy.uploadToken(mac);
    /** 上传器 */
    this.formUploader = new qiniu.form_up.FormUploader(config);
    this.putExtra = new qiniu.form_up.PutExtra();

    this.bucket = options.bucket;
    // 查询器
    this.bucketManager = new qiniu.rs.BucketManager(mac, config);
    console.log(chalk.yellow.bold(`----当前七牛云bucket: ${options.bucket} ----\n`));
    if (/(clouddn.com|qiniucdn.com|qnssl.com|qbox.me)$/i.test(options.domain)) {
      console.log(
        chalk.yellow.bold(
          `---- 警告: 你当前正在使用七牛的CDN 测试域名，测试域名自创建起30个自然日后系统会自动回收，仅供测试使用并且不支持 Https 访问，
          详情点击：https://developer.qiniu.com/fusion/kb/1319/test-domain-access-restriction-rules ----`
        )
      );
    }
  }

  /** 检查文件是否在云存储空间已经存在  */
  checkFileUpStatus(objectName) {
    return new Promise(resolve => {
      this.bucketManager.stat(this.bucket, objectName, function(err, respBody, respInfo) {
        if (err) {
          throw err;
        }
        if (respInfo.statusCode == 612) {
          resolve(false);
        } else if (respInfo.statusCode == 200) {
          resolve(true);
        } else {
          console.log(respInfo);
          resolve(false);
        }
      });
    });
  }

  upload(objectName, localFile) {
    return new Promise((resolve, reject) => {
      // 文件上传
      this.formUploader.putFile(this.uploadToken, objectName, localFile, this.putExtra, function(respErr) {
        if (respErr) {
          reject(respErr);
          return;
        }
        resolve();
        // if (respInfo.statusCode == 200) {
        //   console.log(respBody);
        // } else {
        //   console.log(respInfo.statusCode);
        //   console.log(respBody);
        // }
      });
    });
  }
}
