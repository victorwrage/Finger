
import React, { useState, useCallback, useRef } from 'react';
import { GoogleGenAI } from "@google/genai";

// Standard components for UI
const Button: React.FC<{
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
  type?: "button" | "submit";
}> = ({ onClick, disabled, className, children, type = "button" }) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {children}
  </button>
);

const App: React.FC = () => {
  const [image, setImage] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        setAnalysis(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeFingers = async () => {
    if (!image) return;

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
      
      // Extract base64 part
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [
          {
            parts: [
              { inlineData: { data: base64Data, mimeType: mimeType } },
              { text: "请仔细观察这张图片，数一数图中一共有几个手指头？请给出明确的数字，并简单描述你看到的手掌形态。 (Please carefully count how many fingers are in this image. Provide a clear count and briefly describe the hand configuration you see.)" }
            ]
          }
        ],
        config: {
          thinkingConfig: { thinkingBudget: 1000 }
        }
      });

      setAnalysis(response.text || "No analysis generated.");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to analyze the image. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setAnalysis(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-4xl mx-auto p-6 md:p-12">
      <header className="mb-12 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
          Finger Count AI
        </h1>
        <p className="text-slate-400 text-lg">
          Powered by Gemini Vision for precise anatomical analysis.
        </p>
      </header>

      <main className="space-y-8">
        {!image ? (
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-500 hover:bg-slate-800/50 transition-all group"
          >
            <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <svg className="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <p className="text-slate-300 font-medium">Click to upload an image of a hand</p>
            <p className="text-slate-500 text-sm mt-2">JPG, PNG, or WebP</p>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleImageUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-black border border-slate-800">
              <img src={image} alt="Uploaded" className="w-full h-auto object-contain max-h-[500px]" />
              <button 
                onClick={reset}
                className="absolute top-4 right-4 bg-red-500/80 hover:bg-red-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              {!analysis && !loading && (
                <div className="bg-slate-800/50 p-6 rounded-2xl border border-slate-700">
                  <h3 className="text-xl font-bold mb-4">Ready to count?</h3>
                  <p className="text-slate-400 mb-6 leading-relaxed">
                    AI will analyze the image to identify and count fingers, even in unusual configurations.
                  </p>
                  <Button 
                    onClick={analyzeFingers}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20"
                  >
                    Analyze Image
                  </Button>
                </div>
              )}

              {loading && (
                <div className="bg-slate-800/50 p-8 rounded-2xl border border-slate-700 flex flex-col items-center justify-center space-y-4">
                  <div className="w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  <p className="text-blue-400 font-medium animate-pulse">Gemini is thinking...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-900/20 p-6 rounded-2xl border border-red-900/50 text-red-400">
                  <p className="font-semibold mb-2">Analysis Failed</p>
                  <p className="text-sm">{error}</p>
                  <Button 
                    onClick={analyzeFingers} 
                    className="mt-4 text-xs bg-red-900/40 hover:bg-red-900/60 border border-red-800"
                  >
                    Retry
                  </Button>
                </div>
              )}

              {analysis && (
                <div className="bg-emerald-900/10 p-6 rounded-2xl border border-emerald-900/30 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="flex items-center space-x-2 mb-4">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                    <h3 className="text-emerald-400 font-bold uppercase tracking-wider text-sm">AI Analysis Result</h3>
                  </div>
                  <div className="prose prose-invert max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {analysis}
                  </div>
                  <Button 
                    onClick={reset}
                    className="mt-8 w-full bg-slate-700 hover:bg-slate-600 text-white text-sm"
                  >
                    Analyze New Image
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 pt-8 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2024 Visual Intelligence Lab • Powered by Gemini 3</p>
      </footer>
    </div>
  );
};

export default App;
