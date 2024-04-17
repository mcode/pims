import OrderCard, { TabStatus } from '../OrderCard/OrderCard';

const NewOrders = () => {
  return (
    <div>
      <h1>New Orders</h1>
      <OrderCard tabStatus={TabStatus.PENDING} />
    </div>
  );
};

export default NewOrders;
