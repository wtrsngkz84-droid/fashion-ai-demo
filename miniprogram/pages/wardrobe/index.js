const api = require('../../services/api');
const ui = require('../../services/page');
const categories = ['上装', '下装', '鞋子', '连衣裙', '外套', '首饰'];
const blank = () => ({ name: '', category: '上装', color: '未指定', color_hex: '#9E9E9E', brand: '', status: 'clean' });
Page({
  data: { items: [], filtered: [], filter: '全部', categories, filters: ['全部'].concat(categories), clean: 0, dirty: 0, busy: false, error: '', edit: false, formOpen: false, form: blank(), tagsText: '', visionNote: '', photo: '', dark: false },
  onShow() { ui.show(this, 1); this.load(); },
  async load() {
    this.setData({ busy: true, error: '' });
    try { const items = await api.request('/garments'); this.setData({ items, clean: items.filter(x => x.status === 'clean').length, dirty: items.filter(x => x.status === 'dirty').length }); this.filterItems(); }
    catch (e) { ui.error(this, e); } finally { this.setData({ busy: false }); }
  },
  filterItems() { this.setData({ filtered: this.data.items.filter(x => this.data.filter === '全部' || x.category === this.data.filter).map(x => Object.assign({}, x, { statusLabel: { clean: '可穿', dirty: '待洗', washing: '洗涤中' }[x.status] })) }); },
  filter(e) { this.setData({ filter: e.currentTarget.dataset.value }); this.filterItems(); },
  toggleEdit() { this.setData({ edit: !this.data.edit }); },
  openForm() { this.setData({ formOpen: true, form: blank(), tagsText: '', visionNote: '', photo: '', error: '' }); },
  closeForm() { if (!this.data.busy) this.setData({ formOpen: false }); },
  field(e) { this.setData({ ['form.' + e.currentTarget.dataset.field]: e.detail.value }); },
  category(e) { this.setData({ 'form.category': categories[Number(e.detail.value)] }); },
  tags(e) { this.setData({ tagsText: e.detail.value }); },
  async submit() {
    if (this.data.busy) return;
    if (!this.data.form.name.trim()) return wx.showToast({ title: '请填写衣物名称', icon: 'none' });
    this.setData({ busy: true, error: '' });
    try {
      const tags = this.data.tagsText.split(/[,，]/).map(s => s.trim()).filter(Boolean);
      await api.request('/garments', 'POST', Object.assign({}, this.data.form, { tags }));
      this.setData({ formOpen: false }); await this.load();
    } catch (e) { ui.error(this, e); } finally { this.setData({ busy: false }); }
  },
  photo() {
    if (this.data.busy) return;
    wx.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'],
      success: async res => {
        const file = res.tempFiles[0];
        if (file.size > 5 * 1024 * 1024) return wx.showToast({ title: '图片不能超过5 MiB', icon: 'none' });
        this.setData({ busy: true, error: '', photo: file.tempFilePath });
        try {
          const result = await api.analyze(file.tempFilePath);
          const patch = { visionNote: result.warnings.join(' '), 'form.color_hex': result.dominant_color };
          if (result.detections.length) patch['form.category'] = result.detections[0].category;
          this.setData(patch);
        } catch (e) { ui.error(this, e); } finally { this.setData({ busy: false }); }
      },
      fail: res => { if (!String(res.errMsg).includes('cancel')) this.setData({ error: '无法选择图片，请检查相册/相机权限' }); }
    });
  },
  async remove(e) {
    if (this.data.busy || !(await ui.confirm('删除这件衣物？已保存的历史快照会保留。'))) return;
    this.setData({ busy: true, error: '' });
    try { await api.request('/garments/' + e.currentTarget.dataset.id, 'DELETE'); await this.load(); }
    catch (err) { ui.error(this, err); } finally { this.setData({ busy: false }); }
  },
  async status(e) {
    if (this.data.busy) return;
    this.setData({ busy: true, error: '' });
    try { await api.request('/garments/' + e.currentTarget.dataset.id, 'PATCH', { status: e.currentTarget.dataset.status === 'clean' ? 'dirty' : 'clean' }); await this.load(); }
    catch (err) { ui.error(this, err); } finally { this.setData({ busy: false }); }
  }
});
