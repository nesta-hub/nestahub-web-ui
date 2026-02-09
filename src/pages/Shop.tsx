import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Layout } from "@/components/layout";

const Shop = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to bundles as the default shop view
    navigate("/bundles", { replace: true });
  }, [navigate]);

  return (
    <Layout>
      {/* This will briefly show while redirecting */}
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    </Layout>
  );
};

export default Shop;
