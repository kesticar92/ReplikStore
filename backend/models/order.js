const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  items: { type: [orderItemSchema], required: true },
  total: { type: Number, required: true }
});

const Order = mongoose.model('Order', orderSchema);

Order.createOrder = async function(orderData) {
  const order = new Order(orderData);
  return await order.save();
};

Order.getAll = async function() {
  return await Order.find({});
};

Order.getTopProducts = async function(limit = 5) {
  // Agrupar y contar productos más vendidos
  const result = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.productId', count: { $sum: '$items.quantity' } } },
    { $sort: { count: -1 } },
    { $limit: limit }
  ]);
  // Formato: [{ productId, count }]
  return result.map(item => ({ productId: item._id, count: item.count }));
};

module.exports = Order; 