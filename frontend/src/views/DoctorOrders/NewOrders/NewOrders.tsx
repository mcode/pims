import OrderCard from '../OrderCard/OrderCard';
import './NewOrders.css';

const NewOrders = () => {
  return (
    <div className="NewOrders">
      <h1>NewOrders</h1>
      <OrderCard tabStatus={'Pending'} />
    </div>
  );
};

export default NewOrders;
