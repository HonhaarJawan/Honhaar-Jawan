// components/FileUpload.jsx
"use client";

import { useState, useRef, useCallback } from "react";
import {
  FaCloudUploadAlt,
  FaTrash,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFilePowerpoint,
  FaFileImage,
  FaFileAlt,
} from "react-icons/fa";

const FileUpload = ({
  label = "",
  description = "",
  required = false,
  onFileChange,
}) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = useCallback(
    (e) => {
      const selectedFile = e.target.files[0];
      if (selectedFile) {
        setFile(selectedFile);
        if (onFileChange) onFileChange(selectedFile);
      }
    },
    [onFileChange]
  );

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);

      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        setFile(droppedFile);
        if (onFileChange) onFileChange(droppedFile);
      }
    },
    [onFileChange]
  );

  const handleRemoveFile = useCallback(() => {
    setFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (onFileChange) onFileChange(null);
  }, [onFileChange]);

  const formatFileSize = useCallback((bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(4)) + " " + sizes[i];
  }, []);

  const getFileIcon = useCallback(() => {
    if (!file) return null;

    const extension = file.name.split(".").pop().toLowerCase();

    switch (extension) {
      case "pdf":
        return <FaFilePdf className="text-red-500" />;
      case "doc":
      case "docx":
        return <FaFileWord className="text-blue-500" />;
      case "xls":
      case "xlsx":
        return <FaFileExcel className="text-green-600" />;
      case "ppt":
      case "pptx":
        return <FaFilePowerpoint className="text-orange-500" />;
      case "jpg":
      case "jpeg":
      case "png":
      case "gif":
      case "bmp":
        return <FaFileImage className="text-purple-500" />;
      default:
        return <FaFileAlt className="text-gray-500" />;
    }
  }, [file]);

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

   
      {/* Always show the upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-300 mb-4 ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          borderWidth: "2px",
          borderStyle: "dashed",
          borderColor: isDragging ? "#3b82f6" : "#d1d5db",
        }} // extra border for clarity
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          onChange={handleFileChange}
          accept=".jpg,.jpeg,.png,.gif,.bmp,.tiff,.webp,.heic,.pdf,.doc,.docx,.txt,.xls,.xlsx,.ppt,.pptx,.csv,.ods,.odp,.zip"
        />

        <div className="flex flex-col items-center p-4">
          <FaCloudUploadAlt
            className={`text-5xl mb-4 ${
              isDragging ? "text-blue-500" : "text-gray-400"
            }`}
          />
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            Click or Drag & Drop Your File Here
          </h2>
          <div className="pt-2">
            <p className="text-gray-500 text-sm">
              Accepted formats: jpg, jpeg, png, gif, bmp, tiff, webp, heic, pdf,
              doc, docx, txt, xls, xlsx, ppt, pptx, csv, odt, ods, odp, zip
            </p>
          </div>
        </div>
      </div>

      {/* Show file info if a file is selected */}
      {file && (
        <div className="border border-gray-400 rounded-lg overflow-hidden bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-50 border-b border-gray-300">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Preview
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-r border-gray-200">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr className="border-b border-gray-200">
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                    {file.type.includes("image") ? (
                      <img
                        src={URL.createObjectURL(file)}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded border border-gray-200"
                      />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center border border-gray-200 rounded">
                        {getFileIcon()}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap border-r border-gray-100">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                      {file.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                    {formatFileSize(file.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-r border-gray-100">
                    {file.type || file.name.split(".").pop().toUpperCase()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button
                      type="button"
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700 transition-colors border border-red-200 rounded p-1"
                    >
                      <FaTrash className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
