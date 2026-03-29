// 全局变量
let toolsData = null;
let currentCategory = 'all';
let searchQuery = '';
let sortOption = 'updated-desc';
let isDarkMode = false;
let isEnglishMode = false;
let isTraditionalMode = false;

// DOM加载完成后初始化
document.addEventListener('DOMContentLoaded', function() {
    initEventListeners();
    loadTools();
    checkSavedModes();
});

// 初始化事件监听器
function initEventListeners() {
    // 搜索功能
    document.getElementById('search-input').addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase();
        renderTools();
    });

    // 排序功能
    document.getElementById('sort-select').addEventListener('change', (e) => {
        sortOption = e.target.value;
        renderTools();
    });

    // 模式切换
    document.getElementById('dark-mode-btn').addEventListener('click', toggleDarkMode);
    document.getElementById('english-mode-btn').addEventListener('click', toggleEnglishMode);
    document.getElementById('traditional-mode-btn').addEventListener('click', toggleTraditionalMode);
    
    // 返回顶部功能
    document.getElementById('back-to-top').addEventListener('click', scrollToTop);
    window.addEventListener('scroll', toggleBackToTopButton);
}

// 检查本地存储的模式设置
function checkSavedModes() {
    const savedDarkMode = localStorage.getItem('benniao-dark-mode');
    const savedEnglishMode = localStorage.getItem('benniao-english-mode');
    const savedTraditionalMode = localStorage.getItem('benniao-traditional-mode');
    
    if (savedDarkMode === 'true') {
        toggleDarkMode();
    }
    
    if (savedEnglishMode === 'true') {
        toggleEnglishMode();
    }
    
    if (savedTraditionalMode === 'true') {
        toggleTraditionalMode();
    }
}

// 加载工具数据
async function loadTools() {
    try {
        const response = await fetch('index.json');
        const data = await response.json();
        toolsData = data;
        renderCategories();
        renderTools();
        updateStats();
    } catch (error) {
        console.error('Failed to load tools:', error);
        document.getElementById('tools-grid').innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">⚠️</div>
                <p>加载工具列表失败，请刷新页面重试。</p>
            </div>
        `;
    }
}

// 更新统计信息
function updateStats() {
    if (toolsData) {
        document.getElementById('tools-count').textContent = toolsData.tools.length;
        document.getElementById('help-count').textContent = '4823';
    }
}

// 渲染分类标签
function renderCategories() {
    const container = document.getElementById('category-tabs');
    
    // 清空容器，只保留"全部"按钮
    const allButton = container.querySelector('[data-category="all"]');
    container.innerHTML = '';
    container.appendChild(allButton);
    
    // 添加分类按钮
    toolsData.categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = `category-tab ${currentCategory === cat.id ? 'active' : ''}`;
        btn.dataset.category = cat.id;
        btn.innerHTML = `${cat.icon} ${cat.name}`;
        btn.addEventListener('click', () => selectCategory(cat.id));
        container.appendChild(btn);
    });
}

// 选择分类
function selectCategory(category) {
    currentCategory = category;
    document.querySelectorAll('.category-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.category === category);
    });
    renderTools();
}

// 过滤和排序工具
function filterTools() {
    const filtered = toolsData.tools.filter(tool => {
        const matchesCategory = currentCategory === 'all' || tool.category === currentCategory;
        const matchesSearch = !searchQuery ||
            tool.name.toLowerCase().includes(searchQuery) ||
            tool.description.toLowerCase().includes(searchQuery) ||
            (tool.tags && tool.tags.some(tag => tag.toLowerCase().includes(searchQuery)));
        return matchesCategory && matchesSearch;
    });

    // 根据排序选项排序
    switch (sortOption) {
        case 'updated-asc':
            const withTimestampAsc = (tool) => new Date(tool.updatedAt || tool.createdAt || 0).getTime();
            return filtered.sort((a, b) => withTimestampAsc(a) - withTimestampAsc(b));
        case 'name-asc':
            return filtered.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'));
        case 'name-desc':
            return filtered.sort((a, b) => b.name.localeCompare(a.name, 'zh-CN'));
        case 'updated-desc':
        default:
            const withTimestampDesc = (tool) => new Date(tool.updatedAt || tool.createdAt || 0).getTime();
            return filtered.sort((a, b) => withTimestampDesc(b) - withTimestampDesc(a));
    }
}

// 渲染工具列表
function renderTools() {
    const container = document.getElementById('tools-grid');
    if (!toolsData) {
        container.innerHTML = `
            <div class="loading">
                <i class="fas fa-spinner fa-spin"></i> 加载工具列表...
            </div>
        `;
        return;
    }

    const filteredTools = filterTools();
    document.getElementById('tools-count-label').textContent = `共 ${filteredTools.length} 个工具`;

    if (filteredTools.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🔍</div>
                <p>未找到匹配的工具</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredTools.map(tool => {
        const category = toolsData.categories.find(c => c.id === tool.category);
        const updatedAt = tool.updatedAt || tool.createdAt || '未知';
        const color = tool.color || '#3a6ff4';
        
        return `
            <a href="${tool.detail || '#'}" target="_blank" class="tool-card">
                ${tool.featured ? '<span class="featured-badge">推荐</span>' : ''}
                <div class="tool-header">
                    <div class="tool-icon" style="background: ${color}20; color: ${color};">
                        ${tool.icon || '🔧'}
                    </div>
                    <div class="tool-info">
                        <div class="tool-title">${tool.name}</div>
                        <div class="tool-category">${category?.icon || ''} ${category?.name || '未分类'}</div>
                        <div class="tool-updated"><i class="far fa-clock"></i> ${updatedAt}</div>
                    </div>
                </div>
                <div class="tool-description">${tool.description}</div>
                <div class="tool-footer">
                    <div class="tool-tags">
                        ${(tool.tags || []).slice(0, 4).map(tag => `<span class="tool-tag">${tag}</span>`).join('')}
                    </div>
                    <div class="tool-meta">
                        <i class="fas fa-arrow-right tool-arrow"></i>
                    </div>
                </div>
            </a>
        `;
    }).join('');
}

// 切换暗黑模式
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    const darkModeBtn = document.getElementById('dark-mode-btn');
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        darkModeBtn.classList.add('active');
        darkModeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        darkModeBtn.title = '浅色模式';
        localStorage.setItem('benniao-dark-mode', 'true');
    } else {
        document.body.classList.remove('dark-mode');
        darkModeBtn.classList.remove('active');
        darkModeBtn.innerHTML = '<i class="fas fa-moon"></i>';
        darkModeBtn.title = '暗黑模式';
        localStorage.setItem('benniao-dark-mode', 'false');
    }
}

// 切换英文模式
function toggleEnglishMode() {
    isEnglishMode = !isEnglishMode;
    const englishBtn = document.getElementById('english-mode-btn');
    
    if (isEnglishMode) {
        englishBtn.classList.add('active');
        englishBtn.textContent = '中';
        englishBtn.title = '简体中文';
        convertToEnglish();
        localStorage.setItem('benniao-english-mode', 'true');
    } else {
        englishBtn.classList.remove('active');
        englishBtn.textContent = 'EN';
        englishBtn.title = 'English';
        convertToChinese();
        localStorage.setItem('benniao-english-mode', 'false');
    }
}

// 切换繁体模式
function toggleTraditionalMode() {
    isTraditionalMode = !isTraditionalMode;
    const traditionalBtn = document.getElementById('traditional-mode-btn');
    
    if (isTraditionalMode) {
        traditionalBtn.classList.add('active');
        traditionalBtn.textContent = '简';
        traditionalBtn.title = '简体模式';
        convertToTraditional();
        localStorage.setItem('benniao-traditional-mode', 'true');
    } else {
        traditionalBtn.classList.remove('active');
        traditionalBtn.textContent = '繁';
        traditionalBtn.title = '繁体模式';
        convertToSimplified();
        localStorage.setItem('benniao-traditional-mode', 'false');
    }
}

// 转换为英文（简化版）
function convertToEnglish() {
    const translations = {
        '笨鸟办公 工具集合': 'Benniao Office Tool Collection',
        '搜索工具名称、描述或标签...': 'Search tool name, description or tags...',
        '全部': 'All',
        '工具列表': 'Tool List',
        '加载中...': 'Loading...',
        '共': 'Total',
        '个工具': 'tools',
        '未找到匹配的工具': 'No matching tools found',
        '加载工具列表...': 'Loading tool list...',
        '返回笨鸟': 'Back to Benniao',
        '正序': 'Newest First',
        '倒序': 'Oldest First',
        '名称(A-Z)': 'Name (A-Z)',
        '名称(Z-A)': 'Name (Z-A)',
        '推荐': 'Featured'
    };
    
    // 转换页面文本
    document.querySelectorAll('h1, h2, .category-tab, .tools-count, .search-input, option, .empty-state p, .loading, .featured-badge, .back-btn')
        .forEach(el => {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = translations[el.placeholder] || el.placeholder;
            } else if (el.tagName === 'OPTION') {
                el.textContent = translations[el.textContent] || el.textContent;
            } else if (el.textContent && translations[el.textContent.trim()]) {
                el.textContent = translations[el.textContent.trim()];
            }
        });
    
    // 更新英雄区域文本
    const heroParagraph = document.querySelector('.hero p');
    if (heroParagraph) {
        const toolsCount = document.getElementById('tools-count').textContent;
        const helpCount = document.getElementById('help-count').textContent;
        heroParagraph.innerHTML = `AI-powered programming lightweight toolset, 10x efficiency improvement. All tools are single files, no installation required, open and use immediately, privacy protection, data processed locally. Provide personalized knowledge and tools for each enthusiast. Total <span id="tools-count">${toolsCount}</span> tools have helped <span id="help-count">${helpCount}</span> people.`;
    }
}

// 转换回中文（简化版）
function convertToChinese() {
    // 重新加载页面以恢复中文
    window.location.reload();
}

// 转换为繁体（简化版）
function convertToTraditional() {
    const traditionalMap = {
        '笨鸟办公 工具集合': '笨鳥辦公 工具集合',
        '搜索工具名称、描述或标签...': '搜索工具名稱、描述或標籤...',
        '全部': '全部',
        '工具列表': '工具列表',
        '加载中...': '加載中...',
        '共': '共',
        '个工具': '個工具',
        '未找到匹配的工具': '未找到匹配的工具',
        '加载工具列表...': '加載工具列表...',
        '返回笨鸟': '返回笨鳥',
        '正序': '正序',
        '倒序': '倒序',
        '名称(A-Z)': '名稱(A-Z)',
        '名称(Z-A)': '名稱(Z-A)',
        '推荐': '推薦'
    };
    
    document.querySelectorAll('h1, h2, .category-tab, .tools-count, .search-input, option, .empty-state p, .loading, .featured-badge, .back-btn')
        .forEach(el => {
            if (el.tagName === 'INPUT' && el.placeholder) {
                el.placeholder = traditionalMap[el.placeholder] || el.placeholder;
            } else if (el.tagName === 'OPTION') {
                el.textContent = traditionalMap[el.textContent] || el.textContent;
            } else if (el.textContent && traditionalMap[el.textContent.trim()]) {
                el.textContent = traditionalMap[el.textContent.trim()];
            }
        });
}

// 转换回简体（简化版）
function convertToSimplified() {
    // 重新加载页面以恢复简体
    window.location.reload();
}

// 滚动到顶部
function scrollToTop() {
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// 切换返回顶部按钮的显示
function toggleBackToTopButton() {
    const backToTopBtn = document.getElementById('back-to-top');
    if (window.scrollY > 300) {
        backToTopBtn.classList.add('show');
    } else {
        backToTopBtn.classList.remove('show');
    }
}