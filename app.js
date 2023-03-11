"use strict";

const express = require('express');
const app = express();

const fs = require('fs');

// other required modules ...
const multer = require("multer");

// for application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true })); // built-in middleware
// for application/json
app.use(express.json()); // built-in middleware
// for multipart/form-data (required with FormData)
app.use(multer().none()); // requires the "multer" module

const { Pool } = require('pg');

const INVALID_PARAM_ERROR = 400;
const INVALID_PARAM_ERROR_MSG = "Missing one or more of the required params..";
const SERVER_ERROR = 500;
const SERVER_ERROR_MSG = "An error occurred on the server. Try again later.";

const databasePath = "./Sample database.txt";
const createDatabaseQueries = fs.readFileSync(databasePath, 'utf8');

const dataPath = "./Sample data.txt";
const InsertDataQueries = fs.readFileSync(dataPath, 'utf8');

async function getDBConnection(database) {
  const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: database,
    password: 'qwerty',
    port: '5432',
  });

  try {
    const client = await pool.connect();
    console.log('Connected to database');
    return client;
  } catch (error) {
    console.error(SERVER_ERROR_MSG, error);
    return null;
  }
}

app.get('/mediaTrends/makeNewDB', async (req, res) => {
  try {
    let dbExists = await checkDB();
    if (dbExists) {
      res.type("text").send("Database alrady exists.");
    } else {
      await createDatabase();
      await makeTables();
      await insertData();
      res.type("text").send("Database successfully created!");
    }
  } catch (error) {
    console.log(error);
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

app.get('/test', async (req, res) => {
  let db = await getDBConnection('sample');
  let username = 'joyjoy';
  let query = "SELECT password FROM customer WHERE username = $1;";
  let result = await db.query(query, [username]);
  res.send(result.rows[0]['password']);
  await db.end();
});

app.get('/mediaTrends/getUsernames', async (req, res) => {
  try {
    let db = await getDBConnection('sample');
    let query = "SELECT username FROM Customer;";
    let result = await db.query(query);
    res.json({
      "result": result.rows
    });
    await db.end();
  } catch (error) {
    console.log(error);
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

app.get('/mediaTrends/getUserInfo/:username', async (req, res) => {
  try {
    let username = req.params.username;
    if (username) {
      let isNewUsername = await isNewUser(username);
      if (!isNewUsername) {
        let db = await getDBConnection('sample');
        let query = "SELECT * FROM Customer WHERE username = $1;";
        let result = await db.query(query, [username]);
        res.json({
          "result": result.rows
        });
        await db.end();
      } else {
        res.status(INVALID_PARAM_ERROR);
      res.type("text").send("User does not exist");
      }
    } else {
      res.status(INVALID_PARAM_ERROR);
      res.type("text").send(INVALID_PARAM_ERROR_MSG);
    }
  } catch (error) {
    console.log(error);
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

app.post('/mediaTrends/verifyCredentials', async (req, res) => {
  try {
    let username = req.body.username;
    let password = req.body.password;
    if (username && password) {
      let isVerified = await validateUser(username, password);
      if (isVerified) {
        res.type("text").send("verified");
      } else {
        res.type("text").send("failed");
      }
    } else {
      res.status(INVALID_PARAM_ERROR);
      res.type("text").send(INVALID_PARAM_ERROR_MSG);
    }
  } catch (error) {
    console.log(error);
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

app.post('/mediaTrends/newCustomer', async (req, res) => {
  try {
    let username = req.body.username;
    let password = req.body.password;
    let email = req.body.email;
    let phonenumber = req.body.phone;
    let address1 = req.body.address1;
    let address2 = req.body.address2;
    let city = req.body.city;
    let state = req.body.state;
    let postalcode = req.body.postal;

    if (username && password && email && phonenumber && address1 && city && state) {
      let isVerifiedUsername = await isNewUser(username);
      if (isVerifiedUsername) {
        if (username.length > 10) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, username too long!");
          return;
        }
        if (password.length > 25) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, password too long!");
          return;
        }
        if (email.length > 40) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, email too long!");
          return;
        }
        if (phonenumber.length > 10) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, phone number too long!");
          return;
        }
        if (address1.length > 50) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, address1 too long!");
          return;
        }
        if (address2.length > 50) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, address2 too long!");
          return;
        }
        if (city.length > 20) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, city name too long!");
          return;
        }
        if (state.length > 2) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, stateID too long!");
          return;
        }
        if (postalcode) {
          if (postalcode.length != 5) {
            res.status(INVALID_PARAM_ERROR);
            res.type("text").send("failed, stateID too long!");
            return;
          }
        }
        await insertNewUser(username, password, email, phonenumber, address1, address2, city, state, postalcode);
        res.type("text").send("success");
      } else {
        res.type("text").send("failed, user already exists!");
      }
    } else {
      res.status(INVALID_PARAM_ERROR);
      res.type("text").send(INVALID_PARAM_ERROR_MSG);
    }
  } catch (error) {
    console.log(error);
    res.status(SERVER_ERROR);
    res.type("text").send(SERVER_ERROR_MSG);
  }
});

async function insertNewUser(username, pwd, email, pnum, ad1, ad2, city, state, pcode) {
  let db = await getDBConnection('sample');

  let query = "INSERT INTO Customer (username, password, email, phonenumber, address1, address2, city, stateid, postalcode)"
  + "VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9);";
  let result = await db.query(query, [username, pwd, email, pnum, ad1, ad2, city, state, pcode]);

  await db.end();
}

async function isNewUser(username) {
  let db = await getDBConnection('sample');

  let query = "SELECT * FROM Customer WHERE username = $1;";
  let result = await db.query(query, [username]);

  await db.end();

  if (result.rows.length === 0) return true;
  return false;
}

async function validateUser(username, password) {
  let db = await getDBConnection('sample');

  let query = "SELECT password FROM Customer WHERE username = $1;";
  let result = await db.query(query, [username]);

  await db.end();

  if(result.rows.length === 0) return false;

  if (password === result.rows[0]['password']) {
    return true;
  } else {
    return false;
  }
}

async function checkDB() {
  let db = await getDBConnection('postgres');

  let query = "SELECT 1 FROM pg_database WHERE datname = 'sample';";
  let count = await db.query(query);
  await db.end();
  if (count.rowCount === 0) {
    return false;
  } else {
    return true;
  }
}

async function createDatabase() {
  let db = await getDBConnection('postgres');

  let query = "CREATE DATABASE sample;";
  await db.query(query);
  await db.end();
  console.log("successfully created database");
};

async function makeTables() {
  let db = await getDBConnection('sample');
  await db.query(createDatabaseQueries);
  await db.end();
  console.log("successfully created tables");
};

async function insertData() {
  let db = await getDBConnection('sample');
  await db.query(InsertDataQueries);
  await db.end();
  console.log("successfully inserted data");
};



//front-end is in 'public' folder directory
app.use(express.static('public'));

// Allows us to change the port easily by setting an environment
const PORT = process.env.PORT || 8000;
app.listen(PORT);
