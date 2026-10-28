// Runs the actual Mini Program API adapter over HTTP using a narrow wx transport shim.
// Does not claim to exercise WXML, native camera, or the WeChat runtime.
const assert = require('node:assert/strict');
global.wx = { request(options) {
  fetch(options.url, { method: options.method, headers: options.header,
    body: options.data ? JSON.stringify(options.data) : undefined })
    .then(async res => options.success({ statusCode: res.status, data: res.status === 204 ? null : await res.json() }))
    .catch(options.fail);
} };
const api = require('../miniprogram/services/api');
(async () => {
  const ids = [];
  let historyId;
  try {
    for (const [name, category] of [['测试上衣', '上装'], ['测试裤子', '下装'], ['测试鞋', '鞋子']]) {
      const garment = await api.request('/garments', 'POST', { name, category, tags: ['通勤'] }); ids.push(garment.id);
    }
    const rec = await api.request('/recommendations', 'POST', { occasion: 'daily' });
    assert(rec.outfits.length > 0);
    const selected = { recommendation_id: rec.id, outfit_index: 0 };
    historyId = (await api.request('/history', 'POST', selected)).id;
    assert((await api.request('/history')).some(x => x.id === historyId));
    await api.request('/feedback', 'POST', { ...selected, rating: 'like' });
    console.log('PASS HTTP: Mini Program adapter -> garments -> recommendation -> history -> feedback');
  } finally {
    if (historyId) await api.request('/history/' + historyId, 'DELETE');
    for (const id of ids) await api.request('/garments/' + id, 'DELETE');
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
