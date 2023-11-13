import OrderCard from '../OrderCard/OrderCard';
import './PickedUpOrders.css';

const PickedUpOrders = () => {
  return (
    <div className="PickedUpOrders">
      <h1>PickedUpOrders</h1>
      <OrderCard tabStatus={'Picked Up'} />
    </div>
  );
};

export default PickedUpOrders;
