const openStore = () => new Promise<IDBDatabase>((resolve, reject) => {
  const request = indexedDB.open('deckademics-production-showcase-media', 1);
  request.onupgradeneeded = () => request.result.createObjectStore('files');
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(new Error('Sample file storage is unavailable.'));
});
export async function saveDemoFile(file: File) {
  const db = await openStore(); const key = crypto.randomUUID();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').put(file, key);
    tx.oncomplete = () => resolve(); tx.onerror = () => reject(new Error('Unable to save sample file.'));
  }); db.close(); return `demo-file:${key}`;
}
export async function resolveDemoFile(path: string) {
  const db = await openStore();
  const blob = await new Promise<Blob | undefined>((resolve, reject) => {
    const request = db.transaction('files').objectStore('files').get(path.replace('demo-file:', ''));
    request.onsuccess = () => resolve(request.result); request.onerror = () => reject(request.error);
  }); db.close(); return blob ? URL.createObjectURL(blob) : '';
}
export async function clearDemoFiles() {
  const db = await openStore();
  await new Promise<void>((resolve, reject) => { const tx = db.transaction('files', 'readwrite'); tx.objectStore('files').clear(); tx.oncomplete = () => resolve(); tx.onerror = () => reject(tx.error); }); db.close();
}