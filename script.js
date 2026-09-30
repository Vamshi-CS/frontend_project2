const STORAGE_KEY = 'moment-countdown-events-v1';
const categories = {
  birthday: { label: 'Birthday', emoji: '🎂' },
  exam: { label: 'Exam', emoji: '✏️' },
  holiday: { label: 'Holiday', emoji: '✈️' },
  celebration: { label: 'Celebration', emoji: '🎉' },
  other: { label: 'Something lovely', emoji: '✳️' }
};

const grid = document.querySelector('#event-grid');
const emptyState = document.querySelector('#empty-state');
const dialog = document.querySelector('#event-dialog');
const form = document.querySelector('#event-form');
const dateInput = document.querySelector('#event-date');

function readEvents() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter(event => event && event.name && event.date) : [];
  } catch {
    return [];
  }
}

let events = readEvents();

function localDateKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysUntil(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  const target = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

function formatDate(dateString) {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' })
    .format(new Date(year, month - 1, day));
}

function safeText(value) {
  const element = document.createElement('span');
  element.textContent = value;
  return element.innerHTML;
}

function renderEvents() {
  events.sort((a, b) => a.date.localeCompare(b.date));
  grid.innerHTML = events.map((event, index) => {
    const category = categories[event.category] || categories.other;
    const remaining = daysUntil(event.date);
    const countdown = remaining === 0
      ? '<p class="event-today">Today is the day ✳</p>'
      : `<div class="countdown"><span class="count-value">${remaining}</span><span class="count-label">${remaining === 1 ? 'day' : 'days'} to go</span></div>`;
    return `<article class="event-card">
      <div class="card-top"><span class="event-type">${category.label}</span><span class="event-emoji" aria-hidden="true">${category.emoji}</span>
        <button class="card-menu" type="button" data-remove="${safeText(event.id)}" aria-label="Remove ${safeText(event.name)}" title="Remove event">×</button></div>
      <h3 class="event-title">${safeText(event.name)}</h3><p class="event-date">${formatDate(event.date)}</p>${countdown}
      ${event.note ? `<p class="event-note">“${safeText(event.note)}”</p>` : ''}
    </article>`;
  }).join('');
  emptyState.hidden = events.length > 0;
  grid.hidden = events.length === 0;
  document.querySelector('#event-count').textContent = String(events.length).padStart(2, '0');
  grid.querySelectorAll('[data-remove]').forEach(button => {
    button.addEventListener('click', () => {
      events = events.filter(event => event.id !== button.dataset.remove);
      saveEvents();
    });
  });
}

function saveEvents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  renderEvents();
}

function openDialog() {
  dateInput.min = localDateKey(new Date());
  form.reset();
  dialog.showModal();
  document.querySelector('#event-name').focus();
}

document.querySelector('#today').textContent = new Intl.DateTimeFormat(undefined, {
  weekday: 'long', month: 'long', day: 'numeric'
}).format(new Date());
document.querySelector('#year').textContent = new Date().getFullYear();
document.querySelector('#open-form').addEventListener('click', openDialog);
document.querySelector('#add-another').addEventListener('click', openDialog);
document.querySelector('#empty-add').addEventListener('click', openDialog);
document.querySelector('#close-dialog').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target === dialog) dialog.close();
});
form.addEventListener('submit', event => {
  event.preventDefault();
  if (!form.reportValidity()) return;
  const data = new FormData(form);
  events.push({
    id: window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: String(data.get('name')).trim(),
    date: String(data.get('date')),
    category: String(data.get('category')),
    note: String(data.get('note')).trim()
  });
  saveEvents();
  dialog.close();
});

renderEvents();
setInterval(renderEvents, 60_000);
