import { useEffect, useState, useRef } from "react";
import "./App.css";

const SAMPLE_TEXT = `O rato roeu a roupa do rei de Roma. Digite este texto o mais rápido possível. Continue praticando para melhorar sua habilidade e rapidez na digitação. Aprender a digitar rápido ajuda a produtividade e concentração. Continue praticando todos os dias para se tornar cada vez mais eficiente. Este é um texto longo para testar a rolagem automática e a responsividade em dispositivos móveis. Lembre-se de manter a postura correta e os dedos na posição certa para evitar erros.`.repeat(3);

// Função auxiliar para remover acentos e padronizar
function normalizeText(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function App() {
  const [words, setWords] = useState(SAMPLE_TEXT.replace(/\n/g, " ").split(" "));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [duration, setDuration] = useState(60);

  const [correctWords, setCorrectWords] = useState(0);
  const [correctLetters, setCorrectLetters] = useState(0);

  const [wpm, setWpm] = useState(0);
  const [lpm, setLpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);

  const inputRef = useRef(null);
  const textContainerRef = useRef(null);

  // Timer
  useEffect(() => {
    let timer;
    if (started && !finished && !paused) {
      timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            endTest();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, finished, paused]);

  // Mantém foco no input
  useEffect(() => {
    if (started && !paused && !finished) inputRef.current?.focus();
  }, [started, paused, finished]);

  function startTest() {
    setStarted(true);
    setFinished(false);
    setPaused(false);
    setCurrentWordIndex(0);
    setInput("");
    setCorrectWords(0);
    setCorrectLetters(0);
    setAccuracy(100);
    setWpm(0);
    setLpm(0);
    setTimeLeft(duration);
    inputRef.current?.focus();
  }

  function endTest() {
    setFinished(true);
    setStarted(false);

    const secondsElapsed = Math.max(duration - timeLeft, 1);
    const elapsedMinutes = secondsElapsed / 60;

    setWpm(Math.round(correctWords / elapsedMinutes));
    setLpm(Math.round((correctLetters / secondsElapsed) * 60));
    setAccuracy(Math.round((correctWords / (currentWordIndex || 1)) * 100));
  }

  function togglePause() {
    setPaused(!paused);
    if (!paused) inputRef.current?.blur();
    else inputRef.current?.focus();
  }

  function handleInputChange(e) {
    setInput(e.target.value);
    if (!started) startTest();
  }

  function handleSpacePress(e) {
    if (
      (e.key === " " || e.code === "Space" || e.key === "Spacebar") &&
      !finished &&
      !paused
    ) {
      e.preventDefault();
      const trimmed = input.trim();
      const normalizedInput = normalizeText(trimmed);
      const normalizedWord = normalizeText(words[currentWordIndex]);

      const correct = normalizedInput === normalizedWord;

      if (correct) {
        // Atualiza contadores
        setCorrectWords((c) => c + 1);
        setCorrectLetters((l) => l + trimmed.length + 1);

        // Atualiza métricas em tempo real
        const secondsElapsed = Math.max(duration - timeLeft, 1);
        const elapsedMinutes = secondsElapsed / 60;
        const nextCorrectWords = correctWords + 1;
        const nextCorrectLetters = correctLetters + trimmed.length + 1;

        setWpm(Math.round(nextCorrectWords / elapsedMinutes));
        setLpm(Math.round((nextCorrectLetters / secondsElapsed) * 60));
        setAccuracy(Math.round((nextCorrectWords / (currentWordIndex + 1)) * 100));

        // Avança
        setCurrentWordIndex((i) => i + 1);
        setInput("");

        // Scroll automático
        const activeWord = document.getElementById(`word-${currentWordIndex + 1}`);
        if (activeWord && textContainerRef.current) {
          const containerTop = textContainerRef.current.getBoundingClientRect().top;
          const wordTop = activeWord.getBoundingClientRect().top;
          textContainerRef.current.scrollTop += wordTop - containerTop - 50;
        }
      }

      if (currentWordIndex + 1 >= words.length) endTest();
    }
  }

  const currentWord = words[currentWordIndex];
  const normalizedInput = normalizeText(input.trim());
  const normalizedCurrentWord = normalizeText(currentWord);
  const isWrong =
    normalizedInput &&
    !normalizedCurrentWord.startsWith(normalizedInput);

  return (
    <div className="app-container">
      <div className="typing-box">
        <h1>Teste de Digitação</h1>

        <div className="time-selector">
          <label>
            Tempo de teste:
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              disabled={started}
            >
              <option value={60}>60 segundos</option>
              <option value={120}>120 segundos</option>
              <option value={180}>180 segundos</option>
            </select>
          </label>
        </div>

        <div className="text-container" ref={textContainerRef}>
          {words.map((word, i) => {
            let style = "word";
            if (i === currentWordIndex) style += " active";
            if (i < currentWordIndex) style += " done";
            return (
              <span key={i} id={`word-${i}`} className={style}>
                {word}{" "}
              </span>
            );
          })}
        </div>

        <input
          ref={inputRef}
          type="text"
          className={`input-box ${isWrong ? "wrong" : ""}`}
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleSpacePress}
          disabled={finished || paused}
          placeholder={paused ? "PAUSADO" : "Digite aqui..."}
          autoCapitalize="none"
          autoCorrect="off"
        />

        <div className="buttons">
          {!started && !finished && (
            <button className="start-btn" onClick={startTest}>
              Iniciar Teste
            </button>
          )}
          {started && !finished && (
            <button className="pause-btn" onClick={togglePause}>
              {paused ? "Retomar" : "Pausar"}
            </button>
          )}
          {finished && (
            <button className="restart-btn" onClick={startTest}>
              Reiniciar
            </button>
          )}
        </div>

        <div className="stats">
          <span>⏱️ Tempo: {timeLeft}s</span>
          <span>⚡ WPM: {wpm}</span>
          <span>✍️ LPM: {lpm}</span>
          <span>🎯 Precisão: {accuracy}%</span>
        </div>

        {finished && (
          <div className="results">
            <p>✅ Teste finalizado!</p>
            <p>
              Velocidade: {wpm} WPM | Letras por minuto: {lpm} | Precisão: {accuracy}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
