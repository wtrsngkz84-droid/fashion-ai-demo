const CONFIG = {
  API_BASE: 'https://trae-api-cn.mchost.guru/api/ide/v1',
  AI_TRYON_ENDPOINT: '/tryon',
  WEATHER_API_KEY: '',
  DEMO_MODE: true,
  BAIDU_PROXY: 'http://localhost:8899',
};

function tti(prompt, size = 'square') {
  return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(prompt)}&image_size=${size}`;
}

function generateClothingSVG(category, colorHex, icon) {
  const bgColor = '#F5F5F5';
  const size = 200;
  
  const shapes = {
    '上装': `<rect x="30" y="50" width="140" height="120" rx="8" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <rect x="30" y="50" width="140" height="35" rx="8" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <rect x="30" y="85" width="15" height="65" rx="4" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <rect x="155" y="85" width="15" height="65" rx="4" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <circle cx="100" cy="45" r="20" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>`,
    '下装': `<rect x="45" y="60" width="110" height="130" rx="10" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <line x1="100" y1="60" x2="100" y2="190" stroke="#DDD" stroke-width="1"/>
             <rect x="45" y="175" width="25" height="15" rx="4" fill="#888" stroke="#666" stroke-width="1"/>
             <rect x="130" y="175" width="25" height="15" rx="4" fill="#888" stroke="#666" stroke-width="1"/>`,
    '鞋子': `<ellipse cx="100" cy="160" rx="55" ry="25" fill="#8B8B8B" stroke="#666" stroke-width="1"/>
             <path d="M45 160 L45 120 Q45 100 70 100 L130 100 Q155 100 155 120 L155 160" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>
             <rect x="50" y="125" width="100" height="35" rx="5" fill="${colorHex}" stroke="#DDD" stroke-width="1"/>`,
    '首饰': `<circle cx="100" cy="100" r="45" fill="none" stroke="${colorHex}" stroke-width="4"/>
             <circle cx="100" cy="100" r="25" fill="none" stroke="${colorHex}" stroke-width="2"/>
             <circle cx="100" cy="100" r="8" fill="${colorHex}"/>`,
  };
  
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${bgColor}" rx="12"/>
    ${shapes[category] || shapes['上装']}
    <text x="${size/2}" y="${size-20}" text-anchor="middle" font-size="12" fill="#888" font-family="sans-serif">${icon}</text>
  </svg>`;
  
  return 'data:image/svg+xml;base64,' + btoa(svg);
}

const DATA = {
  COLOR_MAP: {
    '白色':'#F5F5F5','黑色':'#2D2A32','蓝色':'#6B9AC4','深蓝':'#3D5A80',
    '卡其':'#C4A882','灰色':'#9E9E9E','米色':'#E8DCC8','粉色':'#F0C0C0',
    '红色':'#C0392B','绿色':'#5D8C5D','棕色':'#8B6914','紫色':'#7C6FA0',
    '银色':'#C0C0C0','金色':'#DAA520',
  },

  COLOR_OPTIONS: ["白色","黑色","蓝色","灰色","卡其","米色","粉色","红色","绿色","棕色","紫色"],

  PRESET_WARDROBE: [
    { id:1, name:"Nike Sportswear Classic 罗纹圆领柔软套头 T恤 女款", brand:"Nike", category:"上装", color:"白色", colorHex:"#F5F5F5", tags:["基础款","百搭","运动休闲"], status:"clean", washCount:2, isSample:true, sku:"NK-SW01-WHT", icon:"👕", image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop' },
    { id:2, name:"Uniqlo 牛津纺精梳棉长袖衬衫 藏青色 男/女同款 通勤", brand:"Uniqlo", category:"上装", color:"蓝色", colorHex:"#3D5A80", tags:["商务","正式","通勤"], status:"dirty",washCount:4, isSample:true, sku:"UQ-OX02-NAV", icon:"👔", image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop' },
    { id:3, name:"ZARA 修身直筒西裤 黑色 通勤必备 中腰显瘦版", brand:"ZARA", category:"下装", color:"黑色", colorHex:"#2D2A32", tags:["商务","正式","通勤"], status:"clean",washCount:1, isSample:true, sku:"ZR-SL03-BLK", icon:"👖", image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop' },
    { id:4, name:"Levi's 501 Original 直筒牛仔裤 经典水洗蓝 中腰", brand:"Levi's", category:"下装", color:"蓝色", colorHex:"#6B9AC4", tags:["休闲","日常","经典"], status:"clean",washCount:5, isSample:true, sku:"LV-50104-BLU", icon:"👖", image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop' },
    { id:5, name:"Adidas Originals Stan Smith 经典绿尾小白鞋 情侣款", brand:"Adidas", category:"鞋子", color:"白色", colorHex:"#F5F5F5", tags:["舒适","百搭","经典"], status:"clean",washCount:3, isSample:true, sku:"AD-SS05-WHT", icon:"👟", image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop' },
  ],

  OUTFIT_TEMPLATES: {
    interview: [
      { name:"方案A：专业干练", hair:"低马尾", top:"藏青牛津纺衬衫", bottom:"黑色直筒西裤", shoes:"乐福鞋",
        accessory:"简约细项链", style:"professional", moodColor:"#3D5A80",
        topColor:"#3D5A80",bottomColor:"#2D2A32",shoeColor:"#8B4513",hairColor:"#3D3D3D",
        reason:"藏青色传递专业感，黑色西裤彰显稳重，乐福鞋舒适又正式，整体搭配让你在面试中展现自信与专业。" },
      { name:"方案B：温和可靠", hair:"半扎发", top:"米色针织衫", bottom:"卡其休闲裤", shoes:"帆布鞋",
        accessory:"珍珠耳钉", style:"gentle", moodColor:"#D4C5B9",
        topColor:"#E8DCC8",bottomColor:"#C4A882",shoeColor:"#F5F5F5",hairColor:"#5D4037",
        reason:"暖色调让人感到亲切，针织衫柔软舒适，适合希望展现亲和力的岗位，如HR、市场等。" },
      { name:"方案C：创意活力", hair:"高马尾", top:"白色罗纹T恤", bottom:"水洗蓝501牛仔裤", shoes:"马丁靴",
        accessory:"金属手链", style:"creative", moodColor:"#6B9AC4",
        topColor:"#F5F5F5",bottomColor:"#6B9AC4",shoeColor:"#2D2A32",hairColor:"#1A1A1A",
        reason:"适合创意类岗位，白色T恤干净简约，牛仔裤展现个性，马丁靴增添时尚感，凸显你的创意活力。" },
    ],
    daily: [
      { name:"方案A：清爽简约", hair:"低马尾", top:"白色罗纹T恤", bottom:"水洗蓝501牛仔裤", shoes:"Stan Smith小白鞋",
        accessory:"简约手链", style:"casual", moodColor:"#E8F0F8",
        topColor:"#F5F5F5",bottomColor:"#6B9AC4",shoeColor:"#F5F5F5",hairColor:"#3D3D3D",
        reason:"经典的白T配牛仔裤，永远不会出错的搭配，舒适又百搭，适合轻松的工作日。" },
      { name:"方案B：温柔通勤", hair:"半扎发", top:"浅蓝衬衫", bottom:"米色阔腿裤", shoes:"乐福鞋",
        accessory:"珍珠耳钉", style:"gentle", moodColor:"#D4E8F0",
        topColor:"#B0C4DE",bottomColor:"#E8DCC8",shoeColor:"#8B4513",hairColor:"#5D4037",
        reason:"浅蓝与米色搭配清新柔和，阔腿裤舒适显瘦，乐福鞋方便通勤，展现职场女性的温柔气质。" },
      { name:"方案C：活力街头", hair:"高马尾", top:"黑色卫衣", bottom:"水洗蓝501牛仔裤", shoes:"帆布鞋",
        accessory:"金属项链", style:"street", moodColor:"#3D3D3D",
        topColor:"#2D2A32",bottomColor:"#6B9AC4",shoeColor:"#F5F5F5",hairColor:"#1A1A1A",
        reason:"黑色卫衣休闲百搭，搭配牛仔裤和帆布鞋，充满青春活力，适合周五或休闲办公日。" },
    ],
    date: [
      { name:"方案A：甜美约会", hair:"波浪卷", top:"粉色针织衫", bottom:"白色半身裙", shoes:"高跟鞋",
        accessory:"珍珠项链", style:"sweet", moodColor:"#F8E8E8",
        topColor:"#F0C0C0",bottomColor:"#F5F5F5",shoeColor:"#C0A0A0",hairColor:"#8B4513",
        reason:"粉色针织衫温柔甜美，白色半身裙清纯可人，高跟鞋拉长腿型，完美展现少女心。" },
      { name:"方案B：优雅知性", hair:"低盘发", top:"米色衬衫", bottom:"卡其阔腿裤", shoes:"乐福鞋",
        accessory:"简约耳钉", style:"elegant", moodColor:"#E8DCC8",
        topColor:"#E8DCC8",bottomColor:"#C4A882",shoeColor:"#8B4513",hairColor:"#3D3D3D",
        reason:"米色与卡其的大地色系搭配高级优雅，阔腿裤舒适显瘦，适合知性气质的约会。" },
      { name:"方案C：个性酷飒", hair:"高马尾", top:"黑色皮夹克", bottom:"黑色紧身裤", shoes:"马丁靴",
        accessory:"金属手链", style:"cool", moodColor:"#2D2A32",
        topColor:"#2D2A32",bottomColor:"#2D2A32",shoeColor:"#2D2A32",hairColor:"#1A1A1A",
        reason:"全黑搭配酷飒有型，皮夹克增添个性，马丁靴帅气十足，展现你的独特魅力。" },
    ],
    sports: [
      { name:"方案A：运动活力", hair:"高马尾", top:"白色速干T恤", bottom:"黑色运动裤", shoes:"跑鞋",
        accessory:"运动手环", style:"sporty", moodColor:"#E8F0E8",
        topColor:"#F5F5F5",bottomColor:"#2D2A32",shoeColor:"#4A90D9",hairColor:"#1A1A1A",
        reason:"速干面料透气排汗，运动裤宽松舒适，跑鞋提供良好支撑，适合跑步、健身等运动。" },
      { name:"方案B：瑜伽休闲", hair:"丸子头", top:"灰色背心", bottom:"瑜伽裤", shoes:"训练鞋",
        accessory:"发带", style:"athleisure", moodColor:"#D8D8D8",
        topColor:"#9E9E9E",bottomColor:"#2D2A32",shoeColor:"#F0C0C0",hairColor:"#5D4037",
        reason:"背心清凉透气，瑜伽裤贴合身形，发带固定发型，适合瑜伽、普拉提等运动。" },
    ],
    party: [
      { name:"方案A：闪耀派对", hair:"波浪卷", top:"红色连衣裙", bottom:"-", shoes:"高跟鞋",
        accessory:"耳坠+手链", style:"glam", moodColor:"#F0D0D0",
        topColor:"#C0392B",bottomColor:"#C0392B",shoeColor:"#C0A0A0",hairColor:"#8B4513",
        reason:"红色连衣裙吸睛夺目，波浪卷发增添女人味，适合婚礼、生日派对等正式场合。" },
      { name:"方案B：精致晚宴", hair:"盘发", top:"黑色小礼服", bottom:"-", shoes:"细高跟",
        accessory:"珍珠套装", style:"elegant", moodColor:"#3D3D3D",
        topColor:"#2D2A32",bottomColor:"#2D2A32",shoeColor:"#C0A0A0",hairColor:"#1A1A1A",
        reason:"黑色小礼服经典优雅，珍珠配饰增添高贵感，适合商务晚宴、高端聚会等场合。" },
      { name:"方案C：潮人聚会", hair:"高马尾", top:"亮片上衣", bottom:"黑色皮裤", shoes:"马丁靴",
        accessory:"金属大耳环", style:"edgy", moodColor:"#4A4A5A",
        topColor:"#C0C0C0",bottomColor:"#2D2A32",shoeColor:"#2D2A32",hairColor:"#1A1A1A",
        reason:"亮片上衣闪耀夺目，皮裤彰显个性，马丁靴帅气十足，适合音乐节、潮人聚会等场合。" },
    ],
  },

  CATEGORY_LIBRARY: {
    "上装": ["T恤","衬衫","针织衫","卫衣","西装","夹克","大衣","毛衣","Polo衫","背心","皮衣","风衣"],
    "下装": ["牛仔裤","西裤","休闲裤","短裤","半身裙","连衣裙","阔腿裤","瑜伽裤","工装裤"],
    "鞋子": ["运动鞋","乐福鞋","马丁靴","帆布鞋","高跟鞋","凉鞋","跑鞋","切尔西靴","训练鞋"],
    "首饰": ["项链","耳钉","手链","戒指","手表","发饰","眼镜","丝巾","胸针"],
  },

  CATEGORY_DEFAULTS: {
    'T恤': { color: '白色', icon: '👕' },
    '衬衫': { color: '蓝色', icon: '👔' },
    '针织衫': { color: '米色', icon: '👕' },
    '卫衣': { color: '灰色', icon: '👕' },
    '西装': { color: '黑色', icon: '👔' },
    '夹克': { color: '蓝色', icon: '👔' },
    '大衣': { color: '灰色', icon: '👔' },
    '毛衣': { color: '棕色', icon: '👕' },
    'Polo衫': { color: '白色', icon: '👕' },
    '背心': { color: '白色', icon: '👕' },
    '皮衣': { color: '黑色', icon: '👔' },
    '风衣': { color: '卡其', icon: '👔' },
    '牛仔裤': { color: '蓝色', icon: '👖' },
    '西裤': { color: '黑色', icon: '👖' },
    '休闲裤': { color: '卡其', icon: '👖' },
    '短裤': { color: '米色', icon: '🩳' },
    '半身裙': { color: '黑色', icon: '👗' },
    '连衣裙': { color: '红色', icon: '👗' },
    '阔腿裤': { color: '黑色', icon: '👖' },
    '瑜伽裤': { color: '黑色', icon: '👖' },
    '工装裤': { color: '绿色', icon: '👖' },
    '运动鞋': { color: '白色', icon: '👟' },
    '乐福鞋': { color: '棕色', icon: '👞' },
    '马丁靴': { color: '黑色', icon: '👢' },
    '帆布鞋': { color: '白色', icon: '👟' },
    '高跟鞋': { color: '黑色', icon: '👠' },
    '凉鞋': { color: '棕色', icon: '👡' },
    '跑鞋': { color: '白色', icon: '👟' },
    '切尔西靴': { color: '黑色', icon: '👢' },
    '训练鞋': { color: '白色', icon: '👟' },
    '项链': { color: '银色', icon: '💍' },
    '耳钉': { color: '银色', icon: '💍' },
    '手链': { color: '金色', icon: '💍' },
    '戒指': { color: '银色', icon: '💍' },
    '手表': { color: '银色', icon: '⌚' },
    '发饰': { color: '粉色', icon: '🎀' },
    '眼镜': { color: '黑色', icon: '👓' },
    '丝巾': { color: '红色', icon: '🧣' },
    '胸针': { color: '金色', icon: '💍' },
  },

  WEATHER_DATA: {
    '北京':{temp:28,icon:'☀️',desc:'晴'},
    '上海':{temp:30,icon:'⛅',desc:'多云'},
    '广州':{temp:32,icon:'🌧️',desc:'阵雨'},
    '深圳':{temp:31,icon:'☀️',desc:'晴'},
    '杭州':{temp:29,icon:'⛅',desc:'多云'},
    '成都':{temp:26,icon:'🌥️',desc:'阴'},
    '重庆':{temp:33,icon:'🌧️',desc:'小雨'},
    '武汉':{temp:27,icon:'☀️',desc:'晴'},
    '南京':{temp:28,icon:'⛅',desc:'多云'},
    '苏州':{temp:28,icon:'☀️',desc:'晴'},
    '西安':{temp:25,icon:'🌥️',desc:'阴'},
    '天津':{temp:27,icon:'☀️',desc:'晴'},
  },

  CITY_WEATHER: {
    '北京':{temp:32,icon:'☀️',desc:'晴'},
    '上海':{temp:28,icon:'🌤️',desc:'多云'},
    '广州':{temp:33,icon:'🌧️',desc:'阵雨'},
    '深圳':{temp:31,icon:'⛅',desc:'阴转晴'},
    '成都':{temp:27,icon:'🌥️',desc:'阴'},
    '杭州':{temp:29,icon:'🌤️',desc:'多云'},
    '武汉':{temp:34,icon:'☀️',desc:'晴'},
    '西安':{temp:35,icon:'☀️',desc:'晴'},
    '南京':{temp:30,icon:'🌤️',desc:'多云转阴'},
    '重庆':{temp:30,icon:'🌧️',desc:'小雨'},
  },

  CITY_LIST: ['北京','上海','广州','深圳','成都','杭州','武汉','西安','南京','重庆'],

  BRAND_DATABASE: {
    'Nike':[
      {name:'Nike Dri-FIT 速干运动T恤 白色 男/女款',cat:'上装',color:'白色',colorHex:'#F5F5F5',icon:'👕',image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop'},
      {name:'Nike Air Force 1 经典复古板鞋 白色',cat:'鞋子',color:'白色',colorHex:'#F5F5F5',icon:'👟',image:'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop'},
      {name:'Nike Pro 运动紧身长裤 黑色 训练',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop'},
    ],
    'Uniqlo':[
      {name:'Uniqlo 牛津纺长袖衬衫 藏青色 通勤',cat:'上装',color:'蓝色',colorHex:'#3D5A80',icon:'👔',image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop'},
      {name:'Uniqlo 弹力修身直筒长裤 黑色 商务',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop'},
      {name:'Uniqlo HEATTECH 保暖打底衫 灰色',cat:'上装',color:'灰色',colorHex:'#9E9E9E',icon:'👕',image:'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=400&fit=crop'},
    ],
    'ZARA':[
      {name:'ZARA 直筒西裤 黑色 通勤必备 中腰显瘦',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop'},
      {name:'ZARA 基础圆领T恤 白色 百搭款',cat:'上装',color:'白色',colorHex:'#F5F5F5',icon:'👕',image:'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop'},
      {name:'ZARA 西装外套 卡其色 通勤',cat:'上装',color:'卡其',colorHex:'#C4A882',icon:'👔',image:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop'},
    ],
    'Adidas':[
      {name:'Adidas Stan Smith 经典绿尾小白鞋 情侣款',cat:'鞋子',color:'白色',colorHex:'#F5F5F5',icon:'👟',image:'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop'},
      {name:'Adidas Essentials 运动休闲长裤 黑色',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop'},
    ],
    'Levi\'s':[
      {name:'Levi\'s 501 Original 直筒牛仔裤 经典水洗蓝',cat:'下装',color:'蓝色',colorHex:'#6B9AC4',icon:'👖',image:'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop'},
      {name:'Levi\'s 牛仔夹克 复古蓝 经典款',cat:'上装',color:'蓝色',colorHex:'#6B9AC4',icon:'👔',image:'https://images.unsplash.com/photo-1596873030284-e883c338ef12?w=400&h=400&fit=crop'},
    ],
    'MUJI':[
      {name:'MUJI 有机棉圆领T恤 白色 男女通用',cat:'上装',color:'白色',colorHex:'#F5F5F5',icon:'👕',image:'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=400&fit=crop'},
      {name:'MUJI 棉麻宽松长裤 米色 夏季',cat:'下装',color:'米色',colorHex:'#E8DCC8',icon:'👖',image:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop'},
    ],
    'H&M':[
      {name:'H&M 基础款圆领卫衣 灰色 休闲',cat:'上装',color:'灰色',colorHex:'#9E9E9E',icon:'👕',image:'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop'},
      {name:'H&M 修身西裤 黑色 基础通勤',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop'},
    ],
    'COS':[
      {name:'COS 极简羊毛混纺大衣 深灰 秋冬',cat:'上装',color:'灰色',colorHex:'#9E9E9E',icon:'👔',image:'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&h=400&fit=crop'},
      {name:'COS 宽松阔腿裤 黑色 极简风',cat:'下装',color:'黑色',colorHex:'#2D2A32',icon:'👖',image:'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop'},
    ],
  },

  BRAND_LIST: ['Nike','Uniqlo','ZARA','Adidas','Levi\'s','MUJI','H&M','COS'],

  ECOM_STORES: [
    {name:'淘宝',icon:'🛒',items:3,desc:'已绑定 · 123件可导入'},
    {name:'京东',icon:'📦',items:2,desc:'已绑定 · 45件可导入'},
    {name:'得物',icon:'👟',items:1,desc:'未绑定 · 点击授权'},
  ],

  CAT_ICONS: {上装:'👕',下装:'👖',鞋子:'👟',首饰:'💍'},

  WASH_GUIDE: {
    '上装': {
      'T恤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '平铺晾干', ironTemp: '中温', bleach: false, notes: '反面洗涤，避免暴晒' },
      '衬衫': { washTemp: '30°C', washMethod: '手洗/轻柔', dryMethod: '悬挂晾干', ironTemp: '中高温', bleach: false, notes: '扣好纽扣再洗' },
      '针织衫': { washTemp: '20°C', washMethod: '手洗', dryMethod: '平铺晾干', ironTemp: '低温', bleach: false, notes: '不可拧干，避免拉伸' },
      '卫衣': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '反面洗涤' },
      '西装': { washTemp: '干洗', washMethod: '干洗', dryMethod: '悬挂晾干', ironTemp: '低温', bleach: false, notes: '建议专业干洗' },
      '夹克': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '拉链拉好再洗' },
      '大衣': { washTemp: '干洗', washMethod: '干洗', dryMethod: '悬挂晾干', ironTemp: '低温', bleach: false, notes: '羊毛大衣建议干洗' },
      '毛衣': { washTemp: '20°C', washMethod: '手洗', dryMethod: '平铺晾干', ironTemp: '低温', bleach: false, notes: '使用中性洗涤剂' },
      'Polo衫': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '避免衣领变形' },
      '背心': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '浅色分开洗' },
      '皮衣': { washTemp: '专业护理', washMethod: '专业护理', dryMethod: '阴干', ironTemp: '不可熨烫', bleach: false, notes: '使用皮革护理剂' },
      '风衣': { washTemp: '30°C', washMethod: '手洗/机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '拉链拉好，扣好纽扣' },
    },
    '下装': {
      '牛仔裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '反面洗涤，减少褪色' },
      '西裤': { washTemp: '30°C', washMethod: '手洗/轻柔', dryMethod: '悬挂晾干', ironTemp: '中高温', bleach: false, notes: '避免高温烘干' },
      '休闲裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '正常洗涤' },
      '短裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '正常洗涤' },
      '半身裙': { washTemp: '30°C', washMethod: '手洗/轻柔', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '轻柔洗涤' },
      '连衣裙': { washTemp: '30°C', washMethod: '手洗/轻柔', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '轻柔洗涤，避免缠绕' },
      '阔腿裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '反面洗涤' },
      '瑜伽裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '低温', bleach: false, notes: '避免使用柔顺剂' },
      '工装裤': { washTemp: '30°C', washMethod: '机洗', dryMethod: '悬挂晾干', ironTemp: '中温', bleach: false, notes: '正常洗涤' },
    },
    '鞋子': {
      '运动鞋': { washTemp: '30°C', washMethod: '手洗', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '取出鞋垫单独清洗' },
      '乐福鞋': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '使用皮革清洁剂' },
      '马丁靴': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '定期使用鞋油保养' },
      '帆布鞋': { washTemp: '30°C', washMethod: '手洗', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '避免暴晒导致发黄' },
      '高跟鞋': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '使用皮革清洁剂' },
      '凉鞋': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '湿布擦拭即可' },
      '跑鞋': { washTemp: '30°C', washMethod: '手洗', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '取出鞋垫，鞋带单独清洗' },
      '切尔西靴': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '定期使用鞋油保养' },
      '训练鞋': { washTemp: '30°C', washMethod: '手洗', dryMethod: '自然阴干', ironTemp: '不可熨烫', bleach: false, notes: '运动后及时清洗' },
    },
    '首饰': {
      '项链': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '使用珠宝清洁剂' },
      '耳钉': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '酒精消毒' },
      '手链': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '使用珠宝清洁剂' },
      '戒指': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '定期清洗' },
      '手表': { washTemp: '擦拭', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '根据防水等级清洗' },
      '发饰': { washTemp: '30°C', washMethod: '手洗', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '轻柔清洗' },
      '眼镜': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '使用专业眼镜布' },
      '丝巾': { washTemp: '20°C', washMethod: '手洗', dryMethod: '悬挂晾干', ironTemp: '低温', bleach: false, notes: '中性洗涤剂' },
      '胸针': { washTemp: '常温', washMethod: '擦拭', dryMethod: '自然晾干', ironTemp: '不可熨烫', bleach: false, notes: '湿布擦拭' },
    },
  },

  /* 以下为知识库示例数据（demo），仅供参考，实际查询以用户衣橱 state.wardrobe 为准 */
  WARDROBE_KNOWLEDGE: [
    { id: 'nike-tshirt-001', brand: 'Nike', name: 'Nike Dri-FIT 速干运动T恤', category: '上装', subcat: 'T恤', color: '白色', colorHex: '#F5F5F5', icon: '👕', price: '¥199', washCount: 5, status: 'clean', tags: ['运动', '速干', '透气'], sku: 'NK-DF-001', material: '100%聚酯纤维', season: '春夏', size: 'S/M/L/XL', description: '采用Dri-FIT技术，快速吸湿排汗，适合运动健身穿着。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=400&fit=crop' },
    { id: 'nike-tshirt-002', brand: 'Nike', name: 'Nike Sportswear 经典圆领T恤', category: '上装', subcat: 'T恤', color: '黑色', colorHex: '#2D2A32', icon: '👕', price: '¥249', washCount: 3, status: 'clean', tags: ['基础款', '百搭', '休闲'], sku: 'NK-SW-002', material: '100%纯棉', season: '四季', size: 'S/M/L/XL', description: '经典圆领设计，柔软舒适，日常百搭款。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=400&fit=crop' },
    { id: 'nike-shoes-001', brand: 'Nike', name: 'Nike Air Force 1 经典板鞋', category: '鞋子', subcat: '运动鞋', color: '白色', colorHex: '#F5F5F5', icon: '👟', price: '¥799', washCount: 8, status: 'dirty', tags: ['经典', '百搭', '休闲'], sku: 'NK-AF1-001', material: '皮革/橡胶', season: '四季', size: '36-45', description: '经典AF1设计，街头潮流必备单品。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=400&fit=crop' },
    { id: 'uniqlo-shirt-001', brand: 'Uniqlo', name: 'Uniqlo 牛津纺长袖衬衫', category: '上装', subcat: '衬衫', color: '蓝色', colorHex: '#3D5A80', icon: '👔', price: '¥199', washCount: 4, status: 'dirty', tags: ['商务', '通勤', '正式'], sku: 'UQ-OXF-001', material: '100%棉', season: '春秋', size: 'XS/S/M/L/XL', description: '经典牛津纺面料，舒适透气，适合商务通勤。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=400&fit=crop' },
    { id: 'uniqlo-shirt-002', brand: 'Uniqlo', name: 'Uniqlo HEATTECH 保暖打底衫', category: '上装', subcat: 'T恤', color: '灰色', colorHex: '#9E9E9E', icon: '👕', price: '¥99', washCount: 6, status: 'clean', tags: ['保暖', '打底', '秋冬'], sku: 'UQ-HT-002', material: '聚酯纤维/粘胶', season: '秋冬', size: 'XS/S/M/L/XL', description: 'HEATTECH保暖技术，轻薄保暖。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=400&h=400&fit=crop' },
    { id: 'uniqlo-pants-001', brand: 'Uniqlo', name: 'Uniqlo 弹力修身直筒长裤', category: '下装', subcat: '休闲裤', color: '黑色', colorHex: '#2D2A32', icon: '👖', price: '¥249', washCount: 2, status: 'clean', tags: ['商务', '修身', '百搭'], sku: 'UQ-PT-001', material: '棉/聚酯纤维/弹性纤维', season: '四季', size: '25-33', description: '弹力面料，修身舒适，商务休闲皆宜。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=400&fit=crop' },
    { id: 'zara-pants-001', brand: 'ZARA', name: 'ZARA 直筒西裤', category: '下装', subcat: '西裤', color: '黑色', colorHex: '#2D2A32', icon: '👖', price: '¥399', washCount: 3, status: 'clean', tags: ['商务', '通勤', '显瘦'], sku: 'ZR-WP-001', material: '聚酯纤维/粘胶/弹性纤维', season: '四季', size: '34-44', description: '中腰显瘦版型，职场必备单品。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=400&fit=crop' },
    { id: 'zara-tshirt-001', brand: 'ZARA', name: 'ZARA 基础圆领T恤', category: '上装', subcat: 'T恤', color: '白色', colorHex: '#F5F5F5', icon: '👕', price: '¥79', washCount: 7, status: 'dirty', tags: ['基础款', '百搭', '简约'], sku: 'ZR-TT-001', material: '100%棉', season: '四季', size: 'XS/S/M/L/XL', description: '基础款圆领T恤，简约百搭。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1581655353564-df123a1eb820?w=400&h=400&fit=crop' },
    { id: 'zara-blazer-001', brand: 'ZARA', name: 'ZARA 西装外套', category: '上装', subcat: '西装', color: '卡其', colorHex: '#C4A882', icon: '👔', price: '¥599', washCount: 2, status: 'clean', tags: ['商务', '通勤', '气质'], sku: 'ZR-BZ-001', material: '聚酯纤维/粘胶', season: '春秋', size: '34-44', description: '简约西装版型，提升职场气质。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400&h=400&fit=crop' },
    { id: 'adidas-shoes-001', brand: 'Adidas', name: 'Adidas Stan Smith 经典小白鞋', category: '鞋子', subcat: '运动鞋', color: '白色', colorHex: '#F5F5F5', icon: '👟', price: '¥799', washCount: 4, status: 'clean', tags: ['经典', '百搭', '舒适'], sku: 'AD-SS-001', material: '皮革/橡胶', season: '四季', size: '36-45', description: '经典绿尾设计，舒适百搭。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=400&h=400&fit=crop' },
    { id: 'adidas-pants-001', brand: 'Adidas', name: 'Adidas Essentials 运动长裤', category: '下装', subcat: '休闲裤', color: '黑色', colorHex: '#2D2A32', icon: '👖', price: '¥399', washCount: 5, status: 'dirty', tags: ['运动', '休闲', '舒适'], sku: 'AD-ES-001', material: '聚酯纤维', season: '四季', size: 'S/M/L/XL', description: '舒适运动版型，适合日常穿着。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=400&h=400&fit=crop' },
    { id: 'levis-pants-001', brand: 'Levi\'s', name: 'Levi\'s 501 Original 直筒牛仔裤', category: '下装', subcat: '牛仔裤', color: '蓝色', colorHex: '#6B9AC4', icon: '👖', price: '¥899', washCount: 6, status: 'clean', tags: ['经典', '复古', '百搭'], sku: 'LV-501-001', material: '100%棉', season: '四季', size: '25-36', description: '经典501版型，复古百搭。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=400&h=400&fit=crop' },
    { id: 'levis-jacket-001', brand: 'Levi\'s', name: 'Levi\'s 牛仔夹克', category: '上装', subcat: '夹克', color: '蓝色', colorHex: '#6B9AC4', icon: '👔', price: '¥1099', washCount: 3, status: 'clean', tags: ['复古', '经典', '百搭'], sku: 'LV-JK-001', material: '100%棉', season: '春秋', size: 'S/M/L/XL', description: '经典牛仔夹克，复古时尚。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1596873030284-e883c338ef12?w=400&h=400&fit=crop' },
    { id: 'muji-tshirt-001', brand: 'MUJI', name: 'MUJI 有机棉圆领T恤', category: '上装', subcat: 'T恤', color: '白色', colorHex: '#F5F5F5', icon: '👕', price: '¥148', washCount: 8, status: 'dirty', tags: ['简约', '舒适', '环保'], sku: 'MJ-TT-001', material: '100%有机棉', season: '四季', size: 'XS/S/M/L/XL', description: '有机棉材质，舒适环保。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1586363104862-3a5e2ab60d99?w=400&h=400&fit=crop' },
    { id: 'muji-pants-001', brand: 'MUJI', name: 'MUJI 棉麻宽松长裤', category: '下装', subcat: '休闲裤', color: '米色', colorHex: '#E8DCC8', icon: '👖', price: '¥298', washCount: 4, status: 'clean', tags: ['简约', '舒适', '透气'], sku: 'MJ-PT-001', material: '棉/麻', season: '春夏', size: 'XS/S/M/L/XL', description: '棉麻材质，透气舒适。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=400&fit=crop' },
    { id: 'hm-sweatshirt-001', brand: 'H&M', name: 'H&M 基础款圆领卫衣', category: '上装', subcat: '卫衣', color: '灰色', colorHex: '#9E9E9E', icon: '👕', price: '¥199', washCount: 3, status: 'clean', tags: ['休闲', '舒适', '百搭'], sku: 'HM-SW-001', material: '棉/聚酯纤维', season: '春秋', size: 'XS/S/M/L/XL', description: '基础款卫衣，舒适休闲。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400&h=400&fit=crop' },
    { id: 'hm-pants-001', brand: 'H&M', name: 'H&M 修身西裤', category: '下装', subcat: '西裤', color: '黑色', colorHex: '#2D2A32', icon: '👖', price: '¥249', washCount: 5, status: 'dirty', tags: ['商务', '修身', '基础'], sku: 'HM-WP-001', material: '聚酯纤维/粘胶', season: '四季', size: '34-44', description: '修身西裤，商务基础款。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=400&fit=crop' },
    { id: 'cos-coat-001', brand: 'COS', name: 'COS 极简羊毛混纺大衣', category: '上装', subcat: '大衣', color: '灰色', colorHex: '#9E9E9E', icon: '👔', price: '¥2990', washCount: 1, status: 'clean', tags: ['极简', '高级', '秋冬'], sku: 'COS-CT-001', material: '羊毛/聚酯纤维', season: '秋冬', size: 'XS/S/M/L', description: '极简设计，高级质感。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400&h=400&fit=crop' },
    { id: 'cos-pants-001', brand: 'COS', name: 'COS 宽松阔腿裤', category: '下装', subcat: '阔腿裤', color: '黑色', colorHex: '#2D2A32', icon: '👖', price: '¥690', washCount: 2, status: 'clean', tags: ['极简', '宽松', '舒适'], sku: 'COS-PT-001', material: '聚酯纤维/粘胶', season: '四季', size: 'XS/S/M/L', description: '宽松阔腿版型，极简风格。', isKnowledge: true, image: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?w=400&h=400&fit=crop' },
  ],

  COMMUNITY_POSTS: [
    {id:1,user:'时尚小美',avatar:'👩',content:'今天这套通勤穿搭超满意！米色衬衫+阔腿裤，舒适又优雅~',outfit:'温柔通勤',likes:128,collected:35,liked:false,collected:false,image:tti('1:1，ins风穿搭实拍，年轻女生，基础款米色宽松衬衫，垂感阔腿长裤，同色系穿搭，松弛氛围感，室内柔和自然光，极简背景，高级莫兰迪色调，干净构图，写实照片，高清，质感细腻，优雅日常通勤穿搭。无水印，无文字，无logo，无品牌标识，纯穿搭照片。「单反实拍、人像写真、写实摄影」')},
    {id:2,user:'穿搭达人',avatar:'🧑',content:'面试穿搭分享：藏青衬衫+黑色西裤，专业感拉满！',outfit:'专业干练',likes:256,collected:89,liked:false,collected:false,image:tti('1:1，ins风穿搭实拍，年轻女生，藏青色修身衬衫，黑色直筒西裤，专业干练搭配，利落氛围感，室内柔和自然光，极简背景，高级莫兰迪色调，干净构图，写实照片，高清，质感细腻，职场面试通勤穿搭。无水印，无文字，无logo，无品牌标识，纯穿搭照片。「单反实拍、人像写真、写实摄影」')},
    {id:3,user:'甜妹穿搭',avatar:'👧',content:'粉色针织衫+白色半身裙，约会必备！',outfit:'甜美约会',likes:512,collected:167,liked:false,collected:false,image:tti('1:1，ins风穿搭实拍，年轻女生，粉色柔软针织衫，白色半身裙，甜美约会搭配，温柔氛围感，室内柔和自然光，极简背景，高级莫兰迪色调，干净构图，写实照片，高清，质感细腻，浪漫约会穿搭。无水印，无文字，无logo，无品牌标识，纯穿搭照片。「单反实拍、人像写真、写实摄影」')},
    {id:4,user:'酷飒女孩',avatar:'👩',content:'全黑搭配永远的神！皮夹克+马丁靴，气场十足',outfit:'个性酷飒',likes:342,collected:98,liked:false,collected:false,image:tti('1:1，ins风穿搭实拍，年轻女生，黑色皮夹克，马丁靴，全黑个性搭配，酷飒氛围感，室内柔和自然光，极简背景，高级莫兰迪色调，干净构图，写实照片，高清，质感细腻，街头酷飒穿搭。无水印，无文字，无logo，无品牌标识，纯穿搭照片。「单反实拍、人像写真、写实摄影」')},
    {id:5,user:'运动少年',avatar:'🧑',content:'周末运动穿搭，速干T恤+跑鞋，舒适又时尚',outfit:'运动活力',likes:89,collected:23,liked:false,collected:false,image:tti('1:1，ins风穿搭实拍，年轻女生，速干运动T恤，跑鞋，运动休闲搭配，活力氛围感，室内柔和自然光，极简背景，高级莫兰迪色调，干净构图，写实照片，高清，质感细腻，周末运动穿搭。无水印，无文字，无logo，无品牌标识，纯穿搭照片。「单反实拍、人像写真、写实摄影」')},
  ],

  ONBOARDING_STEPS: [
    {icon:'📸',title:'上传你的全身照',desc:'在"我的"页面，点击上传一张全身照，AI会把搭配方案叠在你的照片上，效果更直观。',action:()=>{document.querySelector('#onboarding-overlay').classList.remove('active');switchTab('profile');}},
    {icon:'📚',title:'导入你的衣橱',desc:'点击右下角＋按钮，选择品牌搜索、品类库或电商导入，把你常穿的衣服加入衣橱。',action:()=>{document.querySelector('#onboarding-overlay').classList.remove('active');switchTab('wardrobe');setTimeout(()=>openAddMethodPicker(),400);}},
    {icon:'👗',title:'获取第一套搭配',desc:'回到首页，告诉AI你的场合需求（面试/约会/通勤），AI会根据衣橱为你生成从头到脚的完整搭配方案。',action:()=>{document.querySelector('#onboarding-overlay').classList.remove('active');switchTab('home');localStorage.setItem('fashion-ai-onboarded','1');}},
  ],

  OCCASION_MAP: {daily:'日常通勤',interview:'面试',date:'约会',sports:'运动',party:'聚会',business:'商务宴请'},

  STYLE_MAP: {
    professional:'商务',gentle:'简约',creative:'酷飒',casual:'休闲',
    street:'酷飒',sweet:'甜美',elegant:'简约',cool:'酷飒',
    sporty:'运动',athleisure:'休闲',glam:'甜美',edgy:'酷飒',
  },

  DEFAULT_STATE: {
    activeTab: 'home',
    wardrobe: [],
    history: [],
    chatPhase: 'welcome',
    currentOccasion: null,
    currentDetail: null,
    currentOutfits: [],
    likedOutfits: [],
    stylePrefs: ['简约','休闲'],
    no3DTip: false,
    nextId: 100,
    wardrobeEditMode: false,
    historyEditMode: false,
    selectedWardrobeIds: [],
    selectedHistoryIds: [],
    location: '',
    userPhoto: null,
    plans: [],
    bodyInfo: null,
    theme: 'light',
    nickname: '',
    avatar: '',
    gender: 'secret',
    age: '',
    bio: '',
    userPosts: [],
    likedPosts: [],
    collectedPosts: [],
    styleHistory: [],
    currentWeather: null,
  },
};