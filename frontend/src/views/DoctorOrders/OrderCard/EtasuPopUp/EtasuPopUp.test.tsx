import React from 'react';
import { render, screen } from '@testing-library/react';
import EtasuPopUp from './EtasuPopUp';

test.skip('renders Status', () => {
  render(<EtasuPopUp />);
  const linkElement = screen.getByText('Total');
  expect(linkElement).toBeInTheDocument();
});
