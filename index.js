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
  init();
});
