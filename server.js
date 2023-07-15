require('dotenv').config();
const express = require('express');
const app = express();
const path = require('path');
const ejs = require('ejs');
const expressLayout = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('express-flash');
const passport = require('passport');
const mongoose = require('mongoose');
const cors = require('cors');
const MongoStore = require('connect-mongo');
const Emitter = require('events');
app.use(cors());

// Database connection
mongoose.connect(process.env.MONGO_CONNECTION_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
const connection = mongoose.connection;
connection.once('open', () => {
  console.log('Database connected...');
}).on('error', err => {
  console.log('Connection failed:', err);
});

// Session store
const mongoStore = MongoStore.create({
  mongoUrl: process.env.MONGO_CONNECTION_URL ,
  collection: 'sessions',
  mongooseConnection: connection
});

//event emitter
const eventEmitter = new Emitter();
app.set('eventEmitter', eventEmitter);


// Flash as middleware

app.use(flash());

// Session config
app.use(
  session({
    secret: process.env.COOKIE_SECRET,
    resave: false,
    saveUninitialized: false,
    store: mongoStore,
    cookie: { maxAge: 1000 * 60 * 60 * 24 }, // 24 hours
  })
);

// Passport config
const passportInit = require('./app/config/passport');
passportInit(passport);
app.use(passport.initialize());
app.use(passport.session());

// Set the view engine to EJS
app.set('view engine', 'ejs');

// Global middleware which can be used anywhere
app.use((req, res, next) => {
  res.locals.session = req.session;
  res.locals.user = req.user;
  next();
});

// Use express-ejs-layouts middleware
app.use(expressLayout);

// Set the views directory
app.set('views', path.join(__dirname, '/resources/views'));

// Serve static files from the "public" directory
app.use(express.static('public'));

// Enable JSON data receiving
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Import routes
require('./routes/web')(app);
app.use((req, res) => {
  res.status(404).render('error/404');
});

// Set the port number
const PORT = process.env.PORT || 3000;

// Start the server
const server = app.listen(PORT, () => {
  console.log(`Listening on port ${PORT}`);
});

//Socket
const io = require('socket.io')(server);

io.on('connection', (socket) => {
  //console.log('Socket connected id:', socket.id);

  socket.on('join', (orderId) => {
  //  console.log(orderId);
    socket.join(orderId);
  });
});

eventEmitter.on('orderUpdated', (data) => {
  io.to(`order_${data.id}`).emit('orderUpdated', data);
});

eventEmitter.on('orderPlaced', (data) => {
  io.to('adminRoom').emit('orderPlaced', data);
});
