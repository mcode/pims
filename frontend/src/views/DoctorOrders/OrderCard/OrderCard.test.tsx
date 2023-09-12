import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import OrderCard from './OrderCard';
import axios from 'axios';

const doctorOrders = [{caseNumber: '1694010494795',
  dispenseStatus: 'Pending',
  doctorContact: '716-873-1557',
  doctorEmail: 'jane.betty@myhospital.com',
  doctorID: '1122334455',
  doctorName: 'Dr. Jane Doe',
  drugNames:'Turalio 200 MG Oral Capsule',
  drugNdcCode: '65597-402-20',
  drugPrice: 200,
  metRequirements: [],
  patientCity: 'Winterfell',
  patientCountry: 'US',
  patientDOB: '1996-06-01',
  patientFirstName: 'Jon',
  patientLastName: 'Snow',
  patientName: 'Jon Snow',
  patientPostalCode: '00008',
  patientStateProvince: 'Westeros',
  pickupDate: 'Tue Dec 13 2022',
  quanitities: '90',
  rxDate: '2020-07-11',
  simpleDrugName: 'Turalio',
  total: 1800}];

jest.mock('axios');

describe('<OrderCard />', () => {
  it('renders the order card with no doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: [] }));
    render(<OrderCard tabStatus = {'Pending'}/>);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /no orders yet\./i })).toBeInTheDocument();
    });
  });

  it('renders the order card and any doctor orders', async () => {
    axios.get = jest.fn().mockImplementationOnce(() => Promise.resolve({ data: doctorOrders }));
    render(<OrderCard tabStatus = {'Pending'}/>);

    await waitFor(() => {
      expect(screen.getByText(/Jon Snow/i)).toBeInTheDocument();
      expect(screen.getByText(/1996/i)).toBeInTheDocument();
      expect(screen.getByText(/Turalio/i)).toBeInTheDocument();
      expect(screen.getByText(/Pending/i)).toBeInTheDocument();
      // expect(screen.getByTestId('quantities')).toBeInTheDocument();
      // expect(screen.getByTestId('drugPrice')).toBeInTheDocument();
      // expect(screen.getByTestId('total')).toBeInTheDocument();
      // expect(screen.getByTestId('doctorName')).toBeInTheDocument();
      // expect(screen.getByTestId('doctorID')).toBeInTheDocument();
      // expect(screen.getByTestId('doctorContact')).toBeInTheDocument();
      // expect(screen.getByTestId('doctorEmail')).toBeInTheDocument();
      // expect(screen.getByTestId('pickupDate')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /remove all/i })).toBeInTheDocument();
    });
  });
});