const local = require('../../services/local'); const ui = require('../../services/page');
// Original repository copy, explicitly marked as demonstration content. No external images.
const examples = [{ id: 'sample-1', user: '时尚小美', content: '今天这套通勤穿搭超满意！米色衬衫+阔腿裤，舒适又优雅~', outfit: '温柔通勤', sample: true }, { id: 'sample-2', user: '穿搭达人', content: '面试穿搭分享：藏青衬衫+黑色西裤，专业感拉满！', outfit: '专业干练', sample: true }];
Page({
  data: { posts: [], open: false, content: '', dark: false },
  onShow() { ui.show(this, 3); this.load(); },
  load() { const state = local.read(); this.setData({ posts: state.posts.concat(examples).map(p => Object.assign({}, p, state.reactions[p.id] || {})) }); },
  open() { this.setData({ open: true }); }, close() { this.setData({ open: false }); }, input(e) { this.setData({ content: e.detail.value }); },
  save() { if (!this.data.content.trim()) return; const state = local.read(); local.save({ posts: [{ id: local.uid(), user: state.nickname, content: this.data.content.trim(), outfit: '我的穿搭', mine: true }].concat(state.posts) }); this.setData({ open: false, content: '' }); this.load(); },
  react(e) { const { id, field } = e.currentTarget.dataset; const state = local.read(); const reactions = Object.assign({}, state.reactions); reactions[id] = Object.assign({}, reactions[id], { [field]: !(reactions[id] || {})[field] }); local.save({ reactions }); this.load(); },
  async remove(e) { if (!(await ui.confirm('删除这条本机草稿？'))) return; local.save({ posts: local.read().posts.filter(p => p.id !== e.currentTarget.dataset.id) }); this.load(); }
});
