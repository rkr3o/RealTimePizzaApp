import { loadStripe } from '@stripe/stripe-js';
import { placeOrder } from './apiService';
import { CardWidget } from './CardWidget';
import Noty from 'noty';
import axios from 'axios';
export async function initStripe() {
   const stripe = await loadStripe('pk_test_51NTtGQSJgxHyHmEtMUGr8GrjDmPNQA2XuL0nxQSKdNAGbNNkHOBPnnkWpr2VxZG7JmbZhmgmOXKKDPP1ntaGslRq00kmTBXgLt');
   let card = null;
   const paymentType = document.querySelector('#paymentType');
   if (!paymentType) {
       return;
   }
   paymentType.addEventListener('change', (e) => {
       if (e.target.value === 'card') {
           // Display Widget
           card = new CardWidget(stripe);
           card.mount();
       } else {
           card.destroy();
       }
   });

   const paymentForm = document.querySelector('#payment-form');
   if (paymentForm) {
       paymentForm.addEventListener('submit', async (e) => {
           e.preventDefault();
           let formData = new FormData(paymentForm);
           let formObject = {};
           for (let [key, value] of formData.entries()) {
               formObject[key] = value;
           }

           if (!card) {
               // Ajax
               placeOrder(formObject);
               return;
           }

           const token = await card.createToken();
           formObject.stripeToken = token.id;
           placeOrder(formObject);
       });
   }
}
