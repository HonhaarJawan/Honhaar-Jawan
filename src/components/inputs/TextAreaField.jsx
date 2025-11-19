import React from "react";

const TextAreaField = ({
  placeholder = "",
  className = "",
  value,
  onChange,
  name,
  required = false,
  label = "",
  rows = 4,  // default rows
}) => {
  // Define classes for label & textarea for light mode
  const labelClasses = `mb-1 text-sm md:text-base font-medium text-zinc-800`;
  const textareaClasses = `
    w-full
    input input-md input-outline-zinc-600
  `;

  // Combine computed classes with user-provided className
  const finalLabelClass = labelClasses.trim();
  const finalTextAreaClass = `${textareaClasses} ${className}`.trim();

  return (
    <div className="flex flex-col items-start">
      {label && (
        <label htmlFor={name} className={finalLabelClass}>
          {label}
        </label>
      )}
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        rows={rows}
        className={finalTextAreaClass}
      />
    </div>
  );
};

export default TextAreaField;
