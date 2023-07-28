import OrderCard, { TabStatus } from '../OrderCard/OrderCard';
import './NewOrders.css';

const NewOrders = () => {
  return (
    <div className="NewOrders">
      <h1>New Orders</h1>
      <OrderCard tabStatus={TabStatus.Pending} />
    </div>
  );
};

export default NewOrders;
