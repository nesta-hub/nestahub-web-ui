import { useParams, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const ProductPage = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to catalogue and pass the slug to open drawer
    navigate('/catalogue', {
      state: { openProductSlug: slug },
      replace: true
    });
  }, [slug, navigate]);

  // Show minimal loading state during redirect
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <p className="text-muted-foreground">Loading product...</p>
      </div>
    </div>
  );
};

export default ProductPage;
