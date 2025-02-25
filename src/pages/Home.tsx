import React from 'react';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900">
            Welcome to Quiz Builder
          </h1>
          <p className="mt-4 text-xl text-gray-600">
            Create and manage your quizzes with ease
          </p>
          <div className="mt-8 space-x-4">
            <Link
              to="/signin"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Sign In
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center px-4 py-2 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-gray-50"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 