"use client";
import React, { useState, useRef, useCallback } from "react";
import JSZip from "jszip";

// Import the actual background removal library
const backgroundRemoval =
  typeof window !== "undefined"
    ? () =>
        import("@imgly/background-removal").then((mod) => mod.default || mod)
    : () => Promise.resolve(null);

export default function BackgroundRemover() {
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [batchProgress, setBatchProgress] = useState({
    current: 0,
    total: 0,
    processing: false,
  });
  const [batchComplete, setBatchComplete] = useState(false);

  // Refs
  const fileInputRef = useRef(null);

  const currentImage = images.find((img) => img.id === selectedImage);

  // Process a single image with the actual AI library
  const processImage = useCallback(async (image) => {
    console.log(`Removing background for image ${image.id}`);

    setImages((prev) =>
      prev.map((img) =>
        img.id === image.id ? { ...img, processing: true } : img
      )
    );

    try {
      // Load the background removal library
      const removeBackground = await backgroundRemoval();
      if (!removeBackground) {
        throw new Error("Background removal library not available");
      }

      // Convert image file to blob URL
      const imageBlob = new Blob([await image.file.arrayBuffer()], {
        type: image.file.type,
      });
      const imageUrl = URL.createObjectURL(imageBlob);

      // Remove background using the AI library
      const blob = await removeBackground(imageUrl, {
        publicPath: "/api/", // Path to the model files
        debug: false,
        model: "medium", // "small", "medium", or "large"
      });

      const processedUrl = URL.createObjectURL(blob);

      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id
            ? {
                ...img,
                processedUrl,
                processedSize: blob.size,
                processed: true,
                processing: false,
              }
            : img
        )
      );

      // Clean up the original blob URL
      URL.revokeObjectURL(imageUrl);

      return { success: true, imageId: image.id };
    } catch (error) {
      console.error("Background removal error:", error);

      setImages((prev) =>
        prev.map((img) =>
          img.id === image.id
            ? { ...img, processing: false, error: error.message }
            : img
        )
      );

      return { success: false, imageId: image.id, error: error.message };
    }
  }, []);

  // Batch processing
  const processBatch = useCallback(async () => {
    if (images.length === 0) return;

    const imagesToProcess = images.filter((img) => !img.processed);

    setBatchProgress({
      current: 0,
      total: imagesToProcess.length,
      processing: true,
    });
    setProcessing(true);
    setBatchComplete(false);

    await new Promise((resolve) => setTimeout(resolve, 100));

    let completedCount = 0;

    // Process images sequentially to avoid overloading
    for (const image of imagesToProcess) {
      if (batchComplete) break;

      await processImage(image);
      completedCount++;
      setBatchProgress((prev) => ({ ...prev, current: completedCount }));
    }

    setBatchComplete(true);
    setTimeout(() => {
      setBatchProgress({ current: 0, total: 0, processing: false });
      setProcessing(false);
      setBatchComplete(false);
    }, 5000);
  }, [images, processImage, batchComplete]);

  // Cancel batch processing
  const cancelBatch = useCallback(() => {
    setBatchProgress({ current: 0, total: 0, processing: false });
    setProcessing(false);
    setBatchComplete(true);

    setImages((prev) => prev.map((img) => ({ ...img, processing: false })));
  }, []);

  // File handling
  const handleFiles = useCallback(
    async (files) => {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      );

      if (imageFiles.length === 0) return;

      const newImages = await Promise.all(
        imageFiles.map(async (file) => {
          const originalUrl = URL.createObjectURL(file);
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = originalUrl;
          });

          return {
            id: Math.random().toString(36).substr(2, 9),
            file,
            originalUrl,
            originalSize: file.size,
            processedUrl: null,
            processedSize: null,
            processed: false,
            processing: false,
            dimensions: {
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
          };
        })
      );

      setImages((prev) => [...prev, ...newImages]);

      if (newImages.length > 0 && !selectedImage) {
        const randomIndex = Math.floor(Math.random() * newImages.length);
        setSelectedImage(newImages[randomIndex].id);
      }
    },
    [selectedImage]
  );

  // File input handler
  const handleFileInput = (files) => {
    handleFiles(files);
  };

  // Drag and drop handlers
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault();
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFileInput(files);
    },
    [handleFileInput]
  );

  // Download processed image
  const downloadImage = useCallback((image) => {
    if (!image.processedUrl) return;

    const link = document.createElement("a");
    link.href = image.processedUrl;
    link.download = `background-removed-${image.file.name.split(".")[0]}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, []);

  // Download all processed images as ZIP
  const downloadAllAsZip = useCallback(async () => {
    const processedImages = images.filter((img) => img.processedUrl);
    if (processedImages.length === 0) return;

    try {
      setProcessing(true);

      const zip = new JSZip();
      let processedCount = 0;

      const batchSize = 10;
      for (let i = 0; i < processedImages.length; i += batchSize) {
        const batch = processedImages.slice(i, i + batchSize);

        await Promise.all(
          batch.map(async (image) => {
            try {
              const response = await fetch(image.processedUrl);
              if (!response.ok) throw new Error("Failed to fetch image");

              const blob = await response.blob();
              const filename = `background-removed-${image.file.name.split(".")[0]}.png`;
              zip.file(filename, blob);

              processedCount++;
            } catch (error) {
              console.error(`Failed to process ${image.file.name}:`, error);
            }
          })
        );
      }

      const zipBlob = await zip.generateAsync({
        type: "blob",
        compression: "DEFLATE",
        compressionOptions: { level: 6 },
      });

      const url = URL.createObjectURL(zipBlob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "background-removed-images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (error) {
      console.error("Error creating zip file:", error);
      alert(
        "Failed to create ZIP file. Please try downloading images individually."
      );
    } finally {
      setProcessing(false);
    }
  }, [images]);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (!bytes) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }, []);

  // Calculate savings percentage
  const calculateSavings = useCallback((original, processed) => {
    if (!processed || !original) return 0;
    return Math.round(((original - processed) / original) * 100);
  }, []);

  // Clear all images
  const clearAllImages = useCallback(() => {
    setImages([]);
    setSelectedImage(null);
  }, []);

  // Unselect current image
  const unselectImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  // Process single image
  const processSingleImage = useCallback(async () => {
    if (!currentImage) return;
    await processImage(currentImage);
  }, [currentImage, processImage]);

  const ExplorerPanel = () => {
    const processedCount = images.filter((img) => img.processedUrl).length;
    const totalCount = images.length;

    return (
      <div className="w-80 overflow-y-auto bg-gray-800 border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-sm font-semibold text-gray-300">EXPLORER</h2>
            <span className="text-xs text-gray-500 bg-gray-700 px-2 py-1 rounded">
              {images.length} images
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 flex justify-between items-center">
              <span>IMAGES</span>
              {images.length > 0 && (
                <button
                  onClick={clearAllImages}
                  className="text-xs text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear All
                </button>
              )}
            </div>

            {images.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <div className="text-gray-500 text-sm">No images loaded</div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-2 px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
                >
                  Add Images
                </button>
              </div>
            ) : (
              images.map((image) => (
                <div
                  key={image.id}
                  className={`px-4 py-3 flex items-center space-x-3 cursor-pointer transition-all duration-200 group ${
                    selectedImage === image.id
                      ? "bg-blue-600"
                      : "hover:bg-gray-750"
                  }`}
                  onClick={() => setSelectedImage(image.id)}
                >
                  <img
                    src={image.originalUrl}
                    className="w-10 h-10 object-cover rounded border border-gray-600 transition-transform group-hover:scale-105"
                    alt="Thumbnail"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-gray-200 truncate">
                      {image.file.name}
                    </div>
                    <div className="text-xs text-gray-400">
                      {image.dimensions.width}×{image.dimensions.height}
                    </div>
                    <div className="text-xs text-gray-500">
                      {formatFileSize(image.originalSize)}
                      {image.processedUrl && (
                        <span className="text-green-400 ml-1">
                          → {formatFileSize(image.processedSize)} (
                          {calculateSavings(
                            image.originalSize,
                            image.processedSize
                          )}
                          %)
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    {image.processing ? (
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                    ) : image.processedUrl ? (
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                    ) : (
                      <div className="w-2 h-2 bg-gray-500 rounded-full" />
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {images.length > 0 && (
          <div className="p-4 border-t border-gray-700 space-y-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm text-white transition-colors"
            >
              Add More Images
            </button>
            <button
              onClick={processBatch}
              disabled={
                batchProgress.processing || processedCount === totalCount
              }
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
            >
              {batchProgress.processing
                ? "Processing..."
                : "Remove All Backgrounds"}
            </button>
            <button
              onClick={downloadAllAsZip}
              disabled={!images.some((img) => img.processedUrl) || processing}
              className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 rounded text-sm text-white transition-colors"
            >
              {processing ? "Creating ZIP..." : "Download All as ZIP"}
            </button>
          </div>
        )}
      </div>
    );
  };

  const BatchProcessingModal = () => {
    if (!batchProgress.processing && !batchComplete) return null;

    const progress = (batchProgress.current / batchProgress.total) * 100;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-gray-800 rounded-lg p-6 w-96 border border-gray-700 transform transition-all duration-300 scale-100">
          <div className="flex items-center space-x-3 mb-4">
            <div className="text-blue-400">
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-white">
              {batchComplete ? "Processing Complete!" : "Removing Backgrounds"}
            </h3>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-300 mb-2">
              <span>Progress</span>
              <span>
                {batchProgress.current} of {batchProgress.total}
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  batchComplete ? "bg-green-500" : "bg-blue-500"
                }`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="text-sm text-gray-400 mb-4">
            {batchComplete
              ? `All ${batchProgress.total} images have been processed successfully! This window will close automatically in a few seconds.`
              : `Removing backgrounds using AI... Please wait.`}
          </div>

          <button
            onClick={cancelBatch}
            className="w-full py-2 bg-red-600 hover:bg-red-700 text-white rounded text-sm font-medium transition-colors"
          >
            {batchComplete ? "Close" : "Cancel Processing"}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      <BatchProcessingModal />

      <div className="flex-1 flex overflow-hidden">
        <ExplorerPanel />

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm transition-colors"
            >
              Open Images
            </button>

            <div className="w-px h-6 bg-gray-700 mx-2" />

            <div className="text-sm text-gray-300">
              {images.filter((img) => img.processed).length} of {images.length}{" "}
              processed
            </div>
          </div>

          <div className="flex-1 bg-gray-900 overflow-hidden relative">
            {isDragging && (
              <div className="absolute inset-0 bg-blue-500 bg-opacity-20 border-4 border-dashed border-blue-400 flex items-center justify-center z-10">
                <div className="text-center text-white transform transition-all duration-300 scale-105">
                  <div className="text-4xl mb-2">📁</div>
                  <div className="text-xl font-semibold">Drop images here</div>
                </div>
              </div>
            )}

            <div
              className="w-full h-full"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              {currentImage ? (
                <div className="w-full h-full flex items-center justify-center bg-gray-900 relative">
                  <div className="absolute inset-0 opacity-10">
                    <div
                      className="w-full h-full"
                      style={{
                        backgroundImage: `
                          linear-gradient(45deg, #808080 25%, transparent 25%),
                          linear-gradient(-45deg, #808080 25%, transparent 25%),
                          linear-gradient(45deg, transparent 75%, #808080 75%),
                          linear-gradient(-45deg, transparent 75%, #808080 75%)
                        `,
                        backgroundSize: "20px 20px",
                        backgroundPosition:
                          "0 0, 0 10px, 10px -10px, -10px 0px",
                      }}
                    />
                  </div>

                  <div className="flex space-x-8 max-w-4xl">
                    <div className="text-center">
                      <div className="mb-2 text-sm text-gray-400">Original</div>
                      <img
                        src={currentImage.originalUrl}
                        alt="Original"
                        className="max-h-96 rounded-lg shadow-lg"
                      />
                      <div className="mt-2 text-xs text-gray-500">
                        {formatFileSize(currentImage.originalSize)}
                      </div>
                    </div>

                    {currentImage.processedUrl && (
                      <div className="text-center">
                        <div className="mb-2 text-sm text-gray-400">
                          Background Removed
                        </div>
                        <img
                          src={currentImage.processedUrl}
                          alt="Processed"
                          className="max-h-96 rounded-lg shadow-lg"
                          style={{
                            backgroundImage: `
                              linear-gradient(45deg, #808080 25%, transparent 25%),
                              linear-gradient(-45deg, #808080 25%, transparent 25%),
                              linear-gradient(45deg, transparent 75%, #808080 75%),
                              linear-gradient(-45deg, transparent 75%, #808080 75%)
                            `,
                            backgroundSize: "20px 20px",
                            backgroundPosition:
                              "0 0, 0 10px, 10px -10px, -10px 0px",
                          }}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          {formatFileSize(currentImage.processedSize)}
                          <span className="text-green-400 ml-1">
                            (
                            {calculateSavings(
                              currentImage.originalSize,
                              currentImage.processedSize
                            )}
                            % saved)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="absolute top-4 left-4 bg-black bg-opacity-70 text-white px-4 py-3 rounded text-sm space-y-1 backdrop-blur-sm">
                    <div className="font-semibold text-blue-300">
                      Image Info
                    </div>
                    <div>
                      Original: {formatFileSize(currentImage.originalSize)}
                    </div>
                    {currentImage.processedUrl && (
                      <div>
                        Processed: {formatFileSize(currentImage.processedSize)}
                        <span className="text-green-400 ml-1">
                          (
                          {calculateSavings(
                            currentImage.originalSize,
                            currentImage.processedSize
                          )}
                          % saved)
                        </span>
                      </div>
                    )}
                    <div>
                      Dimensions: {currentImage.dimensions.width}×
                      {currentImage.dimensions.height}
                    </div>
                  </div>

                  <div className="absolute top-4 right-4 space-x-2">
                    {!currentImage.processed && !currentImage.processing && (
                      <button
                        onClick={processSingleImage}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded text-sm transition-colors"
                      >
                        Remove Background
                      </button>
                    )}
                    {currentImage.processing && (
                      <div className="bg-blue-600 text-white px-4 py-2 rounded text-sm flex items-center">
                        <svg
                          className="animate-spin h-4 w-4 mr-2"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                          />
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          />
                        </svg>
                        Processing...
                      </div>
                    )}
                    {currentImage.processedUrl && (
                      <button
                        onClick={() => downloadImage(currentImage)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded text-sm transition-colors"
                      >
                        Download
                      </button>
                    )}
                    <button
                      onClick={unselectImage}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded text-sm transition-colors"
                    >
                      Clear Selection
                    </button>
                  </div>
                </div>
              ) : images.length > 0 ? (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center transform transition-all duration-300">
                    <div className="text-6xl mb-4 opacity-50">👆</div>
                    <p className="text-xl font-semibold mb-2">
                      Select an Image
                    </p>
                    <p className="text-sm mb-6">
                      Choose an image from explorer to view
                    </p>
                    <button
                      onClick={() => {
                        const randomIndex = Math.floor(
                          Math.random() * images.length
                        );
                        setSelectedImage(images[randomIndex].id);
                      }}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Select Random Image
                    </button>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-500">
                  <div className="text-center transform transition-all duration-300">
                    <div className="text-6xl mb-4 opacity-50">🎨</div>
                    <p className="text-xl font-semibold mb-2">
                      AI Background Remover
                    </p>
                    <p className="text-sm mb-6">
                      Upload images to remove backgrounds automatically using AI
                    </p>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
                    >
                      Upload Images
                    </button>
                    <div className="mt-4 text-xs text-gray-400">
                      or drag and drop images here
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={(e) => handleFileInput(Array.from(e.target.files || []))}
        accept="image/*"
        multiple
        className="hidden"
      />        
    </div>
  );
}
