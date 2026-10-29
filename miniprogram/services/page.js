const local = require('./local');
const labels = { daily: '日常通勤', interview: '面试', date: '约会', sports: '运动', party: '聚会', business: '商务宴请' };
function show(page, selected) {
  const profile = local.read();
  page.setData({ dark: profile.dark, profile });
  if (typeof page.getTabBar === 'function' && page.getTabBar()) {
    page.getTabBar().setData({ selected, dark: profile.dark });
  }
}
function error(page, err) { page.setData({ error: err.message || '操作失败，请重试' }); }
function pending() { wx.showToast({ title: '该功能将在后续阶段接入', icon: 'none' }); }
function confirm(content) { return new Promise(resolve => wx.showModal({ title: '确认操作', content, success: r => resolve(r.confirm), fail: () => resolve(false) })); }
module.exports = { show, error, pending, confirm, labels };
