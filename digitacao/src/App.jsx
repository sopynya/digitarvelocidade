import { useEffect, useState, useRef } from "react";
import "./App.css";

const SAMPLE_TEXT = `O rato roeu a roupa do rei de Roma. Digite este texto o mais rápido possível. Continue praticando para melhorar sua habilidade e rapidez na digitação. Aprender a digitar rápido ajuda a produtividade e concentração. Continue praticando todos os dias para se tornar cada vez mais eficiente.`.repeat(2);

function normalizeText(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function App() {
  const [words, setWords] = useState(SAMPLE_TEXT.split(" "));
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
  const textRef = useRef(null);

  // Timer
  useEffect(() => {
    let timer;
    if (started && !finished && !paused) {
      timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            endTest(correctWords, correctLetters, currentWordIndex);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [started, finished, paused]);

  function startTest() {
    setStarted(true);
    setPaused(false);
    setFinished(false);
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

  function endTest(cWords = correctWords, cLetters = correctLetters, index = currentWordIndex) {
    setStarted(false);
    setFinished(true);

    const secondsElapsed = Math.max(duration - timeLeft, 1);
    const elapsedMinutes = secondsElapsed / 60;

    const wpmCalc = Math.round(cWords / elapsedMinutes);
    const lpmCalc = Math.round((cLetters / secondsElapsed) * 60);
    const accCalc = Math.round((cWords / (index || 1)) * 100);

    setWpm(wpmCalc);
    setLpm(lpmCalc);
    setAccuracy(accCalc);
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
        const newCorrectWords = correctWords + 1;
        const newCorrectLetters = correctLetters + trimmed.length + 1;

        setCorrectWords(newCorrectWords);
        setCorrectLetters(newCorrectLetters);

        // Atualiza métricas
        const secondsElapsed = Math.max(duration - timeLeft, 1);
        const elapsedMinutes = secondsElapsed / 60;
        const wpmCalc = Math.round(newCorrectWords / elapsedMinutes);
        const lpmCalc = Math.round((newCorrectLetters / secondsElapsed) * 60);
        const accCalc = Math.round((newCorrectWords / (currentWordIndex + 1)) * 100);

        setWpm(wpmCalc);
        setLpm(lpmCalc);
        setAccuracy(accCalc);
      }

      // Próxima palavra
      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setInput("");

      if (nextIndex >= words.length) {
        endTest(correctWords + (correct ? 1 : 0), correctLetters + trimmed.length + 1, nextIndex);
      }
    }
  }

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
