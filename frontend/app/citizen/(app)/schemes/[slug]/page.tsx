'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { getStoredToken } from '@/services/auth';

interface Scheme {
  slug: string;
  name: string;
  short_title: string;
  level: string;
  ministry: string;
  brief_description: string;
  eligibility: string;
  benefits: string;
  application_process: string;
  application_url: string;
  categories: string[];
  tags: string[];
}

export default function SchemeDetailPage() {
  const { slug } = useParams();
  const [scheme, setScheme] = useState<Scheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      fetchSchemeDetails();
    }
  }, [slug]);

  const fetchSchemeDetails = async () => {
    try {
      const token = getStoredToken();
      
      const response = await fetch(`http://localhost:8000/api/citizens/schemes/${slug}/`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      const data = await response.json();
      
      if (data.status === 'success') {
        setScheme(data.scheme);
      } else {
        setError(data.message || 'Scheme not found');
      }
    } catch (err) {
      console.error('Error fetching scheme:', err);
      setError('Failed to load scheme details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="bg-white rounded-lg shadow-md p-8">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-6"></div>
              <div className="space-y-6">
                <div className="h-24 bg-gray-200 rounded"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
                <div className="h-24 bg-gray-200 rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !scheme) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-700 text-lg">{error || 'Scheme not found'}</p>
            <Link href="/citizen/recommendations" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to Recommendations
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back button */}
        <Link 
          href="/citizen/recommendations" 
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          ← Back to Recommendations
        </Link>
        
        {/* Main card */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header */}
          <div className="border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-6">
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                {scheme.short_title && (
                  <p className="text-sm text-blue-600 mb-1">{scheme.short_title}</p>
                )}
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {scheme.name}
                </h1>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full whitespace-nowrap ${
                scheme.level === 'Central' 
                  ? 'bg-blue-100 text-blue-800'
                  : 'bg-green-100 text-green-800'
              }`}>
                {scheme.level}
              </span>
            </div>
            <p className="text-gray-600 mt-2">{scheme.ministry}</p>
          </div>
          
          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Brief Description */}
            {scheme.brief_description && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📖</span> Description
                </h2>
                <p className="text-gray-700 leading-relaxed">
                  {scheme.brief_description}
                </p>
              </div>
            )}
            
            
            {/* Eligibility */}
            {scheme.eligibility && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">✅</span> Eligibility Criteria
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {scheme.eligibility}
                  </div>
                </div>
              </div>
            )}
            
            {/* Benefits */}
            {scheme.benefits && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🎁</span> Benefits
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {scheme.benefits}
                  </div>
                </div>
              </div>
            )}
            
            {/* How to Apply */}
            {scheme.application_process && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📋</span> How to Apply
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="text-gray-700 leading-relaxed whitespace-pre-line">
                    {scheme.application_process}
                  </div>
                </div>
              </div>
            )}
            
            {/* Categories */}
            {scheme.categories && scheme.categories.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">📂</span> Categories
                </h2>
                <div className="flex flex-wrap gap-2">
                  {scheme.categories.map((cat, idx) => (
                    <span key={idx} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Tags */}
            {scheme.tags && scheme.tags.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <span className="mr-2">🏷️</span> Tags
                </h2>
                <div className="flex flex-wrap gap-2">
                  {scheme.tags.map((tag, idx) => (
                    <span key={idx} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Apply Button */}
            {scheme.application_url && (
              <div className="pt-4 border-t border-gray-200">
                <a 
                  href={scheme.application_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Apply Now
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}