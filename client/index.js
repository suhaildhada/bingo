let grid,
  gameOn = false,
  playerNumber;

const bingoImgColorPaths = [
  "./images/bingo-letters/color/b.png",
  "./images/bingo-letters/color/i.png",
  "./images/bingo-letters/color/n.png",
  "./images/bingo-letters/color/g.png",
  "./images/bingo-letters/color/o.png",
  "./images/bingo-letters/color/!.png",
];

const bingoImgDefaultPaths = [
  "./images/bingo-letters/default/b.png",
  "./images/bingo-letters/default/i.png",
  "./images/bingo-letters/default/n.png",
  "./images/bingo-letters/default/g.png",
  "./images/bingo-letters/default/o.png",
  "./images/bingo-letters/default/!.png",
];

// const socket = io();
const socket = io("http://localhost:3000");

const allCells = document.querySelectorAll(".cell");

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");
const bgImgHolder = document.querySelector(".bg-image-container");

const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const joinGameInput = document.getElementById("gameCodeInput");
const gameCodeText = document.getElementById("gameCodeText");
const gameInfoDisplay = document.getElementById("gameInfo");
const bingoImgs = document.querySelectorAll(".bingo-letter");

const alertMessage = document.getElementById("alert-message");
const alertContainer = document.getElementById("alert-container");

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
    if (!gameOn) {
      setAlert("Game has not started yet!");
      return;
    }
    let num = cell.innerText;
    socket.emit("numberChosen", num);
  });
});
gameCodeText.addEventListener("click", () => {
  navigator.clipboard.writeText(gameCodeText.innerText);
  setAlert("Successfully copied to clip board!", "success");
});

socket.on("gameState", handleGameState);
socket.on("success", () => successAudio.play());
socket.on("gameStarted", (gameState) => {
  handleGameStarted(gameState);
});
socket.on("gameOver", handleGameOver);
socket.on("alreadyMarked", () => {
  setAlert("Already Marked! Choose a different number.");
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

function setAlert(msg, type = "danger", ms = 1000) {
  alertContainer.style.display = "block";
  alertContainer.classList.add("alert-display");
  alertMessage.classList.add(`alert-${type}`);
  alertMessage.innerText = msg;

  setTimeout(() => {
    alertMessage.innerText = "";
    alertContainer.style.display = "none";
    alertContainer.classList.remove("alert-display");
    alertMessage.classList.remove(`alert-${type}`);
  }, ms);
}

function handleErrors(msg, reload = false) {
  if (reload) {
    reset();
  }
  setAlert(msg);
}

function handleGameStarted(gameState) {
  gameStartAudio.play();
  gameOn = true;
  gameState = JSON.parse(gameState);
  console.log(gameState);
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
  bgImgHolder.style.display = "none";
}

function reset() {
  playerNumber = null;
  bgImgHolder.style.display = "block";

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

  for (let i = 0; i < bingoImgs.length; i++) {
    let image = bingoImgs[i];

    if (i + 1 <= state.completed) {
      image.src = bingoImgColorPaths[i];
    } else {
      image.src = bingoImgDefaultPaths[i];
    }

    if (i === bingoImgs.length - 1) {
      if (state.completed === 5) {
        image.src = bingoImgColorPaths[i];
      }
    }
  }
}
