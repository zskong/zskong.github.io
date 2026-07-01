document.addEventListener("DOMContentLoaded", () => {
  setupMobileMenu();
  setupSmoothNavigation();
  setupBibtexModal();
  setCurrentYear();

  loadPublications();
  loadNews();
  loadHonors();
  loadVisitorMap();
});

function isSubPage() {
  return window.location.pathname.includes("/docs/");
}

function dataPath(fileName) {
  return isSubPage() ? `../data/${fileName}` : `data/${fileName}`;
}

function setupMobileMenu() {
  const button = document.querySelector(".mobile-menu-btn");
  const menu = document.getElementById("mobile-menu");
  if (!button || !menu) return;

  button.addEventListener("click", () => menu.classList.toggle("hidden"));
  menu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => menu.classList.add("hidden"));
  });
}

function setupSmoothNavigation() {
  const navLinks = document.querySelectorAll(".nav-links a, .mobile-nav-item");
  const topNav = document.querySelector(".top-nav");

  navLinks.forEach((link) => {
    link.addEventListener("click", (event) => {
      const href = link.getAttribute("href");
      if (!href || !href.startsWith("#")) return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();
      const offset = topNav ? topNav.offsetHeight + 20 : 80;
      window.scrollTo({
        top: target.offsetTop - offset,
        behavior: "smooth",
      });
    });
  });

  window.addEventListener("scroll", () => {
    let current = "";
    const navHeight = topNav ? topNav.offsetHeight : 80;
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    document.querySelectorAll("section[id]").forEach((section) => {
      if (scrollTop >= section.offsetTop - navHeight - 100) {
        current = section.getAttribute("id");
      }
    });

    navLinks.forEach((link) => {
      const target = (link.getAttribute("href") || "").replace("#", "");
      link.classList.toggle("active", target === current || (current === "homepage" && target === "about"));
      link.classList.toggle("text-accent", target === current || (current === "homepage" && target === "about"));
    });
  });
}

async function fetchJson(fileName) {
  const response = await fetch(dataPath(fileName), { cache: "no-store" });
  if (!response.ok) throw new Error(`Failed to load ${fileName}`);
  return response.json();
}

async function loadPublications() {
  const legacyFeaturedContainer = document.getElementById("featured-publications");
  const legacyCompactContainer = document.getElementById("compact-publications");
  const journalFeaturedContainer = document.getElementById("journal-featured-publications");
  const journalCompactContainer = document.getElementById("journal-compact-publications");
  const conferenceContainer = document.getElementById("conference-publications");
  const allPublicationsContainer = document.querySelector(".publications-list");

  if (!legacyFeaturedContainer && !journalFeaturedContainer && !allPublicationsContainer) return;

  try {
    const publications = await fetchJson("publications.json");

    if (allPublicationsContainer) {
      allPublicationsContainer.innerHTML = publications.map(renderCompactPublication).join("");
      return;
    }

    const journals = publications.filter((pub) => pub.type === "journal");
    const conferences = publications.filter((pub) => pub.type === "conference");
    const featuredJournals = journals.slice(0, 4);
    const compactJournals = journals.slice(4);

    if (journalFeaturedContainer) {
      journalFeaturedContainer.innerHTML = featuredJournals.length
        ? featuredJournals.map(renderFeaturedPublication).join("")
        : `<p class="text-sm text-neutral-400 italic">Journal articles will be added soon.</p>`;
    }

    if (journalCompactContainer) {
      journalCompactContainer.innerHTML = compactJournals.length
        ? compactJournals.map(renderCompactPublication).join("")
        : "";
    }

    if (conferenceContainer) {
      conferenceContainer.innerHTML = conferences.length
        ? conferences.map(renderCompactPublication).join("")
        : `<p class="text-sm text-neutral-400 italic">Conference papers will be added soon.</p>`;
    }

    if (legacyFeaturedContainer) {
      legacyFeaturedContainer.innerHTML = publications.slice(0, 4).map(renderFeaturedPublication).join("");
    }

    if (legacyCompactContainer) {
      legacyCompactContainer.innerHTML = publications.slice(4).map(renderCompactPublication).join("");
    }
  } catch (error) {
    console.error(error);
    const message = `<p class="text-sm text-red-500">Publications could not be loaded.</p>`;
    if (journalFeaturedContainer) journalFeaturedContainer.innerHTML = message;
    if (conferenceContainer) conferenceContainer.innerHTML = "";
    if (legacyFeaturedContainer) legacyFeaturedContainer.innerHTML = message;
    if (legacyCompactContainer) legacyCompactContainer.innerHTML = "";
    if (allPublicationsContainer) allPublicationsContainer.innerHTML = message;
  }
}

function renderFeaturedPublication(pub) {
  const safeBibtex = escapeAttribute(pub.bibtex || "No BibTeX provided.");
  const image = pub.image || "assets/publication/25_PR.png";
  const authors = highlightAuthor(pub.authors || "");
  const venueClass = getVenueClass(pub);
  const ccfClass = getCcfClass(pub);
  const jcrClass = pub.jcr ? `tag-jcr-${String(pub.jcr).toLowerCase()}` : "";

  return `
    <article class="publication-card">
      <div class="publication-image-wrap">
        <img src="${image}" alt="${escapeAttribute(pub.title)}" loading="lazy">
      </div>
      <div class="publication-body">
        <div class="publication-meta">
          <span class="tag-venue ${venueClass}">${pub.venue || "Publication"}</span>
          <span class="tag-year">${pub.year || ""}</span>
          ${pub.ccf ? `<span class="${ccfClass}">CCF-${pub.ccf}</span>` : ""}
          ${pub.jcr ? `<span class="${jcrClass}">${pub.jcr}</span>` : ""}
        </div>
        <h3>${pub.title}</h3>
        <p class="publication-authors">${authors}</p>
        ${pub.description ? `<p class="publication-description"><strong>TL;DR:</strong> ${pub.description}</p>` : ""}
        ${renderPublicationLinks(pub, safeBibtex)}
      </div>
    </article>
  `;
}

function renderCompactPublication(pub) {
  const safeBibtex = escapeAttribute(pub.bibtex || "No BibTeX provided.");
  const authors = highlightAuthor(pub.authors || "");
  const venueClass = getVenueClass(pub);
  const ccfClass = getCcfClass(pub);
  const jcrClass = pub.jcr ? `tag-jcr-${String(pub.jcr).toLowerCase()}` : "";

  return `
    <article class="compact-publication">
      <div>
        <h4>${pub.title}</h4>
        <p>${authors}</p>
        <div class="publication-meta compact-publication-meta">
          <span class="tag-venue ${venueClass}">${pub.venue || "Publication"}</span>
          ${pub.year ? `<span class="tag-year">${pub.year}</span>` : ""}
          ${pub.ccf ? `<span class="${ccfClass}">CCF-${pub.ccf}</span>` : ""}
          ${pub.jcr ? `<span class="${jcrClass}">${pub.jcr}</span>` : ""}
        </div>
      </div>
      ${renderPublicationLinks(pub, safeBibtex)}
    </article>
  `;
}

function renderPublicationLinks(pub, safeBibtex) {
  const pdfHref = pub.links && pub.links.pdf ? pub.links.pdf : "#";
  const codeHref = pub.links && pub.links.code ? pub.links.code : "#";
  const pdfClass = pdfHref === "#" ? "is-placeholder" : "";
  const codeClass = codeHref === "#" ? "is-placeholder" : "";

  return `
    <div class="publication-links">
      <a class="${pdfClass}" href="${pdfHref}" target="_blank" rel="noopener">Paper</a>
      <a class="${codeClass}" href="${codeHref}" target="_blank" rel="noopener">Code</a>
      <button type="button" onclick="openBibtexModal(this)" data-bibtex="${safeBibtex}">Cite</button>
    </div>
  `;
}

function highlightAuthor(authors) {
  return authors
    .replaceAll("Zisen Kong", '<strong class="author-highlight">Zisen Kong</strong>')
    .replaceAll("孔子森", '<strong class="author-highlight">孔子森</strong>');
}

async function loadNews() {
  const container = document.getElementById("news-container");
  const allNewsContainer = document.getElementById("all-news-container") || document.querySelector(".news-list");
  if (!container && !allNewsContainer) return;

  try {
    const news = await fetchJson("news.json");
    const target = container || allNewsContainer;
    const list = container ? news.slice(0, 5) : news;
    target.innerHTML = list.map(renderNewsItem).join("");
  } catch (error) {
    console.error(error);
    if (container) container.innerHTML = `<p class="text-sm text-red-500">News could not be loaded.</p>`;
  }
}

function renderNewsItem(item) {
  return `
    <article class="news-card news-timeline-item bg-white rounded-lg border border-neutral-100 p-4">
      <time class="news-timeline-date">${item.date || ""}</time>
      <p class="news-timeline-content">${item.content || item.title || ""}</p>
    </article>
  `;
}

function getVenueClass(pub) {
  const ccf = String(pub.ccf || "").toUpperCase();

  if (pub.type === "journal") {
    if (ccf === "A") return "tag-journal-ccf-a";
    if (ccf === "B") return "tag-journal-ccf-b";
    if (ccf === "C") return "tag-journal-ccf-c";
    return "tag-journal-default";
  }

  if (pub.type === "conference") {
    return ccf === "A" ? "tag-conference-ccf-a" : "tag-conference-default";
  }

  return "tag-journal-default";
}

function getCcfClass(pub) {
  const ccf = String(pub.ccf || "").toUpperCase();

  if (pub.type === "conference") {
    return ccf === "A" ? "tag-ccf-A" : "tag-ccf-neutral";
  }

  if (ccf === "A") return "tag-ccf-A";
  if (ccf === "B") return "tag-ccf-B";
  if (ccf === "C") return "tag-ccf-C";
  return "tag-ccf-neutral";
}

async function loadHonors() {
  const container = document.getElementById("honors-container");
  const allHonorsContainer = document.getElementById("all-honors-container") || document.querySelector(".honors-list");
  if (!container && !allHonorsContainer) return;

  try {
    const honors = await fetchJson("honors.json");
    const target = container || allHonorsContainer;
    const list = container ? honors.slice(0, 5) : honors;
    target.innerHTML = list.map(renderHonorItem).join("");
  } catch (error) {
    console.error(error);
    if (container) container.innerHTML = `<p class="text-sm text-red-500">Honors could not be loaded.</p>`;
  }
}

function renderHonorItem(item) {
  return `
    <article class="news-card bg-white rounded-lg border border-neutral-100 p-4">
      <time class="news-timeline-date">${item.year || item.date || ""}</time>
      <p class="news-timeline-content">${item.title || item.content || ""}</p>
      ${item.org ? `<p class="honor-org">${item.org}</p>` : ""}
    </article>
  `;
}

function loadVisitorMap() {
  const placeholder = document.getElementById("map-placeholder");
  if (!placeholder) return;

  const container = placeholder.parentElement;
  const timeout = window.setTimeout(() => {
    if (placeholder.isConnected) {
      placeholder.textContent = "Visitor map is loading slowly. The page is ready.";
    }
  }, 3500);

  window.setTimeout(() => {
    const script = document.createElement("script");
    script.id = "mapmyvisitors";
    script.async = true;
    script.src = "https://mapmyvisitors.com/map.js?d=1DzCfkA1F4yW7jaoyRuPPz6cSHEuqTGArcxwmwOrAAI&cl=ffffff&w=a";

    script.addEventListener("load", () => {
      window.clearTimeout(timeout);
      if (placeholder.isConnected) placeholder.remove();
    });

    script.addEventListener("error", () => {
      window.clearTimeout(timeout);
      placeholder.innerHTML = `<a href="https://mapmyvisitors.com/" target="_blank" rel="noopener">Visitor map unavailable. Open map service.</a>`;
    });

    container.appendChild(script);
  }, 800);
}

function setupBibtexModal() {
  const modal = document.getElementById("bibtex-modal");
  if (!modal) return;

  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeBibtexModal();
  });
}

window.openBibtexModal = function openBibtexModal(button) {
  const modal = document.getElementById("bibtex-modal");
  const codeBlock = document.getElementById("bibtex-code");
  if (!modal || !codeBlock) return;

  codeBlock.textContent = button.getAttribute("data-bibtex") || "No BibTeX provided.";
  modal.classList.remove("hidden");
  modal.classList.add("flex");
  document.body.style.overflow = "hidden";
};

window.closeBibtexModal = function closeBibtexModal() {
  const modal = document.getElementById("bibtex-modal");
  if (!modal) return;

  modal.classList.add("hidden");
  modal.classList.remove("flex");
  document.body.style.overflow = "";
  modal.querySelectorAll(".copy-text").forEach((item) => {
    item.textContent = "Copy to Clipboard";
  });
};

window.copyBibtexFromModal = async function copyBibtexFromModal(button) {
  const codeBlock = document.getElementById("bibtex-code");
  if (!codeBlock) return;

  const text = codeBlock.textContent || "";
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    showModalCopiedFeedback(button);
  } catch (error) {
    console.error(error);
    alert("Copy failed. Please select the BibTeX text manually.");
  }
};

function showModalCopiedFeedback(button) {
  const text = button.querySelector(".copy-text");
  if (!text) return;
  text.textContent = "Copied";
  window.setTimeout(() => {
    text.textContent = "Copy to Clipboard";
  }, 1800);
}

function setCurrentYear() {
  const year = document.getElementById("current-year");
  if (year) year.textContent = new Date().getFullYear();
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}
