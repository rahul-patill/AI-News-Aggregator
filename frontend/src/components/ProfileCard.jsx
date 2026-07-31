export function ProfileCard({ profile }) {
  if (!profile) return null

  return (
    <div className="relative rounded-2xl border border-glass-border bg-surface/60 backdrop-blur-md p-7 mb-10 shadow-[0_1px_40px_rgba(129,140,248,0.04)]">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4 mb-5">
        <div>
          <p className="text-[0.65rem] font-semibold tracking-[0.14em] uppercase text-accent mb-2">
            Curator profile
          </p>
          <h2 className="font-display text-xl font-bold text-text-primary leading-tight">
            {profile.name}
          </h2>
          <p className="text-sm text-text-secondary mt-1">{profile.title}</p>
        </div>
        <span className="shrink-0 text-[0.65rem] font-semibold tracking-wider uppercase text-accent bg-accent-soft px-3 py-1.5 rounded-full border border-accent/15">
          {profile.expertise_level}
        </span>
      </div>

      {/* Bio */}
      <p className="text-[0.85rem] text-text-secondary leading-relaxed mb-5">
        {profile.background}
      </p>

      {/* Interests */}
      {profile.interests && profile.interests.length > 0 && (
        <div className="mb-5">
          <p className="text-[0.65rem] font-semibold text-text-tertiary uppercase tracking-[0.14em] mb-2.5">
            Tracking
          </p>
          <div className="flex flex-wrap gap-2">
            {profile.interests.map((interest) => (
              <span
                key={interest}
                className="text-[0.75rem] px-3 py-1.5 rounded-lg bg-elevated/80 text-text-secondary border border-glass-border hover:border-border-hover hover:text-text-primary transition-all duration-200 cursor-default"
              >
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="pt-4 border-t border-glass-border">
        <p className="text-[0.75rem] text-text-tertiary leading-relaxed">
          <span className="italic">This is a static profile used to rank articles without consuming API tokens per visitor.</span>{' '}
          To customize, edit{' '}
          <code className="text-accent/60 not-italic font-medium bg-accent-soft/50 px-1.5 py-0.5 rounded text-[0.7rem]">
            user_profile.py
          </code>
        </p>
      </div>
    </div>
  )
}
