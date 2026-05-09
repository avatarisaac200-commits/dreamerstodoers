const facilitators = [
  {
    name: "Damilola Mogaji",
    image: "/facilitators/mogaji.jpg",
    bioFile: "/facilitators/bio4.md",
    tag: "7+ years of experience",
  },
  {
    name: "Temitayo Femi Matthew",
    image: "/facilitators/matthew.jpg",
    bioFile: "/facilitators/bio3.md",
    tag: "6+ years of experience",
  },
  {
    name: "Olufolake Zion Adegoke",
    image: "/facilitators/olufolake.jpeg",
    bioFile: "/facilitators/bio2.md",
    tag: "5+ years of experience",
  },
  {
    name: "Ifeoluwa Oyewole",
    image: "/facilitators/ifeoluwa.jpeg",
    bioFile: "/facilitators/bio1.md",
    tag: "10+ years of experience",
  },
];

let facilitatorImpactMap = new Map();
let facilitatorImpactError = false;

function normalizeKey(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function renderInlineMarkdown(text) {
  return escapeHtml(text).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
}

function renderBioMarkdown(markdown) {
  const normalized = markdown.replaceAll("\\*\\*", "**").trim();
  const blocks = normalized
    .split(/\r?\n\s*\r?\n/)
    .map((block) => block.trim())
    .filter(Boolean);

  return blocks
    .map((block) => {
      const lines = block
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);

      if (lines.every((line) => /^- /.test(line))) {
        const items = lines
          .map((line) => `<li>${renderInlineMarkdown(line.slice(2).trim())}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }

      return `<p>${renderInlineMarkdown(lines.join(" "))}</p>`;
    })
    .join("");
}

async function readBio(file) {
  try {
    const response = await fetch(file);
    if (!response.ok) return "";
    return await response.text();
  } catch {
    return "";
  }
}

async function loadImpactFootprints() {
  if (facilitatorImpactMap.size) return facilitatorImpactMap;

  try {
    const response = await fetch("/impact-footprints-data.json");
    if (!response.ok) throw new Error("Request failed");

    const data = await response.json();
    const items = Array.isArray(data.facilitators)
      ? data.facilitators
      : Array.isArray(data)
        ? data
        : [];
    facilitatorImpactMap = new Map(
      items
        .filter((item) => item && item.name)
        .map((item) => [normalizeKey(item.name), item])
    );
    facilitatorImpactError = false;
  } catch {
    facilitatorImpactMap = new Map();
    facilitatorImpactError = true;
  }

  return facilitatorImpactMap;
}

function renderImpactProjects(facilitatorName, impactMap = facilitatorImpactMap) {
  const facilitator = impactMap.get(normalizeKey(facilitatorName));
  if (facilitatorImpactError) {
    return '<div class="facilitator-impact-empty">Impact footprints could not be loaded right now. Please refresh and try again.</div>';
  }

  if (!facilitator || !Array.isArray(facilitator.projects) || !facilitator.projects.length) {
    return '<div class="facilitator-impact-empty">This facilitator\'s impact footprints will appear here soon.</div>';
  }

  return facilitator.projects
    .map((project) => {
      const images = Array.isArray(project.images)
        ? project.images
            .map(
              (image) => `
                <button class="facilitator-impact-thumb" type="button" data-facilitator-image="${image.src}" data-facilitator-alt="${escapeHtml(project.title)}">
                  <img src="${image.src}" alt="${escapeHtml(project.title)}">
                </button>
              `
            )
            .join("")
        : "";

      return `
        <section class="facilitator-impact-project">
          <h3 class="facilitator-impact-title">${escapeHtml(project.title)}</h3>
          <div class="facilitator-impact-gallery">${images}</div>
        </section>
      `;
    })
    .join("");
}

function setupFacilitatorBioToggles() {
  const grid = document.getElementById("facilitators-grid");
  if (!grid) return;

  grid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bio-toggle]");
    if (!button) return;

    const panelId = button.getAttribute("data-bio-toggle");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    const isOpen = button.getAttribute("aria-expanded") === "true";
    button.setAttribute("aria-expanded", String(!isOpen));
    button.textContent = isOpen ? "BIO" : "HIDE BIO";
    panel.hidden = isOpen;
  });
}

function setupFacilitatorLightbox() {
  const lightbox = document.getElementById("facilitator-lightbox");
  const image = document.getElementById("facilitator-lightbox-image");
  const closeButton = document.getElementById("facilitator-lightbox-close");
  const grid = document.getElementById("facilitators-grid");

  if (!lightbox || !image || !closeButton || !grid) return;

  let activeItems = [];
  let activeIndex = -1;

  const updateImage = () => {
    const item = activeItems[activeIndex];
    if (!item) return;

    image.src = item.getAttribute("data-facilitator-image") || "";
    image.alt = item.getAttribute("data-facilitator-alt") || "";
  };

  const open = (trigger) => {
    const gallery = trigger.closest(".facilitator-impact-gallery");
    activeItems = gallery ? Array.from(gallery.querySelectorAll("[data-facilitator-image]")) : [trigger];
    activeIndex = Math.max(activeItems.indexOf(trigger), 0);
    updateImage();
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
  };

  const close = () => {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    image.src = "";
    image.alt = "";
    activeItems = [];
    activeIndex = -1;
    document.body.style.overflow = "";
  };

  const showNext = () => {
    if (!activeItems.length) return;
    activeIndex = (activeIndex + 1) % activeItems.length;
    updateImage();
  };

  const showPrevious = () => {
    if (!activeItems.length) return;
    activeIndex = (activeIndex - 1 + activeItems.length) % activeItems.length;
    updateImage();
  };

  grid.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-facilitator-image]");
    if (!trigger) return;
    open(trigger);
  });

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("active")) return;

    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrevious();
  });
}

async function renderFacilitatorsPage() {
  const grid = document.getElementById("facilitators-grid");
  if (!grid) return;

  const [bios, impactMap] = await Promise.all([
    Promise.all(facilitators.map((item) => readBio(item.bioFile))),
    loadImpactFootprints(),
  ]);

  grid.innerHTML = facilitators
    .map((facilitator, index) => {
      const bio =
        renderBioMarkdown(bios[index]) ||
        "<p>Full profile details will be shared soon.</p>";
      const bioId = `facilitator-bio-${index + 1}`;
      const firstName = facilitator.name.split(" ")[0];

      return `
        <article class="facilitator-feature">
          <div class="facilitator-profile">
            <div class="facilitator-photo-shell">
              <div class="facilitator-photo facilitator-photo-large">
                <img src="${facilitator.image}" alt="${facilitator.name}">
              </div>
            </div>
            <div class="facilitator-profile-content">
              <div class="facilitator-profile-label">Facilitator Profile</div>
              <div class="facilitator-card-meta facilitator-card-meta-host">
                <div class="facilitator-card-name">${escapeHtml(facilitator.name)}</div>
                <div class="facilitator-card-tag">${escapeHtml(facilitator.tag)}</div>
              </div>
              <div class="facilitator-profile-actions">
                <button class="facilitator-bio-toggle" type="button" data-bio-toggle="${bioId}" aria-expanded="false">BIO</button>
              </div>
              <div class="facilitator-bio-panel" id="${bioId}" hidden>
                <div class="facilitator-bio">${bio}</div>
              </div>
            </div>
          </div>
          <div class="facilitator-impact-section facilitator-impact-section-host">
            <div class="section-tag">Impact Footprints</div>
            <h2 class="facilitator-impact-heading">Explore ${escapeHtml(firstName)}'s <em>impact footprints.</em></h2>
            <div class="facilitator-impact-list facilitator-impact-list-host">${renderImpactProjects(
              facilitator.name,
              impactMap
            )}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

document.addEventListener("DOMContentLoaded", async () => {
  await renderFacilitatorsPage();
  setupFacilitatorBioToggles();
  setupFacilitatorLightbox();
});
