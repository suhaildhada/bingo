let grid,
  gameOn = false,
  playerNumber;

// const socket = io();
const socket = io("http://localhost:3000");

const width = window.innerWidth;

let CANVAS_SIZE;
let fontSize;
if (width > 1000) {
  CANVAS_SIZE = width / 5;
} else {
  CANVAS_SIZE = width / 2;
}

if (width > 1000) {
  fontSize = 30;
} else if (width > 600) {
  fontSize = 25;
} else {
  fontSize = 20;
}

// const CANVAS_SIZE = width / 2;
const TILE_SIZE = CANVAS_SIZE / 5;

const canvas = document.getElementById("canvas");
/** @type {CanvasRenderingContext2D} */
const ctx = canvas.getContext("2d");

canvas.width = CANVAS_SIZE + 2;
canvas.height = CANVAS_SIZE + 2;

const enterBtn = document.getElementById("enterBtn");
const userInput = document.getElementById("userInput");

const gameScreen = document.getElementById("gameScreen");
const initialScreen = document.getElementById("initialScreen");

const newGameBtn = document.getElementById("newGameButton");
const joinGameBtn = document.getElementById("joinGameButton");
const joinGameInput = document.getElementById("gameCodeInput");
const gameCodeText = document.getElementById("gameCodeText");
const gameInfoDisplay = document.getElementById("gameInfo");
const errorDisplay = document.getElementById("errorMsg");

const bingoSpans = document.querySelectorAll(".bingo");

const gameWinAudio = new Audio("./audio/game_win.mp3");
const gameLoseAudio = new Audio("./audio/game_lose.mp3");
const gameDrawAudio = new Audio("./audio/game_draw.mp3");
const gameStartAudio = new Audio("./audio/game_start.mp3");
const wrongAudio = new Audio("./audio/wrong.mp3");
const successAudio = new Audio("./audio/success.mp3");

enterBtn.addEventListener("click", handleBtnClick);
newGameBtn.addEventListener("click", newGame);
joinGameBtn.addEventListener("click", joinGame);

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    handleBtnClick();
  }
});

socket.on("gameState", handleGameState);
socket.on("alreadyMarked", () => {
  setError("Already Marked! Choose a different number.");
  wrongAudio.play();
  // alert("Already marked!");
});

socket.on("gameStarted", () => {
  gameStartAudio.play();
  gameOn = true;
});
socket.on("success", () => successAudio.play());

socket.on("gameOver", (winner) => {
  const { winner: gameWinner } = JSON.parse(winner);
  gameOn = false;
  if (gameWinner == 3) {
    gameInfoDisplay.innerText = "Draw!";
    gameDrawAudio.play();
    return;
  }

  if (playerNumber == gameWinner) {
    gameInfoDisplay.innerText = "You Won!";
    gameWinAudio.play();
  } else {
    gameInfoDisplay.innerText = "You lost :(";
    gameLoseAudio.play();
  }
});

socket.on("gameCode", (gameCode) => {
  gameCodeText.innerText = `${gameCode}`;
});

gameCodeText.addEventListener("click", () => {
  navigator.clipboard.writeText(gameCodeText.innerText);
});

socket.on("unknownGame", () => {
  reset();
  alert("Unknown game code");
});

socket.on("tooManyPlayers", () => {
  reset();
  alert("Game already in progress");
});

socket.on("notYourTurn", () => {
  setError("Its not your turn!");
  wrongAudio.play();
  // alert("its not your turn!");
});

socket.on("init", (number) => (playerNumber = number));

function handleGameState(gameState) {
  if (!gameOn) {
    return;
  }
  gameState = JSON.parse(gameState);
  requestAnimationFrame(() => animate(gameState));
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
  errorDisplay.innerText = msg;
  errorDisplay.style.display = "block";

  setTimeout(() => {
    errorDisplay.innerText = "";
    errorDisplay.style.display = "none";
  }, 5000);
}
console.log(TILE_SIZE);
function animate(gameState) {
  if (!gameOn) {
    return;
  }

  let state;
  if (playerNumber == 1) {
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
      span.classList.add("green");
    } else {
      span.classList.remove("green");
    }
  }

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      let num = state.grid[i][j];
      let isMarked = state.locations[num].marked;
      let x = i * TILE_SIZE;
      let y = j * TILE_SIZE;
      ctx.beginPath();
      ctx.rect(x, y, TILE_SIZE, TILE_SIZE);
      if (isMarked) {
        ctx.fillStyle = "green";
      } else {
        ctx.fillStyle = "red";
      }
      ctx.font = `${fontSize}px Arial`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.fillText(`${num}`, x + TILE_SIZE / 2, y + TILE_SIZE / 2);

      ctx.stroke();
    }
  }
}

function handleBtnClick() {
  if (!gameOn) return;
  let text = userInput.value;
  let isNum = isNumeric(text);
  userInput.value = "";
  if (!isNum) {
    setError("Enter a number!");
    wrongAudio.play();
    // alert("Enter a number!");
    return;
  }
  let num = parseInt(text);
  if (num < 1 || num > 25) {
    setError("Enter number between 1 and 25!");
    wrongAudio.play();
    // alert("Enter number between 1 and 25!");
    return;
  }

  socket.emit("numberChosen", num);
}

function isNumeric(str) {
  if (typeof str != "string") {
    return false;
  } // we only process strings!
  return (
    !isNaN(str) && // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
    !isNaN(parseFloat(str))
  ); // ...and ensure strings of whitespace fail
}
