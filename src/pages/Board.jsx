import { useState, useEffect, useRef } from "react";
import {
  collection, addDoc, onSnapshot, query, orderBy, serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase";
import { useAuth } from "../context/AuthContext";

const POST_TYPES = [
  { id: "bringing", label: "I'm Bringing...", color: "bg-emerald-100 text-emerald-800" },
  { id: "receipt", label: "Receipt / Reimbursement", color: "bg-amber-100 text-amber-800" },
  { id: "general", label: "General", color: "bg-blue-100 text-blue-800" },
];

export default function Board() {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [postType, setPostType] = useState("general");
  const [message, setMessage] = useState("");
  const [amount, setAmount] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileChange = (file) => {
    if (!file) {
      setImageFile(null);
      setImagePreviewUrl(null);
      return;
    }
    setImageFile(file);
    setImagePreviewUrl(URL.createObjectURL(file));
  };

  const clearImageFile = () => {
    setImageFile(null);
    setImagePreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const q = query(collection(db, "board_posts"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;
    setSubmitting(true);

    let imageUrl = null;
    if (imageFile) {
      const storageRef = ref(storage, `board/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      imageUrl = await getDownloadURL(storageRef);
    }

    await addDoc(collection(db, "board_posts"), {
      type: postType,
      message: message.trim(),
      amount: postType === "receipt" && amount ? parseFloat(amount) : null,
      imageUrl,
      authorName: profile?.displayName || user.email,
      authorUid: user.uid,
      createdAt: serverTimestamp(),
    });

    setMessage("");
    setAmount("");
    clearImageFile();
    setPostType("general");
    setShowForm(false);
    setSubmitting(false);
  };

  // Calculate reimbursement totals
  const receiptPosts = posts.filter((p) => p.type === "receipt" && p.amount);
  const totalSpent = receiptPosts.reduce((s, p) => s + p.amount, 0);
  const byPerson = receiptPosts.reduce((acc, p) => {
    acc[p.authorName] = (acc[p.authorName] || 0) + p.amount;
    return acc;
  }, {});

  return (
    <div>
      {/* Hero */}
      <div className="bg-pine">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <p className="text-gold/50 text-xs tracking-[0.2em] uppercase m-0 mb-3">
            Est. The Last Time Gary Forgot His Wallet
          </p>
          <h1 className="text-cream text-3xl md:text-4xl font-bold m-0">
            Gary's Ledger
          </h1>
          <p className="text-cream/40 text-sm mt-2 m-0 font-serif italic">
            All debts recorded. No debts forgiven.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        {/* Reimbursement Summary */}
        {receiptPosts.length > 0 && (
          <div className="bg-white rounded-xl border border-cream-dark p-6 mb-8">
            <h3 className="text-pine text-base font-bold m-0 mb-4">
              Reimbursement Ledger
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="bg-cream/50 rounded-xl p-4 text-center">
                <p className="text-charcoal/40 text-[10px] tracking-wider uppercase m-0 mb-1">Total Submitted</p>
                <p className="text-pine text-xl font-bold font-serif m-0">${totalSpent.toFixed(2)}</p>
              </div>
              {Object.entries(byPerson).map(([name, amt]) => (
                <div key={name} className="bg-cream/50 rounded-xl p-4 text-center">
                  <p className="text-charcoal/40 text-[10px] tracking-wider uppercase m-0 mb-1">{name}</p>
                  <p className="text-pine text-xl font-bold font-serif m-0">${amt.toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New Post Button */}
        <div className="mb-8">
          <button
            onClick={() => setShowForm(!showForm)}
            className="w-full py-4 bg-pine text-cream font-semibold text-sm rounded-xl cursor-pointer border-none hover:bg-pine-light transition-colors"
          >
            {showForm ? "Cancel" : "+ New Post"}
          </button>
        </div>

        {/* Post Form */}
        {showForm && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-cream-dark p-6 mb-8 animate-slide-down">
            <div className="flex gap-2 mb-4">
              {POST_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setPostType(t.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer transition-all ${
                    postType === t.id ? t.color + " ring-2 ring-pine/20" : "bg-cream text-charcoal/40"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={
                postType === "bringing" ? "What are you bringing? (e.g., 'A case of Miller Lite and my A-game')"
                : postType === "receipt" ? "What's this receipt for?"
                : "What's on your mind?"
              }
              rows={3}
              className="w-full p-3 border border-cream-dark rounded-xl text-sm resize-none bg-cream/30 mb-4"
            />

            {postType === "receipt" && (
              <div className="mb-4">
                <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full p-3 border border-cream-dark rounded-xl text-sm bg-cream/30"
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-charcoal/40 text-[11px] tracking-wider uppercase mb-2">
                {postType === "receipt" ? "Receipt Photo (optional)" : "Attach Image (optional)"}
              </label>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e.target.files[0])}
                className="hidden"
              />

              {!imageFile ? (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-2 border-dashed border-gold rounded-xl p-5 text-center cursor-pointer bg-gold/10 hover:bg-gold/20 hover:border-gold-dark transition-all"
                >
                  <svg className="w-8 h-8 mx-auto mb-2 text-pine" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 12v6m0-6l-2 2m2-2l2 2" />
                  </svg>
                  <p className="text-pine text-sm font-bold m-0">
                    {postType === "receipt" ? "Snap or choose a receipt photo" : "Click to choose an image"}
                  </p>
                  <p className="text-pine/60 text-[11px] mt-1 m-0">JPG, PNG, HEIC, etc.</p>
                </button>
              ) : (
                <div className="border-2 border-cream-dark rounded-xl p-4 bg-cream/20">
                  <div className="flex gap-4 items-start">
                    {imagePreviewUrl && (
                      <img
                        src={imagePreviewUrl}
                        alt="Preview"
                        className="w-20 h-20 object-cover rounded-lg border border-cream-dark shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-pine text-sm font-semibold m-0 truncate">{imageFile.name}</p>
                      <p className="text-charcoal/40 text-xs m-0 mt-1">
                        {(imageFile.size / (1024 * 1024)).toFixed(2)} MB
                      </p>
                      <button
                        type="button"
                        onClick={clearImageFile}
                        className="mt-2 text-xs text-red-600 hover:text-red-700 bg-transparent border-none cursor-pointer p-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={submitting || !message.trim()}
              className="py-3 px-8 bg-gradient-to-r from-gold to-gold-dark text-pine font-bold text-sm rounded-xl cursor-pointer border-none disabled:opacity-50 hover:brightness-110 transition-all"
            >
              {submitting ? "Posting..." : "Post to the Ledger"}
            </button>
          </form>
        )}

        {/* Posts */}
        <div className="space-y-4">
          {posts.length === 0 && (
            <p className="text-center text-charcoal/40 text-sm py-12 font-serif italic">
              The ledger is empty. Gary is thrilled. Be the first to post, you trailblazer.
            </p>
          )}
          {posts.map((post) => {
            const typeInfo = POST_TYPES.find((t) => t.id === post.type) || POST_TYPES[2];
            return (
              <div key={post.id} className="bg-white rounded-xl border border-cream-dark p-6">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-pine rounded-full flex items-center justify-center text-cream text-xs font-bold">
                      {(post.authorName || "?")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-pine text-sm font-semibold m-0">{post.authorName}</p>
                      <p className="text-charcoal/30 text-[11px] m-0">
                        {post.createdAt?.toDate?.()
                          ? post.createdAt.toDate().toLocaleDateString("en-US", {
                              month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
                            })
                          : "Just now"}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${typeInfo.color}`}>
                    {typeInfo.label}
                  </span>
                </div>
                <p className="text-charcoal/70 text-sm m-0 leading-relaxed">{post.message}</p>
                {post.amount && (
                  <p className="text-pine font-bold font-serif text-lg mt-2 m-0">
                    ${post.amount.toFixed(2)}
                  </p>
                )}
                {post.imageUrl && (
                  <img
                    src={post.imageUrl}
                    alt="Attached"
                    className="mt-3 rounded-lg max-w-full max-h-64 object-cover border border-cream-dark"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
