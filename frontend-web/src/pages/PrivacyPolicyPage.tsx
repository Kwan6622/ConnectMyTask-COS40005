import React from 'react';

export const PrivacyPolicyPage: React.FC = () => {
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
                  Privacy Policy
                </div>
                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 tracking-tight">
                  Privacy, in plain language
                </h1>
                <p className="text-gray-600 mt-3 max-w-2xl leading-relaxed">
                  A short summary of what we collect, why we collect it, and the controls you have.
                </p>
              </div>

              <div className="shrink-0 rounded-2xl border border-gray-100 bg-white/70 px-5 py-4">
                <div className="text-xs text-gray-500">Last updated</div>
                <div className="text-sm font-semibold text-gray-900">{lastUpdated}</div>
              </div>
            </div>

            <div className="grid md:grid-cols-4 gap-4 mt-10">
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-5">
                <div className="text-sm font-semibold text-gray-900">What we collect</div>
                <div className="text-sm text-gray-600 mt-1">Account, tasks, and usage data</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-emerald-50 to-green-50 p-5">
                <div className="text-sm font-semibold text-gray-900">How we use it</div>
                <div className="text-sm text-gray-600 mt-1">Operate, match, and improve</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-yellow-50 to-orange-50 p-5">
                <div className="text-sm font-semibold text-gray-900">How we share</div>
                <div className="text-sm text-gray-600 mt-1">Only when necessary</div>
              </div>
              <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-slate-50 to-gray-50 p-5">
                <div className="text-sm font-semibold text-gray-900">Your controls</div>
                <div className="text-sm text-gray-600 mt-1">Update and request deletion</div>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8 mt-10">
              <div className="lg:col-span-2">
                <div className="space-y-6">
                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Information we collect</h2>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                      <li>Account details (name, email, profile).</li>
                      <li>Task content you create (category, description, location, budget).</li>
                      <li>Basic usage data (e.g. pages visited, performance, security signals).</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">How we use information</h2>
                    <ul className="mt-3 space-y-2 text-sm text-gray-600 list-disc pl-5">
                      <li>Provide core features and customer support.</li>
                      <li>Match clients and providers and facilitate task completion.</li>
                      <li>Improve quality, safety, and fraud prevention.</li>
                    </ul>
                  </section>

                  <section className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                    <h2 className="text-lg font-bold text-gray-900">Sharing & retention</h2>
                    <div className="mt-3 text-sm text-gray-600 leading-relaxed">
                      We share information only when needed to operate the service (for example to complete a task),
                      with your direction, or when required by law. We keep data only as long as needed for legitimate
                      business and legal purposes.
                    </div>
                  </section>
                </div>
              </div>

              <aside className="lg:col-span-1">
                <div className="rounded-2xl border border-gray-100 bg-white/70 p-6">
                  <h3 className="text-sm font-bold text-gray-900">Your rights & choices</h3>
                  <div className="mt-3 space-y-3">
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">Update info</div>
                      <div className="text-sm text-gray-600">Edit your profile details anytime.</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">Delete account</div>
                      <div className="text-sm text-gray-600">Request deletion subject to requirements.</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-white px-4 py-3">
                      <div className="text-sm font-semibold text-gray-900">Contact support</div>
                      <div className="text-sm text-gray-600">Ask questions about this policy.</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50 p-6">
                  <div className="text-sm font-bold text-gray-900">Security note</div>
                  <div className="text-sm text-gray-600 mt-2 leading-relaxed">
                    We apply reasonable safeguards to protect data. No system is 100% secure, but we continuously
                    improve our security practices.
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
