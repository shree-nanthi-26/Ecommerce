import { useMemo } from "react";
import { FiCheck, FiX, FiShield } from "react-icons/fi";

export default function PasswordStrengthMeter({ password = "", isAdmin = false }) {
  const analysis = useMemo(() => {
    const minLength = isAdmin ? 10 : 8;
    const checks = [
      {
        id: "length",
        label: isAdmin ? "At least 10 characters (Admin requirement)" : "At least 8 characters",
        met: password.length >= minLength,
      },
      {
        id: "uppercase",
        label: "At least one uppercase letter (A-Z)",
        met: /[A-Z]/.test(password),
      },
      {
        id: "lowercase",
        label: "At least one lowercase letter (a-z)",
        met: /[a-z]/.test(password),
      },
      {
        id: "number",
        label: "At least one number (0-9)",
        met: /[0-9]/.test(password),
      },
      {
        id: "special",
        label: "At least one special character (!@#$%^&*)",
        met: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?~`]/.test(password),
      },
    ];

    const metCount = checks.filter((c) => c.met).length;
    let score = (metCount / checks.length) * 100;
    if (password.length >= 12 && metCount === checks.length) score = 100;

    let level = "Weak";
    let color = "#EF4444"; // red
    let bg = "bg-rose-500";

    if (metCount === 5) {
      level = "Strong";
      color = "#10B981"; // green
      bg = "bg-emerald-500";
    } else if (metCount >= 4) {
      level = "Good";
      color = "#3B82F6"; // blue
      bg = "bg-blue-500";
    } else if (metCount >= 2) {
      level = "Fair";
      color = "#F59E0B"; // amber
      bg = "bg-amber-500";
    }

    return {
      checks,
      score,
      level,
      color,
      bg,
      isValid: metCount === 5,
    };
  }, [password, isAdmin]);

  if (!password) {
    return (
      <div className="mt-2 text-xs text-[var(--color-muted)] flex items-center gap-1.5">
        <FiShield size={13} />
        <span>Use 8+ characters with uppercase, lowercase, numbers & symbols.</span>
      </div>
    );
  }

  return (
    <div className="mt-2.5 space-y-2 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-alt)]/50">
      {/* Strength Bar */}
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-[var(--color-muted)]">Password Strength:</span>
        <span style={{ color: analysis.color }}>{analysis.level}</span>
      </div>

      <div className="h-1.5 w-full bg-[var(--color-border)] rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-300 ${analysis.bg}`}
          style={{ width: `${analysis.score}%` }}
        />
      </div>

      {/* Rules checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 text-[11px]">
        {analysis.checks.map((check) => (
          <div
            key={check.id}
            className={`flex items-center gap-1.5 ${
              check.met
                ? "text-emerald-600 dark:text-emerald-400 font-medium"
                : "text-[var(--color-muted)]"
            }`}
          >
            {check.met ? (
              <FiCheck size={12} className="text-emerald-500 flex-shrink-0" />
            ) : (
              <FiX size={12} className="opacity-40 flex-shrink-0" />
            )}
            <span>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
