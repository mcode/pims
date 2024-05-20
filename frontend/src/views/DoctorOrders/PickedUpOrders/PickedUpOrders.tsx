import OrderCard, { TabStatus } from '../OrderCard/OrderCard';

const PickedUpOrders = () => {
  return (
    <div>
      <h1>Picked Up Orders</h1>
      <OrderCard tabStatus={TabStatus.PICKED_UP} />
    </div>
  );
};

export default PickedUpOrders;
