import { render, screen } from '@testing-library/react';
import Login from './Login';

test.skip('renders Sign in', () => {
  render(<Login />);
  const linkElement = screen.getByText(/Sign/i);
  expect(linkElement).toBeInTheDocument();
});
