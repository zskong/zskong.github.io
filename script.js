document.addEventListener('DOMContentLoaded', function() {
    // 初始化功能
    makeAllLinksOpenInNewTab();
    setupLinkObserver();

    // 1. 移动端菜单切换
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // 2. 加载所有数据
    loadPublications();
    loadNews();
    loadHonors();

    // 3. 平滑滚动逻辑
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href.startsWith('#')) {
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

    // 4. 滚动时更新导航栏高亮
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
            link.classList.remove('active');
            const linkTarget = link.getAttribute('href').replace('#', '');
            if (linkTarget === current || (current === 'homepage' && linkTarget === 'about')) {
                link.classList.add('active');
            }
        });
    });
});

/** * 加载论文逻辑 - 已修复 ID 不匹配和分类逻辑
 */
async function loadPublications() {
    let path = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/') 
               ? '../data/publications.json' 
               : 'data/publications.json';

    const containers = {
        journal: document.getElementById('journal-list'),
        conference: document.getElementById('conference-list'),
        preprint: document.getElementById('preprint-list')
    };

    if (!containers.journal && !containers.conference && !containers.preprint) return;

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('File not found');
        const pubs = await response.json();

        // 清空内容
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

        pubs.forEach(pub => {
            const target = containers[pub.type];
            if (!target) return;

            const html = `
                <div class="pub-item group relative pl-4 border-l-2 border-transparent hover:border-accent transition-all mb-8 text-justify">
                    <h4 class="text-base font-bold text-primary group-hover:text-accent transition-colors leading-snug">
                        ${pub.title}
                    </h4>
                    <p class="text-sm text-neutral-600 mt-1">${pub.authors}</p>
                    <div class="flex flex-wrap items-center gap-2 mt-2">
                        <span class="text-xs italic text-neutral-500">${pub.venue}, ${pub.year}</span>
                        ${pub.ccf ? `<span class="text-[9px] font-bold bg-red-50 text-red-600 border border-red-100 px-1 rounded">CCF-${pub.ccf}</span>` : ''}
                        ${pub.jcr ? `<span class="text-[9px] font-bold bg-amber-50 text-amber-600 border border-amber-200 px-1 rounded">JCR-${pub.jcr}</span>` : ''}
                    </div>
                    <div class="flex gap-2 mt-3">
                        ${pub.links?.pdf ? `<a href="${pub.links.pdf}" target="_blank" class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-all"><i class="fas fa-file-pdf mr-1"></i> PDF</a>` : ''}
                        ${pub.links?.code ? `<a href="${pub.links.code}" target="_blank" class="text-[10px] font-bold px-2 py-0.5 rounded bg-neutral-100 text-neutral-600 hover:bg-primary hover:text-white transition-all"><i class="fab fa-github mr-1"></i> Code</a>` : ''}
                    </div>
                </div>`;
            target.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) {
        console.error('Pub load error:', error);
    }
}

/** * 加载新闻逻辑 - 已修复 404 路径问题
 */
async function loadNews() {
    let path = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/') 
               ? '../data/news.json' : 'data/news.json';
    
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
        <div class="news-item flex gap-4 border-b border-dashed border-neutral-100 pb-3 mb-3 last:border-0">
            <span class="news-date font-mono text-accent text-sm whitespace-nowrap">${item.date}</span>
            <div class="news-content text-sm text-neutral-700">
                🎉 ${item.content}
                ${(item.links || []).map(l => `<a href="${l.url}" target="_blank" class="ml-2 text-accent hover:underline">[${l.text}]</a>`).join('')}
            </div>
        </div>
    `).join('');
}

/** * 加载荣誉逻辑
 */
async function loadHonors() {
    let path = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/') 
               ? '../data/honors.json' : 'data/honors.json';
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
        <div class="honor-item flex gap-6 mb-4 items-baseline">
            <div class="honor-year font-mono text-accent font-bold text-sm">${item.date}</div>
            <div class="honor-content">
                <h3 class="text-primary font-bold text-sm">${item.title}</h3>
                <p class="text-neutral-500 text-xs">${item.org}</p>
            </div>
        </div>
    `).join('');
}

// 辅助工具函数
function makeAllLinksOpenInNewTab() {
    document.querySelectorAll('a').forEach(link => {
        const href = link.getAttribute('href');
        if (href && !href.startsWith('#') && !href.startsWith('mailto:') && link.hostname !== window.location.hostname) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

function setupLinkObserver() {
    const observer = new MutationObserver(() => makeAllLinksOpenInNewTab());
    observer.observe(document.body, { childList: true, subtree: true });
}
