import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 8,
          background: "#2563EB",
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 64 64"
          fill="none"
        >
          <path
            d="M32 10C20.954 10 12 18.954 12 30C12 41.046 20.954 50 32 50C43.046 50 52 41.046 52 30C52 18.954 43.046 10 32 10ZM32 44C24.268 44 18 37.732 18 30C18 22.268 24.268 16 32 16C39.732 16 46 22.268 46 30C46 37.732 39.732 44 32 44Z"
            fill="white"
          />
          <path
            d="M40 25L29.5 35.5L24 30"
            stroke="white"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
