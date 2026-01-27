document.addEventListener('DOMContentLoaded', function() {
    // 初始化基础辅助功能
    makeAllLinksOpenInNewTab();
    setupLinkObserver();

    // 1. 移动端菜单切换逻辑
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // 2. 异步加载数据
    loadPublications();
    loadNews();
    loadHonors();

    // 3. 导航栏平滑滚动
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-nav-item');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href && href.startsWith('#')) {
                e.preventDefault();
                const targetSection = document.querySelector(href);
                if (targetSection) {
                    const navHeight = document.querySelector('.top-nav').offsetHeight;
                    window.scrollTo({
                        top: targetSection.offsetTop - navHeight - 20,
                        behavior: 'smooth'
                    });
                }
            }
        });
    });

    // 4. 滚动监听：自动高亮当前导航项
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        const navHeight = document.querySelector('.top-nav').offsetHeight;
        const scrollPos = window.pageYOffset || document.documentElement.scrollTop;

        sections.forEach(section => {
            if (scrollPos >= section.offsetTop - navHeight - 100) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active', 'text-accent');
            const linkTarget = link.getAttribute('href').replace('#', '');
            if (linkTarget === current || (current === 'homepage' && linkTarget === 'about')) {
                link.classList.add('active', 'text-accent');
            }
        });
    });
});

/**
 * 加载论文逻辑 - 支持多色 CCF 标签与分类显示
 */
async function loadPublications() {
    // 自动适配路径
    const isSubPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/');
    const path = isSubPage ? '../data/publications.json' : 'data/publications.json';

    const containers = {
        journal: document.getElementById('journal-list'),
        conference: document.getElementById('conference-list'),
        preprint: document.getElementById('preprint-list')
    };

    if (!containers.journal && !containers.conference && !containers.preprint) return;

    // CCF 颜色配置映射
    const ccfStyles = {
        'A': 'bg-red-50 text-red-600 border-red-100',
        'B': 'bg-blue-50 text-blue-600 border-blue-100',
        'C': 'bg-green-50 text-green-600 border-green-100',
        'N': 'bg-neutral-50 text-neutral-600 border-neutral-100'
    };

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Publications JSON not found');
        const pubs = await response.json();

        // 清空容器
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

        pubs.forEach(pub => {
            const target = containers[pub.type];
            if (!target) return;

            // 获取对应的 CCF 样式
            const ccfClass = ccfStyles[pub.ccf] || ccfStyles['N'];

            const html = `
                <div class="pub-item group relative pl-4 border-l-2 border-transparent hover:border-accent transition-all mb-10 text-justify">
                    <h4 class="text-lg font-bold text-primary group-hover:text-accent transition-colors leading-tight mb-1.5">
                        ${pub.title}
                    </h4>
                    <p class="text-sm text-neutral-600 mt-1 font-medium">${pub.authors}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span class="text-xs italic text-neutral-500 font-serif">${pub.venue}, ${pub.year}</span>
                        ${pub.ccf ? `<span class="text-[9px] font-bold ${ccfClass} border px-1.5 py-0.5 rounded">CCF-${pub.ccf}</span>` : ''}
                        ${pub.jcr ? `<span class="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1.5 py-0.5 rounded">JCR-${pub.jcr}</span>` : ''}
                    </div>
                    <div class="flex gap-2 mt-3">
                        ${pub.links?.pdf ? `<a href="${pub.links.pdf}" target="_blank" class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-all"><i class="fas fa-file-pdf mr-1"></i> PDF</a>` : ''}
                        ${pub.links?.code ? `<a href="${pub.links.code}" target="_blank" class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-all"><i class="fab fa-github mr-1"></i> Code</a>` : ''}
                        ${pub.links?.project ? `<a href="${pub.links.project}" target="_blank" class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-all"><i class="fas fa-globe mr-1"></i> Project</a>` : ''}
                    </div>
                </div>`;
            target.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) {
        console.error('Pub load error:', error);
    }
}

/**
 * 加载新闻逻辑
 */
async function loadNews() {
    const isSubPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/');
    const path = isSubPage ? '../data/news.json' : 'data/news.json';
    
    try {
        const response = await fetch(path);
        const data = await response.json();
        
        const homeContainer = document.getElementById('news-container');
        const allNewsContainer = document.getElementById('all-news-container');

        if (homeContainer) renderNewsItems(data.slice(0, 5), 'news-container');
        if (allNewsContainer) renderNewsItems(data, 'all-news-container');
    } catch (e) { console.error("News load error", e); }
}

function renderNewsItems(newsData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = newsData.map(item => `
        <div class="news-item relative group">
            <div class="absolute -left-[35px] top-1.5 w-3.5 h-3.5 rounded-full border-2 border-white bg-neutral-200 group-hover:bg-accent group-hover:scale-125 transition-all duration-300 shadow-sm"></div>
            
            <div class="flex flex-col sm:flex-row sm:items-baseline gap-2 sm:gap-6">
                <span class="news-date font-mono text-accent font-bold text-sm whitespace-nowrap min-w-[100px]">
                    ${item.date}
                </span>
                
                <div class="news-content text-primary text-sm leading-relaxed">
                    <span class="mr-1">🎉</span> ${item.content}
                    
                    ${(item.links || []).map(l => `
                        <a href="${l.url}" target="_blank" class="ml-2 text-xs font-bold text-accent hover:text-primary transition-colors underline decoration-accent/30 underline-offset-4">
                            [${l.text}]
                        </a>
                    `).join('')}
                </div>
            </div>
        </div>
    `).join('');
}
/**
 * 加载荣誉逻辑
 */
async function loadHonors() {
    const isSubPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/');
    const path = isSubPage ? '../data/honors.json' : 'data/honors.json';
    try {
        const response = await fetch(path);
        const data = await response.json();
        const homeContainer = document.getElementById('honors-container');
        const allHonorsContainer = document.getElementById('all-honors-container');

        if (homeContainer) renderHonorsItems(data.slice(0, 3), 'honors-container');
        if (allHonorsContainer) renderHonorsItems(data, 'all-honors-container');
    } catch (e) { console.error("Honors load error", e); }
}

function renderHonorsItems(data, containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = data.map(item => `
        <div class="honor-item flex items-baseline gap-8 group">
            <div class="honor-year w-20 flex-shrink-0 font-mono text-accent font-bold text-base">
                ${item.date}
            </div>
            
            <div class="honor-content border-l border-neutral-100 pl-8 pb-2 relative">
                <div class="absolute -left-[5px] top-2 w-2.5 h-2.5 rounded-full bg-neutral-200 group-hover:bg-accent transition-colors"></div>
                
                <h3 class="text-primary font-bold text-lg leading-tight group-hover:text-accent transition-colors">
                    ${item.title}
                </h3>
                <p class="text-neutral-500 text-sm mt-1">
                    ${item.org}
                </p>
            </div>
        </div>
    `).join('');
}

// 辅助工具：所有外部链接自动新窗口打开
function makeAllLinksOpenInNewTab() {
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// 监听动态内容变化，确保新加载的链接也支持新窗口打开
function setupLinkObserver() {
    const observer = new MutationObserver(() => makeAllLinksOpenInNewTab());
    observer.observe(document.body, { childList: true, subtree: true });
}
