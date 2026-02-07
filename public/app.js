const imageElement = document.getElementById("quiz-image");
const resultMessage = document.getElementById("result-message");
const scoreElement = document.getElementById("score");
const humanButton = document.getElementById("human-btn");
const aiButton = document.getElementById("ai-btn");

let currentSource = null;
let totalGuesses = 0;
let correctGuesses = 0;
let isLoading = false;

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

async function loadNextImage() {
  isLoading = true;
  setButtonsDisabled(true);

  try {
    const response = await fetch("/api/next-image");

    if (!response.ok) {
      throw new Error(`API error ${response.status}`);
    }

    const data = await response.json();
    currentSource = data.source;
    imageElement.src = data.imageUrl;
  } catch (error) {
    currentSource = null;
    clearResult();
    resultMessage.textContent = "Could not load image. Refresh and try again.";
    resultMessage.classList.add("incorrect");
  } finally {
    isLoading = false;
    setButtonsDisabled(false);
  }
}

function guess(guessSource) {
  if (isLoading || !currentSource) {
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
    loadNextImage();
  }, 900);
}

humanButton.addEventListener("click", () => guess("human"));
aiButton.addEventListener("click", () => guess("ai"));

updateScore();
loadNextImage();
