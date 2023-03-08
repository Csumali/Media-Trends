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

app.get('/makeNewDB', async (req, res) => {
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

app.post('/verifyCredentials', async (req, res) => {
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
