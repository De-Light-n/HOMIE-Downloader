import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  FiSearch,
  FiX,
  FiDownload,
  FiThumbsUp,
  FiEye,
  FiChevronDown,
  FiExternalLink,
  FiYoutube,
  FiMoreHorizontal,
  FiVideo,
  FiMusic,
} from "react-icons/fi";
import { FaTiktok } from "react-icons/fa";
import {
  collection,
  addDoc,
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db, auth } from "../Firebase/firebase";
import styles from "./SearchBar.module.css";
import Loader from "./Loader";

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [downloadType, setDownloadType] = useState("video");
  const [selectedFormat, setSelectedFormat] = useState("");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const [showPreview, setShowPreview] = useState(true);
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  const isValidPlatformUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
    } catch (e) {
      return false;
    }
  };

  const getUrlPlatformIcon = (sourceType) => {
    if (sourceType === "youtube")
      return <FiYoutube className={styles.platformOriginIcon} />;
    if (sourceType === "tiktok")
      return <FaTiktok className={styles.platformOriginIcon} />;
    if (sourceType === "soundcloud")
      return <FiMusic className={styles.platformOriginIcon} />;
    return <FiMoreHorizontal className={styles.platformOriginIcon} />;
  };

  const detectVideoCategory = (title, description) => {
    if (!title && !description) return "Other";
    const text = `${title} ${description}`.toLowerCase();
    const categories = {};
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) return category;
    }
    return "Other";
  };

  const saveAction = async (actionData) => {
    try {
      const user = auth.currentUser;
      let category = "Other";
      if (actionData.videoTitle || actionData.videoDescription) {
        category = detectVideoCategory(
          actionData.videoTitle || "",
          actionData.videoDescription || ""
        );
      }
      const data = Object.entries({
        ...actionData,
        category,
        timestamp: serverTimestamp(),
        userId: user?.uid || "anonymous",
        userEmail: user?.email || null,
      }).reduce(
        (acc, [key, value]) =>
          value !== undefined ? { ...acc, [key]: value } : acc,
        {}
      );
      await addDoc(collection(db, "userActions"), data);
    } catch (e) {
      console.error("Error saving action:", e);
    }
  };

  const updateAnalytics = async (
    actionType,
    videoTitle = "",
    queryVal = ""
  ) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const analyticsRef = doc(db, "userAnalytics", user.uid);
      const analyticsSnap = await getDoc(analyticsRef);
      let analyticsData = analyticsSnap.exists()
        ? analyticsSnap.data()
        : {
            timeSpent: 0,
            searches: [],
            downloads: [],
            userEmail: user.email,
          };

      const now = Date.now();

      if (actionType === "search" || actionType === "preview") {
        analyticsData.searches.push({
          timestamp: now,
          query: queryVal || query,
        });
      }
      if (actionType === "download") {
        analyticsData.downloads.push({
          timestamp: now,
          videoTitle: videoTitle || "",
        });
      }

      await setDoc(analyticsRef, analyticsData);
    } catch (e) {
      console.error("Error updating analytics:", e);
    }
  };

  useEffect(() => {
    if (query.trim() && isValidPlatformUrl(query)) {
      const timer = setTimeout(() => {
        fetchVideoPreview(query);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setVideoPreview(null);
      setShowPreview(true);
      if (query.trim() === "") setError("");
    }
  }, [query]);

  const fetchVideoPreview = async (url) => {
    setIsLoadingPreview(true);
    setError("");
    setVideoPreview(null);
    setSelectedFormat("");
    try {
      const response = await fetch(
        `/api/video/preview?url=${encodeURIComponent(url)}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setVideoPreview(data);
      if (
        downloadType === "video" &&
        data.qualities_video &&
        data.qualities_video.length > 0
      ) {
        setSelectedFormat(data.qualities_video[0]);
      } else if (
        downloadType === "audio" &&
        data.qualities_audio &&
        data.qualities_audio.length > 0
      ) {
        setSelectedFormat(data.qualities_audio[0]);
      } else if (data.qualities_video && data.qualities_video.length > 0) {
        setSelectedFormat(data.qualities_video[0]);
      }

      setShowFullDescription(false);

      await saveAction({
        type: "preview",
        query: url,
        videoTitle: data.title || "",
        videoDescription: data.description || "",
        thumbnail: data.thumbnail || "",
        duration: data.duration || "",
        views: data.views || "",
        likes: data.likes || "",
        source_type: data.source_type || "unknown",
      });
      await updateAnalytics("preview", data.title || "", url);
    } catch (err) {
      console.error("Error fetching preview:", err);
      setError(err.message || "Failed to fetch video information.");
      setVideoPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  useEffect(() => {
    if (videoPreview) {
      if (
        downloadType === "video" &&
        videoPreview.qualities_video &&
        videoPreview.qualities_video.length > 0
      ) {
        setSelectedFormat(videoPreview.qualities_video[0]);
      } else if (
        downloadType === "audio" &&
        videoPreview.qualities_audio &&
        videoPreview.qualities_audio.length > 0
      ) {
        setSelectedFormat(videoPreview.qualities_audio[0]);
      } else {
        setSelectedFormat("");
      }
    }
  }, [downloadType, videoPreview]);

  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (query.trim()) {
      if (!isValidPlatformUrl(query)) {
        setError(
          "Please insert a valid media link or try a search (search not yet implemented)."
        );
        await saveAction({
          type: "search_attempt_invalid_url",
          query: query,
          isVideoUrl: false,
        });
        await updateAnalytics("search");
        return;
      }
      await saveAction({
        type: "search_valid_url",
        query: query,
        isVideoUrl: true,
      });
      await updateAnalytics("search");
    }
  };

  const clearInput = () => {
    setQuery("");
    setVideoPreview(null);
    setIsDownloading(false);
    setError("");
    setSelectedFormat("");
    setDownloadType("video");
    setShowPreview(true);
  };

  const handleDownload = async () => {
    if (!query || !videoPreview) {
      setError("Please insert a link and get media information.");
      return;
    }
    if (!selectedFormat) {
      setError("Please select a format/quality to download.");
      return;
    }

    setIsDownloading(true);
    setShowPreview(false);
    setError("");
    try {
      await saveAction({
        type: "download_initiate",
        url: query,
        download_type: downloadType,
        quality_format: selectedFormat,
        videoTitle: videoPreview?.title || "",
        source_type: videoPreview?.source_type || "unknown",
      });
      await updateAnalytics("download", videoPreview?.title || "");

      const response = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: query,
          quality: selectedFormat,
          download_type: downloadType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.download_url) {
        const link = document.createElement("a");
        const serverBaseUrl =
          process.env.NODE_ENV === "development" ? "http://localhost:5000" : "";
        link.href = `${serverBaseUrl}${data.download_url}`;
        console.log("Attempting download from:", link.href);

        link.setAttribute(
          "download",
          data.filename ||
            (downloadType === "video" ? "video.mp4" : "audio.mp3")
        );
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
          if (link.parentNode) {
            document.body.removeChild(link);
          }
        }, 150);
      } else {
        throw new Error(data.error || "Failed to retrieve download link.");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Error downloading content. Please try again.");
      setShowPreview(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewFullDetails = () => {
    if (videoPreview && query) {
      // Передаємо qualities_video як qualities для сумісності з VideoDetailsPage
      const modifiedVideoData = {
        ...videoPreview,
        qualities: videoPreview.qualities_video || [],
      };
      navigate("/video/details", {
        state: { videoData: modifiedVideoData, videoUrl: query },
      });
    }
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const descriptionStyle = {};

  const currentFormatOptions =
    downloadType === "video"
      ? videoPreview?.qualities_video || []
      : videoPreview?.qualities_audio || [];

  return (
    <div className={styles.searchWrapper}>
      <form
        onSubmit={handleSearch}
        className={`${styles.searchForm} ${isFocused ? styles.focused : ""}`}
      >
        <div className={styles.searchContainer}>
          <FiSearch className={styles.searchIcon} size={20} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Insert video or audio link..."
            className={styles.searchInput}
          />
          {query && (
            <button
              type="button"
              onClick={clearInput}
              className={styles.clearButton}
            >
              <FiX size={18} />
            </button>
          )}
        </div>
      </form>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {isLoadingPreview && (
        <div className={styles.loadingPreview}>
          <p>We are looking for your request, please wait!</p>
          <Loader />
        </div>
      )}
      
      {isDownloading && (
        <div className={styles.loadingPreview}>
          <p>Loading, please wait!</p>
          <Loader />
        </div>
      )}

      {showPreview && videoPreview && !isLoadingPreview && !isDownloading && (
        <div className={styles.videoPreviewContainer}>
          <div className={styles.videoPreviewContent}>
            <div className={styles.videoThumbnail}>
              <img
                src={videoPreview.thumbnail || "/default-thumbnail.png"}
                alt="Прев'ю"
              />
              {videoPreview.source_type && (
                <div className={styles.platformIconContainer}>
                  {getUrlPlatformIcon(videoPreview.source_type)}
                </div>
              )}
            </div>
            <div className={styles.videoInfo}>
              <h3>{videoPreview.title || "Name not found"}</h3>
              {videoPreview.uploader && (
                <p className={styles.videoUploader}>
                  Автор: {videoPreview.uploader}
                </p>
              )}
              <div className={styles.descriptionContainer}>
                <p
                  ref={descriptionRef}
                  className={styles.videoDescription}
                  style={descriptionStyle}
                >
                  {videoPreview.description || "There is no description."}
                </p>
              </div>
              <div className={styles.videoStats}>
                {videoPreview.likes !== "N/A" &&
                  videoPreview.likes !== undefined && (
                    <span className={styles.videoStat}>
                      <FiThumbsUp /> {videoPreview.likes}
                    </span>
                  )}
                {videoPreview.views !== "N/A" &&
                  videoPreview.views !== undefined && (
                    <span className={styles.videoStat}>
                      <FiEye /> {videoPreview.views}
                    </span>
                  )}
                {videoPreview.duration !== "N/A" && (
                  <span className={styles.videoStat}>
                    {videoPreview.duration}
                  </span>
                )}
                <button
                  onClick={handleViewFullDetails}
                  className={styles.detailsButton}
                  aria-label="More details"
                >
                  <FiExternalLink size={16} />
                  <p>Details</p>
                </button>
              </div>
            </div>
          </div>

          <div className={styles.downloadOptions}>
            <div className={styles.downloadTypeSelector}>
              <button
                className={`${styles.typeButton} ${
                  downloadType === "video" ? styles.active : ""
                }`}
                onClick={() => setDownloadType("video")}
                disabled={
                  isDownloading ||
                  !videoPreview?.qualities_video ||
                  videoPreview.qualities_video.length === 0
                }
                aria-label="Video"
              >
                <FiVideo />
                <span>Відео</span>
              </button>
              <button
                className={`${styles.typeButton} ${
                  downloadType === "audio" ? styles.active : ""
                }`}
                onClick={() => setDownloadType("audio")}
                disabled={
                  isDownloading ||
                  !videoPreview?.qualities_audio ||
                  videoPreview.qualities_audio.length === 0
                }
                aria-label="Audio"
              >
                <FiMusic />
                <span>Аудіо</span>
              </button>
            </div>
            {currentFormatOptions.length > 0 ? (
              <select
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.target.value)}
                className={styles.qualitySelect}
                disabled={isDownloading}
              >
                {currentFormatOptions.map((format) => (
                  <option key={format} value={format}>
                    {format}
                  </option>
                ))}
              </select>
            ) : (
              <p className={styles.noFormatsAvailable}>
                {downloadType === "video"
                  ? "No video qualities available."
                  : "No audio formats available."}
              </p>
            )}

            <button
              onClick={handleDownload}
              className={styles.downloadButton}
              disabled={
                isDownloading ||
                !selectedFormat ||
                currentFormatOptions.length === 0
              }
            >
              <FiDownload size={18} />
              <span>Download</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
