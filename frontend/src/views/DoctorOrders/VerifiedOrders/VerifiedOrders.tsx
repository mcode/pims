import OrderCard, { TabStatus } from '../OrderCard/OrderCard';
import './VerifiedOrders.css';

const VerifiedOrders = () => {
  return (
    <div className="VerifiedOrders">
      <h1>Verified Orders</h1>
      <OrderCard tabStatus={TabStatus.Approved} />
    </div>
  );
};

export default VerifiedOrders;
