import React from "react";
import {
    oceanicBlissTheme,
    crimsonNightTheme,
    halloweenTheme,
    horrorTheme,
    helloKittyTheme,
    cyberpunkNeonTheme,
    noirCinemaTheme,
    sunsetGlowTheme,
    vintagePaperTheme,
    deepForestTheme,

    // --- HORROR THEMES ROUND 2 IMPORTS ---
    staticVoidTheme,
    eldritchDepthsTheme
} from "../../../../Styles/theme";

const ThemesComponent = ({ theme, themes, toggleTheme }) => {
    // Об'єкт тем для отримання опису
    const themesData = {
        'oceanic-bliss': oceanicBlissTheme,
        'crimson-night': crimsonNightTheme,
        'halloween': halloweenTheme,
        'horror': horrorTheme,
        'hello-kitty': helloKittyTheme,
        'cyberpunk-neon': cyberpunkNeonTheme,
        'noir-cinema': noirCinemaTheme,
        'sunset-glow': sunsetGlowTheme,
        'vintage-paper': vintagePaperTheme,
        'deep-forest': deepForestTheme,
        // --- HORROR THEMES ROUND 2 ADDED TO themesData ---
        'static-void': staticVoidTheme,
        'eldritch-depths': eldritchDepthsTheme,
    };

    return (
        <>
            <div className="details-header">
                <h2>Themes</h2>
                <p className="section-description">
                    Customize your interface appearance
                </p>
            </div>

            <div className="details-content themes-content">
                {themes.map((themeName) => (
                    <div
                        key={themeName}
                        className={`theme-item ${theme === themeName ? "active-theme" : ""}`}
                        onClick={() => toggleTheme(themeName)}
                    >
                        <div className="theme-header">
                            <h4>{themeName.charAt(0).toUpperCase() + themeName.slice(1).replace(/-/g, ' ')} Theme</h4>
                            {theme === themeName && <span className="active-indicator">✓ Active</span>}
                        </div>
                        <p className="detail-value theme-description">
                            {themesData[themeName]?.description || 'Theme description'}
                        </p>
                    </div>
                ))}
            </div>
        </>
    );
};

export default ThemesComponent;