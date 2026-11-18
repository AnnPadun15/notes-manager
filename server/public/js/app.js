const appView = document.querySelector('#app');

const categoryNames = {
  'cat-personal': 'Особисте',
  'cat-important': 'Важливе',
  'cat-password': 'Пароль / Доступ'
};

const API_URL = '/api/notes';

function showTemplate(templateId) {
  const template = document.querySelector(`#${templateId}`);

  if (!template) {
    throw new Error(`Не знайдено шаблон #${templateId}`);
  }

  appView.replaceChildren(template.content.cloneNode(true));
}

async function navigate(targetHash) {
  const currentHash = window.location.hash || '#/';
  const currentScrollY = window.scrollY;

  if (currentHash === targetHash) {
    await render();
    window.scrollTo(0, currentScrollY);
    return;
  }

  // Зберігаємо позицію поточного маршруту для кнопки «Назад».
  window.history.replaceState(
    { ...(window.history.state || {}), scrollY: currentScrollY },
    '',
    window.location.href
  );

  // URL залишається hash-маршрутом, а pushState не виконує перехід до якоря.
  window.history.pushState({ scrollY: currentScrollY }, '', targetHash);

  await render();
  window.scrollTo(0, currentScrollY);
}

function createNoteCard(note, isSelected = false) {
  const card = document.createElement('article');
  card.className = `note-card ${note.category || 'cat-personal'}`;

  if (isSelected) {
    card.classList.add('selected', 'expanded');
  }

  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';

  const badge = document.createElement('span');
  badge.className = 'category-badge';
  badge.textContent =
    note.categoryName || categoryNames[note.category] || 'НОТАТКА';

  const title = document.createElement('h3');
  const titleLink = document.createElement('a');
  titleLink.href = `#/notes/${encodeURIComponent(note.id)}`;
  titleLink.dataset.link = '';
  titleLink.textContent = note.title || 'Без заголовка';
  title.append(titleLink);

  const excerptWrapper = document.createElement('div');
  excerptWrapper.className = 'excerpt-wrapper';

  const shortText = document.createElement('p');
  shortText.className = 'short-text';
  shortText.textContent =
    (note.excerpt || '').length > 70
      ? `${note.excerpt.substring(0, 70)}...`
      : note.excerpt || '';
  shortText.hidden = isSelected;

  const fullText = document.createElement('p');
  fullText.className = 'full-text';
  fullText.textContent = note.excerpt || '';
  fullText.hidden = !isSelected;

  excerptWrapper.append(shortText, fullText);

  const actions = document.createElement('div');
  actions.className = 'card-actions';
  actions.hidden = !isSelected;

  const editButton = document.createElement('button');
  editButton.type = 'button';
  editButton.className = 'edit-button';
  editButton.textContent = 'Редагувати';
  editButton.addEventListener('click', (event) => {
    event.stopPropagation();
    renderEditForm(note);
  });

  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'delete-button';
  deleteButton.textContent = 'Видалити';
  deleteButton.addEventListener('click', (event) => {
    event.stopPropagation();
    deleteSelectedNote(note.id);
  });

  actions.append(editButton, deleteButton);
  cardContent.append(badge, title, excerptWrapper, actions);
  card.append(cardContent);

  card.addEventListener('click', (event) => {
    if (event.target.closest('a, button')) return;

    const targetHash = `#/notes/${encodeURIComponent(note.id)}`;

    if (window.location.hash === targetHash) {
      const expanded = card.classList.toggle('expanded');
      card.classList.toggle('selected', expanded);
      shortText.hidden = expanded;
      fullText.hidden = !expanded;
      actions.hidden = !expanded;
    } else {
      navigate(targetHash);
    }
  });

  return card;
}

async function renderNotesList() {
  await renderNotesPage(null);
}

async function renderNoteDetails(params) {
  await renderNotesPage(params.id);
}

async function renderNotesPage(selectedId) {
  let notes;

  try {
    notes = await getAllNotesFromDB();
  } catch (error) {
    console.error('Не вдалося завантажити нотатки:', error);
    showTemplate('notes-template');

    const status = appView.querySelector('#notes-status');
    if (status) {
      status.textContent = 'Не вдалося завантажити нотатки зі сховища.';
    }
    return;
  }

  const selectedNote = selectedId === null
    ? null
    : notes.find((note) => String(note.id) === String(selectedId));

  if (selectedId !== null && !selectedNote) {
    renderNotFound();
    return;
  }

  showTemplate('notes-template');

  const list = appView.querySelector('#notes-list');
  const count = appView.querySelector('#notes-count');
  const status = appView.querySelector('#notes-status');
  const refreshButton = appView.querySelector('#refresh-btn');
  const details = appView.querySelector('#note-details');

  count.textContent = `Усього нотаток: ${notes.length}`;

  if (notes.length === 0 && status) {
    status.textContent = 'Нотаток поки немає. Створіть першу через меню.';
  }

  for (const note of notes) {
    const isSelected =
      selectedNote !== null &&
      String(note.id) === String(selectedNote.id);

    list.append(createNoteCard(note, isSelected));
  }

  if (selectedNote) {
    showNoteDetails(details, selectedNote);
  }

  refreshButton.addEventListener('click', async () => {
    refreshButton.disabled = true;
    refreshButton.textContent = 'Завантаження...';

    if (status) status.textContent = '';

    try {
      await loadNotesFromAPI();
      await renderNotesPage(selectedId);
    } catch (error) {
      console.error('Не вдалося завантажити нотатки з API:', error);
      refreshButton.disabled = false;
      refreshButton.textContent = 'Оновити нотатки';

      if (status) {
        status.textContent = 'Не вдалося завантажити нотатки з мережі.';
      }
    }
  });
}

function showNoteDetails(details, note) {
  details.replaceChildren();

  const heading = document.createElement('h2');
  heading.textContent = 'Перегляд нотатки';

  const title = document.createElement('h3');
  title.textContent = note.title || 'Без заголовка';

  const category = document.createElement('p');
  category.textContent =
    `Категорія: ${note.categoryName || categoryNames[note.category] || 'Особисте'}`;

  const content = document.createElement('p');
  content.className = 'detail-content';
  content.textContent = note.excerpt || 'Текст нотатки відсутній.';

  details.append(heading, title, category, content);

  if (note.password) {
    const passwordLabel = document.createElement('label');
    passwordLabel.textContent = 'Пароль:';

    const passwordInput = document.createElement('input');
    passwordInput.type = 'password';
    passwordInput.value = note.password;
    passwordInput.readOnly = true;
    passwordInput.className = 'password-field';

    details.append(passwordLabel, passwordInput);
  }
}

function renderEditForm(note) {
  const details = appView.querySelector('#note-details');

  details.innerHTML = `
    <h2>Редагування нотатки</h2>

    <form id="edit-note-form">
      <label for="edit-title">Заголовок:</label>
      <input id="edit-title" name="title" type="text" required>

      <label for="edit-category">Категорія:</label>
      <select id="edit-category" name="category">
        <option value="cat-personal">Особисте</option>
        <option value="cat-important">Важливе</option>
        <option value="cat-password">Пароль / Доступ</option>
      </select>

      <label for="edit-password">Пароль (якщо потрібен):</label>
      <input
        id="edit-password"
        name="password"
        type="password"
        autocomplete="off"
      >

      <label for="edit-excerpt">Текст нотатки:</label>
      <textarea
        id="edit-excerpt"
        name="excerpt"
        rows="4"
        maxlength="300"
        required
      ></textarea>

      <button type="submit">Зберегти зміни</button>
      <button id="cancel-edit" type="button">Скасувати</button>
    </form>
  `;

  const form = details.querySelector('#edit-note-form');
  form.elements.title.value = note.title || '';
  form.elements.category.value = note.category || 'cat-personal';
  form.elements.password.value = note.password || '';
  form.elements.excerpt.value = note.excerpt || '';

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const category = form.elements.category.value;
    const password = form.elements.password.value.trim();

    if (password && password.length < 8) {
      alert('Пароль має містити щонайменше 8 символів.');
      return;
    }

    try {
      await saveNoteToDB({
        ...note,
        title: form.elements.title.value.trim(),
        category,
        categoryName: categoryNames[category],
        password,
        excerpt: form.elements.excerpt.value.trim()
      });

      await renderNotesPage(note.id);
    } catch (error) {
      console.error('Не вдалося зберегти зміни:', error);
      alert('Не вдалося зберегти зміни нотатки.');
    }
  });

  details.querySelector('#cancel-edit').addEventListener('click', () => {
    renderNotesPage(note.id);
  });
}

async function deleteSelectedNote(id) {
  if (!window.confirm('Видалити цю нотатку?')) return;

  try {
    await deleteNoteFromDB(id);
    await navigate('#/');
  } catch (error) {
    console.error('Не вдалося видалити нотатку:', error);
    alert('Не вдалося видалити нотатку.');
  }
}

async function loadNotesFromAPI() {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`Сервер відповів кодом ${response.status}`);
  }

  const posts = await response.json();

  for (const post of posts) {
    await saveNoteToDB({
      id: String(post.id),
      title: post.title,
      category: post.category,
      categoryName: post.categoryName,
      excerpt: post.text,
      password: ''
    });
  }
}

function renderNewNoteForm() {
  showTemplate('new-note-template');

  const form = appView.querySelector('#note-form');
  const contentInput = appView.querySelector('#note-content');
  const counter = appView.querySelector('#char-counter');
  const progress = appView.querySelector('#char-progress');

  contentInput.addEventListener('input', () => {
    const length = contentInput.value.length;
    const limit = Number(contentInput.maxLength) || 300;

    counter.textContent = `${length} / ${limit}`;
    progress.style.width = `${Math.min((length / limit) * 100, 100)}%`;
    progress.classList.toggle('near-limit', length >= 250);
    counter.classList.toggle('near-limit', length >= 250);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const title = form.elements['note-title'].value.trim();
    const category = form.elements['note-category'].value;
    const password = form.elements['note-password'].value.trim();
    const content = form.elements['note-content'].value.trim();

    if (password && password.length < 8) {
      alert('Пароль має містити щонайменше 8 символів.');
      return;
    }

    const note = {
      id: `note_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title,
      category,
      categoryName: categoryNames[category],
      excerpt: content,
      password
    };

    try {
      await saveNoteToDB(note);
      await navigate('#/');
    } catch (error) {
      console.error('Не вдалося зберегти нотатку:', error);
      alert('Не вдалося зберегти нотатку.');
    }
  });
}

function renderNotFound() {
  appView.innerHTML = `
    <main>
      <h2>Сторінку не знайдено</h2>
      <p>Такого маршруту не існує.</p>
      <a href="#/" data-link>Повернутися на головну</a>
    </main>
    <aside id="note-details"></aside>
  `;
}

// Три hash-маршрути: список, створення та нотатка за id.
const routes = [
  { path: '/', view: renderNotesList },
  { path: '/notes/:id', view: renderNoteDetails },
  { path: '/new', view: renderNewNoteForm }
];

function matchRoute(path) {
  const pathParts = path.split('/').filter(Boolean);

  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);

    if (routeParts.length !== pathParts.length) continue;

    const params = {};
    let isMatch;

    try {
      isMatch = routeParts.every((part, index) => {
        if (part.startsWith(':')) {
          params[part.slice(1)] = decodeURIComponent(pathParts[index]);
          return true;
        }

        return part === pathParts[index];
      });
    } catch {
      return null;
    }

    if (isMatch) {
      return { view: route.view, params };
    }
  }

  return null;
}

async function render() {
  const path = window.location.hash.slice(1) || '/';
  const matchedRoute = matchRoute(path);

  if (!matchedRoute) {
    renderNotFound();
    return;
  }

  await matchedRoute.view(matchedRoute.params);
}

document.addEventListener('click', (event) => {
  const link = event.target.closest('a[data-link]');
  if (!link) return;

  event.preventDefault();
  navigate(link.getAttribute('href'));
});

window.addEventListener('popstate', async (event) => {
  const scrollY = event.state?.scrollY ?? 0;
  await render();
  window.scrollTo(0, scrollY);
});

async function startApp() {
  await migrateLocalStorageToIDB();

  const notes = await getAllNotesFromDB();

  if (notes.length === 0) {
    const defaultNotes = [
      {
        id: '1',
        title: 'План завдань на тиждень',
        category: 'cat-important',
        categoryName: 'Важливе',
        excerpt: 'Завершити практикум з HTML і підготуватися до тестування.',
        password: ''
      },
      {
        id: '2',
        title: 'Список покупок',
        category: 'cat-personal',
        categoryName: 'Особисте',
        excerpt: 'Молоко, хліб, яблука, кава, сир і масло.',
        password: ''
      }
    ];

    for (const note of defaultNotes) {
      await saveNoteToDB(note);
    }
  }

  await render();
}

startApp().catch((error) => {
  console.error('Не вдалося запустити застосунок:', error);
  appView.innerHTML = '<main><h2>Не вдалося запустити застосунок</h2></main>';
});