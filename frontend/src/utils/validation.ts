/**
 * Minimal form validation. A rule looks at one value (plus the whole form, for
 * cross-field rules) and returns the message to show, or `undefined` when the
 * value is fine. `validate` runs every rule in the set, so a form reports all
 * of its problems in one pass instead of one per submit.
 */
export type FormValues = Record<string, string>;

export type Rule = (value: string, values: FormValues) => string | undefined;

export type RuleSet = Record<string, Rule>;

export type FormErrors = Record<string, string | undefined>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** Runs the rules in order and reports the first failure. */
export const all =
  (...rules: Rule[]): Rule =>
  (value, values) => {
    for (const rule of rules) {
      const message = rule(value, values);
      if (message) {
        return message;
      }
    }
    return undefined;
  };

export const required =
  (label: string): Rule =>
  (value) =>
    value.trim() ? undefined : `${label} is required.`;

export const email = (): Rule => (value) => {
  if (!value.trim()) {
    return undefined;
  }
  return EMAIL_PATTERN.test(value.trim())
    ? undefined
    : 'Enter a valid email address.';
};

export const minLength =
  (label: string, min: number): Rule =>
  (value) =>
    value.length < min ? `${label} must be at least ${min} characters long.` : undefined;

/** Compares against another field, for confirmation inputs. */
export const matches =
  (label: string, pick: (values: FormValues) => string): Rule =>
  (value, values) =>
    value === pick(values) ? undefined : `${label} do not match.`;

export const validate = (
  values: FormValues,
  rules: RuleSet,
): FormErrors => {
  const errors: FormErrors = {};
  for (const [name, rule] of Object.entries(rules)) {
    const message = rule(values[name] ?? '', values);
    if (message) {
      errors[name] = message;
    }
  }
  return errors;
};
