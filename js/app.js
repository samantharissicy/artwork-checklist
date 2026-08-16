// ===== DATA =====
const sections = [
  {
    title: "1. Legal Core (BRCGS 5.2.1)",
    items: [
      { id: "1a", title: "Product Name / Legal Name", note: "Must be clear, not misleading, and reflect true nature of food" },
      { id: "1b", title: "Net Quantity (Weight / Volume)", note: "g or ml, with e-mark where applicable" },
      { id: "1c", title: "e Mark Present", note: "If pre-packed, verify e-mark is correctly placed" },
      { id: "1d", title: "Legal Product Descriptor", note: "Accurate description of product category" },
      { id: "1e", title: "Business Name & Address (FBO)", note: "Full address or code referencing pack info" },
      { id: "1f", title: "Website", note: "" },
      { id: "1g", title: "Country of Manufacture / Origin", note: "COOL info if required (primary ingredient rule)" },
      { id: "1h", title: "Best Before / Use By Date Format & Location", note: "" },
      { id: "1i", title: "Lot / Batch Code Present", note: "" },
      { id: "1j", title: "Barcode & 2D Codes", note: "Readable, correct dimensions, front & back if applicable" }
    ]
  },
  {
    title: "2. Ingredients & Allergens",
    items: [
      { id: "2a", title: "Ingredients Declaration", note: "Descending order by weight; bolded allergens" },
      { id: "2b", title: "Allergy Advice Box", note: "\"For allergens, see ingredients in bold\" (if contains allergens)" },
      { id: "2c", title: "Nut Warning Statement", note: "O/H & B/L or B/L only as applicable" },
      { id: "2d", title: "Intolerance Info", note: "" },
      { id: "2e", title: "\"Some Separation is Natural\"", note: "If applicable" }
    ]
  },
  {
    title: "3. Nutrition & Serving",
    items: [
      { id: "3a", title: "Energy (kJ / kcal)", note: "" },
      { id: "3b", title: "Fat & Saturates", note: "" },
      { id: "3c", title: "Carbohydrates & Sugars", note: "" },
      { id: "3d", title: "Protein", note: "" },
      { id: "3e", title: "Salt", note: "Or \"Salt due to presence of naturally occurring sodium\"" },
      { id: "3f", title: "Optional: Fibre, Starch, Polyols, Mono/Polyunsaturates", note: "" },
      { id: "3g", title: "Vitamins & Minerals", note: "If added or claimed" },
      { id: "3h", title: "Reference Intakes (RIs) — Front of Pack", note: "" },
      { id: "3i", title: "Serving Size & Number of Servings", note: "" },
      { id: "3j", title: "Guideline Daily Amounts / % RI per portion", note: "" }
    ]
  },
  {
    title: "4. Storage & Cooking",
    items: [
      { id: "4a", title: "Storage Instructions", note: "" },
      { id: "4b", title: "Storage Instructions — Once Opened", note: "" },
      { id: "4c", title: "Cooking Instructions", note: "If applicable" },
      { id: "4d", title: "Serving Suggestion", note: "If image shown" }
    ]
  },
  {
    title: "5. Claims & Certifications",
    items: [
      { id: "5a", title: "Suitable for Vegetarians", note: "" },
      { id: "5b", title: "Suitable for Vegans / Vegan Certified", note: "Certified requires registration number/logo" },
      { id: "5c", title: "Gluten Free / Wheat Free / Suitable", note: "" },
      { id: "5d", title: "Free From Claims", note: "" },
      { id: "5e", title: "Halal Claim", note: "" },
      { id: "5f", title: "Kosher Claim", note: "" },
      { id: "5g", title: "Organic Logo & Cert Body", note: "Logo min 9mm(H) × 13.5mm(W), ratio 1:1.5" },
      { id: "5h", title: "No Artificial Colours, Preservatives or Flavours", note: "" },
      { id: "5i", title: "No Added Fat / Low Fat / Low Sugar / Low Calorie", note: "" },
      { id: "5j", title: "Provenance / Variety Claim", note: "" },
      { id: "5k", title: "Chilli Pepper Heat Level", note: "" },
      { id: "5l", title: "Any Other Claim", note: "Specify in notes" }
    ]
  },
  {
    title: "6. Packaging, Marks & Languages",
    items: [
      { id: "6a", title: "Multilingual Wording", note: "ES, FR, IT, DE etc." },
      { id: "6b", title: "Customer Guarantee Statement", note: "" },
      { id: "6c", title: "Package Recycling Statement / Info", note: "" },
      { id: "6d", title: "Dairy Health Mark", note: "UK FR 036 EC / UK FR 048 EC" },
      { id: "6e", title: "Label Size — Length / Width", note: "" },
      { id: "6f", title: "Label Commodity Codes", note: "" },
      { id: "6g", title: "Product Name on Back Label Too?", note: "Y/N" },
      { id: "6h", title: "Tamper Evidence", note: "Type, Text, Size" }
    ]
  }
];

// ===== RENDER CHECKLIST =====
const checklistEl = document.getElementById('checklist');
sections.forEach((sec, idx) => {
  const btn = document.createElement('button');
  btn.className = 'section-btn' + (idx > 0 ? ' collapsed' : '');
  btn.innerHTML = `<span>${sec.title}</span><svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7"/></svg>`;
  btn.onclick = () => {
    content.classList.toggle('hidden');
    btn.classList.toggle('collapsed');
  };
  
  const content = document.createElement('div');
  content.className = 'section-content' + (idx > 0 ? ' hidden' : '');
  
  sec.items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'check-item';
    div.draggable = true;
    div.dataset.id = item.id;
    div.innerHTML = `
      <input type="checkbox" onchange="toggleCheck(this)">
      <div class="check-item-body">
        <div class="check-item-top">
          <span class="ref-tag">${item.id.toUpperCase()}</span>
          <span class="check-item-title">${item.title}</span>
        </div>
        ${item.note ? `<div class="check-item-note">${item.note}</div>` : ''}
      </div>
      <div class="check-item-hint">
        <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/></svg>
      </div>
    `;
    
    div.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', item.id);
      e.dataTransfer.effectAllowed = 'copy';
      div.classList.add('dragging');
    });
    div.addEventListener('dragend', () => div.classList.remove('dragging'));
    div.addEventListener('mouseenter', () => highlightPin(item.id));
    div.addEventListener('mouseleave', () => unhighlightPin(item.id));
    
    content.appendChild(div);
  });
  
  checklistEl.appendChild(btn);
  checklistEl.appendChild(content);
});

// ===== STATE =====
let currentZoom = 1;
const pins = {};

// ===== ZOOM =====
function zoom(delta) {
  currentZoom = Math.max(0.5, Math.min(2, currentZoom + delta));
  document.getElementById('artwork-wrapper').style.transform = `scale(${currentZoom})`;
  document.getElementById('zoom-level').textContent = Math.round(currentZoom * 100) + '%';
}

// ===== CHECKBOX =====
function toggleCheck(cb) {
  const item = cb.closest('.check-item');
  item.classList.toggle('checked', cb.checked);
  updateProgress();
}

function updateProgress() {
  const all = document.querySelectorAll('.check-item input[type="checkbox"]');
  const checked = document.querySelectorAll('.check-item input[type="checkbox"]:checked');
  document.getElementById('progress-text').textContent = `${checked.length} / ${all.length} checked`;
  document.getElementById('progress-bar').style.width = (checked.length / all.length * 100) + '%';
}
updateProgress();

// ===== DROP PINS =====
const pinsLayer = document.getElementById('pins-layer');
const wrapper = document.getElementById('artwork-wrapper');

pinsLayer.addEventListener('dragover', e => e.preventDefault());
pinsLayer.addEventListener('drop', e => {
  e.preventDefault();
  const id = e.dataTransfer.getData('text/plain');
  if (!id) return;
  
  const rect = wrapper.getBoundingClientRect();
  const x = (e.clientX - rect.left) / currentZoom;
  const y = (e.clientY - rect.top) / currentZoom;
  
  addPin(id, x, y);
});

function addPin(id, x, y) {
  // Remove existing
  const existing = document.querySelector(`.pin[data-pid="${id}"]`);
  if (existing) existing.remove();
  delete pins[id];
  
  const pin = document.createElement('div');
  pin.className = 'pin';
  pin.dataset.pid = id;
  pin.style.left = x + 'px';
  pin.style.top = y + 'px';
  
  const item = findItemById(id);
  pin.innerHTML = `
    <div class="pin-tooltip">${item ? item.title : id.toUpperCase()}</div>
    <div class="pin-marker">${id.toUpperCase()}</div>
  `;
  
  pin.addEventListener('click', () => {
    scrollToItem(id);
  });
  
  pinsLayer.appendChild(pin);
  pins[id] = { x, y };
  
  showToast(`Pinned ${id.toUpperCase()} to artwork`);
}

function findItemById(id) {
  for (const sec of sections) {
    for (const item of sec.items) {
      if (item.id === id) return item;
    }
  }
  return null;
}

function scrollToItem(id) {
  const el = document.querySelector(`.check-item[data-id="${id}"]`);
  if (!el) return;
  
  // Expand section if hidden
  const section = el.closest('.section-content');
  if (section.classList.contains('hidden')) {
    section.previousElementSibling.click();
  }
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  el.style.background = '#dbeafe';
  setTimeout(() => el.style.background = '', 1200);
}

function highlightPin(id) {
  const pin = document.querySelector(`.pin[data-pid="${id}"]`);
  if (pin) pin.classList.add('pulse');
}

function unhighlightPin(id) {
  const pin = document.querySelector(`.pin[data-pid="${id}"]`);
  if (pin) pin.classList.remove('pulse');
}

function clearPins() {
  pinsLayer.innerHTML = '';
  Object.keys(pins).forEach(k => delete pins[k]);
  showToast('All pins cleared');
}

// ===== SAVE =====
function saveCheck() {
  const data = {
    product: {
      brand: document.getElementById('inp-brand').value,
      name: document.getElementById('inp-name').value,
      weight: document.getElementById('inp-weight').value,
      sku: document.getElementById('inp-sku').value
    },
    checks: {},
    pins: pins,
    timestamp: new Date().toISOString()
  };
  
  document.querySelectorAll('.check-item').forEach(item => {
    const cb = item.querySelector('input[type="checkbox"]');
    data.checks[item.dataset.id] = cb.checked;
  });
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `artwork-check-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showToast('Checklist saved! JSON file downloaded.');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}