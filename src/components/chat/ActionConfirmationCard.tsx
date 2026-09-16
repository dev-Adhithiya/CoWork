import { useState } from 'react';
import { Mail, Calendar, Video, CheckCircle2, XCircle, Clock, Users, Send, ExternalLink, ShieldCheck } from 'lucide-react';
import type { ToolProposal } from '../../lib/api';

interface ActionConfirmationCardProps {
  proposal: ToolProposal;
  onConfirm: () => Promise<void>;
  onCancel: () => Promise<void>;
}

export function ActionConfirmationCard({ proposal, onConfirm, onCancel }: ActionConfirmationCardProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const isEmail = proposal.tool === 'send_email';
  const isCalendar = proposal.tool === 'create_calendar_event' || proposal.tool === 'schedule_meeting_with_meet';

  const handleConfirm = async () => {
    setIsProcessing(true);
    try {
      await onConfirm();
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = async () => {
    setIsProcessing(true);
    try {
      await onCancel();
    } finally {
      setIsProcessing(false);
    }
  };

  const attendeesList = Array.isArray(proposal.args.attendees)
    ? proposal.args.attendees.join(', ')
    : proposal.args.attendees || proposal.args.recipient || '';

  const formattedStart = proposal.args.start_time
    ? new Date(proposal.args.start_time).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : '';

  return (
    <div className="mt-3 overflow-hidden rounded-xl border border-white/15 bg-gradient-to-b from-white/[0.08] to-white/[0.02] shadow-2xl backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 bg-white/[0.03]">
        <div className="flex items-center gap-2.5">
          {isEmail ? (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/20 text-red-400 border border-red-500/30">
              <Mail className="h-4 w-4" />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/30">
              <Calendar className="h-4 w-4" />
            </div>
          )}
          <div>
            <h4 className="text-xs font-semibold text-white tracking-wide">
              {isEmail ? 'Gmail Send Confirmation' : 'Google Calendar & Meet Scheduling'}
            </h4>
            <div className="flex items-center gap-1.5 text-[10px] text-white/50">
              <ShieldCheck className="h-3 w-3 text-emerald-400" />
              <span>Workspace Action Approval Required</span>
            </div>
          </div>
        </div>

        <span className="rounded-full border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 text-[10px] font-medium text-amber-200">
          Demo Mode · Action Verification
        </span>
      </div>

      {/* Content Details */}
      <div className="space-y-2.5 p-4 text-xs">
        {isEmail && (
          <>
            <div className="flex items-start gap-2">
              <span className="w-16 shrink-0 text-white/40 font-medium">To:</span>
              <span className="font-mono text-cyan-300 font-medium break-all">{proposal.args.to}</span>
            </div>
            {proposal.args.cc && (
              <div className="flex items-start gap-2">
                <span className="w-16 shrink-0 text-white/40 font-medium">CC:</span>
                <span className="font-mono text-white/75">{proposal.args.cc}</span>
              </div>
            )}
            <div className="flex items-start gap-2">
              <span className="w-16 shrink-0 text-white/40 font-medium">Subject:</span>
              <span className="font-semibold text-white/90">{proposal.args.subject}</span>
            </div>
            <div className="rounded-lg border border-white/10 bg-black/25 p-3 text-white/80 whitespace-pre-wrap font-sans leading-relaxed">
              {proposal.args.body}
            </div>
          </>
        )}

        {isCalendar && (
          <>
            <div className="flex items-start gap-2">
              <span className="w-20 shrink-0 text-white/40 font-medium">Event:</span>
              <span className="font-semibold text-white text-sm">
                {proposal.args.summary || proposal.args.title}
              </span>
            </div>
            {formattedStart && (
              <div className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-white/40 font-medium">When:</span>
                <span className="inline-flex items-center gap-1.5 text-emerald-300 font-medium">
                  <Clock className="h-3.5 w-3.5" />
                  {formattedStart}
                </span>
              </div>
            )}
            {attendeesList && (
              <div className="flex items-start gap-2">
                <span className="w-20 shrink-0 text-white/40 font-medium">Attendees:</span>
                <span className="inline-flex items-center gap-1.5 text-white/80">
                  <Users className="h-3.5 w-3.5 text-white/40" />
                  {attendeesList}
                </span>
              </div>
            )}
            {proposal.args.description && (
              <div className="flex items-start gap-2">
                <span className="w-20 shrink-0 text-white/40 font-medium">Agenda:</span>
                <span className="text-white/70 italic">{proposal.args.description}</span>
              </div>
            )}
            <div className="flex items-center gap-2 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-emerald-200">
              <Video className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-[11px]">Google Meet video conference will be generated upon confirmation</span>
            </div>
          </>
        )}
      </div>

      {/* Footer / Actions */}
      <div className="border-t border-white/10 bg-white/[0.02] px-4 py-3">
        {proposal.status === 'pending' && (
          <div className="flex items-center justify-end gap-2.5">
            <button
              onClick={handleCancel}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white/70 hover:bg-white/10 hover:text-white transition disabled:opacity-50"
            >
              <XCircle className="h-3.5 w-3.5 text-red-400" />
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition disabled:opacity-50"
            >
              {isProcessing ? (
                <>
                  <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Processing...
                </>
              ) : isEmail ? (
                <>
                  <Send className="h-3.5 w-3.5" />
                  Confirm & Send Email
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Confirm & Schedule Event
                </>
              )}
            </button>
          </div>
        )}

        {proposal.status === 'confirmed' && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>
                {isEmail ? 'Email Dispatched Successfully' : 'Event & Google Meet Confirmed'}
              </span>
            </div>
            {proposal.result?.meet_link && (
              <div className="flex items-center justify-between rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-2.5">
                <div className="flex items-center gap-2">
                  <Video className="h-4 w-4 text-emerald-400" />
                  <span className="font-mono text-xs text-white break-all">
                    {proposal.result.meet_link}
                  </span>
                </div>
                <a
                  href={proposal.result.meet_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-md bg-emerald-500/30 px-2.5 py-1 text-[11px] font-medium text-emerald-200 hover:bg-emerald-500/50 transition"
                >
                  Join Meet
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}
            <p className="text-[11px] text-white/40">
              {proposal.result?.message || 'Recorded in workspace history.'}
            </p>
          </div>
        )}

        {proposal.status === 'cancelled' && (
          <div className="flex items-center gap-2 text-xs font-medium text-red-400">
            <XCircle className="h-4 w-4" />
            <span>Action was cancelled. No changes made.</span>
          </div>
        )}
      </div>
    </div>
  );
}
