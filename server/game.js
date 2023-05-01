function createGameState() {
  const state = {
    player: [
      {
        completed: 0,
        grid: [],
        locations: {},
      },
      {
        completed: 0,
        grid: [],
        locations: {},
      },
    ],
    turn: 1,
  };
  setUpGrid(state.player[0]);
  setUpGrid(state.player[1]);
  return state;
}

function gameLoop(state) {
  const playerOne = state.player[0];
  const playerTwo = state.player[1];
  let playerOnePoints = checkForWin(playerOne);
  let playerTwoPoints = checkForWin(playerTwo);
  playerOne.completed = playerOnePoints;
  playerTwo.completed = playerTwoPoints;

  if (playerOnePoints >= 5 && playerTwoPoints >= 5) {
    return 3;
  }

  if (playerOnePoints >= 5) {
    return 1;
  }

  if (playerTwoPoints >= 5) {
    return 2;
  }

  return false;
}

function checkForWin(state) {
  let marked = 0;
  for (let i = 0; i < 5; i++) {
    let rowNum = state.grid[0][i];
    let colNum = state.grid[i][0];

    let isRowNumMarked = state.locations[rowNum].marked;
    let isColNumMarked = state.locations[colNum].marked;

    if (isRowNumMarked) {
      marked += checkHorizontal(i, state);
    }

    if (isColNumMarked) {
      marked += checkVertical(i, state);
    }

    if (i == 0 && isColNumMarked) {
      let ok = 1;
      for (let i = 0; i < 5; i++) {
        let num = state.grid[i][i];
        if (!state.locations[num].marked) {
          ok = 0;
          break;
        }
      }
      marked += ok;
    }

    if (i == 4 && isColNumMarked) {
      let ok = 1;
      for (let i = 0, j = 4; i < 5; i++, j--) {
        let num = state.grid[j][i];
        if (!state.locations[num].marked) {
          ok = 0;
          break;
        }
      }
      marked += ok;
    }
  }
  return marked;
}

function checkVertical(idx, state) {
  for (let i = 0; i < 5; i++) {
    let num = state.grid[idx][i];
    if (!state.locations[num].marked) {
      return 0;
    }
  }
  return 1;
}

function checkHorizontal(idx, state) {
  for (let i = 0; i < 5; i++) {
    let num = state.grid[i][idx];
    if (!state.locations[num].marked) {
      return 0;
    }
  }
  return 1;
}

function setUpGrid(state) {
  state.grid = new Array(5);
  const seen = new Set();
  for (let i = 0; i < 5; i++) {
    state.grid[i] = new Array(5);
  }

  for (let i = 0; i < 5; i++) {
    for (let j = 0; j < 5; j++) {
      let x = generateRandomNumber(1, 25);
      do {
        x = generateRandomNumber(1, 25);
      } while (seen.has(x));

      state.grid[i][j] = x;
      seen.add(x);
      state.locations[x] = { i, j, marked: false };
    }
  }
}

function generateRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

module.exports = {
  createGameState,
  gameLoop,
};
