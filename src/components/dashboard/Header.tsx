import React, { useState, useEffect, useRef } from 'react';
import { Bell, Settings, Search, X, Loader2, ExternalLink, LogOut, User, FileText, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { askMedicalQuestion, MedicalResponse } from '../../services/geminiApiService';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<MedicalResponse | null>(null);
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Handle click outside to close results and profile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    if (showResults || showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults, showProfileMenu]);

  const handleLogout = () => {
    console.log('Logging out...');
    setShowProfileMenu(false);
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      e.preventDefault();
      await performSearch();
    }
  };

  const performSearch = async () => {
    if (!searchQuery.trim()) return;

    // Cancel any previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setShowResults(true);
    setSearchResult(null);

    try {
      const result = await askMedicalQuestion(searchQuery);

      // Check if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      setSearchResult(result);
    } catch (error) {
      // Don't set error if request was aborted
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }

      console.error('Search failed:', error);
      setSearchResult({
        answer: "An error occurred while searching. Please try again.",
        source: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatMarkdown = (text: string): string => {
    // Basic markdown to HTML conversion
    return text
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
  };

  // Clear results when search query changes
  useEffect(() => {
    if (!searchQuery.trim()) {
      setShowResults(false);
      setSearchResult(null);
    }
  }, [searchQuery]);

  return (
    <header className="w-full max-md:max-w-full max-md:mt-10">
      <div className="flex w-full items-center justify-between gap-5 max-md:flex-col max-md:items-stretch max-md:gap-4">
        {/* Left Notifications */}
        <div className="flex items-center pl-6 max-md:justify-center max-md:pl-0 max-md:order-2">
          <button className="bg-[rgba(26,27,32,1)] flex items-center gap-3 px-4 py-3 rounded-[36px] hover:bg-[rgba(36,37,42,1)] transition-colors">
            <Bell className="w-[21px] h-[21px] text-white" />
            <span className="text-white text-lg font-normal">Notifications</span>
          </button>
        </div>

        {/* Centered Search Bar */}
        <div className="flex-1 max-w-[600px] max-md:mx-0 max-md:max-w-full max-md:order-3 relative" ref={searchRef}>
          <div className="bg-[rgba(26,27,32,1)] flex items-center gap-3 text-[21px] text-[rgba(203,204,209,1)] font-normal pl-[27px] pr-[27px] py-[18px] rounded-[36px] max-md:px-5">
            <Search className="w-6 h-6 text-[rgba(203,204,209,1)]" />
            <input
              type="text"
              placeholder="Ask Flux.io anything"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[rgba(203,204,209,1)] placeholder-[rgba(203,204,209,1)]"
            />
            {isLoading && <Loader2 className="w-5 h-5 animate-spin text-[rgba(203,204,209,1)]" />}
          </div>

          {/* Search Results Dropdown */}
          {showResults && (
            <div className="absolute z-50 w-full max-w-[600px] mt-2 bg-[rgba(26,27,32,1)] rounded-[20px] border border-[rgba(36,37,42,1)] shadow-2xl overflow-hidden">
              <div className="p-4">
                {searchResult ? (
                  <div>
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="text-white text-lg font-medium">Medical Research Response</h3>
                      <button
                        onClick={() => {
                          setShowResults(false);
                          setSearchResult(null);
                          setSearchQuery('');
                        }}
                        className="text-[rgba(203,204,209,1)] hover:text-white transition-colors"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-[rgba(203,204,209,1)] text-base leading-relaxed mb-4 prose prose-invert max-w-none"
                         dangerouslySetInnerHTML={{ __html: formatMarkdown(searchResult.answer) }}>
                    </div>
                    {searchResult.source && searchResult.source.length > 0 && (
                      <div className="border-t border-[rgba(36,37,42,1)] pt-3">
                        <p className="text-[rgba(203,204,209,1)] text-sm mb-2">Sources:</p>
                        <div className="space-y-1">
                          {searchResult.source.map((src, idx) => (
                            <a
                              key={idx}
                              href={src}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-sm transition-colors"
                            >
                              <ExternalLink className="w-3 h-3" />
                              <span className="truncate">{src}</span>
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-[rgba(203,204,209,1)] text-center py-8">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3" />
                    <p>Searching medical literature...</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right User Profile */}
        <div className="relative flex items-center gap-3 text-white pr-8 max-md:gap-2 max-md:pr-0" ref={profileRef}>
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img
              src="https://api.builder.io/api/v1/image/assets/8db776b9454a43dcb87153b359c694ad/86424b5c1fe3cde9a22ae1043b230b6d1f8c873f?placeholderIfAbsent=true"
              alt="User avatar"
              className="w-[61px] h-[61px] rounded-[50px] object-cover max-md:w-[50px] max-md:h-[50px]"
            />
            <div className="flex flex-col max-md:hidden">
              <div className="text-lg font-normal">
                Naya Rachel
              </div>
              <div className="text-sm font-light text-[rgba(203,204,209,1)]">
                rachel@stanford.edu
              </div>
            </div>
            <ChevronDown className="w-4 h-4 text-[rgba(203,204,209,1)] max-md:hidden" />
          </button>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 top-full mt-2 w-64 bg-[rgba(26,27,32,1)] rounded-2xl border border-[rgba(64,66,73,1)] shadow-2xl overflow-hidden z-50">
              <div className="p-2">
                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(36,37,42,1)] transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[rgba(20,21,25,1)] rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Profile</div>
                    <div className="text-gray-400 text-xs">View your profile</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(36,37,42,1)] transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[rgba(20,21,25,1)] rounded-full flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">Settings</div>
                    <div className="text-gray-400 text-xs">Manage preferences</div>
                  </div>
                </button>

                <button
                  onClick={() => {
                    navigate('/settings');
                    setShowProfileMenu(false);
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(36,37,42,1)] transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-[rgba(20,21,25,1)] rounded-full flex items-center justify-center">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-white font-medium text-sm">License</div>
                    <div className="text-gray-400 text-xs">View license info</div>
                  </div>
                </button>

                <div className="border-t border-[rgba(64,66,73,1)] my-2"></div>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-red-900/20 transition-colors text-left"
                >
                  <div className="w-10 h-10 bg-red-900/30 rounded-full flex items-center justify-center">
                    <LogOut className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <div className="text-red-500 font-medium text-sm">Log Out</div>
                    <div className="text-gray-400 text-xs">Sign out of your account</div>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};