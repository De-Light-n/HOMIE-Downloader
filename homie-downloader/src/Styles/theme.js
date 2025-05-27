
export const oceanicBlissTheme = {
    bgPrimary: '#F0F8FF', // Alice Blue - very light blue
    bgSecondary: '#E0FFFF', // Light Cyan - slightly deeper water
    headerBg: '#F0F8FF', // Alice Blue
    textPrimary: '#005073', // Dark Blue - deep ocean
    textSecondary: '#107dac', // Medium Blue - clear water
    borderColor: '#70C1B3', // Light Teal - seafoam
    primaryColor: '#20A4F3', // Bright Sky Blue - accents
    primaryDark: '#187BCD', // Darker Sky Blue
    userIconBg: '#B2DFDB', // Pale Teal - user icons
    description: 'Calm and refreshing oceanic theme with blue and teal accents',
};

export const crimsonNightTheme = {
    bgPrimary: '#121212', // Very Dark Gray/Almost Black - night sky
    bgSecondary: '#1E1E1E', // Dark Gray - shadows
    headerBg: '#121212', // Very Dark Gray
    textPrimary: '#EAEAEA', // Light Gray - stars/moonlight
    textSecondary: '#A0A0A0', // Medium Gray - distant light
    borderColor: '#4A0404', // Darkest Red - subtle border
    primaryColor: '#DC143C', // Crimson - accents
    primaryDark: '#B22222', // Firebrick - darker crimson
    userIconBg: '#2B2B2B', // Slightly lighter dark gray - user icons
    description: 'Mysterious and elegant theme with deep reds and dark grays',
};

// --- NEW THEMES START ---
export const halloweenTheme = {
    bgPrimary: '#1A1A1A', // Dark gray, almost black
    bgSecondary: '#0D0D0D', // Even darker gray
    headerBg: '#1A1A1A', // Dark gray
    textPrimary: '#F0F0F0', // Off-white
    textSecondary: '#FF8C00', // DarkOrange for secondary text
    borderColor: '#8C3B00', // Darker orange
    primaryColor: '#FF6600', // Bright orange (pumpkin)
    primaryDark: '#CC5200', // Darker orange
    userIconBg: '#262626', // Dark gray for icons
    description: 'Spooky Halloween theme with orange and black.',
};

export const horrorTheme = {
    bgPrimary: '#0A0000', // Very dark red, almost black
    bgSecondary: '#000000', // True black
    headerBg: '#0A0000', // Very dark red
    textPrimary: '#E0E0E0', // Very light gray, like faint moonlight
    textSecondary: '#8B0000', // DarkRed for secondary text
    borderColor: '#400000', // Even darker red
    primaryColor: '#FF0000', // Bright blood red
    primaryDark: '#B30000', // Darker blood red
    userIconBg: '#1C1C1C', // Very dark gray for icons
    description: 'Terrifying horror theme with deep reds and blacks.',
};

export const helloKittyTheme = {
    bgPrimary: '#FFF0F5', // LavenderBlush (light pink)
    bgSecondary: '#FFFAFA', // Snow (very light pink/white)
    headerBg: '#FFF0F5', // Light pink
    textPrimary: '#C71585', // MediumVioletRed (dark pink)
    textSecondary: '#FF69B4', // HotPink (medium pink)
    borderColor: '#FFB6C1', // LightPink border
    primaryColor: '#FF1493', // DeepPink (bright pink)
    primaryDark: '#DB7093', // PaleVioletRed (darker pink)
    userIconBg: '#FFE4E1', // MistyRose (very light pink for icons)
    description: 'Cute and playful Hello Kitty theme with lots of pink.',
};

export const cyberpunkNeonTheme = {
    bgPrimary: '#0C001F',      // Very dark deep blue/purple
    bgSecondary: '#05000F',    // Almost black, deeper blue/purple
    headerBg: '#100028',      // Dark purple
    textPrimary: '#00FFFF',    // Cyan
    textSecondary: '#FF00FF',  // Magenta
    borderColor: '#FFFF00',    // Yellow
    primaryColor: '#39FF14',   // Neon Green
    primaryDark: '#2FDD0D',   // Darker Neon Green
    userIconBg: '#20003B',    // Dark violet for icons
    description: 'Futuristic cyberpunk theme with vibrant neon lights on a dark canvas.',
};
// --- NEW THEMES END ---

// This object is likely used by your ThemeContext to provide the `themes` variable
export const themes = {
    'oceanic-bliss': oceanicBlissTheme,
    'crimson-night': crimsonNightTheme,
    // --- NEW THEMES ADDED TO EXPORT ---
    halloween: halloweenTheme,
    horror: horrorTheme,
    'hello-kitty': helloKittyTheme,
    'cyberpunk-neon': cyberpunkNeonTheme,
};

export const themeDescriptions = {
    light: 'Light interface with soft colors',
    dark: 'Default dark interface with purple neon accents',
    'high-contrast': 'High-contrast interface for accessibility with neon accents',
    eco: 'Eco-friendly theme with green accents',
    floral: 'Floral theme with dark and muted colors',
    'oceanic-bliss': 'Calm and refreshing oceanic theme with blue and teal accents',
    'crimson-night': 'Mysterious and elegant theme with deep reds and dark grays',
    // --- NEW DESCRIPTIONS ---
    halloween: 'Spooky Halloween theme with orange and black.',
    horror: 'Terrifying horror theme with deep reds and blacks.',
    'hello-kitty': 'Cute and playful Hello Kitty theme with lots of pink.',
    'cyberpunk-neon': 'Futuristic cyberpunk theme with vibrant neon lights on a dark canvas.',
};