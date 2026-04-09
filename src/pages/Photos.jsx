import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
  doc, deleteDoc,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp", "image/heic", "image/heif"];
const MAX_FILE_SIZE_MB = 15;

export default function Photos() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [brokenIds, setBrokenIds] = useState(new Set());
  const fileInputRef = useRef(null);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleFileSelect = (file) => {
    setError("");
    if (!file) return;

    // Block video files explicitly
    if (file.type.startsWith("video/")) {
      setError("Video files are not allowed. Please upload a photo only.");
      return;
    }

    // Whitelist image types
    if (!ALLOWED_TYPES.includes(file.type.toLowerCase())) {
      setError("Only JPG, PNG, GIF, WEBP, and HEIC images are allowed.");
      return;
    }

    // Size limit
    const sizeMB = file.size / (1024 * 1024);
    if (sizeMB > MAX_FILE_SIZE_MB) {
      setError(`File too large (${sizeMB.toFixed(1)} MB). Max size is ${MAX_FILE_SIZE_MB} MB.`);
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const clearFile = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);

    try {
      const storagePath = `photos/${Date.now()}_${selectedFile.name}`;
      const storageRef = ref(storage, storagePath);
      await uploadBytes(storageRef, selectedFile);
      const url = await getDownloadURL(storageRef);

      await addDoc(collection(db, "photos"), {
        url,
        storagePath,
        caption: caption.trim().slice(0, 200),
        authorName: profile?.displayName || user.email,
        authorUid: user.uid,
        createdAt: serverTimestamp(),
      });

      setCaption("");
      clearFile();
    } catch (err) {
      setError("Upload failed. Try again or check your connection.");
    }
    setUploading(false);
  };

  const handleImageError = (id) => {
    setBrokenIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  const handleDelete = async (photo) => {
    if (!user) return;
    if (!confirm("Delete this photo? This cannot be undone.")) return;

    // Try to remove the storage object first (ignore "not found" — orphan cleanup).
    if (photo.storagePath) {
      try {
        await deleteObject(ref(storage, photo.storagePath));
      } catch (err) {
        if (err?.code !== "storage/object-not-found") {
          console.error("Storage delete failed:", err);
        }
      }
    }

    try {
      await deleteDoc(doc(db, "photos", photo.id));
      if (lightbox?.id === photo.id) setLightbox(null);
    } catch (err) {
      console.error("Firestore delete failed:", err);
      alert("Couldn't delete this photo. Please try again.");
    }
  };

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Document the Evidence
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            Photo Gallery
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            What happens in Cherokee... gets uploaded here
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Upload Form */}
        <form onSubmit={handleUpload} className="bg-white rounded-xl border border-cream-dark p-6 mb-10">
          <h3 className="text-pine text-base font-bold m-0 mb-4">Upload a Photo</h3>

          {/* Hidden native input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp,image/heic,image/heif"
            onChange={(e) => handleFileSelect(e.target.files[0])}
            className="hidden"
          />

          {!selectedFile ? (
            /* File picker button (when no file selected) */
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full border-2 border-dashed border-gold rounded-xl p-8 text-center cursor-pointer bg-gold/10 hover:bg-gold/20 hover:border-gold-dark transition-all"
            >
              <svg className="w-12 h-12 mx-auto mb-3 text-pine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-pine text-base font-bold m-0">Click to choose a photo</p>
              <p className="text-pine/60 text-xs mt-1 m-0">JPG, PNG, GIF, WEBP, HEIC &middot; Max {MAX_FILE_SIZE_MB} MB &middot; No videos</p>
            </button>
          ) : (
            /* Preview (when file selected) */
            <div className="border-2 border-cream-dark rounded-xl p-4 bg-cream/20">
              <div className="flex gap-4 items-start">
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="w-24 h-24 object-cover rounded-lg border border-cream-dark shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-pine text-sm font-semibold m-0 truncate">{selectedFile.name}</p>
                  <p className="text-charcoal/40 text-xs m-0 mt-1">
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                  <button
                    type="button"
                    onClick={clearFile}
                    className="mt-2 text-xs text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer p-0"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          )}

          {error && (
            <p className="text-red-600 text-xs mt-3 mb-0 font-semibold">{error}</p>
          )}

          <input
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value.slice(0, 200))}
            placeholder="Caption (optional)"
            maxLength={200}
            className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30 mt-4"
          />

          <button
            type="submit"
            disabled={!selectedFile || uploading}
            className="w-full mt-4 py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none disabled:opacity-50 hover:brightness-110 transition-all"
          >
            {uploading ? "Uploading..." : "Upload Photo"}
          </button>
        </form>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <p className="text-center text-charcoal/40 text-sm py-16 font-serif italic">
            No photos yet. The gallery awaits its first contribution.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => {
              const isBroken = brokenIds.has(photo.id);

              if (isBroken) {
                return (
                  <div
                    key={photo.id}
                    className="relative aspect-square rounded-xl overflow-hidden bg-cream-dark/40 border border-cream-dark flex flex-col items-center justify-center p-3 text-center"
                  >
                    <p className="text-charcoal/50 text-[11px] font-semibold m-0">
                      Image unavailable
                    </p>
                    <p className="text-charcoal/40 text-[10px] m-0 mt-1 truncate w-full">
                      {photo.authorName}
                    </p>
                    {user && (
                      <button
                        type="button"
                        onClick={() => handleDelete(photo)}
                        className="mt-2 text-[11px] text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer p-0 font-semibold"
                      >
                        Remove entry
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div
                  key={photo.id}
                  className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-cream-dark"
                  onClick={() => setLightbox(photo)}
                >
                  <img
                    src={photo.url}
                    alt={photo.caption || "Photo"}
                    onError={() => handleImageError(photo.id)}
                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                  />
                  {user && user.uid === photo.authorUid && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(photo);
                      }}
                      className="absolute top-2 right-2 z-10 w-7 h-7 rounded-full bg-black/60 hover:bg-red-600 text-white text-sm flex items-center justify-center border-none cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete photo"
                      title="Delete photo"
                    >
                      &times;
                    </button>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="absolute bottom-0 left-0 right-0 p-3">
                      <p className="text-white text-xs font-semibold m-0">{photo.authorName}</p>
                      {photo.caption && (
                        <p className="text-white/70 text-[11px] m-0 mt-0.5 line-clamp-2">{photo.caption}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            className="absolute top-4 right-4 text-white/60 hover:text-white text-3xl bg-transparent border-none cursor-pointer"
            onClick={() => setLightbox(null)}
          >
            &times;
          </button>
          <div className="max-w-4xl max-h-[85vh] relative" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightbox.url}
              alt={lightbox.caption || "Photo"}
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
            <div className="mt-3 text-center">
              <p className="text-white text-sm font-semibold m-0">{lightbox.authorName}</p>
              {lightbox.caption && (
                <p className="text-white/60 text-xs m-0 mt-1">{lightbox.caption}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
