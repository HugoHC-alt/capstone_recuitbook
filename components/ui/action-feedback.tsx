type ActionFeedbackProps = {
  error?: string | null;
  success?: string | null;
};

export function ActionFeedback({ error = null, success = null }: ActionFeedbackProps) {
  if (!error && !success) {
    return null;
  }

  return (
    <>
      {error ? (
        <p role="alert" className="text-body text-error">
          {error}
        </p>
      ) : null}
      {success ? (
        <p role="status" className="text-body text-success-fg">
          {success}
        </p>
      ) : null}
    </>
  );
}
