import { labelClasses, errorClasses } from "./formStyles";

interface FormFieldProps {
  label: string;
  htmlFor: string;
  error?: string;
  optional?: boolean;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}

/** Envuelve label + control + mensaje de error/ayuda con el mismo layout en todos los formularios. */
export function FormField({
  label,
  htmlFor,
  error,
  optional,
  hint,
  className,
  children,
}: FormFieldProps) {
  return (
    <div className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <label htmlFor={htmlFor} className={labelClasses}>
        {label} {optional && <span className="text-text-muted">(opcional)</span>}
      </label>
      {children}
      {error ? (
        <p className={errorClasses}>{error}</p>
      ) : hint ? (
        <p className="text-xs text-text-muted">{hint}</p>
      ) : null}
    </div>
  );
}
