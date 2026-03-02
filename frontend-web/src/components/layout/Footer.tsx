import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* About */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">ConnectMyTask</h3>
            <p className="text-sm">
              A platform connecting service providers with clients for various tasks.
            </p>
          </div>

          {/* For Clients */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Clients</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/browse-tasks" className="hover:text-white transition">
                  Browse Tasks
                </Link>
              </li>
              <li>
                <Link to="/post-task" className="hover:text-white transition">
                  Post a Task
                </Link>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  How it Works
                </a>
              </li>
            </ul>
          </div>

          {/* For Providers */}
          <div>
            <h4 className="text-white font-semibold mb-4">For Providers</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="hover:text-white transition">
                  Find Work
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Become a Provider
                </a>
              </li>
              <li>
                <a href="#" className="hover:text-white transition">
                  Resources
                </a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="text-white font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/about" className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/privacy-policy" className="hover:text-white transition">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms-of-service" className="hover:text-white transition">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-gray-800 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-sm">
              © {currentYear} ConnectMyTask. All rights reserved.
            </p>
            <div className="flex gap-4 mt-4 md:mt-0">
              <a href="#" className="hover:text-white transition text-sm">
                Facebook
              </a>
              <a href="#" className="hover:text-white transition text-sm">
                Twitter
              </a>
              <a href="#" className="hover:text-white transition text-sm">
                LinkedIn
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
