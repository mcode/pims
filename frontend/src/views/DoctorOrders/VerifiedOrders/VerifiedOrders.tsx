import OrderCard, { TabStatus } from '../OrderCard/OrderCard';

const VerifiedOrders = () => {
  return (
    <div>
      <h1>Verified Orders</h1>
      <OrderCard tabStatus={TabStatus.APPROVED} />
    </div>
  );
};

export default VerifiedOrders;
