import { rankSignals, relativeTime } from '/src/rank-signals.js';

const fixtureUrl = '/fixtures/daily/2026-06-11-ai-news.json';
const elements = {
  clear: document.querySelector('#clear-button'),
  empty: document.querySelector('#empty-state'),
  error: document.querySelector('#error-state'),
  filterButton: document.querySelector('#filter-button'),
  filterPanel: document.querySelector('#filter-panel'),
  fixtureDate: document.querySelector('#fixture-date'),
  list: document.querySelector('#signal-list'),
  loading: document.querySelector('#loading-state'),
  resultSummary: document.querySelector('#result-summary'),
  retry: document.querySelector('#retry-button'),
  search: document.querySelector('#search'),
  source: document.querySelector('#source-select'),
  toolbar: document.querySelector('#toolbar'),
  toolbarToggle: document.querySelector('#toolbar-toggle')
};

let snapshot;

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;'
  })[character]);
}

function scoreTone(score) {
  if (score >= 80) return 'blue';
  if (score >= 65) return 'violet';
  if (score >= 60) return 'lime';
  return 'amber';
}

function setState(state) {
  elements.loading.hidden = state !== 'loading';
  elements.error.hidden = state !== 'error';
  elements.list.hidden = state !== 'ready';
}

function renderMetrics(signals) {
  document.querySelector('#metric-total').textContent = signals.length;
  document.querySelector('#metric-high').textContent = signals.filter((signal) => signal.score >= 80).length;
  document.querySelector('#metric-alerts').textContent = signals.filter((signal) => signal.status === 'alert').length;
  document.querySelector('#metric-sources').textContent = new Set(signals.map((signal) => signal.source.publisher)).size;
}

function render() {
  const searchTerm = elements.search.value.trim().toLocaleLowerCase('es');
  const selectedSource = elements.source.value;
  const selectedStatuses = [...document.querySelectorAll('#filter-panel input:checked')].map((input) => input.value);
  const ranked = rankSignals(snapshot.signals);
  const filtered = ranked.filter((signal) => {
    const searchable = [signal.title, signal.evidence, signal.impact, signal.action, signal.source.publisher].join(' ').toLocaleLowerCase('es');
    return (!searchTerm || searchable.includes(searchTerm))
      && (!selectedSource || signal.source.publisher === selectedSource)
      && selectedStatuses.includes(signal.status);
  });

  elements.empty.hidden = filtered.length !== 0;
  elements.list.innerHTML = filtered.map((signal, index) => {
    const tone = scoreTone(signal.score);
    const percent = `${signal.confidenceScore}%`;
    return `<li class="signal-card tone-${tone}">
      <div class="rank"><span>${index + 1}</span></div>
      <div class="impact-score"><strong>${signal.score}</strong><span>${signal.score >= 80 ? 'Impacto alto' : signal.score >= 65 ? 'Impacto medio' : 'En seguimiento'}</span></div>
      <article>
        <p class="category">${escapeHtml(signal.category)}</p>
        <h3><a href="${escapeHtml(signal.source.url)}" target="_blank" rel="noreferrer">${escapeHtml(signal.title)}</a></h3>
        <p class="evidence">${escapeHtml(signal.evidence)}</p>
        <p class="action"><strong>Acción:</strong> ${escapeHtml(signal.action)}</p>
        <a class="source-tag" href="${escapeHtml(signal.source.url)}" target="_blank" rel="noreferrer">${escapeHtml(signal.source.publisher)} <span aria-hidden="true">↗</span></a>
      </article>
      <div class="confidence">
        <time datetime="${escapeHtml(signal.source.publishedAt)}">${relativeTime(signal.source.publishedAt, snapshot.generatedAt)}</time>
        <p>Confianza</p><strong>${signal.confidence}</strong>
        <div class="confidence-row"><div class="meter" aria-label="Confianza ${signal.confidenceScore} de 100"><span style="width:${percent}"></span></div><span>${signal.confidenceScore}/100</span></div>
      </div>
    </li>`;
  }).join('');
  elements.resultSummary.textContent = `${filtered.length} de ${ranked.length} señales`;
  renderMetrics(filtered);
}

function populateSources() {
  const publishers = [...new Set(snapshot.signals.map((signal) => signal.source.publisher))].sort();
  elements.source.insertAdjacentHTML('beforeend', publishers.map((publisher) => `<option value="${escapeHtml(publisher)}">${escapeHtml(publisher)}</option>`).join(''));
}

async function loadSignals() {
  setState('loading');
  elements.empty.hidden = true;
  try {
    if (new URLSearchParams(window.location.search).get('simulate') === 'error') throw new Error('Simulación de error');
    const response = await fetch(fixtureUrl);
    if (!response.ok) throw new Error(`Fixture unavailable: ${response.status}`);
    snapshot = await response.json();
    if (!Array.isArray(snapshot.signals)) throw new Error('Invalid snapshot contract');
    populateSources();
    elements.fixtureDate.textContent = `Datos del ${new Intl.DateTimeFormat('es', { dateStyle: 'medium' }).format(new Date(`${snapshot.query.date}T12:00:00`))}`;
    setState('ready');
    render();
  } catch {
    setState('error');
  }
}

elements.search.addEventListener('input', render);
elements.source.addEventListener('change', render);
document.querySelectorAll('#filter-panel input').forEach((input) => input.addEventListener('change', render));
elements.filterButton.addEventListener('click', () => {
  const willOpen = elements.filterPanel.hidden;
  elements.filterPanel.hidden = !willOpen;
  elements.filterButton.setAttribute('aria-expanded', String(willOpen));
});
elements.toolbarToggle.addEventListener('click', () => {
  const willShow = elements.toolbar.hidden;
  elements.toolbar.hidden = !willShow;
  elements.toolbarToggle.setAttribute('aria-expanded', String(willShow));
  elements.toolbarToggle.querySelector('span').textContent = willShow ? 'Ocultar controles' : 'Mostrar controles';
});
elements.clear.addEventListener('click', () => {
  elements.search.value = '';
  elements.source.value = '';
  document.querySelectorAll('#filter-panel input').forEach((input) => { input.checked = true; });
  render();
});
elements.retry.addEventListener('click', loadSignals);

loadSignals();
