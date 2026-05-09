function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderProject(project) {
  const images = project.images
    .map(
      (image) => `
        <button class="impact-gallery-item" type="button" data-impact-image="${image.src}" data-impact-alt="${escapeHtml(project.title)}">
          <img src="${image.src}" alt="${escapeHtml(project.title)}">
        </button>
      `
    )
    .join("");

  return `
    <section class="impact-project">
      <h3 class="impact-project-title">${escapeHtml(project.title)}</h3>
      <div class="impact-gallery">${images}</div>
    </section>
  `;
}

function setupImpactLightbox() {
  const lightbox = document.getElementById("impact-lightbox");
  const image = document.getElementById("impact-lightbox-image");
  const closeButton = document.getElementById("impact-lightbox-close");

  if (!lightbox || !image || !closeButton) return;

  let activeItems = [];
  let activeIndex = -1;
  let touchStartX = 0;
  let touchStartY = 0;

  const updateImage = () => {
    const item = activeItems[activeIndex];
    if (!item) return;

    image.src = item.getAttribute("data-impact-image") || "";
    image.alt = item.getAttribute("data-impact-alt") || "";
  };

  const open = (trigger) => {
    const gallery = trigger.closest(".impact-gallery");
    activeItems = gallery ? Array.from(gallery.querySelectorAll("[data-impact-image]")) : [trigger];
    activeIndex = Math.max(activeItems.indexOf(trigger), 0);
    updateImage();
    lightbox.classList.add("active");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
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

  const close = () => {
    lightbox.classList.remove("active");
    lightbox.setAttribute("aria-hidden", "true");
    image.src = "";
    image.alt = "";
    activeItems = [];
    activeIndex = -1;
    document.body.style.overflow = "";
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-impact-image]");
    if (!trigger) return;

    open(trigger);
  });

  closeButton.addEventListener("click", close);
  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) close();
  });

  lightbox.addEventListener("touchstart", (event) => {
    const touch = event.changedTouches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
  }, { passive: true });

  lightbox.addEventListener("touchend", (event) => {
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) return;

    if (deltaX < 0) {
      showNext();
    } else {
      showPrevious();
    }
  }, { passive: true });

  document.addEventListener("keydown", (event) => {
    if (!lightbox.classList.contains("active")) return;

    if (event.key === "Escape") close();
    if (event.key === "ArrowRight") showNext();
    if (event.key === "ArrowLeft") showPrevious();
  });
}

function renderFacilitator(facilitator) {
  const highlight = facilitator.highlight
    ? `<div class="impact-highlight">${escapeHtml(facilitator.highlight)}</div>`
    : "";

  const content = facilitator.projects.length
    ? `<div class="impact-projects">${facilitator.projects.map(renderProject).join("")}</div>`
    : `<div class="impact-empty">Impact images for this facilitator will appear here as soon as the corresponding folders are added.</div>`;

  return `
    <article class="impact-card">
      <div class="impact-photo">
        <img src="${facilitator.image}" alt="${escapeHtml(facilitator.name)}">
      </div>
      <div>
        <h2 class="impact-name">${escapeHtml(facilitator.name)}</h2>
        ${highlight}
        ${content}
      </div>
    </article>
  `;
}

async function loadImpactFootprints() {
  const container = document.getElementById("impact-list");
  if (!container) return;

  try {
    const response = await fetch("/impact-footprints-data.json");
    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    const facilitators = Array.isArray(data.facilitators) ? data.facilitators : [];

    container.innerHTML = facilitators.map(renderFacilitator).join("");
  } catch {
    container.innerHTML =
      '<div class="impact-error">Impact footprints could not be loaded right now. Please try again shortly.</div>';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setupImpactLightbox();
  await loadImpactFootprints();
});
