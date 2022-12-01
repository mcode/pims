import React from 'react';
import { render, screen } from '@testing-library/react';
import VerifiedOrders from './VerifiedOrders';

test('renders learn react link', () => {
  render(<VerifiedOrders />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});