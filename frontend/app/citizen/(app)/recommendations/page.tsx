'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getStoredToken } from '@/services/auth';

interface Scheme {
  slug: string;
  name: string;
 ministry: string;
  level: string;
  brief_description: string;
  categories: string[];
  tags: string[];
  application_url: string;
}

export default function RecommendationsPage() {
  const [recommendations, setRecommendations] = useState<Scheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const token = getStoredToken();
      
      if (!token) {
        setError('Please login to see recommendations');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:8000/api/citizens/recommendations/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setRecommendations(data.recommendations);
      } else {
        setError(data.message || 'Failed to load recommendations');
      }
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Recommended Schemes for You</h1>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-20 bg-gray-200 rounded mb-4"></div>
                <div className="h-10 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-700 text-lg">{error}</p>
            <button 
              onClick={fetchRecommendations}
              className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Recommended Schemes for You</h1>
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-12 text-center">
            <p className="text-yellow-800 text-lg mb-4">
              No recommendations available yet.
            </p>
            <p className="text-gray-600 mb-6">
              Start searching for schemes in the chat to get personalized recommendations!
            </p>
            <Link 
              href="/citizen/chat"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go to Chat
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Recommended Schemes for You</h1>
          <p className="text-gray-600">Based on your profile and search history</p>
        </div>
        
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {recommendations.map((scheme) => (
            <div key={scheme.slug} className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow flex flex-col h-full">
              <div className="p-6 flex flex-col flex-grow">
                {/* Header */}
                <div className="flex justify-between items-start mb-3">
                  <h2 className="text-xl font-semibold text-gray-900 line-clamp-2 flex-grow">
                    {scheme.name}
                  </h2>
                  <span className={`ml-2 px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap ${
                    scheme.level === 'Central' 
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {scheme.level}
                  </span>
                </div>
                
                {/* Ministry */}
                <p className="text-sm text-gray-600 mb-3 line-clamp-1">
                  {scheme.ministry}
                </p>
                
                {/* Description */}
                <p className="text-gray-700 text-sm mb-4 line-clamp-3 flex-grow">
                  {scheme.brief_description}
                </p>
                
                {/* Tags */}
                {scheme.tags && scheme.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {scheme.tags.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                
                {/* Button */}
                <Link 
                  href={`/citizen/schemes/${scheme.slug}`}
                  className="w-full text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}