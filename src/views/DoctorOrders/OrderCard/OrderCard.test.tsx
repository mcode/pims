import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderCard from './OrderCard';

test('renders Dispense Status', () => {
  render(<OrderCard />);
  const linkElement = screen.getByText(/Dispense Status/i);
  expect(linkElement).toBeInTheDocument();
});