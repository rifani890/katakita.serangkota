"use client";

import { useEffect, useState, useRef } from "react";
import { Rocket } from "lucide-react";

type ButtonState = "hide-up" | "hide-down" | "show";

export default function ScrollButton() {
  const [buttonState, setButtonState] = useState<ButtonState>("hide-up");
  const [modalOpen, setModalOpen] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      // 1. Tombol TERSEMBUNYI (terbang ke atas layar) saat posisi scroll < 100px
      if (currentScrollY < 100) {
        setButtonState("hide-up");
        lastScrollY.current = currentScrollY;
        return;
      }

      const diff = currentScrollY - lastScrollY.current;

      // 2. Tombol TERSEMBUNYI (turun ke bawah layar) saat user sedang scroll ke BAWAH
      if (diff > 15) {
        setButtonState("hide-down");
        lastScrollY.current = currentScrollY;
      }
      // 3. Tombol MUNCUL saat user scroll ke ATAS (minimal 15px perubahan arah)
      else if (diff < -15) {
        setButtonState("show");
        lastScrollY.current = currentScrollY;
      }
    };

    // Deteksi modal terbuka via MutationObserver pada body.style.overflow
    const observer = new MutationObserver(() => {
      setModalOpen(document.body.style.overflow === "hidden");
    });

    observer.observe(document.body, {
      attributes: true,
      attributeFilter: ["style"],
    });

    window.addEventListener("scroll", handleScroll, { passive: true });

    // Pengecekan awal saat pertama dimuat
    handleScroll();

    // Membersihkan event listener saat komponen unmount
    return () => {
      window.removeEventListener("scroll", handleScroll);
      observer.disconnect();
    };
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Menentukan class berdasarkan state animasi
  const getDynamicStyles = () => {
    if (modalOpen) return "opacity-0 pointer-events-none scale-75";
    switch (buttonState) {
      case "hide-up":
        return "-translate-y-[200px] scale-50 opacity-0 pointer-events-none";
      case "hide-down":
        return "translate-y-[100px] scale-50 opacity-0 pointer-events-none";
      case "show":
        return "translate-y-0 scale-100 opacity-100 pointer-events-auto";
      default:
        return "";
    }
  };

  return (
    <button
      onClick={scrollToTop}
      className={`fixed bottom-6 right-6 z-[90] p-4 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/40 hover:shadow-xl hover:shadow-blue-500/50 transition-all duration-700 ease-[cubic-bezier(0.25,0.1,0.25,1)] outline-none group ${getDynamicStyles()}`}
      aria-label="Kembali ke atas"
    >
      <Rocket
        size={24}
        className="transform -rotate-45 transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110"
      />
    </button>
  );
}
