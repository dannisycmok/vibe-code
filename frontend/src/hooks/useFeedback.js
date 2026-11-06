import { useCallback, useState } from 'react';

const initialFeedback = {
  open: false,
  message: '',
  severity: 'success',
};

export default function useFeedback() {
  const [feedback, setFeedback] = useState(initialFeedback);

  const showFeedback = useCallback((message, severity = 'success') => {
    setFeedback({ open: true, message, severity });
  }, []);

  const closeFeedback = useCallback((_event, reason) => {
    if (reason === 'clickaway') return;
    setFeedback((current) => ({ ...current, open: false }));
  }, []);

  return { feedback, showFeedback, closeFeedback };
}
