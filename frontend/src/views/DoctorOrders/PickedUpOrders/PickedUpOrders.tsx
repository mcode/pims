import OrderCard, { TabStatus } from '../OrderCard/OrderCard';
import './PickedUpOrders.css';

const PickedUpOrders = () => {
  return (
    <div className="PickedUpOrders">
      <h1>Picked Up Orders</h1>
      <OrderCard tabStatus={TabStatus.PickedUp} />
    </div>
  );
};

export default PickedUpOrders;
