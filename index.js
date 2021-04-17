const inquirer = require("inquirer");
const mysql = require("mysql");

const connection = mysql.createConnection({
  port: 3306,
  user: "root",
  password: "",
  database: "great_bay",
});

let currentUserId;

const login = () => {
  connection.query("SELECT * FROM users", (err, data) => {
    if (err) throw err;

    inquirer
      .prompt([
        {
          type: "confirm",
          name: "registered",
          message: "Are you registered?",
        },
        {
          type: "input",
          name: "username",
          message: "Please enter your username.",
        },
        {
          type: "password",
          name: "password",
          message: "Please enter your password.",
        },
      ])
      .then(({ registered, username, password }) => {
        const foundUser = data.find((user) => user.username === username);
        if (registered) {
          if (foundUser) {
            if (foundUser.user_password === password) {
              console.log("You're logged in!\n");
              currentUserId = foundUser.id;
              init();
            } else {
              console.log(
                "Username or password is incorrect. Please try again.\n"
              );
              login();
            }
          } else {
            console.log(
              "Username or password is incorrect. Please try again.\n"
            );
            login();
          }
        } else {
          if (foundUser) {
            console.log("Username is already taken. Please try again.\n");
            login();
          } else {
            connection.query(
              "INSERT INTO users SET ?",
              { username, user_password: password },
              (err, res) => {
                if (err) throw err;
                currentUserId = res.insertId;
                console.log(`${username}, you are now registered!\n`);
                init();
              }
            );
          }
        }
      });
  });
};

const init = () => {
  inquirer
    .prompt([
      {
        type: "list",
        name: "init",
        choices: ["BID", "POST", "QUIT"],
        message: "What would you like to do?",
      },
    ])
    .then(({ init }) => {
      switch (init) {
        case "BID":
          bid();
          break;
        case "POST":
          post();
          break;
        default:
          connection.end();
      }
    });
};

const bid = () => {
  connection.query("SELECT * FROM items", (err, data) => {
    if (err) throw err;

    inquirer
      .prompt([
        {
          type: "list",
          name: "bidItemId",
          choices: data.map(({ id, item_description }) => {
            return { name: item_description, value: id };
          }),
          message: "What item would you like to bid on?",
        },
        {
          type: "input",
          name: "bid",
          message: "What is your bid?",
          validate: (value) => !isNaN(value) || "Please enter a number.",
          filter: (value) => parseFloat(value).toFixed(2),
        },
      ])
      .then(({ bidItemId, bid }) => {
        const bidItem = data.find((item) => item.id === bidItemId);

        if (bid > bidItem.highest_bid) {
          connection.query(
            "UPDATE items SET ? WHERE ?",
            [
              {
                highest_bid: bid,
              },
              {
                id: bidItemId,
              },
            ],
            (err) => {
              if (err) throw err;
              console.log("You have the highest bid!\n");
              init();
            }
          );
        } else {
          console.log("Sorry, your bid is too low.\n");
          init();
        }
      });
  });
};

const post = () => {
  inquirer
    .prompt([
      {
        type: "input",
        name: "description",
        message: "What is the item description?",
      },
      {
        type: "input",
        name: "bid",
        message: "What is the starting bid?",
        validate: (value) => !isNaN(value) || "Please enter a number.",
      },
    ])
    .then(({ description, bid }) => {
      connection.query(
        "INSERT INTO items SET ?",
        { item_description: description, highest_bid: bid },
        (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} item(s) inserted!\n`);
          init();
        }
      );
    });
};

connection.connect((err) => {
  if (err) throw err;
  console.log(`connected as id ${connection.threadId}\n`);
  login();
});
