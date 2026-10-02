/**
 * Web Speech API Voice synthesis helper for Hindi (hi-IN) and English voice narration.
 */

export interface VoiceSpeakOptions {
  language?: 'hi' | 'en';
  pitch?: number;
  rate?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

export function speakText(text: string, options: VoiceSpeakOptions = {}): { cancel: () => void; supported: boolean } {
  if (!isSpeechSupported()) {
    if (options.onError) {
      options.onError(new Error('Web Speech API is not supported in this browser environment.'));
    }
    return { cancel: () => {}, supported: false };
  }

  // Cancel any ongoing speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const langCode = options.language === 'hi' ? 'hi-IN' : 'en-IN';
  utterance.lang = langCode;
  utterance.rate = options.rate || 0.95;
  utterance.pitch = options.pitch || 1.0;

  // Try to pick Hindi voice if requested
  const voices = window.speechSynthesis.getVoices();
  if (options.language === 'hi') {
    const hindiVoice = voices.find((v) => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi'));
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
  } else {
    const indianEnglishVoice = voices.find((v) => v.lang === 'en-IN' || v.name.toLowerCase().includes('india'));
    if (indianEnglishVoice) {
      utterance.voice = indianEnglishVoice;
    }
  }

  if (options.onStart) utterance.onstart = () => options.onStart!();
  if (options.onEnd) utterance.onend = () => options.onEnd!();
  if (options.onError) utterance.onerror = (e) => options.onError!(e);

  window.speechSynthesis.speak(utterance);

  return {
    cancel: () => window.speechSynthesis.cancel(),
    supported: true
  };
}
