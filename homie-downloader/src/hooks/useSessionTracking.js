import { useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, auth } from "../Components/Firebase/firebase";

const useSessionTracking = () => {
  useEffect(() => {
    let sessionId = null;
    let startTime = Date.now();

    const startSession = async () => {
      const user = auth.currentUser;
      if (user) {
        sessionId = user.uid;
      }
    };

    const endSession = async () => {
      const user = auth.currentUser;
      if (user && sessionId) {
        const duration = Math.floor((Date.now() - startTime) / 1000);
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

        analyticsData.timeSpent = (analyticsData.timeSpent || 0) + duration;

        await setDoc(analyticsRef, analyticsData);
      }
    };

    startSession();

    const handleBeforeUnload = () => {
      endSession();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      endSession();
    };
  }, []);
};

export default useSessionTracking;