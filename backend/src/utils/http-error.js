export function httpError(status, message, errors = undefined) {
  const error = new Error(message);
  error.status = status;
  error.errors = errors;
  return error;
}

export function validationError(errors, message = 'Please check the submitted fields.') {
  return httpError(422, message, errors);
}
