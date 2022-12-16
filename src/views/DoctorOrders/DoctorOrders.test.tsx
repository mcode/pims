import React from 'react';
import { render, screen } from '@testing-library/react';
import DoctorOrders from './DoctorOrders';

test.skip('renders learn react link', () => {
  render(<DoctorOrders />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});