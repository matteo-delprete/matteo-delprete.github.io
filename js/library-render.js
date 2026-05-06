function renderLibrary(category){
  const container = document.getElementByID("library-container");
  const items = LIBRARY.filter(item => item.category === category);
  let html = "";
  items.forEach(item => {
    html += `
      <div class="library-item">
        <a href="${item.file}" target="_blank">${item.title}</a>
        <div class="library-meta">${item.date} - ${item.size}</div>
        <div class="library-authors">${item.authors.join(", ")}</div>ù
        <div class="library-desc">${item.description}</div>
      </div>
    `;
  });
  container.innerHTML = html;
}
