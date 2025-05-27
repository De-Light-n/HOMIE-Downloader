// --- START OF MODIFIED SearchBar.js ---

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
  FiYoutube, // Для іконки YouTube
  FiMoreHorizontal, // Для інших платформ
  FiVideo, // Для вибору типу
  FiMusic, // Для вибору типу
} from "react-icons/fi";
import { FaTiktok } from "react-icons/fa"; // Для іконки TikTok
import { collection, addDoc, doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../Firebase/firebase"; // Adjust path as needed
import styles from "./SearchBar.module.css";
import Loader from "./Loader"; // Ensure Loader component exists

const SearchBar = () => {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Нові стани
  const [downloadType, setDownloadType] = useState("video"); // 'video' або 'audio'
  const [selectedFormat, setSelectedFormat] = useState(""); // Для обраної якості/формату

  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState("");
  const descriptionRef = useRef(null);
  const navigate = useNavigate();

  // Оновлена валідація URL (дуже загальна, покладаємося на сервер)
  const isValidPlatformUrl = (url) => {
    try {
      const parsedUrl = new URL(url);
      return parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:";
      // Можна додати більш специфічні перевірки, якщо потрібно, але yt-dlp гнучкий
    } catch (e) {
      return false;
    }
  };

  const getUrlPlatformIcon = (sourceType) => {
    if (sourceType === 'youtube') return <FiYoutube className={styles.platformOriginIcon} />;
    if (sourceType === 'tiktok') return <FaTiktok className={styles.platformOriginIcon} />;
    if (sourceType === 'soundcloud') return <FiMusic className={styles.platformOriginIcon} />; // Приклад
    return <FiMoreHorizontal className={styles.platformOriginIcon} />;
  };


  const detectVideoCategory = (title, description) => {
    // ... (ваш код залишається без змін) ...
    if (!title && !description) return "Other";
    const text = `${title} ${description}`.toLowerCase();
    const categories = { /* ... ваші категорії ... */ };
    for (const [category, keywords] of Object.entries(categories)) {
      if (keywords.some((keyword) => text.includes(keyword))) return category;
    }
    return "Other";
  };

  const saveAction = async (actionData) => {
    // ... (ваш код залишається без змін) ...
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

  const updateAnalytics = async (actionType, videoTitle = "", queryVal = "") => { // query перейменовано в queryVal
    // ... (ваш код залишається без змін) ...
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
          query: queryVal || query, // Використовуємо queryVal або поточний query
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
    if (query.trim() && isValidPlatformUrl(query)) { // Перевірка на пустий рядок
      const timer = setTimeout(() => {
        fetchVideoPreview(query);
      }, 700); // Трохи більша затримка
      return () => clearTimeout(timer);
    } else {
      setVideoPreview(null);
      if (query.trim() === '') setError(""); // Скидаємо помилку, якщо поле порожнє
      // Не скидаємо помилку, якщо це не URL, щоб користувач бачив повідомлення від handleSearch
    }
  }, [query]);

  const fetchVideoPreview = async (url) => {
    setIsLoadingPreview(true);
    setError("");
    setVideoPreview(null);
    setSelectedFormat(""); // Скидаємо вибраний формат
    try {
      const response = await fetch(`/api/video/preview?url=${encodeURIComponent(url)}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      setVideoPreview(data);
      // Встановлення формату за замовчуванням залежно від типу
      if (downloadType === "video" && data.qualities_video && data.qualities_video.length > 0) {
        setSelectedFormat(data.qualities_video[0]);
      } else if (downloadType === "audio" && data.qualities_audio && data.qualities_audio.length > 0) {
        setSelectedFormat(data.qualities_audio[0]);
      } else if (data.qualities_video && data.qualities_video.length > 0) { // Резерв на випадок, якщо downloadType ще не оновлено
        setSelectedFormat(data.qualities_video[0]);
      }


      setShowFullDescription(false);

      await saveAction({
        type: "preview",
        query: url, // виправлено type на query
        videoTitle: data.title || "",
        videoDescription: data.description || "",
        thumbnail: data.thumbnail || "",
        duration: data.duration || "",
        views: data.views || "",
        likes: data.likes || "",
        source_type: data.source_type || "unknown",
      });
      await updateAnalytics("preview", data.title || "", url || "");
    } catch (err) {
      console.error("Error fetching preview:", err);
      setError(err.message || "Failed to fetch video information.");
      setVideoPreview(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  // Оновлення вибраного формату при зміні типу завантаження
  useEffect(() => {
    if (videoPreview) {
      if (downloadType === "video" && videoPreview.qualities_video && videoPreview.qualities_video.length > 0) {
        setSelectedFormat(videoPreview.qualities_video[0]);
      } else if (downloadType === "audio" && videoPreview.qualities_audio && videoPreview.qualities_audio.length > 0) {
        setSelectedFormat(videoPreview.qualities_audio[0]);
      } else {
        setSelectedFormat(""); // Немає доступних форматів для цього типу
      }
    }
  }, [downloadType, videoPreview]);


  const handleSearch = async (e) => {
    e.preventDefault();
    setError("");
    if (query.trim()) {
      if (!isValidPlatformUrl(query)) { // Менш сувора перевірка
        setError("Будь ласка, вставте дійсне посилання на медіа або спробуйте пошук (пошук поки не реалізовано).");
        await saveAction({ type: "search_attempt_invalid_url", query: query, isVideoUrl: false });
        await updateAnalytics("search"); // Можна додати флаг is_valid_url: false
        return;
      }
      // Якщо URL валідний (схожий на URL), то fetchVideoPreview викличеться з useEffect
      // Додатково можна викликати тут, якщо є потреба в примусовому оновленні
      // fetchVideoPreview(query);
      await saveAction({ type: "search_valid_url", query: query, isVideoUrl: true });
      await updateAnalytics("search");
    }
  };

  const clearInput = () => {
    setQuery("");
    setVideoPreview(null);
    setIsDownloading(false);
    setError("");
    setSelectedFormat("");
    setDownloadType("video"); // Скидаємо на відео за замовчуванням
  };

  const handleDownload = async () => {
    if (!query || !videoPreview) {
      setError("Будь ласка, вставте посилання та отримайте інформацію про медіа.");
      return;
    }
    if (!selectedFormat) {
      setError("Будь ласка, виберіть формат/якість для завантаження.");
      return;
    }

    setIsDownloading(true);
    setError("");
    try {
      await saveAction({
        type: "download_initiate", // Більш конкретний тип дії
        url: query,
        download_type: downloadType,
        quality_format: selectedFormat, // Надсилаємо обраний формат/якість
        videoTitle: videoPreview?.title || "",
        source_type: videoPreview?.source_type || "unknown",
      });
      await updateAnalytics("download", videoPreview?.title || "", "");

      const response = await fetch("/api/video/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          url: query,
          quality: selectedFormat, // Надсилаємо обраний формат/якість
          download_type: downloadType // Надсилаємо тип завантаження
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Server error: ${response.status}`);
      }

      if (data.success && data.download_url) {
        const link = document.createElement("a");
        // Формування повного URL для завантаження
        const serverBaseUrl = process.env.NODE_ENV === 'development' ? 'http://localhost:5000' : '';
        link.href = `${serverBaseUrl}${data.download_url}`;
        console.log("Attempting download from:", link.href);

        link.setAttribute("download", data.filename || (downloadType === "video" ? "video.mp4" : "audio.mp3"));
        document.body.appendChild(link);
        link.click();
        setTimeout(() => { // Даємо час на ініціацію завантаження
          if(link.parentNode) {
            document.body.removeChild(link);
          }
        }, 150);
      } else {
        throw new Error(data.error || "Failed to retrieve download link.");
      }
    } catch (err) {
      console.error("Download error:", err);
      setError(err.message || "Error downloading content. Please try again.");
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

  const descriptionStyle = { /* ... (залишається без змін) ... */ };

  // Поточний список опцій для селектора (відео якості або аудіо формати)
  const currentFormatOptions = downloadType === 'video'
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
                placeholder="Вставте посилання на відео або аудіо..." // Оновлений placeholder
                className={styles.searchInput}
            />
            {query && (
                <button type="button" onClick={clearInput} className={styles.clearButton}>
                  <FiX size={18} />
                </button>
            )}
          </div>
          {/* Кнопка пошуку може бути потрібна, якщо не тільки по URL працюємо */}
          {/* <button type="submit" className={styles.searchButton} disabled={!query.trim()}>
          <FiSearch size={18} /> <span>Пошук</span>
        </button> */}
        </form>

        {error && <p className={styles.errorMessage}>{error}</p>}

        {isLoadingPreview && <div className={styles.loadingPreview}><Loader /></div>}
        {isDownloading && (
            <div className={styles.downloadLoaderContainer}>
              <p>Завантаження, будь ласка, зачекайте...</p>
              <Loader />
            </div>
        )}

        {videoPreview && !isLoadingPreview && (
            <div className={styles.videoPreviewContainer}>
              <div className={styles.videoPreviewContent}>
                <div className={styles.videoThumbnail}>
                  <img src={videoPreview.thumbnail || "/default-thumbnail.png"} alt="Прев'ю" /> {/* Додано дефолтний thumbnail */}
                  {videoPreview.source_type && (
                      <div className={styles.platformIconContainer}>
                        {getUrlPlatformIcon(videoPreview.source_type)}
                      </div>
                  )}
                </div>
                <div className={styles.videoInfo}>
                  <h3>{videoPreview.title || "Назва не знайдена"}</h3>
                  {videoPreview.uploader && <p className={styles.videoUploader}>Автор: {videoPreview.uploader}</p>}
                  <div className={styles.descriptionContainer}>
                    <p ref={descriptionRef} className={styles.videoDescription} style={descriptionStyle}>
                      {videoPreview.description || "Опис відсутній."}
                    </p>
                    {/* ... (кнопка розгорнути/згорнути опис) ... */}
                  </div>
                  <div className={styles.videoStats}>
                    {videoPreview.likes !== "N/A" && videoPreview.likes !== undefined && <span className={styles.videoStat}><FiThumbsUp /> {videoPreview.likes}</span>}
                    {videoPreview.views !== "N/A" && videoPreview.views !== undefined && <span className={styles.videoStat}><FiEye /> {videoPreview.views}</span>}
                    {videoPreview.duration !== "N/A" && <span className={styles.videoStat}>{videoPreview.duration}</span>}
                  </div>
                </div>
              </div>

              {/* Вибір типу завантаження та формату/якості */}
              <div className={styles.downloadOptions}>
                <div className={styles.downloadTypeSelector}>
                  <button
                      className={`${styles.typeButton} ${downloadType === 'video' ? styles.active : ''}`}
                      onClick={() => setDownloadType('video')}
                      disabled={isDownloading || !videoPreview?.qualities_video || videoPreview.qualities_video.length === 0}
                  >
                    <FiVideo /> Відео
                  </button>
                  <button
                      className={`${styles.typeButton} ${downloadType === 'audio' ? styles.active : ''}`}
                      onClick={() => setDownloadType('audio')}
                      disabled={isDownloading || !videoPreview?.qualities_audio || videoPreview.qualities_audio.length === 0}
                  >
                    <FiMusic /> Аудіо
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
                      {downloadType === 'video' ? 'Немає доступних якостей відео.' : 'Немає доступних форматів аудіо.'}
                    </p>
                )}

                <button
                    onClick={handleDownload}
                    className={styles.downloadButton}
                    disabled={isDownloading || !selectedFormat || currentFormatOptions.length === 0}
                >
                  {isDownloading ? <Loader size="small" /> : <FiDownload size={18} />}
                  <span>{isDownloading ? 'Завантаження...' : 'Завантажити'}</span>
                </button>

                {/* Кнопка "Деталі" - можна залишити або прибрати, якщо не потрібна для всіх типів */}
                {/* <button onClick={handleViewFullDetails} className={styles.fullDetailsButton} disabled={isDownloading}>
              <FiExternalLink size={18} /> <span>Деталі</span>
            </button> */}
              </div>
            </div>
        )}
      </div>
  );
};

export default SearchBar;

// --- END OF MODIFIED SearchBar.js ---