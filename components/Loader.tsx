
import React from 'react';

const Loader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
      <p className="text-lg text-purple-300 font-semibold">Generating creativity...</p>
    </div>
  );
};

export default Loader;
