import axios from 'axios';
import Noty from 'noty';
import { initAdmin } from './admin';
import moment from 'moment';
import io from 'socket.io-client';
import { initStripe } from './stripe';

const addToCart = document.querySelectorAll('.add-to-cart');
const cartCounter = document.querySelector('#cartCounter');

function updateCart(pizza) {
  axios
    .post('/update-cart', pizza)
    .then((res) => {
      cartCounter.innerText = res.data.totalQty;
      new Noty({
        type: 'success',
        timeout: 50,
        text: 'Item added to cart',
        progressBar: false,
      }).show();
    })
    .catch((error) => {
      console.log('Error updating cart:', error);
    });
}

addToCart.forEach((btn) => {
  btn.addEventListener('click', (e) => {
    e.preventDefault(); // Prevent the default form submission behavior
    const pizza = JSON.parse(btn.dataset.pizza);
    updateCart(pizza);
  });
});

// Remove alert message after X seconds
const alertMsg = document.querySelector('#success-alert');
if (alertMsg) {
  setTimeout(() => {
    alertMsg.remove();
  }, 2000);
}

// Change order status
let statuses = document.querySelectorAll('.status_line');
let hiddenInput = document.querySelector('.hiddenInput');
let currentOrder = hiddenInput ? JSON.parse(hiddenInput.value) : null;
let time = document.createElement('small');

function updateStatus(order) {
  statuses.forEach((status) => {
    status.classList.remove('step-completed');
    status.classList.remove('current');
  });
  let stepCompleted = true;
  statuses.forEach((status) => {
    let dataProp = status.dataset.status;
    if (stepCompleted) {
      status.classList.add('step-completed');
    }
    if (dataProp === order.status) {
      stepCompleted = false;
      time.innerText = moment(order.updatedAt).format('hh:mm A');
      status.appendChild(time);
      if (status.nextElementSibling) {
        status.nextElementSibling.classList.add('current');
      }
    }
  });
}
if (currentOrder) {
  updateStatus(currentOrder);
}
 
//stripe call
initStripe();
// Socket
let socket = io('http://localhost:3000'); // Adjust the URL and port according to your server configuration

// Join
if (currentOrder) {
  socket.emit('join', `order_${currentOrder._id}`);
}

let AdminAreaPath = window.location.pathname;
if (AdminAreaPath.includes('admin')) {
  initAdmin(socket);
  socket.emit('join', 'adminRoom');
}

// Listen for 'orderUpdated' event
socket.on('orderUpdated', (data) => {
  const updatedOrder = { ...currentOrder };
  updatedOrder.updatedAt = moment().format();
  updatedOrder.status = data.status;
  updateStatus(updatedOrder);
  new Noty({
    type: 'success',
    timeout: 1000,
    text: 'Order updated',
    progressBar: false,
  }).show();
});

// Initialize admin functionality
//initAdmin(currentOrder); // Pass currentOrder as a parameter to the initAdmin function