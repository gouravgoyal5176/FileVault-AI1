import { useState, useEffect } from 'react';
import { apiRequest } from '../api/apiClient';
import {
  HelpCircle,
  MessageSquare,
  LifeBuoy,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Send,
  Clock,
  RefreshCw,
  FileQuestion
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SupportTicket {
  id: string;
  subject: string;
  category: 'ACCOUNT_PROBLEM' | 'LOGIN_PROBLEM' | 'FILE_UPLOAD_PROBLEM' | 'FILE_SHARING_PROBLEM' | 'SECURITY_CONCERN' | 'OTHER';
  description: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  updatedAt: string;
}

const FAQ_ITEMS = [
  {
    question: 'How do I upload an encrypted file to my vault?',
    answer: 'Navigate to "My Vault" or click the "Upload File" button in the sidebar. Select your target file (up to 50MB per file, 2GB cumulative quota). FileVault AI automatically encrypts your file client-side using AES-256-GCM envelope encryption before storing it in MinIO object storage.',
  },
  {
    question: 'How does FileVault AI envelope encryption work?',
    answer: 'Each uploaded file is encrypted with a unique Data Encryption Key (DEK) using AES-256-GCM. The DEK is then wrapped/encrypted using a Key Encryption Key (KEK) derived from your master vault password. Even system administrators cannot decrypt your stored files without your key.',
  },
  {
    question: 'How do I share a file with another user?',
    answer: 'Click the "Share" icon next to any file in your vault. Enter the recipient\'s registered email address and select either VIEW (metadata preview & detail inspection) or DOWNLOAD (full decrypted payload stream) permission. You can optionally set an expiration date.',
  },
  {
    question: 'What is the difference between VIEW and DOWNLOAD permissions?',
    answer: 'VIEW permission allows the recipient to inspect cryptographic metadata and file attributes, but prevents downloading or streaming the decrypted payload. DOWNLOAD permission allows full streaming of the decrypted file content.',
  },
  {
    question: 'Why can\'t a recipient download a shared file?',
    answer: 'If the share permission is set to VIEW ONLY, downloading is strictly blocked by backend security enforcement. If the share has expired, access is automatically revoked.',
  },
  {
    question: 'What happens if I forget my master vault password?',
    answer: 'Due to zero-knowledge cryptographic design, FileVault AI does not store your master key in plaintext. If you lose access to your account, submit a support ticket under "Login Problem" or "Account Problem". An administrator can review your identity and reset your account status according to system security policy.',
  },
  {
    question: 'How do I permanently delete my vault account?',
    answer: 'Go to Settings → Account → Danger Zone → Delete Account. To prevent accidental deletion, you must type "DELETE" into the confirmation modal. Upon deletion, all your active sessions, refresh tokens, and database records are permanently purged.',
  },
];

export function SupportCenter() {
  const [activeTab, setActiveTab] = useState<'faq' | 'contact' | 'history'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  // Form State
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState<'ACCOUNT_PROBLEM' | 'LOGIN_PROBLEM' | 'FILE_UPLOAD_PROBLEM' | 'FILE_SHARING_PROBLEM' | 'SECURITY_CONCERN' | 'OTHER'>('ACCOUNT_PROBLEM');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Ticket History State
  const [myTickets, setMyTickets] = useState<SupportTicket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(false);

  const fetchMyTickets = async () => {
    setLoadingTickets(true);
    try {
      const data = await apiRequest<{ tickets: SupportTicket[] }>('/api/support/my-tickets');
      setMyTickets(data.tickets || []);
    } catch {
      setMyTickets([]);
    } finally {
      setLoadingTickets(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchMyTickets();
    }
  }, [activeTab]);

  const handleSubmitTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !description.trim()) {
      setSubmitError('Please fill out all required fields.');
      return;
    }

    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);

    try {
      await apiRequest('/api/support/tickets', {
        method: 'POST',
        body: JSON.stringify({
          subject: subject.trim(),
          category,
          description: description.trim(),
        }),
      });

      setSubmitSuccess('Your support ticket has been submitted successfully. Our team will review your request.');
      setSubject('');
      setDescription('');
      setCategory('ACCOUNT_PROBLEM');
      fetchMyTickets();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit support ticket.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
        return 'bg-[#121829] text-indigo-300 border-indigo-500/30';
      case 'IN_PROGRESS':
        return 'bg-[#121829] text-amber-300 border-amber-500/30';
      case 'RESOLVED':
        return 'bg-[#121829] text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-[#121829] text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6 font-sans text-white dark:text-white light:text-slate-900">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#0B0F20] via-[#0E1328] to-[#070914] dark:from-[#0B0F20] dark:via-[#0E1328] dark:to-[#070914] light:from-white light:via-slate-50 light:to-indigo-50/40 border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl light:shadow-md light:shadow-slate-200/50 relative overflow-hidden">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 rounded-2xl border border-indigo-500/30 shadow-md">
            <LifeBuoy className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-white dark:text-white light:text-slate-900 tracking-tight">Support &amp; Help Center</h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Browse FAQs, inspect system documentation, or request administrator support</p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 pb-3">
        <button
          onClick={() => setActiveTab('faq')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'faq'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <HelpCircle className="w-4 h-4" />
          <span>Help &amp; FAQs</span>
        </button>

        <button
          onClick={() => setActiveTab('contact')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'contact'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Contact Support</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition cursor-pointer ${
            activeTab === 'history'
              ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
              : 'bg-[#0B0F1E] dark:bg-[#0B0F1E] light:bg-white text-slate-400 dark:text-slate-400 light:text-slate-700 hover:text-white dark:hover:text-white light:hover:text-slate-900 border border-slate-800 dark:border-slate-800 light:border-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>My Tickets History</span>
        </button>
      </div>

      {/* FAQ Tab Content */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-300 dark:text-slate-300 light:text-slate-800 flex items-center gap-2">
              <FileQuestion className="w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Frequently Asked Questions
            </h3>

            <div className="space-y-3">
              {FAQ_ITEMS.map((faq, index) => {
                const isOpen = openFaqIndex === index;
                return (
                  <div
                    key={index}
                    className="border border-slate-800 dark:border-slate-800 light:border-slate-200 rounded-2xl bg-[#121829] dark:bg-[#121829] light:bg-slate-50 overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                      className="w-full p-4 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-800/50 dark:hover:bg-slate-800/50 light:hover:bg-slate-100 transition-colors"
                    >
                      <span className="font-bold text-xs sm:text-sm text-white dark:text-white light:text-slate-900 flex items-center gap-2.5">
                        <span className="w-2 h-2 rounded-full bg-indigo-400 dark:bg-indigo-400 light:bg-indigo-600 shrink-0" />
                        {faq.question}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
                          isOpen ? 'rotate-180 text-indigo-400 dark:text-indigo-400 light:text-indigo-600' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="px-4 pb-4 text-xs text-slate-300 dark:text-slate-300 light:text-slate-700 leading-relaxed font-sans border-t border-slate-800/60 dark:border-slate-800/60 light:border-slate-200 pt-3"
                        >
                          {faq.answer}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Contact Support Form Tab */}
      {activeTab === 'contact' && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 sm:p-8 shadow-xl light:shadow-md light:shadow-slate-200/50 max-w-2xl space-y-6">
          <div>
            <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base tracking-tight flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> Submit Support Request
            </h3>
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">An administrator will review your ticket and update its status</p>
          </div>

          {submitSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 dark:text-emerald-300 light:text-emerald-800 text-xs rounded-2xl flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{submitSuccess}</span>
            </div>
          )}

          {submitError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/30 text-rose-300 dark:text-rose-300 light:text-rose-800 text-xs rounded-2xl flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <form onSubmit={handleSubmitTicket} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 dark:text-slate-300 light:text-slate-700">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl text-xs text-white dark:text-white light:text-slate-900 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="ACCOUNT_PROBLEM">Account &amp; Registration Issue</option>
                <option value="LOGIN_PROBLEM">Login &amp; Authentication Issue</option>
                <option value="FILE_UPLOAD_PROBLEM">File Upload &amp; Encryption Issue</option>
                <option value="FILE_SHARING_PROBLEM">File Sharing &amp; Permissions Issue</option>
                <option value="SECURITY_CONCERN">Security &amp; Threat Concern</option>
                <option value="OTHER">Other Query</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 dark:text-slate-300 light:text-slate-700">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Brief summary of your issue..."
                className="w-full px-4 py-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-extrabold text-slate-300 dark:text-slate-300 light:text-slate-700">Description</label>
              <textarea
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your issue in detail..."
                className="w-full px-4 py-2.5 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 rounded-xl text-xs text-white dark:text-white light:text-slate-900 placeholder-slate-500 dark:placeholder-slate-500 light:placeholder-slate-400 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-200 cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{submitting ? 'Submitting...' : 'Submit Support Ticket'}</span>
            </button>
          </form>
        </div>
      )}

      {/* Ticket History Tab Content */}
      {activeTab === 'history' && (
        <div className="bg-[#0B0F1E]/80 dark:bg-[#0B0F1E]/80 light:bg-white backdrop-blur-xl border border-slate-800/80 dark:border-slate-800/80 light:border-slate-200/90 rounded-3xl p-6 shadow-xl light:shadow-md light:shadow-slate-200/50 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800/80 dark:border-slate-800/80 light:border-slate-200 pb-4">
            <div>
              <h3 className="font-extrabold text-white dark:text-white light:text-slate-900 text-base tracking-tight flex items-center gap-2">
                <Clock className="w-5 h-5 text-indigo-400 dark:text-indigo-400 light:text-indigo-600" /> My Ticket History ({myTickets.length})
              </h3>
              <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 font-medium">Track your submitted support tickets and resolution statuses</p>
            </div>
            <button
              onClick={fetchMyTickets}
              disabled={loadingTickets}
              className="p-2 bg-[#121829] dark:bg-[#121829] light:bg-slate-50 hover:bg-slate-800 dark:hover:bg-slate-800 light:hover:bg-slate-100 text-slate-300 dark:text-slate-300 light:text-slate-800 rounded-xl border border-slate-700/80 dark:border-slate-700/80 light:border-slate-200 transition cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 text-indigo-400 dark:text-indigo-400 light:text-indigo-600 ${loadingTickets ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loadingTickets ? (
            <p className="text-xs text-slate-400 dark:text-slate-400 light:text-slate-600 text-center py-8">Fetching your support tickets...</p>
          ) : myTickets.length === 0 ? (
            <div className="py-12 text-center text-slate-400 dark:text-slate-400 light:text-slate-600 space-y-2">
              <LifeBuoy className="w-10 h-10 text-slate-600 dark:text-slate-600 light:text-slate-400 mx-auto" />
              <p className="font-extrabold text-white dark:text-white light:text-slate-900 text-sm">No support tickets found</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 light:text-slate-600">Submit a ticket under "Contact Support" if you experience any issue.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-200 dark:text-slate-200 light:text-slate-800">
                <thead className="bg-[#0D1224] dark:bg-[#0D1224] light:bg-slate-100/90 border-b border-slate-800 dark:border-slate-800 light:border-slate-200 text-slate-400 dark:text-slate-400 light:text-slate-600 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Ticket ID</th>
                    <th className="py-3.5 px-4">Subject &amp; Category</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-4">Date Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 dark:divide-slate-800/60 light:divide-slate-200 font-sans">
                  {myTickets.map((ticket) => (
                    <tr key={ticket.id} className="hover:bg-slate-900/60 dark:hover:bg-slate-900/60 light:hover:bg-slate-100 transition-all">
                      <td className="py-3.5 px-4 font-mono text-slate-400 dark:text-slate-400 light:text-slate-500 text-[11px]">#{ticket.id.substring(0, 8)}</td>
                      <td className="py-3.5 px-4">
                        <p className="font-bold text-white dark:text-white light:text-slate-900 text-xs">{ticket.subject}</p>
                        <span className="text-[10px] text-slate-400 dark:text-slate-400 light:text-slate-500 font-medium uppercase tracking-wider">{ticket.category}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${getStatusBadge(ticket.status)}`}>
                          {ticket.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-400 dark:text-slate-400 light:text-slate-600">{new Date(ticket.createdAt).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
