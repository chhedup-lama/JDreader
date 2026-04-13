import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero */}
      <div className="text-center max-w-2xl mx-auto mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-blue-100">
          <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span>
          Powered by Claude AI
        </div>

        <h1 className="text-5xl font-bold text-slate-900 leading-tight mb-4 tracking-tight">
          Your personal<br />
          <span className="text-blue-600">job application copilot</span>
        </h1>

        <p className="text-lg text-slate-500 leading-relaxed mb-8 max-w-lg mx-auto">
          Paste a job description. Get a tailored CV, cover letter, ATS analysis,
          and outreach messages — grounded entirely in your real experience.
        </p>

        <div className="flex gap-3 justify-center">
          <Link
            href="/apply"
            className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-xl transition-colors shadow-sm text-sm"
          >
            Start an Application
          </Link>
          <Link
            href="/profile"
            className="border border-slate-200 hover:border-slate-300 bg-white text-slate-700 hover:text-slate-900 font-semibold px-6 py-3 rounded-xl transition-all text-sm shadow-sm"
          >
            Set Up My Profile
          </Link>
        </div>
      </div>

      {/* Steps */}
      <div className="grid grid-cols-3 gap-5 w-full max-w-3xl">
        {[
          {
            step: "01",
            title: "Build your profile",
            desc: "Add your experiences, achievements, skills, and cover letter preferences once.",
            icon: (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            ),
          },
          {
            step: "02",
            title: "Paste a job description",
            desc: "AI analyzes the JD, extracts requirements, and matches your experience.",
            icon: (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            step: "03",
            title: "Get your pack",
            desc: "Tailored CV, cover letter, ATS score, and outreach messages ready to copy.",
            icon: (
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
            ),
          },
        ].map((item) => (
          <div
            key={item.step}
            className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              {item.icon}
            </div>
            <div className="text-xs font-bold text-slate-400 tracking-widest mb-1">
              STEP {item.step}
            </div>
            <div className="font-semibold text-slate-800 mb-2">{item.title}</div>
            <div className="text-sm text-slate-500 leading-relaxed">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
