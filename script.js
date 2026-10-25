/* 
 Міграція інтерактивного інтерфейсу на фреймворк Vue 3.
Обгрунтування вибору:
Для реалізації обрано фреймворк Vue 3. Основні причини вибору:
1. Легке підключення через CDN без необхідності складного збирання (Babel/Webpack).
2. Декларативний та зрозумілий синтаксис шаблонів.
3. Вбудована реактивність — заміна застарілих ручних маніпуляцій з DOM (querySelector, innerHTML) на автоматичне перемалювання інтерфейсу при зміні стану (data).
*/

console.log('script.js підключено');

const categoryNamesMap = {
  'cat-personal': 'Особисте',
  'cat-important': 'Важливе',
  'cat-password': 'Пароль / Доступ'
};

// Отримання елементів форми
const noteForm = document.querySelector('#note-form');
const noteTitleInput = document.querySelector('#note-title');
const noteCategoryInput = document.querySelector('#note-category');
const notePasswordInput = document.querySelector('#note-password');
const noteContentInput = document.querySelector('#note-content');
const charCounter = document.querySelector('#char-counter');

// Збереження списку нотаток у localStorage
function saveToLocalStorage(items) {
  try {
    localStorage.setItem('appNotes', JSON.stringify(items));
  } catch (error) {
    console.error('Помилка запису в localStorage:', error);
  }
}

// Завантаження списку нотаток із localStorage
function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem('appNotes');
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

/**
 * Відкриває з'єднання з базою даних IndexedDB ('NotesDB', v1).
 * Створює objectStore 'notes' при первинній ініціалізації.
 * Містить обробку помилок для режиму приватного перегляду.
 */
function openDB() {
  return new Promise((resolve, reject) => {
    try {
      if (!window.indexedDB) {
        throw new Error('Ваш браузер не підтримує IndexedDB або вона вимкнена.');
      }

    // Відкриваємо базу NotesDB з версією 1
    const request = indexedDB.open('NotesDB', 1);

    // Створення object store при першому запуску або зміні версії
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      // Перевіряємо, чи ще немає сховища 'notes', щоб не створити дублікат
      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
    };

    // Успішне відкриття бази
    request.onsuccess = () => resolve(request.result);

    // Якщо IndexedDB заблоковано (наприклад, у режимі приватного перегляду / Incognito)
      request.onerror = () => {
        const errMessage = 'Не вдалося відкрити IndexedDB. Можливо, увімкнено режим приватного перегляду або доступ заблоковано.';
        console.error(errMessage, request.error);
        reject(new Error(errMessage));
      };
    } catch (error) {
      console.error('Помилка ініціалізації IndexedDB:', error);
      reject(error);
    }
  });
}

// Додавання або оновлення нотатки (put працює і для створення, і для редагування)
async function saveNoteToDB(item) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    tx.objectStore('notes').put(item);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// Отримання всіх нотаток зі сховища (readonly)
async function getAllNotesFromDB() {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readonly');
    const request = tx.objectStore('notes').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Видалення нотатки за її id (readwrite)
async function deleteNoteFromDB(id) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('notes', 'readwrite');
    const store = tx.objectStore('notes');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Одноразова міграція даних із localStorage в IndexedDB
async function migrateLocalStorageToIDB() {
  try {
    const isMigrated = localStorage.getItem('isMigrated');

    // Якщо міграція вже відбулася раніше — виходимо
    if (isMigrated === 'true') {
      return;
    }

    const localData = loadFromLocalStorage();
    const idbData = await getAllNotesFromDB();

    // Якщо у localStorage є дані, а в IndexedDB порожньо
    if (localData.length > 0 && idbData.length === 0) {
      console.log('Початок міграції даних із localStorage в IndexedDB...');
      
      for (const item of localData) {
        await saveNoteToDB(item);
      }
      
      console.log('Міграцію успішно завершено!');
    }

    // Позначаємо прапорцем, щоб міграція не повторювалася
    localStorage.setItem('isMigrated', 'true');
  } catch (error) {
    console.error('Помилка під час міграції даних:', error);
  }
}



// Вибір контейнера та елемента підсумку
// const notesContainer = document.querySelector('#notes-list');
// const notesCountElement = document.querySelector('#notes-count');

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


// Обробка відправки форми з прив'язкою до Vue та localStorage 
if (noteForm) {
  noteForm.addEventListener('submit', function(event) {
    event.preventDefault();

    const title = noteTitleInput.value.trim();
    const categoryClass = noteCategoryInput ? noteCategoryInput.value : 'cat-personal';
    const categoryName = noteCategoryInput ? noteCategoryInput.options[noteCategoryInput.selectedIndex].text : 'Особисте';
    const password = notePasswordInput ? notePasswordInput.value.trim() : '';
    const content = noteContentInput.value.trim();

    if (!title || !content) return;

    if (password) {
      checkPasswordLength(password);
    }

    if (password && !isStrongPassword(password)) {
      alert('Помилка: Пароль занадто короткий! Має бути не менше 8 символів.');
      return;
    }

    // Унікальний ID для уникнення дублювання
    const uniqueId = 'note_' + Date.now() + '_' + Math.floor(Math.random() * 1000);

    const newNote = {
      id: uniqueId,
      title: title,
      category: categoryClass,
      categoryName: categoryName,
      excerpt: password ? `${content} (Пароль: ${password})` : content
    };

    if (vueApp) {
      vueApp.saveNote(newNote);
    }

    noteForm.reset();

    if (charCounter) {
      charCounter.textContent = '0 / 300';
      charCounter.classList.remove('near-limit');
    }

    if (charProgress) {
      charProgress.style.width = '0%';
      charProgress.classList.remove('near-limit');
    }
  });
}

// Динамічний обчислювальний індикатор прогресу на основі даних
const charProgress = document.querySelector('#char-progress');

if (noteContentInput && charCounter) {
  noteContentInput.addEventListener('input', function() {
    // Отримуємо реальні дані з об'єкта форми
    const currentLength = noteContentInput.value.length;
    const maxLength = parseInt(noteContentInput.getAttribute('maxlength')) || 300;

    // Розраховуємо відсоток заповнення на основі реальних даних
    const percentage = Math.min((currentLength / maxLength) * 100, 100);

    // Оновлюємо ширину CSS-індикатора (плавно анімується через transition)
    if (charProgress) {
      charProgress.style.width = `${percentage}%`;

      // Динамічна зміна класу при наближенні до ліміту (понад 250 символів)
      charProgress.classList.toggle('near-limit', currentLength >= 250);
    }

    // Оновлюємо текстовий лічильник
    charCounter.textContent = `${currentLength} / ${maxLength}`;
    charCounter.classList.toggle('near-limit', currentLength >= 250);
  });
}

// Перегляд нотатки при кліку (делегування подій)
const noteDetails = document.querySelector('#note-details');


// Посилання на API з мого варіанта 13
const API_URL = 'https://jsonplaceholder.typicode.com/posts?userId=1';

// Отримання елементів статусу та помилки
const loadingStatus = document.querySelector('#loading-status');
const errorMessage = document.querySelector('#error-message');

/* Закоментовано застарілу функцію loadNotes(), оскільки її логіку перенесено в метод loadNotes() всередині Vue
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

    // Реактивно оновлюємо стан Vue-додатка та зберігаємо в localStorage
    vueApp.notes = fetchedNotes;
    saveToLocalStorage(fetchedNotes);

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
*/

// Викликаємо функцію для перевірки
// loadNotes();

// Кнопка для мануального виклику loadNotes()
const refreshBtn = document.querySelector('#refresh-btn');

if (refreshBtn) {
  refreshBtn.addEventListener('click', () => {
    if (vueApp && vueApp.loadNotes) {
      vueApp.loadNotes();
    }
  });
}

// Створення окремого компонента NoteCard , Дочірній компонент NoteCard надсилає подію $emit батькові
const NoteCard = {
  props: ['id', 'title', 'excerpt' , 'category', 'categoryName'],
  data() {
    return {
      // Локальний прапорець стану для кожної окремої картки
      isExpanded: false
    };
  },
  methods: {
    handleCardClick() {
      // Перемикаємо стан розгортання при кліку
      this.isExpanded = !this.isExpanded;
      this.$emit('select'); // передаємо сигнал про вибір картки
    },
    deleteCard(event) {
      // Зупиняємо спливання події, щоб НЕ спрацьовувало розгортання/згортання картки
      event.stopPropagation();
      // Передаємо подію видалення батьківському компоненту Vue
      this.$emit('remove', this.id);
    },
    // Новий метод для передачі події редагування
    editCard(event) {
      event.stopPropagation();
      this.$emit('edit', { 
        id: this.id, 
        title: this.title, 
        excerpt: this.excerpt,
        category: this.category,
        categoryName: this.categoryName
      });
    }
  },
  template: `
    <article 
      :class="['note-card', category || 'cat-personal']" 
      @click="handleCardClick" 
      :style="{
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxSizing: 'border-box',
        height: isExpanded ? 'auto' : '230px',
        maxHeight: isExpanded ? '600px' : '230px',
        padding: '14px',
        overflow: 'hidden',
        transition: 'max-height 0.4s ease-in-out, transform 0.3s ease, box-shadow 0.3s ease'
      }">

      <div style="overflow: hidden;">
        <!-- Динамічний бейдж категорії -->
        <span class="category-badge">{{ categoryName || 'НОТАТКА' }}</span>
        
        <h3 style="margin: 8px 0 6px 0; font-size: 1rem; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis;" :title="title">
          {{ title }}
        </h3>

        <p v-if="!isExpanded" style="color: #9ca3af; font-size: 0.85rem; line-height: 1.35; margin: 0;">
          {{ excerpt.length > 35 ? excerpt.substring(0, 35) + '...' : excerpt }}
        </p>
        <p v-else style="color: #ffffff; font-size: 0.88rem; line-height: 1.4; margin: 0; word-break: break-word;">
          {{ excerpt }}
        </p>
      </div>

      <div style="margin-top: 10px; display: flex; gap: 8px; align-items: center;">
        <button 
          @click="editCard" 
          style="background-color: #10b981 !important; color: #064e3b !important; border: none !important; padding: 5px 10px !important; border-radius: 6px !important; cursor: pointer !important; font-weight: 700 !important; font-size: 0.78rem !important;">
          Редагувати
        </button>

        <button 
          @click="deleteCard" 
          style="background-color: rgba(239, 68, 68, 0.15) !important; color: #f87171 !important; border: 1px solid rgba(239, 68, 68, 0.3) !important; padding: 5px 10px !important; border-radius: 6px !important; cursor: pointer !important; font-weight: 600 !important; font-size: 0.78rem !important;">
          Видалити
        </button>
      </div>
    </article>
  `
};
// Оновлений об'єкт Vue
const app = Vue.createApp({
  components: {
    'note-card': NoteCard
  },
  data() {
    return {
      notes: [],
      selectedNote: null,
      isLoading: false,
      errorMessage: ''
    };
  },
  methods: {

    async refreshNotesFromDB() {
      try {
        this.notes = await getAllNotesFromDB();
        saveToLocalStorage(this.notes);
      } catch (err) {
        console.error('Помилка отримання з IndexedDB:', err);
        // Виводимо зрозуміле повідомлення користувачеві на екрані
        this.errorMessage = 'IndexedDB недоступна у вашому браузері або режимі перегляду.';
      }
    },

    // 2. Метод збереження (додавання або редагування)
    async saveNote(noteData) {
      try {
        await saveNoteToDB(noteData);      // Зберігаємо в IndexedDB
        await this.refreshNotesFromDB(); // Перемальовуємо та дублюємо в localStorage
      } catch (error) {
        console.error('Помилка збереження в IndexedDB:', error);
      }
    },

    // 3. Метод видалення
    async deleteNote(id) {
       try {
         await deleteNoteFromDB(id);
         await this.refreshNotesFromDB(); // Перемальовуємо та дублюємо в localStorage
       } catch (err) {
         console.error('Помилка видалення:', err);
       }
    },

    // Метод редагування нотатки
    async editNote(note) {
      const newTitle = prompt('Введіть новий заголовок:', note.title);
      if (newTitle === null) return; // Натиснули скасування

      const newContent = prompt('Введіть новий текст нотатки:', note.excerpt);
      if (newContent === null) return;

      const updatedNote = {
        id: note.id,
        title: newTitle.trim() || note.title,
        category: note.category || 'cat-personal',
        categoryName: note.categoryName || 'Особисте',
        excerpt: newContent.trim() || note.excerpt
      };

      // saveNoteToDB використовує .put(), тому запис з однаковим ID ОНОВИТЬСЯ, а не задублюється
      await this.saveNote(updatedNote);
    },

    // 4. ДОДАТИ: метод вибору нотатки для детального перегляду
    selectNote(note) {
      this.selectedNote = note;
      const detailsBox = document.querySelector('#note-details');
      if (detailsBox) {
         detailsBox.innerHTML = `
           <h2>Перегляд нотатки</h2>
           <article>
             <h3>${note.title}</h3>
             <p><strong>Категорія:</strong> ${note.categoryName || 'Загальне'}</p>
             <p style="margin-top: 10px; line-height: 1.5;">${note.excerpt}</p>
           </article>
         `;
      }
    },

    // 5. Завантаження нотаток із зовнішнього API (якщо потрібно заповнити нотатки з мережі)
    async loadNotes() {
      try {
        this.isLoading = true;
        this.errorMessage = '';
        const response = await fetch('https://jsonplaceholder.typicode.com/posts?userId=1');
        if (!response.ok) throw new Error(`Сервер відповів кодом ${response.status}`);
        
        const data = await response.json();
        const fetchedNotes = data.map(item => ({
          id: item.id.toString(),
          title: item.title,
          category: 'cat-personal',
          categoryName: 'Особисте',
          excerpt: item.body
        }));

        // Зберігаємо кожну нотатку з API в IndexedDB
        for (const note of fetchedNotes) {
          await saveNoteToDB(note);
        }
 
        // Оновлюємо стан списку
        await this.refreshNotesFromDB();
      } catch (error) {
        console.error('Помилка завантаження з API:', error);
        // Якщо немає мережі або помилка API, просто показуємо локальні нотатки з IndexedDB
        await this.refreshNotesFromDB();
        if (this.notes.length === 0) {
          this.errorMessage = 'Нотатки недоступні офлайн';
        }
      } finally {
        this.isLoading = false;
      }
    }
  },

  // Автоматичний запуск при старті додатка
  async mounted() {
    // Спочатку виконуємо одноразову міграцію з localStorage в IndexedDB (якщо є що мігрувати)
    await migrateLocalStorageToIDB();

    // Завантажуємо нотатки з IndexedDB у реактивний стан Vue
    await this.refreshNotesFromDB();

    // Якщо база виявилася повністю порожньою — додаємо дефолтні нотатки
    if (this.notes.length === 0) {
      const defaultNotes = [
        { 
          id: '1', 
          title: 'План завдань на тиждень', 
          category: 'cat-important',
          categoryName: 'Важливе',
          excerpt: '1. Завершити практикум з HTML. 2. Підготуватися до тестування.' 
        },
        { 
          id: '2', 
          title: 'Список покупок', 
          category: 'cat-personal',
          categoryName: 'Особисте',
          excerpt: 'Молоко, хліб, яблука, кава, сир, масло.' 
        }
      ];

      for (const note of defaultNotes) {
        await saveNoteToDB(note);
      }
      await this.refreshNotesFromDB();
    }
  }
});
  
// Зберігаємо екземпляр додатка для асинхронного завантаження
const vueApp = app.mount('#app');

