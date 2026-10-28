const api = require('../../services/api'); const ui = require('../../services/page');
Page({
  data: { items: [], filtered: [], filter: 'all', busy: false, error: '', dark: false, filters: [{ id: 'all', label: '全部' }].concat(Object.keys(ui.labels).map(id => ({ id, label: ui.labels[id] }))) },
  onShow() { ui.show(this, 2); this.load(); },
  async load() { this.setData({ busy: true, error: '' }); try { const items = await api.request('/history'); this.setData({ items: items.map(x => Object.assign({}, x, { date: x.saved_at.slice(0, 10), label: ui.labels[x.occasion] })) }); this.filterItems(); } catch (e) { ui.error(this, e); } finally { this.setData({ busy: false }); } },
  filterItems() { this.setData({ filtered: this.data.items.filter(x => this.data.filter === 'all' || x.occasion === this.data.filter) }); },
  filter(e) { this.setData({ filter: e.currentTarget.dataset.id }); this.filterItems(); },
  home() { wx.switchTab({ url: '/pages/home/index' }); },
  async remove(e) { if (this.data.busy || !(await ui.confirm('删除这条穿搭记录？'))) return; this.setData({ busy: true }); try { await api.request('/history/' + e.currentTarget.dataset.id, 'DELETE'); await this.load(); } catch (err) { ui.error(this, err); } finally { this.setData({ busy: false }); } }
});
