import React from 'react';
import { render, screen } from '@testing-library/react';
import PickedUpOrders from './PickedUpOrders';

test('renders learn react link', () => {
  render(<PickedUpOrders />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});