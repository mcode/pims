import React from 'react';
import './NewOrders.css';
import OrderCard from '../OrderCard/OrderCard';

function NewOrders() {
  return (
    <div className="NewOrders">
        <h1>NewOrders</h1>
        <OrderCard></OrderCard>
        <OrderCard></OrderCard>
    </div>
  );
}

export default NewOrders;