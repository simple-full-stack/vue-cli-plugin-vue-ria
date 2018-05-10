/* eslint-disable */

const multiparty = require('multiparty');
const fs = require('fs');
const path = require('path');
const success = {
    code: 0,
    result: {}
};
function end(res, data) {
    setTimeout(function () {
        res.end(JSON.stringify(Object.assign({}, success, data)));
    }, 800);
}

class Mockup {
  constructor(baseDir) {
    this.baseDir = baseDir;
  }

  fail(req, res, obj) {
    obj = obj || {};
    end(res, Object.assign({ code: 1 }, obj));
  }

  globalMessage(req, res, message) {
    this.fail(req, res, { message: { global: message } });
  }

  fieldsError(req, res, errors) {
    this.fail(req, res, { fields: errors });
  }

  redirect(req, res, redirectUrl) {
    end(res, { code: 1, message: { redirect: redirectUrl } });
  }

  /**
   * 返回 list 数据
   *
   * @public
   * @param {express.Request} req 请求对象
   * @param {express.Response} res 响应对象
   * @param {Object} obj 要返回的对象
   */
  list(req, res, obj) {
    var requestParams = Object.assign({}, req.query, req.body);
    var pageParams = {
        pageNo: requestParams.pageNo ? parseInt(requestParams.pageNo, 10) : 1,
        pageSize: requestParams.pageSize ? parseInt(requestParams.pageSize, 10) : 30,
        totalCount: (obj.result || obj.page || []).length ? 100 : 0,
        order: requestParams.order,
        orderBy: requestParams.orderBy
    };
    var result = Object.assign(pageParams, obj);
    end(res, { result: result });
  }

  /**
   * 返回成功
   *
   * @public
   * @param {express.Request} req 请求对象
   * @param {express.Response} res 响应对象
   * @param {Object} obj 要返回的对象
   */
  ok(req, res, obj) {
    obj = obj || {};
    end(res, { result: obj });
  }

  /**
   * 上传文件
   *
   * @public
   * @param {express.Request} req 请求对象
   * @param {express.Response} res 响应对象
   * @param {Object} obj 要返回的对象
   */
  upload(req, res, obj) {
    var _this = this;
    if (obj === void 0) {
      obj = {};
    }
    var form = new multiparty.Form();
    return new Promise(function (resolve) {
      form.parse(req, function (err, fields, files) {
        if (err) {
          return res.status(500).end();
        }
        var fileInfo = files.filedata[0];
        var tmpDir = 'static/.tmp/';
        var absoluteTmpDir = path.resolve(this.baseDir, tmpDir);
        if (!fs.existsSync(absoluteTmpDir)) {
          fs.mkdirSync(absoluteTmpDir);
        }
        var fsOutputPath = path.resolve(absoluteTmpDir, fileInfo.originalFilename);
        fs.writeFileSync(fsOutputPath, fs.readFileSync(fileInfo.path));
        fs.unlinkSync(fileInfo.path);
        var data = {
          url: 'http://' + req.headers.host + '/' + tmpDir + fileInfo.originalFilename,
          previewUrl: 'http://' + req.headers.host + '/' + tmpDir + fileInfo.originalFilename,
          fileName: fileInfo.originalFilename,
          type: fileInfo.originalFilename.split('.').pop()
        };
        resolve(Object.assign(data, obj));
      });
    }).then(function (result) {
      var resultScript = req.query.callback + "(" + JSON.stringify(Object.assign({}, success, {
        result: result
      })) + ")";
      res.end(_this.iframeCallback(resultScript));
    });
  }

  /**
   * 构造 HTML 响应结果
   *
   * @private
   * @param {string} script 要返回的脚本
   * @return {string} HTML 字符串
   */
  iframeCallback(script) {
    return `
        <!DOCTYPE html>
        <html>
            <head>
                <meta charset="utf-8" />
            </head>
            <body>
                <script>
                    ${script}
                </script>
            </body>
        </html>
    `;
  }
}

exports.mockup = new Mockup(require('path').resolve(__dirname, '..'));
