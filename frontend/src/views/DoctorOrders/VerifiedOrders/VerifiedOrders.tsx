import OrderCard from '../OrderCard/OrderCard';

const VerifiedOrders = () => {
  return (
    <div>
      <h1>Verified Orders</h1>
      <OrderCard tabStatus={'Approved'} />
    </div>
  );
};

export default VerifiedOrders;
