export function speak(text: string, lang = 'en-US', rate = 0.9) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel(); // para qualquer fala anterior
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  u.rate = rate; // um pouco mais devagar ajuda quem está aprendendo
  window.speechSynthesis.speak(u);
}
