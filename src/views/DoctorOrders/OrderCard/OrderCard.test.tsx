import React from 'react';
import { render, screen } from '@testing-library/react';
import OrderCard from './OrderCard';

test('renders learn react link', () => {
  render(<OrderCard />);
  const linkElement = screen.getByText(/learn react/i);
  expect(linkElement).toBeInTheDocument();
});