/* Page-specific setup shared by the static HTML pages. */
(function () {
  "use strict";

  var gallery = document.getElementById("gallery");
  if (!gallery || !window.PHOTOS || !window.Site) return;

  var filters = document.getElementById("filters");
  var countEl = document.getElementById("count");

  if (!filters) {
    Site.renderTiles(gallery, window.PHOTOS.slice(0, 6));
    return;
  }

  var activeCat = "全部";
  var fromHash = decodeURIComponent((location.hash || "").replace(/^#/, ""));
  if (window.CATEGORIES.indexOf(fromHash) > -1) activeCat = fromHash;

  filters.innerHTML = window.CATEGORIES.map(function (cat) {
    return '<button class="chip" type="button" data-cat="' + window.escHtml(cat) + '" aria-pressed="' +
      (cat === activeCat ? "true" : "false") + '">' + window.escHtml(cat) + "</button>";
  }).join("");

  function applyFilter() {
    var visible = activeCat === "全部"
      ? window.PHOTOS.slice()
      : window.PHOTOS.filter(function (photo) { return photo.cat === activeCat; });
    Site.renderTiles(gallery, visible);
    if (countEl) countEl.textContent = visible.length + " 张作品";
  }

  filters.addEventListener("click", function (e) {
    var button = e.target.closest(".chip");
    if (!button) return;
    activeCat = button.getAttribute("data-cat");
    Array.prototype.forEach.call(filters.querySelectorAll(".chip"), function (chip) {
      chip.setAttribute("aria-pressed", chip === button ? "true" : "false");
    });
    applyFilter();
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, "", "#" + encodeURIComponent(activeCat));
    }
  });

  applyFilter();
})();
