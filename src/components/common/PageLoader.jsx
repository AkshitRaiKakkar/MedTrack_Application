import Loader from "./Loader";

export default function PageLoader() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Loader text="Loading page..." />
    </div>
  );
}
