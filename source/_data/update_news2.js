const fs = require('fs');
const path = require('path');
const newsFile = path.join(__dirname, 'news.json');

let existingNews = [];
try {
  existingNews = JSON.parse(fs.readFileSync(newsFile, 'utf8'));
} catch (e) {}

const newNews = [
  {
    "id": "dom-20260317-2000",
    "title": "证监会：稳步扩大资本市场制度型开放",
    "summary": "证监会副主席在出席论坛时强调，将继续深化资本市场高水平对外开放，优化沪深港通机制，支持更多优质企业境外上市，同时吸引更多外资金融机构来华展业。此举释放了中国资本市场持续开放的明确信号。",
    "url": "http://www.csrc.gov.cn/new1",
    "source": "证监会",
    "publishedAt": "2026-03-17T12:00:00Z",
    "importance": "高",
    "region": "国内",
    "tags": ["开放", "资本市场", "外资"],
    "context": "在当前复杂的国际环境下，高水平开放是稳定外资预期、提升市场活力的关键举措。"
  },
  {
    "id": "dom-20260317-2001",
    "title": "央行行长：我国货币政策有充足空间和储备",
    "summary": "中国人民银行行长在新闻发布会上表示，我国货币政策框架不断完善，当前货币政策空间依然充足。未来将综合运用多种货币政策工具，保持流动性合理充裕，促进社会综合融资成本稳中有降，全力支持实体经济高质量发展。",
    "url": "http://www.pbc.gov.cn/new2",
    "source": "中国人民银行",
    "publishedAt": "2026-03-17T12:10:00Z",
    "importance": "高",
    "region": "国内",
    "tags": ["央行", "货币政策", "宏观经济"],
    "context": "央行表态为市场注入了一剂强心针，表明在经济企稳回升阶段，政策支持力度不会减弱。"
  },
  {
    "id": "dom-20260317-2002",
    "title": "国家发改委部署春季农业生产物资保供稳价工作",
    "summary": "为确保春耕生产顺利进行，国家发改委近日联合多部门印发通知，要求各地做好化肥、农药等农资的生产保供和价格稳定工作。严厉打击囤积居奇、哄抬价格等违法行为，切实保障国家粮食安全。",
    "url": "https://www.ndrc.gov.cn/new3",
    "source": "国家发改委",
    "publishedAt": "2026-03-17T11:45:00Z",
    "importance": "中",
    "region": "国内",
    "tags": ["农业生产", "保供稳价", "粮食安全"],
    "context": "春耕物资保障直接关系全年粮食产量，发改委提前部署体现了对粮食安全底线的坚守。"
  },
  {
    "id": "int-20260317-2000",
    "title": "IMF Upgrades Global Growth Forecast Slightly on Resilient US Economy",
    "summary": "国际货币基金组织（IMF）最新发布的报告小幅上调了2026年全球经济增长预期，主要归功于美国经济展现出的超预期韧性。然而，IMF同时警告称，地缘政治冲突、高通胀粘性以及发展中国家债务负担加重等下行风险依然显著。",
    "url": "https://www.reuters.com/new4",
    "source": "IMF",
    "publishedAt": "2026-03-17T12:05:00Z",
    "importance": "高",
    "region": "国际",
    "tags": ["全球经济", "经济预测", "宏观"],
    "context": "美国经济“不着陆”的概率增加，带动了全球增长预期的修复，但也给新兴市场带来了更长时间的高利率环境压力。"
  },
  {
    "id": "int-20260317-2001",
    "title": "Tech Giants Agree on Global AI Safety Standards at Summit",
    "summary": "在伦敦举行的全球人工智能安全峰会上，包括谷歌、微软和Meta在内的顶级科技企业就高级AI模型的开发和部署标准达成了一致。新协议要求企业在发布前沿模型前进行独立的红队测试，并建立统一的风险评估框架，以防范潜在的系统性风险。",
    "url": "https://www.ft.com/new5",
    "source": "FT",
    "publishedAt": "2026-03-17T11:50:00Z",
    "importance": "高",
    "region": "国际",
    "tags": ["人工智能", "科技行业", "安全标准"],
    "context": "这是全球AI监管领域的一次重大进展，标志着行业自律开始与政府监管形成合力。"
  },
  {
    "id": "int-20260317-2002",
    "title": "US Treasury Yields Stabilize Ahead of Key Inflation Data",
    "summary": "美国国债收益率在周三关键的PCE通胀数据发布前企稳。由于近期一系列强劲的经济指标引发了市场对通胀反弹的担忧，投资者目前处于观望状态。10年期美债收益率目前徘徊在4.2%左右，任何超预期的通胀数据都可能引发债市的新一轮抛售。",
    "url": "https://www.bloomberg.com/new6",
    "source": "Bloomberg",
    "publishedAt": "2026-03-17T12:15:00Z",
    "importance": "中",
    "region": "国际",
    "tags": ["美债", "通胀", "金融市场"],
    "context": "国债市场是全球资产定价的锚，其波动直接影响股市和汇市的表现，当前市场正在焦急等待明确的通胀方向。"
  }
];

existingNews = [...newNews, ...existingNews].slice(0, 100);
fs.writeFileSync(newsFile, JSON.stringify(existingNews, null, 2), 'utf8');
console.log(newNews.length);
