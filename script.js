const storageKey = "huefit-closet-items";
const preferencesKey = "huefit-closet-preferences";

const starterItems = [
  {
    name: "Cream Ribbed Tee",
    category: "top",
    color: "soft",
    style: "casual",
    season: "summer",
    formality: "relaxed",
    texture: "soft"
  },
  {
    name: "Blue Wide-Leg Jeans",
    category: "bottom",
    color: "cool",
    style: "classic",
    season: "all",
    formality: "smart",
    texture: "structured"
  },
  {
    name: "Ivory Slip Dress",
    category: "dress",
    color: "neutral",
    style: "romantic",
    season: "summer",
    formality: "dressy",
    texture: "smooth"
  },
  {
    name: "Lightweight Blazer",
    category: "outerwear",
    color: "neutral",
    style: "classic",
    season: "spring",
    formality: "smart",
    texture: "structured"
  },
  {
    name: "White Leather Sneakers",
    category: "shoes",
    color: "neutral",
    style: "sporty",
    season: "all",
    formality: "relaxed",
    texture: "smooth"
  },
  {
    name: "Tan Crossbody Bag",
    category: "accessory",
    color: "warm",
    style: "elevated",
    season: "all",
    formality: "smart",
    texture: "structured"
  },
  {
    name: "Gold Hoop Earrings",
    category: "accessory",
    color: "warm",
    style: "elevated",
    season: "all",
    formality: "dressy",
    texture: "statement"
  }
];

const themes = [
  {
    id: "clementine-light",
    name: "Clementine light",
    bg: "linear-gradient(135deg, #fff4df 0%, #f5f5ff 46%, #ecfbf4 100%)",
    accent: "#ef7a4f",
    accentSoft: "rgba(239, 122, 79, 0.14)",
    accentTwo: "#247a72"
  },
  {
    id: "lagoon-bloom",
    name: "Lagoon bloom",
    bg: "linear-gradient(135deg, #eefaf8 0%, #eef3ff 54%, #fff5eb 100%)",
    accent: "#0f8a8d",
    accentSoft: "rgba(15, 138, 141, 0.14)",
    accentTwo: "#df6f38"
  },
  {
    id: "berry-paper",
    name: "Berry paper",
    bg: "linear-gradient(135deg, #fff1ef 0%, #f8efff 50%, #f2fbff 100%)",
    accent: "#d85c76",
    accentSoft: "rgba(216, 92, 118, 0.14)",
    accentTwo: "#2f6b9a"
  }
];

const categoryLabels = {
  top: "Top",
  bottom: "Bottom",
  dress: "Dress",
  outerwear: "Layer",
  shoes: "Shoes",
  accessory: "Accessory"
};

const wardrobe = loadWardrobe();
const preferences = loadPreferences();

const wardrobeGrid = document.querySelector("#wardrobe-grid");
const resultsGrid = document.querySelector("#results");
const itemForm = document.querySelector("#item-form");
const imageInput = document.querySelector("#item-image");
const uploadHint = document.querySelector("#upload-hint");
const wardrobeTemplate = document.querySelector("#wardrobe-card-template");
const resultTemplate = document.querySelector("#result-card-template");
const generateButton = document.querySelector("#generate-outfits");
const resetFiltersButton = document.querySelector("#reset-filters");
const shuffleThemeButton = document.querySelector("#shuffle-theme");
const focusModeButton = document.querySelector("#focus-mode");
const quietModeButton = document.querySelector("#quiet-mode");
const themeName = document.querySelector("#theme-name");
const themeSelect = document.querySelector("#theme-select");
const radiusSelect = document.querySelector("#radius-select");
const itemCounter = document.querySelector("#count-items");
const lookCounter = document.querySelector("#count-looks");

const filterIds = [
  "occasion",
  "mood",
  "weather",
  "dress-code",
  "palette-preference",
  "priority-piece"
];

let uploadedImage = "";

initialize();

function initialize() {
  registerServiceWorker();
  populateThemeSelect();
  hydratePreferences();
  attachListeners();
  applyTheme(getThemeById(preferences.themeId) || themes[0]);
  applyRadius(preferences.radius);
  applyModes();
  renderWardrobe();
  renderOutfits();
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;

  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Installability is optional. Ignore registration failures in unsupported contexts.
    });
  });
}

function attachListeners() {
  imageInput.addEventListener("change", handleImageUpload);
  itemForm.addEventListener("submit", handleItemSubmit);
  generateButton.addEventListener("click", renderOutfits);
  resetFiltersButton.addEventListener("click", resetFilters);
  shuffleThemeButton.addEventListener("click", cycleTheme);
  themeSelect.addEventListener("change", handleThemeChange);
  radiusSelect.addEventListener("change", handleRadiusChange);
  quietModeButton.addEventListener("click", toggleQuietMode);
  focusModeButton.addEventListener("click", toggleFocusMode);

  filterIds.forEach((id) => {
    document.querySelector(`#${id}`).addEventListener("change", () => {
      preferences.filters[id] = document.querySelector(`#${id}`).value;
      savePreferences();
      renderOutfits();
    });
  });
}

function handleImageUpload() {
  const [file] = imageInput.files;

  if (!file) {
    uploadedImage = "";
    uploadHint.textContent = "Choose a photo or snap one from your iPhone camera.";
    return;
  }

  uploadHint.textContent = `${file.name} selected`;

  const reader = new FileReader();
  reader.onload = () => {
    uploadedImage = reader.result;
  };
  reader.readAsDataURL(file);
}

function handleItemSubmit(event) {
  event.preventDefault();

  const formData = new FormData(itemForm);
  const name = formData.get("name").trim();
  if (!name) return;

  wardrobe.unshift({
    name,
    category: formData.get("category"),
    color: formData.get("color"),
    style: formData.get("style"),
    season: formData.get("season"),
    formality: formData.get("formality"),
    texture: formData.get("texture"),
    image: uploadedImage
  });

  itemForm.reset();
  uploadedImage = "";
  uploadHint.textContent = "Choose a photo or snap one from your iPhone camera.";
  saveWardrobe();
  renderWardrobe();
  renderOutfits();
}

function populateThemeSelect() {
  themeSelect.innerHTML = themes
    .map((theme) => `<option value="${theme.id}">${theme.name}</option>`)
    .join("");
}

function hydratePreferences() {
  filterIds.forEach((id) => {
    const value = preferences.filters[id];
    const field = document.querySelector(`#${id}`);
    if (field && value) field.value = value;
  });

  themeSelect.value = preferences.themeId;
  radiusSelect.value = preferences.radius;
}

function applyTheme(theme) {
  document.documentElement.style.setProperty("--bg", theme.bg);
  document.documentElement.style.setProperty("--accent", theme.accent);
  document.documentElement.style.setProperty("--accent-soft", theme.accentSoft);
  document.documentElement.style.setProperty("--accent-two", theme.accentTwo);
  themeName.textContent = theme.name;
  themeSelect.value = theme.id;
  preferences.themeId = theme.id;
  savePreferences();
}

function applyRadius(radius) {
  const root = document.documentElement;

  if (radius === "structured") {
    root.style.setProperty("--radius-xl", "18px");
    root.style.setProperty("--radius-lg", "14px");
    root.style.setProperty("--radius-md", "12px");
  } else if (radius === "pill") {
    root.style.setProperty("--radius-xl", "36px");
    root.style.setProperty("--radius-lg", "28px");
    root.style.setProperty("--radius-md", "20px");
  } else {
    root.style.setProperty("--radius-xl", "30px");
    root.style.setProperty("--radius-lg", "22px");
    root.style.setProperty("--radius-md", "16px");
  }
}

function applyModes() {
  document.body.classList.toggle("quiet-mode", preferences.quietMode);
  document.body.classList.toggle("focus-mode", preferences.focusMode);
  quietModeButton.setAttribute("aria-pressed", String(preferences.quietMode));
  quietModeButton.textContent = preferences.quietMode ? "On" : "Off";
  focusModeButton.textContent = preferences.focusMode ? "Exit focus" : "Focus mode";
}

function handleThemeChange() {
  applyTheme(getThemeById(themeSelect.value) || themes[0]);
}

function handleRadiusChange() {
  preferences.radius = radiusSelect.value;
  applyRadius(preferences.radius);
  savePreferences();
}

function toggleQuietMode() {
  preferences.quietMode = !preferences.quietMode;
  applyModes();
  savePreferences();
}

function toggleFocusMode() {
  preferences.focusMode = !preferences.focusMode;
  applyModes();
  savePreferences();
}

function cycleTheme() {
  const currentIndex = themes.findIndex((theme) => theme.id === preferences.themeId);
  const nextTheme = themes[(currentIndex + 1) % themes.length];
  applyTheme(nextTheme);
}

function resetFilters() {
  const defaults = defaultFilters();
  filterIds.forEach((id) => {
    document.querySelector(`#${id}`).value = defaults[id];
    preferences.filters[id] = defaults[id];
  });

  savePreferences();
  renderOutfits();
}

function loadWardrobe() {
  const storedItems = localStorage.getItem(storageKey);
  if (!storedItems) return [...starterItems];

  try {
    const parsed = JSON.parse(storedItems);
    return Array.isArray(parsed) && parsed.length ? parsed : [...starterItems];
  } catch {
    return [...starterItems];
  }
}

function saveWardrobe() {
  localStorage.setItem(storageKey, JSON.stringify(wardrobe));
}

function loadPreferences() {
  const fallback = {
    themeId: themes[0].id,
    radius: "soft",
    quietMode: false,
    focusMode: false,
    filters: defaultFilters()
  };

  const stored = localStorage.getItem(preferencesKey);
  if (!stored) return fallback;

  try {
    const parsed = JSON.parse(stored);
    return {
      ...fallback,
      ...parsed,
      filters: {
        ...fallback.filters,
        ...(parsed.filters || {})
      }
    };
  } catch {
    return fallback;
  }
}

function savePreferences() {
  localStorage.setItem(preferencesKey, JSON.stringify(preferences));
}

function defaultFilters() {
  return {
    occasion: "casual",
    mood: "balanced",
    weather: "all",
    "dress-code": "relaxed",
    "palette-preference": "mixed",
    "priority-piece": "none"
  };
}

function renderWardrobe() {
  wardrobeGrid.innerHTML = "";
  itemCounter.textContent = wardrobe.length;

  if (!wardrobe.length) {
    wardrobeGrid.innerHTML = `<div class="empty-state">Add a few pieces to start building personalized outfit ideas.</div>`;
    return;
  }

  wardrobe.forEach((item) => {
    const card = wardrobeTemplate.content.firstElementChild.cloneNode(true);
    const imageWrap = card.querySelector(".wardrobe-image-wrap");
    const image = card.querySelector(".wardrobe-image");

    card.querySelector("h3").textContent = item.name;
    card.querySelector(".tag-row").textContent = [
      categoryLabels[item.category],
      item.style,
      item.color,
      item.formality || "relaxed"
    ].join(" • ");

    if (item.image) {
      imageWrap.classList.add("has-image");
      image.src = item.image;
      image.alt = item.name;
    }

    wardrobeGrid.appendChild(card);
  });
}

function renderOutfits() {
  resultsGrid.innerHTML = "";
  const filters = getCurrentFilters();
  const outfits = buildOutfits(filters);
  lookCounter.textContent = outfits.length;

  if (!outfits.length) {
    resultsGrid.innerHTML = `<div class="empty-state">Add at least a top and bottom or a dress, plus shoes, to generate better outfit recommendations.</div>`;
    return;
  }

  outfits.forEach((outfit) => {
    const card = resultTemplate.content.firstElementChild.cloneNode(true);
    card.querySelector(".result-score").textContent = `${outfit.score}% match`;
    card.querySelector(".result-title").textContent = outfit.title;
    card.querySelector(".result-badge").textContent = outfit.badge;
    card.querySelector(".result-reason").textContent = outfit.reason;

    const board = card.querySelector(".result-board");
    outfit.items.forEach((item) => {
      const block = document.createElement("div");
      block.className = `board-piece ${item.color}`;
      block.textContent = item.name;
      board.appendChild(block);
    });

    const pieces = card.querySelector(".result-pieces");
    outfit.items.forEach((item) => {
      const pill = document.createElement("div");
      pill.className = "piece-pill";
      pill.textContent = `${categoryLabels[item.category]}: ${item.name}`;
      pieces.appendChild(pill);
    });

    resultsGrid.appendChild(card);
  });
}

function getCurrentFilters() {
  return filterIds.reduce((accumulator, id) => {
    accumulator[id] = document.querySelector(`#${id}`).value;
    return accumulator;
  }, {});
}

function buildOutfits(filters) {
  const tops = wardrobe.filter((item) => item.category === "top");
  const bottoms = wardrobe.filter((item) => item.category === "bottom");
  const dresses = wardrobe.filter((item) => item.category === "dress");
  const outerwear = wardrobe.filter((item) => item.category === "outerwear");
  const shoes = wardrobe.filter((item) => item.category === "shoes");
  const accessories = wardrobe.filter((item) => item.category === "accessory");
  const suggestions = [];

  tops.forEach((top) => {
    bottoms.forEach((bottom) => {
      const baseItems = [top, bottom];
      const shoe = pickBestMatch(shoes, baseItems, filters);
      if (!shoe) return;

      const accessory = pickBestMatch(accessories, [...baseItems, shoe], filters);
      const outer = shouldUseOuterwear(filters)
        ? pickBestMatch(outerwear, [...baseItems, shoe, accessory].filter(Boolean), filters)
        : null;
      const items = [...baseItems, shoe, accessory, outer].filter(Boolean);

      suggestions.push(createSuggestion(items, filters));
    });
  });

  dresses.forEach((dress) => {
    const shoe = pickBestMatch(shoes, [dress], filters);
    if (!shoe) return;

    const accessory = pickBestMatch(accessories, [dress, shoe], filters);
    const outer = shouldUseOuterwear(filters)
      ? pickBestMatch(outerwear, [dress, shoe, accessory].filter(Boolean), filters)
      : null;
    const items = [dress, shoe, accessory, outer].filter(Boolean);

    suggestions.push(createSuggestion(items, filters));
  });

  return suggestions
    .sort((left, right) => right.score - left.score)
    .filter((outfit, index, list) => list.findIndex((entry) => signature(entry.items) === signature(outfit.items)) === index)
    .slice(0, 6);
}

function shouldUseOuterwear(filters) {
  return filters.weather === "cool" || ["work", "travel"].includes(filters.occasion);
}

function pickBestMatch(pool, currentItems, filters) {
  return pool
    .map((item) => ({
      item,
      score: scoreItem(item, currentItems, filters)
    }))
    .sort((left, right) => right.score - left.score)[0]?.item;
}

function scoreItem(item, currentItems, filters) {
  let score = 62;
  const colors = currentItems.map((current) => current.color);
  const styles = currentItems.map((current) => current.style);
  const textures = currentItems.map((current) => current.texture);
  const formalities = currentItems.map((current) => current.formality);

  if (colors.includes(item.color)) score += 10;
  if (colors.includes("neutral") && item.color !== "bold") score += 8;
  if (styles.includes(item.style)) score += 7;
  if (textures.includes("structured") && item.texture === "smooth") score += 4;
  if (textures.includes("soft") && item.texture !== "statement") score += 4;
  if (formalities.includes(filters["dress-code"])) score += 4;
  if (item.formality === filters["dress-code"]) score += 14;
  if (filters.mood === item.color) score += 10;
  if (filters["palette-preference"] === item.color) score += 12;
  if (filters["palette-preference"] === "neutral" && item.color === "neutral") score += 12;
  if (filters["palette-preference"] === "mixed" && item.color !== "bold") score += 4;
  if (filters["priority-piece"] === item.category) score += 16;

  if (filters.weather === "warm" && ["spring", "summer", "all"].includes(item.season)) score += 8;
  if (filters.weather === "cool" && ["fall", "winter", "all"].includes(item.season)) score += 8;

  if (filters.occasion === "work" && ["classic", "elevated"].includes(item.style)) score += 12;
  if (filters.occasion === "date" && ["romantic", "elevated"].includes(item.style)) score += 12;
  if (filters.occasion === "casual" && ["casual", "sporty"].includes(item.style)) score += 12;
  if (filters.occasion === "travel" && ["casual", "sporty", "classic"].includes(item.style)) score += 10;
  if (filters.occasion === "event" && ["elevated", "romantic"].includes(item.style)) score += 14;

  return score;
}

function createSuggestion(items, filters) {
  const colors = items.map((item) => item.color);
  const styles = items.map((item) => item.style);
  const formalities = items.map((item) => item.formality);
  let score = 70;

  if (new Set(colors).size <= 3) score += 8;
  if (colors.filter((color) => color === "neutral").length >= 2) score += 7;
  if (styles.includes("classic")) score += 6;
  if (styles.includes("elevated") && filters.occasion !== "casual") score += 8;
  if (filters["dress-code"] === "dressy" && formalities.includes("dressy")) score += 10;
  if (filters["dress-code"] === "smart" && formalities.includes("smart")) score += 8;
  if (filters["priority-piece"] !== "none" && items.some((item) => item.category === filters["priority-piece"])) score += 10;
  if (filters.mood === "minimal" && colors.filter((color) => color === "neutral").length >= 2) score += 12;
  if (filters.mood === "playful" && colors.includes("bold")) score += 12;
  if (filters.mood === "soft" && colors.some((color) => ["soft", "neutral"].includes(color))) score += 10;
  if (filters.mood === "bold" && colors.includes("bold")) score += 12;

  const titleMap = {
    casual: "Easy everyday outfit",
    work: "Polished daytime outfit",
    date: "Refined going-out outfit",
    event: "Statement event outfit",
    travel: "Comfort-first travel outfit"
  };

  const badgeMap = {
    relaxed: "Low effort, clean finish",
    smart: "Balanced and polished",
    dressy: "Elevated finish"
  };

  return {
    items,
    score: Math.min(score, 99),
    title: titleMap[filters.occasion],
    badge: badgeMap[filters["dress-code"]],
    reason: buildReason(items, filters)
  };
}

function buildReason(items, filters) {
  const colors = items.map((item) => item.color);
  const textures = items.map((item) => item.texture);
  const hasLayer = items.some((item) => item.category === "outerwear");
  const hasAccessory = items.some((item) => item.category === "accessory");

  const paletteSentence =
    filters["palette-preference"] === "mixed"
      ? "The palette stays balanced so the outfit feels coordinated without looking flat."
      : `The color mix leans ${filters["palette-preference"]}, which keeps the look aligned with the selected vibe.`;

  const moodSentenceMap = {
    balanced: "The overall combination feels even and easy to wear.",
    bold: "A stronger visual accent gives the outfit presence.",
    soft: "Softer tones make the outfit calmer on the eyes.",
    minimal: "The look stays streamlined, with less visual clutter.",
    playful: "There is enough contrast to make the outfit feel lively."
  };

  const textureSentence = textures.includes("statement")
    ? "A statement texture adds interest without taking over the whole outfit."
    : "The textures stay controlled, which helps the outfit feel put together.";

  const finishingSentence = hasLayer
    ? "A layer gives the look extra structure."
    : hasAccessory
      ? "The accessory acts as the finishing detail."
      : "The base pieces are strong enough to stand on their own.";

  const colorSupport = colors.includes("neutral")
    ? "Neutral anchors keep the combination grounded."
    : "The color story is carried by coordinated accent pieces.";

  return [paletteSentence, moodSentenceMap[filters.mood], textureSentence, finishingSentence, colorSupport].join(" ");
}

function signature(items) {
  return items
    .map((item) => `${item.category}:${item.name}`)
    .sort()
    .join("|");
}

function getThemeById(themeId) {
  return themes.find((theme) => theme.id === themeId);
}
