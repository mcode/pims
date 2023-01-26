import React from 'react';
import { render, screen } from '@testing-library/react';
import DoctorOrders from './DoctorOrders';

test.skip('renders Doctor Orders', () => {
  render(<DoctorOrders />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});
