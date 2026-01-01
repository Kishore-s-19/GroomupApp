import "./PageSkeleton.css";

const PageSkeleton = () => {
  return (
    <div className="page-skeleton">
      {/* Header Skeleton */}
      <div className="skeleton-header">
        <div className="skeleton-logo shimmer"></div>
        <div className="skeleton-nav">
          <div className="skeleton-link shimmer"></div>
          <div className="skeleton-link shimmer"></div>
          <div className="skeleton-link shimmer"></div>
        </div>
      </div>

      {/* Hero Skeleton */}
      <div className="skeleton-hero shimmer"></div>

      {/* Content Blocks */}
      <div className="skeleton-content">
        <div className="skeleton-card shimmer"></div>
        <div className="skeleton-card shimmer"></div>
        <div className="skeleton-card shimmer"></div>
      </div>
    </div>
  );
};

export default PageSkeleton;
