"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import { Navigation, Pagination, Thumbs } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

interface ProductGalleryProps {
  images: { id: string; url: string }[];
  name: string;
}

/**
 * Takekare-style gallery: main Swiper carousel + thumbnail strip + click-to-
 * zoom modal. Tap-to-toggle zoom in the modal supports pan via transformOrigin.
 */
export function ProductGallery({ images, name }: ProductGalleryProps) {
  const [selectedUrl, setSelectedUrl] = useState(images[0]?.url ?? "");
  const [thumbsSwiper, setThumbsSwiper] = useState<SwiperType | null>(null);
  const [showZoomModal, setShowZoomModal] = useState(false);
  const [zoomImageIndex, setZoomImageIndex] = useState(0);
  const [zoomSwiperIndex, setZoomSwiperIndex] = useState(0);
  const [zoomStates, setZoomStates] = useState<
    Record<number, { isZoomed: boolean; origin: { x: number; y: number } }>
  >({});
  const mainSwiperRef = useRef<SwiperType | null>(null);
  const zoomScale = 2;

  if (images.length === 0) {
    return (
      <div className="aspect-square w-full overflow-hidden rounded-2xl brand-gradient opacity-20" />
    );
  }

  const openZoom = (index: number) => {
    setZoomImageIndex(index);
    setZoomSwiperIndex(index);
    setShowZoomModal(true);
    document.body.style.setProperty("overflow", "hidden");
  };

  const closeZoom = () => {
    setShowZoomModal(false);
    document.body.style.removeProperty("overflow");
  };

  const handleThumbClick = (url: string, index: number) => {
    setSelectedUrl(url);
    mainSwiperRef.current?.slideTo(index);
  };

  const handleZoomImageClick = (
    e: React.MouseEvent<HTMLDivElement, MouseEvent>,
    imgIdx: number,
  ) => {
    if (imgIdx !== zoomSwiperIndex) return;
    const rect = e.currentTarget?.getBoundingClientRect();
    if (!rect) return;
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setZoomStates((prev) => {
      const current = prev[imgIdx];
      return current?.isZoomed
        ? { ...prev, [imgIdx]: { isZoomed: false, origin: { x: 50, y: 50 } } }
        : { ...prev, [imgIdx]: { isZoomed: true, origin: { x, y } } };
    });
  };

  const toggleZoomButton = () => {
    setZoomStates((prev) => {
      const current = prev[zoomSwiperIndex];
      return current?.isZoomed
        ? { ...prev, [zoomSwiperIndex]: { isZoomed: false, origin: { x: 50, y: 50 } } }
        : { ...prev, [zoomSwiperIndex]: { isZoomed: true, origin: { x: 50, y: 50 } } };
    });
  };

  return (
    <div className="space-y-3 md:space-y-4">
      {/* Main carousel */}
      <div className="relative h-[45vh] md:h-[65vh] w-full bg-gray-100 rounded-lg overflow-hidden">
        <Swiper
          modules={[Navigation, Pagination, Thumbs]}
          navigation={{ prevEl: ".swiper-button-prev", nextEl: ".swiper-button-next" }}
          pagination={{ clickable: true }}
          className="h-full w-full [--swiper-navigation-size:12px] [&_.swiper-button-next]:!w-4 [&_.swiper-button-next]:!h-4 [&_.swiper-button-prev]:!w-4 [&_.swiper-button-prev]:!h-4"
          onSwiper={(s) => {
            mainSwiperRef.current = s;
          }}
          thumbs={{ swiper: thumbsSwiper }}
        >
          {images.map((image, index) => (
            <SwiperSlide key={image.id}>
              <div
                className="relative h-full w-full cursor-zoom-in"
                onClick={() => openZoom(index)}
              >
                <Image
                  src={image.url}
                  alt={name}
                  fill
                  priority={index === 0}
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-contain"
                />
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      {/* Thumbnail strip */}
      {images.length > 1 && (
        <div className="h-20 w-full">
          <Swiper
            onSwiper={setThumbsSwiper}
            spaceBetween={10}
            slidesPerView="auto"
            watchSlidesProgress
            modules={[Thumbs]}
            className="h-full"
          >
            {images.map((image, index) => (
              <SwiperSlide key={image.id} className="!w-20">
                <button
                  type="button"
                  onClick={() => handleThumbClick(image.url, index)}
                  className={`relative h-16 w-16 md:h-20 md:w-20 border-2 rounded cursor-pointer ${
                    selectedUrl === image.url ? "border-primary" : "border-gray-200"
                  }`}
                  aria-label={`View image ${index + 1}`}
                >
                  <Image
                    src={image.url}
                    alt=""
                    fill
                    sizes="80px"
                    className="object-cover rounded"
                  />
                </button>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* Zoom modal */}
      {showZoomModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex flex-col items-center justify-center p-4">
          <div className="absolute top-4 right-4 z-10 flex gap-2">
            <button
              type="button"
              onClick={toggleZoomButton}
              className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              title={zoomStates[zoomSwiperIndex]?.isZoomed ? "Zoom out" : "Zoom in"}
            >
              {zoomStates[zoomSwiperIndex]?.isZoomed ? (
                <ZoomOut className="h-6 w-6" />
              ) : (
                <ZoomIn className="h-6 w-6" />
              )}
            </button>
            <button
              type="button"
              onClick={closeZoom}
              className="bg-black/40 text-white p-2 rounded-full hover:bg-black/60"
              aria-label="Close zoom"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="w-full h-full max-w-4xl max-h-[80vh] relative">
            <Swiper
              initialSlide={zoomImageIndex}
              onSlideChange={(swiper) => setZoomSwiperIndex(swiper.activeIndex)}
              modules={[Navigation, Pagination]}
              navigation={{ prevEl: ".swiper-button-prev", nextEl: ".swiper-button-next" }}
              pagination={{ clickable: true }}
              className="h-full w-full [--swiper-navigation-size:12px] [&_.swiper-button-next]:!w-4 [&_.swiper-button-next]:!h-4 [&_.swiper-button-prev]:!w-4 [&_.swiper-button-prev]:!h-4"
            >
              {images.map((image, idx) => (
                <SwiperSlide key={image.id}>
                  <div
                    className="relative h-full w-full flex items-center justify-center"
                    onClick={(e) => handleZoomImageClick(e, idx)}
                    style={{ cursor: zoomStates[idx]?.isZoomed ? "zoom-out" : "zoom-in" }}
                  >
                    <Image
                      src={image.url}
                      alt={name}
                      fill
                      sizes="(max-width: 768px) 100vw, 80vw"
                      priority
                      className="object-contain"
                      style={
                        zoomStates[idx]?.isZoomed
                          ? {
                              transform: `scale(${zoomScale})`,
                              transformOrigin: `${zoomStates[idx].origin.x}% ${zoomStates[idx].origin.y}%`,
                              transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)",
                            }
                          : { transition: "transform 0.3s cubic-bezier(0.4,0,0.2,1)" }
                      }
                    />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>

            <div className="swiper-button-prev absolute left-4 top-1/2 z-10 -translate-y-1/2">
              <button type="button" className="text-white p-2" aria-label="Previous">
                <ChevronLeft className="h-2 w-2" />
              </button>
            </div>
            <div className="swiper-button-next absolute right-4 top-1/2 z-10 -translate-y-1/2">
              <button type="button" className="text-white p-2 hover:bg-black/60" aria-label="Next">
                <ChevronRight className="h-2 w-2" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
