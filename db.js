const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');
const { STRING } = Sequelize;
const bcrypt = require('bcrypt');

const SECRET_KEY = process.env.JWT;
const config = {
  logging: false,
};

if (process.env.LOGGING) {
  delete config.logging;
}
const conn = new Sequelize(
  process.env.DATABASE_URL || 'postgres://localhost/acme_db',
  config
);

const User = conn.define('user', {
  username: STRING,
  password: STRING,
});

const Note = conn.define('note', {
  text: STRING,
});

Note.belongsTo(User);
User.hasMany(Note);


User.beforeCreate(async (user) => {
  const hashPassword = await bcrypt.hash(user.password, 3);
  user.password = hashPassword;
});

User.byToken = async (token) => {
  try {
    const userVerify = jwt.verify(token, SECRET_KEY);
    const user = await User.findByPk(userVerify.userId);
    if (user) {
      console.log(user)
      return user;
    }
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  } catch (ex) {
    const error = Error('bad credentials');
    error.status = 401;
    throw error;
  }
};

User.authenticate = async ({ username, password }) => {
  //lucy lucy_pw
  const user = await User.findOne({
    where: {
      username,
    },
  });
  const checkPassword = await bcrypt.compare(password, user.password);
  //true of false
  if (checkPassword) {
    const token = jwt.sign({ userId: user.id }, SECRET_KEY);

    return token;
  }
  const error = Error('bad credentials');
  error.status = 401;
  throw error;
};


const syncAndSeed = async () => {
  await conn.sync({ force: true });
  const credentials = [
    { username: 'lucy', password: 'lucy_pw' },
    { username: 'moe', password: 'moe_pw' },
    { username: 'larry', password: 'larry_pw' },
  ];
  const notes = [
    {
      text: 'Something goes here',
    },
    { text: 'something else goes here too' },
    { text: 'hey I want to be a note, too' },
  ];
  const [lucy, moe, larry] = await Promise.all(
    credentials.map((credential) => User.create(credential))
  );
  const [note1, note2, note3] = await Promise.all(
    notes.map((note) => Note.create(note))
  );

  await lucy.addNote(note1)
  await lucy.addNote(note3)
  await moe.addNote(note2)

  return {
    users: {
      lucy,
      moe,
      larry,
    },
    notes: {
      note1,
      note2,
      note3
    }
  };
};

module.exports = {
  syncAndSeed,
  models: {
    User,
    Note
  },
};
