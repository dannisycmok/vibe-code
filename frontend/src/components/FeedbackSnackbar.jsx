import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';

export default function FeedbackSnackbar({ feedback, onClose }) {
  return (
    <Snackbar
      open={feedback.open}
      autoHideDuration={4200}
      onClose={onClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
    >
      <Alert
        severity={feedback.severity}
        variant="filled"
        onClose={onClose}
        sx={{ borderRadius: 2, boxShadow: 4 }}
      >
        {feedback.message}
      </Alert>
    </Snackbar>
  );
}
