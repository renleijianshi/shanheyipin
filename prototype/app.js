/* global document, clearTimeout, setTimeout */

const miniFeatures = [
  ['首页与搜索', 'Banner、新品、本季推荐、送礼专区、热词、商品与内容搜索', 'M10 起逐步实现'],
  ['分类与商品', '多级分类、标签筛选、商品列表、SPU/SKU、规格选择、收藏分享', 'M07–M10'],
  ['购物车与结算', '数量修改、失效校验、优惠、地址、发票、留言、配送与订单确认', 'M11–M13'],
  ['订单与物流', '待付款、待发货、待收货、订单详情、物流追踪、再次购买', 'M13–M16'],
  ['售后服务', '仅退款、退货退款、补发、品质赔付、凭证与进度查询', 'M30–M32'],
  ['会员权益', '等级、积分、优惠券、收藏、足迹、地址与账户设置', 'M33–M36'],
  ['山野志', '产地、工艺、人物、采收、食用方式、品牌故事与视频专题', 'M37'],
  ['防伪溯源', '批次、产地、质检、包装过程、装盒视频、扫码次数与异常提示', 'M38–M39'],
  ['企业礼品', '礼盒推荐、预算数量、定制、开票、多地址配送、询价与进度', 'M40–M42']
];

const adminGroups = [
  { label: '经营', items: [
    { id: 'dashboard', icon: '⌂', name: '工作台', subs: ['经营概览', '待办事项', '异常告警'] },
    { id: 'reports', icon: '⌁', name: '数据报表', subs: ['销售', '商品/SKU', '复购', '库存', '损耗', '内容转化'] }
  ]},
  { label: '交易', items: [
    { id: 'products', icon: '◇', name: '商品中心', subs: ['分类', 'SPU', 'SKU', '规格', '标签', '素材', '上下架', '预售商品'] },
    { id: 'orders', icon: '▤', name: '订单中心', subs: ['全部订单', '待付款', '待发货', '物流', '批量发货', '订单备注'] },
    { id: 'aftersales', icon: '↺', name: '售后中心', subs: ['仅退款', '退货退款', '补发', '赔付', '退货入库', '售后统计'] }
  ]},
  { label: '用户与增长', items: [
    { id: 'members', icon: '◎', name: '会员中心', subs: ['用户', '标签', '等级', '积分', '优惠券资产', '黑名单', '用户行为'] },
    { id: 'marketing', icon: '券', name: '营销中心', subs: ['优惠券', '新人活动', '满减/满赠', '会员价', '预售', '套装', '活动专题'] },
    { id: 'content', icon: '文', name: '内容中心', subs: ['文章', '视频', 'Banner', '首页装修', '山野志', '产地', '人物'] }
  ]},
  { label: '供应链', items: [
    { id: 'purchase', icon: '采', name: '采购管理', subs: ['供应商', '农户', '采购申请', '采购单', '收货', '采购退货', '成本'] },
    { id: 'warehouse', icon: '仓', name: '仓库库存', subs: ['仓库/仓位', '批次库存', '原料/包材', '入出库', '盘点', '报损', '流水', '预警'] },
    { id: 'processing', icon: '包', name: '加工包装', subs: ['包装 BOM', '加工任务', '领料', '完工入库', '消耗', '损耗', '成品批次'] },
    { id: 'trace', icon: '溯', name: '溯源管理', subs: ['码批次', '单码', '绑定', '打印', '扫码记录', '异常扫码', '页面模板', '视频绑定'] }
  ]},
  { label: '企业与系统', items: [
    { id: 'enterprise', icon: '企', name: '企业团购', subs: ['询价线索', '跟进', '报价', '企业客户', '企业订单', '定制', '多地址'] },
    { id: 'service', icon: '客', name: '客服中心', subs: ['工单', '售后沟通', '用户备注', '快捷回复', '客诉标签'] },
    { id: 'finance', icon: '¥', name: '财务中心', subs: ['支付/退款流水', '收入', '优惠成本', '运费', '采购成本', '毛利', '对账'] },
    { id: 'system', icon: '⚙', name: '系统管理', subs: ['员工', '角色权限', '数据权限', '参数', '物流/OSS 配置', '操作日志', '备份状态'] }
  ]}
];

const modeButtons = document.querySelectorAll('[data-mode]');
const stages = document.querySelectorAll('.preview-stage');
const miniPages = document.querySelectorAll('.mini-page');
const tabBar = document.querySelector('.tab-bar');
const featureDialog = document.querySelector('#feature-dialog');
const dialogTitle = document.querySelector('#dialog-title');
const dialogContent = document.querySelector('#dialog-content');
const toast = document.querySelector('#toast');
let lastMiniPage = 'home';
let toastTimer;

function setMode(mode) {
  modeButtons.forEach((button) => {
    const active = button.dataset.mode === mode;
    button.classList.toggle('is-active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  stages.forEach((stage) => stage.classList.toggle('is-active', stage.id === `${mode}-preview`));
}

function showMiniPage(page) {
  const current = document.querySelector('.mini-page.is-active')?.dataset.page;
  if (page === 'product' && current !== 'product') lastMiniPage = current || 'home';
  miniPages.forEach((panel) => panel.classList.toggle('is-active', panel.dataset.page === page));
  tabBar.hidden = page === 'product';
  document.querySelectorAll('[data-nav]').forEach((button) => {
    button.classList.toggle('is-active', button.dataset.nav === page && button.closest('.tab-bar'));
  });
  document.querySelector(`[data-page="${page}"]`)?.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('is-visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2200);
}

function openDialog(title, content) {
  dialogTitle.textContent = title;
  dialogContent.innerHTML = content;
  featureDialog.showModal();
}

function renderFeatureCards(features) {
  return `<div class="feature-map-grid">${features.map(([title, body, phase]) => `
    <article><h3>${title}</h3><p>${body}</p><span class="phase">${phase}</span></article>
  `).join('')}</div>`;
}

function handleAction(action) {
  if (action === 'home') setMode('miniapp');
  if (action === 'back') showMiniPage(lastMiniPage);
  if (action === 'search') showToast('搜索页：支持商品、内容、分类与热词');
  if (action === 'add-cart') showToast('已加入购物车 · 双层臻选礼盒 × 1');
  if (action === 'checkout') showToast('结算流程将在 M12 接通，当前不调用真实支付');
  if (action === 'feature-map') openDialog('小程序完整功能地图', renderFeatureCards(miniFeatures));
  if (action === 'trace') openDialog('一盒一码 · 溯源示例', `
    <div class="feature-map-grid">
      <article><h3>产品批次</h3><p>舟曲吊柿 · 成品批次 CP2026-0918-03</p><span class="phase">扫码校验正常</span></article>
      <article><h3>产地与农户</h3><p>甘肃省甘南州舟曲县 · 白龙江河谷合作农户</p><span class="phase">海拔 1,300 米</span></article>
      <article><h3>加工与质检</h3><p>2026-09-18 装盒；糖霜、重量、外观抽检合格</p><span class="phase">质检合格</span></article>
      <article><h3>扫码记录</h3><p>这是本盒第 1 次扫码。首次扫码地点：中国大陆。</p><span class="phase">未发现异常</span></article>
    </div>`);
  if (action === 'enterprise') openDialog('企业团购与礼品定制', `
    <div class="feature-map-grid">
      <article><h3>企业询价</h3><p>提交数量、预算、交付日期、开票与联系人信息。</p><span class="phase">M40</span></article>
      <article><h3>礼盒定制</h3><p>支持腰封、贺卡、企业标识与不同价格区间组合。</p><span class="phase">定制需求</span></article>
      <article><h3>多地址配送</h3><p>模板导入收货地址，校验后拆分配送任务。</p><span class="phase">M42</span></article>
      <article><h3>跟进与报价</h3><p>后台形成询价线索、跟进记录、报价版本与企业订单。</p><span class="phase">M41</span></article>
    </div>`);
}

modeButtons.forEach((button) => button.addEventListener('click', () => setMode(button.dataset.mode)));
document.querySelectorAll('[data-nav]').forEach((button) => button.addEventListener('click', () => showMiniPage(button.dataset.nav)));
document.querySelectorAll('[data-open-product]').forEach((button) => button.addEventListener('click', () => showMiniPage('product')));
document.querySelectorAll('[data-action]').forEach((button) => button.addEventListener('click', (event) => {
  event.preventDefault();
  handleAction(button.dataset.action);
}));

document.querySelectorAll('.category-tabs button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.category-tabs button').forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
  showToast(`已切换：${button.textContent}`);
}));
document.querySelectorAll('.sku-picker button').forEach((button) => button.addEventListener('click', () => {
  document.querySelectorAll('.sku-picker button').forEach((item) => item.classList.remove('is-active'));
  button.classList.add('is-active');
}));
document.querySelectorAll('.stepper').forEach((stepper) => stepper.addEventListener('click', (event) => {
  const button = event.target.closest('button');
  if (!button) return;
  const value = stepper.querySelector('span');
  const delta = button.textContent === '+' ? 1 : -1;
  value.textContent = String(Math.max(1, Number(value.textContent) + delta));
}));

function renderAdminNav() {
  document.querySelector('#admin-nav').innerHTML = adminGroups.map((group) => `
    <div class="admin-nav-group"><small>${group.label}</small>${group.items.map((item) => `
      <button class="admin-nav-item ${item.id === 'dashboard' ? 'is-active' : ''}" data-admin-page="${item.id}"><span>${item.icon}</span>${item.name}</button>
    `).join('')}</div>
  `).join('');
  document.querySelectorAll('[data-admin-page]').forEach((button) => button.addEventListener('click', () => showAdminPage(button.dataset.adminPage)));
}

function pageTitle(title, subtitle, action = '新建') {
  return `<div class="page-title"><div><h1>${title}</h1><p>${subtitle}</p></div><button data-admin-action>${action}</button></div>`;
}

function renderDashboard() {
  return `${pageTitle('经营概览', '今日经营、履约与供应链关键数据', '下载日报')}
    <div class="metric-grid">
      ${[['今日 GMV','¥28,650','较昨日 +12.6%','¥'],['支付订单','126','转化率 8.4%','单'],['待发货','32','其中预售 8 单','包'],['库存预警','6','2 项需今日处理','警']].map(([name,value,note,icon], index) => `<article class="metric-card"><header>${name}<span>${icon}</span></header><strong>${value}</strong><small class="${index < 2 ? 'trend-up' : ''}">${note}</small></article>`).join('')}
    </div>
    <div class="dashboard-grid"><section class="panel"><header class="panel-header"><h2>近 7 日销售趋势</h2><button>查看报表 →</button></header><div class="chart">${[44,58,51,72,66,86,76].map((height,index) => `<div style="height:${height}%"><span>${15 + index}日</span></div>`).join('')}</div></section>
    <section class="panel"><header class="panel-header"><h2>今日待办</h2><button>全部待办</button></header><div class="task-list"><button><span>发</span><span>待发货订单</span><b>32</b></button><button><span>售</span><span>待处理售后</span><b>7</b></button><button><span>采</span><span>待收货采购单</span><b>4</b></button><button><span>企</span><span>新企业询价</span><b>5</b></button><button><span>警</span><span>库存与履约告警</span><b>6</b></button></div></section></div>
    <div class="bottom-grid"><section class="panel"><header class="panel-header"><h2>商品销售</h2><button>商品报表</button></header><div class="status-list"><div class="status-line"><span>双层臻选礼盒</span><small>¥12,936</small><div class="progress-track"><span style="width:82%"></span></div></div><div class="status-line"><span>原味分享装</span><small>¥8,252</small><div class="progress-track"><span style="width:61%"></span></div></div><div class="status-line"><span>轻享试吃装</span><small>¥4,368</small><div class="progress-track"><span style="width:38%"></span></div></div></div></section>
    <section class="panel"><header class="panel-header"><h2>库存健康度</h2><button>库存中心</button></header><div class="status-list"><div class="status-line"><span>可售库存</span><small>3,268 件</small><div class="progress-track"><span style="width:76%"></span></div></div><div class="status-line"><span>锁定库存</span><small>138 件</small><div class="progress-track"><span style="width:22%"></span></div></div><div class="status-line"><span>临期预警</span><small>24 件</small><div class="progress-track"><span style="width:12%"></span></div></div></div></section>
    <section class="panel"><header class="panel-header"><h2>渠道结构</h2><button>渠道分析</button></header><div class="status-list"><div class="status-line"><span>小程序自然成交</span><small>64%</small><div class="progress-track"><span style="width:64%"></span></div></div><div class="status-line"><span>内容转化</span><small>21%</small><div class="progress-track"><span style="width:21%"></span></div></div><div class="status-line"><span>企业团购</span><small>15%</small><div class="progress-track"><span style="width:15%"></span></div></div></div></section></div>`;
}

function renderProducts() {
  return `${pageTitle('商品中心', '管理分类、SPU、SKU、规格、素材与销售状态', '新建商品')}
    <div class="toolbar"><input type="search" placeholder="搜索商品名称 / SKU 编码"><select aria-label="销售状态"><option>全部状态</option><option>销售中</option><option>草稿</option><option>已下架</option></select><select aria-label="商品分类"><option>全部分类</option><option>柿饼</option><option>礼盒</option></select></div>
    <section class="panel"><table class="admin-table"><thead><tr><th>商品</th><th>SKU</th><th>售价</th><th>销售状态</th><th>库存模式</th><th>更新时间</th><th>操作</th></tr></thead><tbody>
      <tr><td><strong>舟曲吊柿 · 双层臻选礼盒</strong><small>SPU-2026-001 · 精品礼盒</small></td><td>2 个规格</td><td>¥168–268</td><td><span class="tag">销售中</span></td><td>批次库存</td><td>09-21 09:36</td><td class="table-actions">编辑 · 详情</td></tr>
      <tr><td><strong>舟曲吊柿 · 原味分享装</strong><small>SPU-2026-002 · 家庭分享</small></td><td>3 个规格</td><td>¥29.9–89.9</td><td><span class="tag">销售中</span></td><td>批次库存</td><td>09-20 18:12</td><td class="table-actions">编辑 · 详情</td></tr>
      <tr><td><strong>山河典藏礼盒</strong><small>SPU-2026-003 · 企业礼品</small></td><td>1 个规格</td><td>¥268</td><td><span class="tag warning">预售</span></td><td>批次库存</td><td>09-20 15:05</td><td class="table-actions">编辑 · 详情</td></tr>
      <tr><td><strong>秋收试吃组合</strong><small>SPU-2026-004 · 组合商品</small></td><td>1 个规格</td><td>¥39.9</td><td><span class="tag muted">草稿</span></td><td>批次库存</td><td>09-19 16:40</td><td class="table-actions">编辑 · 预览</td></tr>
    </tbody></table></section>`;
}

function findAdminItem(id) {
  return adminGroups.flatMap((group) => group.items).find((item) => item.id === id);
}

function renderModule(item) {
  return `${pageTitle(item.name, `查看 ${item.name} 的完整功能规划`, '功能配置')}
    <div class="module-overview">${item.subs.map((sub) => `<article class="module-card"><span>${item.icon}</span><h2>${sub}</h2><p>${moduleDescription(item.id, sub)}</p><button data-admin-action>进入${sub} →</button></article>`).join('')}</div>`;
}

function moduleDescription(id, name) {
  const descriptions = {
    orders: '查询、筛选与处理订单，关键操作保留审计记录。', aftersales: '按售后类型建立独立流程，退货必须经过质检。',
    members: '在数据权限控制下管理会员资产与行为。', marketing: '配置营销规则并跟踪领取、使用与转化。', content: '组织品牌内容并关联商品形成转化路径。',
    purchase: '串联供应商、采购、到货、成本和退货。', warehouse: '以批次、余额和流水维护可审计库存。', processing: '通过 BOM 和任务记录领料、包装、损耗与成品。',
    trace: '生成并绑定溯源码，记录消费者扫码与异常。', enterprise: '从询价线索到报价、订单和多地址履约。', service: '统一处理客服工单、沟通记录与客诉标签。',
    finance: '汇总业务流水和成本，不替代专业财务软件。', reports: '展示可追溯的经营指标、趋势和异常。', system: '管理人员、权限、配置和审计日志。'
  };
  return `${descriptions[id] || '业务能力按项目阶段逐步接入。'} 当前卡片展示“${name}”入口。`;
}

function showAdminPage(id) {
  const item = findAdminItem(id) || findAdminItem('dashboard');
  document.querySelectorAll('[data-admin-page]').forEach((button) => button.classList.toggle('is-active', button.dataset.adminPage === item.id));
  document.querySelector('#admin-breadcrumb').textContent = item.name;
  document.querySelector('#admin-content').innerHTML = item.id === 'dashboard' ? renderDashboard() : item.id === 'products' ? renderProducts() : renderModule(item);
  document.querySelectorAll('[data-admin-action]').forEach((button) => button.addEventListener('click', () => showToast(`${button.textContent.trim()}：交互入口已预留`)));
}

renderAdminNav();
showAdminPage('dashboard');
