import React from 'react';
import { render, screen } from '@testing-library/react';
import NewOrders from './NewOrders';

test('renders learn react link', () => {
  render(<NewOrders />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});