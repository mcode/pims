import { render, screen, waitFor } from '@testing-library/react';
import NewOrders from './NewOrders';
import axios from 'axios';

jest.mock('axios');
describe('<NewOrders />', () => {
  it('renders the order card with no doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: [] }));
    render(<NewOrders />);

    await waitFor(() => {
      const linkElement = screen.getByText(/new orders/i);
      expect(linkElement).toBeInTheDocument();
    });
  });
});
