/* ===========================
   KK Sale — app.js
   Preču renderēšana no JSON
   =========================== */

(function () {
  'use strict';

  // --- Stāvoklis ---
  let allProducts = [];
  let activeCategory = 'visi';
  let showSold = false;

  // --- DOM referenes ---
  const grid       = document.getElementById('product-grid');
  const emptyState = document.getElementById('empty-state');
  const statsCount = document.getElementById('stats-count');
  const toggleSold = document.getElementById('toggle-sold');
  const filterBtns = document.querySelectorAll('.filter-btn');
  const modalOverlay = document.getElementById('modal-overlay');
  const modalClose   = document.getElementById('modal-close');

  // --- Ielādēt produktus ---
  fetch('data/products.json')
    .then(r => {
      if (!r.ok) throw new Error('Nevarēja ielādēt katalogu');
      return r.json();
    })
    .then(data => {
      allProducts = data;
      render();
    })
    .catch(err => {
      grid.innerHTML = `<p style="color:#c0392b;padding:2rem 0">Kļūda: ${err.message}</p>`;
    });

  // --- Renderēt ---
  function render() {
    const filtered = allProducts.filter(p => {
      const catMatch = activeCategory === 'visi' || p.category === activeCategory;
      const soldMatch = showSold || !p.sold;
      return catMatch && soldMatch;
    });

    const available = filtered.filter(p => !p.sold).length;
    const total     = filtered.length;

    statsCount.textContent = total === 0
      ? 'Nav preču'
      : `${available} pieejam${available === 1 ? 'a' : 'as'} no ${total}`;

    if (filtered.length === 0) {
      grid.innerHTML = '';
      emptyState.classList.remove('hidden');
      return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = filtered.map(renderCard).join('');

    // Pievienot click uz kartītēm
    grid.querySelectorAll('.product-card:not(.is-sold)').forEach(card => {
      card.addEventListener('click', () => openModal(+card.dataset.id));
    });
  }

  // --- Kartītes HTML ---
  function renderCard(p) {
    const imgHtml = p.images && p.images[0]
      ? `<img src="${p.images[0]}" alt="${esc(p.title)}" loading="lazy" onerror="this.parentElement.innerHTML='<span class=no-image>📦</span>'" />`
      : `<span class="no-image">📦</span>`;

    return `
      <article class="product-card${p.sold ? ' is-sold' : ''}" data-id="${p.id}" tabindex="${p.sold ? -1 : 0}" role="button" aria-label="${esc(p.title)}">
        <div class="card-image">${imgHtml}</div>
        ${p.sold ? '<span class="badge-sold">Pārdots</span>' : ''}
        <div class="card-body">
          <div class="card-category">${esc(p.category)}</div>
          <h2 class="card-title">${esc(p.title)}</h2>
          <p class="card-condition">${esc(p.condition)}</p>
          <div class="card-price">
            ${p.sold ? '<span style="color:var(--color-muted);font-size:.9rem">Pārdots</span>' : `${p.price} <span class="currency">${p.currency}</span>`}
          </div>
        </div>
      </article>`;
  }

  // --- Modāls ---
  function openModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p || p.sold) return;

    const imgHtml = p.images && p.images[0]
      ? `<img id="modal-image" src="${p.images[0]}" alt="${esc(p.title)}" onerror="this.parentElement.innerHTML='<span class=no-image>📦</span>'" />`
      : `<span class="no-image">📦</span>`;

    document.getElementById('modal-category').textContent    = p.category;
    document.getElementById('modal-title').textContent       = p.title;
    document.getElementById('modal-condition').textContent   = `Stāvoklis: ${p.condition}`;
    document.getElementById('modal-description').textContent = p.description;
    document.getElementById('modal-price').innerHTML         = `${p.price} <span class="currency">${p.currency}</span>`;

    document.querySelector('.modal-image-wrap').innerHTML = imgHtml;

    const actions = document.getElementById('modal-actions');
    actions.innerHTML = '';

    if (p.contact.whatsapp) {
      const msg = encodeURIComponent(`Sveiki! Interesē: "${p.title}" (${p.price} ${p.currency})`);
      actions.innerHTML += `<a class="btn btn-wa" href="https://wa.me/${p.contact.whatsapp.replace(/\D/g,'')}?text=${msg}" target="_blank" rel="noopener">💬 WhatsApp</a>`;
    }
    if (p.contact.email) {
      const subj = encodeURIComponent(`Interesē: ${p.title}`);
      const body = encodeURIComponent(`Sveiki,\n\nInteresē "${p.title}" (${p.price} ${p.currency}).\nVai ir pieejams?\n\nPaldies!`);
      actions.innerHTML += `<a class="btn btn-primary" href="mailto:${p.contact.email}?subject=${subj}&body=${body}">✉️ E-pasts</a>`;
    }

    modalOverlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
  }

  function closeModal() {
    modalOverlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  modalClose.addEventListener('click', closeModal);
  modalOverlay.addEventListener('click', e => {
    if (e.target === modalOverlay) closeModal();
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
  });

  // --- Filtri ---
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeCategory = btn.dataset.category;
      render();
    });
  });

  // --- Toggle pārdotās ---
  toggleSold.addEventListener('change', () => {
    showSold = toggleSold.checked;
    render();
  });

  // --- Escape helper ---
  function esc(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

})();
