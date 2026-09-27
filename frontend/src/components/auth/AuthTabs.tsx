export type AuthMode = 'login' | 'register';

const tabs: { id: AuthMode; label: string }[] = [
  { id: 'login', label: 'Sign In' },
  { id: 'register', label: 'Create Account' },
];

type AuthTabsProps = {
  active: AuthMode;
  onChange: (mode: AuthMode) => void;
};

export const AuthTabs = ({ active, onChange }: AuthTabsProps) => {
  return (
    <div className="grid grid-cols-2" role="tablist">
      {tabs.map((tab) => {
        const isActive = tab.id === active;

        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`auth-tab-${tab.id}`}
            aria-selected={isActive}
            aria-controls="auth-panel"
            onClick={() => onChange(tab.id)}
            className={`border-b-2 pb-2.5 text-[15px] font-medium transition-colors text-center ${
              isActive
                ? 'border-navy text-navy font-bold'
                : 'border-transparent text-idle hover:text-navy font-bold'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
