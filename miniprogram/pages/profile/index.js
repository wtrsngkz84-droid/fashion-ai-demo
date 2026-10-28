const local = require('../../services/local'); const ui = require('../../services/page');
Page({
  data: { profile: {}, dark: false, styles: [], error: '' },
  onShow() { ui.show(this, 4); this.styles(); },
  styles() { this.setData({ styles: ['简约', '商务', '休闲', '甜美', '酷飒', '运动'].map(label => ({ label, active: this.data.profile.preferences.includes(label) })) }); },
  field(e) { this.setData({ ['profile.' + e.currentTarget.dataset.field]: e.detail.value }); },
  save() { local.save(this.data.profile); wx.showToast({ title: '已保存到本机' }); },
  toggle(e) { const label = e.currentTarget.dataset.label; const preferences = this.data.profile.preferences.includes(label) ? this.data.profile.preferences.filter(s => s !== label) : this.data.profile.preferences.concat(label); this.setData({ 'profile.preferences': preferences }); local.save({ preferences }); this.styles(); },
  theme(e) { local.save({ dark: e.detail.value }); ui.show(this, 4); },
  home() { wx.switchTab({ url: '/pages/home/index' }); }, pending: ui.pending
});
