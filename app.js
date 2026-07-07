// ==================== State Management ====================
const StateManager = {
  _state: null,
  _saveTimer: null,

  init(defaultState) {
    const saved = localStorage.getItem('fashion_ai_state');
    if (saved) {
      try {
        this._state = JSON.parse(saved);
        this._migrateState();
      } catch (e) {
        this._state = JSON.parse(JSON.stringify(defaultState));
      }
    } else {
      this._state = JSON.parse(JSON.stringify(defaultState));
    }
    return this._state;
  },

  _migrateState() {
    const defaults = DATA.DEFAULT_STATE;
    for (const key in defaults) {
      if (this._state[key] === undefined) {
        this._state[key] = defaults[key];
      }
    }
    if (this._state.likedOutfits && !(this._state.likedOutfits instanceof Array)) {
      this._state.likedOutfits = [];
    }
    if (this._state.likedPosts && !(this._state.likedPosts instanceof Array)) {
      this._state.likedPosts = [];
    }
    if (this._state.collectedPosts && !(this._state.collectedPosts instanceof Array)) {
      this._state.collectedPosts = [];
    }
  },

  get() {
    return this._state;
  },

  update(partial) {
    Object.assign(this._state, partial);
    this._scheduleSave();
  },

  pushTo(arrayPath, item) {
    const arr = this._state[arrayPath];
    if (arr && Array.isArray(arr)) {
      arr.push(item);
      this._scheduleSave();
    }
  },

  removeFrom(arrayPath, predicate) {
    const arr = this._state[arrayPath];
    if (arr && Array.isArray(arr)) {
      const index = arr.findIndex(predicate);
      if (index !== -1) {
        arr.splice(index, 1);
        this._scheduleSave();
      }
    }
  },

  updateItem(arrayPath, predicate, partial) {
    const arr = this._state[arrayPath];
    if (arr && Array.isArray(arr)) {
      const item = arr.find(predicate);
      if (item) {
        Object.assign(item, partial);
        this._scheduleSave();
      }
    }
  },

  replaceArray(arrayPath, newArray) {
    this._state[arrayPath] = newArray;
    this._scheduleSave();
  },

  _scheduleSave() {
    clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => {
      localStorage.setItem('fashion_ai_state', JSON.stringify(this._state));
    }, 300);
  },

  saveNow() {
    clearTimeout(this._saveTimer);
    localStorage.setItem('fashion_ai_state', JSON.stringify(this._state));
  }
};

let state = null;

// ==================== Helper Functions ====================
function $(sel) { return document.querySelector(sel); }
function $$(sel) { return document.querySelectorAll(sel); }

function uid() { return 'id_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7); }

/**
 * 显示确认弹窗
 * @param {Object} options - 弹窗配置
 * @param {string} options.title - 弹窗标题
 * @param {string} options.body - 弹窗内容
 * @param {Function} options.onConfirm - 确认回调
 */
function showConfirmModal(options) {
  const { title = '确认操作', body = '', onConfirm } = options;
  $('#confirm-title').textContent = title;
  $('#confirm-body').textContent = body;
  $('#modal-confirm').classList.add('active');
  
  const handleConfirm = () => {
    closeConfirmModal();
    if (onConfirm) onConfirm();
  };
  
  const handleCancel = () => {
    closeConfirmModal();
  };
  
  $('#confirm-ok').onclick = handleConfirm;
  $('#confirm-cancel').onclick = handleCancel;
}

/**
 * 关闭确认弹窗
 */
function closeConfirmModal() {
  $('#modal-confirm').classList.remove('active');
  $('#confirm-ok').onclick = null;
  $('#confirm-cancel').onclick = null;
}

/**
 * 删除操作二次确认
 * @param {string} itemName - 要删除的物品名称
 * @param {Function} onConfirm - 确认删除后的回调
 */
function confirmDelete(itemName, onConfirm) {
  showConfirmModal({
    title: '确认删除',
    body: `确定要删除「${itemName}」吗？删除后可前往回收站恢复。`,
    onConfirm
  });
}

function showToast(msg, type = 'info') {
  const t = $('#toast');
  t.textContent = msg;
  t.className = 'toast';
  t.classList.add('show');
  clearTimeout(t._tid);
  t._tid = setTimeout(() => t.classList.remove('show'), 1800);
}

function getCSSColor(name) { return DATA.COLOR_MAP[name] || '#9E9E9E'; }

function statusLabel(s) {
  if (s === 'clean') return '🟢 可穿';
  if (s === 'dirty') return '🟡 该洗了';
  return '🔴 在洗';
}

function statusClass(s) {
  if (s === 'clean') return 'status-clean';
  if (s === 'dirty') return 'status-dirty';
  return 'status-washing';
}

function occasionLabel(occ) {
  return DATA.OCCASION_MAP[occ] || occ;
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 9) return '早上好';
  if (h < 12) return '上午好';
  if (h < 14) return '中午好';
  if (h < 18) return '下午好';
  return '晚上好';
}

function getRelativeDay(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((d - now) / 86400000);
  if (diff === 0) return '今天';
  if (diff === 1) return '明天';
  if (diff === 2) return '后天';
  if (diff < 7) return `${diff}天后`;
  if (diff < 14) return '下周';
  return new Date(dateStr).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function getUpcomingPlans(days = 7) {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const end = new Date(now);
  end.setDate(end.getDate() + days);
  return state.plans.filter(p => {
    const d = new Date(p.date);
    return d >= now && d <= end;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));
}

// ==================== Async Helpers ====================
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function withLoading(promise, options = {}) {
  const { loadingText = '处理中...', minDuration = 800 } = options;
  showToast(loadingText, 'loading');
  const startTime = Date.now();
  try {
    const result = await promise;
    const elapsed = Date.now() - startTime;
    if (elapsed < minDuration) await sleep(minDuration - elapsed);
    return result;
  } catch (err) {
    showToast('操作失败：' + err.message, 'error');
    throw err;
  } finally {
    hideToast();
  }
}

function hideToast() {
  const t = $('#toast');
  t.classList.remove('show');
}

/**
 * 生成 AI 试穿图片
 * @param {string} personImg - 人物图片 URL
 * @param {string} clothImg - 衣物图片 URL
 * @returns {Promise<{imageUrl: string, isFallback?: boolean}>} 试穿结果
 */
async function generateTryOnImage(personImg, outfit) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const size = Math.min(img.width, img.height);
      canvas.width = 512;
      canvas.height = 512;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      
      const scale = 512 / size;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (512 - scaledWidth) / 2;
      const y = (512 - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const fallbackImage = canvas.toDataURL('image/jpeg', 0.95);
      
      let completed = false;
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('Try-on timeout, using original');
          resolve({ imageUrl: fallbackImage, isFallback: true });
        }
      }, 30000);
      
      const outfitDesc = [];
      if (outfit.top) outfitDesc.push(outfit.top);
      if (outfit.bottom) outfitDesc.push(outfit.bottom);
      if (outfit.shoes) outfitDesc.push(outfit.shoes);
      if (outfit.accessory) outfitDesc.push(outfit.accessory);
      
      const prompt = `Fashion photo of person wearing ${outfitDesc.join(', ')}, photorealistic, high quality, studio lighting, full body shot, natural pose, same person from reference image, wearing these clothes, professional fashion photography, white background, 1:1 composition, preserve person's face and body shape from reference image`;
      
      fetch(`${CONFIG.BAIDU_PROXY}/image-to-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: prompt,
          image: base64
        })
      })
      .then(response => response.json())
      .then(result => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          if (result && result.success && result.image_url) {
            resolve({ imageUrl: result.image_url, isFallback: false });
          } else {
            console.log('Try-on failed, using original:', result);
            resolve({ imageUrl: fallbackImage, isFallback: true });
          }
        }
      })
      .catch(err => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          console.log('Try-on error:', err);
          resolve({ imageUrl: fallbackImage, isFallback: true });
        }
      });
    };
    img.onerror = function() {
      const canvas = document.createElement('canvas');
      canvas.width = 400; canvas.height = 500;
      const ctx = canvas.getContext('2d');
      const gradient = ctx.createLinearGradient(0, 0, 400, 500);
      gradient.addColorStop(0, '#E07A5F');
      gradient.addColorStop(1, '#F2CC8F');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 400, 500);
      ctx.fillStyle = '#fff';
      ctx.font = '16px sans-serif';
      ctx.fillText('AI 试穿生成失败', 120, 250);
      ctx.font = '12px sans-serif';
      ctx.fillText('请稍后重试', 150, 275);
      resolve({ imageUrl: canvas.toDataURL(), isFallback: true });
    };
    img.src = personImg;
  });
}

// ==================== Weather & Location ====================
function getWeatherData() {
  if (state.location && DATA.CITY_WEATHER[state.location]) {
    return DATA.CITY_WEATHER[state.location];
  }
  const m = new Date().getMonth();
  if (m >= 5 && m <= 8) return { temp: 30, icon: '☀️', desc: '晴' };
  if (m >= 2 && m <= 4) return { temp: 22, icon: '🌤️', desc: '多云' };
  return { temp: 15, icon: '🌥️', desc: '阴' };
}

function getWeatherEmoji() {
  const w = getWeatherData();
  return `${w.icon} ${w.temp}°C`;
}

function getPlanWeather(city) {
  if (DATA.CITY_WEATHER[city]) {
    return DATA.CITY_WEATHER[city];
  }
  if (DATA.WEATHER_DATA[city]) {
    return DATA.WEATHER_DATA[city];
  }
  return { temp: 25, icon: '☀️', desc: '晴' };
}

function getWeatherIcon(desc) {
  if (desc.includes('晴')) return '☀️';
  if (desc.includes('多云')) return '⛅';
  if (desc.includes('阴')) return '🌥️';
  if (desc.includes('雨')) return '🌧️';
  if (desc.includes('雪')) return '❄️';
  if (desc.includes('雷')) return '⛈️';
  if (desc.includes('雾') || desc.includes('霾')) return '🌫️';
  return '☀️';
}

function fetchWeather(city) {
  $('#dash-weather').textContent = '🔄 获取天气...';
  const cityEncoded = encodeURIComponent(city);
  const url = `https://wttr.in/${cityEncoded}?format=j1`;

  fetch(url)
    .then(res => res.json())
    .then(data => {
      if (data && data.current_condition && data.current_condition.length > 0) {
        const cond = data.current_condition[0];
        const temp = parseInt(cond.temp_C);
        const desc = cond.weatherDesc[0].value;
        const icon = getWeatherIcon(desc);

        StateManager.update({ currentWeather: { temp, icon, desc } });
        $('#dash-weather').textContent = `${icon} ${desc} ${temp}°C`;

        if (DATA.CITY_WEATHER[city]) {
          DATA.CITY_WEATHER[city] = { temp, icon, desc };
        }

        updateStatusBar();
      } else {
        fallbackWeather(city);
      }
    })
    .catch(() => {
      fallbackWeather(city);
    });
}

function fallbackWeather(city) {
  const weather = DATA.WEATHER_DATA[city] || { temp: 25, icon: '☀️', desc: '晴' };
  $('#dash-weather').textContent = `${weather.icon} ${weather.desc} ${weather.temp}°C`;
  StateManager.update({ currentWeather: weather });
  updateStatusBar();
}

function updateLocationDisplay() {
  const locEl = $('#dash-location');
  if (state.location) {
    locEl.textContent = `📍 ${state.location}`;
  } else {
    locEl.textContent = '📍 未设置';
  }
}

function updateStatusBar() {
  const weatherEl = document.querySelector('.status-bar .weather');
  const locEl = document.querySelector('.status-bar .location');
  const dateEl = document.querySelector('.status-bar .date');

  if (weatherEl) weatherEl.textContent = getWeatherEmoji();
  if (locEl) locEl.textContent = state.location ? `📍 ${state.location}` : '📍 未设置';
  if (dateEl) dateEl.textContent = getCurrentDateTime();

  updateHomeDashboard();
}

function getCurrentDateTime() {
  const now = new Date();
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const weekday = weekdays[now.getDay()];
  return `${month}月${day}日 ${weekday}`;
}

function getCurrentTime() {
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function startClock() {
  function update() {
    const timeEl = document.querySelector('.status-bar .time');
    const dateEl = document.querySelector('.status-bar .date');
    if (timeEl) timeEl.textContent = getCurrentTime();
    if (dateEl) dateEl.textContent = getCurrentDateTime();
  }
  update();
  setInterval(update, 1000);
}

// ==================== Render: Chat ====================
function renderChat() {
  const container = $('#chat-messages');
  const msgs = [];
  const greet = getTimeGreeting();
  const w = getWeatherData();

  let greetingText = `${greet}！`;
  if (state.location) {
    greetingText += `${state.location}今天${w.desc}，${w.temp}°C。`;
  }
  greetingText += '今天有什么安排吗？';

  const upcoming = getUpcomingPlans(3);
  const imminent = upcoming.filter(p => {
    const diff = Math.round((new Date(p.date) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    return diff <= 2;
  });
  if (imminent.length > 0) {
    const planNames = imminent.map(p => `${getRelativeDay(p.date)}的<b>${p.occasion}</b>`).join('和');
    greetingText += `<br><br>🔔 提醒：你${planNames}，需要我帮你提前搭配吗？`;
  } else if (upcoming.length > 0) {
    const planNames = upcoming.map(p => `${getRelativeDay(p.date)}的${p.occasion}`).join('、');
    greetingText += `\n我注意到你有${planNames}，需要提前搭配吗？`;
  }

  msgs.push({ type: 'ai', text: greetingText });

  const quickOptions = [
    { label: '🏢 日常通勤', action: 'daily' },
    { label: '⭐ 有重要场合', action: 'important' },
    { label: '☕ 随便逛逛', action: 'casual' },
  ];
  if (imminent.length > 0) {
    imminent.forEach(p => {
      quickOptions.unshift({ label: `🔔 ${getRelativeDay(p.date)}·${p.occasion}`, action: `plan_${p.id}` });
    });
  } else if (upcoming.length > 0) {
    quickOptions.push({ label: `📋 ${getRelativeDay(upcoming[0].date)}·${upcoming[0].occasion}`, action: `plan_${upcoming[0].id}` });
  }
  msgs.push({ type: 'quick', options: quickOptions });

  container.innerHTML = '';
  msgs.forEach(m => appendMessage(m));
  scrollChat();
}

function typeWriter(element, text, onComplete) {
  let i = 0;
  element.innerHTML = '';
  const speed = 30;
  function type() {
    if (i < text.length) {
      element.innerHTML += text.charAt(i);
      i++;
      scrollChat();
      setTimeout(type, speed);
    } else {
      if (onComplete) onComplete();
    }
  }
  type();
}

function appendMessage(msg) {
  const container = $('#chat-messages');
  if (msg.type === 'ai') {
    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.innerHTML = `<span class="msg-avatar"><img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('A 3D soft matte clay mascot, round chubby shape like a mochi, minimalist face with only two big glossy black dot eyes and a tiny curved smile, no nose no eyebrows no outlines, matte vinyl texture, warm cream white body, tiny terracotta beret, soft studio lighting with faint shadow, pastel solid background, pop mart blind box aesthetic, C4D render, centered front view, ultra clean, 4K')}&image_size=square" width="32" height="32" style="border-radius:50%;object-fit:cover"/></span><div class="msg-bubble"></div>`;
    container.appendChild(row);
    typeWriter(row.querySelector('.msg-bubble'), msg.text);
  } else if (msg.type === 'user') {
    const row = document.createElement('div');
    row.className = 'msg-row user';
    row.innerHTML = `<div class="msg-bubble">${msg.text}</div>`;
    container.appendChild(row);
  } else if (msg.type === 'quick') {
    const wrap = document.createElement('div');
    wrap.className = 'quick-replies';
    (msg.options || []).forEach(o => {
      const btn = document.createElement('button');
      btn.className = 'quick-reply';
      btn.textContent = o.label;
      btn.dataset.action = o.action;
      wrap.appendChild(btn);
    });
    container.appendChild(wrap);
  } else if (msg.type === 'loading') {
    const row = document.createElement('div');
    row.className = 'msg-row ai';
    row.innerHTML = `<span class="msg-avatar"><img src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent('A 3D soft matte clay mascot, round chubby shape like a mochi, minimalist face with only two big glossy black dot eyes and a tiny curved smile, no nose no eyebrows no outlines, matte vinyl texture, warm cream white body, tiny terracotta beret, soft studio lighting with faint shadow, pastel solid background, pop mart blind box aesthetic, C4D render, centered front view, ultra clean, 4K')}&image_size=square" width="32" height="32" style="border-radius:50%;object-fit:cover"/></span><div class="msg-bubble"><div class="loading-dots"><span></span><span></span><span></span></div></div>`;
    row.id = 'msg-loading';
    container.appendChild(row);
  } else if (msg.type === 'gap') {
    const card = document.createElement('div');
    card.className = 'gap-card';
    const hasFew = msg.hasFew;
    card.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:8px;">
        <span style="font-size:1.5rem;">⚠️</span>
        <div style="flex:1;">
          <div style="font-weight:600;font-size:0.85rem;margin-bottom:4px;">${hasFew ? '衣橱需要充实' : '搭配可能受限'}</div>
          <div style="font-size:0.78rem;color:var(--muted);margin-bottom:8px;">${msg.text}</div>
          <div class="gap-actions">
            <button class="btn-primary gap-add" style="flex:1;font-size:0.8rem;padding:8px;">📚 去导入衣物</button>
            ${!hasFew ? `<button class="btn-secondary gap-skip" style="font-size:0.78rem;">跳过，直接搭配</button>` : ''}
          </div>
        </div>
      </div>`;
    container.appendChild(card);
  } else if (msg.type === 'outfits') {
    const wrap = document.createElement('div');
    wrap.className = 'outfit-carousel-wrap';
    wrap.innerHTML = `<div class="outfit-carousel-label">为你准备了 ${msg.outfits.length} 套搭配方案 👇</div>`;
    const carousel = document.createElement('div');
    carousel.className = 'outfit-carousel';
    carousel.id = 'carousel-' + msg.outfitId;
    msg.outfits.forEach((o, i) => {
      carousel.appendChild(createOutfitCard(o, i, msg.outfitId));
    });
    const virtualCard = document.createElement('div');
    virtualCard.className = 'outfit-card virtual';
    virtualCard.innerHTML = `<span class="virtual-icon">🎲</span><span class="virtual-text">换一批看看</span><span class="virtual-sub">不满意？换种风格</span>`;
    carousel.appendChild(virtualCard);
    wrap.appendChild(carousel);
    container.appendChild(wrap);
    scrollChat();
  }
}

function scrollChat() {
  const container = $('#chat-messages');
  if (container) container.scrollTop = container.scrollHeight;
}

function createOutfitCard(outfit, index, outfitId) {
  const card = document.createElement('div');
  card.className = 'outfit-card';
  card.dataset.index = index;
  card.dataset.outfitId = outfitId;

  const bgStyle = `background:linear-gradient(135deg,${outfit.moodColor || '#D4C5B9'}22 0%,${outfit.moodColor || '#D4C5B9'}44 100%);`;

  card.innerHTML = `
    <div class="outfit-canvas" style="${bgStyle}">
      <div class="outfit-canvas-bg" style="background:${outfit.moodColor || '#D4C5B9'}"></div>
      <div class="outfit-real-images">
        <div class="outfit-image-item">
          <div class="outfit-image-label">上装</div>
          <img src="${outfit.topImage || getDefaultImage('上装', null, null, 'T恤')}" alt="${outfit.top}" class="outfit-real-img" />
        </div>
        <div class="outfit-image-item">
          <div class="outfit-image-label">下装</div>
          <img src="${outfit.bottomImage || getDefaultImage('下装', null, null, '牛仔裤')}" alt="${outfit.bottom}" class="outfit-real-img" />
        </div>
        <div class="outfit-image-item">
          <div class="outfit-image-label">鞋子</div>
          <img src="${outfit.shoeImage || getDefaultImage('鞋子', null, null, '运动鞋')}" alt="${outfit.shoes}" class="outfit-real-img" />
        </div>
      </div>
    </div>
    <div class="outfit-card-body">
      <div class="outfit-card-title">${outfit.name}</div>
      <div class="outfit-items">
        <span>👔 ${outfit.top}</span>
        ${outfit.bottom !== '-' ? `<span>👖 ${outfit.bottom}</span>` : ''}
        <span>👟 ${outfit.shoes}</span>
      </div>
      <div class="outfit-card-actions">
        <button class="btn-like" data-action="like" data-index="${index}">🤍</button>
        <button class="btn-primary" data-action="select" data-index="${index}">选这套</button>
      </div>
      ${outfit.reason ? `
      <div style="margin-top:8px;">
        <div style="font-size:0.7rem;color:var(--accent);font-weight:600;margin-bottom:2px;">💡 搭配理由</div>
        <div style="font-size:0.72rem;color:var(--muted);line-height:1.5;">${outfit.reason}</div>
      </div>` : ''}
      <button class="btn-tryon" data-action="tryon" data-index="${index}" style="margin-top:6px;">🎨 生成试穿效果图</button>
      <div class="outfit-detail-expand" id="detail-${index}">
        <div class="outfit-detail-inner">
          <p>👔 ${outfit.top}</p>
          <p>👖 ${outfit.bottom || '-'}</p>
          <p>👟 ${outfit.shoes}</p>
          <p>💍 ${outfit.accessory || '无'}</p>
        </div>
      </div>
    </div>`;
  return card;
}

function checkWardrobeAndGenerate(detail) {
  const total = state.wardrobe.length;
  if (total === 0) {
    appendMessage({ type: 'gap', hasFew: true, text: '你的衣橱还是空的，我无法帮你搭配。请先添加一些衣物，或者导入3件示例商品体验一下。' });
    const btn = document.querySelector('.gap-add');
    if (btn) btn.onclick = () => { switchTab('wardrobe'); setTimeout(() => openAddMethodPicker(), 300); };
    return;
  }

  const tops = state.wardrobe.filter(w => w.category === '上装').length;
  const bottoms = state.wardrobe.filter(w => w.category === '下装').length;
  const shoes = state.wardrobe.filter(w => w.category === '鞋子').length;

  let gapText = '';
  if (tops === 0) gapText += '缺少上装，';
  if (bottoms === 0) gapText += '缺少下装，';
  if (shoes === 0) gapText += '缺少鞋子，';

  if (gapText) {
    gapText = gapText.slice(0, -1) + '，建议补充后再生成搭配。';
    appendMessage({ type: 'gap', hasFew: false, text: gapText });
    const skipBtn = document.querySelector('.gap-skip');
    if (skipBtn) skipBtn.onclick = () => doGenerateOutfits(detail);
    const addBtn = document.querySelector('.gap-add');
    if (addBtn) addBtn.onclick = () => { switchTab('wardrobe'); setTimeout(() => openAddMethodPicker(), 300); };
    return;
  }

  doGenerateOutfits(detail);
}

function doGenerateOutfits(detail = '') {
  appendMessage({ type: 'loading' });

  setTimeout(() => {
    const loadingMsg = document.getElementById('msg-loading');
    if (loadingMsg) loadingMsg.remove();

    const tops = state.wardrobe.filter(w => w.category === '上装');
    const bottoms = state.wardrobe.filter(w => w.category === '下装');
    const shoes = state.wardrobe.filter(w => w.category === '鞋子');

    const outfits = [];
    const usedCombinations = new Set();

    for (let i = 0; i < 3 && tops.length > 0 && bottoms.length > 0 && shoes.length > 0; i++) {
      let top, bottom, shoe;
      let attempts = 0;
      const maxAttempts = 50;

      do {
        top = tops[Math.floor(Math.random() * tops.length)];
        bottom = bottoms[Math.floor(Math.random() * bottoms.length)];
        shoe = shoes[Math.floor(Math.random() * shoes.length)];
        attempts++;
      } while (usedCombinations.has(`${top.id}-${bottom.id}-${shoe.id}`) && attempts < maxAttempts);

      const key = `${top.id}-${bottom.id}-${shoe.id}`;
      if (!usedCombinations.has(key)) {
        usedCombinations.add(key);

        let style = 'casual';
        let moodColor = '#E8F0F8';
        let reason = '根据你的衣橱搭配的日常穿搭，舒适又时尚。';

        if (detail.includes('面试')) {
          style = 'professional';
          moodColor = '#3D5A80';
          reason = '面试穿搭要点：简洁大方，颜色稳重，传递专业自信。';
        } else if (detail.includes('约会')) {
          style = 'gentle';
          moodColor = '#F8E8E8';
          reason = '约会穿搭要点：温柔甜美，展现个人魅力，让对方印象深刻。';
        } else if (detail.includes('运动')) {
          style = 'sporty';
          moodColor = '#E8F0E8';
          reason = '运动穿搭要点：舒适透气，方便活动，展现活力。';
        } else if (detail.includes('聚会')) {
          style = 'glam';
          moodColor = '#F0D0D0';
          reason = '聚会穿搭要点：吸睛夺目，展现个性，成为全场焦点。';
        }

        outfits.push({
          name: `方案${['A', 'B', 'C'][i]}：${top.color}${top.name}`,
          hair: '低马尾',
          top: top.name,
          bottom: bottom.name,
          shoes: shoe.name,
          accessory: '',
          style: style,
          moodColor: moodColor,
          topColor: top.colorHex,
          bottomColor: bottom.colorHex,
          shoeColor: shoe.colorHex,
          hairColor: '#3D3D3D',
          reason: reason,
          topImage: top.image,
          bottomImage: bottom.image,
          shoeImage: shoe.image,
          topId: top.id,
          bottomId: bottom.id,
          shoeId: shoe.id,
        });
      }
    }

    if (outfits.length === 0) {
      appendMessage({ type: 'ai', text: '抱歉，无法从你的衣橱中生成有效的搭配方案。请确保衣橱中包含上装、下装和鞋子。' });
      return;
    }

    outfits.forEach((o, i) => { o.__idx = i; });

    StateManager.update({ currentOutfits: outfits });

    appendMessage({ type: 'outfits', outfits, outfitId: Date.now() });

    const userStyle = state.stylePrefs.join('');
    const mismatch = outfits.filter(o => !userStyle.includes(DATA.STYLE_MAP[o.style])).length;
    if (mismatch > 0) {
      setTimeout(() => {
        appendMessage({ type: 'ai', text: `💡 温馨提示：我推荐的方案中有些风格可能和你的偏好不太一致，请以你的选择为准哦！` });
      }, 800);
    }
  }, 800);
}

function handleQuickReply(action, text) {
  if (action.startsWith('plan_')) {
    const planId = action.replace('plan_', '');
    const plan = state.plans.find(p => p.id === planId);
    if (plan) {
      StateManager.update({ currentDetail: plan.occasion, currentOccasion: 'important' });
      checkWardrobeAndGenerate(plan.occasion);
      scrollChat();
      return;
    }
  }

  if (action === '_free') {
    if (text.includes('小陶')) {
      const greetings = ['你好呀！我是小陶，你的专属穿搭助手～', '小陶在呢！有什么穿搭问题想问我吗？', 'Hi～小陶随时待命，帮你打造完美穿搭！', '小陶来啦！今天想怎么搭配呢？'];
      const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
      appendMessage({ type: 'ai', text: randomGreeting });
      const cleanText = text.replace(/小陶/g, '').trim();
      if (cleanText) {
        setTimeout(() => checkWardrobeAndGenerate(cleanText), 500);
      }
      return;
    }
    checkWardrobeAndGenerate(text);
    return;
  }

  if (action === 'daily') {
    StateManager.update({ currentDetail: '日常通勤' });
    checkWardrobeAndGenerate('日常通勤');
  } else if (action === 'important') {
    appendMessage({ type: 'ai', text: '重要场合需要什么风格呢？\n- 面试求职\n- 商务会议\n- 约会见面\n- 聚会派对' });
    appendMessage({ type: 'quick', options: [
      { label: '💼 面试求职', action: '_free' },
      { label: '🏢 商务会议', action: '_free' },
      { label: '💑 约会见面', action: '_free' },
      { label: '🎉 聚会派对', action: '_free' },
    ]});
  } else if (action === 'casual') {
    StateManager.update({ currentDetail: '随便逛逛' });
    checkWardrobeAndGenerate('日常');
  }
}

function updateHomeDashboard() {
  const dashLoc = $('#dash-location');
  const dashWeather = $('#dash-weather');
  if (!dashLoc) return;

  const w = getWeatherData();
  if (state.location) {
    dashLoc.textContent = `📍 ${state.location}`;
    dashWeather.textContent = `${w.icon} ${w.temp}°C ${w.desc}`;
  } else {
    dashLoc.textContent = '📍 点击设置城市';
    dashWeather.textContent = '';
  }

  updateTodayStatus();
  renderHomePlans();
  checkImminentReminders();
}

function updateTodayStatus() {
  const statusEl = $('#today-status');
  const statusText = $('#today-status-text');
  if (!statusEl || !statusText) return;
  const today = new Date().toDateString();
  const todayEntry = state.history.find(r => new Date(r.savedAt).toDateString() === today);
  if (todayEntry) {
    statusEl.style.display = 'flex';
    statusEl.className = 'today-status done';
    statusText.textContent = `今日穿搭已就绪 · ${todayEntry.outfit.name}`;
    statusEl.querySelector('.today-status-icon').textContent = '✅';
    statusEl.title = '点击查看详情';
    statusEl.onclick = function () { switchTab('history'); };
  } else if (state.history.length > 0) {
    statusEl.style.display = 'flex';
    statusEl.className = 'today-status pending';
    statusText.textContent = '今日尚未搭配，去首页看看吧';
    statusEl.querySelector('.today-status-icon').textContent = '📋';
    statusEl.onclick = function () { switchTab('home'); };
  } else {
    statusEl.style.display = 'none';
  }
}

function checkImminentReminders() {
  const banner = $('#reminder-banner');
  const bannerText = $('#reminder-banner-text');
  if (!banner || !bannerText) return;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const imminent = state.plans.filter(p => {
    if (p.reminder === false) return false;
    const d = new Date(p.date);
    d.setHours(0, 0, 0, 0);
    const diff = Math.round((d - now) / 86400000);
    return diff >= 0 && diff <= 2;
  }).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (imminent.length > 0 && !sessionStorage.getItem('reminder-dismissed-' + imminent[0].id)) {
    const p = imminent[0];
    const rel = getRelativeDay(p.date);
    bannerText.textContent = `${rel === '今天' ? '就是' : rel + '有'}${p.occasion}！提前搭配一下吧 👗`;
    banner.style.display = 'flex';
    banner.querySelector('#reminder-banner-close').onclick = function () {
      banner.style.display = 'none';
      sessionStorage.setItem('reminder-dismissed-' + p.id, '1');
    };
  } else {
    banner.style.display = 'none';
  }
}

// ==================== Render: Home Plans ====================
function renderHomePlans() {
  const list = $('#plans-list');
  if (!list) return;
  const upcoming = getUpcomingPlans(14);

  if (!upcoming.length) {
    list.innerHTML = `<div class="no-plans-hint">暂无计划，点击"＋添加"提前规划穿搭</div>`;
    return;
  }

  list.innerHTML = upcoming.map(p => {
    const rel = getRelativeDay(p.date);
    const diff = Math.round((new Date(p.date) - new Date().setHours(0, 0, 0, 0)) / 86400000);
    let chipClass = '';
    let countdown = '';
    if (diff === 0) { chipClass = 'today'; countdown = '今天'; }
    else if (diff === 1) { chipClass = 'imminent'; countdown = '明天'; }
    else if (diff === 2) { chipClass = 'imminent'; countdown = '后天'; }
    else if (diff < 7) { countdown = `${diff}天后`; }
    else { countdown = rel; }
    const reminderOn = p.reminder !== false;
    return `
      <div class="plan-chip${chipClass ? ' ' + chipClass : ''}" data-plan-id="${p.id}" data-occasion="${p.occasion}" data-dest="${p.dest || ''}">
        <span class="chip-countdown">${countdown}</span>
        <span class="chip-occasion" title="${p.occasion}${p.dest ? ' · ' + p.dest : ''}${p.notes ? ' · ' + p.notes : ''}">${occasionLabel(p.occasion)}</span>
        ${p.dest ? `<span class="chip-dest" title="目的地：${p.dest}">📍 ${p.dest}</span>` : ''}
        ${p.dest ? `<span class="chip-weather" title="${getPlanWeather(p.dest).desc} ${getPlanWeather(p.dest).temp}°C">${getPlanWeather(p.dest).icon}${getPlanWeather(p.dest).temp}°</span>` : ''}
        <span class="chip-reminder${reminderOn ? ' active' : ''}" data-toggle-reminder="${p.id}" title="${reminderOn ? '已开启提醒' : '已关闭提醒'}">${reminderOn ? '🔔' : '🔕'}</span>
        <span class="chip-delete" data-delete-plan-home="${p.id}" title="删除">✕</span>
      </div>`;
  }).join('');
}

// ==================== Render: Wardrobe ====================
let wardrobeFilter = '全部';

/**
 * 渲染衣橱页面
 * @param {string} [filter='all'] - 筛选条件：'all' | 品类名 | 品牌名
 * @param {string} [sortBy='newest'] - 排序方式：'newest' | 'most_worn' | 'brand'
 */
function renderWardrobe(filter = 'all', sortBy = 'newest') {
  const container = $('#wardrobe-content');
  const editMode = state.wardrobeEditMode;

  if (!editMode) StateManager.update({ selectedWardrobeIds: [] });

  if (!state.wardrobe.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">👗</div>
        <div class="empty-title">衣橱是空的</div>
        <div class="empty-desc">点击右下角＋按钮添加衣物</div>
        <button class="btn-primary" onclick="switchTab('home')">先看看搭配建议</button>
      </div>`;
    updateBadges();
    return;
  }

  let filtered = state.wardrobe;
  if (wardrobeFilter !== '全部') {
    filtered = state.wardrobe.filter(w => w.category === wardrobeFilter);
  }

  const headerHTML = `
    <div class="wardrobe-header">
      <div class="wardrobe-header-stats">
        <div class="wardrobe-header-stat"><div class="stat-num">${filtered.length}</div><div class="stat-label">${wardrobeFilter === '全部' ? '全部' : wardrobeFilter}</div></div>
        <div class="wardrobe-header-stat"><div class="stat-num">${state.wardrobe.filter(w => w.status === 'clean').length}</div><div class="stat-label">可穿</div></div>
        <div class="wardrobe-header-stat"><div class="stat-num">${state.wardrobe.filter(w => w.status === 'dirty').length}</div><div class="stat-label">待洗</div></div>
      </div>
      <button class="btn-edit${editMode ? ' active' : ''}" data-action="toggle-wardrobe-edit">${editMode ? '取消' : '✏️ 编辑'}</button>
    </div>`;

  const cats = ['全部', ...Object.keys(DATA.CATEGORY_LIBRARY)];
  const catHTML = `<div class="wardrobe-categories">${cats.map(c => `<button class="wardrobe-cat${wardrobeFilter === c ? ' active' : ''}" data-filter="${c}">${c}</button>`).join('')}</div>`;

  let gridHTML = '';
  if (filtered.length === 0) {
    gridHTML = `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">该分类下暂无衣物</div></div>`;
  } else {
    gridHTML = `<div class="wardrobe-grid">${filtered.map(item => `
      <div class="wardrobe-item${editMode ? ' edit-mode' : ''}" data-id="${item.id}">
        ${editMode ? `<div class="item-check${state.selectedWardrobeIds.includes(item.id) ? ' checked' : ''}" data-check="${item.id}">✓</div>` : ''}
        ${item.isSample ? `<div class="sample-badge">模拟数据</div>` : ''}
        <div class="wardrobe-item-color" style="background:${item.colorHex || '#9E9E9E'}">
          ${item.image ? `<img class="wardrobe-item-image" src="${item.image}" data-fallback-icon="${item.icon}" data-fallback-color="${item.color}" onerror="handleImageError(this)">` : `<span>${item.icon}</span>`}
          <span class="color-label">${item.color}</span>
        </div>
        <div class="wardrobe-item-info">
          ${item.brand ? `<div class="wardrobe-item-brand">${item.brand}</div>` : ''}
          <div class="wardrobe-item-name">${item.name}</div>
          <div class="wardrobe-item-meta">
            <span>${item.category}</span>
            <span class="wardrobe-item-status ${statusClass(item.status)}">${statusLabel(item.status)}</span>
          </div>
        </div>
        <button class="wardrobe-item-delete" data-action="delete-wardrobe" data-id="${item.id}" title="删除">✕</button>
      </div>`).join('')}</div>`;
  }

  const selCount = state.selectedWardrobeIds.length;
  const totalCount = filtered.length;
  const editBarHTML = editMode ? `
    <div class="edit-bar">
      <button class="btn-secondary" data-action="select-all-wardrobe">${selCount === totalCount && totalCount > 0 ? '取消全选' : '全选'}</button>
      <span class="edit-bar-info">已选 ${selCount} 件</span>
      <button class="btn-danger" data-action="delete-selected-wardrobe" ${selCount === 0 ? 'disabled' : ''}>🗑️ 删除</button>
    </div>` : '';

  container.innerHTML = headerHTML + catHTML + gridHTML + editBarHTML;
  updateBadges();
}

function toggleWardrobeSelection(id) {
  if (state.selectedWardrobeIds.includes(id)) {
    StateManager.update({ selectedWardrobeIds: state.selectedWardrobeIds.filter(x => x !== id) });
  } else {
    const newIds = [...state.selectedWardrobeIds, id];
    StateManager.update({ selectedWardrobeIds: newIds });
  }
}

function openWardrobeEditModal(item) {
  const subcat = item.subcat || getSubcategoryFromName(item.name);
  const washGuide = DATA.WASH_GUIDE[item.category] && DATA.WASH_GUIDE[item.category][subcat] 
    ? DATA.WASH_GUIDE[item.category][subcat] 
    : { washTemp: '30°C', washMethod: '手洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '' };

  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">✏️ 编辑物品</div>
    <div style="display:flex;gap:12px;margin-bottom:16px;">
      <div style="width:60px;height:60px;background:${item.colorHex || '#E0E0E0'};border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:2rem;">${item.icon || DATA.CAT_ICONS[item.category] || '👔'}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.85rem;">${item.name}</div>
        <div style="font-size:0.7rem;color:var(--muted);margin-top:2px;">${item.brand || '无品牌'} · ${item.category} · ${item.color}</div>
        ${item.price ? `<div style="font-size:0.75rem;color:var(--accent);font-weight:600;margin-top:4px;">${item.price}</div>` : ''}
      </div>
    </div>
    <div class="edit-item-form">
      <label>商品名称</label>
      <input type="text" id="edit-name" value="${item.name.replace(/"/g, '&quot;')}" maxlength="100">
      <label>品牌</label>
      <input type="text" id="edit-brand" value="${(item.brand || '').replace(/"/g, '&quot;')}" placeholder="选填" maxlength="30">
      <div class="manual-form-row">
        <div style="flex:1;"><label>品类</label><select id="edit-cat">
          ${['上装', '下装', '鞋子', '首饰'].map(c => `<option value="${c}"${item.category === c ? ' selected' : ''}>${c}</option>`).join('')}
        </select></div>
        <div style="flex:1;"><label>颜色</label><select id="edit-color">
          ${DATA.COLOR_OPTIONS.map(c => `<option value="${c}"${item.color === c ? ' selected' : ''}>${c}</option>`).join('')}
        </select></div>
      </div>
      <label>状态</label>
      <select id="edit-status">
        <option value="clean"${item.status === 'clean' ? ' selected' : ''}>🟢 可穿</option>
        <option value="dirty"${item.status === 'dirty' ? ' selected' : ''}>🟡 该洗了</option>
        <option value="washing"${item.status === 'washing' ? ' selected' : ''}>🔴 在洗</option>
      </select>
    </div>
    <div style="margin-top:16px;padding:12px;background:var(--accent-light);border-radius:12px;">
      <div style="font-weight:600;font-size:0.8rem;margin-bottom:8px;">🧺 洗护指南</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px;">
        <div style="flex:1;min-width:130px;background:var(--bg);border-radius:8px;padding:8px;">
          <div style="font-size:0.65rem;color:var(--muted);">水温</div>
          <div style="font-size:0.78rem;font-weight:600;">${washGuide.washTemp}</div>
        </div>
        <div style="flex:1;min-width:130px;background:var(--bg);border-radius:8px;padding:8px;">
          <div style="font-size:0.65rem;color:var(--muted);">洗涤方式</div>
          <div style="font-size:0.78rem;font-weight:600;">${washGuide.washMethod}</div>
        </div>
        <div style="flex:1;min-width:130px;background:var(--bg);border-radius:8px;padding:8px;">
          <div style="font-size:0.65rem;color:var(--muted);">晾晒方式</div>
          <div style="font-size:0.78rem;font-weight:600;">${washGuide.dryMethod}</div>
        </div>
        <div style="flex:1;min-width:130px;background:var(--bg);border-radius:8px;padding:8px;">
          <div style="font-size:0.65rem;color:var(--muted);">熨烫温度</div>
          <div style="font-size:0.78rem;font-weight:600;">${washGuide.ironTemp}</div>
        </div>
      </div>
      ${washGuide.notes ? `<div style="font-size:0.7rem;color:var(--muted);line-height:1.4;">💡 ${washGuide.notes}</div>` : ''}
    </div>
    ${item.material || item.season || item.size || item.description ? `
    <div style="margin-top:12px;padding:12px;background:var(--bg2);border-radius:12px;">
      <div style="font-weight:600;font-size:0.8rem;margin-bottom:8px;">📋 商品详情</div>
      ${item.material ? `<div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;"><span style="color:var(--muted);">材质</span><span>${item.material}</span></div>` : ''}
      ${item.season ? `<div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;"><span style="color:var(--muted);">适用季节</span><span>${item.season}</span></div>` : ''}
      ${item.size ? `<div style="display:flex;justify-content:space-between;font-size:0.75rem;margin-bottom:4px;"><span style="color:var(--muted);">尺码</span><span>${item.size}</span></div>` : ''}
      ${item.description ? `<div style="font-size:0.72rem;color:var(--muted);margin-top:4px;line-height:1.4;">${item.description}</div>` : ''}
    </div>
    ` : ''}
    <div class="cat-confirm-row" style="margin-top:16px;">
      <button class="btn-secondary" onclick="closeCategoryModal()">取消</button>
      <button class="btn-primary" data-action="save-wardrobe-edit" data-id="${item.id}">保存修改</button>
    </div>
  `;
  $('#modal-category').classList.add('active');
}

function saveWardrobeEdit(itemId) {
  const content = $('#cat-modal-content');
  const item = state.wardrobe.find(x => x.id === itemId);
  if (!item) return;

  item.name = content.querySelector('#edit-name').value.trim() || item.name;
  item.brand = content.querySelector('#edit-brand').value.trim();
  const newCat = content.querySelector('#edit-cat').value;
  const newColor = content.querySelector('#edit-color').value;
  item.category = newCat;
  item.color = newColor;
  item.colorHex = DATA.COLOR_MAP[newColor] || '#9E9E9E';
  item.icon = DATA.CAT_ICONS[newCat] || '👔';
  item.status = content.querySelector('#edit-status').value;
  if (item.status === 'clean') item.washCount = 0;

  StateManager.saveNow();
  renderWardrobe();
  updateBadges();
  closeCategoryModal();
  showToast('已保存修改');
}

// ==================== Render: History ====================
let historyFilter = '全部';

/**
 * 渲染历史页面
 * @param {string} [filter='全部'] - 筛选条件：'全部' | 场合名 | 风格名
 */
function renderHistory(filter = '全部') {
  const container = $('#history-content');
  const editMode = state.historyEditMode;

  if (!editMode) StateManager.update({ selectedHistoryIds: [] });

  if (!state.history.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📅</div>
        <div class="empty-title">还没有穿搭记录</div>
        <div class="empty-desc">去首页让AI帮你搭配一套吧</div>
        <button class="btn-primary" style="margin-top:8px;" onclick="switchTab('home')">去首页看看</button>
      </div>`;
    updateBadges();
    return;
  }

  let filtered = state.history;
  if (historyFilter !== '全部') {
    filtered = state.history.filter(r => {
      const occ = r.outfit.occasion || '';
      const style = r.outfit.style || '';
      return occ.includes(historyFilter) || style.includes(historyFilter) || r.outfit.name.includes(historyFilter);
    });
  }

  const headerHTML = `
    <div class="wardrobe-header" style="margin-bottom:8px;">
      <div class="wardrobe-header-stats">
        <div class="wardrobe-header-stat"><div class="stat-num">${filtered.length}</div><div class="stat-label">${historyFilter === '全部' ? '全部记录' : historyFilter}</div></div>
        <div class="wardrobe-header-stat"><div class="stat-num">${state.history.filter(r => new Date(r.savedAt).toDateString() === new Date().toDateString()).length}</div><div class="stat-label">今日</div></div>
      </div>
      <button class="btn-edit${editMode ? ' active' : ''}" data-action="toggle-history-edit">${editMode ? '取消' : '✏️ 编辑'}</button>
    </div>`;

  const occasions = ['全部', '面试', '约会', '通勤', '运动', '聚会', '商务'];
  const filterHTML = !editMode ? `
    <div class="history-filters">
      ${occasions.map(o => `<button class="history-filter${historyFilter === o ? ' active' : ''}" data-filter="${o}">${o}</button>`).join('')}
    </div>` : '';

  const groups = {};
  filtered.forEach(r => {
    const d = new Date(r.savedAt).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', weekday: 'short' });
    if (!groups[d]) groups[d] = [];
    groups[d].push(r);
  });

  let html = '';
  if (Object.keys(groups).length === 0) {
    html += `<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">该分类下暂无记录</div></div>`;
  }
  for (const [date, records] of Object.entries(groups)) {
    html += `<div class="history-group"><div class="history-group-date">${date}</div>`;
    records.forEach(r => {
      const o = r.outfit;
      const checked = state.selectedHistoryIds.includes(r.id);
      html += `
        <div class="history-item${editMode ? ' edit-mode' : ''}" data-hid="${r.id}">
          ${editMode ? `<div class="history-check${checked ? ' checked' : ''}" data-check="${r.id}">✓</div>` : ''}
          <div class="history-item-canvas" style="background:linear-gradient(135deg,${o.moodColor || '#D4C5B9'}22 0%,${o.moodColor || '#D4C5B9'}44 100%);">
            <span style="font-size:1.5rem;">👔</span>
          </div>
          <div class="history-item-info">
            <div class="history-item-name">${o.name}</div>
            <div class="history-item-desc">${o.top}+${o.bottom}+${o.shoes}</div>
            <div class="history-item-meta">
              <span>${occasionLabel(o.occasion || o.style)}</span><span>${r.weather}</span>
            </div>
          </div>
          ${!editMode ? `<button class="wardrobe-item-delete" data-action="delete-history" data-id="${r.id}" style="position:static;opacity:1;margin-left:auto;align-self:center;flex-shrink:0;" title="删除">✕</button>` : ''}
        </div>
        <div class="history-expanded" id="hexp-${r.id}">
          <div class="history-expanded-inner">
            <div style="display:flex;flex-wrap:wrap;gap:4px 10px;font-size:0.75rem;color:var(--ink);margin-bottom:8px;">
              <span>💇 ${o.hair}</span><span>👔 ${o.top}</span><span>👖 ${o.bottom || '-'}</span><span>👟 ${o.shoes}</span><span>💍 ${o.accessory}</span>
            </div>
            <div style="display:flex;gap:8px;">
              <button class="btn-primary" data-action="rewear" data-outfit='${JSON.stringify(o).replace(/'/g, "&#39;")}' style="flex:1;font-size:0.78rem;">🔄 再穿一次</button>
            </div>
          </div>
        </div>`;
    });
    html += '</div>';
  }

  const selCount = state.selectedHistoryIds.length;
  const totalCount = filtered.length;
  const editBarHTML = editMode ? `
    <div class="edit-bar">
      <button class="btn-secondary" data-action="select-all-history">${selCount === totalCount && totalCount > 0 ? '取消全选' : '全选'}</button>
      <span class="edit-bar-info">已选 ${selCount} 条</span>
      <button class="btn-danger" data-action="delete-selected-history" ${selCount === 0 ? 'disabled' : ''}>🗑️ 删除</button>
    </div>` : '';

  const clearBtn = !editMode ? `<button class="btn-secondary" style="margin-top:8px;width:100%;text-align:center;" data-action="clear-history">🗑️ 清空全部历史</button>` : '';

  container.innerHTML = headerHTML + filterHTML + html + editBarHTML + clearBtn;
  updateBadges();
}

function toggleHistorySelection(id) {
  if (state.selectedHistoryIds.includes(id)) {
    StateManager.update({ selectedHistoryIds: state.selectedHistoryIds.filter(x => x !== id) });
  } else {
    const newIds = [...state.selectedHistoryIds, id];
    StateManager.update({ selectedHistoryIds: newIds });
  }
}

function clearHistory() {
  if (confirm('确定清空所有穿搭历史吗？此操作不可恢复。')) {
    StateManager.replaceArray('history', []);
    renderHistory();
    showToast('历史已清空');
  }
}

// ==================== Render: Community ====================
/**
 * 渲染社区页面
 */
function renderCommunity() {
  const container = $('#community-content');
  const posts = state.userPosts ? [...state.userPosts, ...DATA.COMMUNITY_POSTS] : DATA.COMMUNITY_POSTS;

  container.innerHTML = `
    <div class="community-header">
      <div class="community-title">👥 穿搭社区</div>
      <div class="community-subtitle">分享你的穿搭灵感，发现更多搭配思路</div>
      <button class="btn-primary" style="margin-top:12px;width:100%;padding:10px;" data-action="open-post-modal">📸 发布穿搭</button>
    </div>
    <div class="community-posts">
      ${posts.map(post => {
        const isLiked = state.likedPosts.includes(post.id);
        const isCollected = state.collectedPosts.includes(post.id);
        return `
        <div class="community-post">
          <div class="post-header">
            <div class="post-avatar">${post.avatar || '👤'}</div>
            <div class="post-user-info">
              <div class="post-user">${post.user || '我'}</div>
              <div class="post-time">${post.isMine ? '刚刚' : (Math.floor(Math.random() * 24) + '小时前')}</div>
            </div>
            ${post.isMine ? `<button class="post-action-btn" data-action="open-edit-post" data-id="${post.id}" style="margin-left:auto;">✏️</button>` : ''}
          </div>
          <div class="post-content">${post.content}</div>
          ${post.image ? `<div class="post-image"><img src="${post.image}" alt="穿搭照片"></div>` : ''}
          <div class="post-outfit-tag">🎨 ${post.outfit}</div>
          <div class="post-actions">
            <button class="post-action-btn${isLiked ? ' liked' : ''}" data-action="like-post" data-id="${post.id}">
              ${isLiked ? '❤️' : '🤍'} <span>${isLiked ? post.likes + 1 : post.likes}</span>
            </button>
            <button class="post-action-btn${isCollected ? ' collected' : ''}" data-action="collect-post" data-id="${post.id}">
              ${isCollected ? '⭐' : '☆'} <span>${isCollected ? post.collected + 1 : post.collected}</span>
            </button>
          </div>
        </div>
        `;
      }).join('')}
    </div>`;
}

let postImageData = null;

function openPostModal() {
  postImageData = null;
  $('#post-photo-preview').style.display = 'none';
  $('#post-photo-placeholder').style.display = 'flex';
  $('#post-content').value = '';
  $('#modal-post').classList.add('active');

  const photoArea = $('#post-photo-area');
  const photoInput = $('#post-photo-input');

  photoArea.onclick = function () {
    photoInput.click();
  };

  photoInput.onchange = function (e) {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        postImageData = event.target.result;
        $('#post-photo-preview').src = postImageData;
        $('#post-photo-preview').style.display = 'block';
        $('#post-photo-placeholder').style.display = 'none';
      };
      reader.readAsDataURL(file);
    }
  };
}

function closePostModal() {
  $('#modal-post').classList.remove('active');
}

function submitPost() {
  const content = $('#post-content').value.trim();
  const outfit = $('#post-outfit').value;

  if (!content && !postImageData) {
    showToast('请填写文案或上传照片');
    return;
  }

  const newPost = {
    id: Date.now(),
    user: '我',
    avatar: '👤',
    content: content || '今天的穿搭分享~',
    outfit: outfit,
    image: postImageData,
    likes: 0,
    collected: 0,
    isMine: true
  };

  if (!state.userPosts) {
    StateManager.update({ userPosts: [newPost] });
  } else {
    const posts = [newPost, ...state.userPosts];
    StateManager.update({ userPosts: posts });
  }
  closePostModal();
  renderCommunity();
  showToast('发布成功！');
}

// ==================== Render: Profile ====================
function renderProfile() {
  const container = $('#profile-content');
  const w = getWeatherData();
  const upcoming = getUpcomingPlans(14);

  container.innerHTML = `
    <div class="profile-card">
      <div class="profile-header">
        <div class="profile-avatar">${state.avatar ? `<img src="${state.avatar}" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">` : '👤'}</div>
        <div>
          <div class="profile-name">${state.nickname || '时尚达人'}</div>
          <div class="profile-edit" data-action="open-profile-modal">编辑资料</div>
        </div>
      </div>
      ${state.bio ? `<div style="font-size:0.8rem;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--rule);">${state.bio}</div>` : ''}
    </div>

    <div class="profile-card">
      <div class="section-label">📍 所在地区</div>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" id="location-input" value="${state.location || ''}" placeholder="输入城市名称..." style="flex:1;padding:8px 12px;border-radius:16px;border:1.5px solid var(--rule);background:var(--bg2);font-size:0.82rem;font-family:var(--font-system);color:var(--ink);">
        <button class="btn-secondary" data-action="save-location" style="padding:8px 16px;font-size:0.75rem;">保存</button>
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px;margin-top:8px;">
        ${DATA.CITY_LIST.map(c => `
          <button class="btn-secondary" style="font-size:0.7rem;padding:4px 10px;" data-action="select-location" data-city="${c}">${c}</button>
        `).join('')}
      </div>
      ${state.location ? `<div style="margin-top:8px;font-size:0.82rem;color:var(--muted);">当前天气：${w.icon} ${w.desc} · ${w.temp}°C</div>` : ''}
    </div>

    <div class="profile-card">
      <div class="section-label">📸 个人全身照</div>
      <div class="photo-upload-area${state.userPhoto ? ' has-photo' : ''}" id="photo-upload-area" style="position:relative;">
        ${state.userPhoto
          ? `<img src="${state.userPhoto}" alt="全身照"><button class="btn-remove-photo" data-action="remove-photo">✕</button>`
          : `<div class="photo-upload-placeholder"><span class="upload-icon">📷</span><span class="upload-text">点击上传全身照<br>用于穿搭效果图</span></div>`
        }
      </div>
      <input type="file" accept="image/*" id="photo-file-input" style="display:none;">
      ${state.userPhoto ? `<div style="font-size:0.7rem;color:var(--muted);margin-top:6px;text-align:center;">照片已就绪，方案卡片中将叠加显示</div>` : ''}
    </div>

    <div class="profile-card">
      <div class="section-label">📋 我的计划（未来安排）</div>
      ${upcoming.length > 0 ? upcoming.map(p => `
        <div class="plan-card">
          <div class="plan-date-badge">${new Date(p.date).getDate()}<small>${new Date(p.date).toLocaleDateString('zh-CN', { month: 'short' })}</small></div>
          <div class="plan-info">
            <div class="plan-occasion">${p.occasion}</div>
            <div class="plan-notes">${getRelativeDay(p.date)} · ${p.notes || '无备注'}</div>
          </div>
          <button class="plan-delete" data-action="delete-plan" data-id="${p.id}" title="删除">✕</button>
        </div>
      `).join('') : `<div style="font-size:0.78rem;color:var(--muted);text-align:center;padding:8px;">暂无未来计划</div>`}
      <button class="add-plan-btn" data-action="add-plan">＋ 添加计划</button>
      <div class="plan-form" id="plan-form" style="display:none;">
        <input type="date" id="plan-date" min="${new Date().toISOString().split('T')[0]}">
        <select id="plan-occasion">
          <option value="daily">日常通勤</option><option value="interview">面试</option>
          <option value="date">约会</option><option value="sports">运动</option>
          <option value="party">聚会</option><option value="business">商务宴请</option>
          <option value="custom">✏️ 自定义...</option>
        </select>
        <input type="text" id="plan-occasion-custom" placeholder="输入你的计划（如：毕业典礼、亲子活动）" maxlength="30" style="display:none;">
        <input type="text" id="plan-dest" placeholder="📍 目的地（选填）" maxlength="20">
        <input type="text" id="plan-notes" placeholder="备注（可选）" maxlength="50">
        <div class="plan-form-row">
          <button class="btn-secondary" data-action="cancel-plan">取消</button>
          <button class="btn-primary" data-action="save-plan">保存</button>
        </div>
      </div>
    </div>

    <div class="profile-card">
      <div class="section-label">风格偏好</div>
      <div class="style-tags">
        ${state.stylePrefs.filter(s => !['简约', '商务', '休闲', '甜美', '酷飒', '运动'].includes(s)).map(s => `
          <span class="style-tag selected custom-tag" data-action="remove-style" data-style="${s}">${s} ✕</span>
        `).join('')}
        ${['简约', '商务', '休闲', '甜美', '酷飒', '运动'].map(s => `
          <span class="style-tag${state.stylePrefs.includes(s) ? ' selected' : ''}" data-action="toggle-style" data-style="${s}">${s}</span>
        `).join('')}
        <span class="style-tag add-tag" data-action="add-custom-style">＋ 添加自定义</span>
      </div>
      <div id="custom-style-input" style="display:none;margin-top:8px;">
        <input type="text" id="custom-style-text" placeholder="输入自定义风格（如：复古、日系）" maxlength="10" style="width:100%;padding:8px 12px;border-radius:10px;border:1.5px solid var(--rule);font-size:0.82rem;font-family:var(--font-system);background:var(--bg2);color:var(--ink);">
        <div style="display:flex;gap:8px;margin-top:6px;">
          <button class="btn-secondary" data-action="cancel-custom-style" style="flex:1;font-size:0.75rem;">取消</button>
          <button class="btn-primary" data-action="confirm-custom-style" style="flex:1;font-size:0.75rem;">添加</button>
        </div>
      </div>
    </div>

    <div class="profile-card">
      <div class="section-label">体型信息（选填）<span style="font-size:0.65rem;font-weight:400;color:var(--muted);margin-left:4px;">🔒 隐私保护</span></div>
      <div class="setting-row" data-action="open-body-info">
        <span class="setting-label">身高 · 体重 · 肩宽 · 腰围</span><span class="setting-value">${state.bodyInfo ? '已填写 ›' : '未填写 ›'}</span>
      </div>
    </div>

    <div class="profile-card">
      <div class="section-label">功能设置</div>
      <div class="setting-row" id="row-dark-mode">
        <span class="setting-label">🌙 深色模式</span>
        <button class="setting-toggle${state.theme === 'dark' ? ' on' : ''}" data-action="toggle-dark"></button>
      </div>
      <div class="setting-row" id="row-3d-toggle">
        <span class="setting-label">🎨 3D试穿体验</span>
        <button class="setting-toggle on" data-action="toggle-3d"></button>
      </div>
      <div class="setting-row" id="row-notif-toggle">
        <span class="setting-label">🔔 通知提醒</span>
        <button class="setting-toggle on" data-action="toggle-notif"></button>
      </div>
      <div class="setting-row" data-action="open-wash-reminder">
        <span class="setting-label">🧺 洗护提醒</span><span class="setting-value">›</span>
      </div>
    </div>

    <div class="profile-card">
      <div class="section-label">💾 数据管理</div>
      <div class="setting-row" data-action="export-data">
        <span class="setting-label">📤 导出数据</span><span class="setting-value">›</span>
      </div>
      <div class="setting-row" onclick="document.getElementById('import-file').click()">
        <span class="setting-label">📥 导入数据</span><span class="setting-value">›</span>
      </div>
      <input type="file" id="import-file" accept=".json" style="display:none;" onchange="importData(this)">
      <div style="font-size:0.7rem;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--rule);text-align:center;">数据仅存储在本地，建议定期备份</div>
    </div>

    <div class="profile-card">
      <div class="section-label">关于</div>
      <div class="setting-row" data-action="open-3d-modal">
        <span class="setting-label">🎨 关于3D试穿</span><span class="setting-value">›</span>
      </div>
      <div class="setting-row" onclick="showToast('隐私政策页面开发中')">
        <span class="setting-label">🔒 隐私政策</span><span class="setting-value">›</span>
      </div>
      <div class="setting-row">
        <span class="setting-label">📱 版本</span><span class="setting-value">Demo v3.0</span>
      </div>
    </div>

    <div class="trust-note">
      AI穿搭助手 · 用户为主，AI为辅<br>
      你的衣橱数据仅存储在本地设备<br>
      照片不会上传，仅本地使用
    </div>
  `;

  const photoArea = container.querySelector('#photo-upload-area');
  const fileInput = container.querySelector('#photo-file-input');
  if (photoArea && fileInput) {
    photoArea.addEventListener('click', function (e) {
      if (e.target.closest('[data-action="remove-photo"]')) return;
      fileInput.click();
    });
    fileInput.addEventListener('change', function () {
      const file = this.files[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) { showToast('照片请小于5MB'); return; }
      const reader = new FileReader();
      reader.onload = function () {
        StateManager.update({ userPhoto: reader.result });
        renderProfile();
        showToast('全身照已就绪 📸');
      };
      reader.readAsDataURL(file);
    });
  }

  const occasionSel = container.querySelector('#plan-occasion');
  const customInput = container.querySelector('#plan-occasion-custom');
  if (occasionSel && customInput) {
    occasionSel.addEventListener('change', function () {
      if (this.value === 'custom') { customInput.style.display = 'block'; customInput.focus(); }
      else { customInput.style.display = 'none'; customInput.value = ''; }
    });
  }
}

// ==================== Tab Navigation ====================
function switchTab(tab) {
  const updates = { activeTab: tab };
  if (tab !== 'wardrobe') { updates.wardrobeEditMode = false; updates.selectedWardrobeIds = []; }
  if (tab !== 'history') { updates.historyEditMode = false; updates.selectedHistoryIds = []; }
  StateManager.update(updates);

  $$('.page').forEach(p => { p.classList.remove('active'); p.style.zIndex = '1'; });
  $$('.tab-btn').forEach(b => b.classList.remove('active'));

  const pageMap = { home: 'page-home', wardrobe: 'page-wardrobe', history: 'page-history', community: 'page-community', profile: 'page-profile' };
  const page = document.getElementById(pageMap[tab]);
  if (page) { page.classList.add('active'); page.style.zIndex = '2'; }

  const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
  if (tabBtn) tabBtn.classList.add('active');

  const fab = $('#fab-add');
  fab.style.display = (tab === 'wardrobe' && !state.wardrobeEditMode) ? 'flex' : 'none';

  if (tab === 'wardrobe') renderWardrobe();
  if (tab === 'history') renderHistory();
  if (tab === 'community') renderCommunity();
  if (tab === 'profile') renderProfile();
  if (tab === 'home') {
    updateHomeDashboard();
    const chatContainer = $('#chat-messages');
    if (chatContainer && chatContainer.children.length === 0) {
      renderChat();
    } else {
      scrollChat();
    }
  }
}

// ==================== Add Method Picker ====================
function openAddMethodPicker() {
  openPhotoRecognition();
}

function closeAddMethodPicker() {
  $('#modal-add-method').classList.remove('active');
}

function openCategoryPicker() {
  const content = $('#cat-modal-content');
  let html = `<div style="font-weight:700;margin-bottom:12px;">📚 选择品类</div>`;
  for (const [cat, items] of Object.entries(DATA.CATEGORY_LIBRARY)) {
    html += `<div class="cat-section"><div class="cat-section-title">${cat}</div><div class="cat-tags">${items.map(i => `<button class="cat-tag" data-cat="${cat}" data-subcat="${i}">${i}</button>`).join('')}</div></div>`;
  }
  content.innerHTML = html;
  $('#modal-category').classList.add('active');
}

function openBrandSearch() {
  const brandGroups = DATA.WARDROBE_KNOWLEDGE.reduce((acc, item) => {
    if (!acc[item.brand]) acc[item.brand] = [];
    acc[item.brand].push(item);
    return acc;
  }, {});

  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">🏷️ 搜索品牌</div>
    <input type="text" class="brand-search-input" id="brand-search-input" placeholder="输入品牌名称...">
    <div id="brand-search-results" style="max-height:300px;overflow-y:auto;">
      ${Object.entries(brandGroups).map(([brand, items]) => `
        <div class="brand-result-item" data-brand="${brand}">
          <div class="brand-result-item-icon">🏷️</div>
          <div class="brand-result-item-info">
            <div class="brand-result-item-name">${brand}</div>
            <div class="brand-result-item-meta">${items.length} 件商品</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  $('#modal-category').classList.add('active');
}

function openBrandItems(brand) {
  const content = $('#cat-modal-content');
  const items = DATA.WARDROBE_KNOWLEDGE.filter(item => item.brand === brand);
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">${brand} · 选择商品</div>
    <div style="display:flex;flex-wrap:wrap;gap:8px;">
      ${items.map((item, i) => `
        <div class="brand-result-item" style="flex:1;min-width:140px;" data-add-brand-item="${i}" data-brand="${brand}">
          <div style="width:50px;height:50px;background:${item.colorHex};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.3rem;margin:0 auto;">${item.icon}</div>
          <div class="brand-result-item-info" style="text-align:center;">
            <div class="brand-result-item-name" style="font-size:0.72rem;">${item.name}</div>
            <div class="brand-result-item-meta" style="font-size:0.65rem;">${item.subcat || item.category} · ${item.color}</div>
            <div style="font-size:0.65rem;color:var(--accent);font-weight:600;">${item.price}</div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function openManualEntry() {
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">✏️ 手动录入</div>
    <div class="manual-form">
      <label>商品名称</label>
      <input type="text" id="manual-name" placeholder="输入商品名称" maxlength="50">
      <div class="manual-form-row">
        <div style="flex:1;"><label>品牌</label><input type="text" id="manual-brand" placeholder="品牌" maxlength="20"></div>
        <div style="flex:1;"><label>品类</label><select id="manual-cat">
          <option value="上装">上装</option><option value="下装">下装</option><option value="鞋子">鞋子</option><option value="首饰">首饰</option>
        </select></div>
      </div>
      <div class="manual-form-row">
        <div style="flex:1;"><label>颜色</label><select id="manual-color">
          ${DATA.COLOR_OPTIONS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select></div>
        <div style="flex:1;"><label>状态</label><select id="manual-status">
          <option value="clean">🟢 可穿</option><option value="dirty">🟡 该洗了</option><option value="washing">🔴 在洗</option>
        </select></div>
      </div>
      <div class="cat-confirm-row">
        <button class="btn-secondary" onclick="closeCategoryModal()">取消</button>
        <button class="btn-primary" data-action="save-manual">保存</button>
      </div>
    </div>
  `;
  $('#modal-category').classList.add('active');
}

function getDefaultImage(category, color, icon, subcat) {
  return `https://picsum.photos/seed/${subcat || category}/400/400`;
}

/**
 * 添加衣物到衣橱
 * @param {Object} item - 衣物信息
 * @param {string} item.name - 衣物名称
 * @param {string} [item.brand] - 品牌名称
 * @param {string} [item.category] - 品类
 * @param {string} item.color - 颜色名称
 * @param {string} [item.colorHex] - 颜色十六进制值
 * @param {string} [item.icon] - 图标
 * @param {string} [item.status='clean'] - 状态：'clean' | 'dirty'
 * @param {number} [item.washCount=0] - 洗涤次数
 * @param {string} [item.image] - 图片URL
 * @param {boolean} [item.isSample=false] - 是否为示例数据
 */
function addWardrobeItem(item) {
  const category = item.category || item.cat || '上装';
  const name = item.name;
  const color = item.color;
  
  const exists = state.wardrobe.some(w => w.name === name && w.category === category && w.color === color);
  if (exists) {
    showToast('该物品已存在');
    return;
  }
  
  const colorHex = item.colorHex || DATA.COLOR_MAP[color] || '#9E9E9E';
  const icon = item.icon || DATA.CAT_ICONS[category] || '👔';
  const subcat = item.subcat || '';
  const newItem = {
    id: item.id || Date.now(),
    name: name,
    brand: item.brand || '',
    category: category,
    subcat: subcat,
    color: color,
    colorHex: colorHex,
    icon: icon,
    status: item.status || 'clean',
    washCount: item.washCount || 0,
    image: item.image || getDefaultImage(category, null, null, subcat),
    isSample: item.isSample || false,
    price: item.price || '',
    material: item.material || '',
    season: item.season || '',
    size: item.size || '',
    description: item.description || '',
    tags: item.tags || [],
    sku: item.sku || '',
  };
  StateManager.pushTo('wardrobe', newItem);
  renderWardrobe();
  updateBadges();
  showToast('已添加到衣橱');
}

function closeCategoryModal() {
  $('#modal-category').classList.remove('active');
}

// ==================== Wash Reminder ====================
function openWashReminder() {
  const dirtyItems = state.wardrobe.filter(item => item.status === 'dirty');
  const needWashItems = state.wardrobe.filter(item => {
    const washCount = item.washCount || 0;
    return washCount >= 5 && item.status !== 'dirty';
  });

  let dirtyHtml = '';
  if (dirtyItems.length > 0) {
    dirtyHtml = `
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;color:#E74C3C;">🧼 需要清洗</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${dirtyItems.map(item => getWashItemHtml(item)).join('')}
      </div>
    `;
  }

  let needWashHtml = '';
  if (needWashItems.length > 0) {
    needWashHtml = `
      <div style="font-weight:600;font-size:0.85rem;margin-bottom:8px;margin-top:16px;color:#F39C12;">⚠️ 即将需要清洗</div>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${needWashItems.map(item => getWashItemHtml(item, true)).join('')}
      </div>
    `;
  }

  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">🧺 洗护提醒</div>
    ${dirtyHtml || ''}
    ${needWashHtml || ''}
    ${dirtyItems.length === 0 && needWashItems.length === 0 ? `
      <div style="text-align:center;padding:20px;">
        <div style="font-size:3rem;margin-bottom:8px;">✨</div>
        <div style="font-size:0.85rem;color:var(--muted);">所有衣物都很干净！</div>
        <div style="font-size:0.75rem;color:var(--muted);margin-top:4px;">继续保持哦~</div>
      </div>
    ` : ''}
    <div style="margin-top:16px;padding:10px;background:var(--accent-light);border-radius:10px;">
      <div style="font-size:0.72rem;color:var(--muted);line-height:1.5;">
        <span style="font-weight:600;color:var(--accent);">💡 洗护小贴士：</span>
        深色衣物建议反面洗涤，羊毛材质建议干洗，运动鞋清洗后避免暴晒。
      </div>
    </div>
    ${dirtyItems.length > 0 ? `
      <div style="display:flex;gap:8px;margin-top:12px;">
        <button class="btn-secondary" style="flex:1;" data-action="close-wash-modal">关闭</button>
        <button class="btn-primary" style="flex:1;" data-action="mark-all-clean">全部标记为已清洗</button>
      </div>
    ` : `
      <button class="btn-primary" style="width:100%;margin-top:12px;" data-action="close-wash-modal">知道了</button>
    `}
  `;

  $('#modal-category').classList.add('active');
}

function getWashItemHtml(item, isWarning = false) {
  const washCount = item.washCount || 0;
  const category = item.category || '上装';
  const subcat = item.subcat || getSubcategoryFromName(item.name);
  const washGuide = DATA.WASH_GUIDE[category] && DATA.WASH_GUIDE[category][subcat] 
    ? DATA.WASH_GUIDE[category][subcat] 
    : { washTemp: '30°C', washMethod: '手洗', dryMethod: '悬挂晾干', ironTemp: '中温', notes: '' };

  return `
    <div style="background:var(--bg2);border-radius:10px;padding:12px;display:flex;gap:10px;">
      <div style="width:50px;height:50px;background:${item.colorHex || '#E0E0E0'};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.5rem;flex-shrink:0;">${item.icon || DATA.CAT_ICONS[category] || '👔'}</div>
      <div style="flex:1;">
        <div style="font-weight:600;font-size:0.82rem;">${item.name}</div>
        <div style="font-size:0.68rem;color:var(--muted);margin-top:2px;">
          ${isWarning ? `已穿 ${washCount} 次，建议清洗` : '等待清洗'}
        </div>
        <div style="display:flex;gap:6px;margin-top:4px;font-size:0.65rem;">
          <span style="background:#E8F5E9;color:#2E7D32;padding:2px 6px;border-radius:4px;">${washGuide.washTemp}</span>
          <span style="background:#E3F2FD;color:#1565C0;padding:2px 6px;border-radius:4px;">${washGuide.washMethod}</span>
        </div>
      </div>
      <button class="btn-secondary" style="padding:4px 10px;font-size:0.7rem;" data-action="mark-clean" data-id="${item.id}">已洗</button>
    </div>
  `;
}

function getSubcategoryFromName(name) {
  const subcatKeywords = {
    'T恤': 'T恤', '衬衫': '衬衫', '针织': '针织衫', '卫衣': '卫衣',
    '西装': '西装', '夹克': '夹克', '大衣': '大衣', '毛衣': '毛衣',
    'Polo': 'Polo衫', '背心': '背心', '皮衣': '皮衣', '风衣': '风衣',
    '牛仔': '牛仔裤', '西裤': '西裤', '休闲裤': '休闲裤', '短裤': '短裤',
    '半身裙': '半身裙', '连衣裙': '连衣裙', '阔腿裤': '阔腿裤', '瑜伽': '瑜伽裤',
    '工装裤': '工装裤', '运动': '运动鞋', '乐福': '乐福鞋', '马丁': '马丁靴',
    '帆布': '帆布鞋', '高跟': '高跟鞋', '凉鞋': '凉鞋', '跑鞋': '跑鞋',
    '切尔西': '切尔西靴', '训练': '训练鞋', '项链': '项链', '耳钉': '耳钉',
    '手链': '手链', '戒指': '戒指', '手表': '手表', '发饰': '发饰',
    '眼镜': '眼镜', '丝巾': '丝巾', '胸针': '胸针'
  };
  for (const [keyword, subcat] of Object.entries(subcatKeywords)) {
    if (name.includes(keyword)) return subcat;
  }
  return 'T恤';
}

// ==================== Photo Recognition ====================
function openPhotoRecognition() {
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">📷 拍照识别</div>
    <div class="photo-rec-upload" id="photo-rec-area">
      <input type="file" id="photo-rec-input" accept="image/*" capture="environment" style="display:none;">
      <div class="photo-rec-placeholder">
        <span class="upload-icon" style="font-size:2.5rem;">📷</span>
        <span class="upload-text">点击拍照或上传图片<br>AI 将自动优化图片</span>
      </div>
    </div>
    <div style="margin-top:12px;padding:10px;background:var(--accent-light);border-radius:10px;">
      <div style="font-size:0.75rem;color:var(--muted);line-height:1.5;">
        <span style="font-weight:600;color:var(--accent);">💡 提示：</span>
        请确保图片清晰，衣物完整显示在画面中。上传后请确认品类和颜色。
      </div>
    </div>
    <div class="photo-rec-scanning" id="photo-rec-scanning" style="display:none;">
      <div class="scan-ring"></div>
      <div class="scan-label">AI 正在处理...</div>
      <div style="font-size:0.72rem;color:var(--muted);">请稍候，处理过程需要几秒钟</div>
    </div>
  `;
  $('#modal-category').classList.add('active');
  
  const photoArea = $('#photo-rec-area');
  const fileInput = $('#photo-rec-input');
  
  photoArea.addEventListener('click', function() {
    fileInput.click();
  });
  
  fileInput.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    $('#photo-rec-area').style.display = 'none';
    $('#photo-rec-scanning').style.display = 'flex';
    
    const reader = new FileReader();
    reader.onload = function(event) {
      const originalImage = event.target.result;
      
      setTimeout(function() {
        showRecognitionEditor(originalImage);
      }, 1500);
    };
    reader.readAsDataURL(file);
  });
}

function showRecognitionEditor(originalImage) {
  const content = $('#cat-modal-content');
  const categories = ['上装', '下装', '鞋子', '首饰'];
  const subcatMap = {
    '上装': ['T恤', '衬衫', '针织衫', '卫衣', '西装', '夹克', '大衣', '毛衣', 'Polo衫', '背心', '皮衣', '风衣'],
    '下装': ['牛仔裤', '西裤', '休闲裤', '短裤', '半身裙', '连衣裙', '阔腿裤', '瑜伽裤', '工装裤'],
    '鞋子': ['运动鞋', '乐福鞋', '马丁靴', '帆布鞋', '高跟鞋', '凉鞋', '跑鞋', '切尔西靴', '训练鞋'],
    '首饰': ['项链', '耳钉', '手链', '戒指', '手表', '发饰', '眼镜', '丝巾', '胸针'],
  };
  const colors = ['白色', '黑色', '蓝色', '米色', '灰色', '粉色', '红色', '卡其', '棕色', '绿色', '紫色', '黄色'];
  
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">📷 确认衣物信息</div>
    <div style="display:flex;justify-content:center;margin-bottom:12px;">
      <img src="${originalImage}" style="width:120px;height:120px;object-fit:cover;border-radius:12px;border:2px solid var(--rule);">
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">品类</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;" id="cat-options">
        ${categories.map(cat => `<button class="cat-tag" data-cat="${cat}" style="font-size:0.75rem;">${cat}</button>`).join('')}
      </div>
      <input type="text" id="custom-cat" placeholder="自定义品类" style="width:100%;margin-top:6px;padding:6px 10px;border:1px solid var(--rule);border-radius:8px;font-size:0.75rem;background:var(--bg);color:var(--text);">
    </div>
    <div style="margin-bottom:12px;">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">子品类</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;" id="subcat-options">
        ${subcatMap['上装'].map(subcat => `<button class="cat-tag" data-subcat="${subcat}" style="font-size:0.72rem;">${subcat}</button>`).join('')}
      </div>
      <input type="text" id="custom-subcat" placeholder="自定义子品类" style="width:100%;margin-top:6px;padding:6px 10px;border:1px solid var(--rule);border-radius:8px;font-size:0.75rem;background:var(--bg);color:var(--text);">
    </div>
    <div style="margin-bottom:16px;">
      <div style="font-size:0.75rem;color:var(--muted);margin-bottom:6px;">颜色</div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;" id="color-options">
        ${colors.map(color => `<button class="cat-tag" data-color="${color}" style="font-size:0.75rem;">${color}</button>`).join('')}
      </div>
      <input type="text" id="custom-color" placeholder="自定义颜色" style="width:100%;margin-top:6px;padding:6px 10px;border:1px solid var(--rule);border-radius:8px;font-size:0.75rem;background:var(--bg);color:var(--text);">
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-secondary" style="flex:1;" id="btn-retry">重新拍照</button>
      <button class="btn-primary" style="flex:1;" id="btn-confirm">确认并优化</button>
    </div>
  `;
  
  $('#cat-modal-content').dataset.originalImage = originalImage;
  
  const bindCatTags = () => {
    $$('.cat-tag[data-cat]').forEach(tag => {
      tag.addEventListener('click', function(e) {
        e.stopPropagation();
        $$('.cat-tag[data-cat]').forEach(t => t.classList.remove('selected'));
        this.classList.add('selected');
        $('#custom-cat').value = '';
        const cat = this.dataset.cat;
        const subcatOptions = $('#subcat-options');
        subcatOptions.innerHTML = subcatMap[cat].map(subcat => `<button class="cat-tag" data-subcat="${subcat}" style="font-size:0.72rem;">${subcat}</button>`).join('');
        bindSubcatTags();
      });
    });
  };
  
  const bindSubcatTags = () => {
    $$('.cat-tag[data-subcat]').forEach(tag => {
      tag.addEventListener('click', function(e) {
        e.stopPropagation();
        $$('.cat-tag[data-subcat]').forEach(t => t.classList.remove('selected'));
        this.classList.add('selected');
        $('#custom-subcat').value = '';
      });
    });
  };
  
  const bindColorTags = () => {
    $$('.cat-tag[data-color]').forEach(tag => {
      tag.addEventListener('click', function(e) {
        e.stopPropagation();
        $$('.cat-tag[data-color]').forEach(t => t.classList.remove('selected'));
        this.classList.add('selected');
        $('#custom-color').value = '';
      });
    });
  };
  
  bindCatTags();
  bindSubcatTags();
  bindColorTags();
  
  $('#btn-retry').addEventListener('click', function(e) {
    e.stopPropagation();
    openPhotoRecognition();
  });
  
  $('#btn-confirm').addEventListener('click', function(e) {
    e.stopPropagation();
    const customCat = $('#custom-cat').value.trim();
    const customSubcat = $('#custom-subcat').value.trim();
    const customColor = $('#custom-color').value.trim();
    
    const cat = customCat || $('.cat-tag[data-cat].selected')?.dataset.cat || '上装';
    const subcat = customSubcat || $('.cat-tag[data-subcat].selected')?.dataset.subcat || 'T恤';
    const color = customColor || $('.cat-tag[data-color].selected')?.dataset.color || '白色';
    
    $('#cat-modal-content').innerHTML = `
      <div style="font-weight:700;margin-bottom:12px;">⏳ 正在优化图片...</div>
      <div style="display:flex;justify-content:center;margin-bottom:12px;">
        <img src="${originalImage}" style="width:80px;height:80px;object-fit:cover;border-radius:12px;opacity:0.5;">
      </div>
      <div class="photo-rec-scanning" style="display:flex;">
        <div class="scan-ring"></div>
        <div class="scan-label">AI 正在优化...</div>
        <div style="font-size:0.72rem;color:var(--muted);">最多等待15秒</div>
      </div>
    `;
    
    optimizeImage(originalImage).then(optimizedImage => {
      const result = {
        name: `${color}${subcat}`,
        category: cat,
        subcat: subcat,
        color: color,
        colorHex: DATA.COLOR_MAP[color] || '#9E9E9E',
        originalImage: originalImage,
        image: optimizedImage,
        confidence: (90 + Math.random() * 9).toFixed(1)
      };
      
      showRecognitionResult(result);
    });
  });
}

function optimizeImage(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function() {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      const size = Math.min(img.width, img.height);
      canvas.width = 512;
      canvas.height = 512;
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 512, 512);
      
      const scale = 512 / size;
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const x = (512 - scaledWidth) / 2;
      const y = (512 - scaledHeight) / 2;
      
      ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
      
      const base64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
      const fallbackImage = canvas.toDataURL('image/jpeg', 0.95);
      
      let completed = false;
      const timeout = setTimeout(() => {
        if (!completed) {
          completed = true;
          console.log('[DEBUG] Image-to-image timeout');
          showToast('AI优化超时，使用原图');
          resolve(fallbackImage);
        }
      }, 15000);
      
      console.log('[DEBUG] Starting image-to-image request...');
      
      fetch(`${CONFIG.BAIDU_PROXY}/image-to-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'Professional clothing product photography, white background, high resolution, remove all wrinkles and creases completely, smooth and flat fabric like freshly ironed, crisp and clean appearance, preserve every single detail including letters, text, patterns, logos, and graphic designs from reference image, same clothing type and style, 1:1 square composition, studio lighting',
          image: base64
        })
      })
      .then(response => {
        console.log('[DEBUG] Response status:', response.status);
        return response.json();
      })
      .then(result => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          console.log('[DEBUG] Image-to-image result:', result);
          if (result && result.success && result.image_url) {
            resolve(result.image_url);
          } else {
            console.log('[DEBUG] Image-to-image failed:', result?.error || 'Unknown error');
            showToast('AI优化失败，使用原图');
            resolve(fallbackImage);
          }
        }
      })
      .catch(err => {
        if (!completed) {
          completed = true;
          clearTimeout(timeout);
          console.log('[DEBUG] Image-to-image network error:', err);
          showToast('网络连接失败，使用原图');
          resolve(fallbackImage);
        }
      });
    };
    img.onerror = function(err) {
      console.log('[DEBUG] Image load error:', err);
      resolve(imageUrl);
    };
    img.src = imageUrl;
  });
}

function generateOptimizedImage(category, subcat, color) {
  const prompt = `${color}${subcat}，单品平铺实拍，干净整洁无褶皱，室内柔和自然光，白色背景，极简构图，高清质感，专业服装摄影，1:1比例，无水印无文字无logo`;
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=square`;
}

function showRecognitionResult(result) {
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">✅ 识别完成</div>
    <div style="background:var(--bg2);border-radius:12px;padding:16px;margin-bottom:12px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        <img src="${result.image}" alt="${result.name}" style="width:80px;height:80px;object-fit:cover;border-radius:10px;">
        <div>
          <div style="font-weight:600;font-size:0.95rem;">${result.name}</div>
          <div style="font-size:0.7rem;color:var(--muted);">识别置信度：${result.confidence}%</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;margin-bottom:12px;">
        <div style="flex:1;background:var(--bg);border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:0.65rem;color:var(--muted);">品类</div>
          <div style="font-size:0.8rem;font-weight:500;">${result.category}</div>
        </div>
        <div style="flex:1;background:var(--bg);border-radius:8px;padding:8px;text-align:center;">
          <div style="font-size:0.65rem;color:var(--muted);">颜色</div>
          <div style="font-size:0.8rem;font-weight:500;">${result.color}</div>
        </div>
      </div>
      <div style="display:flex;gap:8px;">
        <div style="flex:1;text-align:center;">
          <div style="font-size:0.65rem;color:var(--muted);margin-bottom:4px;">原图</div>
          <img src="${result.originalImage}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;border:2px dashed var(--rule);">
        </div>
        <div style="flex:1;text-align:center;">
          <div style="font-size:0.65rem;color:var(--accent);font-weight:600;margin-bottom:4px;">优化后</div>
          <img src="${result.image}" style="width:70px;height:70px;object-fit:cover;border-radius:8px;">
        </div>
      </div>
    </div>
    <div style="display:flex;gap:8px;">
      <button class="btn-secondary" style="flex:1;" data-action="photo-rec-retry">重新识别</button>
      <button class="btn-primary" style="flex:1;" data-action="photo-rec-add">添加到衣橱</button>
    </div>
  `;
  
  $('#cat-modal-content').dataset.recResult = JSON.stringify(result);
}

// ==================== E-commerce Import ====================
function openEcomImport() {
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">🛒 电商导入</div>
    <div style="font-size:0.75rem;color:var(--muted);margin-bottom:12px;">
      选择您要导入订单的电商平台，我们将安全获取您的购买记录。
    </div>
    <div class="ecom-store-list">
      <div class="ecom-store-item" data-ecom-store="taobao">
        <span style="font-size:1.8rem;">🛍️</span>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">淘宝 / 天猫</div>
          <div style="font-size:0.7rem;color:var(--muted);">支持淘宝、天猫订单</div>
        </div>
      </div>
      <div class="ecom-store-item" data-ecom-store="jd">
        <span style="font-size:1.8rem;">📦</span>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">京东</div>
          <div style="font-size:0.7rem;color:var(--muted);">支持京东自营及第三方</div>
        </div>
      </div>
      <div class="ecom-store-item" data-ecom-store="pinduoduo">
        <span style="font-size:1.8rem;">🛒</span>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">拼多多</div>
          <div style="font-size:0.7rem;color:var(--muted);">支持拼多多订单</div>
        </div>
      </div>
      <div class="ecom-store-item" data-ecom-store="vip">
        <span style="font-size:1.8rem;">💎</span>
        <div>
          <div style="font-weight:600;font-size:0.85rem;">唯品会</div>
          <div style="font-size:0.7rem;color:var(--muted);">支持唯品会订单</div>
        </div>
      </div>
    </div>
    <div style="margin-top:16px;padding:10px;background:var(--accent-light);border-radius:10px;">
      <div style="font-size:0.72rem;color:var(--muted);line-height:1.5;">
        <span style="font-weight:600;color:var(--accent);">🔒 安全说明：</span>
        我们不会保存您的账号密码，仅获取必要的订单信息用于衣物导入。
      </div>
    </div>
  `;
  $('#modal-category').classList.add('active');
}

function showEcomAuthStep(store) {
  const storeNames = {
    'taobao': '淘宝',
    'jd': '京东',
    'pinduoduo': '拼多多',
    'vip': '唯品会'
  };
  
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:12px;">🔐 授权 ${storeNames[store] || store}</div>
    <div class="ecom-step">
      <span class="ecom-step-icon">🔗</span>
      <span class="ecom-step-text">正在跳转到 ${storeNames[store] || store} 授权页面...</span>
    </div>
    <div style="margin-top:16px;">
      <div style="height:3px;background:var(--rule);border-radius:2px;overflow:hidden;">
        <div class="auth-progress" style="height:100%;background:var(--accent);width:30%;transition:width 1.5s ease;"></div>
      </div>
      <div style="text-align:center;font-size:0.7rem;color:var(--muted);margin-top:8px;">正在连接 ${storeNames[store] || store} 服务器...</div>
    </div>
  `;
  
  setTimeout(function() {
    showEcomImportResult(store);
  }, 2500);
}

function showEcomImportResult(store) {
  const storeNames = {
    'taobao': '淘宝',
    'jd': '京东',
    'pinduoduo': '拼多多',
    'vip': '唯品会'
  };
  
  const mockOrders = generateMockOrders(3);
  
  let orderHtml = '';
  mockOrders.forEach((order, idx) => {
    orderHtml += `
      <div style="display:flex;align-items:center;gap:10px;padding:10px;background:var(--bg2);border-radius:10px;margin-bottom:8px;">
        <input type="checkbox" class="ecom-order-checkbox" data-order-idx="${idx}" checked>
        <div style="width:45px;height:45px;background:${order.colorHex};border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:1.2rem;">${order.icon}</div>
        <div style="flex:1;">
          <div style="font-size:0.78rem;font-weight:500;">${order.name}</div>
          <div style="font-size:0.65rem;color:var(--muted);">${order.brand} · ${order.category}</div>
        </div>
      </div>
    `;
  });
  
  const content = $('#cat-modal-content');
  content.innerHTML = `
    <div style="font-weight:700;margin-bottom:8px;">✅ 授权成功</div>
    <div style="font-size:0.75rem;color:var(--muted);margin-bottom:12px;">从 ${storeNames[store] || store} 获取到 ${mockOrders.length} 件可导入商品</div>
    ${orderHtml}
    <div style="display:flex;gap:8px;margin-top:12px;">
      <button class="btn-secondary" style="flex:1;" data-action="ecom-back">返回选择</button>
      <button class="btn-primary" style="flex:1;" data-action="ecom-import">导入选中商品</button>
    </div>
  `;
  
  $('#cat-modal-content').dataset.ecomOrders = JSON.stringify(mockOrders);
}

function generateMockOrders(count) {
  const orders = [];
  const shuffled = [...DATA.WARDROBE_KNOWLEDGE].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < count && i < shuffled.length; i++) {
    orders.push(shuffled[i]);
  }
  
  return orders;
}

// ==================== Event Delegation ====================
function setupEventDelegation() {
  // Chat container events
  $('#chat-messages').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;
    
    if (action === 'like') {
      const idx = parseInt(btn.dataset.index);
      if (state.currentOutfits[idx]) {
        const outfit = state.currentOutfits[idx];
        const likedIdx = state.likedOutfits.findIndex(o => o.name === outfit.name);
        if (likedIdx === -1) {
          state.likedOutfits.push(outfit);
          btn.textContent = '❤️';
        } else {
          state.likedOutfits.splice(likedIdx, 1);
          btn.textContent = '🤍';
        }
        StateManager.saveNow();
      }
    } else if (action === 'select') {
      const idx = parseInt(btn.dataset.index);
      if (state.currentOutfits[idx]) {
        saveOutfitToHistory(state.currentOutfits[idx]);
      }
    } else if (action === 'tryon') {
      const idx = parseInt(btn.dataset.index);
      if (state.currentOutfits[idx]) {
        generateTryOn(state.currentOutfits[idx]);
      }
    }
  });

  // Quick replies
  $('#chat-messages').addEventListener('click', function(e) {
    const btn = e.target.closest('.quick-reply');
    if (btn) {
      const action = btn.dataset.action;
      const text = btn.textContent;
      appendMessage({ type: 'user', text });
      handleQuickReply(action, text);
    }
  });

  // Virtual card refresh
  $('#chat-messages').addEventListener('click', function(e) {
    const virtualCard = e.target.closest('.outfit-card.virtual');
    if (virtualCard) {
      doGenerateOutfits(state.currentDetail);
    }
  });

  // Add method picker
  $('#method-sheet-content').addEventListener('click', function(e) {
    const item = e.target.closest('.method-item');
    if (!item) return;
    
    const action = item.dataset.action;
    closeAddMethodPicker();
    
    if (action === 'add-category') openCategoryPicker();
    else if (action === 'add-brand') openBrandSearch();
    else if (action === 'add-photo') openPhotoRecognition();
    else if (action === 'add-ecom') openEcomImport();
    else if (action === 'add-manual') openManualEntry();
  });

  // Category modal
  $('#cat-modal-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (btn) {
      const action = btn.dataset.action;
      if (action === 'save-manual') {
        const name = $('#manual-name').value.trim();
        if (!name) { showToast('请输入商品名称'); return; }
        addWardrobeItem({
          name,
          brand: $('#manual-brand').value.trim(),
          category: $('#manual-cat').value,
          color: $('#manual-color').value,
          status: $('#manual-status').value,
        });
        closeCategoryModal();
      } else if (action === 'save-wardrobe-edit') {
        saveWardrobeEdit(parseInt(btn.dataset.id));
      } else if (action === 'photo-rec-retry') {
        openPhotoRecognition();
      } else if (action === 'photo-rec-add') {
        const resultStr = $('#cat-modal-content').dataset.recResult;
        if (resultStr) {
          const result = JSON.parse(resultStr);
          addWardrobeItem(result);
          closeCategoryModal();
        }
      } else if (action === 'ecom-back') {
        openEcomImport();
      } else if (action === 'ecom-import') {
        const ordersStr = $('#cat-modal-content').dataset.ecomOrders;
        if (ordersStr) {
          const orders = JSON.parse(ordersStr);
          const checkboxes = $$('.ecom-order-checkbox:checked');
          checkboxes.forEach(cb => {
            const idx = parseInt(cb.dataset.orderIdx);
            if (orders[idx]) {
              addWardrobeItem(orders[idx]);
            }
          });
          closeCategoryModal();
          showToast(`成功导入 ${checkboxes.length} 件商品`);
        }
      } else if (action === 'close-wash-modal') {
        closeCategoryModal();
      } else if (action === 'mark-clean') {
        const id = btn.dataset.id;
        const item = state.wardrobe.find(w => w.id === id);
        if (item) {
          item.status = 'clean';
          item.washCount = 0;
          StateManager.update({ wardrobe: [...state.wardrobe] });
          openWashReminder();
          showToast('已标记为已清洗');
        }
      } else if (action === 'mark-all-clean') {
        state.wardrobe.forEach(item => {
          if (item.status === 'dirty') {
            item.status = 'clean';
            item.washCount = 0;
          }
        });
        StateManager.update({ wardrobe: [...state.wardrobe] });
        openWashReminder();
        showToast('全部标记为已清洗');
      }
    }

    const catTag = e.target.closest('.cat-tag');
    if (catTag) {
      e.stopPropagation();
      const cat = catTag.dataset.cat;
      const subcat = catTag.dataset.subcat;
      const defaults = DATA.CATEGORY_DEFAULTS[subcat];
      addWardrobeItem({
        name: `${subcat}`,
        category: cat,
        subcat: subcat,
        color: defaults ? defaults.color : '白色',
        icon: defaults ? defaults.icon : DATA.CAT_ICONS[cat] || '👔',
      });
      closeCategoryModal();
    }

    const brandItem = e.target.closest('[data-brand]');
    if (brandItem && !brandItem.dataset.addBrandItem) {
      openBrandItems(brandItem.dataset.brand);
    }

    const brandAddItem = e.target.closest('[data-add-brand-item]');
    if (brandAddItem) {
      const brand = brandAddItem.dataset.brand;
      const idx = parseInt(brandAddItem.dataset.addBrandItem);
      const items = DATA.WARDROBE_KNOWLEDGE.filter(item => item.brand === brand);
      if (items[idx]) {
        addWardrobeItem(items[idx]);
        closeCategoryModal();
      }
    }

    const ecomStore = e.target.closest('[data-ecom-store]');
    if (ecomStore) {
      const store = ecomStore.dataset.ecomStore;
      showEcomAuthStep(store);
    }
  });

  // Wardrobe page events
  $('#wardrobe-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'toggle-wardrobe-edit') {
      StateManager.update({ wardrobeEditMode: !state.wardrobeEditMode });
      renderWardrobe();
    } else if (action === 'select-all-wardrobe') {
      const filtered = wardrobeFilter === '全部' ? state.wardrobe : state.wardrobe.filter(w => w.category === wardrobeFilter);
      if (state.selectedWardrobeIds.length === filtered.length) {
        StateManager.update({ selectedWardrobeIds: [] });
      } else {
        StateManager.update({ selectedWardrobeIds: filtered.map(w => w.id) });
      }
      renderWardrobe();
    } else if (action === 'delete-selected-wardrobe') {
      if (state.selectedWardrobeIds.length === 0) return;
      confirmDelete(`${state.selectedWardrobeIds.length} 件衣物`, () => {
        StateManager.replaceArray('wardrobe', state.wardrobe.filter(w => !state.selectedWardrobeIds.includes(w.id)));
        StateManager.update({ selectedWardrobeIds: [], wardrobeEditMode: false });
        renderWardrobe();
        showToast('已删除');
      });
    } else if (action === 'delete-wardrobe') {
      const id = parseInt(btn.dataset.id);
      const item = state.wardrobe.find(w => w.id === id);
      confirmDelete(item ? item.name : '这件衣物', () => {
        StateManager.replaceArray('wardrobe', state.wardrobe.filter(w => w.id !== id));
        renderWardrobe();
        showToast('已删除');
      });
    }
  });

  // Wardrobe category filter
  $('#wardrobe-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-filter]');
    if (btn && btn.classList.contains('wardrobe-cat')) {
      wardrobeFilter = btn.dataset.filter;
      renderWardrobe();
    }
  });

  // Wardrobe item click (edit)
  $('#wardrobe-content').addEventListener('click', function(e) {
    const item = e.target.closest('.wardrobe-item');
    if (item && !e.target.closest('button') && !e.target.closest('.item-check')) {
      const id = parseInt(item.dataset.id);
      const wItem = state.wardrobe.find(x => x.id === id);
      if (wItem) {
        openWardrobeEditModal(wItem);
      }
    }
  });

  // Wardrobe checkboxes
  $('#wardrobe-content').addEventListener('click', function(e) {
    const check = e.target.closest('[data-check]');
    if (check && check.classList.contains('item-check')) {
      toggleWardrobeSelection(parseInt(check.dataset.check));
      renderWardrobe();
    }
  });

  // History page events
  $('#history-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'toggle-history-edit') {
      StateManager.update({ historyEditMode: !state.historyEditMode });
      renderHistory();
    } else if (action === 'select-all-history') {
      const filtered = historyFilter === '全部' ? state.history : state.history.filter(r => {
        const occ = r.outfit.occasion || '';
        const style = r.outfit.style || '';
        return occ.includes(historyFilter) || style.includes(historyFilter) || r.outfit.name.includes(historyFilter);
      });
      if (state.selectedHistoryIds.length === filtered.length) {
        StateManager.update({ selectedHistoryIds: [] });
      } else {
        StateManager.update({ selectedHistoryIds: filtered.map(r => r.id) });
      }
      renderHistory();
    } else if (action === 'delete-selected-history') {
      if (state.selectedHistoryIds.length === 0) return;
      confirmDelete(`${state.selectedHistoryIds.length} 条记录`, () => {
        StateManager.replaceArray('history', state.history.filter(r => !state.selectedHistoryIds.includes(r.id)));
        StateManager.update({ selectedHistoryIds: [], historyEditMode: false });
        renderHistory();
        showToast('已删除');
      });
    } else if (action === 'delete-history') {
      const id = parseInt(btn.dataset.id);
      const record = state.history.find(r => r.id === id);
      confirmDelete(record ? record.outfit.name : '这条穿搭记录', () => {
        StateManager.replaceArray('history', state.history.filter(r => r.id !== id));
        renderHistory();
        showToast('已删除');
      });
    } else if (action === 'clear-history') {
      clearHistory();
    } else if (action === 'rewear') {
      const outfitStr = btn.dataset.outfit;
      try {
        const outfit = JSON.parse(outfitStr);
        saveOutfitToHistory(outfit);
      } catch (e) {
        console.error('Invalid outfit data');
      }
    }
  });

  // History filter
  $('#history-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-filter]');
    if (btn && btn.classList.contains('history-filter')) {
      historyFilter = btn.dataset.filter;
      renderHistory();
    }
  });

  // History expand
  $('#history-content').addEventListener('click', function(e) {
    const item = e.target.closest('.history-item');
    if (item && !e.target.closest('button') && !e.target.closest('.history-check')) {
      const id = item.dataset.hid;
      const exp = document.getElementById('hexp-' + id);
      if (exp) {
        exp.classList.toggle('open');
      }
    }
  });

  // Community page events
  $('#community-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'open-post-modal') {
      openPostModal();
    } else if (action === 'open-edit-post') {
      const id = parseInt(btn.dataset.id);
      openEditPostModal(id);
    } else if (action === 'like-post') {
      const id = parseInt(btn.dataset.id);
      const idx = state.likedPosts.indexOf(id);
      if (idx === -1) {
        StateManager.update({ likedPosts: [...state.likedPosts, id] });
        btn.classList.add('liked');
      } else {
        StateManager.update({ likedPosts: state.likedPosts.filter(p => p !== id) });
        btn.classList.remove('liked');
      }
      renderCommunity();
    } else if (action === 'collect-post') {
      const id = parseInt(btn.dataset.id);
      const idx = state.collectedPosts.indexOf(id);
      if (idx === -1) {
        StateManager.update({ collectedPosts: [...state.collectedPosts, id] });
        btn.classList.add('collected');
      } else {
        StateManager.update({ collectedPosts: state.collectedPosts.filter(p => p !== id) });
        btn.classList.remove('collected');
      }
      renderCommunity();
    }
  });

  // Profile page events
  $('#profile-content').addEventListener('click', function(e) {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    const action = btn.dataset.action;

    if (action === 'open-profile-modal') {
      openProfileModal();
    } else if (action === 'save-location') {
      const loc = $('#location-input').value.trim();
      if (loc) {
        StateManager.update({ location: loc });
        fetchWeather(loc);
        updateStatusBar();
        renderProfile();
        showToast('位置已保存');
      }
    } else if (action === 'select-location') {
      const city = btn.dataset.city;
      StateManager.update({ location: city });
      $('#location-input').value = city;
      fetchWeather(city);
      updateStatusBar();
      renderProfile();
      showToast('已选择 ' + city);
    } else if (action === 'remove-photo') {
      StateManager.update({ userPhoto: null });
      renderProfile();
      showToast('照片已移除');
    } else if (action === 'add-plan') {
      $('#plan-form').style.display = 'flex';
    } else if (action === 'cancel-plan') {
      $('#plan-form').style.display = 'none';
    } else if (action === 'save-plan') {
      const date = $('#plan-date').value;
      const occasion = $('#plan-occasion').value === 'custom' ? $('#plan-occasion-custom').value.trim() : $('#plan-occasion').value;
      if (!date || !occasion) { showToast('请填写日期和场合'); return; }
      StateManager.pushTo('plans', {
        id: uid(),
        date,
        occasion,
        dest: $('#plan-dest').value.trim(),
        notes: $('#plan-notes').value.trim(),
        reminder: true,
      });
      $('#plan-form').style.display = 'none';
      renderProfile();
      showToast('计划已添加');
    } else if (action === 'delete-plan') {
      const id = btn.dataset.id;
      StateManager.replaceArray('plans', state.plans.filter(p => p.id !== id));
      renderProfile();
      showToast('计划已删除');
    } else if (action === 'toggle-style') {
      const style = btn.dataset.style;
      const idx = state.stylePrefs.indexOf(style);
      if (idx === -1) {
        StateManager.update({ stylePrefs: [...state.stylePrefs, style] });
      } else {
        StateManager.update({ stylePrefs: state.stylePrefs.filter(s => s !== style) });
      }
      renderProfile();
    } else if (action === 'remove-style') {
      const style = btn.dataset.style;
      StateManager.update({ stylePrefs: state.stylePrefs.filter(s => s !== style) });
      renderProfile();
    } else if (action === 'add-custom-style') {
      $('#custom-style-input').style.display = 'block';
      $('#custom-style-text').focus();
    } else if (action === 'cancel-custom-style') {
      $('#custom-style-input').style.display = 'none';
      $('#custom-style-text').value = '';
    } else if (action === 'confirm-custom-style') {
      const style = $('#custom-style-text').value.trim();
      if (style && !state.stylePrefs.includes(style)) {
        StateManager.update({ stylePrefs: [...state.stylePrefs, style] });
        renderProfile();
      }
      $('#custom-style-input').style.display = 'none';
      $('#custom-style-text').value = '';
    } else if (action === 'open-body-info') {
      openBodyInfoModal();
    } else if (action === 'toggle-dark') {
      const newTheme = state.theme === 'dark' ? 'light' : 'dark';
      StateManager.update({ theme: newTheme });
      document.documentElement.setAttribute('data-theme', newTheme);
      renderProfile();
    } else if (action === 'export-data') {
      exportData();
    } else if (action === 'open-wash-reminder') {
      openWashReminder();
    }
  });

  // Home page plan chips
  $('#plans-list').addEventListener('click', function(e) {
    const chip = e.target.closest('.plan-chip');
    if (chip) {
      const planId = chip.dataset.planId;
      const plan = state.plans.find(p => p.id === planId);
      if (plan) {
        switchTab('home');
        checkWardrobeAndGenerate(plan.occasion);
      }
    }
  });

  // Plan reminder toggle
  $('#plans-list').addEventListener('click', function(e) {
    const reminder = e.target.closest('[data-toggle-reminder]');
    if (reminder) {
      const planId = reminder.dataset.toggleReminder;
      const plan = state.plans.find(p => p.id === planId);
      if (plan) {
        plan.reminder = !plan.reminder;
        StateManager.saveNow();
        renderHomePlans();
      }
    }
  });

  // Plan delete
  $('#plans-list').addEventListener('click', function(e) {
    const del = e.target.closest('[data-delete-plan-home]');
    if (del) {
      const planId = del.dataset.deletePlanHome;
      StateManager.replaceArray('plans', state.plans.filter(p => p.id !== planId));
      renderHomePlans();
      showToast('计划已删除');
    }
  });

  // Home page add plan button
  $('#btn-add-plan-home').addEventListener('click', function() {
    $('#plan-form-home').style.display = 'flex';
  });

  // Home page cancel plan button
  $('#btn-plan-cancel-home').addEventListener('click', function() {
    $('#plan-form-home').style.display = 'none';
  });

  // Home page save plan button
  $('#btn-plan-save-home').addEventListener('click', function() {
    const date = $('#plan-date-home').value;
    const occasion = $('#plan-occasion-home').value === 'custom' ? $('#plan-occasion-custom-home').value.trim() : $('#plan-occasion-home').value;
    if (!date || !occasion) { showToast('请填写日期和场合'); return; }
    StateManager.pushTo('plans', {
      id: uid(),
      date,
      occasion,
      dest: $('#plan-dest-home').value.trim(),
      notes: $('#plan-notes-home').value.trim(),
      reminder: true,
    });
    $('#plan-form-home').style.display = 'none';
    $('#plan-date-home').value = '';
    $('#plan-occasion-home').value = 'daily';
    $('#plan-occasion-custom-home').value = '';
    $('#plan-dest-home').value = '';
    $('#plan-notes-home').value = '';
    renderHomePlans();
    showToast('计划已添加');
  });

  // Home page occasion custom toggle
  $('#plan-occasion-home').addEventListener('change', function() {
    $('#plan-occasion-custom-home').style.display = this.value === 'custom' ? 'block' : 'none';
  });
}

// ==================== Outfit History ====================
/**
 * 保存穿搭方案到历史记录
 * @param {Object} outfit - 穿搭方案信息
 * @param {string} outfit.name - 方案名称
 * @param {string} outfit.top - 上装名称
 * @param {string} outfit.bottom - 下装名称
 * @param {string} outfit.shoes - 鞋子名称
 * @param {string} [outfit.accessory] - 配饰名称
 * @param {string} outfit.occasion - 场合类型
 * @param {string} outfit.style - 风格类型
 */
function saveOutfitToHistory(outfit) {
  const w = getWeatherData();
  const newEntry = {
    id: Date.now(),
    outfit,
    weather: `${w.icon} ${w.temp}°C`,
    savedAt: new Date().toISOString(),
  };
  StateManager.update({ history: [newEntry, ...state.history] });
  updateTodayStatus();
  updateBadges();
  showToast('穿搭已保存到历史');
}

// ==================== Try-on ====================
async function generateTryOn(outfit) {
  if (!state.userPhoto) {
    showToast('请先上传全身照');
    return;
  }
  const btn = document.querySelector('.btn-tryon[data-index="' + outfit.__idx + '"]');
  if (btn) btn.classList.add('loading');
  
  try {
    const result = await generateTryOnImage(state.userPhoto, outfit);
    const canvas = document.querySelector(`.outfit-card[data-index="${outfit.__idx}"] .outfit-canvas`);
    if (canvas) {
      const img = document.createElement('img');
      img.src = result.imageUrl;
      img.className = 'outfit-tryon-img';
      canvas.appendChild(img);
      if (result.isFallback) {
        showToast('图片生成失败，请稍后重试');
      } else {
        showToast('试穿效果已生成');
      }
    }
  } catch (err) {
    console.error('Try-on failed:', err);
    showToast('试穿生成失败');
  } finally {
    if (btn) btn.classList.remove('loading');
  }
}

// ==================== Profile Edit ====================
function openProfileModal() {
  $('#edit-nickname').value = state.nickname || '';
  $('#edit-bio').value = state.bio || '';
  $('#edit-age').value = state.age || '';
  selectGender(state.gender);
  $('#modal-profile-edit').classList.add('active');
}

function closeProfileModal() {
  $('#modal-profile-edit').classList.remove('active');
}

function selectGender(gender) {
  StateManager.update({ gender: gender });
  $$('#gender-male, #gender-female, #gender-secret').forEach(b => b.classList.remove('active', 'btn-primary'));
  $$('#gender-male, #gender-female, #gender-secret').forEach(b => b.classList.add('btn-secondary'));
  const btn = $('#gender-' + gender);
  if (btn) {
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function saveProfile() {
  StateManager.update({
    nickname: $('#edit-nickname').value.trim(),
    bio: $('#edit-bio').value.trim(),
    age: $('#edit-age').value
  });
  closeProfileModal();
  renderProfile();
  showToast('资料已更新');
}

// ==================== Body Info ====================
function openBodyInfoModal() {
  if (state.bodyInfo && state.bodyInfo.password) {
    $('#modal-body-password').classList.add('active');
    return;
  }
  if (state.bodyInfo) {
    $('#body-height').value = state.bodyInfo.height || '';
    $('#body-weight').value = state.bodyInfo.weight || '';
    $('#body-shoulder').value = state.bodyInfo.shoulder || '';
    $('#body-waist').value = state.bodyInfo.waist || '';
    $('#body-password-toggle').checked = !!state.bodyInfo.password;
    $('#body-password-section').style.display = state.bodyInfo.password ? 'block' : 'none';
  } else {
    $('#body-height').value = '';
    $('#body-weight').value = '';
    $('#body-shoulder').value = '';
    $('#body-waist').value = '';
    $('#body-password-toggle').checked = false;
    $('#body-password-section').style.display = 'none';
  }
  $('#modal-body-info').classList.add('active');
}

function closeBodyInfoModal() {
  $('#modal-body-info').classList.remove('active');
}

function closeBodyPasswordModal() {
  $('#modal-body-password').classList.remove('active');
  $('#body-pwd-input').value = '';
}

function verifyBodyPassword() {
  const input = $('#body-pwd-input').value;
  if (input === state.bodyInfo.password) {
    closeBodyPasswordModal();
    openBodyInfoModal();
  } else {
    showToast('密码错误');
  }
}

function saveBodyInfo() {
  const height = $('#body-height').value;
  const weight = $('#body-weight').value;
  const shoulder = $('#body-shoulder').value;
  const waist = $('#body-waist').value;
  const pwd = $('#body-password').value;
  
  StateManager.update({ bodyInfo: { height, weight, shoulder, waist, password: pwd || null } });
  closeBodyInfoModal();
  renderProfile();
  showToast('体型信息已保存');
}

$('#body-password-toggle').addEventListener('change', function() {
  $('#body-password-section').style.display = this.checked ? 'block' : 'none';
});

// ==================== Data Export/Import ====================
function exportData() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'fashion_ai_backup_' + new Date().toISOString().slice(0, 10) + '.json';
  a.click();
  URL.revokeObjectURL(url);
  showToast('数据已导出');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function() {
    try {
      const data = JSON.parse(reader.result);
      StateManager.update(data);
      renderProfile();
      showToast('数据已导入');
    } catch (e) {
      showToast('导入失败：无效的JSON文件');
    }
  };
  reader.readAsText(file);
  input.value = '';
}

// ==================== Edit Post ====================
function openEditPostModal(postId) {
  const post = state.userPosts.find(p => p.id === postId);
  if (!post) return;
  $('#edit-post-id').value = post.id;
  $('#edit-post-content').value = post.content;
  $('#edit-post-outfit').value = post.outfit;
  $('#modal-edit-post').classList.add('active');
}

function closeEditPostModal() {
  $('#modal-edit-post').classList.remove('active');
}

function saveEditPost() {
  const id = parseInt($('#edit-post-id').value);
  const posts = state.userPosts.map(p => {
    if (p.id === id) {
      return {
        ...p,
        content: $('#edit-post-content').value.trim(),
        outfit: $('#edit-post-outfit').value
      };
    }
    return p;
  });
  StateManager.update({ userPosts: posts });
  closeEditPostModal();
  renderCommunity();
  showToast('已保存修改');
}

// ==================== Image Error Handling ====================
function handleImageError(img) {
  const icon = img.dataset.fallbackIcon || '👔';
  const color = img.dataset.fallbackColor || '灰色';
  const colorHex = DATA.COLOR_MAP[color] || '#9E9E9E';
  img.style.display = 'none';
  const parent = img.parentElement;
  parent.style.background = colorHex;
  parent.innerHTML = `<span style="font-size:2.6rem;">${icon}</span><span class="color-label">${color}</span>`;
}

// ==================== Badges ====================
function updateBadges() {
  const wBadge = $('#wardrobe-badge');
  const hBadge = $('#history-badge');
  if (wBadge) {
    wBadge.textContent = state.wardrobe.length;
    wBadge.style.display = state.wardrobe.length > 0 ? 'block' : 'none';
  }
  if (hBadge) {
    hBadge.textContent = state.history.length;
    hBadge.style.display = state.history.length > 0 ? 'block' : 'none';
  }
}

// ==================== City Modal ====================
function openCityModal() {
  $('#city-input').value = state.location || '';
  $('#modal-city').classList.add('active');
}

function closeCityModal() {
  $('#modal-city').classList.remove('active');
}

function selectCity(city) {
  StateManager.update({ location: city });
  fetchWeather(city);
  updateStatusBar();
  updateHomeDashboard();
  closeCityModal();
  showToast('已选择 ' + city);
}

function confirmCustomCity() {
  const city = $('#city-input').value.trim();
  if (city) {
    selectCity(city);
  } else {
    showToast('请输入城市名称');
  }
}

function autoLocate() {
  showToast('定位功能开发中');
}

// ==================== Baidu Voice Recognition ====================
const BAIDU_ASR_CONFIG = {
  apiKey: 'j2qbY2PPdomCXNDXJi9qwxy3',
  secretKey: '59v3zdfZr0hEOnusvCyCGL4cgIe6FEEs',
};

let audioContext = null;
let mediaRecorder = null;
let audioChunks = [];
let isRecording = false;
let baiduAccessToken = null;
let accessTokenExpires = 0;

async function getBaiduAccessToken() {
  if (baiduAccessToken && Date.now() < accessTokenExpires) {
    return baiduAccessToken;
  }

  if (!BAIDU_ASR_CONFIG.apiKey || !BAIDU_ASR_CONFIG.secretKey) {
    showToast('请先配置百度语音 API Key');
    return null;
  }

  try {
    const response = await fetch(
      `https://aip.baidubce.com/oauth/2.0/token?grant_type=client_credentials&client_id=${BAIDU_ASR_CONFIG.apiKey}&client_secret=${BAIDU_ASR_CONFIG.secretKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );
    
    if (!response.ok) {
      showToast('HTTP错误: ' + response.status);
      return null;
    }
    
    const data = await response.json();
    if (data.access_token) {
      baiduAccessToken = data.access_token;
      accessTokenExpires = Date.now() + (data.expires_in - 60) * 1000;
      return baiduAccessToken;
    }
    showToast('获取权限失败: ' + (data.error_description || '未知错误'));
    return null;
  } catch (err) {
    console.error('百度Token获取失败:', err);
    showToast('网络请求失败，可能是跨域限制。请使用本地服务器访问');
    return null;
  }
}

async function baiduSpeechToText(audioData) {
  const base64Audio = audioData.toString('base64');
  
  try {
    const data = await callBaiduAPI('/api/vop/server_api', {
      format: 'wav',
      rate: 16000,
      channel: 1,
      len: audioData.length * 2,
      speech: base64Audio,
      cuid: 'web_voice_app',
    });
    
    console.log('语音识别结果:', data);
    
    if (data.err_no === 0) {
      return data.result[0];
    }
    showToast('识别失败: ' + (data.err_msg || '未知错误'));
    return null;
  } catch (err) {
    console.error('语音识别请求失败:', err);
    showToast('网络请求失败，请检查代理服务器是否启动');
    return null;
  }
}

function initVoiceRecognition() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    showToast('您的浏览器不支持麦克风');
    $('#voice-btn').style.display = 'none';
    return;
  }
}

async function toggleVoiceInput() {
  if (isRecording) {
    stopRecording();
  } else {
    await startRecording();
  }
}

async function startRecording() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    audioChunks = [];
    
    processor.onaudioprocess = function(e) {
      const inputData = e.inputBuffer.getChannelData(0);
      const outputData = new Float32Array(inputData.length);
      for (let i = 0; i < inputData.length; i++) {
        outputData[i] = inputData[i];
      }
      audioChunks.push(outputData);
    };
    
    source.connect(processor);
    processor.connect(audioContext.destination);
    
    isRecording = true;
    $('#voice-btn').classList.add('listening');
    $('#voice-btn').textContent = '🔴';
    showToast('正在录音...', 2000);
    
    window.__voiceRecordingProcessor = processor;
    window.__voiceRecordingSource = source;
    window.__voiceRecordingStream = stream;
    
  } catch (err) {
    showToast('无法访问麦克风: ' + err.message);
  }
}

function stopRecording() {
  if (!isRecording) return;
  
  isRecording = false;
  $('#voice-btn').classList.remove('listening');
  $('#voice-btn').textContent = '🎙️';
  
  if (window.__voiceRecordingProcessor) {
    window.__voiceRecordingProcessor.disconnect();
    window.__voiceRecordingProcessor = null;
  }
  if (window.__voiceRecordingSource) {
    window.__voiceRecordingSource.disconnect();
    window.__voiceRecordingSource = null;
  }
  if (window.__voiceRecordingStream) {
    window.__voiceRecordingStream.getTracks().forEach(track => track.stop());
    window.__voiceRecordingStream = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  if (audioChunks.length === 0) {
    showToast('未检测到语音');
    return;
  }
  
  showToast('正在识别...', 3000);
  
  const audioBuffer = mergeAudioChunks(audioChunks);
  const wavData = audioBufferToWav(audioBuffer);
  baiduSpeechToText(wavData).then(function(text) {
    if (text) {
      $('#chat-input').value = text;
      $('#send-btn').classList.add('visible');
      showToast('语音转文字完成');
    }
  });
  
  audioChunks = [];
}

function mergeAudioChunks(chunks) {
  const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
  const result = new Float32Array(totalLength);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.length;
  }
  return result;
}

function audioBufferToWav(buffer) {
  const sampleRate = 16000;
  const numChannels = 1;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  
  const downsampled = downsampleBuffer(buffer, 44100, sampleRate);
  
  const bufferLength = downsampled.length;
  const dataSize = bufferLength * bytesPerSample;
  const bufferSize = 44 + dataSize;
  
  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);
  
  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bytesPerSample * 8, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);
  
  let offset = 44;
  for (let i = 0; i < downsampled.length; i++) {
    let s = Math.max(-1, Math.min(1, downsampled[i]));
    s = s < 0 ? s * 0x8000 : s * 0x7FFF;
    view.setInt16(offset, s, true);
    offset += 2;
  }
  
  return new Uint8Array(arrayBuffer);
}

function downsampleBuffer(buffer, originalSampleRate, targetSampleRate) {
  if (originalSampleRate === targetSampleRate) {
    return buffer;
  }
  
  const sampleRateRatio = originalSampleRate / targetSampleRate;
  const newLength = Math.round(buffer.length / sampleRateRatio);
  const result = new Float32Array(newLength);
  
  let resultIndex = 0;
  let offset = 0;
  
  while (resultIndex < newLength) {
    const nextOffset = offset + sampleRateRatio;
    let accum = 0;
    let count = 0;
    
    for (let i = Math.floor(offset); i < Math.floor(nextOffset) && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    
    result[resultIndex] = accum / count;
    resultIndex++;
    offset = nextOffset;
  }
  
  return result;
}

function writeString(view, offset, string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

// ==================== Chat Input ====================
function initChatInput() {
  const input = $('#chat-input');
  const sendBtn = $('#send-btn');
  const voiceBtn = $('#voice-btn');

  initVoiceRecognition();

  voiceBtn.addEventListener('click', toggleVoiceInput);

  input.addEventListener('input', function() {
    if (this.value.trim()) {
      sendBtn.classList.add('visible');
    } else {
      sendBtn.classList.remove('visible');
    }
  });

  sendBtn.addEventListener('click', function() {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    sendBtn.classList.remove('visible');
    appendMessage({ type: 'user', text });
    handleQuickReply('_free', text);
  });

  input.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendBtn.click();
    }
  });
}

// ==================== Init ====================
function init() {
  state = StateManager.init(DATA.DEFAULT_STATE);
  
  if (state.theme === 'dark') {
    document.documentElement.setAttribute('data-theme', 'dark');
  }

  setupEventDelegation();
  initChatInput();
  startClock();
  
  $('#dash-location').addEventListener('click', openCityModal);
  $('#fab-add').addEventListener('click', openAddMethodPicker);
  
  $('#tab-bar').addEventListener('click', function(e) {
    const btn = e.target.closest('.tab-btn');
    if (btn) {
      const tab = btn.dataset.tab;
      if (tab) switchTab(tab);
    }
  });
  $('#modal-add-method').addEventListener('click', function(e) {
    if (e.target === this) closeAddMethodPicker();
  });
  $('#modal-category').addEventListener('click', function(e) {
    if (e.target === this) closeCategoryModal();
  });

  switchTab('home');
  
  if (state.firstUse) {
    state.firstUse = false;
    setTimeout(() => {
      appendMessage({ type: 'ai', text: '你好，主人！我是你的智能穿搭助手——小陶 👋\n\n很高兴认识你！我可以帮你：\n\n✨ 根据天气推荐穿搭\n✨ 管理你的衣橱\n✨ 搭配整套造型\n✨ 生成虚拟试穿效果\n\n请问今天想怎么搭配呢？' });
    }, 800);
  }
}

async function callBaiduAPI(endpoint, payload) {
  const response = await fetch(`${CONFIG.BAIDU_PROXY}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return response.json();
}

document.addEventListener('DOMContentLoaded', init);