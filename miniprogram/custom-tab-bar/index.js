Component({
  data: { selected: 0, dark: false, tabs: [
    { page: 'home', text: '首页', icon: '🏠' }, { page: 'wardrobe', text: '衣橱', icon: '👗' },
    { page: 'history', text: '历史', icon: '📅' }, { page: 'community', text: '社区', icon: '👥' },
    { page: 'profile', text: '我的', icon: '👤' }
  ] },
  methods: { switchTab(e) { wx.switchTab({ url: '/pages/' + this.data.tabs[e.currentTarget.dataset.index].page + '/index' }); } }
});
