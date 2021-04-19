const inquirer = require("inquirer");
const mysql = require("mysql");
const util = require("util");

const connection = mysql.createConnection({
  port: 3306,
  user: "root",
  password: "",
  database: "great_bay",
});

connection.promisifiedQuery = util.promisify(connection.query);
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
        choices: ["BID on an item", "View POST menu", "QUIT"],
        message: "What would you like to do?",
      },
    ])
    .then(({ init }) => {
      switch (init) {
        case "BID on an item":
          bid();
          break;
        case "View POST menu":
          postMenu();
          break;
        default:
          connection.end();
      }
    });
};

const bid = () => {
  connection.query("SELECT * FROM auctions", (err, data) => {
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
            "UPDATE auctions SET ? WHERE ?",
            [
              {
                highest_bid: bid,
                highest_bidder_id: currentUserId,
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

const getUserAuctionArray = async () => {
  const userAuctions = await connection.promisifiedQuery(
    "SELECT * FROM auctions WHERE created_by_id=?",
    [currentUserId]
  );

  return userAuctions.map((auction) => {
    return {
      name: auction.item_description,
      value: auction.id,
    };
  });
};

const closeAuction = async () => {
  const auctionArray = await getUserAuctionArray();
  inquirer
    .prompt([
      {
        type: "list",
        name: "auctionId",
        choices: auctionArray,
        message: "Which auction would you like to close?",
      },
    ])
    .then(({ auctionId }) => {
      connection.query(
        "UPDATE auctions SET ? WHERE ?",
        [
          {
            is_auction_open: false,
          },
          {
            id: auctionId,
          },
        ],
        (err, data) => {
          if (err) throw err;
          connection.query(
            "SELECT item_description FROM auctions WHERE id = ?",
            [auctionId],
            (err, data) => {
              if (err) throw err;
              console.log(
                `\nYour ${data[0].item_description} auction is now closed.\n`
              );
              init();
            }
          );
        }
      );
    });
};

const editAuction = async () => {
  const auctionArray = await getUserAuctionArray();
  inquirer
    .prompt([
      {
        type: "list",
        name: "auctionId",
        choices: auctionArray,
        message: "Which auction would you like to modify?",
      },
      {
        type: "list",
        name: "column",
        choices: [
          { name: "Description", value: "item_description" },
          { name: "Starting Bid", value: "starting_bid" },
        ],
        message:
          "Would you like to change the description or the starting bid?",
      },
      {
        type: "input",
        name: "value",
        message: "What would you like to change it to?",
      },
    ])
    .then(({ auctionId, column, value }) => {
      connection.query(
        "UPDATE auctions SET ? WHERE ?",
        [
          {
            [column]: value,
          },
          {
            id: auctionId,
          },
        ],
        (err, data) => {
          if (err) throw err;
          connection.query(
            "SELECT item_description, starting_bid FROM auctions WHERE id = ?",
            [auctionId],
            (err, data) => {
              if (err) throw err;
              console.log(
                `\nYour auction has been updated to ${data[0].item_description} with a starting bid of ${data[0].starting_bid}.\n`
              );
              init();
            }
          );
        }
      );
    });
};

const viewAuctions = () => {
  connection.query(
    `
    SELECT auctions.id, item_description, starting_bid, highest_bid, is_auction_open, username 
    FROM auctions LEFT JOIN users 
    ON auctions.highest_bidder_id = users.id 
    WHERE created_by_id = ?`,
    [currentUserId],
    (err, data) => {
      if (err) throw err;
      console.log("\nYour Auctions:\n");
      data.forEach(
        ({
          id,
          item_description,
          starting_bid,
          highest_bid,
          is_auction_open,
          username,
        }) => {
          console.log(
            `${id} | Item: ${item_description} | Starting Bid: ${starting_bid} | Highest Bid: ${
              username ? highest_bid : "No bids yet."
            } by User: ${username ? username : "Pending"} | ${
              is_auction_open ? "Open" : "Closed"
            }`
          );
        }
      );
      console.log("\n");
      init();
    }
  );
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
        "INSERT INTO auctions SET ?",
        {
          item_description: description,
          starting_bid: bid,
          highest_bid: bid,
          created_by_id: currentUserId,
        },
        (err, res) => {
          if (err) throw err;
          console.log(`${res.affectedRows} item(s) inserted!\n`);
          init();
        }
      );
    });
};

const postMenu = () => {
  const choiceArray = [
    "View your auctions",
    "Post a new auction",
    "Modify an auction",
    "Close an auction",
  ];
  inquirer
    .prompt([
      {
        type: "list",
        name: "postChoice",
        choices: choiceArray,
        message: "Please select what you would like to do.",
      },
    ])
    .then(({ postChoice }) => {
      const choiceIndex = choiceArray.indexOf(postChoice);

      switch (choiceIndex) {
        case 0:
          viewAuctions();
          break;
        case 1:
          post();
          break;
        case 2:
          editAuction();
          break;
        case 3:
          closeAuction();
          break;
        default:
          postMenu();
      }
    });
};

connection.connect((err) => {
  if (err) throw err;
  console.log(`connected as id ${connection.threadId}\n`);
  login();
});
