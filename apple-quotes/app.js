/* ============================================================
   AppleQuotes — interactive logic
   ============================================================ */

(() => {
  "use strict";

  /* ---------- State ---------- */
  const state = {
    quotes: [],
    authors: [],
    activeAuthors: new Set(),   // empty = all
    searchTerm: "",
    points: [],                 // 3D points bound to quotes
    rotation: { x: 0.15, y: 0.45 },
    targetRotation: { x: 0.15, y: 0.45 },
    velocity: { x: 0, y: 0 },
    dragging: false,
    dragStart: null,
    autoRotate: true,
    lastInteraction: 0,
    hovered: null,
    dpr: Math.max(1, window.devicePixelRatio || 1),
  };

  /* ---------- DOM ---------- */
  const $q = (sel) => document.querySelector(sel);
  const $qa = (sel) => Array.from(document.querySelectorAll(sel));

  const nav = $q("#nav");
  const canvas = $q("#cloudCanvas");
  const ctx = canvas.getContext("2d");
  const tooltip = $q("#cloudTooltip");
  const stage = $q("#cloudStage");
  const filterBtn = $q("#filterBtn");
  const filterPanel = $q("#filterPanel");
  const filterList = $q("#filterList");
  const filterCount = $q("#filterCount");
  const filterAll = $q("#filterAll");
  const filterNone = $q("#filterNone");
  const searchInput = $q("#searchInput");
  const searchClear = $q("#searchClear");
  const cloudEmpty = $q("#cloudEmpty");
  const cloudEmptyReset = $q("#cloudEmptyReset");
  const cloudHud = $q("#cloudHud");
  const hudLabel = $q("#hudLabel");
  const authorsGrid = $q("#authorsGrid");
  const browseList = $q("#browseList");
  const modal = $q("#quoteModal");
  const modalText = $q("#modalText");
  const modalAuthor = $q("#modalAuthor");
  const modalRole = $q("#modalRole");
  const modalSource = $q("#modalSource");
  const modalTags = $q("#modalTags");
  const quoteCount = $q("#quoteCount");
  const authorCount = $q("#authorCount");

  /* ---------- Load data ---------- */
  async function loadData() {
    const [q, a] = await Promise.all([
      fetch("data/quotes.json").then((r) => r.json()),
      fetch("data/authors.json").then((r) => r.json()),
    ]);
    state.quotes = q;
    state.authors = a.authors;
    state.activeAuthors = new Set(state.authors.map((a) => a.id));
    quoteCount.textContent = state.quotes.length;
    authorCount.textContent = state.authors.length;
    init();
  }

  /* ---------- Init ---------- */
  function init() {
    buildPointCloud();
    buildAuthorFilter();
    buildAuthorsGrid();
    buildBrowse();
    bindEvents();
    resizeCanvas();
    requestAnimationFrame(loop);
  }

  /* ---------- Point cloud geometry ---------- */
  function buildPointCloud() {
    // Use a soft Fibonacci sphere distribution so each quote is a "star" in the cloud.
    const n = state.quotes.length;
    const points = [];
    const phi = Math.PI * (3 - Math.sqrt(5));
    for (let i = 0; i < n; i++) {
      const y = 1 - (i / Math.max(1, n - 1)) * 2;       // y from 1 to -1
      const radius = Math.sqrt(1 - y * y);
      const theta = phi * i;
      const x = Math.cos(theta) * radius;
      const z = Math.sin(theta) * radius;
      // Scale into 3D space, slight per-point variation
      const R = 280 + (Math.random() - 0.5) * 60;
      const q = state.quotes[i];
      points.push({
        id: q.id,
        quote: q,
        x: x * R,
        y: y * R,
        z: z * R,
        // size based on quote length (longer = larger), clamped
        size: 3 + Math.min(7, Math.sqrt(q.text.length) * 0.4),
        // author colour
        color: colorForAuthor(q.author),
      });
    }
    state.points = points;
  }

  // Stable colour per author
  const authorColorMap = new Map();
  function colorForAuthor(name) {
    if (authorColorMap.has(name)) return authorColorMap.get(name);
    // Curated Apple-ish palette per author
    const palette = {
      "Steve Jobs": "#1d1d1f",
      "Tim Cook": "#0066cc",
      "Steve Wozniak": "#af52de",
      "Jony Ive": "#ff9500",
      "Phil Schiller": "#ff3b30",
      "Eddy Cue": "#34c759",
      "Craig Federighi": "#5856d6",
      "Susan Kare": "#ffcc00",
      "Bill Atkinson": "#00c7be",
      "Jef Raskin": "#a2845e",
      "John Sculley": "#8e8e93",
      "Deirdre O'Brien": "#ff2d55",
    };
    const c = palette[name] || "#86868b";
    authorColorMap.set(name, c);
    return c;
  }

  /* ---------- Render loop ---------- */
  function loop(t) {
    // Auto-rotation
    const idle = performance.now() - state.lastInteraction > 2500;
    if (state.autoRotate && idle && !state.dragging && !state.hovered) {
      state.targetRotation.y += 0.0015;
    }

    // Smooth toward target
    state.rotation.x += (state.targetRotation.x - state.rotation.x) * 0.12;
    state.rotation.y += (state.targetRotation.y - state.rotation.y) * 0.12;

    drawCloud();
    requestAnimationFrame(loop);
  }

  function project(p) {
    // Rotate around Y, then X
    const { x, y, z } = p;
    const cy = Math.cos(state.rotation.y), sy = Math.sin(state.rotation.y);
    let x1 = x * cy + z * sy;
    let z1 = -x * sy + z * cy;
    const cx = Math.cos(state.rotation.x), sx = Math.sin(state.rotation.x);
    let y1 = y * cx - z1 * sx;
    const z2 = y * sx + z1 * cx;
    // Perspective
    const focal = 700;
    const k = focal / (focal + z2);
    return { x: x1 * k, y: y1 * k, z: z2, k };
  }

  function drawCloud() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0, 0, w, h);

    // Subtle radial glow
    const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.6);
    grad.addColorStop(0, "rgba(0, 102, 204, 0.05)");
    grad.addColorStop(1, "rgba(0, 0, 0, 0)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    // Filter visible points
    const visible = state.points.filter(isPointVisible);

    // Project and sort by depth
    const projected = visible.map((p) => {
      const pr = project(p);
      return { p, pr };
    }).sort((a, b) => b.pr.z - a.pr.z); // far first

    // Draw lines between nearby points (very subtle "constellation" effect)
    drawConstellation(projected, cx, cy);

    // Draw points
    for (const { p, pr } of projected) {
      const sx = cx + pr.x;
      const sy = cy + pr.y;
      const r = Math.max(0.5, p.size * pr.k);
      const isHovered = state.hovered === p.id;
      const dimmed = isSearchActive() && !matchesSearch(p.quote);

      ctx.globalAlpha = dimmed ? 0.12 : 1;
      ctx.beginPath();
      ctx.fillStyle = p.color;
      ctx.arc(sx, sy, r, 0, Math.PI * 2);
      ctx.fill();

      if (isHovered) {
        ctx.beginPath();
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 2;
        ctx.arc(sx, sy, r + 6, 0, Math.PI * 2);
        ctx.stroke();
      }

      // For the very front-most points, show a small label
      if (pr.z > 150 && (isHovered || pr.k > 0.95)) {
        ctx.globalAlpha = dimmed ? 0.1 : (isHovered ? 1 : 0.55);
        ctx.fillStyle = "#1d1d1f";
        ctx.font = `${isHovered ? "500" : "400"} ${isHovered ? 13 : 11}px "Inter", -apple-system, sans-serif`;
        ctx.textAlign = "center";
        ctx.textBaseline = "top";
        const short = shortText(p.quote.text);
        ctx.fillText(short, sx, sy + r + 6);
      }
    }
    ctx.globalAlpha = 1;

    // Show empty state
    cloudEmpty.hidden = visible.length > 0;
  }

  function drawConstellation(projected, cx, cy) {
    // Connect each point to its 1-2 nearest visible neighbours within range.
    const maxDist = 80;
    ctx.lineWidth = 0.5;
    for (let i = 0; i < projected.length; i++) {
      const a = projected[i];
      if (a.pr.k < 0.85) continue;
      for (let j = i + 1; j < projected.length; j++) {
        const b = projected[j];
        if (b.pr.k < 0.85) continue;
        const dx = (cx + a.pr.x) - (cx + b.pr.x);
        const dy = (cy + a.pr.y) - (cy + b.pr.y);
        const d = Math.hypot(dx, dy);
        if (d < maxDist) {
          ctx.globalAlpha = (1 - d / maxDist) * 0.18;
          ctx.strokeStyle = "#86868b";
          ctx.beginPath();
          ctx.moveTo(cx + a.pr.x, cy + a.pr.y);
          ctx.lineTo(cx + b.pr.x, cy + b.pr.y);
          ctx.stroke();
        }
      }
    }
    ctx.globalAlpha = 1;
  }

  function shortText(t) {
    const max = 38;
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + "…";
  }

  /* ---------- Hit test ---------- */
  function pointAt(mx, my) {
    let best = null;
    let bestDist = Infinity;
    for (const p of state.points) {
      if (!isPointVisible(p)) continue;
      const pr = project(p);
      const sx = canvas.clientWidth / 2 + pr.x;
      const sy = canvas.clientHeight / 2 + pr.y;
      const r = Math.max(6, p.size * pr.k + 4);
      const d = Math.hypot(mx - sx, my - sy);
      if (d < r && d < bestDist) {
        bestDist = d;
        best = p;
      }
    }
    return best;
  }

  /* ---------- Visibility (filter + search) ---------- */
  function isSearchActive() {
    return state.searchTerm.length > 0 || state.activeAuthors.size !== state.authors.length;
  }

  function authorIdFor(name) {
    const a = state.authors.find((x) => x.name === name);
    return a ? a.id : null;
  }

  function isPointVisible(p) {
    const aid = authorIdFor(p.quote.author);
    if (aid && !state.activeAuthors.has(aid)) return false;
    if (state.searchTerm && !matchesSearch(p.quote)) return false;
    return true;
  }

  function matchesSearch(q) {
    if (!state.searchTerm) return true;
    const term = state.searchTerm.toLowerCase();
    if (q.text.toLowerCase().includes(term)) return true;
    if (q.author.toLowerCase().includes(term)) return true;
    if ((q.source || "").toLowerCase().includes(term)) return true;
    if ((q.tags || []).some((t) => t.toLowerCase().includes(term))) return true;
    return false;
  }

  /* ---------- Author filter UI ---------- */
  function buildAuthorFilter() {
    filterList.innerHTML = "";
    state.authors.forEach((a) => {
      const li = document.createElement("li");
      li.className = "filter-item";
      li.innerHTML = `
        <input type="checkbox" data-id="${a.id}" checked />
        <span class="filter-item-name">${a.name}</span>
        <span class="filter-item-count">${a.quoteCount}</span>
      `;
      li.addEventListener("click", (e) => {
        if (e.target.tagName !== "INPUT") {
          const input = li.querySelector("input");
          input.checked = !input.checked;
        }
        syncAuthorFilter();
      });
      filterList.appendChild(li);
    });
    updateFilterCount();
  }

  function syncAuthorFilter() {
    state.activeAuthors = new Set(
      $qa("#filterList input:checked").map((i) => i.dataset.id)
    );
    updateFilterCount();
  }

  function updateFilterCount() {
    const total = state.authors.length;
    const n = state.activeAuthors.size;
    filterCount.textContent = n === total ? "All" : `${n} / ${total}`;
  }

  function setAllAuthors(on) {
    $qa("#filterList input").forEach((i) => (i.checked = on));
    syncAuthorFilter();
  }

  /* ---------- Authors grid ---------- */
  function buildAuthorsGrid() {
    authorsGrid.innerHTML = "";
    state.authors.forEach((a) => {
      const card = document.createElement("div");
      card.className = "author-card";
      const initials = a.name.split(" ").map((p) => p[0]).join("").slice(0, 2);
      card.innerHTML = `
        <div class="author-avatar" style="background:${colorForAuthor(a.name)}">${initials}</div>
        <h3 class="author-name">${a.name}</h3>
        <p class="author-role">${a.role}</p>
        <p class="author-bio">${a.bio}</p>
        <span class="author-stat">${a.quoteCount} quotes</span>
      `;
      card.addEventListener("click", () => {
        // Set the filter to this single author and scroll to cloud
        setAllAuthors(false);
        const input = $qa(`#filterList input`).find((i) => i.dataset.id === a.id);
        if (input) {
          input.checked = true;
          syncAuthorFilter();
        }
        document.getElementById("cloud").scrollIntoView({ behavior: "smooth" });
      });
      authorsGrid.appendChild(card);
    });
  }

  /* ---------- Browse list ---------- */
  function buildBrowse() {
    renderBrowseList("year-desc");
  }

  function renderBrowseList(sort) {
    const items = [...state.quotes];
    switch (sort) {
      case "year-desc":
        items.sort((a, b) => (b.year || 0) - (a.year || 0));
        break;
      case "year-asc":
        items.sort((a, b) => (a.year || 0) - (b.year || 0));
        break;
      case "author":
        items.sort((a, b) => a.author.localeCompare(b.author));
        break;
      case "length-desc":
        items.sort((a, b) => b.text.length - a.text.length);
        break;
    }
    browseList.innerHTML = "";
    for (const q of items) {
      const card = document.createElement("div");
      card.className = "quote-card";
      card.innerHTML = `
        <p class="quote-text">${escapeHtml(q.text)}</p>
        <div class="quote-meta">
          <div>
            <span class="quote-author">${escapeHtml(q.author)}</span>
            <span class="quote-source">· ${escapeHtml(q.source || "")}</span>
          </div>
          <span class="quote-year">${q.year || ""}</span>
        </div>
      `;
      card.addEventListener("click", () => openModal(q));
      browseList.appendChild(card);
    }
  }

  /* ---------- Modal ---------- */
  function openModal(q) {
    modalText.textContent = q.text;
    modalAuthor.textContent = q.author;
    const a = state.authors.find((x) => x.name === q.author);
    modalRole.textContent = a ? a.role : "";
    modalSource.textContent = `${q.source || ""}${q.year ? " · " + q.year : ""}`;
    modalTags.innerHTML = "";
    (q.tags || []).forEach((t) => {
      const span = document.createElement("span");
      span.className = "modal-tag";
      span.textContent = t;
      modalTags.appendChild(span);
    });
    modal.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
  }
  modal.addEventListener("click", (e) => {
    if (e.target.dataset.close !== undefined) closeModal();
  });

  /* ---------- Tooltip + hover ---------- */
  function showTooltip(q, x, y) {
    tooltip.innerHTML = `
      <span>${escapeHtml(shorten(q.text, 140))}</span>
      <span class="tt-author">${escapeHtml(q.author)}</span>
    `;
    tooltip.style.left = x + "px";
    tooltip.style.top = y + "px";
    tooltip.classList.add("is-shown");
  }
  function hideTooltip() {
    tooltip.classList.remove("is-shown");
  }
  function shorten(t, max) {
    if (t.length <= max) return t;
    return t.slice(0, max - 1) + "…";
  }
  function escapeHtml(s) {
    return (s || "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ---------- Events ---------- */
  function bindEvents() {
    // Nav scroll
    window.addEventListener("scroll", () => {
      nav.classList.toggle("is-scrolled", window.scrollY > 12);
    });

    // Resize
    window.addEventListener("resize", resizeCanvas);

    // Canvas interactions
    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    canvas.addEventListener("mouseleave", () => {
      if (!state.dragging) {
        state.hovered = null;
        hideTooltip();
        canvas.style.cursor = "grab";
      }
    });

    // Touch
    canvas.addEventListener("touchstart", onTouch, { passive: false });
    canvas.addEventListener("touchmove", onTouch, { passive: false });
    canvas.addEventListener("touchend", onUp);

    // Click
    canvas.addEventListener("click", (e) => {
      if (state.dragMoved) return;
      const p = pointAt(e.offsetX, e.offsetY);
      if (p) openModal(p.quote);
    });

    // Filter
    filterBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const open = !filterPanel.hidden;
      filterPanel.hidden = open;
      filterBtn.setAttribute("aria-expanded", String(!open));
    });
    document.addEventListener("click", (e) => {
      if (!filterPanel.contains(e.target) && e.target !== filterBtn) {
        filterPanel.hidden = true;
        filterBtn.setAttribute("aria-expanded", "false");
      }
    });
    filterAll.addEventListener("click", () => setAllAuthors(true));
    filterNone.addEventListener("click", () => setAllAuthors(false));
    filterList.addEventListener("change", syncAuthorFilter);

    // Search
    searchInput.addEventListener("input", (e) => {
      state.searchTerm = e.target.value.trim();
      searchClear.classList.toggle("is-shown", state.searchTerm.length > 0);
    });
    searchClear.addEventListener("click", () => {
      searchInput.value = "";
      state.searchTerm = "";
      searchClear.classList.remove("is-shown");
      searchInput.focus();
    });

    // Sort
    $qa(".sort-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        $qa(".sort-btn").forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        renderBrowseList(btn.dataset.sort);
      });
    });

    // Reset empty state
    cloudEmptyReset.addEventListener("click", () => {
      setAllAuthors(true);
      state.searchTerm = "";
      searchInput.value = "";
      searchClear.classList.remove("is-shown");
    });

    // Keyboard
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
      if (e.key === "/" && document.activeElement !== searchInput) {
        e.preventDefault();
        searchInput.focus();
      }
    });
  }

  function onDown(e) {
    state.dragging = true;
    state.dragStart = { x: e.clientX, y: e.clientY, rx: state.targetRotation.x, ry: state.targetRotation.y };
    state.lastInteraction = performance.now();
    state.dragMoved = false;
    canvas.style.cursor = "grabbing";
  }
  function onUp() {
    state.dragging = false;
    canvas.style.cursor = "grab";
    state.dragStart = null;
    // small delay so a real click after a tiny drag still fires
    setTimeout(() => { state.dragMoved = false; }, 50);
  }
  function onMove(e) {
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (state.dragging && state.dragStart) {
      const dx = e.clientX - state.dragStart.x;
      const dy = e.clientY - state.dragStart.y;
      if (Math.hypot(dx, dy) > 4) state.dragMoved = true;
      state.targetRotation.y = state.dragStart.ry + dx * 0.006;
      state.targetRotation.x = clamp(state.dragStart.rx + dy * 0.006, -1.2, 1.2);
      state.lastInteraction = performance.now();
      cloudHud.classList.add("is-hidden");
      return;
    }

    // Hover
    const p = pointAt(x, y);
    if (p) {
      if (state.hovered !== p.id) {
        state.hovered = p.id;
        hudLabel.textContent = p.quote.author;
        cloudHud.classList.add("is-hidden");
      }
      showTooltip(p.quote, x, y);
      canvas.style.cursor = "pointer";
    } else {
      if (state.hovered) {
        state.hovered = null;
        hudLabel.textContent = "Drag to explore";
        cloudHud.classList.remove("is-hidden");
      }
      hideTooltip();
      canvas.style.cursor = "grab";
    }
  }
  function onTouch(e) {
    e.preventDefault();
    const t = e.touches[0];
    if (!t) return;
    if (e.type === "touchstart") onDown({ clientX: t.clientX, clientY: t.clientY });
    else if (e.type === "touchmove") onMove({ clientX: t.clientX, clientY: t.clientY });
  }

  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  /* ---------- Canvas sizing ---------- */
  function resizeCanvas() {
    const rect = stage.getBoundingClientRect();
    canvas.width = rect.width * state.dpr;
    canvas.height = rect.height * state.dpr;
    canvas.style.width = rect.width + "px";
    canvas.style.height = rect.height + "px";
    ctx.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);
  }

  /* ---------- Boot ---------- */
  loadData().catch((err) => {
    console.error("Failed to load data", err);
    document.body.insertAdjacentHTML("afterbegin", `<pre style="color:red;padding:20px">${err}</pre>`);
  });
})();
