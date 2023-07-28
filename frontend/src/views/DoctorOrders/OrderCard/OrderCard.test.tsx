import { render, screen, waitFor } from '@testing-library/react';
import OrderCard, { TabStatus } from './OrderCard';
import axios from 'axios';
import doctorOrders from './__mocks__/doctorOrders.json';

jest.mock('axios');

describe('<OrderCard />', () => {
  it('renders the order card with no doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: [] }));
    render(<OrderCard tabStatus={TabStatus.PickedUp} />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /no orders yet\./i })).toBeInTheDocument();
    });
  });

  it('renders the order card and any doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: doctorOrders }));
    render(<OrderCard tabStatus={TabStatus.PickedUp} />);

    await waitFor(() => {
      expect(screen.getByTestId('patientName')).toBeInTheDocument();
      expect(screen.getByTestId('patientDOB')).toBeInTheDocument();
      expect(screen.getByTestId('drugNames')).toBeInTheDocument();
      expect(screen.getByTestId('dispenseStatus')).toBeInTheDocument();
      expect(screen.getByTestId('quantities')).toBeInTheDocument();
      expect(screen.getByTestId('drugPrice')).toBeInTheDocument();
      expect(screen.getByTestId('total')).toBeInTheDocument();
      expect(screen.getByTestId('doctorName')).toBeInTheDocument();
      expect(screen.getByTestId('doctorID')).toBeInTheDocument();
      expect(screen.getByTestId('doctorContact')).toBeInTheDocument();
      expect(screen.getByTestId('doctorEmail')).toBeInTheDocument();
      expect(screen.getByTestId('pickupDate')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
    });
  });
});
