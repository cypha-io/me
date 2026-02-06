"use client";

import { FaExternalLinkAlt, FaGithub } from "react-icons/fa";
import { profileData } from "@/app/data/profile";

export default function Projects() {
  return (
    <section
      id="projects"
      className="min-h-screen py-20 px-4 bg-gradient-to-b from-white via-gray-50 to-white"
    >
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-20">
          <h1 className="text-5xl sm:text-6xl font-bold mb-6 text-gray-900">
            Projects
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Innovative solutions and platforms I&apos;ve built to solve real-world problems
          </p>
        </div>

        {/* Projects Grid */}
        <div className="space-y-8">
          {profileData.projects.map((project, index) => (
            <div
              key={index}
              className="bg-white rounded-2xl p-8 sm:p-10 shadow-lg hover:shadow-2xl transition-shadow duration-300 border border-gray-200"
            >
              {/* Project Header */}
              <div className="mb-6">
                <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
                  <div>
                    <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                      {project.title}
                    </h2>
                    <span className="inline-block px-4 py-2 bg-blue-100 text-blue-600 font-semibold rounded-full text-sm">
                      {project.category}
                    </span>
                  </div>
                </div>
              </div>

              {/* Project Description */}
              <p className="text-gray-700 text-lg leading-relaxed mb-6">
                {project.description}
              </p>

              {/* Highlights */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Key Features
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.highlights.map((highlight, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
                    >
                      ✓ {highlight}
                    </span>
                  ))}
                </div>
              </div>

              {/* Technologies */}
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wide mb-3">
                  Technologies Used
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.technologies.map((tech, idx) => (
                    <span
                      key={idx}
                      className="px-4 py-2 bg-gradient-to-br from-gray-100 to-gray-200 text-gray-700 rounded-lg text-sm font-semibold border border-gray-300"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 flex-wrap">
                <a
                  href={project.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-500 text-white font-semibold rounded-lg hover:bg-blue-600 transition-colors duration-300 shadow-md hover:shadow-lg"
                >
                  <FaExternalLinkAlt size={16} />
                  Visit Project
                </a>
                {index === 0 || index === 1 ? (
                  <a
                    href={profileData.social.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:border-blue-500 hover:text-blue-500 transition-colors duration-300"
                  >
                    <FaGithub size={16} />
                    View Code
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="mt-20 bg-white rounded-2xl p-10 shadow-lg border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-8 text-center">
            Projects Overview
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">
                {profileData.projects.length}
              </p>
              <p className="text-gray-600 font-medium">Active Projects</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">2000+</p>
              <p className="text-gray-600 font-medium">Active Users</p>
            </div>
            <div className="text-center">
              <p className="text-4xl font-bold text-blue-500 mb-2">4.9/5</p>
              <p className="text-gray-600 font-medium">Avg. Rating</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
