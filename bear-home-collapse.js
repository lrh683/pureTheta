/* Homepage fold: keep <details> open so Chrome Find is not skipped.
   Visual fold = data-collapsed + hidden="until-found". beforematch expands. */
(function () {
  var KEY = "bear-home-collapse-v1";

  function read() {
    try {
      var raw = localStorage.getItem(KEY);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      var next = {};
      for (var k in parsed) if (Object.prototype.hasOwnProperty.call(parsed, k) && parsed[k] === true) next[k] = true;
      return next;
    } catch (e) {
      return {};
    }
  }

  function write(map) {
    try {
      localStorage.setItem(KEY, JSON.stringify(map));
    } catch (e) {
      /* ignore quota / private mode */
    }
  }

  function rootEl() {
    return document.querySelector(".bear-posts");
  }

  function apply(root, map) {
    root.querySelectorAll("details[data-collapse-key]").forEach(function (d) {
      var k = d.getAttribute("data-collapse-key");
      var folded = map[k] === true;
      if (folded) d.setAttribute("data-collapsed", "");
      else d.removeAttribute("data-collapsed");
      d.open = true;
      var sum = d.querySelector(":scope > summary");
      if (sum) sum.setAttribute("aria-expanded", folded ? "false" : "true");
    });
    root.querySelectorAll(".bear-post").forEach(function (p) {
      var pin = p.closest(".bear-pinned");
      var vis = true;
      if (pin) vis = !pin.hasAttribute("data-collapsed");
      else {
        var year = p.closest(".bear-year-block");
        var month = p.closest(".bear-month-block");
        if (year && year.hasAttribute("data-collapsed")) vis = false;
        if (month && month.hasAttribute("data-collapsed")) vis = false;
      }
      if (vis) p.removeAttribute("hidden");
      else p.setAttribute("hidden", "until-found");
    });
  }

  function keepOpen(ev) {
    var t = ev.target;
    if (!t || !t.matches || !t.matches(".bear-posts details[data-collapse-key]")) return;
    t.open = true;
  }

  function onClick(ev) {
    var t = ev.target;
    if (!(t instanceof Element)) return;
    var sum = t.closest("summary");
    if (!sum) return;
    var details = sum.parentElement;
    if (!details || !details.matches || !details.matches(".bear-posts details[data-collapse-key]")) return;
    ev.preventDefault();
    details.open = true;
    if (window.__BEAR_REACT_COLLAPSE) return;
    var k = details.getAttribute("data-collapse-key");
    if (!k) return;
    var map = read();
    if (map[k]) delete map[k];
    else map[k] = true;
    write(map);
    var root = rootEl();
    if (root) apply(root, map);
  }

  function onBeforeMatch(ev) {
    var el = ev.target;
    if (!(el instanceof HTMLElement)) return;
    var root = rootEl();
    if (!root || !root.contains(el)) return;
    var map = read();
    var node = el;
    var changed = false;
    while (node && node !== root) {
      var k = node.getAttribute && node.getAttribute("data-collapse-key");
      if (k && map[k]) {
        delete map[k];
        changed = true;
      }
      node = node.parentElement;
    }
    if (changed) write(map);
    apply(root, map);
    var hit = el.closest(".bear-post") || el;
    hit.scrollIntoView({ block: "center" });
    hit.classList.add("is-find-hit");
    window.setTimeout(function () {
      hit.classList.remove("is-find-hit");
    }, 1600);
    if (typeof window.__BEAR_SYNC_COLLAPSE === "function") window.__BEAR_SYNC_COLLAPSE(map);
  }

  document.addEventListener("toggle", keepOpen, true);
  document.addEventListener("click", onClick, true);
  document.addEventListener("beforematch", onBeforeMatch, true);

  function restoreIfNoReact() {
    window.setTimeout(function () {
      if (window.__BEAR_REACT_COLLAPSE) return;
      var root = rootEl();
      if (root) apply(root, read());
    }, 80);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", restoreIfNoReact);
  else restoreIfNoReact();
})();
