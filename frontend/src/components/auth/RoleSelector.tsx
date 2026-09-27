export type AuthRole = 'employee' | 'admin';

const roles: { id: AuthRole; title: string; caption: string }[] = [
  { id: 'employee', title: 'Employee', caption: 'Personal workspace' },
  { id: 'admin', title: 'Admin', caption: 'Organization management' },
];

const CheckIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={3}
    strokeLinecap="round"
    strokeLinejoin="round"
    className="h-4 w-4 shrink-0 text-navy"
    aria-hidden="true"
  >
    <path d="m4.5 12.5 5 5 10-11" />
  </svg>
);

type RoleSelectorProps = {
  value: AuthRole;
  onChange: (role: AuthRole) => void;
};

export const RoleSelector = ({ value, onChange }: RoleSelectorProps) => {
  return (
    <div>
      <p className="text-sm font-medium text-label">Continue as</p>
      <div className="mt-2 grid grid-cols-2 gap-4" role="radiogroup">
        {roles.map((role) => {
          const isSelected = role.id === value;

          return (
            <button
              key={role.id}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(role.id)}
              className={`rounded border px-4 pb-3 pt-3.5 text-left transition-colors ${
                isSelected
                  ? 'border-navy bg-tint'
                  : 'border-hairline bg-white hover:border-idle'
              }`}
            >
              <span className="flex items-center justify-between gap-2">
                <span className="text-sm font-semibold text-ink">{role.title}</span>
                {isSelected && <CheckIcon />}
              </span>
              <span className="mt-1 block text-xs text-muted">{role.caption}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
