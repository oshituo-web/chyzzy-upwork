import React, { useState } from 'react';

const App = () => {
  const KNOWLEDGE_BASE_PROPOSALS = `
    Sample 1:
    Client Summary: The client needs a React developer to build a new e-commerce front-end. They require expertise in Redux for state management and Next.js for server-side rendering.
    Proposal Draft: "Hi [Client Name], I'm a senior React developer with 5+ years of experience in building high-performance e-commerce sites. My expertise in Redux and Next.js aligns perfectly with your requirements. I'm confident I can deliver a fast, scalable, and user-friendly storefront. Let's chat about your project goals."

    Sample 2:
    Client Summary: A startup is looking for a Python/Django developer to build the back-end for their new social media app. Key features include user authentication, a news feed, and a messaging system.
    Proposal Draft: "Hello! As a Python/Django expert with a track record of building robust back-end systems, I was excited to see your project. I've built similar social media features before, including authentication, feeds, and real-time messaging. I'm available to start immediately and can quickly get up to speed on your project."

    Sample 3:
    Client Summary: The client wants to migrate their existing WordPress site to a headless CMS (Contentful) and a static site generator (Gatsby). They need someone with experience in both technologies.
    Proposal Draft: "Hi there, I specialize in headless CMS migrations and have extensive experience with Contentful and Gatsby. I can help you move your content seamlessly and build a blazing-fast, modern website. I've helped several clients with similar projects, resulting in improved performance and easier content management. I'd love to learn more about your specific needs."
  `;

  const PROPOSAL_SCHEMA = {
    type: "object",
    properties: {
      clientSummary: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 2,
        maxItems: 3,
        description: "A summary of the client's needs in 2-3 bullet points."
      },
      proposalDraft: {
        type: "string",
        description: "The main proposal text, written in a professional and engaging tone."
      },
      suggestedSkills: {
        type: "array",
        items: {
          type: "string"
        },
        minItems: 5,
        description: "A list of at least 5 relevant skills for the job."
      }
    },
    required: ["clientSummary", "proposalDraft", "suggestedSkills"]
  };

  const SYSTEM_PROMPT = `
    You are an Expert Upwork Proposal Assistant. Your task is to generate a compelling proposal based on the user's job description.
    Use the following knowledge base of successful proposals to inform your writing style and structure:
    ${KNOWLEDGE_BASE_PROPOSALS}
    The output must be a JSON object that strictly adheres to the following schema:
    ${JSON.stringify(PROPOSAL_SCHEMA)}
  `;

  const [jobDescription, setJobDescription] = useState('');
  const [userInput, setUserInput] = useState('');
  const [proposalData, setProposalData] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);

  const generateProfileImage = async (skillsArray) => {
    const prompt = `Minimalist icon logo for a freelance developer specializing in ${skillsArray.join(', ')}`;
    console.log("Image prompt:", prompt);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cGF0aCBkPSJNNTAsMkE0OCw0OCwwLDEsMSwyLDUwLDQ4LDQ4LDAsMCwxLDUwLDJaIiBmaWxsPSIjY2RjZGMiLz48cGF0aCBkPSJNNzMsMjZsLTMzLDMzTDMxLDcwLDMwLDY5bC0xLTFMMjgsNjdsLTgtOGExLjQsMS40LDAsMCwxLDAtMmw4LThhMS40LDEuNCwwLDAsMSwyLDBsOCw4LDIsMi0yLDItOCw4LTMsM0wzMSw2MmwyLTMsNy03LDMzLTMzYTEuNCwxLjQsMCwwLDEsMiwwbDgsOGExLjQsMS40LDAsMCwxLDAsMloiIGZpbGw9IiM0MjQyNDIiLz48L3N2Zz4=";
  };

  const handleGenerateProposal = async () => {
    setLoading(true);
    setError('');
    setProposalData(null);
    setProfileImage(null);

    try {
      if (!jobDescription.trim()) {
        throw new Error('Job description cannot be empty.');
      }

      console.log("User input:", userInput);
      await new Promise(resolve => setTimeout(resolve, 2000));
      const mockApiResponse = {
        clientSummary: [
          "Client needs a frontend developer for an e-commerce site.",
          "Requires expertise in React and Tailwind CSS.",
          "The project involves building responsive UI components."
        ],
        proposalDraft: `Hi [Client Name],\n\nI am a skilled React developer with extensive experience in building beautiful and responsive e-commerce websites using Tailwind CSS. I have a keen eye for design and a commitment to writing clean, efficient code.\n\nI am confident that I can deliver a high-quality solution that meets your requirements. I am available to discuss the project further at your convenience. (User input: ${userInput})`,
        suggestedSkills: ["React", "Tailwind CSS", "JavaScript", "HTML5", "CSS3", "E-commerce", "Responsive Design"]
      };

      setProposalData(mockApiResponse);

      const image = await generateProfileImage(mockApiResponse.suggestedSkills);
      setProfileImage(image);

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (proposalData && proposalData.proposalDraft) {
      navigator.clipboard.writeText(proposalData.proposalDraft);
      setShowToast(true);
      setTimeout(() => {
        setShowToast(false);
      }, 3000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
      <div className="w-full max-w-4xl mx-auto bg-white rounded-2xl shadow-lg p-6 sm:p-8 relative space-y-8">
        {showToast && (
          <div className="absolute top-5 right-5 bg-green-500 text-white py-2 px-4 rounded-lg shadow-md animate-fade-in-out">
            Copied to clipboard!
          </div>
        )}
        <header className="text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-800">
            Upwork Proposal AI Helper
          </h1>
          <p className="text-slate-500 mt-2">Paste a job description to generate a tailored proposal in seconds.</p>
        </header>

        <main className="space-y-6">
          <div className="space-y-2">
            <label htmlFor="job-description" className="block text-slate-700 font-medium">
              Paste Job Description Here:
            </label>
            <textarea
              id="job-description"
              className="w-full h-60 p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-150 resize-y"
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste the full job description from Upwork..."
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="user-input" className="block text-slate-700 font-medium">
              Additional Instructions (Optional):
            </label>
            <input
              id="user-input"
              type="text"
              className="w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-shadow duration-150"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="e.g., Emphasize my experience in e-commerce"
            />
          </div>

          <div className="text-center pt-2">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:cursor-not-allowed transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
              type="button"
              onClick={handleGenerateProposal}
              disabled={loading}
            >
              {loading ? 'Generating...' : 'Generate Proposal'}
            </button>
          </div>
        </main>

        {error && (
          <div className="mt-6 p-4 bg-red-100 text-red-700 border border-red-200 rounded-lg text-center">
            <p><span className="font-bold">Error:</span> {error}</p>
          </div>
        )}

        {loading && (
            <div className="mt-6 text-center text-slate-600">
                <p>Analyzing job description and generating your proposal...</p>
            </div>
        )}

        {proposalData && !error && (
          <section className="mt-10 pt-8 border-t border-slate-200 space-y-8">
            <header>
                <h2 className="text-2xl sm:text-3xl font-bold text-center text-slate-800">
                Generated Proposal & Insights
                </h2>
            </header>
            <div className="bg-slate-50/80 rounded-lg p-6 space-y-6">
              <div className="flex flex-col sm:flex-row items-start gap-6">
                {profileImage && (
                  <img src={profileImage} alt="Generated Profile Icon" className="w-24 h-24 sm:w-28 sm:h-28 rounded-full border-4 border-white shadow-md shrink-0" />
                )}
                <div className="flex-grow">
                  <h3 className="font-bold text-lg text-slate-700 mb-2">Client Summary:</h3>
                  <ul className="list-disc list-inside space-y-1 text-slate-600">
                    {proposalData.clientSummary.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-700">Proposal Draft:</h3>
                <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">{proposalData.proposalDraft}</p>
              </div>

              <div className="space-y-2">
                <h3 className="font-bold text-lg text-slate-700">Suggested Skills:</h3>
                <div className="flex flex-wrap gap-2">
                  {proposalData.suggestedSkills.map((skill, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm font-semibold px-3 py-1 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="text-center pt-4">
              <button
                className="bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-8 rounded-lg focus:outline-none focus:ring-4 focus:ring-green-300 transition-all duration-200 ease-in-out transform hover:scale-105 shadow-md hover:shadow-lg"
                type="button"
                onClick={copyToClipboard}
              >
                Copy Proposal Draft
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default App;
