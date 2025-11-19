"use client";
import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import dynamic from "next/dynamic";

// Dynamically import the JSON viewer to avoid SSR issues
const JsonViewer = dynamic(() => import("@uiw/react-json-view"), {
  ssr: false,
});

const ThinkificTestButton = () => {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [imageLoading, setImageLoading] = useState(false);
  const [duplicates, setDuplicates] = useState([]);
  const [allImages, setAllImages] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [courseDuplicates, setCourseDuplicates] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [courseFilter, setCourseFilter] = useState("other");
  const [comparisonLoading, setComparisonLoading] = useState(false);
  const [comparisonResults, setComparisonResults] = useState({
    matches: [],
    nonMatches: [],
    thinkificOnly: [],
    dataOnly: [],
  });
  const [activeTab, setActiveTab] = useState("courses");
  const [curriculumLoading, setCurriculumLoading] = useState(false);
  const [curriculumData, setCurriculumData] = useState([]);
  const [selectedCurriculum, setSelectedCurriculum] = useState(null);

  // Consolidated search states
  const [searchTerms, setSearchTerms] = useState({
    thinkific: "",
    matches: "",
    nonMatches: "",
    thinkificOnly: "",
    dataOnly: "",
    allCourses: "",
    courseDuplicates: "",
    curriculum: "",
  });

  // Debounced search values
  const [debouncedSearchTerms, setDebouncedSearchTerms] = useState({
    thinkific: "",
    matches: "",
    nonMatches: "",
    thinkificOnly: "",
    dataOnly: "",
    allCourses: "",
    courseDuplicates: "",
    curriculum: "",
  });

  // Refs for debounce timers
  const debounceTimers = useRef({});

  // Item height for virtual scrolling
  const ITEM_HEIGHT = 165;
  const BUFFER_SIZE = 5;

  // Tab configuration
  const tabs = [
    { id: "courses", label: "Thinkific Courses", icon: "📚" },
    { id: "comparison", label: "Course Comparison", icon: "🔍" },
    { id: "images", label: "Duplicate Images", icon: "🖼️" },
    { id: "courseDuplicates", label: "Course Name Duplicates", icon: "📝" },
    { id: "curriculum", label: "Curriculum Checker", icon: "📖" },
  ];

  // Debounce search inputs
  useEffect(() => {
    Object.keys(searchTerms).forEach((key) => {
      clearTimeout(debounceTimers.current[key]);
      debounceTimers.current[key] = setTimeout(() => {
        setDebouncedSearchTerms((prev) => ({
          ...prev,
          [key]: searchTerms[key],
        }));
      }, 300);
    });

    return () => {
      Object.values(debounceTimers.current).forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, [searchTerms]);

  // Handle search input changes
  const handleSearchChange = useCallback((key, value) => {
    setSearchTerms((prev) => ({
      ...prev,
      [key]: value,
    }));
  }, []);

  // Function to get filtered courses
  const getFilteredCourses = useCallback(() => {
    let filtered = courses;

    // Apply filter based on courseFilter
    if (courseFilter === "honhaar") {
      filtered = filtered.filter((course) =>
        course.name?.includes("| Honhaar Jawan")
      );
    } else if (courseFilter === "other") {
      filtered = filtered.filter(
        (course) => !course.name?.includes("| Honhaar Jawan")
      );
    }

    // Apply search filter
    if (debouncedSearchTerms.thinkific) {
      const searchLower = debouncedSearchTerms.thinkific.toLowerCase();
      filtered = filtered.filter((course) => {
        return (
          (course.id &&
            course.id.toString().toLowerCase().includes(searchLower)) ||
          (course.name && course.name.toLowerCase().includes(searchLower)) ||
          (course.lmsCourseId &&
            course.lmsCourseId.toString().toLowerCase().includes(searchLower))
        );
      });
    }

    return filtered;
  }, [courses, courseFilter, debouncedSearchTerms.thinkific]);

  // Memoized filtered courses
  const filteredCourses = useMemo(
    () => getFilteredCourses(),
    [getFilteredCourses]
  );

  // Optimized string similarity calculation
  const calculateSimilarity = useCallback((str1, str2) => {
    // Fast path for exact matches
    if (str1.toLowerCase() === str2.toLowerCase()) return 1.0;

    // Fast path for substring matches
    const s1 = str1.toLowerCase();
    const s2 = str2.toLowerCase();
    if (s1.includes(s2) || s2.includes(s1)) {
      return Math.min(s1.length, s2.length) / Math.max(s1.length, s2.length);
    }

    // Use a simplified Jaccard similarity for better performance
    const getWords = (str) => {
      return str
        .toLowerCase()
        .split(/\s+/)
        .filter((word) => word.length > 0);
    };

    const words1 = new Set(getWords(str1));
    const words2 = new Set(getWords(str2));

    if (words1.size === 0 || words2.size === 0) return 0;

    let intersection = 0;
    words1.forEach((word) => {
      if (words2.has(word)) intersection++;
    });

    return intersection / (words1.size + words2.size - intersection);
  }, []);

  // Find closest matching course with optimization
  const findClosestMatch = useCallback(
    (courseName, dataCourses) => {
      let closestMatch = null;
      let highestSimilarity = 0;

      // Early exit if no courses to compare
      if (!dataCourses || dataCourses.length === 0) return null;

      const courseNameLower = courseName.toLowerCase();

      for (const course of dataCourses) {
        // Compare with cleanName (not id) as requested
        const courseNameToCompare = course.cleanName || course.name;
        if (!courseNameToCompare) continue;

        const courseNameToCompareLower = courseNameToCompare.toLowerCase();

        // Quick check for exact match first
        if (courseNameToCompareLower === courseNameLower) {
          return {
            ...course,
            similarity: 100,
          };
        }

        // Check for substring match
        if (
          courseNameToCompareLower.includes(courseNameLower) ||
          courseNameLower.includes(courseNameToCompareLower)
        ) {
          const similarity =
            Math.min(
              courseName.length / courseNameToCompare.length,
              courseNameToCompare.length / courseName.length
            ) * 100;

          if (similarity > highestSimilarity && similarity > 30) {
            highestSimilarity = similarity;
            closestMatch = {
              ...course,
              similarity: Math.round(similarity),
            };
            continue; // Skip expensive similarity calculation if we already have a good match
          }
        }

        // Only do expensive calculation if we don't have a good match yet
        if (highestSimilarity < 70) {
          const similarity = calculateSimilarity(
            courseName,
            courseNameToCompare
          );
          if (similarity > highestSimilarity && similarity > 0.3) {
            highestSimilarity = similarity;
            closestMatch = {
              ...course,
              similarity: Math.round(similarity * 100),
            };
          }
        }
      }

      return closestMatch;
    },
    [calculateSimilarity]
  );

  const handleClick = async () => {
    setLoading(true);
    setCourses([]);
    try {
      const res = await fetch("/api/courseidthinkific");
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to fetch courses");
      setCourses(data.courses);
      console.log(`Fetched ${data.count} courses:`, data.courses);
      alert(`✅ Successfully fetched ${data.count} courses from Thinkific!`);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = useCallback((text) => {
    navigator.clipboard.writeText(text);
  }, []);

  const handleCopyAll = useCallback(() => {
    const filtered = getFilteredCourses();
    const allCoursesJson = JSON.stringify(filtered, null, 2);
    copyToClipboard(allCoursesJson);
  }, [copyToClipboard, getFilteredCourses]);

  const handleCopySelected = useCallback(() => {
    const filtered = getFilteredCourses();
    const selectedCoursesData = filtered.filter((course) =>
      selectedCourses.includes(course.id)
    );
    const selectedJson = JSON.stringify(selectedCoursesData, null, 2);
    copyToClipboard(selectedJson);
  }, [copyToClipboard, selectedCourses, getFilteredCourses]);

  const toggleCourseSelection = useCallback((courseId) => {
    setSelectedCourses((prev) => {
      if (prev.includes(courseId)) {
        return prev.filter((id) => id !== courseId);
      } else {
        return [...prev, courseId];
      }
    });
  }, []);

  const selectAllCourses = useCallback(() => {
    const filtered = getFilteredCourses();
    const allIds = filtered.map((course) => course.id);
    setSelectedCourses(allIds);
  }, [getFilteredCourses]);

  const deselectAllCourses = useCallback(() => {
    setSelectedCourses([]);
  }, []);

  const handleCheckDuplicates = async () => {
    setImageLoading(true);
    setDuplicates([]);
    setAllImages([]);
    try {
      const res = await fetch("/api/fktest");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to fetch images");

      const images = data.images;
      setAllImages(images);
      console.log("Fetched images:", images);

      // Find duplicates based on filename without extension
      const nameGroups = {};

      images.forEach((image) => {
        // Remove extension and get base name
        const baseName = image.replace(/\.(avif|webp|jpg|jpeg|png)$/i, "");

        if (!nameGroups[baseName]) {
          nameGroups[baseName] = [];
        }
        nameGroups[baseName].push(image);
      });

      // Filter to only include groups with duplicates (same base name but different extensions)
      const duplicateGroups = Object.entries(nameGroups)
        .filter(([baseName, files]) => files.length > 1)
        .map(([baseName, files]) => ({
          baseName,
          files,
          hasAVIF: files.some((f) => f.toLowerCase().endsWith(".avif")),
          hasWEBP: files.some((f) => f.toLowerCase().endsWith(".webp")),
        }));

      setDuplicates(duplicateGroups);
      console.log("Found duplicates:", duplicateGroups);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setImageLoading(false);
    }
  };

  const handleCheckCourseDuplicates = async () => {
    setDataLoading(true);
    setCourseDuplicates([]);
    setAllCourses([]);
    try {
      // Import the Data.jsx file dynamically
      const dataModule = await import("@/Data/Data");
      const courses = dataModule.courses || [];
      setAllCourses(courses);
      console.log("Fetched courses from Data.jsx:", courses);

      // Find duplicate course names
      const nameCount = {};
      const duplicateGroups = {};

      courses.forEach((course) => {
        const courseName = course.name?.trim().toLowerCase();
        if (courseName) {
          if (!nameCount[courseName]) {
            nameCount[courseName] = [];
          }
          nameCount[courseName].push(course);
        }
      });

      // Filter to only include duplicate names
      const duplicates = Object.entries(nameCount)
        .filter(([name, courses]) => courses.length > 1)
        .map(([name, courses]) => ({
          name,
          courses: courses.map((c) => ({
            id: c.id,
            name: c.name,
          })),
        }));

      setCourseDuplicates(duplicates);
      console.log("Found course duplicates:", duplicates);
    } catch (err) {
      console.error("Error loading Data.jsx:", err);
      alert(`Error loading courses from Data.jsx: ${err.message}`);
    } finally {
      setDataLoading(false);
    }
  };

  const handleCompareCourses = async () => {
    setComparisonLoading(true);
    setComparisonResults({
      matches: [],
      nonMatches: [],
      thinkificOnly: [],
      dataOnly: [],
    });

    try {
      // Import the Data.jsx file dynamically
      const dataModule = await import("@/Data/Data");
      const dataCourses = dataModule.courses || [];

      // Get Thinkific courses with "| Honhaar Jawan" suffix
      const honaarThinkificCourses = courses.filter((course) =>
        course.name?.includes("| Honhaar Jawan")
      );

      // Clean Thinkific course names by removing "| Honhaar Jawan" and any preceding text
      const cleanedThinkificCourses = honaarThinkificCourses.map((course) => {
        // First, remove the "| Honhaar Jawan" part
        let cleanName = course.name.split("|")[0].trim();

        // Then, if there's a dash, remove everything after it
        if (cleanName.includes(" - ")) {
          cleanName = cleanName.split(" - ")[0].trim();
        }

        return {
          ...course,
          cleanName,
          originalName: course.name,
        };
      });

      // Clean Data.jsx course names by removing "| Honhaar Jawan" if present
      const cleanedDataCourses = dataCourses.map((course) => {
        // Check if the course name contains "| Honhaar Jawan"
        if (course.name?.includes("| Honhaar Jawan")) {
          // First, remove the "| Honhaar Jawan" part
          let cleanName = course.name.split("|")[0].trim();

          // Then, if there's a dash, remove everything after it
          if (cleanName.includes(" - ")) {
            cleanName = cleanName.split(" - ")[0].trim();
          }

          return {
            ...course,
            cleanName,
            originalName: course.name,
          };
        }
        // If no "| Honhaar Jawan" suffix, check for dash
        let cleanName = course.name;
        if (cleanName.includes(" - ")) {
          cleanName = cleanName.split(" - ")[0].trim();
        }

        return {
          ...course,
          cleanName,
          originalName: course.name,
        };
      });

      // Create sets for easier comparison
      const thinkificNames = new Set(
        cleanedThinkificCourses.map((c) => c.cleanName.toLowerCase())
      );
      const dataNames = new Set(
        cleanedDataCourses.map((c) => c.cleanName.toLowerCase())
      );

      // Find matches (courses that exist in both)
      const matches = cleanedThinkificCourses
        .filter((course) => dataNames.has(course.cleanName.toLowerCase()))
        .map((course) => {
          // Find the matching course in Data.jsx
          const matchingDataCourse = cleanedDataCourses.find(
            (c) => c.cleanName.toLowerCase() === course.cleanName.toLowerCase()
          );
          return {
            thinkific: course,
            data: matchingDataCourse,
          };
        });

      // Find non-matches (courses in Thinkific but not in Data)
      const nonMatches = cleanedThinkificCourses
        .filter((course) => !dataNames.has(course.cleanName.toLowerCase()))
        .map((course) => {
          // Find the closest matching course in Data.jsx
          const closestMatch = findClosestMatch(
            course.cleanName,
            cleanedDataCourses
          );
          return {
            ...course,
            closestMatch,
          };
        });

      // Find courses that exist in Data but not in Thinkific
      const dataOnly = cleanedDataCourses.filter(
        (course) => !thinkificNames.has(course.cleanName.toLowerCase())
      );

      // Find Thinkific courses that don't have "| Honhaar Jawan" suffix
      const thinkificOnly = courses.filter(
        (course) => !course.name?.includes("| Honhaar Jawan")
      );

      setComparisonResults({
        matches,
        nonMatches,
        thinkificOnly,
        dataOnly,
      });

      console.log("Comparison results:", {
        matches,
        nonMatches,
        thinkificOnly,
        dataOnly,
      });
    } catch (err) {
      console.error("Error comparing courses:", err);
      alert(`Error comparing courses: ${err.message}`);
    } finally {
      setComparisonLoading(false);
    }
  };

  const handleFetchCurriculum = async () => {
    setCurriculumLoading(true);
    setCurriculumData([]);
    setSelectedCurriculum(null);
    try {
      const res = await fetch("/api/curriculum");
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Failed to fetch curriculum data");
      setCurriculumData(data.curriculum);
      console.log("Fetched curriculum data:", data.curriculum);
      alert(`✅ Successfully fetched curriculum for ${data.count} courses!`);
    } catch (err) {
      console.error(err);
      alert(`Error: ${err.message}`);
    } finally {
      setCurriculumLoading(false);
    }
  };

  const honaarCoursesCount = useMemo(
    () =>
      courses.filter((course) => course.name?.includes("| Honhaar Jawan"))
        .length,
    [courses]
  );

  const otherCoursesCount = useMemo(
    () =>
      courses.filter((course) => !course.name?.includes("| Honhaar Jawan"))
        .length,
    [courses]
  );

  // Memoized filter functions for each section
  const filterMatches = useMemo(() => {
    if (!debouncedSearchTerms.matches) return comparisonResults.matches;

    const searchLower = debouncedSearchTerms.matches.toLowerCase();
    return comparisonResults.matches.filter((item) => {
      return (
        (item.thinkific.id &&
          item.thinkific.id.toString().toLowerCase().includes(searchLower)) ||
        (item.thinkific.lmsCourseId &&
          item.thinkific.lmsCourseId
            .toString()
            .toLowerCase()
            .includes(searchLower)) ||
        (item.thinkific.cleanName &&
          item.thinkific.cleanName.toLowerCase().includes(searchLower)) ||
        (item.data.id &&
          item.data.id.toString().toLowerCase().includes(searchLower)) ||
        (item.data.lmsCourseId &&
          item.data.lmsCourseId
            .toString()
            .toLowerCase()
            .includes(searchLower)) ||
        (item.data.cleanName &&
          item.data.cleanName.toLowerCase().includes(searchLower))
      );
    });
  }, [comparisonResults.matches, debouncedSearchTerms.matches]);

  const filterNonMatches = useMemo(() => {
    if (!debouncedSearchTerms.nonMatches) return comparisonResults.nonMatches;

    const searchLower = debouncedSearchTerms.nonMatches.toLowerCase();
    return comparisonResults.nonMatches.filter((course) => {
      return (
        (course.id &&
          course.id.toString().toLowerCase().includes(searchLower)) ||
        (course.lmsCourseId &&
          course.lmsCourseId.toString().toLowerCase().includes(searchLower)) ||
        (course.cleanName &&
          course.cleanName.toLowerCase().includes(searchLower)) ||
        (course.closestMatch &&
          course.closestMatch.cleanName &&
          course.closestMatch.cleanName.toLowerCase().includes(searchLower))
      );
    });
  }, [comparisonResults.nonMatches, debouncedSearchTerms.nonMatches]);

  const filterThinkificOnly = useMemo(() => {
    if (!debouncedSearchTerms.thinkificOnly)
      return comparisonResults.thinkificOnly;

    const searchLower = debouncedSearchTerms.thinkificOnly.toLowerCase();
    return comparisonResults.thinkificOnly.filter((course) => {
      return (
        (course.id &&
          course.id.toString().toLowerCase().includes(searchLower)) ||
        (course.lmsCourseId &&
          course.lmsCourseId.toString().toLowerCase().includes(searchLower)) ||
        (course.name && course.name.toLowerCase().includes(searchLower))
      );
    });
  }, [comparisonResults.thinkificOnly, debouncedSearchTerms.thinkificOnly]);

  const filterDataOnly = useMemo(() => {
    if (!debouncedSearchTerms.dataOnly) return comparisonResults.dataOnly;

    const searchLower = debouncedSearchTerms.dataOnly.toLowerCase();
    return comparisonResults.dataOnly.filter((course) => {
      return (
        (course.id &&
          course.id.toString().toLowerCase().includes(searchLower)) ||
        (course.lmsCourseId &&
          course.lmsCourseId.toString().toLowerCase().includes(searchLower)) ||
        (course.cleanName &&
          course.cleanName.toLowerCase().includes(searchLower))
      );
    });
  }, [comparisonResults.dataOnly, debouncedSearchTerms.dataOnly]);

  const filterAllCourses = useMemo(() => {
    if (!debouncedSearchTerms.allCourses) return allCourses;

    const searchLower = debouncedSearchTerms.allCourses.toLowerCase();
    return allCourses.filter((course) => {
      return (
        (course.id &&
          course.id.toString().toLowerCase().includes(searchLower)) ||
        (course.lmsCourseId &&
          course.lmsCourseId.toString().toLowerCase().includes(searchLower)) ||
        (course.name && course.name.toLowerCase().includes(searchLower))
      );
    });
  }, [allCourses, debouncedSearchTerms.allCourses]);

  const filterCourseDuplicates = useMemo(() => {
    if (!debouncedSearchTerms.courseDuplicates) return courseDuplicates;

    const searchLower = debouncedSearchTerms.courseDuplicates.toLowerCase();
    return courseDuplicates.filter((group) => {
      return (
        (group.name && group.name.toLowerCase().includes(searchLower)) ||
        group.courses.some(
          (course) =>
            (course.id &&
              course.id.toString().toLowerCase().includes(searchLower)) ||
            (course.lmsCourseId &&
              course.lmsCourseId
                .toString()
                .toLowerCase()
                .includes(searchLower)) ||
            (course.name && course.name.toLowerCase().includes(searchLower))
        )
      );
    });
  }, [courseDuplicates, debouncedSearchTerms.courseDuplicates]);

  const filterCurriculum = useMemo(() => {
    if (!debouncedSearchTerms.curriculum) return curriculumData;

    const searchLower = debouncedSearchTerms.curriculum.toLowerCase();
    return curriculumData.filter((item) => {
      return (
        (item.id && item.id.toString().toLowerCase().includes(searchLower)) ||
        (item.name && item.name.toLowerCase().includes(searchLower)) ||
        (item.lmsCourseId &&
          item.lmsCourseId.toString().toLowerCase().includes(searchLower))
      );
    });
  }, [curriculumData, debouncedSearchTerms.curriculum]);

  // Virtual scrolling component with fixed scroll position
  const VirtualList = React.memo(({ items, renderItem, height = 400 }) => {
    const containerRef = useRef(null);
    const scrollTopRef = useRef(0);
    const [scrollTop, setScrollTop] = useState(0);
    const [containerHeight, setContainerHeight] = useState(height);

    // Calculate visible range
    const startIndex = Math.max(
      0,
      Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE
    );
    const endIndex = Math.min(
      items.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    );

    // Get visible items
    const visibleItems = items.slice(startIndex, endIndex + 1);

    const handleScroll = useCallback((e) => {
      const newScrollTop = e.target.scrollTop;
      scrollTopRef.current = newScrollTop;
      setScrollTop(newScrollTop);
    }, []);

    useEffect(() => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerHeight(rect.height || height);
      }
    }, [height]);

    return (
      <div
        ref={containerRef}
        style={{ height: containerHeight, overflowY: "auto" }}
        onScroll={handleScroll}
        className="border border-gray-200 rounded"
      >
        <div
          style={{ height: items.length * ITEM_HEIGHT, position: "relative" }}
        >
          <div
            style={{ transform: `translateY(${startIndex * ITEM_HEIGHT}px)` }}
          >
            {visibleItems.map((item, index) => {
              const actualIndex = startIndex + index;
              return (
                <div key={actualIndex} style={{ height: ITEM_HEIGHT }}>
                  {renderItem(item, actualIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  });

  // JSON viewer component with performance optimizations - always expanded and larger
  const JsonViewerComponent = React.memo(({ data }) => {
    const renderValue = (value, path = "") => {
      // Handle null or undefined values
      if (value === null) return <span className="text-white">null</span>;
      if (value === undefined)
        return <span className="text-white">undefined</span>;

      if (typeof value === "string")
        return <span className="text-green-400">"{value}"</span>;
      if (typeof value === "number")
        return <span className="text-blue-400">{value}</span>;
      if (typeof value === "boolean")
        return <span className="text-yellow-400">{value.toString()}</span>;

      if (Array.isArray(value)) {
        return (
          <div>
            <span className="text-gray-400">[</span>
            <div className="ml-4">
              {value.map((item, index) => (
                <div key={index}>
                  {renderValue(item, `${path}[${index}]`)}
                  {index < value.length - 1 && (
                    <span className="text-gray-400">,</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-gray-400">]</span>
          </div>
        );
      }

      if (typeof value === "object") {
        const entries = Object.entries(value || {}); // Handle null/undefined with empty object

        return (
          <div>
            <span className="text-gray-400">{"{"}</span>
            <div className="ml-4">
              {entries.map(([key, val], index) => (
                <div key={key}>
                  <span className="text-purple-400">"{key}"</span>
                  <span className="text-gray-400">: </span>
                  {renderValue(val, `${path}.${key}`)}
                  {index < entries.length - 1 && (
                    <span className="text-gray-400">,</span>
                  )}
                </div>
              ))}
            </div>
            <span className="text-gray-400">{"}"}</span>
          </div>
        );
      }

      return <span className="text-white">{String(value)}</span>;
    };

    // Check if data is null or undefined
    if (data === null || data === undefined) {
      return (
        <div
          className="text-left bg-gray-900 p-4 rounded font-mono text-sm overflow-x-auto"
          style={{ height: "600px" }}
        >
          <span className="text-white">null</span>
        </div>
      );
    }

    return (
      <div
        className="text-left bg-gray-900 p-4 rounded font-mono text-sm overflow-x-auto"
        style={{ height: "600px" }}
      >
        <div>{renderValue(data)}</div>
      </div>
    );
  });

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar with tabs */}
      <div className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-green-600">Course Manager</h1>
          <p className="text-gray-600 text-sm mt-2">
            Manage and compare courses
          </p>
        </div>
        <nav className="mt-6">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center px-6 py-3 text-left transition-colors ${
                activeTab === tab.id
                  ? "bg-green-50 border-l-4 border-green-500 text-green-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <span className="text-xl mr-3">{tab.icon}</span>
              <span className="font-medium">{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-auto">
        <div className="p-6">
          {/* Thinkific Courses Tab */}
          {activeTab === "courses" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600">
                  Thinkific Courses
                </h2>
                <p className="text-gray-600 mt-1">
                  Fetch and manage courses from Thinkific
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleClick}
                  disabled={loading}
                  className={`px-6 py-3 font-semibold rounded-lg text-white ${
                    loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
                  } transition-all`}
                >
                  {loading ? "Fetching..." : "Get All Thinkific Courses"}
                </button>
              </div>

              {courses.length > 0 && (
                <div>
                  {/* Course Filter Tabs */}
                  <div className="flex mb-4 bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setCourseFilter("other")}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        courseFilter === "other"
                          ? "bg-white text-green-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Project Courses ({otherCoursesCount})
                    </button>
                    <button
                      onClick={() => setCourseFilter("honhaar")}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        courseFilter === "honhaar"
                          ? "bg-white text-green-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      Honhaar Jawan ({honaarCoursesCount})
                    </button>
                    <button
                      onClick={() => setCourseFilter("all")}
                      className={`px-4 py-2 rounded-md text-sm font-medium ${
                        courseFilter === "all"
                          ? "bg-white text-green-600 shadow-sm"
                          : "text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      All Courses ({courses.length})
                    </button>
                  </div>

                  {/* Search Bar for Thinkific Courses */}
                  <div className="mb-4">
                    <div className="relative max-w-md">
                      <input
                        type="text"
                        placeholder="Search by ID or course name..."
                        value={searchTerms.thinkific}
                        onChange={(e) =>
                          handleSearchChange("thinkific", e.target.value)
                        }
                        className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        <svg
                          className="w-5 h-5 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between mb-4">
                    <button
                      onClick={handleCopyAll}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Copy All Courses
                    </button>
                    <button
                      onClick={handleCopySelected}
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                      disabled={selectedCourses.length === 0}
                    >
                      Copy Selected ({selectedCourses.length})
                    </button>
                    <button
                      onClick={selectAllCourses}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Select All
                    </button>
                    <button
                      onClick={deselectAllCourses}
                      className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                    >
                      Deselect All
                    </button>
                  </div>

                  {/* Virtual Scrolling List for Courses */}
                  <VirtualList
                    items={filteredCourses}
                    renderItem={(course, index) => (
                      <div
                        key={course.id}
                        className="border p-4 bg-white m-2 rounded-lg shadow-sm"
                      >
                        <div className="flex justify-end">
                          <button
                            onClick={() =>
                              copyToClipboard(JSON.stringify(course, null, 2))
                            }
                            className="px-3 py-1 bg-gray-100 hover:bg-gray-200 rounded text-sm"
                          >
                            Copy
                          </button>
                        </div>
                        <div className="flex gap-2 items-center">
                          <div className="h-16 w-10 flex items-center">
                            <input
                              type="checkbox"
                              checked={selectedCourses.includes(course.id)}
                              onChange={() => toggleCourseSelection(course.id)}
                              className="w-full h-full text-green-600"
                            />
                          </div>
                          <div className="flex-1">
                            <JsonViewerComponent data={course} />
                          </div>
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}
            </div>
          )}
          {/* Course Comparison Tab */}
          {activeTab === "comparison" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600">
                  Course Comparison
                </h2>
                <p className="text-gray-600 mt-1">
                  Compare Thinkific courses with Data.jsx courses
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleCompareCourses}
                  disabled={comparisonLoading || courses.length === 0}
                  className={`px-6 py-3 font-semibold rounded-lg text-white ${
                    comparisonLoading || courses.length === 0
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } transition-all`}
                >
                  {comparisonLoading
                    ? "Comparing..."
                    : "Compare Thinkific & Data.jsx Courses"}
                </button>
              </div>

              {/* Comparison Results */}
              {comparisonResults.matches.length > 0 ||
              comparisonResults.nonMatches.length > 0 ||
              comparisonResults.thinkificOnly.length > 0 ||
              comparisonResults.dataOnly.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Matches */}
                  {comparisonResults.matches.length > 0 && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                      <h3 className="font-bold text-green-800 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Matching Courses ({comparisonResults.matches.length})
                      </h3>

                      {/* Search Bar for Matches */}
                      <div className="mb-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by ID or course name..."
                            value={searchTerms.matches}
                            onChange={(e) =>
                              handleSearchChange("matches", e.target.value)
                            }
                            className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Virtual Scrolling List for Matches */}
                      <VirtualList
                        items={filterMatches}
                        renderItem={(item, index) => (
                          <div
                            key={index}
                            className="p-2 bg-white rounded border border-green-100 m-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium">
                                  {item.thinkific.cleanName}
                                  <span className="text-gray-400 ml-1">
                                    | Honhaar Jawan
                                  </span>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    Thinkific
                                  </span>
                                  <span>ID: {item.thinkific.id}</span>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                    Data.jsx
                                  </span>
                                  <span>ID: {item.data.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* Non-Matches */}
                  {comparisonResults.nonMatches.length > 0 && (
                    <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                      <h3 className="font-bold text-red-800 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Non-Matching Courses (
                        {comparisonResults.nonMatches.length})
                      </h3>

                      {/* Search Bar for Non-Matches */}
                      <div className="mb-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by ID or course name..."
                            value={searchTerms.nonMatches}
                            onChange={(e) =>
                              handleSearchChange("nonMatches", e.target.value)
                            }
                            className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Virtual Scrolling List for Non-Matches */}
                      <VirtualList
                        items={filterNonMatches}
                        renderItem={(course, index) => (
                          <div
                            key={index}
                            className="p-2 bg-white rounded border border-red-100 m-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium">
                                  {course.cleanName}
                                  <span className="text-gray-400 ml-1">
                                    | Honhaar Jawan
                                  </span>
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    Thinkific Only
                                  </span>
                                  <span>ID: {course.id}</span>
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Original: {course.originalName}
                                </div>

                                {/* Closest Match Section */}
                                {course.closestMatch && (
                                  <div className="mt-2 p-2 bg-yellow-50 rounded border border-yellow-200">
                                    <div className="flex items-center">
                                      <svg
                                        className="w-4 h-4 text-yellow-600 mr-1"
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                      >
                                        <path
                                          fillRule="evenodd"
                                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                                          clipRule="evenodd"
                                        />
                                      </svg>
                                      <span className="text-xs font-medium text-yellow-800">
                                        Closest Match (
                                        {course.closestMatch.similarity}%)
                                      </span>
                                    </div>
                                    <div className="text-xs text-gray-700 mt-1">
                                      {course.closestMatch.cleanName ||
                                        course.closestMatch.name}
                                    </div>
                                    <div className="flex items-center mt-1 text-xs text-gray-500">
                                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                        Data.jsx
                                      </span>
                                      <span>ID: {course.closestMatch.id}</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* Thinkific Only */}
                  {comparisonResults.thinkificOnly.length > 0 && (
                    <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                      <h3 className="font-bold text-blue-800 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Thinkific Only ({comparisonResults.thinkificOnly.length}
                        )
                      </h3>

                      {/* Search Bar for Thinkific Only */}
                      <div className="mb-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by ID or course name..."
                            value={searchTerms.thinkificOnly}
                            onChange={(e) =>
                              handleSearchChange(
                                "thinkificOnly",
                                e.target.value
                              )
                            }
                            className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Virtual Scrolling List for Thinkific Only */}
                      <VirtualList
                        items={filterThinkificOnly}
                        renderItem={(course, index) => (
                          <div
                            key={index}
                            className="p-2 bg-white rounded border border-blue-100 m-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium">
                                  {course.name}
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 mr-2">
                                    Thinkific
                                  </span>
                                  <span>ID: {course.id}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}

                  {/* Data Only */}
                  {comparisonResults.dataOnly.length > 0 && (
                    <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
                      <h3 className="font-bold text-purple-800 mb-2 flex items-center">
                        <svg
                          className="w-5 h-5 mr-2"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path
                            fillRule="evenodd"
                            d="M4 5a2 2 0 012-2 1 1 0 000 2H6a2 2 0 100 4h2a2 2 0 100 4h2a1 1 0 100 2 2 2 0 01-2 2H4a2 2 0 01-2-2V7a2 2 0 012-2z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Data.jsx Only ({comparisonResults.dataOnly.length})
                      </h3>

                      {/* Search Bar for Data Only */}
                      <div className="mb-2">
                        <div className="relative">
                          <input
                            type="text"
                            placeholder="Search by ID or course name..."
                            value={searchTerms.dataOnly}
                            onChange={(e) =>
                              handleSearchChange("dataOnly", e.target.value)
                            }
                            className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-purple-500"
                          />
                          <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                            <svg
                              className="w-4 h-4 text-gray-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                              />
                            </svg>
                          </div>
                        </div>
                      </div>

                      {/* Virtual Scrolling List for Data Only */}
                      <VirtualList
                        items={filterDataOnly}
                        renderItem={(course, index) => (
                          <div
                            key={index}
                            className="p-2 bg-white rounded border border-purple-100 m-2"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-mono text-sm font-medium">
                                  {course.cleanName}
                                  {course.originalName !== course.cleanName && (
                                    <span className="text-gray-400 ml-1">
                                      | Honhaar Jawan
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                                    Data.jsx
                                  </span>
                                  <span>ID: {course.id}</span>
                                </div>
                                {course.originalName !== course.cleanName && (
                                  <div className="text-xs text-gray-500 mt-1">
                                    Original: {course.originalName}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      />
                    </div>
                  )}
                </div>
              ) : null}

              {comparisonResults.matches.length === 0 &&
                comparisonResults.nonMatches.length === 0 &&
                comparisonResults.thinkificOnly.length === 0 &&
                comparisonResults.dataOnly.length === 0 &&
                !comparisonLoading &&
                courses.length > 0 && (
                  <div className="mt-4 text-gray-600 font-semibold">
                    Click the button above to compare courses
                  </div>
                )}
            </div>
          )}
          {/* Duplicate Images Tab */}
          {activeTab === "images" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600">
                  Duplicate Images
                </h2>
                <p className="text-gray-600 mt-1">
                  Find and manage duplicate images
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleCheckDuplicates}
                  disabled={imageLoading}
                  className={`px-6 py-3 font-semibold rounded-lg text-white ${
                    imageLoading
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } transition-all`}
                >
                  {imageLoading ? "Checking..." : "Check Duplicate Images"}
                </button>
              </div>

              {/* All Images List */}
              {allImages.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-2">
                    All Images ({allImages.length}):
                  </h3>
                  <div className="bg-gray-50 rounded-lg p-4 max-h-40 overflow-y-auto">
                    <ul className="text-xs text-gray-600 space-y-1">
                      {allImages.map((image, index) => (
                        <li key={index} className="font-mono">
                          {image}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Duplicates List */}
              {duplicates.length > 0 && (
                <div>
                  <h3 className="font-bold text-red-800 mb-2">
                    Duplicate Images Found ({duplicates.length} groups):
                  </h3>
                  <div className="space-y-3">
                    {duplicates.map((group, index) => (
                      <div
                        key={index}
                        className="bg-red-50 rounded-lg p-4 border border-red-200"
                      >
                        <div className="font-semibold text-red-700">
                          {group.baseName}.*
                        </div>
                        <div className="text-xs text-gray-600 mt-1">
                          Files: {group.files.join(", ")}
                        </div>
                        <div className="text-xs mt-1">
                          <span
                            className={`px-2 py-1 rounded ${
                              group.hasAVIF
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            AVIF: {group.hasAVIF ? "✓" : "✗"}
                          </span>
                          <span
                            className={`ml-2 px-2 py-1 rounded ${
                              group.hasWEBP
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            WEBP: {group.hasWEBP ? "✓" : "✗"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {allImages.length > 0 &&
                duplicates.length === 0 &&
                !imageLoading && (
                  <div className="mt-4 text-green-600 font-semibold">
                    ✓ No duplicate images found!
                  </div>
                )}
            </div>
          )}
          {/* Course Name Duplicates Tab */}
          {activeTab === "courseDuplicates" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600">
                  Course Name Duplicates
                </h2>
                <p className="text-gray-600 mt-1">
                  Find and manage duplicate course names
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleCheckCourseDuplicates}
                  disabled={dataLoading}
                  className={`px-6 py-3 font-semibold rounded-lg text-white ${
                    dataLoading
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } transition-all`}
                >
                  {dataLoading ? "Checking..." : "Check Course Name Duplicates"}
                </button>
              </div>

              {/* All Courses List */}
              {allCourses.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-bold text-gray-800 mb-2">
                    Data.jsx Courses ({allCourses.length}):
                  </h3>

                  {/* Search Bar for All Courses */}
                  <div className="mb-2">
                    <div className="relative max-w-md">
                      <input
                        type="text"
                        placeholder="Search by ID or course name..."
                        value={searchTerms.allCourses}
                        onChange={(e) =>
                          handleSearchChange("allCourses", e.target.value)
                        }
                        className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Virtual Scrolling List for All Courses */}
                  <VirtualList
                    items={filterAllCourses}
                    renderItem={(course, index) => (
                      <div
                        key={index}
                        className="font-mono py-1 border-b border-gray-100 m-2"
                      >
                        {course.id} — {course.name}
                      </div>
                    )}
                  />
                </div>
              )}

              {/* Course Duplicates List */}
              {courseDuplicates.length > 0 && (
                <div>
                  <h3 className="font-bold text-red-800 mb-2">
                    Duplicate Course Names Found ({courseDuplicates.length}):
                  </h3>

                  {/* Search Bar for Course Duplicates */}
                  <div className="mb-2">
                    <div className="relative max-w-md">
                      <input
                        type="text"
                        placeholder="Search by ID or course name..."
                        value={searchTerms.courseDuplicates}
                        onChange={(e) =>
                          handleSearchChange("courseDuplicates", e.target.value)
                        }
                        className="w-full px-3 py-1 pr-8 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-red-500"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                        <svg
                          className="w-4 h-4 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Virtual Scrolling List for Course Duplicates */}
                  <VirtualList
                    items={filterCourseDuplicates}
                    renderItem={(group, index) => (
                      <div
                        key={index}
                        className="bg-red-50 rounded-lg p-4 border border-red-200 m-2"
                      >
                        <div className="font-semibold text-red-700 mb-2">
                          "{group.name}"
                        </div>
                        <div className="text-xs space-y-1">
                          {group.courses.map((course, courseIndex) => (
                            <div
                              key={courseIndex}
                              className="flex justify-between"
                            >
                              <span>ID: {course.id}</span>
                              <span>{course.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  />
                </div>
              )}

              {allCourses.length > 0 &&
                courseDuplicates.length === 0 &&
                !dataLoading && (
                  <div className="mt-4 text-green-600 font-semibold">
                    ✓ No duplicate course names found!
                  </div>
                )}
            </div>
          )}
          {/* Curriculum Checker Tab */}
          {activeTab === "curriculum" && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-green-600">
                  Curriculum Checker
                </h2>
                <p className="text-gray-600 mt-1">
                  Fetch and view curriculum for all courses
                </p>
              </div>

              <div className="mb-6">
                <button
                  onClick={handleFetchCurriculum}
                  disabled={curriculumLoading}
                  className={`px-6 py-3 font-semibold rounded-lg text-white ${
                    curriculumLoading
                      ? "bg-gray-400"
                      : "bg-green-600 hover:bg-green-700"
                  } transition-all`}
                >
                  {curriculumLoading
                    ? "Fetching..."
                    : "Fetch All Course Curriculum"}
                </button>
              </div>

              {/* Search Bar for Curriculum */}
              {curriculumData.length > 0 && (
                <div className="mb-4">
                  <div className="relative max-w-md">
                    <input
                      type="text"
                      placeholder="Search by ID or course name..."
                      value={searchTerms.curriculum}
                      onChange={(e) =>
                        handleSearchChange("curriculum", e.target.value)
                      }
                      className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg
                        className="w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {/* Curriculum List */}
              {curriculumData.length > 0 && (
                <div className="flex gap-4">
                  {/* Course List */}
                  <div className="w-1/3">
                    <h3 className="font-bold text-gray-800 mb-2">
                      Courses ({curriculumData.length}):
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                      <ul className="space-y-2">
                        {filterCurriculum.map((course, index) => (
                          <li
                            key={index}
                            className={`p-2 rounded cursor-pointer transition-colors ${
                              selectedCurriculum?.id === course.id
                                ? "bg-green-100 text-green-800"
                                : "hover:bg-gray-100"
                            }`}
                            onClick={() => setSelectedCurriculum(course)}
                          >
                            <div className="font-medium">{course.name}</div>
                            <div className="text-xs text-gray-500">
                              ID: {course.id} | LMS ID: {course.lmsCourseId}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Curriculum Details */}
                  <div className="w-2/3">
                    <h3 className="font-bold text-gray-800 mb-2">
                      Curriculum Details:
                    </h3>
                    {selectedCurriculum ? (
                      <div className="bg-gray-50 rounded-lg p-4 max-h-[500px] overflow-y-auto">
                        <div className="mb-2">
                          <span className="font-medium">Course: </span>
                          {selectedCurriculum.name}
                        </div>
                        <div className="mb-4">
                          <span className="font-medium">ID: </span>
                          {selectedCurriculum.id} | LMS ID:{" "}
                          {selectedCurriculum.lmsCourseId}
                        </div>
                        <div className="border-t pt-2">
                          <div className="font-medium mb-2">Curriculum:</div>
                          <JsonViewerComponent
                            data={selectedCurriculum.curriculum}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 text-gray-500">
                        Select a course to view its curriculum
                      </div>
                    )}
                  </div>
                </div>
              )}

              {curriculumData.length === 0 && !curriculumLoading && (
                <div className="text-gray-600 font-semibold">
                  Click the button above to fetch curriculum data
                </div>
              )}
            </div>
          )}  
          <button
            onClick={async () => {
              await fetch("/api/generate-sitemap", { method: "POST" });
            }}
            className="px-6 py-3 font-semibold rounded-lg text-white bg-green-600 hover:bg-green-700 transition-all"
          >
            Generate Sitemap
          </button>{" "}
        </div>
      </div>
    </div>
  );
};

export default ThinkificTestButton;
