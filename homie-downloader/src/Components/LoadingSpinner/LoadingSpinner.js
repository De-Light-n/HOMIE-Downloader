import styles from './LoadingSpinner.module.css';

const LoadingSpinner = () => {
    return (
        <div className={styles.spinnerContainer}>
            <div className={styles.spinner}></div>
            <p className={styles.loadingText}>Loading awesome content...</p>
        </div>
    );
};

export default LoadingSpinner;