import demoCoverImage from "../assets/images/university_library_reading_room_1789861136286.jpg";
import cover0 from "../assets/images/0.jpeg";
import cover2 from "../assets/images/2.jpeg";
import cover3 from "../assets/images/3.jpeg";
import cover4 from "../assets/images/4.jpeg";
import cover5 from "../assets/images/5.jpeg";
import cover6 from "../assets/images/6.jpeg";
import cover7 from "../assets/images/7.jpeg";
import cover8 from "../assets/images/8.jpeg";
import cover9 from "../assets/images/9.jpeg";
import cover11 from "../assets/images/11.jpeg";
import cover22 from "../assets/images/22.jpeg";
import cover33 from "../assets/images/33.jpeg";
import cover44 from "../assets/images/44.jpeg";
import cover53 from "../assets/images/53.jpeg";
import cover55 from "../assets/images/55.jpeg";
import cover57 from "../assets/images/57.jpeg";
import coverWhatsApp1 from "../assets/images/WhatsApp Image 2026-09-23 at 17.59.36.jpeg";
import coverWhatsApp2 from "../assets/images/WhatsApp Image 2026-09-23 at 18.00.21.jpeg";
import { BookCoverTheme } from "../types";

export const DEMO_CATALOG_COVER = demoCoverImage;
export const BOOK_COVER_IMAGES = [
  cover0,
  cover2,
  cover3,
  cover4,
  cover5,
  cover6,
  cover7,
  cover8,
  cover9,
  cover11,
  cover22,
  cover33,
  cover44,
  cover53,
  cover55,
  cover57,
  coverWhatsApp1,
  coverWhatsApp2,
  demoCoverImage,
];

export function getBookCoverImageForIndex(index: number): string {
  if (!BOOK_COVER_IMAGES.length) return DEMO_CATALOG_COVER;
  return BOOK_COVER_IMAGES[Math.abs(index) % BOOK_COVER_IMAGES.length];
}

// Palette conforms strictly to:
// "Pick each cover from a limited neutral set (charcoal, slate, stone, off-white, plus occasionally the teal) using a hash of the title; serif title on the cover, author beneath, a thin spine line and subtle texture."
const NEUTRAL_COVER_SETS: BookCoverTheme[] = [
  // 0. Charcoal
  {
    bg: "#1C1C1E",
    text: "#F5F5F4",
    subtext: "#A1A1A1",
    spine: "#2C2C2E",
    accent: "rgba(255, 255, 255, 0.12)",
  },
  // 1. Slate
  {
    bg: "#262B30",
    text: "#F8FAFC",
    subtext: "#94A3B8",
    spine: "#333A42",
    accent: "rgba(255, 255, 255, 0.1)",
  },
  // 2. Stone
  {
    bg: "#2A2826",
    text: "#FAF8F5",
    subtext: "#A8A29E",
    spine: "#3A3835",
    accent: "rgba(255, 255, 255, 0.08)",
  },
  // 3. Off-white / Academic Linen (Dark text)
  {
    bg: "#EFEFED",
    text: "#171717",
    subtext: "#525252",
    spine: "#DCDCD9",
    accent: "rgba(0, 0, 0, 0.06)",
  },
  // 4. Quiet Academic Teal
  {
    bg: "#0A2826",
    text: "#F0FDFA",
    subtext: "#5EEAD4",
    spine: "#11423F",
    accent: "rgba(45, 212, 191, 0.2)",
  },
  // 5. Deep Graphite
  {
    bg: "#18181B",
    text: "#FAFAFA",
    subtext: "#A1A1AA",
    spine: "#27272A",
    accent: "rgba(255, 255, 255, 0.12)",
  },
];

export function getCoverThemeForTitle(title: string): BookCoverTheme {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = (hash << 5) - hash + title.charCodeAt(i);
    hash |= 0;
  }
  const index = Math.abs(hash) % NEUTRAL_COVER_SETS.length;
  return NEUTRAL_COVER_SETS[index];
}

export function truncateAddress(address: string, digits = 4): string {
  if (!address) return "";
  if (address.length <= digits * 2 + 2) return address;
  return `${address.substring(0, digits + 2)}...${address.substring(address.length - digits)}`;
}

export function formatUnixDate(seconds: number): string {
  if (!seconds || seconds === 0) return "—";
  const date = new Date(seconds * 1000);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatUnixDateTime(seconds: number): string {
  if (!seconds || seconds === 0) return "—";
  const date = new Date(seconds * 1000);
  return `${date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  })} · ${date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
