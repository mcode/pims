import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import VerifiedOrders from './VerifiedOrders';
import axios from 'axios';

jest.mock('axios');
describe('<VerifiedOrders />', () => {
  it('renders the order card with no doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: [] }));
    render(<VerifiedOrders />);

    await waitFor(() => {
      const linkElement = screen.getByText(/VerifiedOrders/i);
      expect(linkElement).toBeInTheDocument();
    });
  });
});
