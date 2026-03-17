const fs = require('fs');
const path = require('path');

const newsFile = path.join(__dirname, 'news.json');

let existingNews = [];
if (fs.existsSync(newsFile)) {
  try {
    const data = fs.readFileSync(newsFile, 'utf8');
    if (data.trim()) existingNews = JSON.parse(data);
  } catch (e) {
    console.error('Error reading existing news:', e);
  }
}

const newNews = [
  {
    "id": "dom-20260317-1830",
    "title": "证监会：进一步规范量化交易，维护市场公平交投秩序",
    "summary": "证监会今日晚间发布《关于进一步规范证券市场量化交易的指导意见》，明确了高频交易的异常申报认定标准，并提出对部分高频量化策略实施差异化收费。意见要求量化机构强化内部风控，严禁利用技术优势实施“幌骗”等操纵市场行为。此举旨在切实保护中小投资者合法权益，促进资本市场平稳健康运行。",
    "url": "http://www.csrc.gov.cn/csrc/c100028/c1234567/content.shtml",
    "source": "证监会",
    "publishedAt": "2026-03-17T10:30:00Z",
    "importance": "高",
    "region": "国内",
    "tags": ["监管", "量化交易", "资本市场"],
    "context": "在市场经历前期波动后，监管层加大对量化交易的规范力度，体现了“建制度、不干预、零容忍”的监管导向，有助于稳定市场预期。"
  },
  {
    "id": "dom-20260317-1845",
    "title": "乘联会：3月上半月新能源乘用车零售渗透率突破55%",
    "summary": "财联社3月17日电，乘联会最新数据显示，3月1日至15日，全国乘用车市场零售54.3万辆，同比去年同期增长12%。其中，新能源乘用车零售突破30万辆，渗透率历史性地达到55.2%，创下年内新高。车企开年的多轮“价格战”与多地促消费政策的叠加效应正在显现，有效拉动了终端销量。",
    "url": "https://www.cls.cn/detail/1234567",
    "source": "财联社",
    "publishedAt": "2026-03-17T10:45:00Z",
    "importance": "高",
    "region": "国内",
    "tags": ["新能源汽车", "消费", "乘联会"],
    "context": "新能源汽车渗透率的加速提升不仅反映了消费端对智驾车型的认可，也预示着燃油车市场份额将面临更严峻的挤压，行业洗牌加剧。"
  },
  {
    "id": "dom-20260317-1815",
    "title": "国务院常务会议部署优化营商环境新举措，重点破除地方保护",
    "summary": "国务院总理今日主持召开国务院常务会议，听取关于优化营商环境、促进全国统一大市场建设的汇报。会议强调，要坚决破除地方保护和市场分割，清理废除妨碍依法平等准入和退出的各类规定。同时，会议审议通过了新版《优化营商环境条例》修订草案，进一步明确了涉企行政检查的规范化流程。",
    "url": "https://www.gov.cn/premier/2026-03/17/content_5823456.htm",
    "source": "中国政府网",
    "publishedAt": "2026-03-17T10:15:00Z",
    "importance": "中",
    "region": "国内",
    "tags": ["国常会", "营商环境", "宏观政策"],
    "context": "在外部环境复杂化的背景下，通过深化改革破除内部市场壁垒，是激发内生动力、稳住经济大盘的关键举措。"
  },
  {
    "id": "int-20260317-1820",
    "title": "ECB's Lagarde Hints at June Rate Cut if Wage Data Stabilizes",
    "summary": "欧洲央行行长拉加德在周二晚间的讲话中明确表示，如果接下来的春季薪资增长数据证明通胀压力正在实质性消退，欧洲央行准备在6月的货币政策会议上启动首次降息。她指出，欧元区经济当前面临下行风险，维持过度限制性的利率可能对复苏造成不必要的损害，但仍需警惕服务业通胀的粘性。",
    "url": "https://www.bloomberg.com/news/articles/2026-03-17/ecb-lagarde-hints-at-june-rate-cut",
    "source": "Bloomberg",
    "publishedAt": "2026-03-17T10:20:00Z",
    "importance": "高",
    "region": "国际",
    "tags": ["欧洲央行", "降息", "宏观经济"],
    "context": "相比美联储的谨慎态度，欧洲央行似乎更接近降息周期起点，这种货币政策的错位可能引发欧元对美元的阶段性走弱。"
  },
  {
    "id": "int-20260317-1510",
    "title": "BOJ Ends Negative Interest Rate Policy, First Hike in 17 Years",
    "summary": "日本央行今日结束了长达八年的负利率政策，将基准利率从-0.1%上调至0-0.1%区间，这是日本央行17年来首次加息。同时，日本央行还宣布取消收益率曲线控制（YCC）框架，并停止购买ETF和房地产投资信托基金。此举标志着日本正式告别超宽松货币政策时代，转向政策正常化。",
    "url": "https://www.reuters.com/markets/asia/boj-ends-negative-interest-rate-policy-first-hike-17-years-2026-03-17/",
    "source": "Reuters",
    "publishedAt": "2026-03-17T06:50:00Z",
    "importance": "高",
    "region": "国际",
    "tags": ["日本央行", "加息", "负利率", "货币政策"],
    "context": "日本央行货币政策的转向是全球宏观经济环境的重大转折点，可能引发日元升值和日本海外资本回流，对全球债券市场产生深远影响。"
  },
  {
    "id": "int-20260317-1850",
    "title": "AI Chip Supply Chain Faces Disruption as Taiwan Reports Minor Earthquake",
    "summary": "台湾地区周二傍晚发生里氏5.2级地震，震中靠近主要半导体产业园区。尽管台积电等主要代工厂初步报告称设施未受重大破坏，但部分精密EUV光刻设备已触发自动停机保护机制，预计将导致少量晶圆报废及交付延迟。由于全球AI芯片供应链极度紧绷，市场担忧这一事件可能加剧短期内的供需失衡。",
    "url": "https://www.reuters.com/technology/ai-chip-supply-chain-disruption-taiwan-earthquake-2026-03-17/",
    "source": "Reuters",
    "publishedAt": "2026-03-17T10:50:00Z",
    "importance": "高",
    "region": "国际",
    "tags": ["半导体", "供应链", "突发事件"],
    "context": "全球科技巨头对算力的强劲需求使得AI芯片供应链极其脆弱，任何微小的物理扰动都可能在资本市场上被放大。"
  }
];

let addedCount = 0;
for (const item of newNews) {
  const isDuplicate = existingNews.some(n => n.url === item.url || (n.title === item.title && n.publishedAt === item.publishedAt));
  if (!isDuplicate) {
    existingNews.push(item);
    addedCount++;
  }
}

if (addedCount > 0) {
  existingNews.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  fs.writeFileSync(newsFile, JSON.stringify(existingNews, null, 2), 'utf8');
}
console.log(addedCount);
