const { test } = require('node:test');
const assert = require('node:assert/strict');
const api = require('../miniprogram/services/api');
const local = require('../miniprogram/services/local');

test('request rejects HTTP failures and preserves readable errors', async () => {
  global.wx = { request: options => options.success({ statusCode: 409, data: { detail: '衣物已删除' } }) };
  await assert.rejects(api.request('/history', 'POST', {}), /衣物已删除/);
});
test('request rejects network failure instead of substituting sample data', async () => {
  global.wx = { request: options => options.fail({}) };
  await assert.rejects(api.request('/garments'), /无法连接/);
});
test('upload rejects malformed response', async () => {
  global.wx = { uploadFile: options => options.success({ statusCode: 200, data: '<html>' }) };
  await assert.rejects(api.analyze('photo.png'), /无效数据/);
});
test('profile patches preserve existing plans and preferences', () => {
  let saved = { plans: [{ id: 'one' }], preferences: ['商务'] };
  global.wx = { getStorageSync: () => saved, setStorageSync: (_, value) => { saved = value; } };
  local.save({ nickname: '测试' });
  assert.equal(local.read().plans.length, 1);
  assert.deepEqual(local.read().preferences, ['商务']);
});
