import React from 'react';
import { render, screen } from '@testing-library/react';
import PickedUpOrders from './PickedUpOrders';

test('renders PickedUpOrders', () => {
  render(<PickedUpOrders />);
  const linkElement = screen.getByText(/PickedUpOrders/i);
  expect(linkElement).toBeInTheDocument();
});