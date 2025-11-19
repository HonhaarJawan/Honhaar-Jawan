"use client";
import React, {
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  collection,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  setDoc,
  serverTimestamp,
  deleteDoc,
  query,
  where,
  addDoc,
  writeBatch,
} from "firebase/firestore";
import { firestore } from "@/Backend/Firebase";
import { motion, AnimatePresence } from "framer-motion";
import {
  IoCheckmark,
  IoEyeOutline,
  IoExpand,
  IoClose,
  IoTrashOutline,
  IoAddOutline,
  IoMailOutline,
  IoAlertCircleOutline,
  IoSearchOutline,
  IoDocumentTextOutline,
  IoSendOutline,
  IoCodeSlashOutline,
  IoCloudUploadOutline,
  IoCopyOutline,
  IoFilterOutline,
  IoArchiveOutline,
  IoNotificationsOutline,
  IoColorPaletteOutline,
  IoSparklesOutline,
  IoDesktopOutline,
  IoFolderOutline,
  IoFolderOpenOutline,
  IoChevronDownOutline,
  IoChevronForwardOutline,
  IoTimeOutline,
  IoContract,
  IoRefreshOutline,
  IoPencilOutline,
  IoDuplicateOutline,
  IoOptionsOutline,
  IoDownloadOutline,
  IoShareOutline,
  IoGridOutline,
  IoListOutline,
  IoCreateOutline,
  IoMoveOutline,
  IoFolderAddOutline,
  IoTextOutline,
  IoSaveOutline,
  IoPrintOutline,
  IoSettingsOutline,
  IoLinkOutline,
  IoImageOutline,
  IoTabletLandscapeOutline,
  IoPhonePortraitOutline,
  IoDesktopOutline as IoDesktop,
  IoWarningOutline,
  IoInformationCircleOutline,
  IoSave,
  IoCreate,
  IoCode,
  IoColorPalette,
} from "react-icons/io5";
import dynamic from "next/dynamic";
import SidebarWrapper from "@/adminComponents/SidebarWrapper";
import AdminProtectedRoutes from "@/ProtectedRoutes/AdminProtectedRoutes";
import { ToastProvider, useToast } from "@/components/primary/Toast";
import SiteDetails from "@/Data/SiteData";
import ThinkificTestButton from "./testcompo/testingid";
import AutoUserCreator from "./testcompo/fkffkfkfk.jsx";
// Import react-email-editor
const EmailEditor = dynamic(
  () => import("react-email-editor").then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading Email Editor...</p>
        </div>
      </div>
    ),
  }
);
// Custom Template Editor Component
const CustomTemplateEditor = ({ value, onChange, height }) => {
  const [editorValue, setEditorValue] = useState(value || "");
  useEffect(() => {
    setEditorValue(value || "");
  }, [value]);
  const handleChange = (newValue) => {
    setEditorValue(newValue);
    if (onChange) {
      onChange(newValue);
    }
  };
  return (
    <div style={{ height: height || "500px", border: "1px solid #ddd" }}>
      <MonacoEditor
        height="100%"
        language="html"
        theme="vs-dark"
        value={editorValue}
        onChange={handleChange}
        options={{
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          automaticLayout: true,
          fontSize: 14,
          wordWrap: "on",
          lineNumbers: "on",
          folding: true,
          renderLineHighlight: "all",
          lineNumbersMinChars: 3,
          renderWhitespace: "selection",
          scrollbar: {
            vertical: "visible",
            horizontal: "visible",
            useShadows: false,
          },
        }}
      />
    </div>
  );
};
// Debounce hook for performance
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};
// Improved Split Pane Component
const SplitPane = ({
  left,
  right,
  defaultSplit = 50,
  minSize = 20,
  maxSize = 80,
}) => {
  const [split, setSplit] = useState(defaultSplit);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef(null);
  const splitBarRef = useRef(null);
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const newSplit =
        ((e.clientX - containerRect.left) / containerRect.width) * 100;
      if (newSplit >= minSize && newSplit <= maxSize) {
        setSplit(newSplit);
      }
    };
    const handleMouseUp = () => {
      setIsDragging(false);
    };
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, minSize, maxSize]);
  return (
    <div ref={containerRef} className="flex h-full relative">
      <div style={{ width: `${split}%` }} className="overflow-hidden">
        {left}
      </div>
      <div
        ref={splitBarRef}
        className={`w-2 bg-gray-300 hover:bg-primary cursor-col-resize transition-colors flex items-center justify-center ${
          isDragging ? "bg-primary" : ""
        }`}
        onMouseDown={handleMouseDown}
      >
        <div className="w-1 h-8 bg-gray-400 rounded-full"></div>
      </div>
      <div style={{ width: `${100 - split}%` }} className="overflow-hidden">
        {right}
      </div>
    </div>
  );
};
// Fixed Monaco Editor configuration
const MonacoEditor = dynamic(
  () =>
    import("@monaco-editor/react").then((mod) => {
      // Configure Monaco to use a CDN for worker files
      if (typeof window !== "undefined") {
        window.MonacoEnvironment = {
          getWorkerUrl: function (moduleId, label) {
            if (label === "json") {
              return "/monaco-editor-workers/json.worker.js";
            }
            if (label === "css" || label === "scss" || label === "less") {
              return "/monaco-editor-workers/css.worker.js";
            }
            if (
              label === "html" ||
              label === "handlebars" ||
              label === "razor"
            ) {
              return "/monaco-editor-workers/html.worker.js";
            }
            if (label === "typescript" || label === "javascript") {
              return "/monaco-editor-workers/ts.worker.js";
            }
            return "/monaco-editor-workers/editor.worker.js";
          },
        };
      }
      return mod.default;
    }),
  {
    ssr: false,
    loading: () => (
      <div className="text-center py-4 text-gray-400">Loading editor...</div>
    ),
  }
);
const EmailTemplateList = () => {
  // State variables - grouped by functionality
  // Template Management
  const [templates, setTemplates] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState(null);
  const [filteredTemplates, setFilteredTemplates] = useState([]);
  // Editor State
  const [isEditing, setIsEditing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [editedContent, setEditedContent] = useState("");
  const [editedSubject, setEditedSubject] = useState("");
  const [isEditorFullscreen, setIsEditorFullscreen] = useState(false);
  const [isSplitView, setIsSplitView] = useState(true);
  const [useAdvancedEditor, setUseAdvancedEditor] = useState(false);
  const [splitPercentage, setSplitPercentage] = useState(50);
  // New Template Creation
  const [newTemplateName, setNewTemplateName] = useState("");
  // Loading States
  const [addingTemplate, setAddingTemplate] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [deletingTemplate, setDeletingTemplate] = useState(false);
  const [sendingTestEmail, setSendingTestEmail] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPreviewForm, setShowPreviewForm] = useState(false);
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showGeneratorView, setShowGeneratorView] = useState(false);
  const [showQuickPreviewModal, setShowQuickPreviewModal] = useState(false);
  const [showUnsavedChangesModal, setShowUnsavedChangesModal] = useState(false);
  const [pendingTemplateId, setPendingTemplateId] = useState(null);
  // Email Management
  const [testEmails, setTestEmails] = useState([
    "saeedhaider0000@gmail.com",
    "360legntkiller@gmail.com",
    "54587dfdd@gmail.com",
  ]);
  const [selectedEmail, setSelectedEmail] = useState(
    "saeedhaider0000@gmail.com"
  );
  const [testEmailName, setTestEmailName] = useState("Test Recipient");
  const [selectedTestTemplate, setSelectedTestTemplate] = useState("");
  const [selectedTestFolder, setSelectedTestFolder] = useState("all");
  // Search & Filter
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFolder, setSelectedFolder] = useState("all");
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  // Enhanced Editor Features
  const [findText, setFindText] = useState("");
  const [replaceText, setReplaceText] = useState("");
  const [isReplacingAll, setIsReplacingAll] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [selectedSearchFolder, setSelectedSearchFolder] = useState("all");
  const [findReplaceOptions, setFindReplaceOptions] = useState({
    caseSensitive: false,
    wholeWord: false,
    useRegex: false,
    searchInSubject: true,
    searchInContent: true,
  });
  // Folder Management
  const [newFolderName, setNewFolderName] = useState("");
  const [movingTemplate, setMovingTemplate] = useState(null);
  // Template History - Only store what's actively being viewed
  const [templateHistory, setTemplateHistory] = useState({});
  const [selectedHistoryTemplate, setSelectedHistoryTemplate] = useState(null);
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  // Editing states
  const [editingTemplateId, setEditingTemplateId] = useState(null);
  const [editingTemplateName, setEditingTemplateName] = useState("");
  const [editingFolderId, setEditingFolderId] = useState(null);
  const [editingFolderName, setEditingFolderName] = useState("");
  // Compose Modal
  const [composeEmailInput, setComposeEmailInput] = useState("");
  const [composeRecipients, setComposeRecipients] = useState([]);
  const [composeSubject, setComposeSubject] = useState("");
  const [composeContent, setComposeContent] = useState("");
  const [composePlaceholders, setComposePlaceholders] = useState("");
  // UI States
  const [isDragging, setIsDragging] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [emailErrors, setEmailErrors] = useState({});
  const [emailStatus, setEmailStatus] = useState({});
  const [previewContent, setPreviewContent] = useState("");
  const [previewSubject, setPreviewSubject] = useState("");
  const [templateToDeleteId, setTemplateToDeleteId] = useState(null);
  const [newEmailInput, setNewEmailInput] = useState("");
  // Context Menu States
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    type: null, // 'template', 'folder', 'empty', 'editor', 'preview', 'visualButton'
    item: null,
  });
  const [isEditingInContext, setIsEditingInContext] = useState(null); // 'name' or 'subject'
  const [contextEditValue, setContextEditValue] = useState("");
  // View Mode - Set to list by default
  const [viewMode, setViewMode] = useState("list"); // only list
  const [sortBy, setSortBy] = useState("date"); // name, date, usage
  const [sortOrder, setSortOrder] = useState("desc"); // asc or desc
  // Preview Mode - Only desktop
  const [previewDevice, setPreviewDevice] = useState("desktop"); // desktop only
  // Refs
  const emailModalRef = useRef(null);
  const fileInputRef = useRef(null);
  const previewRef = useRef(null);
  const editorRef = useRef(null);
  const contextMenuRef = useRef(null);
  const templateListRef = useRef(null);
  const splitPaneRef = useRef(null);
  const previewScrollPosition = useRef({ x: 0, y: 0 });
  const emailEditorRef = useRef(null);
  const { showToast } = useToast();
  // Find & Replace
  const [bulkSearchWords, setBulkSearchWords] = useState("");
  const [bulkSearchResults, setBulkSearchResults] = useState([]);
  const [activeTab, setActiveTab] = useState("single"); // "single" or "bulk"
  // Constants
  const companyName = `${SiteDetails.programName}` || "Honhaar Jawan";
  // Folder System
  const [expandedFolders, setExpandedFolders] = useState({});
  const [folderStructure, setFolderStructure] = useState({});
  // Track unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [originalContent, setOriginalContent] = useState("");
  const [originalSubject, setOriginalSubject] = useState("");
  const preBuiltTemplates = [];
  // Memoized computations
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === selectedTemplateId),
    [templates, selectedTemplateId]
  );
  const templatesInSelectedFolder = useMemo(
    () =>
      templates.filter(
        (template) =>
          selectedFolder === "all" || template.folderId === selectedFolder
      ),
    [templates, selectedFolder]
  );
  const filteredTestTemplates = useMemo(
    () =>
      templates.filter(
        (template) =>
          selectedTestFolder === "all" ||
          template.folderId === selectedTestFolder
      ),
    [templates, selectedTestFolder]
  );
  // Filtered history based on search
  const filteredHistory = useMemo(() => {
    if (!selectedHistoryTemplate || !templateHistory[selectedHistoryTemplate])
      return [];
    const history = templateHistory[selectedHistoryTemplate];
    if (!historySearchQuery.trim()) return history;
    const query = historySearchQuery.toLowerCase();
    return history.filter(
      (version) =>
        version.subject?.toLowerCase().includes(query) ||
        version.template?.toLowerCase().includes(query) ||
        version.changeReason?.toLowerCase().includes(query)
    );
  }, [selectedHistoryTemplate, templateHistory, historySearchQuery]);
  // Optimized template filtering with debounced search
  useEffect(() => {
    let filtered = templatesInSelectedFolder.filter((template) => {
      if (!debouncedSearchQuery) return true;
      const query = debouncedSearchQuery.toLowerCase();
      return (
        template.id.toLowerCase().includes(query) ||
        (template.subject && template.subject.toLowerCase().includes(query)) ||
        (template.template && template.template.toLowerCase().includes(query))
      );
    });
    let sorted = [...filtered];
    if (sortBy === "name") {
      sorted.sort((a, b) =>
        sortOrder === "asc"
          ? a.id.localeCompare(b.id)
          : b.id.localeCompare(a.id)
      );
    } else if (sortBy === "date") {
      sorted.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return sortOrder === "asc" ? timeA - timeB : timeB - timeA;
      });
    }
    setFilteredTemplates(sorted);
  }, [templatesInSelectedFolder, debouncedSearchQuery, sortBy, sortOrder]);
  // Initialize folder structure
  useEffect(() => {
    const structure = {};
    folders.forEach((folder) => {
      structure[folder.id] = {
        ...folder,
        expanded: expandedFolders[folder.id] || false,
        templates: templates.filter((t) => t.folderId === folder.id),
      };
    });
    setFolderStructure(structure);
  }, [folders, templates, expandedFolders]);
  // Toggle folder expansion
  const toggleFolderExpansion = useCallback((folderId) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }));
  }, []);
  // Optimized Firebase operations
  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      const querySnapshot = await getDocs(
        collection(firestore, "email_templates")
      );
      const templatesData = querySnapshot.docs.map((document) => ({
        id: document.id,
        ...document.data(),
      }));
      // Separate folders and templates
      const folderItems = templatesData.filter(
        (item) => item.type === "folder"
      );
      const templateItems = templatesData.filter(
        (item) => !item.type || item.type === "template"
      );
      setFolders(folderItems);
      setTemplates(templateItems);
      if (templateItems.length > 0 && !selectedTestTemplate) {
        setSelectedTestTemplate(templateItems[0].id);
      }
    } catch (error) {
      console.error("Error fetching templates:", error);
      setErrorMessage("Failed to load templates.");
      showToast("Failed to load templates. Please try again.", "error");
    } finally {
      setLoadingTemplates(false);
    }
  }, [selectedTestTemplate, showToast]);
  // Optimized template history - only fetch when explicitly requested
  const fetchTemplateHistory = useCallback(
    async (templateId) => {
      if (templateHistory[templateId]) {
        // Already cached, no need to fetch again
        return;
      }
      try {
        setLoadingHistory(true);
        const querySnapshot = await getDocs(
          collection(firestore, "email_templates", templateId, "versions")
        );
        const historyData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setTemplateHistory((prev) => ({
          ...prev,
          [templateId]: historyData.sort(
            (a, b) =>
              (b.versionCreatedAt?.seconds || 0) -
              (a.versionCreatedAt?.seconds || 0)
          ),
        }));
      } catch (error) {
        console.error("Error fetching template history:", error);
        showToast("Failed to load template history.", "error");
      } finally {
        setLoadingHistory(false);
      }
    },
    [templateHistory, showToast]
  );
  // Load history when history modal is opened for a template
  const handleOpenHistoryModal = useCallback(
    async (templateId) => {
      setSelectedHistoryTemplate(templateId);
      setShowHistoryModal(true);
      setHistorySearchQuery("");
      // Only fetch if we don't have it cached
      if (!templateHistory[templateId]) {
        await fetchTemplateHistory(templateId);
      }
    },
    [templateHistory, fetchTemplateHistory]
  );
  // Enhanced version saving with batch operations
  const saveTemplateVersion = useCallback(
    async (templateId, templateData, changeReason = "Manual edit") => {
      try {
        await setDoc(
          doc(collection(firestore, "email_templates", templateId, "versions")),
          {
            ...templateData,
            versionCreatedAt: serverTimestamp(),
            changeReason,
            versionNumber: (templateHistory[templateId]?.length || 0) + 1,
          }
        );
        // Update local cache if we have this template's history loaded
        if (templateHistory[templateId]) {
          setTemplateHistory((prev) => ({
            ...prev,
            [templateId]: [
              {
                ...templateData,
                versionCreatedAt: new Date(),
                changeReason,
                versionNumber: (prev[templateId]?.length || 0) + 1,
              },
              ...(prev[templateId] || []),
            ].slice(0, 50), // Keep only last 50 versions
          }));
        }
      } catch (error) {
        console.error("Error saving template version:", error);
      }
    },
    [templateHistory]
  );
  // Clear all history for a specific template
  const clearTemplateHistory = useCallback(
    async (templateId) => {
      try {
        setClearingHistory(true);
        const versionsRef = collection(
          firestore,
          "email_templates",
          templateId,
          "versions"
        );
        const querySnapshot = await getDocs(versionsRef);
        const deletePromises = querySnapshot.docs.map((doc) =>
          deleteDoc(doc.ref)
        );
        await Promise.all(deletePromises);
        // Update local state
        setTemplateHistory((prev) => {
          const updated = { ...prev };
          delete updated[templateId];
          return updated;
        });
        showToast(`History cleared for template ${templateId}`, "success");
      } catch (error) {
        console.error("Error clearing template history:", error);
        showToast("Failed to clear template history", "error");
      } finally {
        setClearingHistory(false);
      }
    },
    [showToast]
  );
  // Clear all history for all templates
  const clearAllHistory = useCallback(async () => {
    try {
      setClearingHistory(true);
      // Get all templates
      const templatesSnapshot = await getDocs(
        collection(firestore, "email_templates")
      );
      const templateIds = templatesSnapshot.docs
        .filter((doc) => !doc.data().type || doc.data().type === "template")
        .map((doc) => doc.id);
      let clearedCount = 0;
      // Clear history for each template
      for (const templateId of templateIds) {
        try {
          const versionsRef = collection(
            firestore,
            "email_templates",
            templateId,
            "versions"
          );
          const versionsSnapshot = await getDocs(versionsRef);
          const deletePromises = versionsSnapshot.docs.map((doc) =>
            deleteDoc(doc.ref)
          );
          await Promise.all(deletePromises);
          clearedCount += versionsSnapshot.docs.length;
        } catch (error) {
          console.error(`Error clearing history for ${templateId}:`, error);
        }
      }
      // Clear local state
      setTemplateHistory({});
      setShowClearHistoryModal(false);
      showToast(
        `Cleared ${clearedCount} version records across all templates`,
        "success"
      );
    } catch (error) {
      console.error("Error clearing all history:", error);
      showToast("Failed to clear all history", "error");
    } finally {
      setClearingHistory(false);
    }
  }, [showToast]);
  // Optimized editor handlers
  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    // Optimize editor for large files
    editor.updateOptions({
      scrollBeyondLastLine: false,
      automaticLayout: true,
      minimap: { enabled: false }, // Disable minimap for performance
      renderLineHighlight: "none",
      lineNumbersMinChars: 3,
      folding: false,
      renderWhitespace: "none",
      largeFileOptimizations: true,
    });
  }, []);
  const handleEditorChange = useCallback((value) => {
    setEditedContent(value || "");
    setHasUnsavedChanges(true);
  }, []);
  // Bulk word search handler
  const handleBulkWordSearch = useCallback(async () => {
    if (!bulkSearchWords.trim()) {
      showToast("Please enter words to search", "warning");
      return;
    }
    try {
      // Parse words from textarea (support JSON array, comma-separated, or line-separated)
      let words = [];
      try {
        // Try to parse as JSON array first
        const parsed = JSON.parse(bulkSearchWords);
        if (Array.isArray(parsed)) {
          words = parsed;
        }
      } catch {
        // If not JSON, split by commas and newlines
        words = bulkSearchWords
          .split(/[\n,]/)
          .map((word) => word.trim())
          .filter((word) => word.length > 0);
      }
      if (words.length === 0) {
        showToast("No valid words found to search", "warning");
        return;
      }
      const results = [];
      templates.forEach((template) => {
        if (
          selectedSearchFolder !== "all" &&
          template.folderId !== selectedSearchFolder
        ) {
          return;
        }
        const templateResults = {
          id: template.id,
          name: template.name || template.id,
          subject: template.subject,
          foundWords: [],
          totalMatches: 0,
          contentMatches: 0,
          subjectMatches: 0,
        };
        words.forEach((word) => {
          let searchRegex;
          try {
            const flags = findReplaceOptions.caseSensitive ? "g" : "gi";
            if (findReplaceOptions.useRegex) {
              searchRegex = new RegExp(word, flags);
            } else {
              const escapedText = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              searchRegex = new RegExp(
                findReplaceOptions.wholeWord
                  ? `\\b${escapedText}\\b`
                  : escapedText,
                flags
              );
            }
          } catch (error) {
            console.warn(`Invalid regex for word: ${word}`, error);
            return;
          }
          let wordMatches = 0;
          let contentMatches = 0;
          let subjectMatches = 0;
          // Search in content
          if (findReplaceOptions.searchInContent && template.template) {
            const matches = template.template.match(searchRegex);
            if (matches) {
              contentMatches = matches.length;
              wordMatches += contentMatches;
            }
          }
          // Search in subject
          if (findReplaceOptions.searchInSubject && template.subject) {
            const matches = template.subject.match(searchRegex);
            if (matches) {
              subjectMatches = matches.length;
              wordMatches += subjectMatches;
            }
          }
          if (wordMatches > 0) {
            templateResults.foundWords.push({
              word,
              count: wordMatches,
              contentMatches,
              subjectMatches,
            });
            templateResults.totalMatches += wordMatches;
            templateResults.contentMatches += contentMatches;
            templateResults.subjectMatches += subjectMatches;
          }
        });
        if (templateResults.foundWords.length > 0) {
          // Sort by match count descending
          templateResults.foundWords.sort((a, b) => b.count - a.count);
          results.push(templateResults);
        }
      });
      // Sort results by total matches descending
      results.sort((a, b) => b.totalMatches - a.totalMatches);
      setBulkSearchResults(results);
      if (results.length === 0) {
        showToast("No templates found with the specified words", "info");
      } else {
        showToast(
          `Found ${results.length} templates with matching words`,
          "success"
        );
      }
    } catch (error) {
      console.error("Error in bulk word search:", error);
      showToast("Error performing bulk word search", "error");
    }
  }, [
    bulkSearchWords,
    templates,
    selectedSearchFolder,
    findReplaceOptions,
    showToast,
  ]);
  // Enhanced find & replace with version history and improved logic
  const handleFindReplace = useCallback(async () => {
    if (activeTab === "single") {
      // Single find/replace logic
      if (!findText) {
        showToast("Please enter text to find", "warning");
        return;
      }
      if (searchResults.length === 0) {
        showToast("No templates found to replace", "warning");
        return;
      }
    } else {
      // Bulk find/replace logic
      if (bulkSearchResults.length === 0 || !replaceText) {
        showToast("No search results or replacement text provided", "warning");
        return;
      }
    }
    try {
      let updatedCount = 0;
      const batch = writeBatch(firestore);
      const templatesToProcess =
        activeTab === "single" ? searchResults : bulkSearchResults;
      for (const result of templatesToProcess) {
        const template = templates.find((t) => t.id === result.id);
        if (!template) continue;
        let shouldUpdate = false;
        const updates = {};
        if (activeTab === "single") {
          // Build regex based on options for single search
          let searchRegex;
          try {
            let flags = findReplaceOptions.caseSensitive ? "g" : "gi";
            if (findReplaceOptions.useRegex) {
              searchRegex = new RegExp(findText, flags);
            } else {
              // Escape special regex characters if not using regex
              const escapedText = findText.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
              );
              searchRegex = new RegExp(
                findReplaceOptions.wholeWord
                  ? `\\b${escapedText}\\b`
                  : escapedText,
                flags
              );
            }
          } catch (error) {
            showToast("Invalid regex pattern", "error");
            return;
          }
          // Replace in content
          if (findReplaceOptions.searchInContent && template.template) {
            const newContent = isReplacingAll
              ? template.template.replace(searchRegex, replaceText)
              : template.template.replace(searchRegex, replaceText); // Optimized: only replace if all, but since g flag, it's all anyway. For optimization, perhaps limit replacements if not all, but user wants all or not.
            if (newContent !== template.template) {
              updates.template = newContent;
              shouldUpdate = true;
            }
          }
          // Replace in subject
          if (findReplaceOptions.searchInSubject && template.subject) {
            const newSubject = isReplacingAll
              ? template.subject.replace(searchRegex, replaceText)
              : template.subject.replace(searchRegex, replaceText);
            if (newSubject !== template.subject) {
              updates.subject = newSubject;
              shouldUpdate = true;
            }
          }
        } else {
          // Bulk replacement logic
          if (findReplaceOptions.searchInContent && template.template) {
            let newContent = template.template;
            let replaced = false;
            result.foundWords.forEach(({ word }) => {
              let searchRegex;
              try {
                const flags = findReplaceOptions.caseSensitive ? "g" : "gi";
                if (findReplaceOptions.useRegex) {
                  searchRegex = new RegExp(word, flags);
                } else {
                  const escapedText = word.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  );
                  searchRegex = new RegExp(
                    findReplaceOptions.wholeWord
                      ? `\\b${escapedText}\\b`
                      : escapedText,
                    flags
                  );
                }
                const updated = newContent.replace(searchRegex, replaceText);
                if (updated !== newContent) {
                  newContent = updated;
                  replaced = true;
                }
              } catch (error) {
                console.warn(`Invalid regex for word: ${word}`, error);
              }
            });
            if (replaced) {
              updates.template = newContent;
              shouldUpdate = true;
            }
          }
          if (findReplaceOptions.searchInSubject && template.subject) {
            let newSubject = template.subject;
            let replaced = false;
            result.foundWords.forEach(({ word }) => {
              let searchRegex;
              try {
                const flags = findReplaceOptions.caseSensitive ? "g" : "gi";
                if (findReplaceOptions.useRegex) {
                  searchRegex = new RegExp(word, flags);
                } else {
                  const escapedText = word.replace(
                    /[.*+?^${}()|[\]\\]/g,
                    "\\$&"
                  );
                  searchRegex = new RegExp(
                    findReplaceOptions.wholeWord
                      ? `\\b${escapedText}\\b`
                      : escapedText,
                    flags
                  );
                }
                const updated = newSubject.replace(searchRegex, replaceText);
                if (updated !== newSubject) {
                  newSubject = updated;
                  replaced = true;
                }
              } catch (error) {
                console.warn(`Invalid regex for word: ${word}`, error);
              }
            });
            if (replaced) {
              updates.subject = newSubject;
              shouldUpdate = true;
            }
          }
        }
        if (shouldUpdate) {
          // Save version before update
          const versionMessage =
            activeTab === "single"
              ? `Find & Replace: "${findText}" -> "${replaceText}"`
              : `Bulk Replace: ${
                  result.foundWords?.length || "multiple"
                } words -> "${replaceText}"`;
          await saveTemplateVersion(template.id, template, versionMessage);
          const templateRef = doc(firestore, "email_templates", template.id);
          batch.update(templateRef, {
            ...updates,
            lastModified: serverTimestamp(),
          });
          updatedCount++;
        }
      }
      if (updatedCount > 0) {
        await batch.commit();
        await fetchTemplates();
        showToast(
          `Updated ${updatedCount} templates with ${
            activeTab === "single" ? "find/replace" : "bulk replace"
          }`,
          "success"
        );
        // Reset states
        setShowFindReplace(false);
        setFindText("");
        setReplaceText("");
        setSearchResults([]);
        setBulkSearchWords("");
        setBulkSearchResults([]);
      } else {
        showToast("No changes were made", "info");
      }
    } catch (error) {
      console.error("Error in find/replace:", error);
      showToast("Error performing find/replace", "error");
    }
  }, [
    activeTab,
    findText,
    replaceText,
    searchResults,
    bulkSearchResults,
    templates,
    findReplaceOptions,
    isReplacingAll,
    saveTemplateVersion,
    fetchTemplates,
    showToast,
  ]);
  // Optimized live search for find and replace
  const handleFindTextChange = useCallback(
    (text) => {
      setFindText(text);
      if (!text.trim()) {
        setSearchResults([]);
        return;
      }
      // Build regex based on options
      let searchRegex;
      try {
        let flags = findReplaceOptions.caseSensitive ? "g" : "gi";
        if (findReplaceOptions.useRegex) {
          searchRegex = new RegExp(text, flags);
        } else {
          // Escape special regex characters if not using regex
          const escapedText = text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
          searchRegex = new RegExp(
            findReplaceOptions.wholeWord ? `\\b${escapedText}\\b` : escapedText,
            flags
          );
        }
      } catch (error) {
        // Invalid regex, fallback to simple text matching
        searchRegex = null;
      }
      const filteredTemplates = templates.filter((template) => {
        if (
          selectedSearchFolder !== "all" &&
          template.folderId !== selectedSearchFolder
        ) {
          return false;
        }
        let matches = false;
        // Search in content
        if (findReplaceOptions.searchInContent && template.template) {
          let contentMatches = 0;
          if (searchRegex) {
            const matches = template.template.match(searchRegex);
            contentMatches = matches ? matches.length : 0;
          } else {
            // Fallback to simple text matching
            const query = findReplaceOptions.caseSensitive
              ? text
              : text.toLowerCase();
            const content = findReplaceOptions.caseSensitive
              ? template.template
              : template.template.toLowerCase();
            contentMatches = content.split(query).length - 1;
          }
          matches = matches || contentMatches > 0;
        }
        // Search in subject
        if (findReplaceOptions.searchInSubject && template.subject) {
          let subjectMatches = 0;
          if (searchRegex) {
            const matches = template.subject.match(searchRegex);
            subjectMatches = matches ? matches.length : 0;
          } else {
            // Fallback to simple text matching
            const query = findReplaceOptions.caseSensitive
              ? text
              : text.toLowerCase();
            const subject = findReplaceOptions.caseSensitive
              ? template.subject
              : template.subject.toLowerCase();
            subjectMatches = subject.split(query).length - 1;
          }
          matches = matches || subjectMatches > 0;
        }
        return matches;
      });
      const results = filteredTemplates.map((template) => {
        let contentMatches = 0;
        let subjectMatches = 0;
        // Count content matches
        if (findReplaceOptions.searchInContent && template.template) {
          if (searchRegex) {
            const matches = template.template.match(searchRegex);
            contentMatches = matches ? matches.length : 0;
          } else {
            const query = findReplaceOptions.caseSensitive
              ? text
              : text.toLowerCase();
            const content = findReplaceOptions.caseSensitive
              ? template.template
              : template.template.toLowerCase();
            contentMatches = content.split(query).length - 1;
          }
        }
        // Count subject matches
        if (findReplaceOptions.searchInSubject && template.subject) {
          if (searchRegex) {
            const matches = template.subject.match(searchRegex);
            subjectMatches = matches ? matches.length : 0;
          } else {
            const query = findReplaceOptions.caseSensitive
              ? text
              : text.toLowerCase();
            const subject = findReplaceOptions.caseSensitive
              ? template.subject
              : template.subject.toLowerCase();
            subjectMatches = subject.split(query).length - 1;
          }
        }
        return {
          id: template.id,
          name: template.name || template.id,
          subject: template.subject,
          matches: {
            template: contentMatches,
            subject: subjectMatches,
          },
        };
      });
      setSearchResults(results);
    },
    [templates, selectedSearchFolder, findReplaceOptions]
  );
  // Optimized template saving with better error handling
  const handleSaveTemplate = useCallback(async () => {
    if (!selectedTemplateId && !isCreating) {
      showToast("No template selected to save.", "warning");
      return;
    }
    if (!editedContent.trim()) {
      showToast("Template content cannot be empty.", "warning");
      return;
    }
    if (isCreating) {
      if (!newTemplateName.trim()) {
        showToast("Template name is required.", "warning");
        return;
      }
      // Check if template with this name already exists
      const existingTemplate = templates.find(
        (t) => t.id === newTemplateName.trim()
      );
      if (existingTemplate) {
        showToast("A template with this name already exists.", "error");
        return;
      }
      setAddingTemplate(true);
      setErrorMessage("");
      try {
        await setDoc(
          doc(firestore, "email_templates", newTemplateName.trim()),
          {
            template: editedContent,
            subject: editedSubject || "No Subject",
            createdAt: serverTimestamp(),
            folderId: selectedFolder !== "all" ? selectedFolder : null,
          }
        );
        await fetchTemplates();
        showToast("New template added successfully!", "success");
        handleCancelEdit();
      } catch (error) {
        console.error("Error adding new template:", error);
        showToast("Failed to add new template. Please try again.", "error");
      } finally {
        setAddingTemplate(false);
      }
    } else {
      setSavingTemplate(true);
      setErrorMessage("");
      try {
        const templateRef = doc(
          firestore,
          "email_templates",
          selectedTemplateId
        );
        const templateData = {
          template: editedContent,
          subject: editedSubject,
          lastModified: serverTimestamp(),
        };
        // Save current version to history before updating
        if (selectedTemplate) {
          await saveTemplateVersion(
            selectedTemplateId,
            selectedTemplate,
            "Manual edit"
          );
        }
        await updateDoc(templateRef, templateData);
        await fetchTemplates();
        showToast("Template saved successfully!", "success");
        setHasUnsavedChanges(false);
        setOriginalContent(editedContent);
        setOriginalSubject(editedSubject);
      } catch (error) {
        console.error("Error saving template:", error);
        showToast("Failed to save template. Please try again.", "error");
      } finally {
        setSavingTemplate(false);
      }
    }
  }, [
    selectedTemplateId,
    isCreating,
    editedContent,
    editedSubject,
    newTemplateName,
    templates,
    selectedFolder,
    selectedTemplate,
    fetchTemplates,
    saveTemplateVersion,
    showToast,
  ]);
  // Optimized cancel edit
  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setIsCreating(false);
    setSelectedTemplateId(null);
    setEditedContent("");
    setEditedSubject("");
    setNewTemplateName("");
    setIsEditorFullscreen(false);
    setEditingTemplateId(null);
    setEditingTemplateName("");
    setUseAdvancedEditor(false);
    setHasUnsavedChanges(false);
  }, []);
  // Start creating new template
  const handleStartCreating = useCallback((folderId = null) => {
    setIsCreating(true);
    setIsEditing(true);
    setSelectedTemplateId(null);
    setEditedContent("");
    setEditedSubject("");
    setNewTemplateName("");
    setUseAdvancedEditor(false);
    setHasUnsavedChanges(false);
    if (folderId) {
      setSelectedFolder(folderId);
    }
  }, []);
  // Template selection with unsaved changes check
  const selectTemplate = useCallback(
    (templateId) => {
      // Check if there are unsaved changes
      if (hasUnsavedChanges && selectedTemplateId !== templateId) {
        setPendingTemplateId(templateId);
        setShowUnsavedChangesModal(true);
        return;
      }
      setSelectedTemplateId(templateId);
      // Auto-select the folder of the template
      const template = templates.find((t) => t.id === templateId);
      if (template && template.folderId) {
        setSelectedFolder(template.folderId);
      }
    },
    [templates, hasUnsavedChanges, selectedTemplateId]
  );
  // Handle unsaved changes
  const handleDiscardChanges = useCallback(() => {
    setShowUnsavedChangesModal(false);
    if (pendingTemplateId) {
      setSelectedTemplateId(pendingTemplateId);
      setPendingTemplateId(null);
      const template = templates.find((t) => t.id === pendingTemplateId);
      if (template) {
        setEditedContent(template.template);
        setEditedSubject(template.subject || "");
        setOriginalContent(template.template);
        setOriginalSubject(template.subject || "");
        setIsEditing(true);
        setIsCreating(false);
      }
    }
    setHasUnsavedChanges(false);
  }, [pendingTemplateId, templates]);
  const handleApplyChanges = useCallback(async () => {
    setShowUnsavedChangesModal(false);
    await handleSaveTemplate();
    if (pendingTemplateId) {
      setSelectedTemplateId(pendingTemplateId);
      setPendingTemplateId(null);
      const template = templates.find((t) => t.id === pendingTemplateId);
      if (template) {
        setEditedContent(template.template);
        setEditedSubject(template.subject || "");
        setOriginalContent(template.template);
        setOriginalSubject(template.subject || "");
        setIsEditing(true);
        setIsCreating(false);
      }
    }
  }, [pendingTemplateId, templates, handleSaveTemplate]);
  // Template preview
  const handlePreviewTemplate = useCallback(
    async (templateId) => {
      try {
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          showToast("Selected template not found.", "warning");
          return;
        }
        if (typeof window !== "undefined") {
          const previewWindow = window.open(
            "",
            "_blank",
            "width=800,height=600"
          );
          if (previewWindow) {
            previewWindow.document.write(template.template);
            previewWindow.document.close();
          } else {
            showToast(
              "Failed to open preview window. Please allow pop-ups.",
              "error"
            );
          }
        }
      } catch (error) {
        console.error("Error previewing template:", error);
        showToast("Error previewing template.", "error");
      }
    },
    [templates, showToast]
  );
  // Send test email
  const handleSendTestEmail = useCallback(
    async (templateId) => {
      const template = templates.find((t) => t.id === templateId);
      if (!template) {
        setErrorMessage("Template not found.");
        return;
      }
      if (!selectedEmail) {
        showToast("Please select an email to send the test to.", "warning");
        return;
      }
      setSendingTestEmail(true);
      setEmailStatus({});
      setEmailErrors({});
      try {
        const email = selectedEmail;
        const response = await fetch(`/api/sendMail`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: email,
            subject: template.subject || "Test Email",
            htmlTemplate: template.template,
            placeholders: {
              fullName: testEmailName,
              companyName: companyName,
            },
          }),
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setEmailStatus({ [email]: "success" });
          showToast(
            `Test email sent successfully to ${testEmailName} (${email})`,
            "success"
          );
        } else {
          setEmailStatus({ [email]: "error" });
          setEmailErrors({ [email]: data.message || "Unknown error" });
          showToast(
            `Failed to send test email to ${testEmailName}: ${
              data.message || "Unknown error"
            }`,
            "error"
          );
        }
      } catch (error) {
        console.error("Error sending test email:", error);
        setEmailStatus({ [selectedEmail]: "error" });
        setEmailErrors({ [selectedEmail]: error.message || "Network error" });
        showToast(
          error.message || "Failed to send test email. Please try again.",
          "error"
        );
      } finally {
        setSendingTestEmail(false);
      }
    },
    [templates, selectedEmail, testEmailName, companyName, showToast]
  );
  // Send test from dropdown
  const handleSendTestFromDropdown = useCallback(async () => {
    if (!selectedTestTemplate) {
      showToast("Please select a template to send.", "warning");
      return;
    }
    await handleSendTestEmail(selectedTestTemplate);
  }, [selectedTestTemplate, handleSendTestEmail, showToast]);
  // Delete template
  const handleDeleteTemplate = useCallback((templateId) => {
    setTemplateToDeleteId(templateId);
    setShowConfirmModal(true);
  }, []);
  const confirmDeleteTemplate = useCallback(async () => {
    setShowConfirmModal(false);
    setDeletingTemplate(true);
    setErrorMessage("");
    try {
      await deleteDoc(doc(firestore, "email_templates", templateToDeleteId));
      await fetchTemplates();
      if (selectedTemplateId === templateToDeleteId) {
        setSelectedTemplateId(null);
        setIsEditing(false);
        setEditedContent("");
        setEditedSubject("");
        setIsEditorFullscreen(false);
      }
      showToast(
        `Template "${templateToDeleteId}" deleted successfully.`,
        "success"
      );
    } catch (error) {
      console.error("Error deleting template:", error);
      setErrorMessage(`Failed to delete template "${templateToDeleteId}".`);
      showToast(
        `Failed to delete template "${templateToDeleteId}". Please try again.`,
        "error"
      );
    } finally {
      setDeletingTemplate(false);
      setTemplateToDeleteId(null);
    }
  }, [templateToDeleteId, selectedTemplateId, fetchTemplates, showToast]);
  // Email management
  const handleAddNewEmail = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmailInput)) {
      setEmailErrors({ newEmail: "Invalid email format" });
      showToast("Invalid email format.", "error");
      return;
    }
    if (newEmailInput && !testEmails.includes(newEmailInput)) {
      setTestEmails([...testEmails, newEmailInput]);
      setSelectedEmail(newEmailInput);
    }
    setNewEmailInput("");
    setShowEmailModal(false);
    setEmailErrors({});
  }, [newEmailInput, testEmails, showToast]);
  // Compose modal functions
  const handleAddComposeRecipient = useCallback(() => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(composeEmailInput)) {
      showToast("Invalid email format.", "error");
      return;
    }
    if (composeEmailInput && !composeRecipients.includes(composeEmailInput)) {
      setComposeRecipients([...composeRecipients, composeEmailInput]);
    }
    setComposeEmailInput("");
  }, [composeEmailInput, composeRecipients, showToast]);
  const handleRemoveComposeRecipient = useCallback(
    (emailToRemove) => {
      setComposeRecipients(
        composeRecipients.filter((email) => email !== emailToRemove)
      );
    },
    [composeRecipients]
  );
  const handleSendComposedEmail = useCallback(async () => {
    if (composeRecipients.length === 0) {
      showToast("Please add at least one recipient.", "warning");
      return;
    }
    if (!composeSubject.trim()) {
      showToast("Subject is required.", "warning");
      return;
    }
    if (!composeContent.trim()) {
      showToast("Email content is required.", "warning");
      return;
    }
    // Parse the placeholders input
    let placeholdersObj = {
      fullName: testEmailName,
      companyName: companyName,
    };
    // Add custom placeholders if provided
    if (composePlaceholders.trim()) {
      try {
        // Parse key-value pairs like "password: 123, name: John"
        const customPlaceholders = composePlaceholders
          .split(",")
          .reduce((acc, pair) => {
            const [key, ...valueParts] = pair.split(":");
            if (key && valueParts.length > 0) {
              acc[key.trim()] = valueParts.join(":").trim();
            }
            return acc;
          }, {});
        placeholdersObj = { ...placeholdersObj, ...customPlaceholders };
      } catch (error) {
        showToast(
          "Invalid placeholder format. Use format: key1: value1, key2: value2",
          "error"
        );
        return;
      }
    }
    setSendingTestEmail(true);
    try {
      const response = await fetch(`/api/sendMail`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: composeRecipients,
          subject: composeSubject,
          htmlTemplate: composeContent,
          placeholders: placeholdersObj,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        showToast(
          `Email sent successfully to ${composeRecipients.length} recipient(s)!`,
          "success"
        );
      } else {
        showToast(
          `Failed to send email: ${data.message || "Unknown error"}`,
          "error"
        );
      }
    } catch (error) {
      console.error("Error sending composed email:", error);
      showToast("Failed to send email. Please try again.", "error");
    } finally {
      setSendingTestEmail(false);
      setShowComposeModal(false);
      setComposeSubject("");
      setComposeContent("");
      setComposeRecipients([]);
      setComposePlaceholders("");
    }
  }, [
    composeRecipients,
    composeSubject,
    composeContent,
    composePlaceholders,
    testEmailName,
    companyName,
    showToast,
  ]);
  // Memoized event handlers
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape" && isEditorFullscreen) {
        setIsEditorFullscreen(false);
      }
    },
    [isEditorFullscreen]
  );
  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);
  const handleFileUpload = useCallback(
    (file) => {
      if (file.type !== "text/html") {
        showToast("Please upload an HTML file", "error");
        return;
      }
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        if (isCreating) {
          setEditedContent(content);
        } else if (isEditing) {
          setEditedContent(content);
        }
        showToast("HTML file imported successfully!", "success");
      };
      reader.readAsText(file);
    },
    [isCreating, isEditing, showToast]
  );
  const handleFileInputChange = useCallback(
    (e) => {
      const file = e.target.files[0];
      if (file) {
        handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );
  const triggerFileInput = useCallback(() => {
    fileInputRef.current?.click();
  }, []);
  // Enhanced Editor Features
  const handleFormatCode = useCallback(async () => {
    try {
      const prettier = await import("prettier/standalone");
      const htmlParser = await import("prettier/parser-html");
      const formattedCode = prettier.format(editedContent, {
        parser: "html",
        plugins: [htmlParser],
        printWidth: 80,
        tabWidth: 2,
        useTabs: false,
      });
      setEditedContent(formattedCode);
      showToast("Code formatted successfully!", "success");
    } catch (error) {
      console.error("Error formatting code:", error);
      showToast("Error formatting code", "error");
    }
  }, [editedContent, showToast]);
  // Folder Management
  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) {
      showToast("Folder name is required", "warning");
      return;
    }
    try {
      const folderRef = await addDoc(collection(firestore, "email_templates"), {
        name: newFolderName,
        type: "folder",
        createdAt: serverTimestamp(),
      });
      await fetchTemplates();
      setNewFolderName("");
      setShowFolderModal(false);
      showToast("Folder created successfully!", "success");
    } catch (error) {
      console.error("Error creating folder:", error);
      showToast("Error creating folder", "error");
    }
  }, [newFolderName, fetchTemplates, showToast]);
  const handleMoveToFolder = useCallback(
    async (templateId, folderId) => {
      try {
        setMovingTemplate(templateId);
        await updateDoc(doc(firestore, "email_templates", templateId), {
          folderId: folderId === "none" ? null : folderId,
        });
        await fetchTemplates();
        showToast("Template moved to folder successfully!", "success");
      } catch (error) {
        console.error("Error moving template to folder:", error);
        showToast("Error moving template to folder", "error");
      } finally {
        setMovingTemplate(null);
      }
    },
    [fetchTemplates, showToast]
  );
  const handleMoveOutAllFromFolder = useCallback(
    async (folderId) => {
      try {
        const batch = writeBatch(firestore);
        const templatesInFolder = templates.filter(
          (t) => t.folderId === folderId
        );
        templatesInFolder.forEach((template) => {
          const templateRef = doc(firestore, "email_templates", template.id);
          batch.update(templateRef, { folderId: null });
        });
        await batch.commit();
        await fetchTemplates();
        showToast("All templates moved out of folder!", "success");
      } catch (error) {
        console.error("Error moving out templates:", error);
        showToast("Failed to move out templates", "error");
      }
    },
    [templates, fetchTemplates, showToast]
  );
  const handleDeleteFolder = useCallback(
    async (folderId) => {
      try {
        await deleteDoc(doc(firestore, "email_templates", folderId));
        await fetchTemplates();
        showToast("Folder deleted successfully!", "success");
      } catch (error) {
        console.error("Error deleting folder:", error);
        showToast("Failed to delete folder", "error");
      }
    },
    [fetchTemplates, showToast]
  );
  const handleStartEditingFolderName = useCallback((folderId, currentName) => {
    setEditingFolderId(folderId);
    setEditingFolderName(currentName);
  }, []);
  const handleCancelEditingFolderName = useCallback(() => {
    setEditingFolderId(null);
    setEditingFolderName("");
  }, []);
  const handleUpdateFolderName = useCallback(
    async (folderId, newName) => {
      if (!newName.trim()) {
        showToast("Folder name is required", "warning");
        return;
      }
      try {
        const folderRef = doc(firestore, "email_templates", folderId);
        await updateDoc(folderRef, { name: newName });
        await fetchTemplates();
        setEditingFolderId(null);
        setEditingFolderName("");
        showToast("Folder name updated successfully!", "success");
      } catch (error) {
        console.error("Error updating folder name:", error);
        showToast("Failed to update folder name", "error");
      }
    },
    [fetchTemplates, showToast]
  );
  // Template History Management
  const handleRestoreVersion = useCallback(
    async (templateId, versionData) => {
      try {
        // Save current version before restoring
        const currentTemplate = templates.find((t) => t.id === templateId);
        if (currentTemplate) {
          await saveTemplateVersion(
            templateId,
            currentTemplate,
            `Before restoring version ${versionData.versionNumber}`
          );
        }
        await updateDoc(doc(firestore, "email_templates", templateId), {
          template: versionData.template,
          subject: versionData.subject,
          lastModified: serverTimestamp(),
        });
        await fetchTemplates();
        setShowHistoryModal(false);
        showToast("Template version restored successfully!", "success");
      } catch (error) {
        console.error("Error restoring template version:", error);
        showToast("Error restoring template version", "error");
      }
    },
    [templates, saveTemplateVersion, fetchTemplates, showToast]
  );
  // Template ID editing
  const handleStartEditingTemplateName = useCallback((templateId) => {
    setEditingTemplateId(templateId);
    setEditingTemplateName(templateId);
  }, []);
  const handleCancelEditingTemplateName = useCallback(() => {
    setEditingTemplateId(null);
    setEditingTemplateName("");
  }, []);
  const handleUpdateTemplateId = useCallback(
    async (oldTemplateId, newTemplateId) => {
      if (!newTemplateId.trim()) {
        showToast("Template ID is required", "warning");
        return;
      }
      if (newTemplateId === oldTemplateId) {
        setEditingTemplateId(null);
        setEditingTemplateName("");
        return;
      }
      try {
        // Check if new template ID already exists
        const newTemplateRef = doc(firestore, "email_templates", newTemplateId);
        const newTemplateSnap = await getDoc(newTemplateRef);
        if (newTemplateSnap.exists()) {
          showToast("Template ID already exists", "error");
          setEditingTemplateName(oldTemplateId); // Reset to original name
          return;
        }
        // Get current template data
        const oldTemplateRef = doc(firestore, "email_templates", oldTemplateId);
        const oldTemplateSnap = await getDoc(oldTemplateRef);
        const templateData = oldTemplateSnap.data();
        // Save version before renaming
        await saveTemplateVersion(
          oldTemplateId,
          templateData,
          `Before renaming to ${newTemplateId}`
        );
        // Create new template with updated ID
        await setDoc(newTemplateRef, {
          ...templateData,
          lastModified: serverTimestamp(),
        });
        // Copy version history if exists
        try {
          const versionsSnapshot = await getDocs(
            collection(firestore, "email_templates", oldTemplateId, "versions")
          );
          for (const versionDoc of versionsSnapshot.docs) {
            await setDoc(
              doc(
                collection(
                  firestore,
                  "email_templates",
                  newTemplateId,
                  "versions"
                )
              ),
              versionDoc.data()
            );
          }
        } catch (error) {
          console.log("No version history to copy");
        }
        // Delete old template
        await deleteDoc(oldTemplateRef);
        await fetchTemplates();
        setEditingTemplateId(null);
        setEditingTemplateName("");
        setSelectedTemplateId(newTemplateId);
        showToast("Template ID updated successfully!", "success");
      } catch (error) {
        console.error("Error updating template ID:", error);
        showToast("Error updating template ID", "error");
        setEditingTemplateName(oldTemplateId); // Reset to original name on error
      }
    },
    [fetchTemplates, saveTemplateVersion, showToast]
  );
  const handleConfirmTemplateNameChange = useCallback(
    (oldTemplateId) => {
      if (editingTemplateName.trim() && editingTemplateName !== oldTemplateId) {
        handleUpdateTemplateId(oldTemplateId, editingTemplateName);
      } else {
        handleCancelEditingTemplateName();
      }
    },
    [
      editingTemplateName,
      handleUpdateTemplateId,
      handleCancelEditingTemplateName,
    ]
  );
  // Preview content
  const handlePreviewTemplateContent = useCallback(() => {
    if (!previewContent.trim()) {
      showToast("Preview content cannot be empty.", "warning");
      return;
    }
    if (typeof window !== "undefined") {
      const previewWindow = window.open("", "_blank", "width=800,height=600");
      if (previewWindow) {
        previewWindow.document.write(previewContent);
        previewWindow.document.close();
      } else {
        showToast(
          "Failed to open preview window. Please allow pop-ups.",
          "error"
        );
      }
    }
  }, [previewContent, showToast]);
  // Quick preview modal
  const handleQuickPreview = useCallback(() => {
    setShowQuickPreviewModal(true);
  }, []);
  // Template duplication
  const handleDuplicateTemplate = useCallback(
    async (templateId) => {
      try {
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          showToast("Template not found", "error");
          return;
        }
        const newName = `${template.id}_copy`;
        const newTemplateRef = doc(firestore, "email_templates", newName);
        await setDoc(newTemplateRef, {
          ...template,
          id: newName,
          createdAt: serverTimestamp(),
          lastModified: serverTimestamp(),
        });
        await fetchTemplates();
        showToast(`Template duplicated as "${newName}"`, "success");
      } catch (error) {
        console.error("Error duplicating template:", error);
        showToast("Failed to duplicate template", "error");
      }
    },
    [templates, fetchTemplates, showToast]
  );
  // Template export
  const handleExportTemplate = useCallback(
    async (templateId, format) => {
      try {
        const template = templates.find((t) => t.id === templateId);
        if (!template) {
          showToast("Template not found", "error");
          return;
        }
        let content, filename, mimeType;
        if (format === "html") {
          content = template.template;
          filename = `${template.id}.html`;
          mimeType = "text/html";
        } else if (format === "json") {
          content = JSON.stringify(template, null, 2);
          filename = `${template.id}.json`;
          mimeType = "application/json";
        }
        // Create a download link
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast(`Template exported as ${format.toUpperCase()}`, "success");
      } catch (error) {
        console.error("Error exporting template:", error);
        showToast("Failed to export template", "error");
      }
    },
    [templates, showToast]
  );
  // Context Menu Handlers
  const handleContextMenu = useCallback(
    (e, type, item) => {
      e.preventDefault();
      // Close any existing context menu
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0, type: null, item: null });
      }
      setIsEditingInContext(null);
      setContextEditValue("");
      // Show new context menu
      setContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        type,
        item,
      });
    },
    [contextMenu.visible]
  );
  const closeContextMenu = useCallback(() => {
    setContextMenu({ visible: false, x: 0, y: 0, type: null, item: null });
    setIsEditingInContext(null);
    setContextEditValue("");
  }, []);
  // Handle context menu actions
  const handleContextMenuAction = useCallback(
    (action, extra) => {
      const { type, item } = contextMenu;
      if (type === "template") {
        switch (action) {
          case "edit":
            selectTemplate(item.id);
            closeContextMenu();
            break;
          case "editName":
            setIsEditingInContext("name");
            setContextEditValue(item.id);
            break;
          case "editSubject":
            setIsEditingInContext("subject");
            setContextEditValue(item.subject || "");
            break;
          case "saveEdit":
            if (isEditingInContext === "name") {
              handleUpdateTemplateId(item.id, contextEditValue);
            } else if (isEditingInContext === "subject") {
              updateDoc(doc(firestore, "email_templates", item.id), {
                subject: contextEditValue,
              }).then(() => {
                fetchTemplates();
                showToast("Subject updated!", "success");
              });
            }
            closeContextMenu();
            break;
          case "duplicate":
            handleDuplicateTemplate(item.id);
            closeContextMenu();
            break;
          case "delete":
            handleDeleteTemplate(item.id);
            closeContextMenu();
            break;
          case "moveToFolder":
            // This would open a folder selection modal
            // For now, we'll just show a toast
            showToast("Move to folder feature coming soon", "info");
            closeContextMenu();
            break;
          case "export":
            handleExportTemplate(item.id, "html");
            closeContextMenu();
            break;
          case "exportJson":
            handleExportTemplate(item.id, "json");
            closeContextMenu();
            break;
          case "viewHistory":
            handleOpenHistoryModal(item.id);
            closeContextMenu();
            break;
          case "sortNewest":
            setSortBy("date");
            setSortOrder("desc");
            closeContextMenu();
            break;
          case "sortOldest":
            setSortBy("date");
            setSortOrder("asc");
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else if (type === "folder") {
        switch (action) {
          case "rename":
            handleStartEditingFolderName(item.id, item.name);
            closeContextMenu();
            break;
          case "delete":
            handleDeleteFolder(item.id);
            closeContextMenu();
            break;
          case "moveOutAll":
            handleMoveOutAllFromFolder(item.id);
            closeContextMenu();
            break;
          case "createInFolder":
            handleStartCreating(item.id);
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else if (type === "empty") {
        switch (action) {
          case "createTemplate":
            handleStartCreating();
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else if (type === "editor") {
        switch (action) {
          case "format":
            handleFormatCode();
            closeContextMenu();
            break;
          case "copy":
            navigator.clipboard.writeText(editedContent);
            showToast("Content copied to clipboard", "success");
            closeContextMenu();
            break;
          case "paste":
            navigator.clipboard.readText().then((text) => {
              setEditedContent(text);
              showToast("Content pasted from clipboard", "success");
            });
            closeContextMenu();
            break;
          case "selectAll":
            if (editorRef.current) {
              editorRef.current.setSelection(
                editorRef.current.getModel().getFullModelRange()
              );
            }
            closeContextMenu();
            break;
          case "undo":
            if (editorRef.current) {
              editorRef.current.trigger("source", "actions", "undo");
            }
            closeContextMenu();
            break;
          case "redo":
            if (editorRef.current) {
              editorRef.current.trigger("source", "actions", "redo");
            }
            closeContextMenu();
            break;
          case "find":
            if (editorRef.current) {
              editorRef.current.trigger("actions", "editor.action.find");
            }
            closeContextMenu();
            break;
          case "comment":
            if (editorRef.current) {
              editorRef.current.trigger("editor.action.comment");
            }
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else if (type === "preview") {
        switch (action) {
          case "refresh":
            // Force refresh preview
            if (previewRef.current) {
              previewRef.current.srcdoc = editedContent;
            }
            showToast("Preview refreshed", "success");
            closeContextMenu();
            break;
          case "openInNewTab":
            if (typeof window !== "undefined") {
              const previewWindow = window.open(
                "",
                "_blank",
                "width=800,height=600"
              );
              if (previewWindow) {
                previewWindow.document.write(editedContent);
                previewWindow.document.close();
              }
            }
            closeContextMenu();
            break;
          case "print":
            if (previewRef.current && previewRef.current.contentWindow) {
              previewRef.current.contentWindow.print();
            }
            closeContextMenu();
            break;
          case "copyHtml":
            navigator.clipboard.writeText(editedContent);
            showToast("HTML copied to clipboard", "success");
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else if (type === "visualButton") {
        switch (action) {
          case "saveAndCreate":
            // Save current template and create a new one
            if (selectedTemplateId) {
              handleSaveTemplate().then(() => {
                handleStartCreating();
                setUseAdvancedEditor(true);
              });
            } else {
              handleStartCreating();
              setUseAdvancedEditor(true);
            }
            closeContextMenu();
            break;
          default:
            closeContextMenu();
            break;
        }
      } else {
        closeContextMenu();
      }
    },
    [
      contextMenu,
      isEditingInContext,
      contextEditValue,
      selectTemplate,
      handleDuplicateTemplate,
      handleDeleteTemplate,
      handleExportTemplate,
      handleStartCreating,
      handleFormatCode,
      editedContent,
      showToast,
      handleOpenHistoryModal,
      handleSaveTemplate,
      handleUpdateTemplateId,
      fetchTemplates,
      handleStartEditingFolderName,
      handleDeleteFolder,
      handleMoveOutAllFromFolder,
    ]
  );
  // Effects
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleKeyDown]);
  // Remove automatic fetch
  // useEffect(() => { fetchTemplates(); }, [fetchTemplates]); // Removed
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emailModalRef.current &&
        !emailModalRef.current.contains(event.target)
      ) {
        setShowEmailModal(false);
      }
      // Close context menu when clicking outside
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(event.target)
      ) {
        closeContextMenu();
      }
    };
    if (typeof window !== "undefined") {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      if (typeof window !== "undefined") {
        document.removeEventListener("mousedown", handleClickOutside);
      }
    };
  }, [closeContextMenu]);
  // Load content when selectedTemplateId changes
  useEffect(() => {
    if (selectedTemplateId) {
      const template = templates.find((t) => t.id === selectedTemplateId);
      if (template) {
        setEditedContent(template.template || "");
        setEditedSubject(template.subject || "");
        setOriginalContent(template.template || "");
        setOriginalSubject(template.subject || "");
        setIsEditing(true);
        setIsCreating(false);
        setHasUnsavedChanges(false);
      } else {
        showToast("Template not found. Please load templates again.", "error");
        setIsEditing(false);
      }
    } else {
      setIsEditing(false);
    }
  }, [selectedTemplateId, templates, showToast]);
  // Optimized PreviewPanel with memoization and scroll position preservation
  const PreviewPanel = React.memo(({ content }) => {
    const previewRef = useRef(null);
    // Save scroll position before content changes
    const saveScrollPosition = useCallback(() => {
      if (previewRef.current && previewRef.current.contentWindow) {
        previewScrollPosition.current = {
          x: previewRef.current.contentWindow.scrollX,
          y: previewRef.current.contentWindow.scrollY,
        };
      }
    }, []);
    // Restore scroll position after content changes
    const restoreScrollPosition = useCallback(() => {
      if (
        previewRef.current &&
        previewRef.current.contentWindow &&
        previewScrollPosition.current
      ) {
        setTimeout(() => {
          previewRef.current.contentWindow.scrollTo(
            previewScrollPosition.current.x,
            previewScrollPosition.current.y
          );
        }, 100);
      }
    }, []);
    useEffect(() => {
      if (previewRef.current && content) {
        saveScrollPosition();
        previewRef.current.srcdoc = content;
        previewRef.current.onload = restoreScrollPosition;
      }
    }, [content, saveScrollPosition, restoreScrollPosition]);
    return (
      <div className="h-full bg-gray-100 overflow-hidden relative">
        <div className="absolute top-2 right-2 z-10 flex gap-1">
          <button
            onClick={() => setPreviewDevice("desktop")}
            className={`p-1 rounded ${
              previewDevice === "desktop"
                ? "bg-primary text-white"
                : "bg-white text-gray-700"
            }`}
            title="Desktop View"
          >
            <IoDesktop size={14} />
          </button>
        </div>
        <div className="h-full w-full bg-white shadow-lg flex justify-center items-start overflow-x-hidden">
          <div className="origin-top transition-all duration-300 w-full">
            <iframe
              ref={previewRef}
              title="email-preview"
              className="w-full h-[1500px] border-0 shadow"
              srcDoc={content}
              onContextMenu={(e) => handleContextMenu(e, "preview", null)}
            />
          </div>
        </div>
      </div>
    );
  });
  PreviewPanel.displayName = "PreviewPanel";
  // Memoized TemplateCard component
  const TemplateCard = React.memo(({ template }) => {
    const [isMoving, setIsMoving] = useState(false);
    const handleMoveToFolder = async (templateId, folderId) => {
      try {
        setIsMoving(true);
        await updateDoc(doc(firestore, "email_templates", templateId), {
          folderId: folderId === "none" ? null : folderId,
        });
        await fetchTemplates();
        showToast("Template moved to folder successfully!", "success");
      } catch (error) {
        console.error("Error moving template to folder:", error);
        showToast("Error moving template to folder", "error");
      } finally {
        setIsMoving(false);
      }
    };
    const handleEditSubject = async (newSubject) => {
      try {
        await updateDoc(doc(firestore, "email_templates", template.id), {
          subject: newSubject,
        });
        await fetchTemplates();
        showToast("Subject updated successfully!", "success");
      } catch (error) {
        console.error("Error updating subject:", error);
        showToast("Failed to update subject", "error");
      }
    };
    return (
      <motion.div
        className={`relative p-2.5 rounded-md border transition-all duration-200 text-[13px] leading-tight
          ${
            selectedTemplateId === template.id
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm"
          }`}
        whileHover={{ y: -1 }}
        onContextMenu={(e) => handleContextMenu(e, "template", template)}
      >
        {/* Header Row */}
        <div className="flex items-start justify-between mb-1.5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              <IoDocumentTextOutline
                className="text-primary flex-shrink-0"
                size={14}
              />
              {editingTemplateId === template.id ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="text"
                    value={editingTemplateName}
                    onChange={(e) => setEditingTemplateName(e.target.value)}
                    className="text-[13px] font-medium bg-white border border-primary rounded px-1 py-0.5 w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleConfirmTemplateNameChange(template.id);
                      } else if (e.key === "Escape") {
                        handleCancelEditingTemplateName();
                      }
                    }}
                    onBlur={() => handleConfirmTemplateNameChange(template.id)}
                  />
                  <button
                    onClick={() => handleConfirmTemplateNameChange(template.id)}
                    className="p-0.5 rounded text-green-600 hover:text-green-800 hover:bg-green-100"
                    title="Confirm"
                  >
                    <IoCheckmark size={10} />
                  </button>
                  <button
                    onClick={handleCancelEditingTemplateName}
                    className="p-0.5 rounded text-red-600 hover:text-red-800 hover:bg-red-100"
                    title="Cancel"
                  >
                    <IoClose size={10} />
                  </button>
                </div>
              ) : (
                <>
                  <h3 className="font-medium text-gray-900 text-[13px] truncate">
                    {template.id}
                  </h3>
                  <button
                    onClick={() => handleStartEditingTemplateName(template.id)}
                    className="p-0.5 rounded text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                    title="Edit Template ID"
                  >
                    <IoPencilOutline size={10} />
                  </button>
                </>
              )}
            </div>
            {/* Folder badge */}
            {template.folderId && (
              <span className="inline-flex items-center gap-1 px-1 py-0.5 bg-gray-100 text-gray-600 text-[11px] rounded-full font-medium">
                <IoFolderOutline size={10} />
                {folders.find((f) => f.id === template.folderId)?.name}
              </span>
            )}
          </div>
          {/* Action buttons */}
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => handlePreviewTemplate(template.id)}
              className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
              title="Preview"
            >
              <IoEyeOutline size={12} />
            </button>
            <button
              onClick={() => handleOpenHistoryModal(template.id)}
              className="p-1 rounded bg-blue-100 text-blue-600 hover:bg-blue-200"
              title="History"
            >
              <IoTimeOutline size={12} />
            </button>
            <button
              onClick={() => handleDuplicateTemplate(template.id)}
              className="p-1 rounded bg-purple-100 text-purple-600 hover:bg-purple-200"
              title="Duplicate"
            >
              <IoDuplicateOutline size={12} />
            </button>
            <button
              onClick={() => handleDeleteTemplate(template.id)}
              className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
              title="Delete"
            >
              <IoTrashOutline size={12} />
            </button>
          </div>
        </div>
        {/* Subject + dates */}
        <div className="mb-2">
          <p className="text-[12px] text-gray-600 mb-1 line-clamp-2">
            {template.subject || "No Subject"}
          </p>
          <div className="flex flex-wrap gap-2 text-[11px] text-gray-500">
            <span>
              Created:{" "}
              {template.createdAt?.toDate?.().toLocaleDateString() || "Unknown"}
            </span>
            {template.lastModified && (
              <span>
                Mod: {template.lastModified?.toDate?.().toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
        {/* Bottom row */}
        <div className="flex gap-1.5">
          <button
            onClick={() => selectTemplate(template.id)}
            className="flex-1 py-1 text-[12px] font-medium bg-gray-100 hover:bg-gray-200 rounded"
          >
            {selectedTemplateId === template.id ? "Editing" : "Edit"}
          </button>
          <button
            onClick={() => handleSendTestEmail(template.id)}
            disabled={sendingTestEmail}
            className="px-2 py-1 text-[12px] bg-primary text-white hover:bg-primary/90 rounded disabled:opacity-50 flex items-center gap-1"
            title="Send Test"
          >
            <IoSendOutline size={11} />
            Test
          </button>
          <select
            value={template.folderId || "none"}
            onChange={(e) => handleMoveToFolder(template.id, e.target.value)}
            disabled={isMoving}
            className="py-1 px-2 text-[12px] border border-gray-300 rounded bg-white focus:ring-1 focus:ring-primary focus:border-primary"
          >
            <option value="none">Move</option>
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
      </motion.div>
    );
  });
  TemplateCard.displayName = "TemplateCard";
  // Folder Tree Component
  const FolderTree = React.memo(() => {
    return (
      <div className="space-y-1">
        {/* All Templates */}
        <div
          className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
            selectedFolder === "all"
              ? "bg-primary/10 text-primary"
              : "hover:bg-gray-100"
          }`}
          onClick={() => setSelectedFolder("all")}
          onContextMenu={(e) => handleContextMenu(e, "empty", null)}
        >
          <IoDocumentTextOutline size={16} />
          <span className="text-sm font-medium">All Templates</span>
          <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full">
            {templates.length}
          </span>
        </div>
        {/* Folders */}
        {folders.map((folder) => (
          <div key={folder.id} className="space-y-1">
            <div
              className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                selectedFolder === folder.id
                  ? "bg-primary/10 text-primary"
                  : "hover:bg-gray-100"
              }`}
              onClick={() => {
                setSelectedFolder(folder.id);
                toggleFolderExpansion(folder.id);
              }}
              onContextMenu={(e) => handleContextMenu(e, "folder", folder)}
            >
              {expandedFolders[folder.id] ? (
                <IoChevronDownOutline size={14} />
              ) : (
                <IoChevronForwardOutline size={14} />
              )}
              <IoFolderOpenOutline size={16} />
              {editingFolderId === folder.id ? (
                <div className="flex items-center gap-1 w-full">
                  <input
                    type="text"
                    value={editingFolderName}
                    onChange={(e) => setEditingFolderName(e.target.value)}
                    className="text-[13px] font-medium bg-white border border-primary rounded px-1 py-0.5 w-full"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleUpdateFolderName(folder.id, editingFolderName);
                      } else if (e.key === "Escape") {
                        handleCancelEditingFolderName();
                      }
                    }}
                    onBlur={() =>
                      handleUpdateFolderName(folder.id, editingFolderName)
                    }
                  />
                  <button
                    onClick={() =>
                      handleUpdateFolderName(folder.id, editingFolderName)
                    }
                    className="p-0.5 rounded text-green-600 hover:text-green-800 hover:bg-green-100"
                    title="Confirm"
                  >
                    <IoCheckmark size={10} />
                  </button>
                  <button
                    onClick={handleCancelEditingFolderName}
                    className="p-0.5 rounded text-red-600 hover:text-red-800 hover:bg-red-100"
                    title="Cancel"
                  >
                    <IoClose size={10} />
                  </button>
                </div>
              ) : (
                <span className="text-sm font-medium">{folder.name}</span>
              )}
              <span className="ml-auto text-xs bg-gray-200 px-2 py-0.5 rounded-full">
                {templates.filter((t) => t.folderId === folder.id).length}
              </span>
            </div>
            {/* Templates in folder (when expanded) */}
            {expandedFolders[folder.id] && (
              <div className="ml-6 space-y-1">
                {templates
                  .filter((template) => template.folderId === folder.id)
                  .map((template) => (
                    <div
                      key={template.id}
                      className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                        selectedTemplateId === template.id
                          ? "bg-primary/10 text-primary"
                          : "hover:bg-gray-100"
                      }`}
                      onClick={() => selectTemplate(template.id)}
                      onContextMenu={(e) =>
                        handleContextMenu(e, "template", template)
                      }
                    >
                      <IoDocumentTextOutline size={14} />
                      <span className="text-sm truncate">{template.id}</span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        ))}
      </div>
    );
  });
  FolderTree.displayName = "FolderTree";
  // Context Menu Component
  const ContextMenu = React.memo(() => {
    if (!contextMenu.visible) return null;
    const { type, item } = contextMenu;
    // Calculate position to ensure menu stays within viewport
    const menuWidth = 200;
    const menuHeight =
      type === "template"
        ? 320
        : type === "folder"
          ? 160
          : type === "editor"
            ? 240
            : type === "preview"
              ? 200
              : type === "visualButton"
                ? 120
                : 80;
    const adjustedX =
      contextMenu.x + menuWidth > window.innerWidth
        ? window.innerWidth - menuWidth - 10
        : contextMenu.x;
    const adjustedY =
      contextMenu.y + menuHeight > window.innerHeight
        ? window.innerHeight - menuHeight - 10
        : contextMenu.y;
    return (
      <motion.div
        ref={contextMenuRef}
        className="fixed bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50"
        style={{ left: adjustedX, top: adjustedY }}
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.05 }} // Reduced duration for faster appearance
        onClick={(e) => e.stopPropagation()}
      >
        {type === "template" && (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("edit")}
            >
              <IoPencilOutline size={16} />
              Edit Template
            </button>
            {isEditingInContext === "name" ? (
              <div className="px-4 py-2">
                <input
                  type="text"
                  value={contextEditValue}
                  onChange={(e) => setContextEditValue(e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleContextMenuAction("saveEdit")}
                    className="flex-1 bg-green-500 text-white py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={closeContextMenu}
                    className="flex-1 bg-red-500 text-white py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("editName")}
              >
                <IoTextOutline size={16} />
                Edit Name
              </button>
            )}
            {isEditingInContext === "subject" ? (
              <div className="px-4 py-2">
                <input
                  type="text"
                  value={contextEditValue}
                  onChange={(e) => setContextEditValue(e.target.value)}
                  className="w-full p-1 border border-gray-300 rounded"
                  autoFocus
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={() => handleContextMenuAction("saveEdit")}
                    className="flex-1 bg-green-500 text-white py-1 rounded"
                  >
                    Save
                  </button>
                  <button
                    onClick={closeContextMenu}
                    className="flex-1 bg-red-500 text-white py-1 rounded"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("editSubject")}
              >
                <IoTextOutline size={16} />
                Edit Subject
              </button>
            )}
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("duplicate")}
            >
              <IoDuplicateOutline size={16} />
              Duplicate
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("moveToFolder")}
            >
              <IoMoveOutline size={16} />
              Move to Folder
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("viewHistory")}
            >
              <IoTimeOutline size={16} />
              View History
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("sortNewest")}
            >
              <IoTimeOutline size={16} />
              Sort Newest to Oldest
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("sortOldest")}
            >
              <IoTimeOutline size={16} />
              Sort Oldest to Newest
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="flex items-center gap-2 px-4 py-1">
              <span className="text-xs text-gray-500">Export as:</span>
            </div>
            <div className="flex gap-1 pl-4">
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("export")}
              >
                <IoDownloadOutline size={14} />
                HTML
              </button>
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("exportJson")}
              >
                <IoCode size={14} />
                JSON
              </button>
            </div>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => handleContextMenuAction("delete")}
            >
              <IoTrashOutline size={16} />
              Delete
            </button>
          </>
        )}
        {type === "folder" && (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("rename")}
            >
              <IoPencilOutline size={16} />
              Rename Folder
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("moveOutAll")}
            >
              <IoMoveOutline size={16} />
              Move Out All Templates
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("createInFolder")}
            >
              <IoCreateOutline size={16} />
              Create Template in Folder
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              onClick={() => handleContextMenuAction("delete")}
            >
              <IoTrashOutline size={16} />
              Delete Folder
            </button>
          </>
        )}
        {type === "empty" && (
          <button
            className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => handleContextMenuAction("createTemplate")}
          >
            <IoCreateOutline size={16} />
            Create New Template
          </button>
        )}
        {type === "editor" && (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("format")}
            >
              <IoCodeSlashOutline size={16} />
              Format Code
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("copy")}
            >
              <IoCopyOutline size={16} />
              Copy
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("paste")}
            >
              <IoSaveOutline size={16} />
              Paste
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("selectAll")}
            >
              <IoOptionsOutline size={16} />
              Select All
            </button>
            <div className="border-t border-gray-200 my-1"></div>
            <div className="flex items-center gap-2 px-4 py-1">
              <span className="text-xs text-gray-500">Edit actions:</span>
            </div>
            <div className="flex gap-1 pl-4">
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("undo")}
              >
                <IoRefreshOutline size={14} />
                Undo
              </button>
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("redo")}
              >
                <IoRefreshOutline
                  size={14}
                  className="transform scale-x-[-1]"
                />
                Redo
              </button>
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("find")}
              >
                <IoSearchOutline size={14} />
                Find
              </button>
              <button
                className="flex items-center gap-1 text-sm text-gray-700 hover:bg-gray-100"
                onClick={() => handleContextMenuAction("comment")}
              >
                <IoTextOutline size={14} />
                Comment
              </button>
            </div>
          </>
        )}
        {type === "preview" && (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("refresh")}
            >
              <IoRefreshOutline size={16} />
              Refresh Preview
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("openInNewTab")}
            >
              <IoExpand size={16} />
              Open in New Tab
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("print")}
            >
              <IoPrintOutline size={16} />
              Print
            </button>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("copyHtml")}
            >
              <IoCopyOutline size={16} />
              Copy HTML
            </button>
          </>
        )}
        {type === "visualButton" && (
          <>
            <button
              className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => handleContextMenuAction("saveAndCreate")}
            >
              <IoSave size={16} />
              Save & Create New
            </button>
          </>
        )}
      </motion.div>
    );
  });
  ContextMenu.displayName = "ContextMenu";
  // Email Editor handlers
  const onLoad = useCallback(() => {
    // Editor is loaded
    showToast("Email Editor loaded successfully", "success");
  }, [showToast]);
  const onReady = useCallback(() => {
    // Editor is ready
    if (emailEditorRef.current) {
      // Load template content if available
      if (editedContent) {
        try {
          // Try to parse as JSON first (for react-email-editor format)
          const design = JSON.parse(editedContent);
          emailEditorRef.current.editor.loadDesign(design);
        } catch (e) {
          // If parsing fails, load as HTML
          emailEditorRef.current.editor.loadBlank({
            html: editedContent,
          });
        }
      }
    }
  }, [editedContent]);
  const exportHtml = useCallback(() => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.exportHtml((data) => {
        const { design, html } = data;
        setEditedContent(html);
        setHasUnsavedChanges(true);
        showToast("Template exported successfully", "success");
      });
    }
  }, []);
  const saveDesign = useCallback(() => {
    if (emailEditorRef.current) {
      emailEditorRef.current.editor.saveDesign((design) => {
        setEditedContent(JSON.stringify(design));
        setHasUnsavedChanges(true);
        showToast("Design saved successfully", "success");
      });
    }
  }, []);
  return (
    <AdminProtectedRoutes>
      <ToastProvider>
        <SidebarWrapper>
          <div
            className="min-h-[150vh] bg-gray-50 text-gray-900"
            style={{ marginLeft: "0" }}
          >
            <div className="mx-auto">
              {/* Enhanced Header Section */}
              <div className="mb-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
                  <div>
                    <h1 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">
                      Best WW Email Templates
                    </h1>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={fetchTemplates}
                      disabled={loadingTemplates}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                      <IoRefreshOutline size={16} />
                      {loadingTemplates
                        ? "Loading Templates..."
                        : "Load Templates"}
                    </button>
                    <button
                      onClick={handleQuickPreview}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all text-sm"
                    >
                      <IoColorPaletteOutline size={16} />
                      Quick Preview
                    </button>
                    <button
                      onClick={() => setShowEmailModal(true)}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg flex items-center gap-2 hover:bg-gray-50 transition-all text-sm"
                    >
                      <IoMailOutline size={16} />
                      Manage Emails
                    </button>
                    <button
                      onClick={() => setShowClearHistoryModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700 transition-all text-sm"
                    >
                      <IoTrashOutline size={16} />
                      Clear All History
                    </button>
                    <button
                      onClick={() => setShowComposeModal(true)}
                      className="px-4 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition-all text-sm flex items-center gap-3"
                    >
                      <IoSparklesOutline size={16} />
                      Compose Email
                    </button>
                  </div>
                </div>
                {/* Redesigned Test Email Configuration */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-md border border-blue-200 mb-4">
                  <h3 className="text-lg font-bold text-indigo-800 mb-4 flex items-center gap-2">
                    <IoSendOutline
                      className="text-indigo-600 animate-pulse"
                      size={20}
                    />
                    Test Emails
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Recipient Name
                      </label>
                      <input
                        type="text"
                        value={testEmailName}
                        onChange={(e) => setTestEmailName(e.target.value)}
                        className="w-full p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        placeholder="Test Name"
                      />
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Test Email
                      </label>
                      <div className="flex items-center gap-1">
                        <select
                          value={selectedEmail}
                          onChange={(e) => setSelectedEmail(e.target.value)}
                          className="w-full p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                        >
                          {testEmails.map((email) => (
                            <option key={email} value={email}>
                              {email}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => setShowEmailModal(true)}
                          className="p-2 bg-indigo-100 text-indigo-600 rounded-md hover:bg-indigo-200"
                        >
                          <IoAddOutline size={12} />
                        </button>
                      </div>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Folder
                      </label>
                      <select
                        value={selectedTestFolder}
                        onChange={(e) => setSelectedTestFolder(e.target.value)}
                        className="w-full p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      >
                        <option value="all">All Folders</option>
                        {folders.map((folder) => (
                          <option key={folder.id} value={folder.id}>
                            {folder.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="bg-white p-3 rounded-lg shadow-sm border border-blue-100">
                      <label className="block text-xs font-semibold text-indigo-700 mb-1">
                        Template
                      </label>
                      <select
                        value={selectedTestTemplate}
                        onChange={(e) =>
                          setSelectedTestTemplate(e.target.value)
                        }
                        className="w-full p-2 text-sm border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                      >
                        {filteredTestTemplates.map((template) => (
                          <option key={template.id} value={template.id}>
                            {template.id}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={handleSendTestFromDropdown}
                        disabled={sendingTestEmail || !selectedTestTemplate}
                        className="w-full p-2 bg-sec2 hover:bg-primary text-white rounded-md transition disabled:opacity-50 flex items-center justify-center text-sm shadow-md"
                      >
                        {sendingTestEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <IoSendOutline className="mr-2" size={14} />
                            Send Test Email
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              {/* Main Content Area */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4">
                  {/* Folder and Search Section */}
                  <div className="flex flex-col lg:flex-row gap-3 mb-4">
                    <div className="flex-1 flex flex-col sm:flex-row gap-3">
                      {/* View Mode Toggle - Removed grid, only list */}
                      {/* Sort Options */}
                      <div className="flex items-center gap-2">
                        <select
                          value={sortBy}
                          onChange={(e) => setSortBy(e.target.value)}
                          className="px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm"
                        >
                          <option value="name">Sort by Name</option>
                          <option value="date">Sort by Date</option>
                          <option value="usage">Sort by Usage</option>
                        </select>
                        <button
                          onClick={() =>
                            setSortOrder(sortOrder === "asc" ? "desc" : "asc")
                          }
                          className="p-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          title={
                            sortOrder === "asc" ? "Ascending" : "Descending"
                          }
                        >
                          {sortOrder === "asc" ? "↑" : "↓"}
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowFindReplace(true)}
                        className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition flex items-center gap-2 text-sm"
                      >
                        <IoCodeSlashOutline size={14} />
                        Find & Replace
                      </button>
                      <button
                        onClick={handleStartCreating}
                        className="px-3 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition flex items-center gap-2 text-sm"
                      >
                        <IoAddOutline size={14} />
                        New Template
                      </button>
                    </div>
                  </div>
                  {/* Folder Tree and Template List */}
                  <div className="flex gap-4">
                    {/* Folder Tree */}
                    <div className="w-52 bg-gray-50 rounded-lg p-3">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-semibold text-gray-700">
                          Folders
                        </h3>
                        <button
                          onClick={() => setShowFolderModal(true)}
                          className="p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-200 transition"
                          title="New Folder"
                        >
                          <IoAddOutline size={14} />
                        </button>
                      </div>
                      <FolderTree />
                    </div>
                    {/* Template List or Editor */}
                    <div className="flex-1">
                      {isEditing || isCreating ? (
                        // Editor Area with SplitPane
                        <div
                          className={`rounded-lg border-2 ${
                            isDragging
                              ? "border-primary bg-primary/5"
                              : "border-gray-200"
                          } transition-all duration-300`}
                          onDragOver={handleDragOver}
                          onDragLeave={handleDragLeave}
                          onDrop={handleDrop}
                        >
                          {/* Editor Header */}
                          <div className="flex items-center justify-between p-3 bg-white border-b border-gray-200 rounded-t-lg">
                            <div className="flex items-center gap-3">
                              <h2 className="text-md font-semibold text-gray-900">
                                {isCreating ? (
                                  <div className="flex items-center gap-2">
                                    Creating New Template:
                                    <input
                                      type="text"
                                      value={newTemplateName}
                                      onChange={(e) =>
                                        setNewTemplateName(e.target.value)
                                      }
                                      className="ml-2 p-1 border border-primary rounded bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                      placeholder="Enter Template ID"
                                    />
                                  </div>
                                ) : (
                                  <>
                                    Editing:{" "}
                                    <span className="text-primary">
                                      {selectedTemplateId}
                                    </span>
                                  </>
                                )}
                              </h2>
                              <span className="text-xs text-gray-500 px-2 py-1 bg-gray-100 rounded">
                                {isCreating ? "Creating" : "Editing"}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Editor Type Toggle */}
                              <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                <button
                                  onClick={() => setUseAdvancedEditor(false)}
                                  className={`px-2 py-1 rounded text-sm ${
                                    !useAdvancedEditor
                                      ? "bg-white text-primary shadow-sm"
                                      : "text-gray-600"
                                  }`}
                                >
                                  Code
                                </button>
                                <button
                                  onClick={() => setUseAdvancedEditor(true)}
                                  className={`px-2 py-1 rounded text-sm ${
                                    useAdvancedEditor
                                      ? "bg-white text-primary shadow-sm"
                                      : "text-gray-600"
                                  }`}
                                  onContextMenu={(e) =>
                                    handleContextMenu(e, "visualButton", null)
                                  }
                                >
                                  Visual
                                </button>
                              </div>
                              {/* Enhanced Editor Controls */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setIsSplitView(!isSplitView)}
                                  className={`p-1.5 rounded-md border ${
                                    isSplitView
                                      ? "bg-primary text-white"
                                      : "bg-gray-100 text-gray-700"
                                  } hover:bg-primary/90 transition`}
                                  title={
                                    isSplitView
                                      ? "Hide Preview"
                                      : "Show Preview"
                                  }
                                >
                                  {isSplitView ? (
                                    <IoContract size={16} />
                                  ) : (
                                    <IoExpand size={16} />
                                  )}
                                </button>
                                {!useAdvancedEditor && (
                                  <button
                                    onClick={handleFormatCode}
                                    className="p-1.5 rounded-md border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                                    title="Format Code"
                                  >
                                    <IoCodeSlashOutline size={16} />
                                  </button>
                                )}
                                <button
                                  onClick={triggerFileInput}
                                  title="Upload HTML"
                                  className="p-1.5 rounded-md border bg-gray-100 text-gray-700 hover:bg-gray-200 transition flex items-center"
                                >
                                  <IoCloudUploadOutline size={16} />
                                </button>
                                <input
                                  type="file"
                                  ref={fileInputRef}
                                  onChange={handleFileInputChange}
                                  accept=".html"
                                  className="hidden"
                                />
                              </div>
                              <button
                                onClick={() =>
                                  setIsEditorFullscreen(!isEditorFullscreen)
                                }
                                title={
                                  isEditorFullscreen
                                    ? "Exit Fullscreen"
                                    : "Fullscreen Editor"
                                }
                                className="p-1.5 rounded-md border bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
                              >
                                {isEditorFullscreen ? (
                                  <IoClose size={16} />
                                ) : (
                                  <IoExpand size={16} />
                                )}
                              </button>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border text-sm"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSaveTemplate}
                                disabled={savingTemplate || addingTemplate}
                                className="px-3 py-1.5 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition disabled:opacity-50 flex items-center justify-center text-sm"
                              >
                                {savingTemplate || addingTemplate ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                    {isCreating ? "Creating..." : "Saving..."}
                                  </>
                                ) : isCreating ? (
                                  "Create Template"
                                ) : (
                                  "Save Changes"
                                )}
                              </button>
                            </div>
                          </div>
                          {/* Editor Content with SplitPane */}
                          <div
                            className="flex flex-col bg-gray-50 rounded-b-lg"
                            style={{ height: "750px" }}
                          >
                            <div className="p-3 border-b border-gray-200">
                              <label className="block text-sm font-medium mb-1 text-gray-700">
                                Subject
                              </label>
                              <input
                                type="text"
                                value={editedSubject}
                                onChange={(e) =>
                                  setEditedSubject(e.target.value)
                                }
                                className="w-full p-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition text-sm"
                                placeholder="Enter subject here..."
                              />
                            </div>
                            <div className="flex-1">
                              {isSplitView ? (
                                <SplitPane
                                  defaultSplit={splitPercentage}
                                  minSize={20}
                                  maxSize={80}
                                  left={
                                    <div
                                      className="h-full"
                                      onContextMenu={(e) =>
                                        handleContextMenu(e, "editor", null)
                                      }
                                    >
                                      {useAdvancedEditor ? (
                                        <div className="h-full flex flex-col">
                                          <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
                                            <h3 className="text-sm font-medium">
                                              Email Editor
                                            </h3>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={saveDesign}
                                                className="px-2 py-1 bg-primary text-white text-xs rounded"
                                              >
                                                Save Design
                                              </button>
                                              <button
                                                onClick={exportHtml}
                                                className="px-2 py-1 bg-secondary text-white text-xs rounded"
                                              >
                                                Export HTML
                                              </button>
                                            </div>
                                          </div>
                                          <div className="flex-1">
                                            <EmailEditor
                                              ref={emailEditorRef}
                                              onLoad={onLoad}
                                              onReady={onReady}
                                              options={{
                                                appearance: {
                                                  theme: "modern_light",
                                                  panels: {
                                                    tools: {
                                                      visible: true,
                                                    },
                                                  },
                                                },
                                                features: {
                                                  preview: true,
                                                  saveButton: false,
                                                },
                                                displayConditions: {
                                                  desktop: true,
                                                  tablet: false,
                                                  mobile: false,
                                                },
                                                editor: {
                                                  textColors: {
                                                    "#000000": "#000000",
                                                    "#FFFFFF": "#FFFFFF",
                                                    "#333333": "#333333",
                                                    "#666666": "#666666",
                                                    "#999999": "#999999",
                                                    "#CCCCCC": "#CCCCCC",
                                                    "#EEEEEE": "#EEEEEE",
                                                    "#F44336": "#F44336",
                                                    "#E91E63": "#E91E63",
                                                    "#9C27B0": "#9C27B0",
                                                    "#673AB7": "#673AB7",
                                                    "#3F51B5": "#3F51B5",
                                                    "#2196F3": "#2196F3",
                                                    "#0D47A1": "#0D47A1",
                                                    "#009688": "#009688",
                                                    "#4CAF50": "#4CAF50",
                                                    "#8BC34A": "#8BC34A",
                                                    "#CDDC39": "#CDDC39",
                                                    "#FFEB3B": "#FFEB3B",
                                                    "#FFC107": "#FFC107",
                                                    "#FF9800": "#FF9800",
                                                    "#FF5722": "#FF5722",
                                                    "#795548": "#795548",
                                                    "#9E9E9E": "#9E9E9E",
                                                    "#607D8B": "#607D8B",
                                                    "#3F51B5": "#3F51B5",
                                                    "#2196F3": "#2196F3",
                                                  },
                                                  fonts: {
                                                    Lato: [
                                                      {
                                                        name: "Lato",
                                                        url: "https://fonts.googleapis.com/css?family=Lato:300,400,500,700",
                                                        weights: [
                                                          300, 400, 500, 700,
                                                        ],
                                                      },
                                                    ],
                                                    "Open Sans": [
                                                      {
                                                        name: "Open Sans",
                                                        url: "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800",
                                                        weights: [
                                                          300, 400, 500, 600,
                                                          700, 800,
                                                        ],
                                                      },
                                                    ],
                                                    Roboto: [
                                                      {
                                                        name: "Roboto",
                                                        url: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900",
                                                        weights: [
                                                          300, 400, 500, 700,
                                                          900,
                                                        ],
                                                      },
                                                    ],
                                                    Montserrat: [
                                                      {
                                                        name: "Montserrat",
                                                        url: "https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700,800,900",
                                                        weights: [
                                                          300, 400, 500, 600,
                                                          700, 800, 900,
                                                        ],
                                                      },
                                                    ],
                                                  },
                                                },
                                              }}
                                            />
                                          </div>
                                        </div>
                                      ) : (
                                        <MonacoEditor
                                          height="100%"
                                          language="html"
                                          theme="vs-dark"
                                          value={editedContent}
                                          onChange={handleEditorChange}
                                          onMount={handleEditorDidMount}
                                          options={{
                                            minimap: { enabled: false }, // Disabled for performance
                                            scrollBeyondLastLine: false,
                                            automaticLayout: true,
                                            fontSize: 13,
                                            wordWrap: "on",
                                            wrappingIndent: "indent",
                                            lineNumbers: "on",
                                            folding: false, // Disabled for performance
                                            renderLineHighlight: "none",
                                            lineNumbersMinChars: 3,
                                            renderWhitespace: "none",
                                            largeFileOptimizations: true,
                                            scrollbar: {
                                              vertical: "visible",
                                              horizontal: "visible",
                                              useShadows: false,
                                            },
                                          }}
                                          loading={
                                            <div className="text-center py-4 text-gray-400">
                                              Loading editor...
                                            </div>
                                          }
                                        />
                                      )}
                                    </div>
                                  }
                                  right={
                                    <div className="h-full">
                                      <PreviewPanel content={editedContent} />
                                    </div>
                                  }
                                />
                              ) : (
                                <div
                                  className="h-full"
                                  onContextMenu={(e) =>
                                    handleContextMenu(e, "editor", null)
                                  }
                                >
                                  {useAdvancedEditor ? (
                                    <div className="h-full flex flex-col">
                                      <div className="flex items-center justify-between p-2 bg-gray-100 border-b">
                                        <h3 className="text-sm font-medium">
                                          Email Editor
                                        </h3>
                                        <div className="flex gap-2">
                                          <button
                                            onClick={saveDesign}
                                            className="px-2 py-1 bg-primary text-white text-xs rounded"
                                          >
                                            Save Design
                                          </button>
                                          <button
                                            onClick={exportHtml}
                                            className="px-2 py-1 bg-secondary text-white text-xs rounded"
                                          >
                                            Export HTML
                                          </button>
                                        </div>
                                      </div>
                                      <div className="flex-1">
                                        <EmailEditor
                                          ref={emailEditorRef}
                                          onLoad={onLoad}
                                          onReady={onReady}
                                          options={{
                                            appearance: {
                                              theme: "modern_light",
                                              panels: {
                                                tools: {
                                                  visible: true,
                                                },
                                              },
                                            },
                                            features: {
                                              preview: true,
                                              saveButton: false,
                                            },
                                            displayConditions: {
                                              desktop: true,
                                              tablet: false,
                                              mobile: false,
                                            },
                                            editor: {
                                              textColors: {
                                                "#000000": "#000000",
                                                "#FFFFFF": "#FFFFFF",
                                                "#333333": "#333333",
                                                "#666666": "#666666",
                                                "#999999": "#999999",
                                                "#CCCCCC": "#CCCCCC",
                                                "#EEEEEE": "#EEEEEE",
                                                "#F44336": "#F44336",
                                                "#E91E63": "#E91E63",
                                                "#9C27B0": "#9C27B0",
                                                "#673AB7": "#673AB7",
                                                "#3F51B5": "#3F51B5",
                                                "#2196F3": "#2196F3",
                                                "#0D47A1": "#0D47A1",
                                                "#009688": "#009688",
                                                "#4CAF50": "#4CAF50",
                                                "#8BC34A": "#8BC34A",
                                                "#CDDC39": "#CDDC39",
                                                "#FFEB3B": "#FFEB3B",
                                                "#FFC107": "#FFC107",
                                                "#FF9800": "#FF9800",
                                                "#FF5722": "#FF5722",
                                                "#795548": "#795548",
                                                "#9E9E9E": "#9E9E9E",
                                                "#607D8B": "#607D8B",
                                                "#3F51B5": "#3F51B5",
                                                "#2196F3": "#2196F3",
                                              },
                                              fonts: {
                                                Lato: [
                                                  {
                                                    name: "Lato",
                                                    url: "https://fonts.googleapis.com/css?family=Lato:300,400,500,700",
                                                    weights: [
                                                      300, 400, 500, 700,
                                                    ],
                                                  },
                                                ],
                                                "Open Sans": [
                                                  {
                                                    name: "Open Sans",
                                                    url: "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800",
                                                    weights: [
                                                      300, 400, 500, 600, 700,
                                                      800,
                                                    ],
                                                  },
                                                ],
                                                Roboto: [
                                                  {
                                                    name: "Roboto",
                                                    url: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900",
                                                    weights: [
                                                      300, 400, 500, 700, 900,
                                                    ],
                                                  },
                                                ],
                                                Montserrat: [
                                                  {
                                                    name: "Montserrat",
                                                    url: "https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700,800,900",
                                                    weights: [
                                                      300, 400, 500, 600, 700,
                                                      800, 900,
                                                    ],
                                                  },
                                                ],
                                              },
                                            },
                                          }}
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <MonacoEditor
                                      height="100%"
                                      language="html"
                                      theme="vs-dark"
                                      value={editedContent}
                                      onChange={handleEditorChange}
                                      onMount={handleEditorDidMount}
                                      options={{
                                        minimap: { enabled: false }, // Disabled for performance
                                        scrollBeyondLastLine: false,
                                        automaticLayout: true,
                                        fontSize: 13,
                                        wordWrap: "on",
                                        wrappingIndent: "indent",
                                        lineNumbers: "on",
                                        folding: false, // Disabled for performance
                                        renderLineHighlight: "none",
                                        lineNumbersMinChars: 3,
                                        renderWhitespace: "none",
                                        largeFileOptimizations: true,
                                        scrollbar: {
                                          vertical: "visible",
                                          horizontal: "visible",
                                          useShadows: false,
                                        },
                                      }}
                                      loading={
                                        <div className="text-center py-4 text-gray-400">
                                          Loading editor...
                                        </div>
                                      }
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ) : (
                        // Template List
                        <div
                          ref={templateListRef}
                          className="h-full"
                          onContextMenu={(e) =>
                            handleContextMenu(e, "empty", null)
                          }
                        >
                          <div className="mb-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-gray-700">
                                Templates ({filteredTemplates.length})
                              </h3>
                            </div>
                            {loadingTemplates ? (
                              <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                                <p className="text-gray-600 mt-2">
                                  Loading templates...
                                </p>
                              </div>
                            ) : filteredTemplates.length === 0 ? (
                              <div className="text-center py-8 text-gray-500">
                                <IoDocumentTextOutline
                                  className="mx-auto text-gray-400 mb-2"
                                  size={32}
                                />
                                {searchQuery
                                  ? "No templates found"
                                  : "No templates loaded yet. Click 'Load Templates' to fetch."}
                              </div>
                            ) : (
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="border-b border-gray-200">
                                      <th className="text-left py-2 px-3">
                                        Name
                                      </th>
                                      <th className="text-left py-2 px-3">
                                        Subject
                                      </th>
                                      <th className="text-left py-2 px-3">
                                        Folder
                                      </th>
                                      <th className="text-left py-2 px-3">
                                        Created
                                      </th>
                                      <th className="text-left py-2 px-3">
                                        Actions
                                      </th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {filteredTemplates.map((template) => (
                                      <tr
                                        key={template.id}
                                        className="border-b border-gray-100 hover:bg-gray-50"
                                        onContextMenu={(e) =>
                                          handleContextMenu(
                                            e,
                                            "template",
                                            template
                                          )
                                        }
                                      >
                                        <td className="py-2 px-3 font-medium">
                                          {editingTemplateId === template.id ? (
                                            <div className="flex items-center gap-1">
                                              <input
                                                type="text"
                                                value={editingTemplateName}
                                                onChange={(e) =>
                                                  setEditingTemplateName(
                                                    e.target.value
                                                  )
                                                }
                                                className="p-1 border border-primary rounded"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter") {
                                                    handleConfirmTemplateNameChange(
                                                      template.id
                                                    );
                                                  } else if (
                                                    e.key === "Escape"
                                                  ) {
                                                    handleCancelEditingTemplateName();
                                                  }
                                                }}
                                                onBlur={() =>
                                                  handleConfirmTemplateNameChange(
                                                    template.id
                                                  )
                                                }
                                              />
                                            </div>
                                          ) : (
                                            <div className="flex items-center gap-1">
                                              {template.id}
                                              <button
                                                onClick={() =>
                                                  handleStartEditingTemplateName(
                                                    template.id
                                                  )
                                                }
                                                className="p-0.5 text-gray-400 hover:text-gray-600"
                                              >
                                                <IoPencilOutline size={10} />
                                              </button>
                                            </div>
                                          )}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600 truncate max-w-xs">
                                          {template.subject || "No Subject"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-600">
                                          {template.folderId
                                            ? folders.find(
                                                (f) =>
                                                  f.id === template.folderId
                                              )?.name
                                            : "None"}
                                        </td>
                                        <td className="py-2 px-3 text-gray-500 text-xs">
                                          {template.createdAt
                                            ?.toDate?.()
                                            .toLocaleDateString() || "Unknown"}
                                        </td>
                                        <td className="py-2 px-3">
                                          <div className="flex items-center gap-1">
                                            <button
                                              onClick={() =>
                                                selectTemplate(template.id)
                                              }
                                              className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                                              title="Edit"
                                            >
                                              <IoPencilOutline size={12} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handlePreviewTemplate(
                                                  template.id
                                                )
                                              }
                                              className="p-1 rounded bg-gray-100 text-gray-600 hover:bg-gray-200"
                                              title="Preview"
                                            >
                                              <IoEyeOutline size={12} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleOpenHistoryModal(
                                                  template.id
                                                )
                                              }
                                              className="p-1 rounded bg-purple-100 text-purple-600 hover:bg-purple-200"
                                              title="History"
                                            >
                                              <IoTimeOutline size={12} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleDuplicateTemplate(
                                                  template.id
                                                )
                                              }
                                              className="p-1 rounded bg-purple-100 text-purple-600 hover:bg-purple-200"
                                              title="Duplicate"
                                            >
                                              <IoDuplicateOutline size={12} />
                                            </button>
                                            <button
                                              onClick={() =>
                                                handleSendTestEmail(template.id)
                                              }
                                              disabled={sendingTestEmail}
                                              className="p-1 rounded bg-primary text-white hover:bg-primary/90 disabled:opacity-50"
                                              title="Test"
                                            >
                                              <IoSendOutline size={12} />
                                            </button>
                                            <select
                                              value={
                                                template.folderId || "none"
                                              }
                                              onChange={(e) =>
                                                handleMoveToFolder(
                                                  template.id,
                                                  e.target.value
                                                )
                                              }
                                              disabled={
                                                movingTemplate === template.id
                                              }
                                              className="p-1 text-xs border border-gray-300 rounded"
                                            >
                                              <option value="none">Move</option>
                                              {folders.map((folder) => (
                                                <option
                                                  key={folder.id}
                                                  value={folder.id}
                                                >
                                                  {folder.name}
                                                </option>
                                              ))}
                                            </select>
                                            <button
                                              onClick={() =>
                                                handleDeleteTemplate(
                                                  template.id
                                                )
                                              }
                                              className="p-1 rounded bg-red-100 text-red-600 hover:bg-red-200"
                                              title="Delete"
                                            >
                                              <IoTrashOutline size={12} />
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Template Generator View - Full Width */}
            <AnimatePresence>
              {showGeneratorView && (
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed inset-0 bg-white z-40 overflow-hidden"
                >
                  <div className="h-full flex flex-col">
                    <div className="flex items-center justify-between p-4 border-b border-gray-200">
                      <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoCreateOutline className="text-purple-600" />
                        Template Generator
                      </h2>
                      <button
                        onClick={() => setShowGeneratorView(false)}
                        className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-auto p-6">
                      <div className="max-w-full">
                        <div className="mb-6">
                          <h3 className="text-lg font-medium text-gray-900 mb-3">
                            Create a New Template
                          </h3>
                          <p className="text-gray-600 mb-4">
                            Use our visual template editor to create beautiful
                            email templates with ease.
                          </p>
                        </div>
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Template Name
                            </label>
                            <input
                              type="text"
                              value={newTemplateName}
                              onChange={(e) =>
                                setNewTemplateName(e.target.value)
                              }
                              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Enter template name"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Subject
                            </label>
                            <input
                              type="text"
                              value={editedSubject}
                              onChange={(e) => setEditedSubject(e.target.value)}
                              className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                              placeholder="Enter email subject"
                            />
                          </div>
                          <div className="mb-4">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Start with a template (optional)
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <button
                                onClick={() => {
                                  setEditedContent("");
                                  setEditedSubject("");
                                }}
                                className="p-3 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition"
                              >
                                <div className="text-center">
                                  <div className="text-2xl mb-2">📝</div>
                                  <div className="text-sm font-medium">
                                    Blank Template
                                  </div>
                                </div>
                              </button>
                              {preBuiltTemplates.map((template, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setEditedContent(template.content);
                                    setEditedSubject(template.subject);
                                  }}
                                  className="p-3 border border-gray-300 rounded-lg hover:border-primary hover:bg-primary/5 transition"
                                >
                                  <div className="text-center">
                                    <div className="text-2xl mb-2">📧</div>
                                    <div className="text-sm font-medium">
                                      {template.name}
                                    </div>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                          <div className="mb-6">
                            <label className="block text-sm font-medium mb-2 text-gray-700">
                              Template Content
                            </label>
                            <div
                              className="border border-gray-300 rounded-lg overflow-hidden"
                              style={{ height: "500px" }}
                            >
                              <EmailEditor
                                ref={emailEditorRef}
                                onLoad={onLoad}
                                onReady={onReady}
                                options={{
                                  appearance: {
                                    theme: "modern_light",
                                    panels: {
                                      tools: {
                                        visible: true,
                                      },
                                    },
                                  },
                                  features: {
                                    preview: true,
                                    saveButton: false,
                                  },
                                  displayConditions: {
                                    desktop: true,
                                    tablet: false,
                                    mobile: false,
                                  },
                                  editor: {
                                    textColors: {
                                      "#000000": "#000000",
                                      "#FFFFFF": "#FFFFFF",
                                      "#333333": "#333333",
                                      "#666666": "#666666",
                                      "#999999": "#999999",
                                      "#CCCCCC": "#CCCCCC",
                                      "#EEEEEE": "#EEEEEE",
                                      "#F44336": "#F44336",
                                      "#E91E63": "#E91E63",
                                      "#9C27B0": "#9C27B0",
                                      "#673AB7": "#673AB7",
                                      "#3F51B5": "#3F51B5",
                                      "#2196F3": "#2196F3",
                                      "#0D47A1": "#0D47A1",
                                      "#009688": "#009688",
                                      "#4CAF50": "#4CAF50",
                                      "#8BC34A": "#8BC34A",
                                      "#CDDC39": "#CDDC39",
                                      "#FFEB3B": "#FFEB3B",
                                      "#FFC107": "#FFC107",
                                      "#FF9800": "#FF9800",
                                      "#FF5722": "#FF5722",
                                      "#795548": "#795548",
                                      "#9E9E9E": "#9E9E9E",
                                      "#607D8B": "#607D8B",
                                      "#3F51B5": "#3F51B5",
                                      "#2196F3": "#2196F3",
                                    },
                                    fonts: {
                                      Lato: [
                                        {
                                          name: "Lato",
                                          url: "https://fonts.googleapis.com/css?family=Lato:300,400,500,700",
                                          weights: [300, 400, 500, 700],
                                        },
                                      ],
                                      "Open Sans": [
                                        {
                                          name: "Open Sans",
                                          url: "https://fonts.googleapis.com/css?family=Open+Sans:300,400,500,600,700,800",
                                          weights: [
                                            300, 400, 500, 600, 700, 800,
                                          ],
                                        },
                                      ],
                                      Roboto: [
                                        {
                                          name: "Roboto",
                                          url: "https://fonts.googleapis.com/css?family=Roboto:300,400,500,700,900",
                                          weights: [300, 400, 500, 700, 900],
                                        },
                                      ],
                                      Montserrat: [
                                        {
                                          name: "Montserrat",
                                          url: "https://fonts.googleapis.com/css?family=Montserrat:300,400,500,600,700,800,900",
                                          weights: [
                                            300, 400, 500, 600, 700, 800, 900,
                                          ],
                                        },
                                      ],
                                    },
                                  },
                                }}
                              />
                            </div>
                          </div>
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => {
                                setShowGeneratorView(false);
                                setNewTemplateName("");
                                setEditedSubject("");
                                setEditedContent("");
                              }}
                              className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => {
                                if (!newTemplateName.trim()) {
                                  showToast(
                                    "Template name is required",
                                    "warning"
                                  );
                                  return;
                                }
                                // Export HTML from the editor
                                if (emailEditorRef.current) {
                                  emailEditorRef.current.editor.exportHtml(
                                    (data) => {
                                      const { html } = data;
                                      setEditedContent(html);
                                      // Create the template
                                      setAddingTemplate(true);
                                      setDoc(
                                        doc(
                                          firestore,
                                          "email_templates",
                                          newTemplateName.trim()
                                        ),
                                        {
                                          template: html,
                                          subject:
                                            editedSubject || "No Subject",
                                          createdAt: serverTimestamp(),
                                          folderId:
                                            selectedFolder !== "all"
                                              ? selectedFolder
                                              : null,
                                        }
                                      )
                                        .then(() => {
                                          fetchTemplates();
                                          showToast(
                                            "Template created successfully!",
                                            "success"
                                          );
                                          setShowGeneratorView(false);
                                          setNewTemplateName("");
                                          setEditedSubject("");
                                          setEditedContent("");
                                        })
                                        .catch((error) => {
                                          console.error(
                                            "Error creating template:",
                                            error
                                          );
                                          showToast(
                                            "Failed to create template",
                                            "error"
                                          );
                                        })
                                        .finally(() => {
                                          setAddingTemplate(false);
                                        });
                                    }
                                  );
                                }
                              }}
                              disabled={addingTemplate}
                              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-lg hover:from-purple-700 hover:to-purple-800 transition disabled:opacity-50 flex items-center gap-2"
                            >
                              {addingTemplate ? (
                                <>
                                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                  Creating...
                                </>
                              ) : (
                                "Create Template"
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Quick Preview Modal */}
            <AnimatePresence>
              {showQuickPreviewModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoColorPaletteOutline className="text-primary" />
                        Quick Preview
                      </h3>
                      <button
                        onClick={() => setShowQuickPreviewModal(false)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={previewSubject}
                          onChange={(e) => setPreviewSubject(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                          placeholder="Enter preview subject"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Content (HTML)
                        </label>
                        <textarea
                          value={previewContent}
                          onChange={(e) => setPreviewContent(e.target.value)}
                          className="w-full h-64 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm transition resize-none"
                          placeholder="Enter your HTML email content here..."
                        />
                      </div>
                      <div className="border-t border-gray-200 pt-4">
                        <div className="flex justify-between items-center mb-2">
                          <h4 className="text-sm font-medium text-gray-700">
                            Preview
                          </h4>
                          <div className="flex gap-2">
                            <button
                              onClick={() => setPreviewDevice("desktop")}
                              className={`p-1 rounded ${
                                previewDevice === "desktop"
                                  ? "bg-primary text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                              title="Desktop View"
                            >
                              <IoDesktop size={14} />
                            </button>
                          </div>
                        </div>
                        <div
                          className="border border-gray-200 rounded-lg overflow-auto bg-gray-100 p-4"
                          style={{ height: "300px" }}
                        >
                          <div className="flex justify-center">
                            <div
                              className="bg-white shadow-lg"
                              style={{
                                width: "100%",
                                maxWidth: "100%",
                              }}
                            >
                              <div
                                dangerouslySetInnerHTML={{
                                  __html: previewContent,
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setPreviewContent("");
                          setPreviewSubject("");
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handlePreviewTemplateContent}
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition flex items-center gap-2"
                      >
                        <IoEyeOutline size={16} />
                        Open in New Window
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Enhanced History Modal with Search and Clear Options */}
            <AnimatePresence>
              {showHistoryModal && selectedHistoryTemplate && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-6xl w-full h-[90vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                          <IoTimeOutline className="text-primary" />
                          Template Version History - {selectedHistoryTemplate}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {templateHistory[selectedHistoryTemplate]?.length ||
                            0}{" "}
                          versions found
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            clearTemplateHistory(selectedHistoryTemplate)
                          }
                          disabled={
                            clearingHistory ||
                            !templateHistory[selectedHistoryTemplate]?.length
                          }
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                          {clearingHistory ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Clearing...
                            </>
                          ) : (
                            <>
                              <IoTrashOutline size={16} />
                              Clear History
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => {
                            setShowHistoryModal(false);
                            setSelectedHistoryTemplate(null);
                            setHistorySearchQuery("");
                          }}
                          className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                        >
                          <IoClose size={24} />
                        </button>
                      </div>
                    </div>
                    {/* History Search */}
                    <div className="mb-4">
                      <div className="relative">
                        <IoSearchOutline
                          className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Search in history..."
                          value={historySearchQuery}
                          onChange={(e) =>
                            setHistorySearchQuery(e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                      {loadingHistory ? (
                        <div className="text-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                          <p className="text-gray-600 mt-2">
                            Loading history...
                          </p>
                        </div>
                      ) : filteredHistory.length > 0 ? (
                        <div className="space-y-4">
                          {filteredHistory.map((version, index) => (
                            <div
                              key={version.id}
                              className="p-4 border border-gray-200 rounded-lg hover:border-primary/30 transition"
                            >
                              <div className="flex justify-between items-start mb-3">
                                <div>
                                  <h4 className="font-semibold text-gray-900">
                                    Version{" "}
                                    {version.versionNumber ||
                                      filteredHistory.length - index}
                                  </h4>
                                  <p className="text-sm text-gray-600">
                                    {version.versionCreatedAt
                                      ?.toDate?.()
                                      .toLocaleString() || "Unknown date"}
                                  </p>
                                  {version.changeReason && (
                                    <p className="text-sm text-gray-500 mt-1">
                                      <strong>Reason:</strong>{" "}
                                      {version.changeReason}
                                    </p>
                                  )}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => {
                                      const previewWindow = window.open(
                                        "",
                                        "_blank",
                                        "width=800,height=600"
                                      );
                                      if (previewWindow) {
                                        previewWindow.document.write(
                                          version.template
                                        );
                                        previewWindow.document.close();
                                      }
                                    }}
                                    className="px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition text-sm flex items-center gap-1"
                                  >
                                    <IoEyeOutline size={14} />
                                    Preview
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleRestoreVersion(
                                        selectedHistoryTemplate,
                                        version
                                      )
                                    }
                                    className="px-3 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm"
                                  >
                                    Restore This Version
                                  </button>
                                </div>
                              </div>
                              <div className="text-sm text-gray-700">
                                <p>
                                  <strong>Subject:</strong> {version.subject}
                                </p>
                                <p className="mt-2">
                                  <strong>Content Preview:</strong>
                                </p>
                                <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-x-auto">
                                  {version.template.substring(0, 200)}...
                                </pre>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <IoTimeOutline
                            className="mx-auto text-gray-400 mb-2"
                            size={48}
                          />
                          <p>
                            {historySearchQuery
                              ? "No versions match your search"
                              : "No version history available for this template."}
                          </p>
                          {!historySearchQuery && (
                            <button
                              onClick={() =>
                                fetchTemplateHistory(selectedHistoryTemplate)
                              }
                              className="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition text-sm"
                            >
                              Load History
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Clear All History Confirmation Modal */}
            <AnimatePresence>
              {showClearHistoryModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoAlertCircleOutline className="text-red-500" />
                        Clear All Version History
                      </h3>
                      <button
                        onClick={() => setShowClearHistoryModal(false)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 font-medium mb-2">
                          ⚠️ This action cannot be undone!
                        </p>
                        <p className="text-red-700 text-sm">
                          This will permanently delete all version history for
                          every template. This includes all previous versions,
                          change reasons, and timestamps.
                        </p>
                      </div>
                      <p className="text-gray-600">
                        Are you sure you want to clear all version history? This
                        action will affect all templates and cannot be reversed.
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowClearHistoryModal(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={clearAllHistory}
                          disabled={clearingHistory}
                          className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center gap-2"
                        >
                          {clearingHistory ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              Clearing All History...
                            </>
                          ) : (
                            "Clear All History"
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Unsaved Changes Modal */}
            <AnimatePresence>
              {showUnsavedChangesModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoWarningOutline className="text-yellow-500" />
                        Unsaved Changes
                      </h3>
                      <button
                        onClick={() => setShowUnsavedChangesModal(false)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <p className="text-yellow-800 font-medium mb-2">
                          ⚠️ You have unsaved changes
                        </p>
                        <p className="text-yellow-700 text-sm">
                          Do you want to save your changes before switching
                          templates?
                        </p>
                      </div>
                      <p className="text-gray-600">
                        Select an option to continue:
                      </p>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={handleDiscardChanges}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Discard Changes
                        </button>
                        <button
                          onClick={handleApplyChanges}
                          className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition"
                        >
                          Save Changes
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Folder Creation Modal */}
            <AnimatePresence>
              {showFolderModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoFolderOutline className="text-primary" />
                        Create New Folder
                      </h3>
                      <button
                        onClick={() => setShowFolderModal(false)}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Folder Name
                        </label>
                        <input
                          type="text"
                          value={newFolderName}
                          onChange={(e) => setNewFolderName(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                          placeholder="Enter folder name"
                        />
                      </div>
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => setShowFolderModal(false)}
                          className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleCreateFolder}
                          className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition flex items-center gap-2"
                        >
                          <IoFolderOutline size={18} />
                          Create Folder
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Enhanced Find & Replace Modal */}
            <AnimatePresence>
              {showFindReplace && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoCodeSlashOutline className="text-primary" />
                        Advanced Find & Replace
                      </h3>
                      <button
                        onClick={() => {
                          setShowFindReplace(false);
                          setFindText("");
                          setReplaceText("");
                          setSearchResults([]);
                          setBulkSearchWords("");
                          setBulkSearchResults([]);
                        }}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    {/* Tab Navigation */}
                    <div className="flex border-b border-gray-200 mb-6">
                      <button
                        onClick={() => setActiveTab("single")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                          activeTab === "single"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Single Search
                      </button>
                      <button
                        onClick={() => setActiveTab("bulk")}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition ${
                          activeTab === "bulk"
                            ? "border-primary text-primary"
                            : "border-transparent text-gray-500 hover:text-gray-700"
                        }`}
                      >
                        Bulk Word Search
                      </button>
                    </div>
                    <div className="space-y-4">
                      {/* Search Options */}
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="text-sm font-medium mb-3 text-gray-700">
                          Search Options
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="caseSensitive"
                              checked={findReplaceOptions.caseSensitive}
                              onChange={(e) =>
                                setFindReplaceOptions({
                                  ...findReplaceOptions,
                                  caseSensitive: e.target.checked,
                                })
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="caseSensitive"
                              className="text-sm text-gray-700"
                            >
                              Case Sensitive
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="wholeWord"
                              checked={findReplaceOptions.wholeWord}
                              onChange={(e) =>
                                setFindReplaceOptions({
                                  ...findReplaceOptions,
                                  wholeWord: e.target.checked,
                                })
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="wholeWord"
                              className="text-sm text-gray-700"
                            >
                              Whole Word
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="useRegex"
                              checked={findReplaceOptions.useRegex}
                              onChange={(e) =>
                                setFindReplaceOptions({
                                  ...findReplaceOptions,
                                  useRegex: e.target.checked,
                                })
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="useRegex"
                              className="text-sm text-gray-700"
                            >
                              Use Regular Expression
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="searchInSubject"
                              checked={findReplaceOptions.searchInSubject}
                              onChange={(e) =>
                                setFindReplaceOptions({
                                  ...findReplaceOptions,
                                  searchInSubject: e.target.checked,
                                })
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="searchInSubject"
                              className="text-sm text-gray-700"
                            >
                              Search in Subject
                            </label>
                          </div>
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id="searchInContent"
                              checked={findReplaceOptions.searchInContent}
                              onChange={(e) =>
                                setFindReplaceOptions({
                                  ...findReplaceOptions,
                                  searchInContent: e.target.checked,
                                })
                              }
                              className="rounded text-primary focus:ring-primary"
                            />
                            <label
                              htmlFor="searchInContent"
                              className="text-sm text-gray-700"
                            >
                              Search in Content
                            </label>
                          </div>
                        </div>
                      </div>
                      {/* Folder Selection */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Search In Folder
                        </label>
                        <select
                          value={selectedSearchFolder}
                          onChange={(e) =>
                            setSelectedSearchFolder(e.target.value)
                          }
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                        >
                          <option value="all">All Folders</option>
                          {folders.map((folder) => (
                            <option key={folder.id} value={folder.id}>
                              {folder.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      {activeTab === "single" ? (
                        /* Single Search Tab */
                        <>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium mb-2 text-gray-700">
                                Find
                              </label>
                              <input
                                type="text"
                                value={findText}
                                onChange={(e) =>
                                  handleFindTextChange(e.target.value)
                                }
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                                placeholder="Text to find"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium mb-2 text-gray-700">
                                Replace With
                              </label>
                              <input
                                type="text"
                                value={replaceText}
                                onChange={(e) => setReplaceText(e.target.value)}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                                placeholder="Replacement text"
                              />
                            </div>
                          </div>
                          {/* Live Search Results */}
                          {findText && (
                            <div className="border border-gray-200 rounded-lg p-4">
                              <h4 className="text-sm font-medium mb-3 text-gray-700">
                                Found in {searchResults.length} template(s):
                              </h4>
                              <div className="max-h-48 overflow-y-auto space-y-2">
                                {searchResults.map((result) => (
                                  <div
                                    key={result.id}
                                    className="flex items-center justify-between p-2 bg-gray-50 rounded"
                                  >
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {result.name}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {result.matches.template} in content,{" "}
                                        {result.matches.subject} in subject
                                      </p>
                                    </div>
                                    <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                      {result.matches.template +
                                        result.matches.subject}{" "}
                                      matches
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Bulk Word Search Tab */
                        <>
                          <div className="space-y-4">
                            <div>
                              <div className="flex justify-between items-center mb-2">
                                <label className="block text-sm font-medium text-gray-700">
                                  Words to Search (JSON array, comma-separated,
                                  or line-separated)
                                </label>
                                <button className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded transition">
                                  Load Words
                                </button>
                              </div>
                              <textarea
                                value={bulkSearchWords}
                                onChange={(e) =>
                                  setBulkSearchWords(e.target.value)
                                }
                                rows={6}
                                className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition font-mono text-sm"
                                placeholder={JSON.stringify(null, 2)}
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={handleBulkWordSearch}
                                disabled={!bulkSearchWords.trim()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 flex items-center gap-2"
                              >
                                <IoSearchOutline size={16} />
                                Search Words
                              </button>
                              <button
                                onClick={() => setBulkSearchWords("")}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                              >
                                Clear
                              </button>
                            </div>
                            {/* Bulk Search Results */}
                            {bulkSearchResults.length > 0 && (
                              <div className="border border-gray-200 rounded-lg p-4">
                                <div className="flex justify-between items-center mb-3">
                                  <h4 className="text-sm font-medium text-gray-700">
                                    Found in {bulkSearchResults.length}{" "}
                                    template(s)
                                  </h4>
                                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                    Total matches:{" "}
                                    {bulkSearchResults.reduce(
                                      (sum, result) =>
                                        sum + result.totalMatches,
                                      0
                                    )}
                                  </span>
                                </div>
                                <div className="max-h-96 overflow-y-auto space-y-3">
                                  {bulkSearchResults.map((result) => (
                                    <div
                                      key={result.id}
                                      className="p-3 bg-gray-50 rounded-lg border"
                                    >
                                      <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-medium text-gray-900">
                                            {result.name}
                                          </p>
                                          <p className="text-xs text-gray-600">
                                            Subject: {result.subject}
                                          </p>
                                        </div>
                                        <span className="text-xs bg-primary text-white px-2 py-1 rounded-full">
                                          {result.totalMatches} total
                                        </span>
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {result.foundWords.map(
                                          (wordResult, idx) => (
                                            <span
                                              key={idx}
                                              className="inline-flex items-center gap-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded"
                                              title={`Content: ${wordResult.contentMatches}, Subject: ${wordResult.subjectMatches}`}
                                            >
                                              {wordResult.word}
                                              <span className="bg-orange-200 text-orange-900 px-1 rounded text-xs">
                                                {wordResult.count}
                                              </span>
                                            </span>
                                          )
                                        )}
                                      </div>
                                      <div className="flex gap-4 mt-2 text-xs text-gray-500">
                                        <span>
                                          Content: {result.contentMatches}
                                        </span>
                                        <span>
                                          Subject: {result.subjectMatches}
                                        </span>
                                        <span>
                                          Words: {result.foundWords.length}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                      {/* Replace Options */}
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="replaceAll"
                          checked={isReplacingAll}
                          onChange={(e) => setIsReplacingAll(e.target.checked)}
                          className="rounded text-primary focus:ring-primary"
                        />
                        <label
                          htmlFor="replaceAll"
                          className="text-sm text-gray-700"
                        >
                          {activeTab === "single"
                            ? "Replace all occurrences in matched templates"
                            : "Replace all found words with replacement text"}
                        </label>
                      </div>
                      {/* Action Buttons */}
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {activeTab === "single"
                            ? `${searchResults.length} templates found`
                            : `${bulkSearchResults.length} templates with matches`}
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => {
                              setShowFindReplace(false);
                              setFindText("");
                              setReplaceText("");
                              setSearchResults([]);
                              setBulkSearchWords("");
                              setBulkSearchResults([]);
                            }}
                            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleFindReplace}
                            disabled={
                              activeTab === "single"
                                ? !findText || searchResults.length === 0
                                : bulkSearchResults.length === 0 || !replaceText
                            }
                            className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition disabled:opacity-50 flex items-center gap-2"
                          >
                            <IoRefreshOutline size={18} />
                            {activeTab === "single"
                              ? `Replace in ${searchResults.length} Templates`
                              : `Bulk Replace in ${bulkSearchResults.length} Templates`}
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Delete Confirmation Modal */}
            {showConfirmModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <IoAlertCircleOutline className="text-red-500" />
                    Confirm Deletion
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Are you sure you want to delete "
                    <span className="font-semibold text-gray-900">
                      {templateToDeleteId}
                    </span>
                    "? This action cannot be undone.
                  </p>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => {
                        setShowConfirmModal(false);
                        setTemplateToDeleteId(null);
                        showToast("Template deletion cancelled.", "info");
                      }}
                      className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition border border-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteTemplate}
                      disabled={deletingTemplate}
                      className="px-6 py-2 bg-gradient-to-r from-red-600 to-pink-600 text-white rounded-lg hover:from-red-700 hover:to-pink-700 transition disabled:opacity-50 flex items-center justify-center"
                    >
                      {deletingTemplate ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Deleting...
                        </>
                      ) : (
                        "Delete Permanently"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            {/* Email Management Modal */}
            {showEmailModal && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div
                  ref={emailModalRef}
                  className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                      <IoMailOutline className="text-primary" />
                      Manage Test Emails
                    </h3>
                    <button
                      onClick={() => setShowEmailModal(false)}
                      className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                    >
                      <IoClose size={24} />
                    </button>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2 text-gray-700">
                      Add New Email
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="email"
                        value={newEmailInput}
                        onChange={(e) => setNewEmailInput(e.target.value)}
                        placeholder="Enter email address"
                        className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none transition"
                        autoFocus
                      />
                      <button
                        onClick={handleAddNewEmail}
                        className="px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition flex items-center"
                      >
                        <IoAddOutline size={18} />
                      </button>
                    </div>
                    {emailErrors.newEmail && (
                      <p className="text-red-600 text-sm mt-1">
                        {emailErrors.newEmail}
                      </p>
                    )}
                  </div>
                  <div>
                    <h4 className="text-sm font-medium mb-2 text-gray-700">
                      Saved Emails ({testEmails.length})
                    </h4>
                    <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-200">
                      {testEmails.map((email) => (
                        <div
                          key={email}
                          className="p-3 flex justify-between items-center hover:bg-gray-50 transition"
                        >
                          <span className="text-gray-900">{email}</span>
                          {email === selectedEmail && (
                            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
                              Selected
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Compose Email Modal */}
            <AnimatePresence>
              {showComposeModal && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
                >
                  <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -50, opacity: 0 }}
                    className="bg-white p-6 rounded-xl shadow-2xl max-w-4xl w-full h-[90vh] flex flex-col"
                  >
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                        <IoSparklesOutline className="text-primary" />
                        Compose Email
                      </h3>
                      <button
                        onClick={() => {
                          setShowComposeModal(false);
                          setComposeSubject("");
                          setComposeContent("");
                          setComposeRecipients([]);
                          setComposePlaceholders("");
                        }}
                        className="text-gray-500 hover:text-gray-700 p-2 rounded-full hover:bg-gray-100 transition"
                      >
                        <IoClose size={24} />
                      </button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-4">
                      {/* Recipients Section */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          To (Recipients)
                        </label>
                        {/* Selected Recipients */}
                        <div className="flex flex-wrap gap-2 mb-2">
                          {composeRecipients.map((email) => (
                            <div
                              key={email}
                              className="flex items-center gap-1 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                            >
                              {email}
                              <button
                                onClick={() =>
                                  handleRemoveComposeRecipient(email)
                                }
                                className="hover:text-primary/70"
                              >
                                <IoClose size={14} />
                              </button>
                            </div>
                          ))}
                        </div>
                        {/* Email Input */}
                        <div className="flex gap-2">
                          <select
                            value={composeEmailInput}
                            onChange={(e) =>
                              setComposeEmailInput(e.target.value)
                            }
                            className="flex-1 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                          >
                            <option value="">Select or type email</option>
                            {testEmails.map((email) => (
                              <option key={email} value={email}>
                                {email}
                              </option>
                            ))}
                          </select>
                          <button
                            onClick={handleAddComposeRecipient}
                            className="px-4 py-3 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition flex items-center"
                          >
                            <IoAddOutline size={18} />
                          </button>
                        </div>
                      </div>
                      {/* Subject */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={composeSubject}
                          onChange={(e) => setComposeSubject(e.target.value)}
                          className="w-full p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition"
                          placeholder="Enter email subject"
                        />
                      </div>
                      {/* Content */}
                      <div className="flex-1">
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Email Content (HTML)
                        </label>
                        <textarea
                          value={composeContent}
                          onChange={(e) => setComposeContent(e.target.value)}
                          className="w-full h-64 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm transition resize-none"
                          placeholder="Enter your HTML email content here..."
                        />
                      </div>
                      {/* Placeholders */}
                      <div>
                        <label className="block text-sm font-medium mb-2 text-gray-700">
                          Custom Placeholders
                        </label>
                        <textarea
                          value={composePlaceholders}
                          onChange={(e) =>
                            setComposePlaceholders(e.target.value)
                          }
                          className="w-full h-24 p-3 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary font-mono text-sm transition resize-none"
                          placeholder="Enter key-value pairs (e.g., password: 12345, username: john_doe)"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          Format: key1: value1, key2: value2
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3 mt-4">
                      <button
                        onClick={() => {
                          setShowComposeModal(false);
                          setComposeSubject("");
                          setComposeContent("");
                          setComposeRecipients([]);
                          setComposePlaceholders("");
                        }}
                        className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSendComposedEmail}
                        disabled={
                          sendingTestEmail || composeRecipients.length === 0
                        }
                        className="px-6 py-2 bg-gradient-to-r from-primary to-primary/90 text-white rounded-lg hover:from-primary/90 hover:to-primary transition disabled:opacity-50 flex items-center gap-2"
                      >
                        {sendingTestEmail ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                            Sending...
                          </>
                        ) : (
                          <>
                            <IoSendOutline size={18} />
                            Send to {composeRecipients.length} Recipient
                            {composeRecipients.length !== 1 ? "s" : ""}
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {/* Context Menu */}
            <ContextMenu />
          </div>
          <h1 className="text-4xl text-yellow-600 mt-20 text-center">
            TESTING AREA Do not Click the buttons.
          </h1>
          <ThinkificTestButton />
          <AutoUserCreator />
        </SidebarWrapper>
      </ToastProvider>
    </AdminProtectedRoutes>
  );
};
export default EmailTemplateList;
