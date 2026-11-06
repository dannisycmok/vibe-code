import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export default function StatCard({ icon, label, value, helper, color = '#4f46e5' }) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: '1px solid #e7ebf2',
        borderRadius: 3,
        height: '100%',
        transition: 'transform 180ms ease, box-shadow 180ms ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 14px 34px rgba(15, 23, 42, 0.07)',
        },
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Box>
          <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 650 }}>
            {label}
          </Typography>
          <Typography variant="h4" sx={{ mt: 1.1, fontWeight: 800 }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.75 }}>
            {helper}
          </Typography>
        </Box>
        <Box
          sx={{
            width: 44,
            height: 44,
            display: 'grid',
            placeItems: 'center',
            borderRadius: '12px',
            color,
            backgroundColor: `${color}14`,
          }}
        >
          {icon}
        </Box>
      </Stack>
    </Paper>
  );
}
