import React from 'react';
import { render, screen } from '@testing-library/react';
import NewOrders from './NewOrders';

test('renders NewOrders', () => {
  render(<NewOrders />);
  const linkElement = screen.getByText(/NewOrders/i);
  expect(linkElement).toBeInTheDocument();
});