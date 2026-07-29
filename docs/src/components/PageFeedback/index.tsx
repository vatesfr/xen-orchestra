import React, {useEffect, useRef, useState} from 'react';
import {useLocation} from '@docusaurus/router';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './styles.module.css';

type FormbricksConfig = {
  apiHost: string;
  environmentId: string;
  surveyId: string;
};

// Labels must match the choice labels of the "XO Docs page feedback" survey in Formbricks.
const REASONS = [
  'Outdated',
  'Unclear or confusing',
  'Missing information',
  'Inaccurate',
];

type Step = 'vote' | 'why' | 'done';

// Mirror feedback into Matomo (when tracking is enabled) so quality
// signals can be crossed with traffic data, e.g. thumbs-down per view.
const trackFeedbackEvent = (action: string, page: string) => {
  window._paq?.push(['trackEvent', 'doc_feedback', action, page]);
};

export default function PageFeedback(): React.ReactElement | null {
  const {siteConfig} = useDocusaurusContext();
  const formbricks = siteConfig.customFields?.formbricks as FormbricksConfig;
  const {pathname} = useLocation();

  const [step, setStep] = useState<Step>('vote');
  const [reasons, setReasons] = useState<string[]>([]);
  const [details, setDetails] = useState('');
  const [sending, setSending] = useState(false);
  const responseId = useRef<string | null>(null);
  const votePending = useRef<Promise<void> | null>(null);

  // A client-side navigation lands on a new page: reset the widget.
  useEffect(() => {
    setStep('vote');
    setReasons([]);
    setDetails('');
    responseId.current = null;
    votePending.current = null;
  }, [pathname]);

  const responseData = (vote: 'Yes' | 'No') => ({
    vote,
    page: pathname,
    ...(reasons.length > 0 ? {reason: reasons} : {}),
    ...(details.trim() ? {details: details.trim()} : {}),
  });

  const send = async (
    method: 'POST' | 'PUT',
    vote: 'Yes' | 'No',
    finished: boolean,
  ) => {
    const base = `${formbricks.apiHost}/api/v1/client/${formbricks.environmentId}/responses`;
    const url = method === 'PUT' ? `${base}/${responseId.current}` : base;
    try {
      const res = await fetch(url, {
        method,
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          ...(method === 'POST'
            ? {surveyId: formbricks.surveyId, meta: {url: window.location.href}}
            : {}),
          finished,
          data: responseData(vote),
        }),
      });
      if (method === 'POST' && res.ok) {
        const json = await res.json();
        responseId.current = json?.data?.id ?? null;
      }
    } catch {
      // Feedback must never break the docs. Votes lost to network
      // errors or blockers are acceptable.
    }
  };

  const vote = (value: 'Yes' | 'No') => {
    setStep(value === 'Yes' ? 'done' : 'why');
    trackFeedbackEvent(value === 'Yes' ? 'up' : 'down', pathname);
    // Record the vote right away so it is kept even if the visitor
    // leaves without answering the follow-up.
    votePending.current = send('POST', value, value === 'Yes');
  };

  const submitWhy = async () => {
    setSending(true);
    reasons.forEach((reason) => trackFeedbackEvent(`reason:${reason}`, pathname));
    // Wait for the initial vote POST so we update its response instead
    // of creating a duplicate when the visitor answers quickly.
    await votePending.current;
    await send(responseId.current ? 'PUT' : 'POST', 'No', true);
    setSending(false);
    setStep('done');
  };

  const toggleReason = (reason: string) =>
    setReasons((prev) =>
      prev.includes(reason)
        ? prev.filter((r) => r !== reason)
        : [...prev, reason],
    );

  if (!formbricks?.environmentId) {
    return null;
  }

  return (
    <div className={styles.feedback}>
      {step === 'vote' && (
        <div className={styles.voteRow}>
          <span className={styles.question}>Was this page helpful?</span>
          <button
            type="button"
            className={styles.voteButton}
            onClick={() => vote('Yes')}>
            <ThumbIcon /> Yes
          </button>
          <button
            type="button"
            className={styles.voteButton}
            onClick={() => vote('No')}>
            <ThumbIcon down /> No
          </button>
        </div>
      )}

      {step === 'why' && (
        <div className={styles.why}>
          <span className={styles.question}>
            Sorry about that. What was the problem?
          </span>
          <div className={styles.reasons}>
            {REASONS.map((reason) => (
              <button
                key={reason}
                type="button"
                className={styles.reason}
                aria-pressed={reasons.includes(reason)}
                onClick={() => toggleReason(reason)}>
                {reason}
              </button>
            ))}
          </div>
          <textarea
            className={styles.details}
            aria-label="Additional details"
            rows={3}
            placeholder="Tell us what's wrong or missing... (optional)"
            value={details}
            onChange={(e) => setDetails(e.target.value)}
          />
          <div className={styles.actions}>
            <button
              type="button"
              className={styles.submit}
              disabled={sending}
              onClick={submitWhy}>
              Send
            </button>
            <button
              type="button"
              className={styles.skip}
              onClick={() => setStep('done')}>
              Skip
            </button>
          </div>
        </div>
      )}

      {step === 'done' && (
        <span className={styles.thanks}>Thanks for your feedback!</span>
      )}
    </div>
  );
}

function ThumbIcon({down = false}: {down?: boolean}) {
  return (
    <svg
      className={down ? styles.thumbDown : undefined}
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true">
      <path d="M7 10v12" />
      <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </svg>
  );
}
