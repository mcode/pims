import React from 'react';
import { render, screen } from '@testing-library/react';
import VerifiedOrders from './VerifiedOrders';

test('renders VerifiedOrders', async () => {
  render(<VerifiedOrders />);
  const linkElement = await screen.getByText(/VerifiedOrders/i);
  expect(linkElement).toBeInTheDocument();
});