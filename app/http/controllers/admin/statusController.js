const Order = require('../../../models/order');
const Emitter = require('events');

function statusController() {
  return {
    async update(req, res) {
      try {
        await Order.updateOne({ _id: req.body.orderId }, { status: req.body.status });
        const eventEmitter = req.app.get('eventEmitter');
        eventEmitter.emit('orderUpdated', { id: req.body.orderId, status: req.body.status });
        return res.redirect('/admin/orders');
      } catch (err) {
        console.log(err);
        return res.redirect('/admin/orders');
      }
    },
  };
}

module.exports = statusController;
