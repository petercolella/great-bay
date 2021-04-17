const inquirer = require("inquirer");
const mysql = require("mysql");

const connection = mysql.createConnection({
  port: 3306,
  user: "root",
  password: "",
  database: "great_bay",
});

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
  console.log("bidding");
  init();
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
  init();
});
