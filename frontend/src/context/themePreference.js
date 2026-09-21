const STORAGE_KEY = 'minerva-theme';

export function readTheme(storage) {
  try { return storage?.getItem(STORAGE_KEY) === 'dark' ? 'dark' : 'light'; }
  catch { return 'light'; }
}

export function persistTheme(storage, theme) {
  try { storage?.setItem(STORAGE_KEY, theme); }
  catch { /* A preferência continua funcionando na sessão sem armazenamento. */ }
}
