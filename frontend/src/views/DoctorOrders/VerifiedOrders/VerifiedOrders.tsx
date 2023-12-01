import OrderCard from '../OrderCard/OrderCard';
import './VerifiedOrders.css';

const VerifiedOrders = () => {
  return (
    <div className="VerifiedOrders">
      <h1>VerifiedOrders</h1>
      <OrderCard tabStatus={'Approved'} />
    </div>
  );
};

export default VerifiedOrders;
