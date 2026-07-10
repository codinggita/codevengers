export function speakGameMaster(text, onStart, onEnd) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  // Configure for an eerie, deliberate Game Master delivery
  utterance.rate = 0.9;
  utterance.pitch = 0.8;
  
  if (onStart) utterance.onstart = onStart;
  if (onEnd) utterance.onend = onEnd;
  
  window.speechSynthesis.speak(utterance);
}
