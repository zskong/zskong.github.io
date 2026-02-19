document.addEventListener('DOMContentLoaded', function() {
    // 1. 初始化基础辅助功能
    makeAllLinksOpenInNewTab();
    setupLinkObserver();

    // 2. 移动端菜单切换逻辑
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));
        mobileMenu.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', () => mobileMenu.classList.add('hidden'));
        });
    }

    // 3. 异步加载数据
    loadPublications();
    loadNews();
    loadHonors();

    // 4. 导航栏平滑滚动
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

    // 5. 滚动监听：自动高亮当前导航项
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

    // 6. 监听点击弹窗外部半透明蒙层关闭弹窗
    const modal = document.getElementById('bibtex-modal');
    if(modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeBibtexModal();
            }
        });
    }
});

/**
 * ==========================================
 * 论文加载与渲染逻辑 (新增：图片与 TL;DR 简述)
 * ==========================================
 */
async function loadPublications() {
    const isSubPage = window.location.pathname.includes('/pages/') || window.location.pathname.includes('/docs/');
    const path = isSubPage ? '../data/publications.json' : 'data/publications.json';

    const containers = {
        journal: document.getElementById('journal-list'),
        conference: document.getElementById('conference-list'),
        preprint: document.getElementById('preprint-list')
    };

    if (!containers.journal && !containers.conference && !containers.preprint) return;

    const ccfStyles = {
        'A': 'bg-red-50 text-red-700 border-red-200/60',
        'B': 'bg-blue-50 text-blue-700 border-blue-200/60',
        'C': 'bg-green-50 text-green-700 border-green-200/60',
        'N': 'bg-neutral-50 text-neutral-700 border-neutral-200/60'
    };

    const typeBorderStyles = {
        journal: 'border-accent/40 hover:border-accent',
        conference: 'border-blue-400/40 hover:border-blue-500',
        preprint: 'border-slate-300 hover:border-slate-500'
    };

    try {
        const response = await fetch(path);
        if (!response.ok) throw new Error('Publications JSON not found');
        const pubs = await response.json();

        Object.values(containers).forEach(c => { if(c) c.innerHTML = ''; });

        // 🌟 注意这里加入了 index，用来给每个引用次数标签生成唯一的 ID
        pubs.forEach((pub, index) => {
            const target = containers[pub.type];
            if (!target) return;

            const ccfClass = pub.ccf ? (ccfStyles[pub.ccf] || ccfStyles['N']) : ccfStyles['N'];
            const borderClass = typeBorderStyles[pub.type] || typeBorderStyles['preprint'];
            
            // 🌟 强高亮样式：加粗 + 深色主色调 + 底部虚线下划线（更具学术感）
            const highlightStyle = 'font-bold text-primary underline decoration-neutral-400 underline-offset-4';
            
            const authorsHtml = pub.authors
                .replace('Zisen Kong', `<span class="${highlightStyle}">Zisen Kong</span>`)
                .replace('孔子森', `<span class="${highlightStyle}">孔子森</span>`);

            const safeBibtex = pub.bibtex ? pub.bibtex.replace(/"/g, '&quot;').replace(/>/g, '&gt;').replace(/</g, '&lt;') : 'No BibTeX provided for this publication.';
            const scholarLink = `https://scholar.google.com/scholar?q=${encodeURIComponent(pub.title)}`;

           // 🌟 1. 处理图片 (让图片支持全高拉伸 object-cover) 🌟
            const imageHtml = pub.image 
                ? `<div class="w-full sm:w-1/3 md:w-[32%] flex-shrink-0 flex">
                       <img src="${pub.image}" alt="Teaser" class="w-full h-52 sm:h-full object-cover rounded-xl shadow-md border border-neutral-200/80 hover:shadow-lg hover:scale-[1.02] transition-all duration-300 origin-center">
                   </div>` : '';

            // 🌟 2. 处理简述 🌟
            const descHtml = pub.description
                ? `<div class="mt-2 mb-3 bg-neutral-50 rounded-md p-2.5 border border-neutral-100/80">
                       <p class="text-[13px] text-neutral-600 text-justify leading-relaxed">
                           <span class="font-bold text-accent-dark mr-1">TL;DR:</span>${pub.description}
                       </p>
                   </div>` : '';

            const citeSpanId = `cite-count-${pub.type}-${index}`;

            // 🌟 3. 核心布局优化：加入 items-stretch 和 mt-auto 🌟
            const html = `
                <div class="pub-item relative pl-4 border-l-2 ${borderClass} transition-all duration-300 mb-8 group">
                    <div class="flex flex-col sm:flex-row gap-6 sm:gap-8 items-stretch">
                        
                        ${imageHtml}
                        
                        <div class="flex-1 min-w-0 flex flex-col py-1">
                            <h4 class="text-lg font-medium text-primary mb-1.5 leading-snug group-hover:text-accent transition-colors">
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
                                
                                <span class="text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 px-2 py-0.5 rounded shadow-sm flex items-center">
                                    <i class="fas fa-chart-line mr-1.5 opacity-80"></i>
                                    <span id="${citeSpanId}"><i class="fas fa-spinner fa-spin text-[10px]"></i></span>
                                </span>
                            </div>
                            
                            ${descHtml}
                            
                            <div class="flex flex-wrap gap-4 mt-auto pt-2">
                                ${pub.links?.pdf ? `<a href="${pub.links.pdf}" target="_blank" class="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center"><i class="fas fa-file-pdf mr-1.5"></i>PDF</a>` : ''}
                                ${pub.links?.code ? `<a href="${pub.links.code}" target="_blank" class="text-xs font-medium text-neutral-700 hover:text-primary transition-colors flex items-center"><i class="fab fa-github mr-1.5"></i>Code</a>` : ''}
                                ${pub.links?.project ? `<a href="${pub.links.project}" target="_blank" class="text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors flex items-center"><i class="fas fa-globe mr-1.5"></i>Project</a>` : ''}
                                
                                <button onclick="openBibtexModal(this)" data-bibtex="${safeBibtex}" class="text-xs font-medium text-accent hover:text-accent-dark transition-colors flex items-center cursor-pointer">
                                    <i class="fas fa-quote-right mr-1.5"></i>Cite
                                </button>
                                
                                <a href="${scholarLink}" target="_blank" class="text-xs font-medium text-indigo-500 hover:text-indigo-700 transition-colors flex items-center">
                                    <i class="fas fa-graduation-cap mr-1.5"></i>Scholar
                                </a>
                            </div>
                        </div>
                    </div>
                </div>`;
            target.insertAdjacentHTML('beforeend', html);

            // 🌟 异步拉取该文章的引用次数 🌟
            fetchCitationCount(pub.title, citeSpanId);
        });
    } catch (error) {
        console.error('Pub load error:', error);
    }
}
/**
 * ==========================================
 * BibTeX 弹窗控制与复制逻辑
 * ==========================================
 */
window.openBibtexModal = function(button) {
    const bibtex = button.getAttribute('data-bibtex');
    const modal = document.getElementById('bibtex-modal');
    const codeBlock = document.getElementById('bibtex-code');
    
    // 填充代码并显示弹窗
    if (codeBlock && modal) {
        codeBlock.innerHTML = bibtex;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
        
        // 禁用页面底层滚动
        document.body.style.overflow = 'hidden';
    }
}

window.closeBibtexModal = function() {
    const modal = document.getElementById('bibtex-modal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
        
        // 恢复页面底层滚动
        document.body.style.overflow = 'auto';
        
        // 还原复制按钮的状态
        const copyBtns = modal.querySelectorAll('.copy-text');
        copyBtns.forEach(btn => btn.innerText = 'Copy to Clipboard');
    }
}

window.copyBibtexFromModal = function(button) {
    const codeBlock = document.getElementById('bibtex-code');
    if (!codeBlock) return;
    
    const text = codeBlock.innerText;
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => {
            showModalCopiedFeedback(button);
        });
    } else {
        // Fallback 方法
        let textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
            document.execCommand('copy');
            showModalCopiedFeedback(button);
        } catch (err) {
            alert('Fallback copy failed, please select and copy manually.');
        }
        textArea.remove();
    }
}

function showModalCopiedFeedback(button) {
    const textSpan = button.querySelector('.copy-text');
    if(textSpan) {
        const originalText = "Copy to Clipboard";
        textSpan.innerText = 'Copied! ✓';
        button.classList.add('bg-green-600', 'hover:bg-green-700');
        button.classList.remove('bg-primary', 'hover:bg-neutral-800');
        
        setTimeout(() => {
            textSpan.innerText = originalText;
            button.classList.remove('bg-green-600', 'hover:bg-green-700');
            button.classList.add('bg-primary', 'hover:bg-neutral-800');
        }, 2000);
    }
}

/**
 * ==========================================
 * 加载新闻与荣誉逻辑
 * ==========================================
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

/**
 * ==========================================
 * 辅助工具函数
 * ==========================================
 */
// 所有外部链接自动新窗口打开
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


/**
 * 🌟 新增：调用 Semantic Scholar API 获取引用次数
 */
async function fetchCitationCount(title, elementId) {
    try {
        // 对标题进行编码，拼接 API 请求
        const query = encodeURIComponent(title);
        // Semantic Scholar free API endpoint
        const url = `https://api.semanticscholar.org/graph/v1/paper/search?query=${query}&fields=citationCount&limit=1`;
        
        const response = await fetch(url);
        const data = await response.json();
        
        const el = document.getElementById(elementId);
        if (!el) return;

        // 如果找到了文章且有 citationCount 数据
        if (data.data && data.data.length > 0 && data.data[0].citationCount !== undefined) {
            const count = data.data[0].citationCount;
            el.innerHTML = `${count} Citations`;
        } else {
            // 没找到则默认显示 0 或者隐藏
            el.innerHTML = `0 Citations`; 
        }
    } catch (error) {
        console.error('Failed to fetch citation count for:', title, error);
        const el = document.getElementById(elementId);
        if (el) el.innerHTML = `Citations`; // 拉取失败时优雅降级
    }
}
