function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderProject(project) {
  if (!project.images.length) {
    return `
      <section class="covener-impact-project">
        <h3 class="covener-impact-project-title">${escapeHtml(project.title)}</h3>
        <div class="covener-impact-empty">Add JPG or JPEG images to this folder and they will appear here.</div>
      </section>
    `;
  }

  return `
    <section class="covener-impact-project">
      <h3 class="covener-impact-project-title">${escapeHtml(project.title)}</h3>
      <div class="covener-impact-gallery">
        ${project.images
          .map(
            (image) => `
              <button class="covener-impact-gallery-item" type="button" data-covener-impact-image="${image.src}" data-covener-impact-alt="${escapeHtml(project.title)}">
                <img src="${image.src}" alt="${escapeHtml(project.title)}">
              </button>
            `
          )
          .join("")}
      </div>
    </section>
  `;
}

function setupCovenerImpactLightbox() {
  const lightbox = document.getElementById("covener-impact-lightbox");
  const image = document.getElementById("covener-impact-lightbox-image");
  const closeButton = document.getElementById("covener-impact-lightbox-close");

  if (!lightbox || !image || !closeButton) return;

  let activeItems = [];
  let activeIndex = -1;
  let touchStartX = 0;
  let touchStartY = 0;

  const updateImage = () => {
    const item = activeItems[activeIndex];
    if (!item) return;

    image.src = item.getAttribute("data-covener-impact-image") || "";
    image.alt = item.getAttribute("data-covener-impact-alt") || "";
  };

  const open = (trigger) => {
    const gallery = trigger.closest(".covener-impact-gallery");
    activeItems = gallery ? Array.from(gallery.querySelectorAll("[data-covener-impact-image]")) : [trigger];
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
    const trigger = event.target.closest("[data-covener-impact-image]");
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

async function loadCovenerImpactFootprints() {
  const container = document.getElementById("covener-impact-list");
  if (!container) return;

  try {
    const response = await fetch("/impact-footprints-data.json");
    if (!response.ok) {
      throw new Error("Request failed");
    }

    const data = await response.json();
    const convener = data.covener;

    if (!convener || !Array.isArray(convener.projects)) {
      throw new Error("Invalid response");
    }

    container.innerHTML = convener.projects.map(renderProject).join("");
  } catch {
    container.innerHTML =
      '<div class="covener-impact-error">Host impact footprints could not be loaded right now. Please try again shortly.</div>';
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  setupCovenerImpactLightbox();
  await loadCovenerImpactFootprints();
});
