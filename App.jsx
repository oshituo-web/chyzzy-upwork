import React, { useState } from 'react';

// --- ICON DEFINITIONS (Replacing lucide-react with inline SVG) ---
const IconSend = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" x2="11" y1="2" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>);
const IconZap = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>);
const IconListChecks = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 11l-3 3l-2.5-2.5"/><path d="M11 4h10"/><path d="M11 8h10"/><path d="M11 12h10"/><path d="M2 4h4"/><path d="M2 8h4"/><path d="M2 12h4"/></svg>);
const IconDollarSign = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>);
const IconCopy = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="13" height="13" x="9" y="9" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>);
const IconLoader2 = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>);
const IconLink = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>);
const IconShield = (props) => (<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>);

// --- CONFIGURATION & API SETUP ---
// FIXED: Using standard Vite access method (import.meta.env.VITE_GEMINI_API_KEY) which works on Vercel.
// Added a final fallback for safety.
const API_KEY = 
    (typeof import.meta.env !== 'undefined' && import.meta.env.VITE_GEMINI_API_KEY) // Vercel/Vite environment
    || (typeof __api_key_from_context !== 'undefined' && __api_key_from_context) // Canvas environment
    || ""; // Default if not found anywhere
    
const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

// Define the required output structure for the Gemini API call.
const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    clientSummary: {
      type: "ARRAY",
      description: "2-3 highly concise bullet points summarizing the core client needs and deliverables.",
      items: { type: "STRING" }
    },
    proposalDraft: {
      type: "STRING",
      description: "A professional, persuasive proposal draft (150-250 words) that addresses all client needs and includes a final call to action. Use a friendly, experienced tone."
    },
    suggestedSkills: {
      type: "ARRAY",
      description: "A list of 5-8 relevant technical keywords/skills extracted from the job description.",
      items: { type: "STRING" }
    }
  },
  required: ["clientSummary", "proposalDraft", "suggestedSkills"],
  propertyOrdering: ["clientSummary", "proposalDraft", "suggestedSkills"]
};

/**
 * Custom hook to handle state for the proposal generator.
 */
const useProposalState = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [proposalData, setProposalData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  /**
   * Exponential backoff utility for retrying API calls.
   * @param {function} fn - The function to execute.
   * @param {number} maxRetries - Maximum number of retries.
   */
  const withExponentialBackoff = async (fn, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await fn();
      } catch (e) {
        if (attempt === maxRetries - 1) throw e;
        const delay = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  };

  /**
   * Calls the Gemini API to generate the structured proposal.
   */
  const generateProposal = async () => {
    if (!jobDescription.trim()) {
      setError("Please paste a job description to generate a proposal.");
      return;
    }

    // Check API Key
    if (!API_KEY) {
      setError("API Key is missing. Please ensure VITE_GEMINI_API_KEY is correctly set in your Vercel environment.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setProposalData(null);
    setCopied(false);

    // Prompt the model
    const systemPrompt = `You are a world-class AI designed to help highly-rated Upwork freelancers. Your task is to analyze the user's job description and return a structured JSON object containing a brief summary of client needs, a professional proposal draft, and a list of key skills. The proposal draft MUST be persuasive, professional, and directly address the key requirements mentioned in the job post. Do not add any introductory or concluding text outside of the JSON object.`;
    
    const userQuery = `Analyze the following job description and generate the structured proposal components:\n\n---JOB DESCRIPTION---\n${jobDescription}`;

    const payload = {
      contents: [{ parts: [{ text: userQuery }] }],
      systemInstruction: { parts: [{ text: systemPrompt }] },
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA
      }
    };

    try {
      const response = await withExponentialBackoff(async () => {
        const res = await fetch(`${API_URL}?key=${API_KEY}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (!res.ok) {
          const errorBody = await res.json();
          throw new Error(`API Request Failed: ${res.status} - ${errorBody.error?.message || res.statusText}`);
        }
        return res;
      });

      const result = await response.json();
      const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!text) {
        throw new Error("API returned no text content or an empty response.");
      }

      // Check for common error structure returned as JSON text
      if (text.startsWith('{') && text.includes('"error"')) {
          const errorObj = JSON.parse(text);
          throw new Error(`API Error: ${errorObj.error.message}`);
      }


      const parsedJson = JSON.parse(text);
      setProposalData(parsedJson);

    } catch (e) {
      console.error("API Error:", e);
      // Removed specific VITE_GEMINI_API_KEY mention here as the generic message is better if another API error occurs.
      setError(`Failed to generate proposal: ${e.message}. Please verify your API key and try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text) => {
    if (text) {
      // Use execCommand for broader compatibility in some browser contexts
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return {
    jobDescription,
    setJobDescription,
    proposalData,
    isLoading,
    error,
    copied,
    generateProposal,
    copyToClipboard
  };
};

// --- REACT COMPONENT ---

const App = () => {
  const {
    jobDescription,
    setJobDescription,
    proposalData,
    isLoading,
    error,
    copied,
    generateProposal,
    copyToClipboard
  } = useProposalState();

  const handleCopySection = (content, title) => {
    let textToCopy = '';
    if (Array.isArray(content)) {
      textToCopy = content.map(item => `• ${item}`).join('\n');
    } else if (typeof content === 'string') {
      textToCopy = content;
    } else {
      textToCopy = JSON.stringify(content, null, 2);
    }
    
    copyToClipboard(textToCopy);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-8 font-sans">
      <script src="https://cdn.tailwindcss.com"></script>
      <header className="text-center mb-8">
        <h1 className="4xl sm:text-5xl font-extrabold text-indigo-700 tracking-tight flex items-center justify-center">
          <IconZap className="w-8 h-8 mr-2 text-yellow-500" />
          Upwork Proposal AI Helper
        </h1>
        <p className="text-gray-600 mt-2 text-lg">
          Generate structured, high-conversion proposals using the Gemini API.
        </p>
      </header>

      <main className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* --- LEFT COLUMN: INPUT & CONTROLS --- */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 flex items-center">
                <IconSend className="w-5 h-5 mr-2 text-indigo-500" />
                Paste Job Description
              </h2>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                className="w-full h-80 p-4 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 transition duration-150 resize-none text-gray-700 text-sm shadow-inner"
                placeholder="Paste the full job post text from Upwork here..."
                disabled={isLoading}
              />
              <button
                onClick={generateProposal}
                disabled={isLoading || jobDescription.trim().length < 50}
                className={`w-full mt-4 flex items-center justify-center py-3 px-6 rounded-xl font-bold text-lg transition duration-300 transform shadow-md ${
                  isLoading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-xl active:scale-98'
                }`}
              >
                {isLoading ? (
                  <>
                    <IconLoader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <IconZap className="w-5 h-5 mr-2" />
                    Generate Proposal
                  </>
                )}
              </button>
            </div>
            
            {error && (
              <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow-md">
                <p className="font-bold">Error:</p>
                <p className="text-sm">{error}</p>
                {/* Specific instruction for Vercel users seeing the missing key error */}
                {error.includes("VITE_GEMINI_API_KEY") && (
                    <p className="text-xs mt-2 font-semibold">
                        **Action Required:** Please ensure you have set the **VITE_GEMINI_API_KEY** environment variable in your Vercel project settings, then **Redeploy**.
                    </p>
                )}
              </div>
            )}
            
            {copied && (
              <div className="p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg shadow-md text-center font-semibold">
                Content copied to clipboard!
              </div>
            )}

            <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-xl font-semibold text-gray-800 mb-3 flex items-center">
                    <IconDollarSign className="w-5 h-5 mr-2 text-green-500" />
                    Pricing & Budget Note
                </h3>
                <p className="text-sm text-gray-600">
                    Always review the client's stated budget. If they provided a range, suggest a middle ground. If they provided a fixed price, tailor your response to confirm your ability to deliver within that scope. The AI draft assumes you will insert specific numbers later.
                </p>
            </div>
          </div>

          {/* --- RIGHT COLUMN: OUTPUT & RESULTS --- */}
          <div className="lg:col-span-2 space-y-6">
            <ProposalSection
              title="Client Needs Summary"
              icon={IconListChecks}
              color="text-indigo-500"
              content={proposalData?.clientSummary || []}
              isLoading={isLoading}
              onCopy={() => handleCopySection(proposalData?.clientSummary, 'Client Summary')}
              placeholderText="The AI will summarize the 2-3 most critical deliverables after analysis."
              type="list"
            />

            <ProposalSection
              title="Proposal Draft (Ready to Send)"
              icon={IconSend}
              color="text-blue-500"
              content={proposalData?.proposalDraft || ''}
              isLoading={isLoading}
              onCopy={() => handleCopySection(proposalData?.proposalDraft, 'Proposal Draft')}
              placeholderText="A professional, 150-250 word draft, tailored to the client's request, will appear here."
              type="text"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <ProposalSection
                    title="Suggested Skills/Keywords"
                    icon={IconZap}
                    color="text-yellow-500"
                    content={proposalData?.suggestedSkills || []}
                    isLoading={isLoading}
                    onCopy={() => handleCopySection(proposalData?.suggestedSkills, 'Suggested Skills')}
                    placeholderText="Keywords like React, Tailwind, API, etc., will be extracted."
                    type="chips"
                />
                
                <PlaceholderCard />
            </div>

          </div>
        </div>
      </main>
      <footer className="mt-12 text-center text-gray-400 text-xs">
        <p>Powered by Gemini 2.5 Flash API</p>
      </footer>
    </div>
  );
};

// --- SUB-COMPONENTS ---

/**
 * Reusable component for displaying AI-generated sections.
 */
const ProposalSection = ({ title, icon: Icon, color, content, isLoading, onCopy, placeholderText, type }) => {
  // Determine if content is ready for display (non-null and not empty for arrays/strings)
  const isContentReady = content && (type === 'list' || type === 'chips' ? content.length > 0 : content.length > 0);

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[150px] flex flex-col">
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-xl font-bold flex items-center">
          <Icon className={`w-6 h-6 mr-2 ${color}`} />
          {title}
        </h3>
        <button
          onClick={onCopy}
          disabled={!isContentReady}
          className={`p-2 rounded-full transition duration-150 ${
            isContentReady
              ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-600'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
          }`}
          title="Copy to Clipboard"
        >
          <IconCopy className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-grow">
        {isLoading ? (
          <div className="flex items-center justify-center h-full text-indigo-500">
            <IconLoader2 className="w-6 h-6 animate-spin mr-2" />
            <span className="font-medium">Thinking...</span>
          </div>
        ) : isContentReady ? (
          type === 'list' ? (
            <ul className="list-disc pl-5 space-y-1 text-gray-700">
              {content.map((item, index) => (
                <li key={index} className="text-sm">{item}</li>
              ))}
            </ul>
          ) : type === 'chips' ? (
            <div className="flex flex-wrap gap-2">
              {content.map((item, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold shadow-sm"
                >
                  {item}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
          )
        ) : (
          <p className="text-gray-400 italic text-sm mt-2">{placeholderText}</p>
        )}
      </div>
    </div>
  );
};

/**
 * Placeholder card for profile logo/link.
 */
const PlaceholderCard = () => (
    <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 min-h-[150px] flex flex-col">
        <h3 className="text-xl font-bold flex items-center text-gray-800 mb-3">
            <IconLink className="w-6 h-6 mr-2 text-red-500" />
            Profile Quick Link
        </h3>
        <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-red-100 text-red-500 rounded-full flex items-center justify-center font-bold text-lg border-2 border-red-300">
                <IconShield className="w-6 h-6" />
            </div>
            <p className="text-gray-700 text-sm">
                Remember to manually add the Upwork job URL to your proposal and verify you included the client's required codeword!
            </p>
        </div>
        <a href="https://www.upwork.com/freelancers/~0123456789" target="_blank" rel="noopener noreferrer" className="mt-4 text-sm text-indigo-600 hover:text-indigo-800 font-semibold flex items-center">
            Go to Your Upwork Profile
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="ml-1"><path d="M7 17l9.2-9.2M17 1v10M17 7H7"/></svg>
        </a>
    </div>
);

export default App;
