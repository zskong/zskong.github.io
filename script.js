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
 * 加载论文逻辑 - 美化版带 Cite 按钮
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

    // CCF 颜色配置映射 (用于 Venue 标签背景)
    const ccfStyles = {
        'A': 'bg-red-50 text-red-700 border-red-200/60',
        'B': 'bg-blue-50 text-blue-700 border-blue-200/60',
        'C': 'bg-green-50 text-green-700 border-green-200/60',
        'N': 'bg-neutral-50 text-neutral-700 border-neutral-200/60'
    };

    // 不同类别的侧边框交互颜色
    const typeBorderStyles = {
        journal: 'border-accent/40 hover:border-accent',
        conference: 'border-blue-400/40 hover:border-blue-500',
        preprint: 'border-slate-300 hover:border-slate-500'
    };

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Publications JSON not found');
        const pubs = await response.json();

        // 清空容器，移除 loading 提示
        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

        pubs.forEach(pub => {
            const target = containers[pub.type];
            if (!target) return;

            // 获取对应的样式
            const ccfClass = pub.ccf ? (ccfStyles[pub.ccf] || ccfStyles['N']) : ccfStyles['N'];
            const borderClass = typeBorderStyles[pub.type] || typeBorderStyles['preprint'];
            
            // 自动加粗自己的名字 (注意中英文字符的匹配)
            const authorsHtml = pub.authors
                .replace('Zisen Kong', '<strong>Zisen Kong</strong>')
                .replace('孔子森', '<strong>孔子森</strong>');

            // 如果没有配置 bibtex 字段，提供一个默认的占位提示
            const bibtexContent = pub.bibtex ? pub.bibtex.replace(/'/g, "&apos;").replace(/"/g, "&quot;") : `No BibTeX available for: ${pub.title}`;

            const html = `
                <div class="pub-item relative pl-4 border-l-2 ${borderClass} transition-all duration-300 mb-6">
                    <h4 class="text-lg font-medium text-primary mb-1.5 leading-snug">
                        ${pub.title}
                    </h4>
                    <p class="text-sm text-neutral-600 mb-2.5 font-light">${authorsHtml}</p>
                    
                    <div class="flex flex-wrap items-center gap-2 mb-3">
                        <span class="text-[11px] font-bold ${ccfClass} border px-2.5 py-0.5 rounded shadow-sm ${pub.type === 'journal' ? 'italic' : ''}">
                            ${pub.venue} ${pub.ccf ? `(CCF-${pub.ccf})` : ''}
                        </span>
                        <span class="text-[11px] font-medium bg-neutral-100 text-neutral-600 border border-neutral-200 px-2 py-0.5 rounded">
                            ${pub.year}
                        </span>
                        ${pub.jcr ? `<span class="text-[11px] font-bold bg-amber-50 text-amber-600 border border-amber-200/60 px-2.5 py-0.5 rounded shadow-sm">JCR-${pub.jcr}</span>` : ''}
                    </div>
                    
                    <div class="flex flex-wrap gap-4 mt-2">
                        ${pub.links?.pdf ? `<a href="${pub.links.pdf}" target="_blank" class="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"><i class="fas fa-file-pdf mr-1.5"></i>PDF</a>` : ''}
                        ${pub.links?.code ? `<a href="${pub.links.code}" target="_blank" class="text-xs font-medium text-neutral-700 hover:text-primary transition-colors flex items-center"><i class="fab fa-github mr-1.5"></i>Code</a>` : ''}
                        ${pub.links?.project ? `<a href="${pub.links.project}" target="_blank" class="text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"><i class="fas fa-globe mr-1.5"></i>Project</a>` : ''}
                        
                        <button onclick="copyBibtex(this, '${bibtexContent}')" class="text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center cursor-pointer">
                            <i class="fas fa-quote-right mr-1.5"></i><span class="cite-text">Cite</span>
                        </button>
                    </div>
                </div>`;
            target.insertAdjacentHTML('beforeend', html);
        });
    } catch (error) {
        console.error('Pub load error:', error);
    }
}

/**
 * 复制 BibTeX 逻辑 (用于 Cite 按钮)
 */
window.copyBibtex = function(button, text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showCopiedFeedback(button);
        });
    } else {
        // Fallback for older browsers or local files without https
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        textArea.style.top = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showCopiedFeedback(button);
        } catch (err) {
            alert('BibTeX:\n\n' + text);
        }
        textArea.remove();
    }
}

function showCopiedFeedback(button) {
    const textSpan = button.querySelector('.cite-text');
    if(textSpan) {
        const originalText = textSpan.innerText;
        textSpan.innerText = 'Copied!';
        button.classList.add('text-green-600');
        button.classList.remove('text-accent');
        
        setTimeout(() => {
            textSpan.innerText = originalText;
            button.classList.remove('text-green-600');
            button.classList.add('text-accent');
        }, 2000);
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
