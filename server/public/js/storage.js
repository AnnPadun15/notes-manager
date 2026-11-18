function openDB() {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('Браузер не підтримує IndexedDB.'));
      return;
    }

    const request = indexedDB.open('NotesDB', 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('notes')) {
        db.createObjectStore('notes', { keyPath: 'id' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveNoteToDB(note) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', 'readwrite');
    transaction.objectStore('notes').put(note);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }));
}

function getAllNotesFromDB() {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const request = db.transaction('notes', 'readonly')
      .objectStore('notes')
      .getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function deleteNoteFromDB(id) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const transaction = db.transaction('notes', 'readwrite');
    transaction.objectStore('notes').delete(id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  }));
}

async function migrateLocalStorageToIDB() {
  try {
    if (localStorage.getItem('isMigrated') === 'true') return;

    const saved = localStorage.getItem('appNotes');
    const localNotes = saved ? JSON.parse(saved) : [];
    const dbNotes = await getAllNotesFromDB();

    if (localNotes.length > 0 && dbNotes.length === 0) {
      for (const note of localNotes) {
        await saveNoteToDB(note);
      }
    }

    localStorage.setItem('isMigrated', 'true');
  } catch (error) {
    console.error('Помилка міграції нотаток:', error);
  }
}