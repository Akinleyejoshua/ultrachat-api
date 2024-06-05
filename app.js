const express = require("express");
const app = express();
const port = 4000;
const http = require("http");
const server = http.createServer(app);
const io = require("socket.io")(server, { cors: { origin: "*" } });

app.get("/", (req, res) => {
  res.send("API WORKING")
})

const users = [
 
];

const chats = [];

io.sockets.on("error", (e) => console.log(e));

io.sockets.on("connection", (socket) => {
  console.log("connected")
  socket.on("login", (user) => {
    const userExist = users.find((item) => item?.name == user);

    if (userExist === undefined) {
      users.push({
        name: user,
        active: true,
        time: Date.now(),
        lastMsgChat: {},
      });

      socket.emit("msg", {
        type: "account-created",
        error: false,
        msg: `${user} account created`,
      });
    } else {
      socket.emit("msg", {
        type: "already-exist",
        error: true,
        msg: `${user} already exist`,
      });
    }
  });

  socket.on("logged-in", (user) => {
    const userExist = users.find((item) => item?.name === user);
    if (userExist === undefined) {
      socket.emit("user-does-not-exist");
    } else {
      users.map((item, i) => {
        if (item.name == user) {
          users[i] = {
            ...users[i],
            time: Date.now(),
            active: true,
          };
        }
      });
      socket.emit("get-users", users);
      const findUser = users.find((item) => item.name == user);
      socket.emit("get-user", findUser);
      socket.emit("get-chat-user", findUser);
    }
  });

  socket.on("re-logged-in", (user) => {
    const userExist = users.find((item) => item?.name == user);
    if (userExist) {
      userExist.active = true;
      socket.broadcast.emit("get-chat-user", userExist);
      socket.broadcast.emit("get-users", users);
    }
  });

  socket.on("get-user", (user) => {
    const findUser = users.find((item) => item.name == user);
    socket.emit("get-user", findUser);
  });

  socket.on("get-chat-user", (user) => {
    const findUser = users.find((item) => item.name == user);
    socket.emit("get-chat-user", findUser);
  });

  socket.on("logged-out", (user) => {
    users.map((item, i) => {
      if (item.name == user) {
        users[i] = {
          ...users[i],
          time: Date.now(),
          active: false,
        };
      }
    });

    socket.broadcast.emit("get-users", users);
    const findUser = users.find((item) => item?.name == user);
    socket.broadcast.emit("get-chat-user", findUser);
  });

  socket.on("start-chat", (chatName) => {
    const name = chatName.split("_");
    const fname = name[0];
    const sname = name[1];

    const chatExist = chats.find(
      (item) => item?.fname == fname && item?.sname == sname
    );

    if (chatExist == undefined) {
      chats.push({
        chatName: chatName,
        fname: fname,
        sname: sname,
        chats: [],
      });
    } else {
      socket.emit("get-chats", chatExist);
    }
  });

  socket.on("save-chat", (chat) => {
    const name = chat?.chatName.split("_");
    const fname = name[0];
    const sname = name[1];

    const chatExist = chats.find(
      (item) => item?.fname == fname && item?.sname == sname
    );

    if (chatExist !== undefined) {
      chatExist.chats.push({ ...chat.chat });
      const lastChat = chatExist.chats[chatExist.chats.length - 1];
      socket.broadcast.emit("get-chat", lastChat);
    } else {
      socket.emit("start-chat", chat?.chatName);
    }
  });

  socket.on("save-last-msg", (user) => {
    const name = user?.chatName.split("_");
    const fname = name[0];
    const sname = name[1];

    const findUser = users.find((item) => item.name == user?.chat?.to);

    
    if (findUser) {
      findUser.lastMsgChat = {...user.chat};

      socket.emit("get-users", users);
    }
  });

  socket.on("chat-status", (data) => {
    const name = data?.chatName.split("_");
    const fname = name[0];
    const sname = name[1];

    const chatExist = chats.find(
      (item) => item?.fname == fname && item?.sname == sname
    );
    
    if (chatExist) {
      chatExist.chats.map((item) => {
        item.status = "seen";
      });

      socket.broadcast.emit("get-chats", chatExist);

    }


  });

  socket.on("typing", (user) => {
    socket.broadcast.emit("typing", user);
    setTimeout(() => {
      socket.broadcast.emit("not-typing", user);
    }, 3000);
  });
});

server.listen(port, () => console.log(`Server is running on port http://localhost:${port}`));
