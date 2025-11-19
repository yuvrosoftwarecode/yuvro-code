import React from "react";
import Navigation from "../../components/Navigation";

const Vinod: React.FC = () => {
  return (
    <div>
      <Navigation />
      <div className="container mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4">Vinod's Page</h1>
        <p>Hello Vinod</p>
      </div>
    </div>
  );
};

export default Vinod;   