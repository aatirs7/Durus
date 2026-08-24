/*
  The offline outbox. Grades taken with no network go into IndexedDB and
  flush on the online event or on next launch.

  Keyed by cardId plus reviewedAt so a double flush cannot double count.
*/

const DB_NAME = "durus";
const DB_VERSION = 1;
const STORE = "outbox";

export type OutboxGrade = {
  key: string;
  cardId: number;
  direction: "recognition" | "production";
  grade: "again" | "hard" | "good" | "easy";
  msToAnswer: number;
  reviewedAt: string;
};

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export function makeKey(cardId: number, reviewedAt: string): string {
  return `${cardId}:${reviewedAt}`;
}

export async function enqueue(grade: Omit<OutboxGrade, "key">): Promise<void> {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    // put, not add, so replaying the same grade overwrites rather than
    // throwing on a duplicate key.
    tx.objectStore(STORE).put({
      ...grade,
      key: makeKey(grade.cardId, grade.reviewedAt),
    });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function all(): Promise<OutboxGrade[]> {
  const db = await open();
  const items = await new Promise<OutboxGrade[]>((resolve, reject) => {
    const req = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OutboxGrade[]);
    req.onerror = () => reject(req.error);
  });
  db.close();
  return items;
}

export async function remove(keys: string[]): Promise<void> {
  if (keys.length === 0) return;
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const store = tx.objectStore(STORE);
    for (const key of keys) store.delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function count(): Promise<number> {
  try {
    return (await all()).length;
  } catch {
    return 0;
  }
}
