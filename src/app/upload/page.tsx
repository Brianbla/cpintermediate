'use client';

import { useState } from 'react';
import { Settings, Users, Globe } from "lucide-react";
import { UploadZone } from "@/components/upload/UploadZone";
import { SectionContainer, SectionTitle, FeatureCard, Hero } from "@/components/ui";
import { sanitizeTags, sanitizeGalleryName, sanitizeCopyright } from "@/lib/security/sanitization";

export default function UploadPage() {
  const [tags, setTags] = useState('');
  const [galleryName, setGalleryName] = useState('');
  const [copyright, setCopyright] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Sanitize all inputs before processing
    const sanitizedTags = sanitizeTags(tags);
    const sanitizedGalleryName = sanitizeGalleryName(galleryName);
    const sanitizedCopyright = sanitizeCopyright(copyright);
    
    console.log('Sanitized data:', {
      tags: sanitizedTags,
      galleryName: sanitizedGalleryName,
      copyright: sanitizedCopyright,
    });
    
    // Here you would send to API
  };

  return (
    <div className="page-gradient">
      <Hero 
        title="Upload Your Photos"
        description="Share your photography with automatic optimization, tagging, and organization. Perfect for building your portfolio or sharing with clients."
      />
      
      <SectionContainer className="pb-0">        
        {/* Upload Zone */}
        <div className="mb-12">
          <UploadZone />
        </div>
      </SectionContainer>

      <SectionContainer bgColor="bg-slate-100 dark:bg-slate-800/50">
        <SectionTitle title="Upload Features" />
        
        {/* Upload Options */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <FeatureCard 
            icon={Settings}
            title="Automatic Optimization"
            description="Your photos are automatically resized and optimized for web viewing while preserving quality."
            iconColor="text-green-600"
          />

          <FeatureCard 
            icon={Users}
            title="Client Sharing"
            description="Create private galleries for client review and approval with download controls."
            iconColor="text-purple-600"
          />

          <FeatureCard 
            icon={Globe}
            title="Public Portfolio"
            description="Showcase your best work with customizable public galleries and SEO optimization."
            iconColor="text-blue-600"
          />
        </div>

        {/* Upload Settings */}
        <form onSubmit={handleSubmit} className="card-base p-6">
          <SectionTitle title="Upload Settings" className="!mb-6" />
          
          <div className="grid md:grid-cols-2 gap-8">
            {/* Gallery Assignment */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Assign to Gallery
              </label>
              <select 
                className="form-select"
                value={galleryName}
                onChange={(e) => setGalleryName(e.target.value)}
              >
                <option>Select a gallery...</option>
                <option>Wedding - Sarah & John</option>
                <option>Corporate Headshots</option>
                <option>Nature Portfolio</option>
                <option>Street Photography</option>
              </select>
            </div>

            {/* Visibility */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Visibility
              </label>
              <select className="form-select">
                <option>Public</option>
                <option>Private</option>
                <option>Client Review</option>
                <option>Draft</option>
              </select>
            </div>

            {/* Tags */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Tags (comma-separated, max 20 tags)
              </label>
              <input
                type="text"
                placeholder="wedding, portrait, outdoor, professional..."
                className="form-input"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                maxLength={500}
              />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Only alphanumeric characters, spaces, hyphens, and underscores are allowed
              </p>
            </div>

            {/* Copyright */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Copyright Notice
              </label>
              <input
                type="text"
                placeholder="© 2024 Your Photography Studio"
                className="form-input"
                value={copyright}
                onChange={(e) => setCopyright(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <button type="submit" className="btn-primary flex-1 py-3">
              Upload & Process
            </button>
            <button type="button" className="btn-secondary px-6 py-3">
              Save as Draft
            </button>
          </div>
        </form>
      </SectionContainer>
    </div>
  );
}
