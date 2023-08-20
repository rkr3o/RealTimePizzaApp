const Order = require('../../../models/order');
const moment = require('moment');

const stripe = require('stripe')(process.env.STRIPE_PRIVATE_KEY);

function orderController() {
  return {
    async store(req, res) {
      try {
        const { phone, address, paymentType } = req.body;
        if (!phone || !address) {
          return res.status(422).json({ message: 'All fields are required' });
        }

        const order = new Order({
          customerId: req.user._id,
          items: req.session.cart.items,
          phone,
          address,
        });

        await order.save();

        // Stripe payment
        if (paymentType === 'card') {
          const paymentIntent = await stripe.paymentIntents.create({
            amount: Math.round(req.session.cart.totalPrice * 100),
            currency: 'inr',
            payment_method_types: ['card'],
            description: `Pizza order: ${order._id}`,
            receipt_email: req.user.email,
          });

          order.paymentStatus = true;
          order.paymentType = paymentType;
          order.paymentIntentId = paymentIntent.id;
          await order.save();

          const eventEmitter = req.app.get('eventEmitter');
          eventEmitter.emit('orderPlaced', order);

          delete req.session.cart;
          return res.json({ message: 'Payment Successful, Order placed successfully' });
        }

        delete req.session.cart;
        return res.json({ message: 'Order placed successfully' });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
      }
    },

    async index(req, res) {
      try {
        const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
        res.header('cache-control', 'no-cache, no-store, private, must-revalidate, max-stale=0, post-check=0, pre-check=0');
        res.render('customers/orders', { orders, moment });
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
      }
    },

    async show(req, res) {
      try {
        const order = await Order.findById(req.params.id);

        if (req.user._id.toString() === order.customerId.toString()) {
          return res.render('customers/singleOrder', { order });
        }

        return res.redirect('/');
      } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Something went wrong' });
      }
    },
  };
}

module.exports = orderController;