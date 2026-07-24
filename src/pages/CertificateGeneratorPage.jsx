import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { Code, Trophy, Star, Activity } from 'lucide-react'; // Activity as placeholder for MedTrack logo

// The starting ID as requested by the user
const STARTING_ID_NUMBER = 9;

export default function CertificateGeneratorPage() {
  const [name, setName] = useState('Subhodeep Biswas');
  const [role, setRole] = useState('Project Admin');
  const [prs, setPrs] = useState('12');
  const [rank, setRank] = useState('Top 10%');
  const [idCounter, setIdCounter] = useState(STARTING_ID_NUMBER);
  const [isGenerating, setIsGenerating] = useState(false);

  const certificateRef = useRef(null);

  // Generate current ID string (e.g. MTK2026EC0009)
  const currentId = `MTK2026EC${String(idCounter).padStart(4, '0')}`;
  
  // Format current date like "23-Jul-2026"
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).replace(/ /g, '-');

  const handleDownload = async () => {
    if (!certificateRef.current) return;
    
    try {
      setIsGenerating(true);
      
      // Wait a tick for UI to settle
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const canvas = await html2canvas(certificateRef.current, {
        scale: 2, // High resolution
        useCORS: true,
        backgroundColor: '#ffffff'
      });
      
      const image = canvas.toDataURL('image/png');
      
      // Create a temporary link to download
      const link = document.createElement('a');
      link.href = image;
      link.download = `MedTrack_Certificate_${name.replace(/\s+/g, '_')}_${currentId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Increment the session ID counter AFTER successful download
      setIdCounter(prev => prev + 1);
      
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8 pt-32 pb-32 font-sans">
      <div className="max-w-[1400px] mx-auto">
        
        <div className="mb-8">
          <h1 className="text-3xl font-black text-gray-900 mb-2">ECSoC Certificate Generator</h1>
          <p className="text-gray-500">Internal admin tool to generate contribution certificates.</p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl mb-8 flex items-start shadow-sm">
          <div className="flex-1">
            <h3 className="text-amber-800 font-bold text-sm">⚠️ Session-Only IDs</h3>
            <p className="text-amber-700 text-sm mt-1">
              Certificate IDs are session-only and not checked for uniqueness across sessions. 
              The counter resets to {STARTING_ID_NUMBER} if this page is refreshed. For a verifiable, 
              collision-free numbering system, this would need a backend database.
            </p>
          </div>
        </div>

        <div className="flex flex-col xl:flex-row gap-12">
          
          {/* Left Column: Input Form */}
          <div className="w-full xl:w-1/3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-32">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Certificate Details</h2>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Contributor Name</label>
                  <input 
                    type="text" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                    placeholder="e.g. John Doe"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Role</label>
                  <input 
                    type="text" 
                    value={role} 
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                    placeholder="e.g. Contributor"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Successfully Merged PRs</label>
                  <input 
                    type="number" 
                    value={prs} 
                    onChange={(e) => setPrs(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                    placeholder="e.g. 12"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Elite Contributor Rank</label>
                  <input 
                    type="text" 
                    value={rank} 
                    onChange={(e) => setRank(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent font-medium"
                    placeholder="e.g. Top 10%"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex justify-between items-center mb-6">
                    <span className="text-sm font-medium text-gray-500">Next ID:</span>
                    <span className="text-sm font-black text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">{currentId}</span>
                  </div>

                  <button 
                    onClick={handleDownload}
                    disabled={isGenerating || !name || !role}
                    className="w-full py-3.5 bg-[#0f3d3e] hover:bg-[#0a2e2f] text-white font-bold rounded-xl transition-all shadow-lg shadow-teal-900/20 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isGenerating ? (
                      <>
                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Generating...
                      </>
                    ) : (
                      'Download as PNG'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="w-full xl:w-2/3 flex justify-center items-start bg-gray-200/50 p-8 rounded-3xl overflow-hidden border border-gray-200 relative">
            <div className="absolute inset-0 pattern-dots text-gray-300 opacity-50"></div>
            
            {/* 
              CERTIFICATE CONTAINER
              A4 Proportions approx 1 : 1.414 
              We use a fixed width and aspect ratio for consistent HTML2Canvas output 
            */}
            <div style={{ transform: 'scale(0.8)', transformOrigin: 'top center' }}>
              <div 
                ref={certificateRef}
                className="bg-white relative z-10 w-[794px] h-[1123px] shadow-2xl p-16 flex flex-col justify-between"
                style={{ 
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  color: '#1a1c1e'
                }}
              >
                {/* Border Line */}
                <div className="absolute inset-0 border-[6px] border-gray-100 m-4 rounded-xl pointer-events-none"></div>

                {/* Certificate Content Wrapper */}
                <div className="relative z-20 flex-1 flex flex-col">
                  
                  {/* Header: Logo */}
                  <div className="flex flex-col items-center mb-16 pt-8">
                    <div className="flex items-center gap-3 text-[#0f3d3e] mb-1">
                      {/* Placeholder Logo Box */}
                      <div className="w-16 h-16 bg-[#0f3d3e] rounded-b-[2rem] rounded-tl-[2rem] rounded-tr-md flex items-center justify-center text-white shadow-md relative">
                        <Activity size={32} strokeWidth={1.5} />
                        <div className="absolute top-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-[#0f3d3e] translate-x-1 -translate-y-1"></div>
                      </div>
                      <span className="text-5xl font-black tracking-tight" style={{ letterSpacing: '-0.03em' }}>MedTrack</span>
                    </div>
                    <p className="text-gray-500 font-medium text-lg tracking-wide">Smart Equipment. Stronger Care.</p>
                  </div>

                  {/* Date & ID Row */}
                  <div className="flex justify-between items-center mb-14 text-sm font-bold text-gray-800 tracking-wide px-4">
                    <p>Date: {formattedDate}</p>
                    <p>{currentId}</p>
                  </div>

                  {/* Title */}
                  <div className="text-center mb-16">
                    <h1 className="text-3xl font-black uppercase tracking-wider inline-block border-b-2 border-gray-900 pb-1">
                      Contribution Certificate
                    </h1>
                  </div>

                  {/* Body Paragraphs */}
                  <div className="px-8 space-y-10 text-[17px] leading-relaxed text-gray-800">
                    <p>
                      This is to certify that <span className="font-bold text-gray-900">{name || '[NAME]'}</span> has actively contributed as a <span className="font-bold text-gray-900">{role || '[ROLE]'}</span> in the <span className="font-bold text-gray-900">Elite Coders Summer of Code (ECSoC) 2026</span> program for our open source project <span className="font-bold text-gray-900">MedTrack</span>.
                    </p>
                    
                    <p>
                      During the entire summer of code, he/she has shown excellent leadership, dedication and commitment towards building and improving the project.
                    </p>
                  </div>

                  {/* Metric Rows */}
                  <div className="px-8 my-16 space-y-7">
                    <div className="flex items-center gap-5">
                      <div className="text-[#0f3d3e] border-2 border-[#0f3d3e] rounded-md p-1.5">
                        <Code size={20} strokeWidth={2.5} />
                      </div>
                      <p className="text-[17px]"><span className="font-bold text-gray-900">Successfully Merged PRs:</span> {prs || '0'}</p>
                    </div>
                    
                    <div className="flex items-center gap-5">
                      <div className="text-[#0f3d3e]">
                        <Trophy size={28} strokeWidth={2.5} />
                      </div>
                      <p className="text-[17px]"><span className="font-bold text-gray-900">Elite Contributor Rank:</span> {rank || 'N/A'}</p>
                    </div>

                    <div className="flex items-center gap-5">
                      <div className="text-[#0f3d3e]">
                        <Star size={28} strokeWidth={2.5} fill="#0f3d3e" />
                      </div>
                      <p className="text-[17px]"><span className="font-bold text-gray-900">Contribution:</span> Great contribution in the entire summer of code</p>
                    </div>
                  </div>

                  {/* Closing */}
                  <div className="px-8 space-y-12 text-[17px] leading-relaxed text-gray-800 flex-1">
                    <p>
                      We truly appreciate his/her valuable time, efforts and passion towards open source and the success of <span className="font-bold text-gray-900">MedTrack</span>.
                    </p>
                    
                    <div>
                      <p className="font-bold">Sincere Regards,</p>
                      <p className="font-bold mt-1">Thank you for your contribution!</p>
                    </div>
                  </div>

                  <div className="mt-auto pt-16">
                    <div className="w-full h-[1px] bg-gray-200 mb-6"></div>
                    
                    <div className="px-4 text-[13px] leading-relaxed text-gray-600 font-medium mb-12">
                      <span className="font-bold text-gray-900">Note:</span> This certificate is generated based on the participation in the open source project "MedTrack" during the Elite Coders Summer of Code (ECSoC) 2026 program from July 1 – August 31, 2026.
                    </div>

                    <div className="flex justify-between items-end px-4">
                      <p className="font-bold text-sm text-gray-800">Contributor: <span className="font-medium text-gray-600">{name || '[NAME]'}</span></p>
                      
                      {/* Placeholder ECSoC Logo */}
                      <div className="text-right">
                         <div className="inline-block px-4 py-2 border-2 border-gray-200 rounded-lg bg-gray-50 text-gray-400 font-bold text-xs uppercase tracking-wider">
                           ECSoC 2026 Logo
                         </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
