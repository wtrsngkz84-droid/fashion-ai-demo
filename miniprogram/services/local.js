const KEY = 'fashion-mini-v1';
const defaults = { nickname: '时尚达人', location: '', bio: '', preferences: ['简约', '休闲'], plans: [], posts: [], reactions: {}, dark: false };
function read() { return Object.assign({}, defaults, wx.getStorageSync(KEY) || {}); }
function save(patch) { const value = Object.assign(read(), patch); wx.setStorageSync(KEY, value); return value; }
function uid() { return Date.now() + '-' + Math.random().toString(36).slice(2, 8); }
module.exports = { read, save, uid };
