import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full py-6 mt-auto bg-gradient-to-r from-white via-gray-100 to-white border-t shadow-inner">
      <div className="container mx-auto px-4 text-center">
        <p className="text-sm text-gray-700">
        Developed <span className="text-red-500 font-semibold"></span> by{' '}
          <a
            href="https://ushodayanetworks.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 font-semibold hover:text-blue-800 transition-colors duration-300"
          >
            UshodayaNetworks
          </a>
        </p>
        {/* <p className="mt-1 text-xs text-gray-500 italic">
        Innovate | Automate | Elevate
        </p> */}
      </div>
    </footer>
  );
};
