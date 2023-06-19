import { createTheme } from '@mui/material/styles';
const colors = {
    white: '#fff',
    black: '#222',
    red: '#d95d77',
    redLight: '#f50057',
    blue: '#5d89a1',
    green: '#28a745',
    gray: '#4a4a4a',
    grayLight: '#4e5258',
    grayLighter: '#b5b6ba',
    grayLightest: '#f2f3f9',
};

const paletteBase = {
    primary: {
        main: colors.blue
    },
    secondary: {
        main: colors.redLight,
        success: colors.green
    },
    error: {
        main: colors.red
    },
    common: colors,
    background: {
        default: colors.grayLightest,
        primary: colors.grayLight
    },
    text: {
        primary: colors.black,
        secondary: colors.black,
        gray: colors.grayLighter
    },
};

const theme = createTheme({
    palette: { ...paletteBase },
});

export default theme;
