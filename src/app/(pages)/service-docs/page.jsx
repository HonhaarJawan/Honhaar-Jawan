"use client";

import React, { useState, useEffect } from "react";
import Navbar from "@/components/primary/Navbar";
import Copyright from "@/components/primary/Copyright";
import {
  FaCloudUploadAlt,
  FaCode,
  FaCheckCircle,
  FaServer,
  FaInfoCircle,
  FaTimesCircle,
  FaExclamationTriangle,
} from "react-icons/fa";
import { ImSpinner } from "react-icons/im";
import axios from "axios";

export default function ServiceDocs() {
  const [files, setFiles] = useState([]);
  const [settings, setSettings] = useState({
    quality: 80,
    format: "",
    width: "",
    height: "",
    effort: 4,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [toast, setToast] = useState(null); // { message: string, type: 'success' | 'error' | 'warning' }

  const showToast = (message, type = "info") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3000); // Hide after 3 seconds
  };

  const handleFileChange = (e) => {
    if (e.target.files) {
      setFiles(Array.from(e.target.files));
      setResult(null);
    }
  };

  const checkServer = async () => {
    try {
      const res = await axios.get(
        "https://honhaarjawan.pk/api/webhook/optimize/check-servers-availible"
      );
      setServerStatus(res.data);
      showToast("Server is online!", "success");
    } catch (err) {
      setServerStatus({ available: false });
      showToast("Server check failed", "error");
    }
  };

  const handleOptimize = async () => {
    if (files.length === 0) {
      showToast("Please select at least one image", "warning");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));
    formData.append("quality", settings.quality);
    formData.append("effort", settings.effort);
    if (settings.format) formData.append("format", settings.format);
    if (settings.width) formData.append("width", settings.width);
    if (settings.height) formData.append("height", settings.height);

    try {
      const response = await axios.post(
        "https://honhaarjawan.pk/api/webhook/optimize",
        formData,
        {
          responseType: "blob",
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const stats = {
        originalSize: response.headers["x-original-size"],
        optimizedSize: response.headers["x-optimized-size"],
        savedBytes: response.headers["x-saved-bytes"],
        ratio: response.headers["x-compression-ratio"],
      };

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      const contentDisposition = response.headers["content-disposition"];
      let fileName = "optimized_image";
      if (contentDisposition) {
        const fileNameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (fileNameMatch && fileNameMatch.length === 2)
          fileName = fileNameMatch[1];
      }
      link.setAttribute("download", fileName);

      document.body.appendChild(link);
      link.click();
      link.remove();

      setResult({ stats, fileName });
      showToast("Optimization successful! Download started.", "success");
    } catch (error) {
      console.error("Optimization failed:", error);
      showToast("Optimization failed. Check console for details.", "error");
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getToastIcon = (type) => {
    switch (type) {
      case "success":
        return <FaCheckCircle className="text-green-500" />;
      case "error":
        return <FaTimesCircle className="text-red-500" />;
      case "warning":
        return <FaExclamationTriangle className="text-yellow-500" />;
      default:
        return <FaInfoCircle className="text-blue-500" />;
    }
  };

  const getToastClasses = (type) => {
    switch (type) {
      case "success":
        return "bg-green-100 border-green-400 text-green-700";
      case "error":
        return "bg-red-100 border-red-400 text-red-700";
      case "warning":
        return "bg-yellow-100 border-yellow-400 text-yellow-700";
      default:
        return "bg-blue-100 border-blue-400 text-blue-700";
    }
  };

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50 pt-28 pb-16 relative">
        {toast && (
          <div
            className={`fixed top-24 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border ${getToastClasses(toast.type)} transition-all duration-300 animate-fade-in-down`}
          >
            {getToastIcon(toast.type)}
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToast(null)}
              className="ml-2 opacity-70 hover:opacity-100"
            >
              <FaTimesCircle />
            </button>
          </div>
        )}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Image Optimization Service
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              High-performance image compression and resizing API. Supports
              batch processing, format conversion, and automatic optimization.
            </p>
            <div className="mt-6 flex justify-center gap-4">
              <button
                onClick={checkServer}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <FaServer
                  className={
                    serverStatus?.available ? "text-green-500" : "text-gray-400"
                  }
                />
                Check Server Status
              </button>
            </div>
            {serverStatus && (
              <div className="mt-2 text-sm text-gray-500">
                Status: {serverStatus.available ? "Online" : "Offline"} | Load:{" "}
                {serverStatus.load}
              </div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Testing Interface */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-gray-50">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <FaCloudUploadAlt className="text-primary text-xl" />
                  Try it out
                </h2>
              </div>

              <div className="p-6 space-y-6">
                {/* File Upload */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                    accept="image/*"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <FaCloudUploadAlt className="text-4xl text-gray-400 mb-2" />
                    <span className="text-sm text-gray-600 font-medium">
                      Click to upload images
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      Supports JPG, PNG, WebP, AVIF (Max 10MB)
                    </span>
                  </label>
                </div>

                {files.length > 0 && (
                  <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-md">
                    Selected: {files.length} file(s)
                  </div>
                )}

                {/* Settings */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Quality (1-100)
                    </label>
                    <input
                      type="number"
                      value={settings.quality}
                      onChange={(e) =>
                        setSettings({ ...settings, quality: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      min="1"
                      max="100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Format (Optional)
                    </label>
                    <select
                      value={settings.format}
                      onChange={(e) =>
                        setSettings({ ...settings, format: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                    >
                      <option value="">Original</option>
                      <option value="jpeg">JPEG</option>
                      <option value="png">PNG</option>
                      <option value="webp">WebP</option>
                      <option value="avif">AVIF</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Width (px)
                    </label>
                    <input
                      type="number"
                      value={settings.width}
                      onChange={(e) =>
                        setSettings({ ...settings, width: e.target.value })
                      }
                      className="w-full px-3 py-2 border rounded-md text-sm"
                      placeholder="Auto"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Effort (0-6)
                    </label>
                    <input
                      type="range"
                      value={settings.effort}
                      onChange={(e) =>
                        setSettings({ ...settings, effort: e.target.value })
                      }
                      className="w-full"
                      min="0"
                      max="6"
                    />
                  </div>
                </div>

                <button
                  onClick={handleOptimize}
                  disabled={loading || files.length === 0}
                  className={`w-full py-3 px-4 rounded-md text-white font-medium transition-colors flex items-center justify-center gap-2 ${
                    loading || files.length === 0
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-primary hover:bg-sec2"
                  }`}
                >
                  {loading ? (
                    <>
                      <ImSpinner className="animate-spin" /> Processing...
                    </>
                  ) : (
                    "Optimize Images"
                  )}
                </button>

                {/* Results */}
                {result && (
                  <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 text-green-800 font-semibold mb-2">
                      <FaCheckCircle /> Optimization Complete
                    </div>
                    <div className="grid grid-cols-2 gap-y-2 text-sm text-green-700">
                      <span>Original Size:</span>
                      <span className="font-mono text-right">
                        {formatBytes(result.stats.originalSize)}
                      </span>

                      <span>Optimized Size:</span>
                      <span className="font-mono text-right">
                        {formatBytes(result.stats.optimizedSize)}
                      </span>

                      <span>Saved:</span>
                      <span className="font-mono text-right">
                        {formatBytes(result.stats.savedBytes)}
                      </span>

                      <span>Ratio:</span>
                      <span className="font-mono text-right">
                        {result.stats.ratio}
                      </span>
                    </div>
                    <p className="text-xs text-green-600 mt-3 text-center">
                      File downloaded as: {result.fileName}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Documentation & Examples */}
            <div className="space-y-6">
              <div className="bg-gray-900 rounded-xl shadow-sm overflow-hidden text-gray-300">
                <div className="p-4 border-b border-gray-800 bg-gray-800 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2">
                    <FaCode /> API Usage
                  </h2>
                  <span className="text-xs px-2 py-1 bg-gray-700 rounded">
                    POST
                  </span>
                </div>

                <div className="p-6 space-y-6">
                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Endpoint
                    </h3>
                    <code className="block bg-black p-3 rounded text-sm font-mono text-green-400">
                      https://honhaarjawan.pk/api/webhook/optimize
                    </code>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      cURL Example
                    </h3>
                    <pre className="bg-black p-3 rounded text-xs font-mono overflow-x-auto text-blue-300">
                      {`curl -X POST \\
  -F "files=@image1.jpg" \\
  -F "files=@image2.png" \\
  -F "quality=80" \\
  -F "format=webp" \\
  -o optimized_images.zip \\
  https://honhaarjawan.pk/api/webhook/optimize`}
                    </pre>
                  </div>

                  <div>
                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                      Node.js (Axios)
                    </h3>
                    <pre className="bg-black p-3 rounded text-xs font-mono overflow-x-auto text-yellow-300">
                      {`const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');

const form = new FormData();
form.append('files', fs.createReadStream('image.jpg'));
form.append('quality', '85');

const response = await axios.post(
  'https://honhaarjawan.pk/api/webhook/optimize', 
  form, 
  {
    headers: { ...form.getHeaders() },
    responseType: 'stream' // Important for file download
  }
);

response.data.pipe(fs.createWriteStream('optimized.jpg'));`}
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Copyright />
    </>
  );
}
