import React from 'react';
import { render, screen } from '@testing-library/react';
import VerifiedOrders from './VerifiedOrders';

test('renders VerifiedOrders', () => {
  render(<VerifiedOrders />);
  const linkElement = screen.getByText(/VerifiedOrders/i);
  expect(linkElement).toBeInTheDocument();
});