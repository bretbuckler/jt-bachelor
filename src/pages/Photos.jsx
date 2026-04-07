import { useState, useEffect } from "react";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

export default function Photos() {
  const { user, profile } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "photos"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPhotos(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;
    setUploading(true);

    const storageRef = ref(storage, `photos/${Date.now()}_${selectedFile.name}`);
    await uploadBytes(storageRef, selectedFile);
    const url = await getDownloadURL(storageRef);

    await addDoc(collection(db, "photos"), {
      url,
      caption: caption.trim(),
      authorName: profile?.displayName || user.email,
      authorUid: user.uid,
      createdAt: serverTimestamp(),
    });

    setCaption("");
    setSelectedFile(null);
    setUploading(false);
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
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                className="text-sm text-charcoal/60 mb-2"
              />
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Caption (optional)"
                className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
              />
            </div>
            <button
              type="submit"
              disabled={!selectedFile || uploading}
              className="py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none disabled:opacity-50 hover:brightness-110 transition-all whitespace-nowrap"
            >
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </form>

        {/* Gallery Grid */}
        {photos.length === 0 ? (
          <p className="text-center text-charcoal/40 text-sm py-16 font-serif italic">
            No photos yet. The gallery awaits its first contribution.
          </p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="group relative aspect-square rounded-xl overflow-hidden cursor-pointer bg-cream-dark"
                onClick={() => setLightbox(photo)}
              >
                <img
                  src={photo.url}
                  alt={photo.caption || "Photo"}
                  className="w-full h-full object-cover transition-transform group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <p className="text-white text-xs font-semibold m-0">{photo.authorName}</p>
                    {photo.caption && (
                      <p className="text-white/70 text-[11px] m-0 mt-0.5 line-clamp-2">{photo.caption}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
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
