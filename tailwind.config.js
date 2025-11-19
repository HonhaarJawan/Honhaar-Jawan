/** @type {import('tailwindcss').Config} */
const flattenColorPalette =
  require("tailwindcss/lib/util/flattenColorPalette").default;

// This plugin adds each Tailwind color as a global variable for CSS
function addVariablesForColors({ addBase, theme }) {
  let allColors = flattenColorPalette(theme("colors"));
  let newVars = Object.fromEntries(
    Object.entries(allColors).map(([key, val]) => [`--${key}`, val])
  );

  addBase({
    ":root": newVars,
  });
}

// Custom utilities plugin
function customUtilitiesPlugin({
  addUtilities,
  matchUtilities,
  theme,
  addBase,
}) {
  // 1) Flex utilities
  const newUtilities = {
    ".center-flex": {
      display: "flex",
      "justify-content": "center",
      "align-items": "center",
    },
    ".between-flex": {
      display: "flex",
      "justify-content": "space-between",
      "align-items": "center",
    },
    ".start-flex": {
      display: "flex",
      "justify-content": "flex-start",
      "align-items": "center",
    },
    ".end-flex": {
      display: "flex",
      "justify-content": "flex-end",
      "align-items": "center",
    },
    ".evenly-flex": {
      display: "flex",
      "justify-content": "space-evenly",
      "align-items": "center",
    },
    ".around-flex": {
      display: "flex",
      "justify-content": "space-around",
      "align-items": "center",
    },
  };

  // 2) Base button styles
  const btnUtilities = {
    ".btn": {
      display: "inline-flex",
      "align-items": "center",
      "justify-content": "center",
      transition: "all 0.3s ease-out",
      outline: "none",
      "border-radius": "0.375rem",
      cursor: "pointer",
      "&:hover": {
        transform: "scale(1.05)",
      },
    },
    ".btn-icon": {
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      transition: "transform 0.3s ease-in-out",
      outline: "none",
      "border-radius": "0.75rem",
      cursor: "pointer",
      "&:hover": {
        transform: "scale(1.1)",
        opacity: "0.8",
      },
    },
  };

  const inputUtilities = {
    ".input": {
      display: "flex",
      "align-items": "center",
      "justify-content": "center",
      "font-weight": "600",
      transition: "all 0.2s",
      outline: "none",
    },
  };

  // 3) Size Utilities
  const sizeUtilities = {
    ".btn-xs": {
      padding: "0.375rem",
      "font-size": "0.75rem",
    },
    ".btn-sm": {
      padding: "0.5rem 0.5rem",
      "font-size": "0.75rem",
    },
    ".btn-md": {
      padding: "0.625rem 1rem",
      "font-size": "0.875rem",
    },
    ".btn-lg": {
      padding: "0.75rem 1.5rem",
      "font-size": "1rem",
    },
    ".btn-xl": {
      padding: "1rem 2rem",
      "font-size": "1.125rem",
    },
  };

  const iconSizeUtilities = {
    ".btn-icon-sm": {
      width: "2rem",
      height: "2rem",
      "font-size": "0.75rem",
    },
    ".btn-icon-md": {
      width: "2.5rem",
      height: "2.5rem",
      "font-size": "0.875rem",
    },
    ".btn-icon-lg": {
      width: "3.5rem",
      height: "3.5rem",
      "font-size": "1rem",
    },
    ".btn-icon-xl": {
      width: "4rem",
      height: "4rem",
      "font-size": "1.125rem",
    },
  };

  const styleSizeUtilities = {
    ".style-second-sm": {
      "border-top-left-radius": "1rem",
      "border-bottom-right-radius": "1rem",
    },
    ".style-second-md": {
      "border-top-left-radius": "1.5rem",
      "border-bottom-right-radius": "1.5rem",
    },
    ".style-second-lg": {
      "border-top-left-radius": "2.2rem",
      "border-bottom-right-radius": "2.2rem",
    },
    ".style-second-xl": {
      "border-top-left-radius": "4.4rem",
      "border-bottom-right-radius": "4.4rem",
    },

    ".style-primary-sm": {
      "border-bottom-left-radius": "1rem",
      "border-top-right-radius": "1rem",
    },
    ".style-primary-md": {
      "border-bottom-left-radius": "1.5rem",
      "border-top-right-radius": "1.5rem",
    },
    ".style-primary-lg": {
      "border-bottom-left-radius": "2.2rem",
      "border-top-right-radius": "2.2rem",
    },
    ".style-primary-xl": {
      "border-bottom-left-radius": "4.4rem",
      "border-top-right-radius": "4.4rem",
    },
  };

  // 4) State / Color Utilities (Success, Danger, Edit)
  const stateUtilities = {
    ".btn-success": {
      "background-color": "rgb(34 197 94)",
      border: "1px solid rgb(34 197 94)",
      color: "white",
      "&:hover": {
        "background-color": "rgba(34, 197, 94, 0.6)",
      },
    },
    ".btn-warn": {
      "background-color": "rgb(207 243 51)",
      border: "1px solid rgb(207 243 51)",
      color: "white",
      "&:hover": {
        "background-color": "rgba(207, 243, 51, 0.6)",
      },
    },
    ".btn-edit": {
      "background-color": "rgb(59 130 246)",
      border: "1px solid rgb(59 130 246)",
      color: "white",
      "&:hover": {
        "background-color": "rgba(59, 130, 246, 0.6)",
      },
    },
  };

  // Input size utilities
  const inputSizeUtilities = {
    ".input-sm": {
      padding: "0.5rem 0.5rem 0.625rem 0.5rem",
      "font-size": "0.75rem",
    },
    ".input-md": {
      padding: "0.75rem 1rem",
      "font-size": "0.875rem",
    },
    ".input-lg": {
      padding: "0.875rem 1.5rem",
      "font-size": "1rem",
    },
    ".input-xl": {
      padding: "1rem 2rem 1.25rem 2rem",
      "font-size": "1.125rem",
    },
  };

  // Custom input color utilities
  const inputStateUtilities = {
    ".input-primary": {
      "border-color": "rgb(0 70 19)",
      color: "rgb(0 70 19)",
      opacity: "0.7",
      "&:focus": {
        opacity: "1",
      },
    },
    ".input-success": {
      "border-color": "rgb(34 197 94)",
      color: "rgb(34 197 94)",
      opacity: "0.7",
      "&:focus": {
        opacity: "1",
      },
    },
    ".input-danger": {
      "border-color": "rgb(210 105 59)",
      color: "rgb(210 105 59)",
      opacity: "0.7",
      "&:focus": {
        opacity: "1",
      },
    },
    ".input-edit": {
      "border-color": "rgb(59 130 246)",
      color: "rgb(59 130 246)",
      opacity: "0.7",
      "&:focus": {
        opacity: "1",
      },
    },
    ".input-warn": {
      "border-color": "rgb(207 243 51)",
      color: "rgb(207 243 51)",
      opacity: "0.7",
      "&:focus": {
        opacity: "1",
      },
    },
  };

  // Match utilities for dynamic styles
  matchUtilities(
    {
      "input-outline": (value) => ({
        border: `2px solid ${value}`,
        borderBottomWidth: `4px`,
        color: value,
        backgroundColor: "transparent",
        transition: "opacity 0.2s ease-in-out",
        "&::placeholder": {
          color: value,
        },
        "&:focus": {
          borderColor: value,
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  matchUtilities(
    {
      "btn-outline": (value) => ({
        position: "relative",
        overflow: "hidden",
        backgroundColor: "transparent",
        border: `2px solid ${value}`,
        borderBottomWidth: `4px`,
        color: value,
        transition: "border-color 0.4s ease-in-out",
        zIndex: 1,

        "& > *": {
          position: "relative",
          zIndex: 1,
          color: "inherit",
          transition: "color 0.4s ease-in-out",
        },

        "&::before": {
          content: '""',
          position: "absolute",
          top: "0",
          left: "0",
          width: "100%",
          height: "100%",
          backgroundColor: value,
          transform: "translateY(100%)",
          transition: "transform 0.4s ease-in-out",
          zIndex: -1,
        },

        "&:hover": {
          "& > *": {
            color: theme("colors.white") || "#fff",
          },
        },

        "&:hover::before": {
          transform: "translateY(0)",
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  matchUtilities(
    {
      btn: (value) => ({
        backgroundColor: value,
        borderColor: value,
        color: "#fff",
        border: `2px solid ${value}`,
        borderBottomWidth: `4px`,
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  // Hover button styles
  matchUtilities(
    {
      "btn-outline-hover-text": (value) => ({
        "&:hover": {
          color: value,
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  // Hover background color utilities
  matchUtilities(
    {
      "btn-outline-hover-bg": (value) => ({
        "&:hover": {
          backgroundColor: value,
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  // Checkbox classes
  const checkboxBase = {
    ".checkbox": {
      appearance: "none",
      outline: "none",
      cursor: "pointer",
      position: "relative",
      transition: "colors 0.2s",
      padding: "0.25rem",
      "border-top-right-radius": "0.75rem",
      "border-bottom-left-radius": "0.75rem",
    },
  };

  // Match utilities for dynamic backgrounds
  matchUtilities(
    {
      "checkbox-bg": (value) => ({
        border: `2px solid ${value}`,
        "&:checked": {
          backgroundColor: value,
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  matchUtilities(
    {
      "checkbox-hover-bg": (value) => ({
        "&:hover": {
          backgroundColor: value,
        },
      }),
    },
    { values: flattenColorPalette(theme("colors")) }
  );

  // Button slide utilities
  addUtilities({
    ".btn-slide": {
      "transition-property": "transform",
      "transition-duration": "400ms",
      "transition-timing-function": "ease-in-out",
      "&:not(:hover)": {
        transform: "translate(0, 0)",
      },
    },
  });

  // Button slide directional variants
  matchUtilities(
    {
      "btn-slide": (value) => {
        const directions = {
          right: "6px, 0",
          left: "-6px, 0",
          top: "0, -6px",
          bottom: "0, 6px",
        };

        const translateValue = directions[value] || value;

        return {
          "&:hover": {
            transform: `translate(${translateValue})`,
          },
        };
      },
    },
    {
      values: {
        right: "right",
        left: "left",
        top: "top",
        bottom: "bottom",
      },
    }
  );

  // Button group utilities
  addUtilities({
    ".btn-group": {
      display: "flex",
      "align-items": "center",
      "& > .btn": {
        "&:not(:last-child)": {
          "border-right": "1px solid rgba(255, 255, 255, 0.2)",
        },
        "&:hover": {
          transform: "translateY(-1px)",
          "box-shadow": "0 2px 4px rgba(0,0,0,0.1)",
        },
        "&:active": {
          transform: "translateY(0)",
        },
      },
      "& > .btn-icon": {
        "border-radius": "0",
        "&:hover": {
          transform: "scale(1.05)",
        },
      },
    },
  });

  // Button tooltip utilities
  addUtilities({
    ".btn-tooltip": {
      position: "relative",
      "&:hover .tooltip": {
        visibility: "visible",
        opacity: "1",
      },
      "& .tooltip": {
        visibility: "hidden",
        position: "absolute",
        padding: "4px 8px",
        backgroundColor: "#333",
        color: "#fff",
        fontSize: "12px",
        whiteSpace: "nowrap",
        opacity: "0",
        transition: "all 0.2s ease",
        zIndex: "10",
        "&:after": {
          content: '""',
          position: "absolute",
          borderWidth: "4px",
          borderStyle: "solid",
        },
      },
    },
    ".btn-tooltip-top": {
      "& .tooltip": {
        bottom: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginBottom: "8px",
        "&:after": {
          top: "100%",
          left: "50%",
          marginLeft: "-4px",
          borderColor: "#333 transparent transparent transparent",
        },
      },
    },
    ".btn-tooltip-bottom": {
      "& .tooltip": {
        top: "100%",
        left: "50%",
        transform: "translateX(-50%)",
        marginTop: "8px",
        "&:after": {
          bottom: "100%",
          left: "50%",
          marginLeft: "-4px",
          borderColor: "transparent transparent #333 transparent",
        },
      },
    },
    ".btn-tooltip-left": {
      "& .tooltip": {
        right: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginRight: "8px",
        "&:after": {
          left: "100%",
          top: "50%",
          marginTop: "-4px",
          borderColor: "transparent transparent transparent #333",
        },
      },
    },
    ".btn-tooltip-right": {
      "& .tooltip": {
        left: "100%",
        top: "50%",
        transform: "translateY(-50%)",
        marginLeft: "8px",
        "&:after": {
          right: "100%",
          top: "50%",
          marginTop: "-4px",
          borderColor: "transparent #333 transparent transparent",
        },
      },
    },
  });

  // Button badge utilities
  addUtilities({
    ".btn-badge": {
      position: "relative",
      "& .badge": {
        position: "absolute",
        top: "-0.5rem",
        right: "-0.5rem",
        width: "2rem",
        height: "1.4rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: "6px",
      },
    },
  });

  // Button loading animation
  addUtilities({
    ".btn-loading-infinity": {
      "&::after": {
        content: '""',
        display: "inline-block",
        width: "1em",
        height: "1em",
        border: "2px solid currentColor",
        borderRightColor: "transparent",
        borderRadius: "50%",
        animation: "spin 1s linear infinite",
        marginLeft: "0.5em",
      },
    },
  });

  // Add all utilities
  addUtilities(checkboxBase);
  addUtilities(styleSizeUtilities);
  addUtilities(inputStateUtilities);
  addUtilities(inputUtilities);
  addUtilities(inputSizeUtilities);
  addUtilities(newUtilities);
  addUtilities(btnUtilities);
  addUtilities(sizeUtilities);
  addUtilities(iconSizeUtilities);
  addUtilities(stateUtilities);
}

module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: "#014710",
        sec2: "#015516",
        warn: "#CFF333",
        success: "#22C55E",
        edit: "#3B82F6",
        danger: "#D2693B",
      },
      backgroundImage: {
        // define "second" as a gradient
        second: "linear-gradient(to right, #015516, #014710)",
        second2: "linear-gradient(to right, #014710, #0B4F1C, #014710)",
      },
      animation: {
        spin: "spin 1s linear infinite",
        glow: "glow 1.5s infinite", // Apply the 'glow' keyframes with duration and iteration
      },
      keyframes: {
        spin: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-100%)" },
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 10px #F5B82E" }, // Start and end glow
          "50%": { boxShadow: "0 0 20px #F5B82E" }, // Peak glow
        },
      },
      zIndex: {
        base: 0,
        overlay: 10,
        tooltip: 20,
        modal: 30,
      },
    },
  },
  plugins: [addVariablesForColors, customUtilitiesPlugin],
};


// https://i.ibb.co/d0BF2n09/Whats-App-Image-2025-10-10-at-10-48-46-18ca6a5f.jpg