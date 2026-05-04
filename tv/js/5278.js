if (typeof Object.assign != 'function') { 
    Object.assign = function () { 
        var target = arguments[0]; 
        for (var i = 1; i < arguments.length; i++) { 
            var source = arguments[i]; 
            for (var key in source) { 
                if (Object.prototype.hasOwnProperty.call(source, key)) { 
                    target[key] = source[key]; 
                } 
            } 
        } 
        return target; 
    }; 
} 

function getMubans() { 
    var mubanDict = { // 模板字典 
        我的自定义模板: { // 👈 在这里修改你的模板名称
            title: '我的网站', // 👈 网站显示名称
            host: 'https://jpm.yzfnb2.makeup/cn/home/web', // 👈 网站域名（注意不要带最后的斜杠）
            url: 'https://jpm.yzfnb2.makeup/cn/home/web/index.php/vodshow/fyclass--------fypage---.html', // 👈 分类列表页链接规则
            searchUrl: '/vodsearch/**----------fypage---.html', // 👈 搜索页链接规则 (**代表搜索词)
            searchable: 2, // 是否启用全局搜索 (2:启用, 0:禁用)
            quickSearch: 0, // 是否启用快速搜索
            filterable: 0, // 是否启用分类筛选
            headers: { // 请求头 (通常带上 UA 即可)
                'User-Agent': 'MOBILE_UA', 
            }, 
            // 分类解析规则 (从导航栏提取分类名和ID)
            class_parse: '.navbar-items li:gt(2):lt(8);a&&Text;a&&href;/(\\d+).html', 
            play_parse: true, // 是否启用播放解析
            lazy: '', // 播放解析的JS代码 (如果不需要特殊解析可留空)
            limit: 6, // 推荐/分类列表的显示数量限制
            // 首页推荐位解析规则
            推荐: '.tab-list.active;a.module-poster-item.module-item;.module-poster-item-title&&Text;.lazyload&&data-original;.module-item-note&&Text;a&&href', 
            double: true, // 推荐内容是否双层定位
            // 分类列表页解析规则
            一级: 'body a.module-poster-item.module-item;a&&title;.lazyload&&data-original;.module-item-note&&Text;a&&href', 
            // 详情页解析规则
            二级: { 
                "title": "h1&&Text;.module-info-tag&&Text", // 标题
                "img": ".lazyload&&data-original", // 封面图
                "desc": ".module-info-item:eq(1)&&Text;.module-info-item:eq(2)&&Text;.module-info-item:eq(3)&&Text", // 简介/演员等
                "content": ".module-info-introduction&&Text", // 剧情简介
                "tabs": ".module-tab-item", // 播放线路（选集标签）
                "lists": ".module-play-list:eq(#id) a" // 播放列表（#id会自动匹配线路索引）
            }, 
            // 搜索结果页解析规则
            搜索: 'body .module-item;.module-card-item-title&&Text;.lazyload&&data-original;.module-item-note&&Text;a&&href;.module-info-item-content&&Text', 
        }
    }; 
    return JSON.parse(JSON.stringify(mubanDict)); 
} 

var mubanDict = getMubans(); 
var muban = getMubans(); 
export default {muban, getMubans};
