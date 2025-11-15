import React from 'react';
import { Link } from 'react-router-dom';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-white">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
            About YuvroCode
          </h1>
          
          <div className="prose prose-lg mx-auto mb-12">
            <p className="text-xl text-gray-600 leading-relaxed">
              YuvroCode is a comprehensive learning management system designed to bridge 
              the gap between education and industry. We connect aspiring developers with 
              experienced instructors and forward-thinking recruiters.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 mb-16">
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Mission</h2>
              <p className="text-gray-600 leading-relaxed">
                To democratize access to quality tech education and create meaningful 
                connections between learners and industry professionals. We believe 
                everyone deserves the opportunity to build a successful career in technology.
              </p>
            </div>
            
            <div>
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">Our Vision</h2>
              <p className="text-gray-600 leading-relaxed">
                A world where geographical boundaries don't limit access to quality 
                education and career opportunities. We envision a global community 
                of learners and professionals supporting each other's growth.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 p-8 rounded-lg mb-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              What We Offer
            </h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">For Learners</h3>
                <p className="text-gray-600 text-sm">
                  Interactive courses, personalized learning paths, and direct access to industry mentors.
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">For Instructors</h3>
                <p className="text-gray-600 text-sm">
                  Tools to create engaging content, track student progress, and build your teaching brand.
                </p>
              </div>
              <div className="text-center">
                <h3 className="font-semibold text-gray-900 mb-2">For Recruiters</h3>
                <p className="text-gray-600 text-sm">
                  Access to a pool of skilled candidates and tools to streamline your hiring process.
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-lg transition duration-300"
            >
              Join Our Community
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;