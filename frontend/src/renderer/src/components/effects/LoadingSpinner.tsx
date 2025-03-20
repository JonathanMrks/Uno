export const LoadingSpinner = () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-secondary/60 z-50">
      <div className="loading-spinner">
        <div className="spinner-dot spinner-dot-1"></div>
        <div className="spinner-dot spinner-dot-2"></div>
        <div className="spinner-dot spinner-dot-3"></div>
      </div>
    </div>
  );
};
