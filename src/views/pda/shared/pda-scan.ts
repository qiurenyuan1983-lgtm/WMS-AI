import { ref } from 'vue';

/** PDA 扫码防抖（同码 300ms 内忽略） */
export function usePdaScan(debounceMs = 300) {
  const scanInput = ref('');
  let lastCode = '';
  let lastAt = 0;

  function shouldAccept(code: string): boolean {
    const trimmed = code.trim();
    if (!trimmed) return false;
    const now = Date.now();
    if (trimmed === lastCode && now - lastAt < debounceMs) return false;
    lastCode = trimmed;
    lastAt = now;
    return true;
  }

  function handleScan(code: string, onScan: (code: string) => void) {
    const trimmed = code.trim();
    if (!shouldAccept(trimmed)) return;
    onScan(trimmed);
    scanInput.value = '';
  }

  function onEnter(e: KeyboardEvent, onScan: (code: string) => void) {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(scanInput.value, onScan);
    }
  }

  function resetScanDebounce() {
    lastCode = '';
    lastAt = 0;
    scanInput.value = '';
  }

  return { scanInput, handleScan, onEnter, resetScanDebounce };
}
