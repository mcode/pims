import React from 'react';
import { render, screen } from '@testing-library/react';
import NewOrders from './NewOrders';

test('renders NewOrders', async () => {
  render(<NewOrders />);
  const linkElement = await screen.getByText(/NewOrders/i);
  expect(linkElement).toBeInTheDocument();
});