const REQUIRED_ENV_VARS = [
  "MONGODB_URI",
  "ACCESS_TOKEN_SECRET",
  "REFRESH_TOKEN_SECRET",
  "ACCESS_TOKEN_EXPIRY",
  "REFRESH_TOKEN_EXPIRY",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_API_KEY",
  "CLIENT_URL",
];

const validateEnv = () => {
  const missing = REQUIRED_ENV_VARS.filter(
    (key) => !process.env[key] || process.env[key].trim() === ""
  );

  if (missing.length > 0) {
    console.error(
      `❌  Missing required environment variables:\n   ${missing.join("\n   ")}`
    );
    process.exit(1);
  }
};

export { validateEnv };
