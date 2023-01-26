import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';

test.skip('renders learn react link', () => {
  render(<Login />);
  const linkElement = screen.getByText("Pharmacy");
  expect(linkElement).toBeInTheDocument();
});