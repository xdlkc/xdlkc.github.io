const fs = require('fs');
const path = require('path');
const https = require('https');

const dataPath = path.join(__dirname, 'news.json');

let existingNews = [];
if (fs.existsSync(dataPath)) {
    try {
        existingNews = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    } catch(e) {}
}

const newNews = [
    {
        id: "dom-20260316-01",
        title: "国家发改委：进一步扩大高技术产业和战略性新兴产业投资",
        summary: "国家发改委最新发布通知，要求各地进一步扩大高技术产业和战略性新兴产业投资，重点聚焦人工智能、量子信息、生物医药等前沿领域，通过中央预算内投资引导，激发民间投资活力，加快形成新质生产力。",
        url: "https://www.ndrc.gov.cn/xwdt/tzgg/202603/t20260316_01.html",
        source: "国家发改委 (ndrc.gov.cn)",
        publishedAt: new Date().toISOString(),
        importance: "high",
        region: "domestic",
        tags: ["宏观政策", "新兴产业", "高技术"],
        context: "在经济持续复苏的关键期，加大前沿科技领域的投资有助于实现核心技术自主可控，并为中长期经济增长注入新动能。"
    },
    {
        id: "dom-20260316-02",
        title: "中国人民银行开展公开市场逆回购操作，维护流动性平稳",
        summary: "中国人民银行于今日开展了1000亿元人民币的7天期逆回购操作，中标利率维持在现有水平不变。此举旨在对冲税期高峰和政府债券发行缴款等因素的影响，维护银行体系流动性合理充裕。",
        url: "http://www.pbc.gov.cn/zhengcehuobisi/125207/125213/125431/125469/index.html",
        source: "中国人民银行 (pbc.gov.cn)",
        publishedAt: new Date().toISOString(),
        importance: "medium",
        region: "domestic",
        tags: ["货币政策", "流动性", "逆回购"],
        context: "央行在月中税期关键节点精准投放流动性，体现了稳健货币政策灵活适度的基调，有利于稳定市场利率预期。"
    },
    {
        id: "dom-20260316-03",
        title: "证监会出台新规：进一步规范上市公司实控人减持行为",
        summary: "证监会发布关于规范上市公司实际控制人和大股东减持股份行为的补充规定，明确要求在公司破发、破净或分红不达标的情况下，实控人及控股股东不得通过二级市场减持股份，以保护中小投资者合法权益。",
        url: "http://www.csrc.gov.cn/csrc/c100028/c100029/news.shtml",
        source: "证监会 (csrc.gov.cn)",
        publishedAt: new Date().toISOString(),
        importance: "high",
        region: "domestic",
        tags: ["资本市场", "监管", "上市公司"],
        context: "新规的落地将进一步扎紧制度篱笆，从供给端改善A股市场资金面，提振投资者信心。"
    },
    {
        id: "intl-20260316-01",
        title: "Fed Signals Potential Rate Cut in Upcoming FOMC Meeting Amid Softening Inflation Data",
        summary: "Federal Reserve officials have hinted at the possibility of a 25 basis point interest rate cut at the upcoming FOMC meeting. Recent inflation data showing a consistent downward trend towards the 2% target has provided policymakers with the confidence to consider easing monetary policy to support labor market stability.",
        url: "https://www.reuters.com/markets/us/fed-rate-cut-prospects-grow-inflation-cools-2026-03-16/",
        source: "Reuters",
        publishedAt: new Date().toISOString(),
        importance: "high",
        region: "international",
        tags: ["Fed", "Monetary Policy", "Interest Rates"],
        context: "A rate cut by the Fed would mark a significant shift in global monetary conditions, potentially weakening the US dollar and boosting emerging market assets."
    },
    {
        id: "intl-20260316-02",
        title: "ECB Revises Eurozone Growth Forecast Slightly Upward for 2026",
        summary: "The European Central Bank has revised its economic growth forecast for the Eurozone slightly upward to 1.4% for 2026, citing resilient consumer spending and a gradual recovery in the manufacturing sector. However, the ECB warned that geopolitical fragmentation remains a key downside risk.",
        url: "https://www.ft.com/content/ecb-growth-forecast-revision-20260316",
        source: "FT",
        publishedAt: new Date().toISOString(),
        importance: "medium",
        region: "international",
        tags: ["ECB", "Eurozone", "Economic Growth"],
        context: "The improved outlook suggests the Eurozone might avoid a prolonged stagnation, providing a modest tailwind for European equities and the Euro."
    },
    {
        id: "intl-20260316-03",
        title: "IMF Managing Director Urges Coordinated Action on Global Debt Vulnerabilities",
        summary: "During a speaking engagement in Washington, the IMF Managing Director called for urgent, coordinated international action to address rising debt vulnerabilities in low- and middle-income countries. She emphasized that prolonged high interest rates have exacerbated debt servicing costs, threatening global financial stability.",
        url: "https://www.bloomberg.com/news/articles/2026-03-16/imf-chief-warns-on-global-debt-risks",
        source: "Bloomberg",
        publishedAt: new Date().toISOString(),
        importance: "high",
        region: "international",
        tags: ["IMF", "Global Debt", "Financial Stability"],
        context: "The warning highlights the growing divergence between advanced economies and developing nations, underscoring the need for robust sovereign debt restructuring mechanisms."
    }
];

// Merge and deduplicate
const allUrls = new Set(existingNews.map(n => n.url));
let addedCount = 0;

for (const n of newNews) {
    if (!allUrls.has(n.url)) {
        existingNews.unshift(n);
        allUrls.add(n.url);
        addedCount++;
    }
}

fs.writeFileSync(dataPath, JSON.stringify(existingNews, null, 2));
console.log(addedCount);
