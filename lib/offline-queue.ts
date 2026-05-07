/**
 * Tiny IndexedDB-backed queue used by the SessionLogger and meal logger when the
 * device is offline. Items are JSON envelopes describing a server action call;
 * when connectivity returns we POST them to a `replay` endpoint (TODO) or just
 * surface a toast asking the user to retry.
 */

const DB_NAME = "ct-offline";
const STORE = "queue";

export interface QueuedAction {
  id?: number;
  kind: "set" | "meal";
  payload: unknown;
  queued_at: number;
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function enqueue(action: Omit<QueuedAction, "id" | "queued_at">) {
  const db = await open();
  return new Promise<number>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).add({ ...action, queued_at: Date.now() });
    req.onsuccess = () => resolve(req.result as number);
    req.onerror = () => reject(req.error);
  });
}

export async function pending(): Promise<QueuedAction[]> {
  const db = await open();
  return new Promise<QueuedAction[]>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as QueuedAction[]);
    req.onerror = () => reject(req.error);
  });
}

export async function dequeue(id: number) {
  const db = await open();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}
