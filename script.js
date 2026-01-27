document.addEventListener('DOMContentLoaded', function() {
    // Make all links open in a new tab
    makeAllLinksOpenInNewTab();

    // Set up MutationObserver to watch for dynamically added links
    setupLinkObserver();

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');
    
    if (mobileMenuBtn && mobileMenu) {
        mobileMenuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Close menu when a link is clicked
        const mobileLinks = mobileMenu.querySelectorAll('a');
        mobileLinks.forEach(link => {
            link.addEventListener('click', () => {
                mobileMenu.classList.add('hidden');
            });
        });
    }
    
    // Load publications data from JSON file
    loadPublications();
    
    // Smooth scrolling for navigation links
    const navLinks = document.querySelectorAll('.nav-links a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only apply smooth scrolling to hash links (internal page links)
            if (this.getAttribute('href').startsWith('#')) {
                e.preventDefault();
                
                const targetId = this.getAttribute('href');
                const targetSection = document.querySelector(targetId);
                
                if (targetSection) {
                    // Account for the sticky nav
                    const navHeight = document.querySelector('.top-nav').offsetHeight;
                    const targetPosition = targetSection.offsetTop - navHeight - 20;
                    
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                    
                    // Update active class
                    navLinks.forEach(l => l.classList.remove('active'));
                    this.classList.add('active');
                }
            }
        });
    });
    
    // Update active nav link on scroll
    window.addEventListener('scroll', function() {
        let current = '';
        const sections = document.querySelectorAll('section[id]');
        const navHeight = document.querySelector('.top-nav').offsetHeight;
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            if (pageYOffset >= sectionTop - navHeight - 100) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkTarget = link.getAttribute('href').substring(1);
            // Handle both homepage and about pointing to the same section
            if (linkTarget === current || 
                (current === 'homepage' && linkTarget === 'about') ||
                (current === 'about' && linkTarget === 'homepage')) {
                link.classList.add('active');
            }
        });
    });

    // Load news data
    let newsJsonPath = 'data/news.json';
    if (window.location.pathname.includes('/pages/')) {
        newsJsonPath = '../data/news.json';
    }
    
    fetch(newsJsonPath)
        .then(response => response.json())
        .then(data => {
            // Check if we're on the homepage
            const latestNewsSection = document.getElementById('latest-news');
            if (latestNewsSection) {
                // On homepage - show limited news (first 8 items)
                renderNewsItems(data.slice(0, 8), 'news-container');
            }
            
            // Check if we're on the all-news page
            const allNewsSection = document.getElementById('all-news');
            if (allNewsSection) {
                // On all-news page - show all news items
                renderNewsItems(data, 'all-news-container');
            }
        })
        .catch(error => {
            console.error('Error loading news data:', error);
        });
    
    // Load honors data
    let honorsJsonPath = 'data/honors.json';
    if (window.location.pathname.includes('/pages/')) {
        honorsJsonPath = '../data/honors.json';
    }
    
    fetch(honorsJsonPath)
        .then(response => response.json())
        .then(data => {
            // Check if we're on the homepage
            const honorsSection = document.getElementById('honors');
            if (honorsSection) {
                // On homepage - show limited honors (first 8 items)
                renderHonorsItems(data.slice(0, 8), 'honors-container');
            }
            
            // Check if we're on the all-honors page
            const allHonorsSection = document.getElementById('all-honors');
            if (allHonorsSection) {
                // On all-honors page - show all honors items
                renderHonorsItems(data, 'all-honors-container');
            }
        })
        .catch(error => {
            console.error('Error loading honors data:', error);
        });
});

// Function to load publications from JSON
function loadPublications() {
    let publicationsJsonPath = 'data/publications.json';
    if (window.location.pathname.includes('/pages/')) {
        publicationsJsonPath = '../data/publications.json';
    }

    const publicationsList = document.querySelector('.publications-list');
    if (!publicationsList) {
        console.warn('Publications list not found');
        return;
    }
    
    // Clear existing publications
    publicationsList.innerHTML = '';
    
    fetch(publicationsJsonPath)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(publications => {
            console.log('Loaded publications:', publications.length);
            
            // Filter publications to show on homepage based on showOnHomepage flag
            let pubsToShow = publications;
            
            // Sort by year descending (Preprints/Missing year at top)
            pubsToShow.sort((a, b) => {
                const yearA = a.year ? parseInt(a.year) : 9999;
                const yearB = b.year ? parseInt(b.year) : 9999;
                return yearB - yearA;
            });

            // Group by year
            const pubsByYear = {};
            pubsToShow.forEach(pub => {
                const year = pub.year || 'Preprint';
                if (!pubsByYear[year]) {
                    pubsByYear[year] = [];
                }
                pubsByYear[year].push(pub);
            });

            // Get sorted years
            const sortedYears = Object.keys(pubsByYear).sort((a, b) => {
                if (a === 'Preprint') return -1;
                if (b === 'Preprint') return 1;
                return b - a;
            });

            // Render groups
            sortedYears.forEach(year => {
                const yearGroup = document.createElement('div');
                yearGroup.className = 'pub-year-group';

                // Year Header
                const yearHeader = document.createElement('h3');
                yearHeader.className = 'pub-year-header';
                yearHeader.textContent = `-${year}-`;
                yearGroup.appendChild(yearHeader);

                // List
                const ul = document.createElement('ul');
                ul.className = 'pub-list-ul';

                pubsByYear[year].forEach(pub => {
                    const li = document.createElement('li');
                    li.className = 'pub-list-item';

                    // Wrapper for text content to allow side-by-side layout with thumbnail
                    const contentWrapper = document.createElement('div');
                    contentWrapper.className = 'pub-content-wrapper';

                    // --- Line 1: [Venue] Title ---
                    const line1 = document.createElement('div');
                    line1.className = 'pub-line-1';

                    // Venue Tag
                    const venueTagSpan = document.createElement('span');
                    const venueShort = getVenueShortName(pub.venue, pub.year);
                    venueTagSpan.textContent = `[${venueShort}]`;
                    venueTagSpan.className = 'pub-venue-tag';
                    if (venueShort.toLowerCase().includes('arxiv') || venueShort.toLowerCase().includes('preprint')) {
                        venueTagSpan.classList.add('tag-arxiv');
                    } else {
                        venueTagSpan.classList.add('tag-conference');
                    }
                    line1.appendChild(venueTagSpan);

                    // Title (Text only, no link on title itself)
                    const titleSpan = document.createElement('span');
                    titleSpan.className = 'pub-title-text';
                    titleSpan.textContent = pub.title;
                    line1.appendChild(titleSpan);
                    
                    // Paper/Code Buttons
                    if (pub.tags) {
                        pub.tags.forEach(tag => {
                            if (tag.link && tag.link !== '#') {
                                const btn = document.createElement('a');
                                btn.className = 'pub-link-btn';
                                btn.href = tag.link;
                                btn.target = '_blank';
                                
                                // Customize text/icon based on tag type
                                if (tag.text === 'Paper') {
                                    btn.textContent = 'PDF';
                                } else {
                                    btn.textContent = tag.text;
                                }
                                
                                line1.appendChild(btn);
                            }
                        });
                    }

                    // Thumbnail Preview Button (if thumbnail exists)
                    let thumbBox = null;
                    if (pub.thumbnail) {
                        const btnPreview = document.createElement('button');
                        btnPreview.className = 'pub-link-btn pub-btn-preview';
                        btnPreview.textContent = 'Image';
                        btnPreview.onclick = function() {
                            if (li.classList.contains('with-thumbnail-expanded')) {
                                li.classList.remove('with-thumbnail-expanded');
                                thumbBox.style.display = 'none';
                                btnPreview.classList.remove('active');
                            } else {
                                li.classList.add('with-thumbnail-expanded');
                                thumbBox.style.display = 'block';
                                btnPreview.classList.add('active');
                            }
                        };
                        line1.appendChild(btnPreview);

                        // Create thumbnail container
                        thumbBox = document.createElement('div');
                        thumbBox.className = 'pub-thumbnail-box';
                        thumbBox.style.display = 'none';
                        const thumbImg = document.createElement('img');
                        thumbImg.src = pub.thumbnail;
                        thumbImg.alt = 'Publication Thumbnail';
                        thumbBox.appendChild(thumbImg);
                    }
                    
                    contentWrapper.appendChild(line1);

                    // --- Line 2: Authors ---
                    const line2 = document.createElement('div');
                    line2.className = 'pub-line-2';
                    line2.innerHTML = pub.authors; // keep innerHTML for <strong>/<u>
                    contentWrapper.appendChild(line2);

                    // --- Line 3: Venue Details ---
                    const line3 = document.createElement('div');
                    line3.className = 'pub-line-3';
                    
                    // 1. Badge (Oral/Spotlight) - Red Box at start
                    let highlightText = pub.highlight || '';
                    let badgeText = '';
                    if (highlightText.toLowerCase().includes('oral')) badgeText = 'Oral';
                    else if (highlightText.toLowerCase().includes('spotlight')) badgeText = 'Spotlight';
                    
                    if (badgeText) {
                        const badge = document.createElement('span');
                        badge.className = 'pub-badge-highlight';
                        badge.textContent = badgeText;
                        line3.appendChild(badge);
                    }

                    // 2. Full Venue Name (No Year for Journals)
                    const fullVenueName = getVenueFullName(pub.venue, pub.year);
                    const venueNameSpan = document.createElement('span');
                    venueNameSpan.textContent = fullVenueName;
                    line3.appendChild(venueNameSpan);

                    // 3. CCF Rank
                    const ccfRank = getCCFRank(fullVenueName, pub.venue);
                    if (ccfRank) {
                        const rankSpan = document.createElement('span');
                        rankSpan.className = `ccf-rank ccf-${ccfRank.toLowerCase()}`;
                        rankSpan.textContent = `(CCF-${ccfRank})`;
                        line3.appendChild(rankSpan);
                    }

                    contentWrapper.appendChild(line3);
                    
                    // Append wrapper and thumbnail box to LI
                    li.appendChild(contentWrapper);
                    if (thumbBox) {
                        li.appendChild(thumbBox);
                    }

                    ul.appendChild(li);
                });

                yearGroup.appendChild(ul);
                publicationsList.appendChild(yearGroup);
            });
        })
        .catch(error => {
            console.error('Error loading publications data:', error);
            publicationsList.innerHTML = '<p>Failed to load publications. Please check the console for details.</p>';
        });
}

function getVenueShortName(venueStr, year) {
    if (!venueStr) return 'Preprint';
    
    // Remove year (4 digits at end or start)
    let s = venueStr.replace(/\d{4}/g, '').trim();
    let suffix = '';
    
    // Check if it is a conference that needs year suffix
    const conferences = ['NeurIPS', 'CVPR', 'ICCV', 'ECCV', 'ICRA', 'AAAI', 'GLOBECOM', 'INFOCOM', 'MOBICOM'];
    for (const conf of conferences) {
        if (s.includes(conf)) {
            // Get last two digits of year
            if (year) {
                const yearStr = year.toString();
                if (yearStr.length === 4) {
                    suffix = "'" + yearStr.substring(2);
                }
            }
            return conf + suffix;
        }
    }

    // Special cases
    if (s.toLowerCase().includes('arxiv')) return 'ArXiv'; // No year
    
    // Journals or specific conferences
    if (s.includes('TDSC')) return 'IEEE TDSC';
    if (s.includes('TMC')) return 'IEEE TMC';
    if (s.includes('JSAC')) return 'IEEE JSAC';
    if (s.includes('TGCN')) return 'IEEE TGCN';
    if (s.includes('LNET')) return 'IEEE LNET';
    if (s.includes('TNSE')) return 'IEEE TNSE';
    if (s.includes('IOTJ') || s.includes('IoTJ')) return 'IEEE IoTJ';

    return s;
}

function getVenueFullName(venueStr, year) {
    if (!venueStr) return '';
    let s = venueStr.replace(/\d{4}/g, '').trim(); // Remove year
    
    // Get year suffix for conferences
    let yearSuffix = '';
    if (year) {
        const yearStr = year.toString();
        if (yearStr.length === 4) {
            yearSuffix = "'" + yearStr.substring(2);
        }
    }

    // Journal Full Names Mapping (No Year)
    if (s.includes('TDSC')) return 'IEEE Transactions on Dependable and Secure Computing';
    if (s.includes('TMC')) return 'IEEE Transactions on Mobile Computing';
    if (s.includes('JSAC')) return 'IEEE Journal on Selected Areas in Communications';
    if (s.includes('TGCN')) return 'IEEE Transactions on Green Communications and Networking';
    if (s.includes('TNSE')) return 'IEEE Transactions on Network Science and Engineering';
    if (s.includes('IoTJ') || s.includes('IoTJ')) return 'IEEE Internet of Things Journal';
    if (s.includes('LNET') || s.includes('LNet')) return 'IEEE Networking Letters';
    
    // Conference Full Names Mapping (With Year Suffix)
    if (s.includes('NeurIPS')) return `Annual Conference on Neural Information Processing Systems (NeurIPS${yearSuffix})`;
    if (s.includes('CVPR')) return `IEEE/CVF Conference on Computer Vision and Pattern Recognition (CVPR${yearSuffix})`;
    if (s.includes('ICCV')) return `IEEE/CVF International Conference on Computer Vision (ICCV${yearSuffix})`;
    if (s.includes('ECCV')) return `European Conference on Computer Vision (ECCV${yearSuffix})`;
    if (s.includes('ICRA')) return `IEEE International Conference on Robotics and Automation (ICRA${yearSuffix})`;
    if (s.includes('AAAI')) return `AAAI Conference on Artificial Intelligence (AAAI${yearSuffix})`;
    if (s.includes('GLOBECOM')) return `IEEE Global Communications Conference (GLOBECOM${yearSuffix})`;
    if (s.includes('INFOCOM')) return `IEEE International Conference on Computer Communications (INFOCOM${yearSuffix})`;
    if (s.includes('MOBICOM')) return `Annual International Conference on Mobile Computing and Networking (MobiCom${yearSuffix})`;
    
    if (s.toLowerCase().includes('arxiv')) return 'arXiv preprint';
    
    return s;
}

function getCCFRank(fullName, originalVenue) {
    const v = (fullName + ' ' + originalVenue).toLowerCase();
    
    // CCF-A
    if (v.includes('tdsc') || v.includes('dependable and secure') || 
        v.includes('tmc') || v.includes('mobile computing') || 
        v.includes('aaai') || v.includes('neurips') || 
        v.includes('cvpr') || v.includes('iccv') || 
        v.includes('infocom') || v.includes('jsac')) {
        return 'A';
    }
    
    // CCF-B
    if (v.includes('icra')) {
        return 'B';
    }
    
    // CCF-C
    if (v.includes('globecom')) {
        return 'C';
    }
    
    return null;
}

// Function to render news items
function renderNewsItems(newsData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('News container not found:', containerId);
        return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Add each news item to the container
    newsData.forEach(newsItem => {
        const newsElement = document.createElement('div');
        newsElement.className = 'news-item';
        
        // Create the date element
        const dateElement = document.createElement('span');
        dateElement.className = 'news-date';
        dateElement.textContent = newsItem.date;
        
        // Create the content element
        const contentElement = document.createElement('div');
        contentElement.className = 'news-content';
        
        // Create emoji and content text
        const textSpan = document.createElement('span');
        textSpan.innerHTML = '🎉 ' + newsItem.content;
        contentElement.appendChild(textSpan);
        
        // Add links if provided in the links array format
        if (newsItem.links && newsItem.links.length > 0) {
            newsItem.links.forEach(link => {
                const space = document.createTextNode(' ');
                contentElement.appendChild(space);
                
                const linkElement = document.createElement('a');
                linkElement.href = link.url;
                linkElement.textContent = link.text;
                if (link.url && !link.url.startsWith('#')) {
                    linkElement.setAttribute('target', '_blank');
                }
                contentElement.appendChild(linkElement);
            });
        }
        
        // Check for old style link (backward compatibility)
        if (newsItem.link && newsItem.link !== '#' && (!newsItem.links || newsItem.links.length === 0)) {
            const space = document.createTextNode(' ');
            contentElement.appendChild(space);
            
            const linkElement = document.createElement('a');
            linkElement.href = newsItem.link;
            linkElement.textContent = '[Link]';
            linkElement.setAttribute('target', '_blank');
            contentElement.appendChild(linkElement);
        }
        
        newsElement.appendChild(dateElement);
        newsElement.appendChild(contentElement);
        container.appendChild(newsElement);
    });
}

// Function to render honors items
function renderHonorsItems(honorsData, containerId) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.warn('Honors container not found:', containerId);
        return;
    }
    
    // Clear any existing content
    container.innerHTML = '';
    
    // Add each honor item to the container
    honorsData.forEach(honor => {
        const honorElement = document.createElement('div');
        honorElement.className = 'honor-item';
        
        // Year
        const yearElement = document.createElement('div');
        yearElement.className = 'honor-year';
        yearElement.textContent = honor.date;
        
        // Content
        const contentElement = document.createElement('div');
        contentElement.className = 'honor-content';
        
        const titleElement = document.createElement('h3');
        titleElement.textContent = honor.title;
        
        const orgElement = document.createElement('p');
        orgElement.className = 'text-sm text-neutral-600';
        orgElement.textContent = honor.org;
        
        contentElement.appendChild(titleElement);
        contentElement.appendChild(orgElement);
        
        honorElement.appendChild(yearElement);
        honorElement.appendChild(contentElement);
        
        container.appendChild(honorElement);
    });
}

// Helper to open all external links in new tab
function makeAllLinksOpenInNewTab() {
    const links = document.querySelectorAll('a');
    links.forEach(link => {
        if (link.hostname !== window.location.hostname && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && !link.getAttribute('href').startsWith('mailto:')) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        }
    });
}

// Helper to setup MutationObserver for dynamically added links
function setupLinkObserver() {
    const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) { // Element node
                        if (node.tagName === 'A') {
                            if (node.hostname !== window.location.hostname && node.getAttribute('href') && !node.getAttribute('href').startsWith('#') && !node.getAttribute('href').startsWith('mailto:')) {
                                node.setAttribute('target', '_blank');
                                node.setAttribute('rel', 'noopener noreferrer');
                            }
                        }
                        // Check descendants
                        const links = node.querySelectorAll('a');
                        links.forEach(link => {
                            if (link.hostname !== window.location.hostname && link.getAttribute('href') && !link.getAttribute('href').startsWith('#') && !link.getAttribute('href').startsWith('mailto:')) {
                                link.setAttribute('target', '_blank');
                                link.setAttribute('rel', 'noopener noreferrer');
                            }
                        });
                    }
                });
            }
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });
}
