import { render, screen } from '@testing-library/react';
import EtasuPopUp from './EtasuPopUp';
import doctorOrders from '../__mocks__/doctorOrders.json';
import { DoctorOrder } from '../OrderCard';

test('renders Status', async () => {
  // Enums with strings somehow are not considered strings
  const doctorOrder = doctorOrders[0] as unknown;
  render(<EtasuPopUp data={doctorOrder as DoctorOrder} />);
  console.log('url', screen.logTestingPlaygroundURL());

  const linkElement = screen.getByText('Total');
  expect(linkElement).toBeInTheDocument();
});
