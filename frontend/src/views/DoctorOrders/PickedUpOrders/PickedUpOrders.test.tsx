import React from 'react';
import { render, screen } from '@testing-library/react';
import PickedUpOrders from './PickedUpOrders';

test('renders PickedUpOrders', async () => {
  render(<PickedUpOrders />);
  const linkElement = await screen.getByText(/PickedUpOrders/i);
  expect(linkElement).toBeInTheDocument();
});