import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderCard from './OrderCard';

test.skip('renders Status', () => {
  render(<OrderCard />);
  const linkElement = screen.getByText("Total");
  expect(linkElement).toBeInTheDocument();
});