const express = require("express");
const bcrypt = require("bcrypt");

const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "userData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`DB Erorr: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//register new user

app.post("/register", async (request, response) => {
  try {
    const { username, name, password, gender, location } = request.body;

    const hashedPassaword = await bcrypt.hash(password, 10);
    const checkQuery = `
    SELECT *
    FROM user 
    WHERE 
     username='${username}';`;

    const resultDb = await db.get(checkQuery);

    if (resultDb === undefined) {
      if (password.length < 5) {
        response.status(400);
        response.send("Password is too short");
        console.log("");
      } else {
        const postQuery = `
        INSERT INTO 
            user(username,name,password,gender,location)
        VALUES(
            '${username}',
            '${name}',
            '${hashedPassaword}',
            '${gender}',
            '${location}'

        );`;

        await db.run(postQuery);
        response.status(200);
        response.send("User created successfully");
      }
    } else {
      response.status(400);
      response.send("User already exists");
    }
  } catch (e) {
    console.log(`DB POST Error: ${e.message}`);
  }
});

//login

app.post("/login", async (request, response) => {
  const { username, password } = request.body;
  const checkQuery = `
        SELECT * 
        FROM user 
        WHERE 
        username='${username}';`;
  const resultDb = await db.get(checkQuery);

  if (resultDb === undefined) {
    response.status(400);
    response.send("Invalid user");
  } else {
    const matchedPassword = await bcrypt.compare(password, resultDb.password);
    if (matchedPassword === true) {
      response.status(200);
      response.send("Login success!");
    } else {
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//change password

app.put("/change-password", async (request, response) => {
  try {
    const { username, oldPassword, newPassword } = request.body;

    const checkQuery = `
    SELECT *
    FROM user 
    WHERE 
     username='${username}';`;

    const resultDb = await db.get(checkQuery);

    const verifyPassword = await bcrypt.compare(oldPassword, resultDb.password);
    const encryptPass = await bcrypt.hash(newPassword, 10);

    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
      console.log("");
    } else {
      if (verifyPassword === true) {
        const putQuery = `
        UPDATE
            user
        SET 
            password='${encryptPass}' 
        WHERE 
           username='${username}';`;

        await db.run(putQuery);
        response.status(200);
        response.send("Password updated");
      } else {
        response.status(400);
        response.send("Invalid current password");
      }
    }
  } catch (e) {
    console.log(`DB POST Error: ${e.message}`);
  }
});

module.exports = app;
