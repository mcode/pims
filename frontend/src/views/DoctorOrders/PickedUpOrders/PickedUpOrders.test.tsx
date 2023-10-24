import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import PickedUpOrders from './PickedUpOrders';
import axios from 'axios';

jest.mock('axios');
describe('<PickedUpOrders />', () => {
  it('renders the order card with no doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: [] }));
    render(<PickedUpOrders />);

    await waitFor(() => {
      const linkElement = screen.getByText(/PickedUpOrders/i);
      expect(linkElement).toBeInTheDocument();
    });
  });
});
