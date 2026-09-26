console.log('script.js підключено');

// Очищення статичних картка з HTML (з практикуму 2)
const staticCards = document.querySelectorAll('#notes-list article');
staticCards.forEach(card => card.remove());

// Оновлені дані з id та категоріями для Кроку 6
const notes = [
  { id: 1, title: 'Купити продукти', category: 'Особисте' },
  { id: 2, title: 'Підготувати звіт', category: 'Робота' },
  { id: 3, title: 'Записатися до лікаря', category: 'Особисте' },
  { id: 4, title: 'Вивчити JavaScript', category: 'Навчання' },
  { id: 5, title: 'Зробити практикум 7', category: 'Навчання' }
];

// Вибір контейнера та елемента підсумку
const notesContainer = document.querySelector('#notes-list');
const notesCountElement = document.querySelector('#notes-count');

// Функція підрахунку нотаток у кожній категорії за допомогою циклу for
function countNotesByCategory(notesArray) {
  const categoryCounts = {};

  for (let i = 0; i < notesArray.length; i++) {
    const category = notesArray[i].category;
    
    if (categoryCounts[category]) {
      categoryCounts[category] += 1;
    } else {
      categoryCounts[category] = 1;
    }
  }

  console.log('Кількість нотаток за категоріями:', categoryCounts);
}

// Виклик функції
countNotesByCategory(notes);

// Функція перевірки пароля через умовну конструкцію if/else
// Приймає пароль і виводить у консоль попередження або повідомлення про успіх
function checkPasswordLength(password) {
  if (password.length < 8) {
    console.warn('Попередження: Пароль занадто короткий! Має бути не менше 8 символів.');
  } else {
    console.log('Пароль має достатню довжину.');
  }
}

// Тестуємо умовну конструкцію з коротким та довгим паролем
checkPasswordLength('12345');     // виведе попередження
checkPasswordLength('qwerty1234'); // виведе, що пароль ОК

// Стрілкова функція перевірки надійності пароля
// Повертає true, якщо довжина пароля >= 8, і false, якщо менше
const isStrongPassword = password => password.length >= 8;

// Перевірка стрілкової функції через console.log
const userPassword = 'mySecretPassword123';
console.log(`Чи є пароль "${userPassword}" надійним?`, isStrongPassword(userPassword));

// Функція динамічного рендеру нотаток на сторінку
function renderNotes(notesArray) {
  // Очищаємо вміст контейнера перед виводом нових елементів
  notesContainer.innerHTML = '';
 
  notesArray.forEach(note => {
    const card = document.createElement('article');

    card.dataset.id = note.id;
    card.classList.add('note-card', `category-${note.category.toLowerCase()}`);

    const title = document.createElement('h3');
    title.textContent = note.title;

    const category = document.createElement('p');
    category.textContent = `Категорія: ${note.category}`;

    card.append(title, category);

    notesContainer.append(card);
  });

  notesCountElement.textContent = `Усього нотаток: ${notesArray.length}`;
}

renderNotes(notes);
