const api = require('../../services/api');
const local = require('../../services/local');
const ui = require('../../services/page');
Page({
  data: { busy: false, error: '', prompt: '', occasion: 'daily', result: null, profile: {}, plans: [], dark: false,
    occasions: Object.keys(ui.labels).map(id => ({ id, label: ui.labels[id] })), planOpen: false, planDate: '', planName: '' },
  onShow() { ui.show(this, 0); this.setData({ plans: local.read().plans }); },
  input(e) { this.setData({ prompt: e.detail.value }); },
  choose(e) { this.setData({ occasion: e.currentTarget.dataset.id }); },
  async generate() {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '', result: null });
    try {
      // Only simple explicit keywords; unsupported natural-language constraints are not claimed.
      const keys = [['面试', 'interview'], ['约会', 'date'], ['运动', 'sports'], ['聚会', 'party'], ['商务', 'business'], ['通勤', 'daily']];
      const hit = keys.find(pair => this.data.prompt.includes(pair[0]));
      const occasion = hit ? hit[1] : this.data.occasion;
      const result = await api.request('/recommendations', 'POST', { occasion, preferences: local.read().preferences, limit: 3 });
      this.setData({ result, occasion });
    } catch (e) { ui.error(this, e); } finally { this.setData({ busy: false }); }
  },
  async save(e) {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try { await api.request('/history', 'POST', { recommendation_id: this.data.result.id, outfit_index: Number(e.currentTarget.dataset.index) }); wx.showToast({ title: '已保存到历史' }); }
    catch (err) { ui.error(this, err); } finally { this.setData({ busy: false }); }
  },
  async feedback(e) {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try { await api.request('/feedback', 'POST', { recommendation_id: this.data.result.id, outfit_index: Number(e.currentTarget.dataset.index), rating: e.currentTarget.dataset.rating }); wx.showToast({ title: '反馈已记录' }); }
    catch (err) { ui.error(this, err); } finally { this.setData({ busy: false }); }
  },
  openPlan() { this.setData({ planOpen: true }); }, closePlan() { this.setData({ planOpen: false }); },
  planDate(e) { this.setData({ planDate: e.detail.value }); }, planName(e) { this.setData({ planName: e.detail.value }); },
  savePlan() {
    if (!this.data.planDate || !this.data.planName.trim()) return wx.showToast({ title: '请选择日期并填写计划', icon: 'none' });
    const plans = local.read().plans.concat({ id: local.uid(), date: this.data.planDate, name: this.data.planName.trim() });
    local.save({ plans }); this.setData({ plans, planOpen: false, planName: '' });
  },
  deletePlan(e) { const plans = local.read().plans.filter(p => p.id !== e.currentTarget.dataset.id); local.save({ plans }); this.setData({ plans }); },
  profile() { wx.switchTab({ url: '/pages/profile/index' }); },
  wardrobe() { wx.switchTab({ url: '/pages/wardrobe/index' }); }, pending: ui.pending
});
