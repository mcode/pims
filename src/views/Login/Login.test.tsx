import React from 'react';
import { render, screen } from '@testing-library/react';
import Login from './Login';

test('renders Sign in', () => {
  render(<Login />);
  const linkElement = screen.getByText(/Sign in/i);
  expect(linkElement).toBeInTheDocument();
});