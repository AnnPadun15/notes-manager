/* 
 Міграція інтерактивного інтерфейсу на фреймворк Vue 3.
Обгрунтування вибору:
Для реалізації обрано фреймворк Vue 3. Основні причини вибору:
1. Легке підключення через CDN без необхідності складного збирання (Babel/Webpack).
2. Декларативний та зрозумілий синтаксис шаблонів.
3. Вбудована реактивність — заміна застарілих ручних маніпуляцій з DOM (querySelector, innerHTML) на автоматичне перемалювання інтерфейсу при зміні стану (data).
*/

console.log('script.js підключено');

/* 
ПРИБРАНО РУЧНИЙ DOM-КОД ТА НАЛАШТОВАНО АВТОМАТИЧНЕ ОНОВЛЕННЯ
Усі маніпуляції з DOM (querySelector, innerHTML, append) замінено на реактивний
стан Vue 3. При зміні data() список перемальовується фреймворком автоматично.
*/

// Очищення статичних картка з HTML (з практикуму 2)
//const staticCards = document.querySelectorAll('#notes-list article');
//staticCards.forEach(card => card.remove());

const categoryNamesMap = {
  'cat-personal': 'Особисте',
  'cat-important': 'Важливе',
  'cat-password': 'Пароль / Доступ'
};

/* 
Закоментовано (дані перенесено в реактивний стан Vue data()):
// Оновлені дані з id та категоріями (відповідно до CSS-класів cat-personal, cat-important, cat-password)
const notes = [
  { 
    id: '1', 
    title: 'План завдань на тиждень', 
    category: 'cat-important', 
    categoryName: 'Важливе', 
    excerpt: '1. Завершити практикум з HTML. 2. Підготуватися до тестування...' 
  },
  { 
    id: '2', 
    title: 'Список покупок', 
    category: 'cat-personal', 
    categoryName: 'Особисте', 
    excerpt: 'Молоко, хліб, яблука, кава, сир...' 
  }
  ];
*/

// Отримання елементів форми
const noteForm = document.querySelector('#note-form');
const noteTitleInput = document.querySelector('#note-title');
const noteCategoryInput = document.querySelector('#note-category');
const notePasswordInput = document.querySelector('#note-password');
const noteContentInput = document.querySelector('#note-content');
const charCounter = document.querySelector('#char-counter');

// Вибір контейнера та елемента підсумку
const notesContainer = document.querySelector('#notes-list');
const notesCountElement = document.querySelector('#notes-count');

// Функція підрахунку нотаток у кожній категорії за допомогою циклу for
function countNotesByCategory(notesArray) {
  const categoryCounts = {};

  for (let i = 0; i < notesArray.length; i++) {
    const category = notesArray[i].category || notesArray[i].category;
    
    if (categoryCounts[category]) {
      categoryCounts[category] += 1;
    } else {
      categoryCounts[category] = 1;
    }
  }

  console.log('Кількість нотаток за категоріями:', categoryCounts);
}

// Виклик функції
// countNotesByCategory(notes);

// Функція перевірки пароля через умовну конструкцію if/else
// Приймає пароль і виводить у консоль попередження або повідомлення про успіх
function checkPasswordLength(password) {
  if (password.length < 8) {
    console.warn('Попередження: Пароль занадто короткий! Має бути не менше 8 символів.');
  } else {
    console.log('Пароль має достатню довжину.');
  }
}

// Стрілкова функція перевірки надійності пароля
// Повертає true, якщо довжина пароля >= 8, і false, якщо менше
const isStrongPassword = password => password.length >= 8;

/* Закоментовано ручний рендер DOM, оскільки рендеринг перенесено на Vue
// Функція динамічного рендеру нотаток на сторінку
function renderNotes(notesArray) {
  // Очищаємо вміст контейнера перед виводом нових елементів
  notesContainer.innerHTML = '';
 
  notesArray.forEach(note => {
    const card = document.createElement('article');

    card.dataset.id = note.id;
    card.classList.add('note-card', note.category);

    const badge = document.createElement('span');
    badge.classList.add('category-badge');
    badge.textContent = note.categoryName || 'Нотатка';

    const title = document.createElement('h3');
    title.textContent = note.title;

    const excerpt = document.createElement('p');
    excerpt.textContent = note.excerpt;

    const link = document.createElement('a');
    link.href = `#note-${note.id}`;
    link.textContent = 'Читати повністю';

    card.append(badge, title, excerpt, link);

    notesContainer.append(card);
  });

  notesCountElement.textContent = `Усього нотаток: ${notesArray.length}`;
}

renderNotes(notes);
*/

/* Закоментовано старий обробник форми
// Обробка відправки форми
noteForm.addEventListener('submit', function(event) {
    // Скасовуємо стандартну поведінку відправки форми (перезавантаження)
    event.preventDefault();
    // Зчитуємо значення полів
    const title = noteTitleInput.value.trim();
    const categoryClass = noteCategoryInput ? noteCategoryInput.value : 'cat-personal';
    const categoryName = noteCategoryInput ? noteCategoryInput.options[noteCategoryInput.selectedIndex].text : 'Особисте';
    const password = notePasswordInput ? notePasswordInput.value.trim() : '';
    const content = noteContentInput.value.trim();

    if (!title || !content) return;

    // Перевіряємо довжину пароля та блокуємо збереження, якщо пароль занадто короткий
    if (password && password.length < 8) {
    alert('Помилка: Пароль занадто короткий! Має бути не менше 8 символів.');
    return;
    }

    // Створення нового об'єкта та додавання в масив
    const newNote = {
        id: Date.now().toString(), // Унікальний id
        title: title,
        category: categoryClass,
        categoryName: categoryName,
        excerpt: password ? `${content} (Пароль: ${password})` : content
    };

    notes.push(newNote);
    renderNotes(notes);

    noteForm.reset();
    charCounter.textContent = '0 / 300';
    charCounter.classList.remove('near-limit');
});
*/

// Додаткова валідація — живий лічильник символів
if (noteContentInput && charCounter) {
   noteContentInput.addEventListener('input', function() {
     const currentLength = noteContentInput.value.length;
     const maxLength = 300;

     // Оновлюємо текст лічильника
     charCounter.textContent = `${currentLength} / ${maxLength}`;

     // Змінюємо колір/стиль, якщо наближаємося до ліміту (понад 250 символів)
     charCounter.classList.toggle('near-limit', currentLength >= 250);
   });
}

// Перегляд нотатки при кліку (делегування подій)
const noteDetails = document.querySelector('#note-details');

/* Закоментовано старий обробник для детального перегляду
notesContainer.addEventListener('click', function(event) {
    // Шукаємо найближчий елемент <article> із data-id
    const card = event.target.closest('article[data-id]');
    
    if (!card) return;

    // Зчитуємо id нотатки
    const noteId = card.dataset.id;
    
    // Знаходимо відповідну нотатку в масиві
    const foundNote = notes.find(n => String(n.id) === String(noteId));

    if (foundNote) {
        // Виводимо повну інформацію у блок aside
        noteDetails.innerHTML = `
            <h2>Перегляд нотатки</h2>
            <article>
                <h3>${foundNote.title}</h3>
                <p><strong>Категорія:</strong> ${foundNote.categoryName || categoryNamesMap[foundNote.category] || foundNote.category}</p>
                <p>${foundNote.excerpt}</p>
            </article>
        `;
    }
});
*/

// Посилання на API з мого варіанта 13
const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=1';

// Отримання елементів статусу та помилки
const loadingStatus = document.querySelector('#loading-status');
const errorMessage = document.querySelector('#error-message');

// Асинхронна функція для завантаження нотаток
async function loadNotes() {
  // Перед запитом показуємо текст завантаження і ховаємо старі помилки
  if (loadingStatus) loadingStatus.style.display = 'block';
  if (errorMessage) errorMessage.style.display = 'none';

  try {
    // Виконуємо fetch і чекаємо на відповідь
    const response = await fetch(API_URL);

    // Перевірка HTTP-статусу (200-299)
    if (!response.ok) {
      throw new Error(`Сервер відповів кодом ${response.status}`);
    }

    // Розбір тіла відповіді як JSON
    const data = await response.json();

    // Трансформуємо дані з API під нашу структуру
    const fetchedNotes = data.map(item => ({
      id: item.id.toString(),
      title: item.title,
      category: 'cat-personal', // за замовчуванням
      categoryName: 'Особисте',
      excerpt: item.body
    }));

    // Реактивно оновлюємо стан Vue-додатка без виклику ручного renderNotes()
    vueApp.notes = fetchedNotes;

  } catch (error) {
    // Деталі в консоль, а користувачу — зрозуміле повідомлення
    console.error('Помилка завантаження:', error);
    if (errorMessage) {
      errorMessage.textContent = 'Нотатки недоступні офлайн';
      errorMessage.style.display = 'block';
    }
  } finally {
    // Ховаємо завантаження в будь-якому випадку (успіх чи помилка)
    if (loadingStatus) loadingStatus.style.display = 'none';
  }
}

// Викликаємо функцію для перевірки
// loadNotes();

// Кнопка для мануального виклику loadNotes()
const refreshBtn = document.querySelector('#refresh-btn');

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    loadNotes();
  });
}

// Створення окремого компонента NoteCard , Дочірній компонент NoteCard надсилає подію $emit батькові
const NoteCard = {
  props: ['title', 'excerpt', 'isExpanded'],
  emits: ['toggle-expand'],
  methods: {
    handleCardClick() {
      // Викликаємо $emit для передачі події у батьківський компонент
      this.$emit('toggle-expand');
    }
  },
  template: `
    <article class="note-card cat-personal" @click="handleCardClick" style="cursor: pointer;">
      <span class="category-badge">Нотатка</span>
      <h3>{{ title }}</h3>
      <p v-if="!isExpanded">{{ excerpt.substring(0, 35) }}...</p>
      <p v-else>{{ excerpt }}</p>
    </article>
  `
};
// Створення та конфігурація додатка Vue , Батьківський додаток керує станом розгорнутої картки
const app = Vue.createApp({
  components: {
    'note-card': NoteCard
  },
  data() {
    return {
      // ID розгорнутої нотатки у батьківському стані
      expandedNoteId: null,
      notes: [
        { 
          id: '1', 
          title: 'План завдань на тиждень', 
          category: 'cat-important',
          categoryName: 'Важливе',
          excerpt: '1. Завершити практикум з HTML. 2. Підготуватися до тестування з семантики. 3. Оформити та закоммітити проєкт у Git.' 
        },
        { 
          id: '2', 
          title: 'Список покупок', 
          category: 'cat-personal',
          categoryName: 'Особисте',
          excerpt: 'Молоко, хліб, яблука, кава, сир, масло, овочі на тиждень.' 
        }
      ]
    };
  },
  methods: {
    // Батьківський метод оновлює стан expandedNoteId новим значенням
    toggleNote(id) {
      this.expandedNoteId = this.expandedNoteId === id ? null : id;
    }
  }
});

// Зберігаємо екземпляр додатка для асинхронного завантаження
const vueApp = app.mount('#app');
