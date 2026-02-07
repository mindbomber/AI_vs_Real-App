const imageElement = document.getElementById("quiz-image");
const resultMessage = document.getElementById("result-message");
const scoreElement = document.getElementById("score");
const humanButton = document.getElementById("human-btn");
const aiButton = document.getElementById("ai-btn");

let imagePools = { human: [], ai: [] };
let currentImagePath = null;
let currentSource = null;
let totalGuesses = 0;
let correctGuesses = 0;
let isLoading = false;

function toSafeUrlPath(pathValue) {
  return pathValue
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

function setButtonsDisabled(disabled) {
  humanButton.disabled = disabled;
  aiButton.disabled = disabled;
}

function setResult(text, isCorrect) {
  resultMessage.textContent = text;
  resultMessage.classList.remove("correct", "incorrect");
  resultMessage.classList.add(isCorrect ? "correct" : "incorrect");
}

function clearResult() {
  resultMessage.textContent = "";
  resultMessage.classList.remove("correct", "incorrect");
}

function updateScore() {
  scoreElement.textContent = `Score: ${correctGuesses} / ${totalGuesses}`;
}

function pickRandom(source) {
  const pool = imagePools[source];
  return pool[Math.floor(Math.random() * pool.length)];
}

async function loadManifest() {
  const response = await fetch("./image-manifest.json");

  if (!response.ok) {
    throw new Error(`Could not load manifest (${response.status})`);
  }

  const data = await response.json();
  const hasHuman = Array.isArray(data.human) && data.human.length > 0;
  const hasAi = Array.isArray(data.ai) && data.ai.length > 0;

  if (!hasHuman || !hasAi) {
    throw new Error("Manifest is missing human or AI images.");
  }

  imagePools = { human: data.human, ai: data.ai };
}

function chooseNextImage() {
  const source = Math.random() < 0.5 ? "human" : "ai";
  return {
    source,
    imagePath: pickRandom(source)
  };
}

function showLoadError(message) {
  currentImagePath = null;
  currentSource = null;
  resultMessage.textContent = message;
  resultMessage.classList.remove("correct");
  resultMessage.classList.add("incorrect");
}

async function loadNextRound() {
  isLoading = true;
  setButtonsDisabled(true);

  try {
    const next = chooseNextImage();
    currentSource = next.source;
    currentImagePath = next.imagePath;
    imageElement.src = toSafeUrlPath(next.imagePath);
  } catch (error) {
    clearResult();
    showLoadError("Could not load image. Refresh and try again.");
  } finally {
    isLoading = false;
    setButtonsDisabled(false);
  }
}

function guess(guessSource) {
  if (isLoading || !currentSource || !currentImagePath) {
    return;
  }

  const isCorrect = guessSource === currentSource;
  totalGuesses += 1;

  if (isCorrect) {
    correctGuesses += 1;
    setResult("Correct", true);
  } else {
    setResult("Incorrect", false);
  }

  updateScore();
  setButtonsDisabled(true);

  // Keep feedback visible briefly before loading the next random image.
  window.setTimeout(() => {
    clearResult();
    loadNextRound();
  }, 900);
}

humanButton.addEventListener("click", () => guess("human"));
aiButton.addEventListener("click", () => guess("ai"));

async function startGame() {
  updateScore();
  setButtonsDisabled(true);

  try {
    await loadManifest();
    await loadNextRound();
  } catch (error) {
    showLoadError("Could not start game. Check image-manifest.json.");
    setButtonsDisabled(true);
  }
}

startGame();
