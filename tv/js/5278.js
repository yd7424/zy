const axios = require('axios'); // 需提前安装：npm install axios cheerio
const cheerio = require('cheerio');

/**
 * 核心采集引擎：内置智能匹配与自动解析逻辑
 */
class UniversalCollector {
    constructor() {
        // 内置常见的影视站特征库，用于自动匹配（应对不写选择器的情况）
        this.commonSelectors = {
            title: ['h1', '.stui-content__detail h1', '.module-info-heading h1', '[itemprop="headline"]'],
            cover: ['.stui-content__thumb img', '.module-item-pic img', 'img[data-original]', 'meta[property="og:image"]'],
            playFrame: ['#player_iframe', 'iframe[src*="player"]', '.stui-player__video iframe', '.play-wrapper iframe']
        };
    }

    /**
     * 智能请求方法（自动处理基础请求头）
     */
    async fetchHtml(url, headers = {}) {
        try {
            const defaultHeaders = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8'
            };
            const response = await axios.get(url, { headers: { ...defaultHeaders, ...headers } });
            return cheerio.load(response.data);
        } catch (error) {
            console.error(`❌ 请求失败: ${url}`, error.message);
            return null;
        }
    }

    /**
     * 自动提取器：如果用户没写选择器，它会按常见特征自动尝试匹配
     */
    autoExtract($, selectorList, attr = 'text') {
        for (let sel of selectorList) {
            const element = $(sel);
            if (element.length > 0) {
                return attr === 'attr' ? element.attr('src') || element.attr('data-original') || element.attr('href') : element.text().trim();
            }
        }
        return null;
    }

    /**
     * 1. 批量分类抓取
     */
    async fetchCategory(site) {
        console.log(`\n🚀 正在抓取 [${site.name}] 分类页：${site.categoryUrl}`);
        const $ = await this.fetchHtml(site.categoryUrl, site.headers);
        if (!$) return [];

        const results = [];
        // 如果用户配置了列表选择器就用用户的，否则尝试匹配常见的列表特征
        const listSelector = site.selectors?.list || '.stui-vodlist li, .module-item, .col-md-6, .vodlist_item';
        
        $(listSelector).each((index, element) => {
            if (index >= (site.limit || 10)) return; // 限制抓取数量
            const el = $(element);
            // 智能提取标题和封面
            const title = site.selectors?.title ? el.find(site.selectors.title).text() : el.find('a').attr('title') || el.find('h4').text() || el.find('a').text().trim();
            let cover = site.selectors?.cover ? el.find(site.selectors.cover).attr('src') : el.find('img').attr('data-original') || el.find('img').attr('src');
            const link = el.find('a').attr('href');

            if (title && link) {
                // 补全相对路径链接
                const fullLink = link.startsWith('http') ? link : site.baseUrl + link;
                const fullCover = cover && !cover.startsWith('http') ? site.baseUrl + cover : cover;
                results.push({ title, cover: fullCover, link: fullLink });
            }
        });
        return results;
    }

    /**
     * 2. 自动搜索影片
     */
    async searchVideo(site, keyword) {
        const searchUrl = site.searchUrl.replace('{wd}', encodeURIComponent(keyword));
        console.log(`\n🔍 正在 [${site.name}] 搜索：${keyword}`);
        const $ = await this.fetchHtml(searchUrl, site.headers);
        if (!$) return [];

        const results = [];
        const listSelector = site.selectors?.list || '.stui-vodlist li, .module-item, .row';
        $(listSelector).each((index, element) => {
            const el = $(element);
            const title = el.find('a').attr('title') || el.find('h4').text() || el.text().trim();
            const link = el.find('a').attr('href');
            if (title && link && title.includes(keyword)) {
                const fullLink = link.startsWith('http') ? link : site.baseUrl + link;
                results.push({ title, link: fullLink });
            }
        });
        return results;
    }

    /**
     * 3. 智能解析播放地址（免嗅探核心）
     */
    async parsePlayUrl(site, pageUrl) {
        console.log(`\n🎬 正在解析播放地址：${pageUrl}`);
        
        // 如果配置了第三方解析接口，直接返回拼接后的地址（最稳妥的免嗅探方案）
        if (site.parseApi) {
            return site.parseApi + pageUrl;
        }

        const $ = await this.fetchHtml(pageUrl, site.headers);
        if (!$) return null;

        // 优先尝试提取 iframe 或 video 标签的真实地址
        const playFrameSelector = site.selectors?.playFrame || this.commonSelectors.playFrame;
        let playUrl = this.autoExtract($, playFrameSelector, 'attr');

        if (playUrl) {
            // 补全播放地址
            return playUrl.startsWith('http') ? playUrl : site.baseUrl + playUrl;
        }

        // 兜底：如果没找到 iframe，返回当前页面地址，交给播放器去二次嗅探
        return pageUrl;
    }
}

// ================= 你只需要在这里填网址 =================
const mySites = [
    {
        name: "我", // 随便起个名
        baseUrl: "https://jpm.yzfnb2.makeup/cn/home/web", // 【必填】目标网站的主域名（注意不要带最后的斜杠）
        categoryUrl: "https://jpm.yzfnb2.makeup/cn/home/web/index.php/vod/type", // 【必填】想抓取的分类页网址
        searchUrl: "https://jpm.yzfnb2.makeup/cn/home/web/index.php/vod/search.html?wd={wd}", // 【选填】搜索页网址，{wd}代表关键词
        parseApi: , // 【选填】如果有解析接口就填，没有就删掉这行
        limit: 5, // 【选填】每次抓取几条数据
        // selectors: {}, // 【高级选填】如果自动提取不准，可以在这里手动写CSS选择器
    },
    
];

// ================= 实际运行演示 =================
const collector = new UniversalCollector();

(async () => {
    const targetSite = mySites[0]; // 选取第一个配置好的网站
    
    // 1. 抓取分类影片列表
    const categoryData = await collector.fetchCategory(targetSite);
    console.log("✅ 分类抓取结果:", categoryData);

    // 2. 搜索影片测试
    const searchData = await collector.searchVideo(targetSite, "狂飙");
    console.log("✅ 搜索结果:", searchData);

    // 3. 解析播放地址测试（拿上面抓到的第一个影片链接来测试）
    if (categoryData.length > 0) {
        const finalPlayUrl = await collector.parsePlayUrl(targetSite, categoryData[0].link);
        console.log("✅ 最终播放地址:", finalPlayUrl);
    }
})();
