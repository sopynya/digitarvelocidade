import { useEffect, useState, useRef } from "react";
import "./App.css";

const SAMPLE_TEXT = `O rato roeu a roupa do rei de Roma. Digite este texto o mais rápido possível. Continue praticando para melhorar sua habilidade e rapidez na digitação. Aprender a digitar rápido ajuda a produtividade e concentração. Continue praticando todos os dias para se tornar cada vez mais eficiente. `.repeat(
  2
);

function normalizeText(str) {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export default function App() {
  const [words] = useState(SAMPLE_TEXT.split(" "));
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [input, setInput] = useState("");
  const [started, setStarted] = useState(false);
  const [paused, setPaused] = useState(false);
  const [finished, setFinished] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [duration, setDuration] = useState(60);

  const [correctWords, setCorrectWords] = useState(0);
  const [correctLetters, setCorrectLetters] = useState(0);
  const [totalTyped, setTotalTyped] = useState(0);

  const [wpm, setWpm] = useState(0);
  const [lpm, setLpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [isWrong, setIsWrong] = useState(false);

  const inputRef = useRef(null);
  const textContainerRef = useRef(null);
  const intervalRef = useRef(null);

  // TIMER
  useEffect(() => {
    if (started && !paused && !finished) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            endTest();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => clearInterval(intervalRef.current);
  }, [started, paused, finished]);

  // Atualiza métricas em tempo real
  useEffect(() => {
    if (started && !finished && timeLeft < duration) {
      const secondsElapsed = duration - timeLeft;
      const elapsedMinutes = secondsElapsed / 60;

      const newWpm = Math.round(correctWords / elapsedMinutes) || 0;
      const newLpm = Math.round((correctLetters / secondsElapsed) * 60) || 0;
      const acc = Math.round(
        (correctWords / Math.max(currentWordIndex, 1)) * 100
      );

      setWpm(newWpm);
      setLpm(newLpm);
      setAccuracy(acc);
    }
  }, [timeLeft, correctWords, correctLetters, currentWordIndex, started]);

  function startTest() {
    setStarted(true);
    setPaused(false);
    setFinished(false);
    setCurrentWordIndex(0);
    setInput("");
    setCorrectWords(0);
    setCorrectLetters(0);
    setTotalTyped(0);
    setAccuracy(100);
    setWpm(0);
    setLpm(0);
    setTimeLeft(duration);
    inputRef.current?.focus();
  }

  function togglePause() {
    setPaused((prev) => !prev);
    if (!paused) inputRef.current?.blur();
    else inputRef.current?.focus();
  }

  function endTest() {
    clearInterval(intervalRef.current);
    setStarted(false);
    setFinished(true);
  }

  function handleInputChange(e) {
    const val = e.target.value;
    setInput(val);

    if (!started || paused || finished) return;

    setTotalTyped((prev) => prev + 1);

    const normalizedInput = normalizeText(val.trim());
    const normalizedWord = normalizeText(words[currentWordIndex]);

    if (normalizedWord.startsWith(normalizedInput)) {
      setIsWrong(false);
    } else {
      setIsWrong(true);
    }
  }

  function handleSpacePress(e) {
    if (e.key === " " || e.code === "Space" || e.key === "Spacebar") {
      e.preventDefault();
      if (!started || paused || finished) return;

      const trimmed = input.trim();
      const normalizedInput = normalizeText(trimmed);
      const normalizedWord = normalizeText(words[currentWordIndex]);

      if (normalizedInput !== normalizedWord) {
        setIsWrong(true);
        return;
      }

      // ✅ Palavra correta
      const newCorrectWords = correctWords + 1;
      const newCorrectLetters = correctLetters + trimmed.length + 1;

      setCorrectWords(newCorrectWords);
      setCorrectLetters(newCorrectLetters);
      setIsWrong(false);

      const nextIndex = currentWordIndex + 1;
      setCurrentWordIndex(nextIndex);
      setInput("");

      // Scroll automático
      const container = textContainerRef.current;
      const active = document.getElementById(`word-${nextIndex}`);
      if (container && active) {
        const offsetTop = active.offsetTop - container.offsetTop;
        if (offsetTop > container.clientHeight - 50)
          container.scrollTop += 30;
      }

      if (nextIndex >= words.length) {
        endTest();
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
          disabled={!started || finished || paused}
          placeholder={
            finished
              ? "Teste finalizado!"
              : paused
              ? "PAUSADO"
              : "Digite aqui..."
          }
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
              Velocidade: {wpm} WPM | Letras por minuto: {lpm} | Precisão:{" "}
              {accuracy}%
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
