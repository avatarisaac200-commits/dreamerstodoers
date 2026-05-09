const WHATSAPP_NUMBER = "2349162057661";
const WHATSAPP_GROUP_URL =
  "https://chat.whatsapp.com/Bym2VLFK3P4EwvmInZT6Cf?mode=gi_t";

const facilitators = [
  {
    name: "Damilola Mogaji",
    image: "/facilitators/mogaji.jpg",
    bioFile: "/facilitators/bio4.md",
  },
  {
    name: "Temitayo Femi Matthew",
    image: "/facilitators/matthew.jpg",
    bioFile: "/facilitators/bio3.md",
  },
  {
    name: "Olufolake Zion Adegoke",
    image: "/facilitators/olufolake.jpeg",
    bioFile: "/facilitators/bio2.md",
  },
  {
    name: "Ifeoluwa Oyewole",
    image: "/facilitators/ifeoluwa.jpeg",
    bioFile: "/facilitators/bio1.md",
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
    const response = await fetch("/api/impact-footprints");
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
                <a class="facilitator-impact-thumb" href="${image.src}" target="_blank" rel="noopener noreferrer" aria-label="Open ${escapeHtml(project.title)} image">
                  <img src="${image.src}" alt="${escapeHtml(project.title)}">
                </a>
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

async function injectFacilitators() {
  const registerSection = document.getElementById("register");
  if (!registerSection) return;

  const [bios, impactMap] = await Promise.all([
    Promise.all(facilitators.map((item) => readBio(item.bioFile))),
    loadImpactFootprints(),
  ]);

  const cards = facilitators
    .map((facilitator, index) => {
      const bio = renderBioMarkdown(bios[index]) || "<p>Bio coming soon.</p>";

      return `
        <article class="facilitator-card facilitator-card-expanded">
          <div class="facilitator-photo">
            <img src="${facilitator.image}" alt="${facilitator.name}">
          </div>
          <div class="facilitator-card-body">
            <div class="facilitator-card-meta">
              <div class="facilitator-card-name">${escapeHtml(facilitator.name)}</div>
            </div>
            <div class="facilitator-bio">${bio}</div>
            <div class="facilitator-impact-block">
              <div class="facilitator-impact-label">Impact Footprint</div>
              <div class="facilitator-impact-list">${renderImpactProjects(
                facilitator.name,
                impactMap
              )}</div>
            </div>
          </div>
        </article>
      `;
    })
    .join("");

  const section = document.createElement("section");
  section.id = "facilitators";
  section.innerHTML = `
    <div class="section-tag">08 - Facilitators</div>
    <h2 class="section-title">Meet the <em>facilitators.</em></h2>
    <p class="section-lead">A lineup of facilitators bringing real-world perspectives across leadership, public health, execution, and impact-driven work.</p>
    <div class="facilitators-grid facilitators-grid-expanded">${cards}</div>
  `;

  registerSection.parentNode.insertBefore(section, registerSection);
}

function setText(selector, value) {
  const node = document.querySelector(selector);
  if (node) node.textContent = value;
}

function updateStaticContent() {
  setText(".hero-meta", "Dreamers to Doers - June 2026");
  setText(".countdown-label", "Masterclass Starts In");

  const terminalValues = document.querySelectorAll(".cl-val");
  if (terminalValues[1]) terminalValues[1].textContent = "June 19 - 21, 2026";
  if (terminalValues[2]) terminalValues[2].textContent = "7:00 PM - 10:00 PM WAT";

  document.querySelectorAll(".day-date").forEach((node) => {
    node.textContent = node.textContent.replace("6:00 PM", "7:00 PM");
  });

  const dayThreeTitle = document.querySelectorAll(".day-title")[2];
  if (dayThreeTitle) {
    dayThreeTitle.innerHTML = "Open Questions and Answer Session - <em>Clarity &amp; Real Conversations</em>";
  }

  const timeTitle = document.querySelectorAll(".section-title")[2];
  if (timeTitle) {
    timeTitle.innerHTML = "Clear your calendar. <em>June 19 - 21, 2026.</em>";
  }

  const timeCells = document.querySelectorAll(".time-cell");
  if (timeCells[0]) {
    const value = timeCells[0].querySelector(".time-cell-value");
    if (value) value.innerHTML = "<em>19th - 21st</em><br>June 2026";
  }
  if (timeCells[1]) {
    const value = timeCells[1].querySelector(".time-cell-value");
    const meta = timeCells[1].querySelector(".time-cell-meta");
    if (value) value.innerHTML = "<em>7:00 PM - 10:00 PM</em><br>WAT - Daily";
    if (meta) meta.textContent = "3 hours per day - West African Time";
  }

  const problemStamp = document.querySelector(".problem-stamp");
  if (problemStamp) {
    problemStamp.textContent =
      "The masterclass that delivers the blueprint for turning ideas to impact";
  }

  const pricingLead = document.querySelector("#pricing .section-lead");
  if (pricingLead) pricingLead.remove();

  const earlyTag = document.querySelector(".early-tag");
  if (earlyTag) earlyTag.textContent = "Special Early Bird Rate LIVE";

  const hostSection = document.getElementById("host");
  if (hostSection) {
    const tag = hostSection.querySelector(".section-tag");
    if (tag) tag.textContent = "07 - Host";
    const heading = hostSection.querySelector(".section-title");
    if (heading) heading.innerHTML = "Meet the <em>Host.</em>";
    const lead = hostSection.querySelector(".section-lead");
    if (lead) lead.remove();
  }

  document.querySelectorAll("a").forEach((link) => {
    if (link.href.includes("t.me/+yourtelegramlink")) {
      link.href = WHATSAPP_GROUP_URL;
      link.textContent = "Join Waitlist";
      link.target = "_blank";
    }
  });

  const footerBottom = document.querySelector(".footer-bottom div");
  if (footerBottom) {
    footerBottom.textContent = "Copyright 2026 Dreamers to Doers";
  }
}

function setupCountdown() {
  const target = new Date("2026-06-19T19:00:00+01:00").getTime();
  const dEl = document.getElementById("cd-d");
  const hEl = document.getElementById("cd-h");
  const mEl = document.getElementById("cd-m");
  const sEl = document.getElementById("cd-s");
  const separators = document.querySelectorAll(".c-sep");

  function pad(n) {
    return (n < 10 ? "0" : "") + n;
  }

  function tick() {
    let diff = Math.max(0, target - Date.now());
    const d = Math.floor(diff / 86400000);
    diff %= 86400000;
    const h = Math.floor(diff / 3600000);
    diff %= 3600000;
    const m = Math.floor(diff / 60000);
    diff %= 60000;
    const s = Math.floor(diff / 1000);
    if (dEl) dEl.textContent = pad(d);
    if (hEl) hEl.textContent = pad(h);
    if (mEl) mEl.textContent = pad(m);
    if (sEl) sEl.textContent = pad(s);
    separators.forEach((separator) => {
      separator.style.opacity = s % 2 === 0 ? "0.72" : "0.3";
    });
  }

  tick();
  window.setInterval(tick, 1000);
}

function setupScrollReveal() {
  const groups = [
    ".stats .stat-item",
    ".problem-wrap > *",
    "#curriculum .section-tag, #curriculum .section-title, #curriculum .section-lead, #curriculum .day-card",
    ".time-band .time-cell, .countdown-row",
    "#who .section-tag, #who .section-title, #who .section-lead, #who .who-card",
    ".why-wrap .section-tag, .why-wrap .section-title, .why-wrap .section-lead, .why-item",
    ".outcomes-grid .outcome-cell, .outcomes-grid + *",
    "#host .section-tag, #host .section-title, #host img, #host p, #host [style*='Funding Mobilised'], #host [style*='Years Focused Delivery'], #host [style*='Anna Ajibade'], #host [style*='Strategy and Execution Lead']",
    "#register .form-left > *, #register .form-card",
    "footer .footer-inner > *, footer .footer-bottom > *"
  ];

  const uniqueNodes = new Set();
  groups.forEach((selector) => {
    document.querySelectorAll(selector).forEach((node) => {
      if (node.closest(".hero")) return;
      uniqueNodes.add(node);
    });
  });

  const nodes = Array.from(uniqueNodes);
  if (!nodes.length) return;

  nodes.forEach((node) => {
    node.classList.add("reveal-on-scroll");
  });

  if (!("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    {
      threshold: window.innerWidth < 640 ? 0.08 : 0.14,
      rootMargin: window.innerWidth < 640 ? "0px 0px -6% 0px" : "0px 0px -10% 0px",
    }
  );

  groups.forEach((selector) => {
    const groupNodes = Array.from(document.querySelectorAll(selector)).filter(
      (node) => !node.closest(".hero")
    );
    groupNodes.forEach((node, index) => {
      node.style.transitionDelay = `${Math.min(index, 5) * 70}ms`;
      observer.observe(node);
    });
  });
}

function setupSuccessOverlay() {
  const successCard = document.querySelector(".success-card");
  if (successCard && !successCard.querySelector(".success-close")) {
    const button = document.createElement("button");
    button.className = "success-close";
    button.type = "button";
    button.setAttribute("aria-label", "Close");
    button.textContent = "X";
    button.addEventListener("click", () => {
      document.getElementById("success-overlay")?.classList.remove("active");
      document.body.style.overflow = "";
    });
    successCard.prepend(button);
  }

  const redirectText = document.querySelector(".redirect-bar span");
  if (redirectText) redirectText.textContent = "Redirecting you to the WhatsApp group";

  const manual = document.querySelector(".manual-link");
  if (manual) {
    manual.innerHTML = `Not redirected? <a href="${WHATSAPP_GROUP_URL}" target="_blank">Click here to join the WhatsApp group</a>.`;
  }
}

function setupFormHandler() {
  window.handleSubmit = function handleSubmit() {
    const first = document.getElementById("f-first").value.trim();
    const last = document.getElementById("f-last").value.trim();
    const email = document.getElementById("f-email").value.trim();
    const phone = document.getElementById("f-phone").value.trim();
    const cat = document.getElementById("f-category").value;
    const country = document.getElementById("f-country").value.trim();

    if (!first || !email || !cat) {
      alert("Please fill in your name, email, and category.");
      return;
    }

    const message = [
      "Hello Anna, I want to register for the Dreamers to Doers masterclass.",
      "",
      `First Name: ${first}`,
      `Last Name: ${last || "Not provided"}`,
      `Email: ${email}`,
      `WhatsApp Number: ${phone || "Not provided"}`,
      `Category: ${cat}`,
      `Country: ${country || "Not provided"}`,
    ].join("\n");

    const overlay = document.getElementById("success-overlay");
    if (overlay) overlay.classList.add("active");
    document.body.style.overflow = "hidden";

    window.setTimeout(() => {
      window.location.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
        message
      )}`;
    }, 1500);
  };
}

document.addEventListener("DOMContentLoaded", async () => {
  updateStaticContent();
  await injectFacilitators();
  setupCountdown();
  setupScrollReveal();
  setupSuccessOverlay();
  setupFormHandler();
});
