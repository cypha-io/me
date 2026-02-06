"use client";

import { FaLinkedin, FaGithub, FaTwitter, FaExternalLinkAlt, FaMapMarkerAlt, FaEnvelope, FaLink } from "react-icons/fa";
import { profileData } from "@/app/data/profile";

export default function About() {
  return (
    <section
      id="about"
      className="min-h-screen py-20 px-4 bg-gradient-to-b from-white via-gray-50 to-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gray-900">
            About Me
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Passionate Software Engineer dedicated to building innovative solutions with modern technologies
          </p>
        </div>

        {/* Hero Section */}
        <div className="mb-20">
          {/* Profile Info */}
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl font-bold mb-4 text-gray-900">{profileData.name}</h2>
            <p className="text-2xl font-semibold text-blue-500 mb-6">
              {profileData.title}
            </p>
            <p className="text-gray-700 leading-relaxed text-lg mb-10">
              {profileData.bio}
            </p>

            {/* Quick Info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
              <div className="flex items-center gap-3">
                <FaMapMarkerAlt className="text-blue-500 text-xl flex-shrink-0" />
                <span className="text-gray-700 font-medium">{profileData.location}</span>
              </div>
              <div className="flex items-center gap-3">
                <FaEnvelope className="text-blue-500 text-xl flex-shrink-0" />
                <a href={`mailto:${profileData.email}`} className="text-blue-500 hover:text-blue-600 font-medium">
                  {profileData.email}
                </a>
              </div>
              <div className="flex items-center gap-3">
                <FaLinkedin className="text-blue-500 text-xl flex-shrink-0" />
                <a
                  href={profileData.linkedin.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:text-blue-600 font-medium flex items-center gap-2"
                >
                  LinkedIn
                  <FaExternalLinkAlt size={12} />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Skills Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-10 text-center text-gray-900">Skills & Expertise</h3>
          <div className="bg-white rounded-2xl p-10 shadow-lg border border-gray-200">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {profileData.skills.map((skill, index) => (
                <div
                  key={index}
                  className="p-4 bg-blue-50 rounded-xl text-center hover:bg-blue-100 hover:scale-105 transition-all duration-300 border border-blue-200 cursor-pointer group"
                >
                  <p className="font-semibold text-gray-800 group-hover:text-blue-600">{skill}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Experience Section */}
        <div className="mb-20">
          <h3 className="text-3xl font-bold mb-10 text-center text-gray-900">Experience</h3>
          <div className="space-y-6">
            {profileData.experience.map((exp, index) => (
              <div key={index} className="bg-white rounded-2xl p-8 shadow-lg border-l-4 border-blue-500 hover:shadow-xl transition-shadow duration-300">
                <div className="flex justify-between items-start flex-wrap gap-4 mb-4">
                  <div className="flex-1">
                    <h4 className="text-2xl font-bold text-gray-900 mb-2">{exp.title}</h4>
                    <p className="text-lg text-blue-500 font-semibold">{exp.company}</p>
                  </div>
                  <span className="text-sm font-bold text-white bg-blue-500 px-4 py-2 rounded-full whitespace-nowrap">
                    {exp.period}
                  </span>
                </div>
                <p className="text-gray-700 leading-relaxed mb-4">{exp.description}</p>
                {exp.website && (
                  <a
                    href={exp.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-semibold transition-colors"
                  >
                    <FaLink size={14} />
                    Visit {exp.company}
                    <FaExternalLinkAlt size={12} />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Social Links */}
        <div className="text-center">
          <h3 className="text-3xl font-bold mb-12 text-gray-900">Let&apos;s Connect</h3>
          <div className="flex justify-center gap-8 flex-wrap">
            <a
              href={profileData.social.github}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-500 group"
              aria-label="GitHub"
            >
              <FaGithub size={40} className="text-gray-800 group-hover:text-blue-500 transition-colors" />
            </a>
            <a
              href={profileData.social.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-500 group"
              aria-label="LinkedIn"
            >
              <FaLinkedin size={40} className="text-blue-500 group-hover:text-blue-600 transition-colors" />
            </a>
            <a
              href={profileData.social.twitter}
              target="_blank"
              rel="noopener noreferrer"
              className="p-4 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 hover:border-blue-500 group"
              aria-label="Twitter"
            >
              <FaTwitter size={40} className="text-blue-400 group-hover:text-blue-500 transition-colors" />
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
