console.log('script.js підключено');

const notes = [
  { title: 'Купити продукти', category: 'Особисте' },
  { title: 'Підготувати звіт', category: 'Робота' },
  { title: 'Записатися до лікаря', category: 'Особисте' },
  { title: 'Вивчити JavaScript', category: 'Навчання' },
  { title: 'Зробити практикум 6', category: 'Навчання' }
];

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