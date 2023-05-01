let grid,
  gameOn = false,
  playerNumber;

// const socket = io();
const socket = io("http://localhost:3000");

const allCells = document.querySelectorAll(".cell");

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");

const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const joinGameInput = document.getElementById("gameCodeInput");
const gameCodeText = document.getElementById("gameCodeText");
const gameInfoDisplay = document.getElementById("gameInfo");
const bingoSpans = document.querySelectorAll(".bingo");

const errorMsgDiv = document.getElementById("errorMsg");
const errorDisplay = document.getElementById("error");

const gameWinAudio = new Audio("./audio/game_win.mp3");
const gameLoseAudio = new Audio("./audio/game_lose.mp3");
const gameDrawAudio = new Audio("./audio/game_draw.mp3");
const gameStartAudio = new Audio("./audio/game_start.mp3");
const wrongAudio = new Audio("./audio/wrong.mp3");
const successAudio = new Audio("./audio/success.mp3");

newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);
allCells.forEach((cell) => {
  cell.addEventListener("click", () => {
    let num = cell.innerText;
    socket.emit("numberChosen", num);
  });
});
gameCodeText.addEventListener("click", () => {
  navigator.clipboard.writeText(gameCodeText.innerText);
});

socket.on("gameState", handleGameState);
socket.on("success", () => successAudio.play());
socket.on("gameStarted", handleGameStarted);
socket.on("gameOver", handleGameOver);
socket.on("alreadyMarked", () => {
  setError("Already Marked! Choose a different number.");
  wrongAudio.play();
});
socket.on("gameCode", (gameCode) => {
  gameCodeText.innerText = `${gameCode}`;
});
socket.on("unknownGame", () => {
  handleErrors("Unknown game code", true);
});
socket.on("tooManyPlayers", () => {
  handleErrors("Game already in progress", true);
});
socket.on("notYourTurn", () => {
  handleErrors("Its not your turn!");
  wrongAudio.play();
});
socket.on("init", (number) => (playerNumber = number));

function handleErrors(msg, reload = false) {
  if (reload) {
    reset();
  }
  setError(msg);
}

function handleGameStarted(gameState) {
  gameStartAudio.play();
  gameOn = true;
  gameState = JSON.parse(gameState);
  let state;
  if (playerNumber == 1) {
    state = gameState.player[0];
  } else {
    state = gameState.player[1];
  }

  initializeGrid(state);
  displayGameInfo(gameState);
}

function initializeGrid(state) {
  let grid = state.grid.flat();
  for (let i = 0; i < 25; i++) {
    let num = grid[i];
    let cell = allCells[i];
    cell.setAttribute("id", `cell-${num}`);
    cell.innerText = `${num}`;
  }
}

function handleGameOver(winner) {
  const { winner: gameWinner } = JSON.parse(winner);
  gameOn = false;
  if (gameWinner == 3) {
    gameInfoDisplay.innerText = "Draw!";
    gameDrawAudio.play();
  } else if (playerNumber == gameWinner) {
    gameInfoDisplay.innerText = "You Won!";
    gameWinAudio.play();
  } else {
    gameInfoDisplay.innerText = "You lost :(";
    gameLoseAudio.play();
  }
  setTimeout(() => {
    window.location.reload();
  }, 5000);
}

function handleGameState(gameState, num) {
  if (!gameOn) {
    return;
  }
  let cell = document.getElementById(`cell-${num}`);
  cell.classList.add("marked");
  gameState = JSON.parse(gameState);
  displayGameInfo(gameState);
}

function showGameScreen() {
  initialScreen.style.display = "none";
  gameScreen.style.display = "flex";
}

function reset() {
  playerNumber = null;
  joinGameInput.value = "";
  gameCodeText.innerText = "";
  initialScreen.style.display = "block";
  gameScreen.style.display = "none";
  gameInfoDisplay.innerText = "";
}

function newGame() {
  socket.emit("newGame");
  showGameScreen();
}
function joinGame() {
  const code = joinGameInput.value;
  gameCodeText.innerText = code;
  socket.emit("joinGame", code);
  showGameScreen();
}

function setError(msg) {
  errorDisplay.style.display = "block";
  errorDisplay.classList.add("error-display");
  errorMsgDiv.innerText = msg;

  setTimeout(() => {
    errorMsgDiv.innerText = "";
    errorDisplay.style.display = "none";
    errorDisplay.classList.remove("error-display");
  }, 5000);
}
function displayGameInfo(gameState) {
  if (!gameOn) {
    return;
  }

  let state;
  if (playerNumber === 1) {
    state = gameState.player[0];
  } else {
    state = gameState.player[1];
  }

  if (gameState.turn === playerNumber) {
    gameInfoDisplay.innerText = "Your turn";
  } else {
    gameInfoDisplay.innerText = "Opponents turn";
  }

  for (let i = 0; i < bingoSpans.length; i++) {
    let span = bingoSpans[i];
    if (i + 1 <= state.completed) {
      span.classList.add("fire");
    } else {
      span.classList.remove("fire");
    }
  }
}
