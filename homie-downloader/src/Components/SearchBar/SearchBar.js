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
} from "react-icons/fi";
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../Firebase/firebase"; // Adjust path as needed
import styles from "./SearchBar.module.css";
import Loader from "./Loader"; // Ensure Loader component exists

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [selectedQuality, setSelectedQuality] = useState("720p");
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  const isValidYoutubeUrl = (url) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.?be)\/.+$/;
    return youtubeRegex.test(url);
  };

  const detectVideoCategory = (title, description) => {
    if (!title && !description) return "Other";
    const text = `${title} ${description}`.toLowerCase();
    const categories = {
      Music: ["music", "song", "album", "band", "concert"],
      Education: ["tutorial", "lesson", "course", "learn", "education"],
      Gaming: ["game", "gaming", "playthrough", "stream"],
      Entertainment: ["movie", "show", "comedy", "vlog"],
      Technology: ["tech", "gadget", "review", "software"],
      Sports: ["sport", "fitness", "workout", "match"],

    };
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
        (acc, [key, value]) => (value !== undefined ? { ...acc, [key]: value } : acc),
        {}
      );
      await addDoc(collection(db, "userActions"), data);
    } catch (e) {
      console.error("Error saving action:", e);
    }
  };

  const updateAnalytics = async (actionType, videoTitle = "", query = "") => {
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
          query: query || "",
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
    if (isValidYoutubeUrl(query)) {
      const timer = setTimeout(() => {
        fetchVideoPreview(query);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setVideoPreview(null);
      setError("");
    }
  }, [query]);

  const fetchVideoPreview = async (url) => {
    setIsLoadingPreview(true);
    setError("");
    setVideoPreview(null);
    try {
      const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setVideoPreview(data);
      if (data.qualities && data?.qualities.length > 0) {
        setSelectedQuality(data.qualities[0]);
      } else {
        setSelectedQuality("720p");
      }
      setShowFullDescription(false);

      await saveAction({
        type: "preview",
        type: query,
        videoTitle: data.title || "",
        videoDescription: data.description || "",
        thumbnail: data.thumbnail || "",
        duration: data.duration || "",
        views: data.views || "",
        likes: data?.likes || "",
      });
      await updateAnalytics("preview", data?.title || "", url || "");
    } catch (err) {
      console.error("Error fetching preview:", err);
      setError(err.message || "Failed to fetch video information.");
      setVideoPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };


  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (query.trim()) {
      if (!isValidYoutubeUrl(query)) {
        setError("Please enter a valid YouTube video URL for preview and download.");
        await saveAction({ type: "search", query: query, isVideoUrl: false });
        await updateAnalytics("search");
        return;
      }
      await saveAction({ type: "search", query: query, isVideoUrl: true });
      await updateAnalytics("search");
    }
  };

  const clearInput = () => {
    setQuery("");
    setVideoPreview(null);
    setIsDownloading(false);
    setError("");
  };

  const handleDownload = async () => {
    if (!query || !videoPreview) {
      setError("Please enter a video URL and fetch its information first.");
      return;
    }
    if (!selectedQuality) {
      setError("Please select a quality for download.");
      return;
    }


    setIsDownloading(true);
    setError("");
    try {
      await saveAction({
        type: "download",
        url: query,
        quality: selectedQuality,
        videoTitle: videoPreview?.title || "",
        videoDescription: videoPreview?.description || "",
        thumbnail: videoPreview?.thumbnail || "",
        duration: videoPreview?.duration || "",
        views: videoPreview?.views || "",
        likes: videoPreview?.likes || "",
      });
      await updateAnalytics("download", videoPreview?.title || "", "");

      const response = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: query, quality: selectedQuality }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.download_url) {
        const link = document.createElement("a");
        link.href = data.download_url;
        link.setAttribute("download", data.filename || "video.mp4");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        throw new Error(data.error || "Failed to retrieve download link.");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Error downloading video. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleViewFullDetails = () => {
    if (videoPreview && query) {
      navigate("/video/details", { state: { videoData: videoPreview, videoUrl: query } });
    }
  };

  const toggleDescription = () => {
    setShowFullDescription(!showFullDescription);
  };

  const descriptionStyle = {
    display: "-webkit-box",
    WebkitBoxOrient: "vertical",
    overflow: "hidden",
    textOverflow: "ellipsis",
    WebkitLineClamp: showFullDescription ? "none" : 3,
    maxHeight: showFullDescription ? "none" : "4.5em",
    lineHeight: "1.5em",
  };

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
            placeholder="Search for videos, channels or paste a video link..."
            className={styles.searchInput}
          />
          {query && (
            <button type="button" onClick={clearInput} className={styles.clearButton}>
              <FiX size={18} />
            </button>
          )}
        </div>
        <button
          type="submit"
          className={styles.searchButton}
          disabled={!query.trim()}
        >
          <FiSearch size={18} />
          <span>Search</span>
        </button>
      </form>

      {error && <p className={styles.errorMessage}>{error}</p>}

      {isLoadingPreview && (
        <div className={styles.loadingPreview}>
          <Loader />
        </div>
      )}

      {isDownloading && (
        <div className={styles.downloadLoaderContainer}>
          <p>Downloading video, please wait...</p>
          <Loader />
        </div>
      )}

      {videoPreview && !isLoadingPreview && (
        <div className={styles.videoPreviewContainer}>
          <div className={styles.videoPreviewContent}>
            <div className={styles.videoThumbnail}>
              <img src={videoPreview.thumbnail} alt="Preview of video" />
            </div>
            <div className={styles.videoInfo}>
              <h3>{videoPreview.title}</h3>
              <div className={styles.descriptionContainer}>
                <p
                  ref={descriptionRef}
                  className={styles.videoDescription}
                  style={descriptionStyle}
                >
                  {videoPreview.description || "No description available."}
                </p>
                {(videoPreview.description &&
                  (videoPreview.description.split("\n").length > 3 ||
                    videoPreview.description.length > 150)) && (
                  <button
                    onClick={toggleDescription}
                    className={styles.toggleDescriptionButton}
                  >
                    <FiChevronDown size={16} />
                    <span>{showFullDescription ? "Roll up" : "Unfold"}</span>
                  </button>
                )}
              </div>
              <div className={styles.videoStats}>
                <span className={styles.videoStat}>
                  <FiThumbsUp /> {videoPreview.likes}
                </span>
                <span className={styles.videoStat}>
                  <FiEye /> {videoPreview.views}
                </span>
                <span className={styles.videoStat}>{videoPreview.duration}</span>
              </div>
            </div>
          </div>
          <div className={styles.downloadOptions}>
            <select
              value={selectedQuality}
              onChange={(e) => setSelectedQuality(e.target.value)}
              className={styles.qualitySelect}
            >
              {videoPreview.qualities.map((quality) => (
                <option key={quality} value={quality}>
                  {quality}
                </option>
              ))}
            </select>
            <button
              onClick={handleDownload}
              className={styles.downloadButton}
              disabled={isDownloading}
            >
              <FiDownload size={18} />
              <span>Download</span>
            </button>
            <button
              onClick={handleViewFullDetails}
              className={styles.fullDetailsButton}
            >
              <FiExternalLink size={18} />
              <span>Details</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
