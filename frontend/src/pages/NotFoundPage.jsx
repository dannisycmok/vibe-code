import { Link as RouterLink } from 'react-router-dom';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import ArrowBackRoundedIcon from '@mui/icons-material/ArrowBackRounded';

export default function NotFoundPage() {
  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid #e7ebf2',
        borderRadius: 3,
        p: { xs: 4, md: 8 },
        textAlign: 'center',
      }}
    >
      <Typography
        variant="h1"
        sx={{
          fontSize: { xs: '4rem', md: '6rem' },
          background: 'linear-gradient(120deg, #4f46e5, #0f9f95)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        404
      </Typography>
      <Typography variant="h5" sx={{ mt: 1 }}>
        This page is not in the catalog.
      </Typography>
      <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
        The page you are looking for does not exist or has moved.
      </Typography>
      <Button component={RouterLink} to="/" variant="contained" startIcon={<ArrowBackRoundedIcon />}>
        Back to dashboard
      </Button>
    </Paper>
  );
}
