const STORAGE_KEY = "manage-contents-items-v1";

const STATUS_LABELS = {
  completed: "見た・読んだ",
  progress: "進行中",
  wishlist: "見たい・読みたい",
  paused: "保留",
};

const SEED_ITEMS = [
  {
    id: "seed-aot",
    title: "進撃の巨人",
    category: "漫画",
    status: "completed",
    rating: 9.5,
    favorite: true,
    tags: ["ダークファンタジー", "世界観", "伏線"],
    note: "世界観と物語の広がりが強く印象に残った作品。",
    createdAt: "2026-09-12T09:00:00.000Z",
    updatedAt: "2026-09-12T09:00:00.000Z",
  },
  {
    id: "seed-madeinabyss",
    title: "メイドインアビス",
    category: "アニメ",
    status: "completed",
    rating: 9,
    favorite: true,
    tags: ["ファンタジー", "冒険", "世界観"],
    note: "未知の世界を探索していく感覚と、独特の世界設定が好き。",
    createdAt: "2026-09-13T09:00:00.000Z",
    updatedAt: "2026-09-13T09:00:00.000Z",
  },
  {
    id: "seed-violet",
    title: "ヴァイオレット・エヴァーガーデン",
    category: "アニメ",
    status: "completed",
    rating: 8.5,
    favorite: true,
    tags: ["ヒューマンドラマ", "感情", "映像"],
    note: "感情の変化を丁寧に追えるところが印象的。",
    createdAt: "2026-09-14T09:00:00.000Z",
    updatedAt: "2026-09-14T09:00:00.000Z",
  },
  {
    id: "seed-hxh",
    title: "HUNTER×HUNTER",
    category: "漫画",
    status: "progress",
    rating: 8.5,
    favorite: false,
    tags: ["冒険", "バトル", "能力"],
    note: "能力やルールを使った駆け引きが面白い。",
    createdAt: "2026-09-15T09:00:00.000Z",
    updatedAt: "2026-09-15T09:00:00.000Z",
  },
];

let items = loadItems();
let activeCategory = "all";
let currentView = "home";
let toastTimer;

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

function cloneSeed() {
  return JSON.parse(JSON.stringify(SEED_ITEMS));
}

function loadItems() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : cloneSeed();
  } catch {
    return cloneSeed();
  }
}

function saveItems() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function makeId() {
  if (crypto?.randomUUID) return crypto.randomUUID();
  return `item-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getInitial(title) {
  return escapeHtml((title || "?").trim().slice(0, 2));
}

function parseTags(value) {
  return [...new Set(
    String(value || "")
      .split(/[、,，]/)
      .map((tag) => tag.trim())
      .filter(Boolean)
  )].slice(0, 12);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 1800);
}

function navigate(view) {
  currentView = view;
  $$(".view").forEach((el) => el.classList.toggle("active", el.dataset.view === view));
  $$(".nav-item").forEach((el) => el.classList.toggle("active", el.dataset.nav === view));
  window.scrollTo({ top: 0, behavior: "smooth" });
  renderAll();
}

function sortedByRating(list) {
  return [...list].sort((a, b) =>
    Number(b.rating || 0) - Number(a.rating || 0) ||
    Number(Boolean(b.favorite)) - Number(Boolean(a.favorite)) ||
    new Date(b.updatedAt) - new Date(a.updatedAt)
  );
}

function formatScore(value) {
  const number = Number(value || 0);
  return Number.isInteger(number) ? String(number) : number.toFixed(1);
}

function renderStats() {
  $("#stat-total").textContent = items.length;
  $("#stat-favorites").textContent = items.filter((item) => item.favorite).length;
  $("#stat-completed").textContent = items.filter((item) => item.status === "completed").length;
}

function renderRanking() {
  const container = $("#ranking-list");
  const ranked = sortedByRating(items.filter((item) => item.status !== "wishlist")).slice(0, 5);
  if (!ranked.length) {
    container.innerHTML = '<div class="empty-state">評価した作品がまだありません。</div>';
    return;
  }

  container.innerHTML = ranked.map((item, index) => `
    <article class="ranking-item" data-edit-id="${escapeHtml(item.id)}">
      <span class="rank-number">${index + 1}</span>
      <div class="cover-mini">${getInitial(item.title)}</div>
      <div class="rank-copy">
        <strong>${escapeHtml(item.title)}${item.favorite ? '<span class="heart">♥</span>' : ""}</strong>
        <small>${escapeHtml(item.category)} · ${escapeHtml(STATUS_LABELS[item.status] || item.status)}</small>
      </div>
      <span class="score">${formatScore(item.rating)}<small>/10</small></span>
    </article>
  `).join("");
}

function renderRecent() {
  const container = $("#recent-list");
  const recent = [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 6);
  if (!recent.length) {
    container.innerHTML = '<div class="empty-state">＋ボタンから最初の作品を記録できます。</div>';
    return;
  }

  container.innerHTML = recent.map((item) => `
    <article class="content-card" data-edit-id="${escapeHtml(item.id)}">
      <div class="content-card-top">
        <div class="cover-card">${getInitial(item.title)}</div>
        <div class="content-copy">
          <h3>${escapeHtml(item.title)}${item.favorite ? '<span class="heart">♥</span>' : ""}</h3>
          <p class="meta">${escapeHtml(item.category)} · ${escapeHtml(STATUS_LABELS[item.status] || item.status)}</p>
          <p class="score">${formatScore(item.rating)}<small>/10</small></p>
        </div>
      </div>
      <p class="note-preview">${escapeHtml(item.note || "まだ感想メモはありません。")}</p>
    </article>
  `).join("");
}

function filteredLibraryItems() {
  const query = $("#library-search").value.trim().toLowerCase();
  const status = $("#status-filter").value;
  const sort = $("#sort-filter").value;

  let result = items.filter((item) => {
    const searchable = [item.title, item.category, item.note, ...(item.tags || [])].join(" ").toLowerCase();
    return (activeCategory === "all" || item.category === activeCategory)
      && (status === "all" || item.status === status)
      && (!query || searchable.includes(query));
  });

  if (sort === "rating") result = sortedByRating(result);
  if (sort === "updated") result.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  if (sort === "title") result.sort((a, b) => a.title.localeCompare(b.title, "ja"));
  return result;
}

function renderLibrary() {
  const container = $("#library-list");
  const result = filteredLibraryItems();
  $("#library-count").textContent = `${result.length}件`;

  if (!result.length) {
    container.innerHTML = '<div class="empty-state">条件に合う作品がありません。</div>';
    return;
  }

  container.innerHTML = result.map((item) => `
    <article class="library-item" data-edit-id="${escapeHtml(item.id)}">
      <div class="cover-mini">${getInitial(item.title)}</div>
      <div>
        <h3>${escapeHtml(item.title)}${item.favorite ? '<span class="heart">♥</span>' : ""}</h3>
        <p>${escapeHtml(item.category)} · ${escapeHtml(STATUS_LABELS[item.status] || item.status)}</p>
        <div class="tags">${(item.tags || []).slice(0, 3).map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>
      </div>
      <span class="score">${formatScore(item.rating)}<small>/10</small></span>
    </article>
  `).join("");
}

function getTasteProfile() {
  const rated = items.filter((item) => Number(item.rating) >= 8);
  const source = rated.length ? rated : items;

  const categoryCounts = {};
  const tagCounts = {};
  source.forEach((item) => {
    categoryCounts[item.category] = (categoryCounts[item.category] || 0) + 1;
    (item.tags || []).forEach((tag) => {
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
    });
  });

  const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([tag]) => tag);
  return { topCategory, topTags, ratedCount: rated.length };
}

function renderRecommendations() {
  const { topCategory, topTags, ratedCount } = getTasteProfile();
  const summary = $("#taste-summary");
  const container = $("#recommend-list");

  if (!items.length) {
    summary.textContent = "作品を記録すると、評価・カテゴリ・タグから好みを整理します。";
    container.innerHTML = '<div class="empty-state">まずは好きな作品を3件ほど登録すると、推薦の材料が増えます。</div>';
    return;
  }

  const tagText = topTags.length ? `「${topTags.join("」「")}」` : "登録したタグ";
  summary.textContent = `${ratedCount || items.length}件の記録を中心に見ると、${topCategory || "複数カテゴリ"}と${tagText}の傾向が強めです。`;

  const leastCategory = ["漫画", "アニメ", "映画", "小説"]
    .map((category) => ({ category, count: items.filter((item) => item.category === category).length }))
    .sort((a, b) => a.count - b.count)[0]?.category;

  const ideas = [
    {
      label: "好みを深掘り",
      title: `${topTags[0] || topCategory || "高評価作品"}から次を探す`,
      text: `評価8以上の作品と共通する要素を優先し、似ている理由が説明できる候補を探す方向です。`,
    },
    {
      label: "少し広げる",
      title: `${topCategory || "好きなカテゴリ"}の隣にある作品`,
      text: `完全に同じ作品ではなく、世界観・感情・テーマなど一部の好みが重なる作品を候補にします。`,
    },
    {
      label: "未開拓",
      title: `${leastCategory || "別カテゴリ"}から1本試す`,
      text: `今の好みを保ったまま、まだ登録が少ないカテゴリへ広げる推薦枠です。`,
    },
  ];

  container.innerHTML = ideas.map((idea) => `
    <article class="recommend-item">
      <span class="recommend-label">${escapeHtml(idea.label)}</span>
      <h3>${escapeHtml(idea.title)}</h3>
      <p>${escapeHtml(idea.text)}</p>
    </article>
  `).join("");
}

function renderAll() {
  renderStats();
  renderRanking();
  renderRecent();
  renderLibrary();
  renderRecommendations();
}

function openEditor(itemId = null) {
  const dialog = $("#item-dialog");
  const item = itemId ? items.find((candidate) => candidate.id === itemId) : null;
  $("#form-title").textContent = item ? "記録を編集" : "作品を追加";
  $("#item-id").value = item?.id || "";
  $("#item-title").value = item?.title || "";
  $("#item-category").value = item?.category || "漫画";
  $("#item-status").value = item?.status || "completed";
  $("#item-rating").value = item?.rating ?? 8;
  $("#rating-output").value = item?.rating ?? 8;
  $("#item-favorite").checked = Boolean(item?.favorite);
  $("#item-tags").value = (item?.tags || []).join(", ");
  $("#item-note").value = item?.note || "";
  $("#delete-item").classList.toggle("hidden", !item);
  dialog.showModal();
  setTimeout(() => $("#item-title").focus(), 80);
}

function closeEditor() {
  $("#item-dialog").close();
}

function saveFromForm() {
  const id = $("#item-id").value;
  const now = new Date().toISOString();
  const existing = items.find((item) => item.id === id);
  const next = {
    id: id || makeId(),
    title: $("#item-title").value.trim(),
    category: $("#item-category").value,
    status: $("#item-status").value,
    rating: Number($("#item-rating").value),
    favorite: $("#item-favorite").checked,
    tags: parseTags($("#item-tags").value),
    note: $("#item-note").value.trim(),
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  if (!next.title) return;
  if (existing) items = items.map((item) => item.id === id ? next : item);
  else items.unshift(next);
  saveItems();
  renderAll();
  closeEditor();
  showToast(existing ? "記録を更新しました" : "作品を追加しました");
}

function deleteCurrentItem() {
  const id = $("#item-id").value;
  const item = items.find((candidate) => candidate.id === id);
  if (!item) return;
  if (!confirm(`「${item.title}」を削除しますか？`)) return;
  items = items.filter((candidate) => candidate.id !== id);
  saveItems();
  renderAll();
  closeEditor();
  showToast("記録を削除しました");
}

function exportData() {
  const payload = {
    app: "Content Diary",
    version: 1,
    exportedAt: new Date().toISOString(),
    items,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `content-diary-${new Date().toISOString().slice(0, 10)}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
  showToast("JSONを書き出しました");
}

async function importData(file) {
  if (!file) return;
  try {
    const parsed = JSON.parse(await file.text());
    const imported = Array.isArray(parsed) ? parsed : parsed.items;
    if (!Array.isArray(imported)) throw new Error("invalid format");
    items = imported
      .filter((item) => item && typeof item.title === "string")
      .map((item) => ({
        id: item.id || makeId(),
        title: item.title,
        category: item.category || "漫画",
        status: STATUS_LABELS[item.status] ? item.status : "completed",
        rating: Math.min(10, Math.max(1, Number(item.rating) || 5)),
        favorite: Boolean(item.favorite),
        tags: Array.isArray(item.tags) ? item.tags.map(String).slice(0, 12) : [],
        note: String(item.note || ""),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
      }));
    saveItems();
    renderAll();
    showToast(`${items.length}件を読み込みました`);
  } catch {
    showToast("JSONを読み込めませんでした");
  } finally {
    $("#import-data").value = "";
  }
}

function resetData() {
  if (!confirm("現在の記録を消して、初期デモデータに戻しますか？")) return;
  items = cloneSeed();
  saveItems();
  renderAll();
  showToast("デモデータに戻しました");
}

function bindEvents() {
  $$('[data-nav]').forEach((button) => button.addEventListener("click", () => navigate(button.dataset.nav)));
  $("#open-settings").addEventListener("click", () => navigate("settings"));
  $("#open-add").addEventListener("click", () => openEditor());
  $("#close-dialog").addEventListener("click", closeEditor);

  $("#item-rating").addEventListener("input", (event) => {
    $("#rating-output").value = event.target.value;
  });

  $("#item-form").addEventListener("submit", (event) => {
    event.preventDefault();
    saveFromForm();
  });
  $("#delete-item").addEventListener("click", deleteCurrentItem);

  document.addEventListener("click", (event) => {
    const editable = event.target.closest("[data-edit-id]");
    if (editable) openEditor(editable.dataset.editId);
  });

  $("#home-search").addEventListener("input", (event) => {
    const value = event.target.value;
    $("#library-search").value = value;
    if (value.trim()) navigate("library");
  });
  $("#library-search").addEventListener("input", renderLibrary);
  $("#status-filter").addEventListener("change", renderLibrary);
  $("#sort-filter").addEventListener("change", renderLibrary);

  $$("#category-chips .chip").forEach((chip) => chip.addEventListener("click", () => {
    activeCategory = chip.dataset.category;
    $$("#category-chips .chip").forEach((candidate) => candidate.classList.toggle("active", candidate === chip));
    renderLibrary();
  }));

  $("#refresh-recommend").addEventListener("click", () => {
    renderRecommendations();
    showToast("記録から好みを更新しました");
  });

  $("#export-data").addEventListener("click", exportData);
  $("#import-data").addEventListener("change", (event) => importData(event.target.files?.[0]));
  $("#reset-data").addEventListener("click", resetData);

  $("#item-dialog").addEventListener("click", (event) => {
    if (event.target === $("#item-dialog")) closeEditor();
  });
}

bindEvents();
renderAll();
