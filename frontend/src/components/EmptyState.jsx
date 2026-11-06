import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Inventory2OutlinedIcon from '@mui/icons-material/Inventory2Outlined';

export default function EmptyState({
  icon,
  title,
  description,
  action,
}) {
  return (
    <Stack alignItems="center" justifyContent="center" sx={{ py: 7, px: 2, textAlign: 'center' }}>
      <Box
        sx={{
          width: 58,
          height: 58,
          display: 'grid',
          placeItems: 'center',
          borderRadius: '16px',
          color: 'primary.main',
          backgroundColor: 'rgba(79, 70, 229, 0.08)',
          mb: 2,
        }}
      >
        {icon || <Inventory2OutlinedIcon />}
      </Box>
      <Typography variant="h6">{title}</Typography>
      <Typography color="text.secondary" sx={{ mt: 0.5, maxWidth: 400 }}>
        {description}
      </Typography>
      {action && <Box sx={{ mt: 2.5 }}>{action}</Box>}
    </Stack>
  );
}
