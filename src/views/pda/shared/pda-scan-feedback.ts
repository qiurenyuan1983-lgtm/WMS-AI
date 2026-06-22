import { ref } from 'vue';

export type PdaScanFeedbackType = 'success' | 'error' | 'warn' | null;

/** PDA 扫码语音：成功「正确」，失败「错误」 */
export function speakPdaScan(ok: boolean) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(ok ? '正确' : '错误');
    utterance.lang = 'zh-CN';
    utterance.rate = 1.15;
    utterance.volume = 1;
    window.speechSynthesis.speak(utterance);
  } catch {
    // 浏览器不支持或用户禁用时静默
  }
}

export function usePdaScanFeedback() {
  const scanFeedbackType = ref<PdaScanFeedbackType>(null);
  const scanFeedbackText = ref('');

  function clearScanFeedback() {
    scanFeedbackType.value = null;
    scanFeedbackText.value = '';
  }

  function feedbackSuccess(detail?: string) {
    speakPdaScan(true);
    scanFeedbackType.value = 'success';
    scanFeedbackText.value = detail || '扫描正确';
    if (detail) window.$message?.success(detail);
  }

  function feedbackError(reason?: string) {
    speakPdaScan(false);
    scanFeedbackType.value = 'error';
    const msg = reason ? `识别错误：${reason}` : '识别错误';
    scanFeedbackText.value = msg;
    window.$message?.error(msg);
  }

  /** 条码已识别但业务警告（如库位不一致），语音仍播「正确」 */
  function feedbackWarn(text: string) {
    speakPdaScan(true);
    scanFeedbackType.value = 'warn';
    scanFeedbackText.value = text;
    window.$message?.warning(text);
  }

  return {
    scanFeedbackType,
    scanFeedbackText,
    clearScanFeedback,
    feedbackSuccess,
    feedbackError,
    feedbackWarn
  };
}
