import OrderCard from '../OrderCard/OrderCard';

const PickedUpOrders = () => {
  return (
    <div>
      <h1>Picked Up Orders</h1>
      <OrderCard tabStatus={'Picked Up'} />
    </div>
  );
};

export default PickedUpOrders;
