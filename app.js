const map = {};

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
  const parent  = path[path.length - 2];
  let html = "";
  /* GO UP */
  if (path.length > 1) {
    const parent = path[path.length - 2];
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
  document.getElementById("sidebar").innerHTML = html;
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
  document.getElementById("sidebar").innerHTML = html;
}

/* LOAD PAGE FROM URL */
function loadFromURL() {
  const params = new URLSearchParams(window.location.search);
  const slug = params.get("page");
  /* HOMEPAGE */
  if (!slug) {
    document.getElementById("topbar").innerHTML =
      `<a href="index.html">Home</a>`;
      buildRootMenu();
    return;
  }
  if (!map[slug]) return;
  const item = map[slug];
  fetch(item.file)
    .then(r => r.text())
    .then(html => {
      document.getElementById("main").innerHTML = html;
      updateBreadcrumb(slug);
      buildContextMenu(slug);
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

/* INIT */
buildMap(SITE);
loadFromURL();
