const { Server } = require("socket.io");
const { createGameState, gameLoop } = require("./game");
const { makeid } = require("./utils");
const io = new Server({
  ...(process.env.NODE_ENV === "production"
    ? {}
    : {
        cors: {
          origin: "*",
          methods: ["GET", "POST"],
        },
      }),
});

const state = {};
const clientRooms = {};
const roomToClientCount = {};

io.on("connection", (socket) => {
  socket.on("disconnect", () => {
    const roomId = clientRooms[socket.id];
    delete clientRooms[socket.id];
    if (roomId) {
      roomToClientCount[roomId]--;
      if (roomToClientCount[roomId] === 0) {
        delete roomToClientCount[roomId];
        delete state[roomId];
      }
    }
  });

  socket.on("numberChosen", (num) => {
    const roomName = clientRooms[socket.id];
    if (!state[roomName]) {
      return;
    }

    const playerOne = state[roomName].player[0];
    const playerTwo = state[roomName].player[1];

    const playerId = socket.number;

    if (state[roomName].turn != playerId) {
      socket.emit("notYourTurn");
      return;
    }
    if (playerOne.locations[num].marked) {
      socket.emit("alreadyMarked");
      return;
    }
    playerOne.locations[num].marked = true;
    playerTwo.locations[num].marked = true;

    if (playerId == 1) {
      state[roomName].turn = 2;
    } else {
      state[roomName].turn = 1;
    }
    io.sockets.in(roomName).emit("success");
    const winner = gameLoop(state[roomName]);

    if (winner) {
      emitGameOver(roomName, winner);
      delete state[roomName];
      return;
    }

    emitGameState(roomName, state[roomName]);
    // socket.emit("success");
  });

  socket.on("newGame", handleNewGame);
  socket.on("joinGame", handleJoinGame);
  function handleJoinGame(gameCode) {
    const room = io.sockets.adapter.rooms.get(gameCode);

    let numClients = 0;
    if (room) {
      numClients = room.size;
    }

    if (numClients == 0) {
      socket.emit("unknownGame");
      return;
    }

    if (numClients > 1) {
      socket.emit("tooManyPlayers");
      return;
    }

    clientRooms[socket.id] = gameCode;
    roomToClientCount[gameCode]++;
    socket.join(gameCode);
    socket.number = 2;
    socket.emit("init", 2);
    io.sockets.in(gameCode).emit("gameStarted");
    emitGameState(gameCode, state[gameCode]);
  }

  function handleNewGame() {
    const roomName = makeid(10);
    clientRooms[socket.id] = roomName;
    roomToClientCount[roomName] = 1;
    socket.emit("gameCode", roomName);
    state[roomName] = createGameState();
    socket.join(roomName);
    socket.number = 1;
    socket.emit("init", 1);
  }
});

function emitGameState(roomName, state) {
  io.sockets.in(roomName).emit("gameState", JSON.stringify(state));
}

function emitGameOver(roomName, winner) {
  io.sockets.in(roomName).emit("gameOver", JSON.stringify({ winner }));
}

io.listen(Number(process.env.PORT ?? 3000));
