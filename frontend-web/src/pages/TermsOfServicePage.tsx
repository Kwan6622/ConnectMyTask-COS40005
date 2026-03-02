import React from 'react';

export const TermsOfServicePage: React.FC = () => {
  const lastUpdated = new Date().toLocaleDateString();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="relative overflow-hidden rounded-3xl border border-gray-100 bg-white/95 backdrop-blur-sm shadow-xl">
          <div className="absolute inset-0">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
            <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-indigo-200/30 blur-3xl" />
          </div>

          <div className="relative p-8 md:p-10">
            <div className="flex items-start justify-between gap-6 flex-wrap">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 border border-blue-200 rounded-full text-blue-700 text-sm font-medium mb-6">
                  <span className="inline-flex h-2 w-2 rounded-full bg-blue-600" />
                  Terms of Service
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Clear terms for using ConnectMyTask
                </h1>
                <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                  A short summary of the key rules, responsibilities, and restrictions for clients and providers.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-gray-100 bg-white/70 px-5 py-4">
                <div className="text-xs text-gray-500">Last updated</div>
                <div className="text-sm font-semibold text-gray-900">{lastUpdated}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-10">
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <div className="text-sm font-semibold text-gray-900">Accounts</div>
                <div className="text-sm text-gray-600 mt-1">Keep info accurate & secure</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-green-50 p-5">
                <div className="text-sm font-semibold text-gray-900">Tasks & bids</div>
                <div className="text-sm text-gray-600 mt-1">Post fairly, bid responsibly</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-5">
                <div className="text-sm font-semibold text-gray-900">Payments</div>
                <div className="text-sm text-gray-600 mt-1">Follow payment rules</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-gray-50 p-5">
                <div className="text-sm font-semibold text-gray-900">Prohibited use</div>
                <div className="text-sm text-gray-600 mt-1">No fraud, abuse, or misuse</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mt-10">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Eligibility</h2>
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                      You must be able to form a legally binding contract and follow applicable laws when using the platform.
                    </div>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Accounts</h2>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                      <li>Keep your login details confidential and secure.</li>
                      <li>Provide accurate information and keep it up to date.</li>
                      <li>You are responsible for activity on your account.</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Tasks, bids, and content</h2>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                      <li>Clients should describe tasks clearly and set reasonable budgets and deadlines.</li>
                      <li>Providers should submit bids honestly and communicate respectfully.</li>
                      <li>Do not post illegal, harmful, or misleading content.</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Payments</h2>
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                      Payment terms can vary per task. When payment features are enabled, you agree to follow fee rules,
                      payment timelines, and any dispute processes.
                    </div>
                  </section>
                </div>
              </div>

              <aside className="lg:col-span-1">
                <div className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                  <h3 className="text-sm font-bold text-gray-900">Prohibited conduct</h3>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">No fraud or abuse</div>
                      <div className="text-sm text-gray-600">Do not scam, harass, or impersonate others.</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">No security misuse</div>
                      <div className="text-sm text-gray-600">Do not attempt to bypass or attack systems.</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">Respect others</div>
                      <div className="text-sm text-gray-600">Follow laws and third-party rights.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="text-sm font-bold text-gray-900">Disclaimer</div>
                  <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                    The platform is provided “as is”. We don’t guarantee outcomes of tasks, provider performance, or uninterrupted access.
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white/70 p-6">
                  <div className="text-sm font-bold text-gray-900">Questions?</div>
                  <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                    Contact support if you need clarification on these terms.
                  </div>
                </div>
              </aside>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
