const chalk = require("chalk");
const glob = require("glob");
const fs = require("fs");
/*
interface Options {
  type: "ALI" | "QINIU" | "UCLOUD",
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
    // Ucloud
    accessKeyId: string,
    secretAccessKey: string,
    bucket: string,
    prefix: string,
    endpoint: string,
    sslEnabled: false
    // any other options are passed to new AWS.S3()
    // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/Config.html#constructor-property
    // 腾讯云
    secretId: string,
    secretKey: string,
    bucket: string,
    region: string,
    prefix: string;
    accessDomain?: string;
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
    } else if (config.type === "UCLOUD") {
      this.client = new UcloudOSS(config.options);
      this.spliter = "/";
    } else if (config.type === "TENCENT") {
      this.client = new TencentOSS(config.options);
      this.spliter = "/";
    }
    this.alreadyUpList = {
      ready: false,
      info: [],
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
      .filter((file) => {
        // 排除LOCAL_开头的文件
        return this.fileType.test(file) && /^[^LOCAL_]/g.test(path.basename(file));
      })
      .map((file) => normalize(file)); // 路径规范化，避免不同的电脑操作系统产生差异
    return queue;
  }
  // 上传文件
  async upFiles() {
    try {
      const relative = require("relative");
      const { normalize, getHash } = require("./utils");
      const queue = this.getupFileQueue();
      let count = queue.length;
      if (count === 0) {
        return Promise.resolve();
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
          console.log(chalk.green.bold(`\ntips: => ${relativePath} 上传成功!\n`));
          if (--count === 0) {
            this.allReady = true;
            // console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`))
            return Promise.resolve();
          }
        } else {
          if (--count === 0) {
            this.allReady = true;
            // console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`))
            return Promise.resolve();
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
  printStatus() {
    if (this.allReady) {
      console.log(chalk.yellow.bold(`\nOSS图片资源全部准备就绪！`));
    } else {
      console.log(chalk.red.bold(`\nOSS图片资源状态未知！`));
    }
  }
}

exports.UploadClient = async function (config, target) {
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
    return new Promise((resolve) => {
      this.client
        .get(objectName)
        .then((result) => {
          if (result.res.status === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch((e) => {
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
      scope: options.bucket,
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
    return new Promise((resolve) => {
      this.bucketManager.stat(this.bucket, objectName, function (err, respBody, respInfo) {
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
      this.formUploader.putFile(this.uploadToken, objectName, localFile, this.putExtra, function (respErr) {
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

class UcloudOSS {
  constructor(options) {
    const s3 = require("s3");
    const client = s3.createClient({
      maxAsyncS3: 20, // this is the default
      s3RetryCount: 3, // this is the default
      s3RetryDelay: 1000, // this is the default
      multipartUploadThreshold: 20971520, // this is the default (20 MB)
      multipartUploadSize: 15728640, // this is the default (15 MB)
      s3Options: {
        s3ForcePathStyle: true,
        // s3DisableBodySigning: true,
        s3BucketEndpoint: true,
        ...options,
      },
    });
    this.client = client;
    this.bucket = options.bucket;
  }

  /** 检查文件是否在云存储空间已经存在  */
  checkFileUpStatus(objectName) {
    return new Promise((resolve, reject) => {
      this.client.s3.headObject(
        {
          Bucket: this.bucket,
          Key: objectName,
        },
        (err) => {
          if (err) {
            if (err.statusCode === 404) {
              resolve(false);
            } else {
              reject(err);
            }
            return;
          }
          /**
                 {
                    AcceptRanges: 'bytes',
                    LastModified: 'Mon, 26 Oct 2020 05:38:35 GMT',
                    ContentLength: '107580',
                    ETag: '"7cf16a88d58a6a39666acecf9950bece"',
                    ContentType: 'image/jpeg',
                    Metadata: {}
                }
                 */
          resolve(true);
        }
      );
    });
  }

  upload(objectName, localFile) {
    return new Promise((resolve, rejects) => {
      const params = {
        localFile,
        s3Params: {
          Bucket: this.bucket,
          Key: objectName,
          // See: http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#putObject-property
        },
      };
      const uploader = this.client.uploadFile(params);
      uploader.on("error", (err) => {
        // console.error("上传失败:", err.stack);
        rejects(err.stack);
      });
      //   uploader.on("progress", () => {
      //     console.log("正在上传:", ((uploader.progressAmount / uploader.progressTotal) * 100).toFixed(0), "%");
      //   });
      uploader.on("end", (res) => {
        resolve(res);
        // console.log("上传完毕", res);
      });
    });
  }
}

class TencentOSS {
  constructor(options) {
    const COS = require("cos-nodejs-sdk-v5");
    const client = new COS({
      SecretId: options.secretId,
      SecretKey: options.secretKey,
    });
    this.client = client;
    this.bucket = options.bucket;
    this.region = options.region;
  }

  /** 检查文件是否在云存储空间已经存在  */
  checkFileUpStatus(objectName) {
    return new Promise((resolve, reject) => {
      this.client
        .headObject({
          Bucket: this.bucket,
          Region: this.region,
          Key: objectName,
        })
        .then((res) => {
          if (res.statusCode === 200) {
            resolve(true);
          } else {
            resolve(false);
          }
        })
        .catch((err) => {
          if (err.statusCode === 404) {
            resolve(false);
          } else {
            reject(err);
          }
        });
    });
  }

  upload(objectName, localFile) {
    return this.client.putObject({
      Bucket: this.bucket,
      Region: this.region,
      Key: objectName,
      Body: fs.createReadStream(localFile),
      ContentLength: fs.statSync(localFile).size,
    });
  }
}
