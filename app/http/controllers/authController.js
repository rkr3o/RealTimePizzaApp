const User = require('../../models/user');
const bcrypt = require('bcrypt');
const passport = require('passport'); 

function authController() {

  const _getRedirectUrl = (req) => {
    return req.user.role === 'admin' ? '/admin/orders' : '/';
  };

  return {
    login(req, res) {
      res.render('auth/login');
    },
    register(req, res) {
      res.render('auth/register');
    },
    async postRegister(req, res) {
      const { name, email, password } = req.body;
      // Validate request parameters
      if (!name || !email || !password) {
        req.flash('error', 'All fields are required');
        req.flash('name', name);
        req.flash('email', email);
        return res.redirect('/register');
      }
      try {
        // Check if email exists
        const emailExists = await User.exists({ email: email });
        if (emailExists) {
          req.flash('error', 'Email already exists');
          req.flash('name', name);
          req.flash('email', email);
          return res.redirect('/register');
        }
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        // Create a new user
        const newUser = new User({
          email: email,
          name: name,
          password: hashedPassword
        });
        // Save the new user
        const savedUser = await newUser.save();
        // Redirect to login or homepage
        return res.redirect('/');
      } catch (err) {
        req.flash('error', 'Something went wrong');
        return res.redirect('/register');
      }
    },
    postLogin(req, res , next) {
      passport.authenticate('local', (err, user, info) => {
        if (err) {
          req.flash('error', info.message);
          return next(err);
        }
        if (!user) {
          req.flash('error', info.message);
          return res.redirect('/login');
        }
        req.logIn(user, (err) => {
          if (err) {
            req.flash('error', info.message);
            return next(err);
          }

          return res.redirect(_getRedirectUrl(req));
        });
      })(req, res, next);;
    },
    logout(req, res) {
      req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/login');
      });
    }    
  };
}
module.exports = authController;
