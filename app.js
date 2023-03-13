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
        let query = "SELECT password, email, phonenumber, address1, address2, city, stateid, postalcode "
         + "FROM Customer WHERE username = $1;";
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

app.get('/mediaTrends/getTrending', async (req, res) => {
  try {
    let db = await getDBConnection('sample');
    let query = "SELECT y.videonum, y.name AS title, Language.name AS language, FilmStudio.name AS film_studio, y.views " +
    "FROM ( " +
          "SELECT Video.videonum, Video.name, Video.languageID, Video.uploaddate, Video.filmStudioID, x.views " +
          "FROM (" +
                "SELECT video.id, video.name, count(*) AS views " +
                "FROM Video " +
                "JOIN Watchrecord ON (Watchrecord.videoID = Video.id) " +
                "GROUP BY Video.id, Video.name " +
              ") AS x " +
              "LEFT JOIN Video ON (x.id = video.id) " +
      ") AS y " +
        "JOIN Language ON (y.languageID = Language.id) " +
        "LEFT JOIN FilmStudio ON (y.filmStudioID = FilmStudio.ID) " +
    "ORDER BY y.views DESC, y.uploaddate DESC " +
    "LIMIT 10;";
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

app.get('/mediaTrends/getActors/:videonumber', async (req, res) => {
  try {
    let videonumber = req.params.videonumber;
    let db = await getDBConnection('sample');
    let query = "SELECT firstname, lastname " +
    "FROM Actor " +
        "JOIN VideoToActor ON (VideoToActor.actorID = Actor.id) " +
        "JOIN Video ON (VideoToActor.videoID = Video.id) " +
    "WHERE Video.videonum = $1;";
    let result = await db.query(query, [videonumber]);
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

app.get('/mediaTrends/getGenres/:videonumber', async (req, res) => {
  try {
    let videonumber = req.params.videonumber;
    let db = await getDBConnection('sample');
    let query = "SELECT Genre.name " +
    "FROM Genre " +
        "JOIN VideoToGenre ON (VideoToGenre.genreID = Genre.id) " +
        "JOIN Video ON (VideoToGenre.videoID = Video.id) " +
    "WHERE Video.videonum = $1;";
    let result = await db.query(query, [videonumber]);
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

app.get('/mediaTrends/retrieveByFavorite/:username', async (req, res) => {
  try {
    let username = req.params.username;
    let favType = req.query.factor;
    if (username && favType) {
      let isNotExistingUser = await isNewUser(username);
      if (isNotExistingUser) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Not a valid username");
        return;
      }
      if ((favType !== "Genre") && (favType !== "Language") && (favType !== "Filmstudio") && (favType !== "Actor")) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Not a valid query type. Valid: Genre, Language, Filmstudio, Actor");
        return;
      }

      let query;

      if (favType == "Genre") {
        let favGenre = await getFavoriteGenre(username);

        let db = await getDBConnection('sample');

        query = "";

        let result = await db.query(query, [favGenre]);
        res.json({
          "result": result.rows
        });
        await db.end();
        return;
      }

      if (favType == "Language") {
        let favLanguage = await getFavoriteLanguage(username);
        // res.type("text").send(favLanguage);

        let db = await getDBConnection('sample');

        query = "";

        let result = await db.query(query, [favLanguage]);
        res.json({
          "result": result.rows
        });
        await db.end();
        return;
      }

      if (favType == "Filmstudio") {
        let favFilmStudio = await getFavoriteFilmStudio(username);

        //res.type("text").send(favFilmStudio);
        let db = await getDBConnection('sample');

        query = "";

        let result = await db.query(query, [favFilmStudio]);
        res.json({
          "result": result.rows
        });
        await db.end();
        return;
      }

      if (favType == "Actor") {
        let favActor = await getFavoriteActor(username);
        //res.type("text").send(favActor);

        let db = await getDBConnection('sample');

        query = "";

        let result = await db.query(query, [favActor]);
        res.json({
          "result": result.rows
        });
        await db.end();
        return;
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
      username = username.trim();
      if (username.length === 0) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send(INVALID_PARAM_ERROR_MSG);
        return;
      }
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
      username = username.trim();
      if (username.length === 0) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send(INVALID_PARAM_ERROR_MSG);
        return;
      }
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
        if (phonenumber.length != 10) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, incorrect number of digits in phone number!");
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
        if (state.length != 2) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, incorrect number of characters in stateID!");
          return;
        }
        if (postalcode) {
          if (postalcode.length != 5) {
            res.status(INVALID_PARAM_ERROR);
            res.type("text").send("failed, invalid postal code!");
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

app.post('/mediaTrends/updateCustomer', async (req, res) => {
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
      let isNotExistingUser = await isNewUser(username);
      if (!isNotExistingUser) {
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
        if (phonenumber.length != 10) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, incorrect number of digits in phone number!");
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
        if (state.length != 2) {
          res.status(INVALID_PARAM_ERROR);
          res.type("text").send("failed, incorrect number of characters in stateID!");
          return;
        }
        if (postalcode) {
          if (postalcode.length != 5) {
            res.status(INVALID_PARAM_ERROR);
            res.type("text").send("failed, invalid postal code!");
            return;
          }
        }
        await updateUser(password, email, phonenumber, address1, address2, city, state, postalcode, username);
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

app.post('/mediaTrends/insertWatchRecord', async (req, res) => {
  try {
    let username = req.body.username;
    let videonumber = req.body.videonumber;
    let date = req.body.date;
    let time = req.body.time;

    if (username && videonumber && date && time) {
      username = username.trim();
      if (username.length === 0) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send(INVALID_PARAM_ERROR_MSG);
        return;
      }
      let isNotExistingUser = await isNewUser(username);
      let isValidVideonum = await verifyVideoNum(videonumber);
      let isValidDate = isValidDateFormat(date);
      let isValidTime = isValidTimeFormat(time);

      if (isNotExistingUser) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Invalid username. Please enter an existing username");
        return;
      }
      if (!isValidVideonum) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Invalid video number. Please try again");
        return;
      }
      if (!isValidDate) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Invalid date format. Please try again (yyyy-mm-dd)");
        return;
      }
      if (!isValidTime) {
        res.status(INVALID_PARAM_ERROR);
        res.type("text").send("Invalid date format. Please try again (hh-mm-ss)");
        return;
      }

      let watchtime = date + " " + time;

      await insertWatchRecord(username, videonumber, watchtime);
      res.type("text").send("success");

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

async function getFavoriteLanguage(username) {
  let db = await getDBConnection('sample');

  let query = "SELECT Language.name, COUNT (*) as count " +
              "FROM Language " +
                "JOIN Video ON (Video.languageID = Language.id) " +
                "JOIN WatchRecord ON (WatchRecord.videoID = Video.id) " +
                "JOIN Customer ON (Customer.id = WatchRecord.customerid) " +
              "WHERE Customer.username = $1 " +
              "GROUP BY Language.id " +
              "ORDER BY count DESC " +
              "LIMIT 1;";

  let result = await db.query(query, [username]);

  await db.end();

  return result.rows[0]['name'];
}

async function getFavoriteActor(username) {
  let db = await getDBConnection('sample');

  let query = "SELECT Actor.firstname, Actor.lastname, COUNT (*) AS count " +
              "FROM Customer " +
                "JOIN Watchrecord ON ( Customer.id = Watchrecord.customerid) " +
                "JOIN Video ON ( Watchrecord.videoid = Video.id) " +
                "JOIN Videotoactor ON ( Videotoactor.videoid = Video.id) " +
                "JOIN Actor ON ( Actor.id = Videotoactor.Actorid) " +
              "WHERE Customer.username = $1 " +
              "GROUP BY Actor.id " +
              "ORDER BY count DESC " +
              "LIMIT 1;";

  let result = await db.query(query, [username]);

  await db.end();

  let firstname = result.rows[0]['firstname'];
  let lastname = result.rows[0]['lastname'];

  return (firstname + " " + lastname);
}

async function getFavoriteFilmStudio(username) {
  let db = await getDBConnection('sample');

  let query = "SELECT Filmstudio.name, COUNT (*) as count " +
              "FROM FilmStudio " +
                "JOIN Video ON (Video.filmstudioID = FilmStudio.id) " +
                "JOIN WatchRecord ON (WatchRecord.videoID = Video.id) " +
                "JOIN Customer ON (Customer.id = WatchRecord.customerid) " +
              "WHERE Customer.username = $1 " +
              "GROUP BY FilmStudio.id " +
              "LIMIT 1;";

  let result = await db.query(query, [username]);

  await db.end();

  return result.rows[0]['name'];
}


async function getFavoriteGenre(username) {
  let db = await getDBConnection('sample');

  let query = "SELECT Genre.name, COUNT(*) AS VideosWatched " +
  "FROM Customer  " +
    "JOIN Watchrecord ON ( Watchrecord.customerid = Customer.id) " +
    "JOIN Video ON ( Video.id = Watchrecord.videoid) " +
    "JOIN Videotogenre ON ( Video.id = Videotogenre.videoid) " +
    "JOIN Genre ON ( Videotogenre.genreid = Genre.id) " +
  "WHERE Customer.username = $1 " +
  "GROUP BY Genre.ID " +
  "ORDER BY VideosWatched Desc " +
  "LIMIT 1;";

  let result = await db.query(query, [username]);

  await db.end();

  return result.rows[0]['name'];
}

async function insertWatchRecord(username, videonum, watchtime) {
  let db = await getDBConnection('sample');

  let query = "INSERT INTO Watchrecord (customerid, videoid, watchtime) " +
      "VALUES ((SELECT Customer.id FROM Customer WHERE username = $1), " +
      "(SELECT Video.id FROM Video WHERE videonum = $2), $3);";

  let result = await db.query(query, [username, videonum, watchtime]);

  await db.end();
}

function isValidTimeFormat(timeString) {
  const timeFormat = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/;
  return timeFormat.test(timeString);
}


function isValidDateFormat(dateString) {
  const dateFormat = /^\d{4}-\d{2}-\d{2}$/;
  return dateFormat.test(dateString);
}


async function verifyVideoNum(vidnum) {
  let db = await getDBConnection('sample');

  let query = "SELECT * FROM Video WHERE videonum = $1;";
  let result = await db.query(query, [vidnum]);

  await db.end();

  if (result.rows.length !== 0) return true;
  return false;
}

async function updateUser(pwd, email, pnum, ad1, ad2, city, state, pcode, username) {
  let db = await getDBConnection('sample');

  let query = "UPDATE Customer " +
  "SET password = $1, email = $2, phonenumber = $3, address1 = $4," +
  " address2 = $5, city = $6, stateid = $7, postalcode = $8 " +
  "WHERE username = $9;";
  let result = await db.query(query, [pwd, email, pnum, ad1, ad2, city, state, pcode, username]);

  await db.end();
}

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
