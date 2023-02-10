import * as React from 'react';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import Slide from '@mui/material/Slide';
import { TransitionProps } from '@mui/material/transitions';
import { Box, Typography } from '@mui/material';
import axios from 'axios';
import { useState } from 'react';


interface DoctorOrder {
    caseNumber?: string;
    patientName?: string;
    patientDOB?: string;
    doctorName?: string;
    doctorContact?: string;
    doctorID?: string;
    doctorEmail?: string;
    drugNames?: string;
    drugPrice?: number;
    quanitities?: string;
    total?: number;
    pickupDate?: string;
    dispenseStatus?: string;
    metRequirements: {
        stakeholderId: string,
        completed: boolean,
        metRequirementId: string,
        requirementName: string,
        requirementDescription: string,
        _id: string
    }[]
}

const VerifyButton = (props: any) => {
    

    //verify the order
    const verifyOrder = () => {
        const url = '/doctorOrders/api/updateRx/' + props.data.row._id;
        axios.patch(url)
            .then(function (response) {
                props.data.getAllDoctorOrders();
                console.log(response.data);
            })
            .catch(error => console.error('Error: $(error'));
    };

    return (
        <Button variant="contained" size="small" onClick={verifyOrder}>Verify Order</Button>
    );
};

export default VerifyButton;