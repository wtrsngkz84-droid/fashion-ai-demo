const config = require('../config');
function message(data, fallback) {
  return data && typeof data.detail === 'string' ? data.detail : fallback;
}
function request(path, method = 'GET', data) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: config.apiBase + path, method, data, timeout: 15000,
      header: { Authorization: 'Bearer ' + config.demoToken, 'content-type': 'application/json' },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) resolve(res.data);
        else reject(new Error(message(res.data, '请求失败（' + res.statusCode + '）')));
      },
      fail() { reject(new Error('无法连接服务，请检查本地后端与网络设置')); }
    });
  });
}
function analyze(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: config.apiBase + '/vision/analyze', filePath, name: 'image', timeout: 30000,
      header: { Authorization: 'Bearer ' + config.demoToken },
      success(res) {
        try {
          const data = JSON.parse(res.data);
          if (res.statusCode >= 200 && res.statusCode < 300) resolve(data);
          else reject(new Error(message(data, '图片处理失败')));
        } catch (_) { reject(new Error('图片接口返回无效数据')); }
      },
      fail() { reject(new Error('图片上传失败，请稍后重试')); }
    });
  });
}
module.exports = { request, analyze };
