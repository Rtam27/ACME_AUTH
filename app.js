const express = require('express');
const app = express();
app.use(express.json());
const {
  models: { User, Note },
} = require('./db');
const path = require('path');

const requireToken = async (req, res, next) => {
  try {
    const token = req.headers.authorization;
    console.log('token',token)
    const user = await User.byToken(token);
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));

app.post('/api/auth', async (req, res, next) => {
  try {
    res.send({ token: await User.authenticate(req.body) });
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/auth', requireToken, async (req, res, next) => {
  try {
    const authorization = req.headers.authorization;

    res.send(await User.byToken(authorization));
  } catch (ex) {
    next(ex);
  }
});

app.get('/api/users/:Id/notes', requireToken, async (req, res, next) => {
  //api/auth/1/notes
  try {
    const data = await Note.findAll({
      where: {
        userId: req.params.Id,
      },
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.log(err);
  res.status(err.status || 500).send({ error: err.message });
});

module.exports = app;
