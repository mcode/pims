import OrderCard from '../OrderCard/OrderCard';

const NewOrders = () => {
  return (
    <div>
      <h1>New Orders</h1>
      <OrderCard tabStatus={'Pending'} />
    </div>
  );
};

export default NewOrders;
