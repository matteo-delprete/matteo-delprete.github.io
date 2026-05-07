const map = {};
let firstLoad = true;
const PAGE_LOADERS = {
  physics: () => renderLibrary("physics"),
};
let transitionRunning = false;

/* BUILD MAP (all slugs) */
function buildMap(nodes) {
  nodes.forEach(node => {
    if (node.slug) {
      map[node.slug] = node;
    }
    if (node.children) {
      buildMap(node.children);
    }
  });
}

/* CONTEXTUAL SIDEBAR */
function buildContextMenu(slug) {
  const path = findPath(SITE, slug);
  if (!path) return;
  const current = path[path.length - 1];
  const parent = path[path.length - 2];
  let html = "";
  /* GO UP */
  if (path.length > 1) {
    html += `
      <div class="nav-up">
        <a href="?page=${parent.slug}">↑ ${parent.title}</a>
      </div>`;
  } else {
    html += `
      <div class="nav-up">
        <a href="index.html">↑ Home</a>
      </div>`;
  }
  /* CASE 1: current has children */
  if (current.children) {
    html += "<ul>";
    current.children.forEach(child => {
      if (child.slug) {
        html += `
          <li>
            <a href="?page=${child.slug}" data-slug="${child.slug}">
              ${child.title}
            </a>
          </li>`;
      } else {
        html += `<li>${child.title}</li>`;
      }
    });
    html += "</ul>";
  }
  /* CASE 2: leaf → show siblings */
  else if (parent && parent.children) {
    html += "<ul>";
    parent.children.forEach(sibling => {
      html += `
        <li>
          <a href="?page=${sibling.slug}" data-slug="${sibling.slug}">
            ${sibling.title}
          </a>
        </li>`;
    });
    html += "</ul>";
  }
  document.getElementById("sidebar").innerHTML = `<div class="sidebar-inner">${html}</div>`;
  highlightActive(slug);
}

function buildRootMenu() {
  let html = "<ul>";
  SITE.forEach(node => {
    if (node.slug) {
      html += `
        <li>
          <a href="?page=${node.slug}" data-slug="${node.slug}">
            ${node.title}
          </a>
        </li>`;
    } else {
      html += `<li>${node.title}</li>`;
    }
  });
  html += "</ul>";
  document.getElementById("sidebar").innerHTML = `<div class="sidebar-inner">${html}</div>`;
}

async function startTransition(callback) {
  if (transitionRunning) return;
  transitionRunning = true;
  const railTime = parseFloat(
    getComputedStyle(document.documentElement)
      .getPropertyValue("--transition-rail-time")
  );
  document.body.classList.add("is-transitioning");
  await new Promise(resolve =>
    setTimeout(resolve, railTime)
  );
  await callback();
  document.body.classList.remove("is-transitioning");
  transitionRunning = false;
}

/* LOAD PAGE FROM URL */
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("page");
  /* HOMEPAGE */
  if (!slug) {
    startTransition(async () => {
      const response = await fetch("pages/home.html");
      const html = await response.text();
      document.getElementById("main").innerHTML = html;
      document.getElementById("topbar").innerHTML =
        `<a href="index.html">Home</a>`;
      buildRootMenu();
      if (firstLoad) {
        requestAnimationFrame(() => {
          document.body.classList.remove("is-transitioning");
        });
        firstLoad = false;
      }
    });
    return;
  }
  /* INVALID PAGE */
  if (!map[slug]) return;
  const item = map[slug];
  startTransition(async () => {
    const response = await fetch(item.file);
    const html = await response.text();
    document.getElementById("main").innerHTML = html;
    updateBreadcrumb(slug);
    buildContextMenu(slug);
    if (PAGE_LOADERS[slug]) {
      PAGE_LOADERS[slug]();
    }
    if (firstLoad) {
      requestAnimationFrame(() => {
        document.body.classList.remove("is-transitioning");
      });
      firstLoad = false;
    }
  });
}

/* FIND PATH IN TREE */
function findPath(nodes, slug, path = []) {
  for (const node of nodes) {
    const newPath = [...path, node];
    if (node.slug === slug) return newPath;
    if (node.children) {
      const found = findPath(node.children, slug, newPath);
      if (found) return found;
    }
  }
  return null;
}

/* BREADCRUMB */
function updateBreadcrumb(slug) {
  const path = findPath(SITE, slug);
  if (!path) return;
  let html = `<a href="index.html">Home</a>`;
  path.forEach(node => {
    if (node.slug) {
      html += ` <span class="sep">›</span> <a href="?page=${node.slug}">${node.title}</a>`;
    } else {
      html += ` <span class="sep">›</span> ${node.title}`;
    }
  });
  document.getElementById("topbar").innerHTML = html;
}

/* ACTIVE LINK */
function highlightActive(slug) {
  document.querySelectorAll("#sidebar a").forEach(a => {
    a.classList.toggle("active", a.dataset.slug === slug);
  });
}

document.addEventListener("click", event => {
  const link = event.target.closest("a");
  if (!link) return;
  const href = link.getAttribute("href");
  if (!href) return;
  if (
    href.startsWith("?page=") ||
    href === "index.html"
  ) {
    event.preventDefault();
    navigate(href);
  }
});

window.addEventListener("popstate", () => {
  loadFromURL();
});

function navigate(url) {
  /* avoid useless reload */
  const current =
    window.location.pathname +
    window.location.search;
  if (
    url === current ||
    (
      url === "index.html" &&
      !window.location.search
    )
  ) {
    return;
  }
  history.pushState({}, "", url);
  loadFromURL();
}

/* INIT */
buildMap(SITE);
loadFromURL();
